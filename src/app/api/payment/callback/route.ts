import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createPaymentService } from '@/lib/payment';
import { auditLog } from '@/lib/audit';

/**
 * 支付回调统一入口
 * 路径: /api/payment/callback?method=wechat|alipay
 */
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const method = searchParams.get('method') || 'mock';

    const rawBody = await req.text();
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const paymentService = createPaymentService();
    const result = await paymentService.handleCallback(method as any, rawBody, headers);

    if (!result.success) {
      return NextResponse.json({ code: 'FAIL', message: '支付验证失败' }, { status: 400 });
    }

    // 查找订单
    const order = await prisma.order.findUnique({
      where: { orderNo: result.orderNo },
    });

    if (!order) {
      console.error('回调订单不存在:', result.orderNo);
      return NextResponse.json({ code: 'FAIL', message: '订单不存在' }, { status: 404 });
    }

    // 验证金额
    if (Math.abs(order.amount - result.amount) > 0.01) {
      console.error('回调金额不匹配:', order.amount, result.amount);
      return NextResponse.json({ code: 'FAIL', message: '金额不匹配' }, { status: 400 });
    }

    // 幂等处理：已支付则直接返回成功
    if (order.status === 'paid') {
      return NextResponse.json({ code: 'SUCCESS', message: '成功' });
    }

    // 更新订单状态
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'paid',
        transactionId: result.transactionId,
        paidAt: new Date(),
      },
    });

    // 创建支付记录
    await prisma.payment.create({
      data: {
        orderId: order.id,
        userId: order.userId,
        method: result.method,
        amount: order.amount,
        status: 'success',
        transactionId: result.transactionId,
        paidAt: new Date(),
      },
    });

    // 根据订单类型处理业务逻辑
    if (order.type === 'membership') {
      // 更新会员等级
      const planDays: Record<string, number | null> = {
        monthly: 30,
        yearly: 365,
        lifetime: null,
      };
      const days = planDays[order.targetId || ''] ?? 30;
      const expiry = days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;

      await prisma.user.update({
        where: { id: order.userId },
        data: {
          memberLevel: order.targetId || 'monthly',
          memberExpiry: expiry,
        },
      });

      await auditLog({
        userId: order.userId,
        action: 'member_upgrade',
        details: { level: order.targetId, orderNo: order.orderNo },
        status: 'success',
      });
    } else if (order.type === 'offering') {
      // 更新供奉记录
      await auditLog({
        userId: order.userId,
        action: 'offering_create',
        details: { orderNo: order.orderNo, targetId: order.targetId },
        status: 'success',
      });
    }

    await auditLog({
      userId: order.userId,
      action: 'order_pay',
      details: { orderNo: order.orderNo, amount: order.amount, method: result.method },
      status: 'success',
    });

    // 返回成功响应（微信需要返回特定格式）
    if (method === 'wechat') {
      return NextResponse.json({
        return_code: 'SUCCESS',
        return_msg: 'OK',
      });
    }

    return NextResponse.json({ code: 'SUCCESS', message: '成功' });
  } catch (error) {
    console.error('支付回调处理失败:', error);
    return NextResponse.json({ code: 'FAIL', message: '处理失败' }, { status: 500 });
  }
}
