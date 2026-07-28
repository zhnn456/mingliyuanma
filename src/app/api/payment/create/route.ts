import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { createPaymentService, generateOrderNo, MEMBERSHIP_PLANS, PaymentMethod } from '@/lib/payment';
import { requireAuth, getClientIP, checkIPRateLimit, sanitizeString } from '@/lib/security';
import { auditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAuth();
    if (!allowed || !session) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    // 速率限制
    const ip = getClientIP(req);
    const rateLimit = checkIPRateLimit(ip, 10, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: '操作过于频繁' }, { status: 429 });
    }

    const body = await req.json();
    const { type, targetId, method } = body;

    // 验证支付方式
    const paymentMethod = (['wechat', 'alipay', 'mock'].includes(method) ? method : 'mock') as PaymentMethod;

    let amount = 0;
    let title = '';
    let targetType = '';
    let days: number | null = null;
    let level = '';

    if (type === 'membership') {
      // 会员套餐支付
      const plan = MEMBERSHIP_PLANS.find((p) => p.level === targetId);
      if (!plan) {
        return NextResponse.json({ error: '无效的会员套餐' }, { status: 400 });
      }
      amount = plan.price;
      title = `命理网${plan.name}`;
      targetType = 'membership';
      days = plan.durationDays;
      level = plan.level;
    } else if (type === 'offering') {
      // 供奉支付
      const item = await prisma.offeringItem.findUnique({
        where: { id: targetId },
      });
      if (!item) {
        return NextResponse.json({ error: '无效的供奉项目' }, { status: 400 });
      }
      const offerType = sanitizeString(body.offerType || 'single');
      amount = offerType === 'monthly' ? (item.priceMonth || 0) :
               offerType === 'yearly' ? (item.priceYear || 0) :
               (item.priceSingle || 0);
      title = `供奉 - ${item.name}`;
      targetType = 'offering';
    } else if (type === 'pdf_report') {
      // PDF报告购买
      amount = 9.9; // 单次报告价格
      title = '命理报告PDF';
      targetType = 'pdf_report';
    } else {
      return NextResponse.json({ error: '无效的订单类型' }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: '支付金额异常' }, { status: 400 });
    }

    // 生成订单号
    const orderNo = generateOrderNo();
    const userId = (session.user as any).id;

    // 创建订单
    const order = await prisma.order.create({
      data: {
        orderNo,
        userId,
        type: targetType,
        targetId: targetId || null,
        amount,
        status: 'pending',
        paymentMethod: paymentMethod,
      },
    });

    // 创建支付
    const paymentService = createPaymentService();
    const result = await paymentService.createOrder({
      orderNo,
      amount,
      title,
      description: title,
      method: paymentMethod,
      userId,
      targetType: targetType as any,
      targetId,
      returnUrl: body.returnUrl,
    });

    // 审计日志
    await auditLog({
      userId,
      action: 'order_create',
      ip,
      details: { orderNo, amount, type: targetType, method: paymentMethod },
      status: 'success',
    });

    return NextResponse.json({
      order: {
        id: order.id,
        orderNo: order.orderNo,
        amount: order.amount,
        status: order.status,
        type: order.type,
      },
      payment: result,
    });
  } catch (error) {
    console.error('创建支付订单失败:', error);
    return NextResponse.json({ error: '创建订单失败' }, { status: 500 });
  }
}
