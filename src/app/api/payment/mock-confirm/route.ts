import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/security';
import { MEMBERSHIP_PLANS } from '@/lib/payment';
import { auditLog } from '@/lib/audit';

/**
 * Mock 支付确认（开发环境模拟支付成功）
 * 生产环境应删除此接口
 */
export async function POST(req: NextRequest) {
  try {
    // 仅在开发环境启用
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_MOCK_PAY !== 'true') {
      return NextResponse.json({ error: '此接口仅在开发环境可用' }, { status: 403 });
    }

    const { allowed, session } = await requireAuth();
    if (!allowed || !session) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const body = await req.json();
    const { orderNo } = body;

    if (!orderNo) {
      return NextResponse.json({ error: '缺少订单号' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { orderNo },
    });

    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 });
    }

    if (order.userId !== (session.user as any).id) {
      return NextResponse.json({ error: '无权操作此订单' }, { status: 403 });
    }

    if (order.status === 'paid') {
      return NextResponse.json({ message: '订单已支付' });
    }

    // 模拟支付回调
    const transactionId = `mock_tx_${Date.now()}`;

    // 用事务包裹所有写操作
    await prisma.$transaction(async (tx) => {
      // 更新订单
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'paid',
          transactionId,
          paidAt: new Date(),
        },
      });

      // 创建支付记录
      await tx.payment.create({
        data: {
          orderId: order.id,
          userId: order.userId,
          method: 'mock',
          amount: order.amount,
          status: 'success',
          transactionId,
          paidAt: new Date(),
        },
      });

      // 处理业务逻辑
      if (order.type === 'membership') {
        const plan = MEMBERSHIP_PLANS.find((p) => p.level === order.targetId);
        const days = plan?.durationDays ?? 30;
        const expiry = days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;

        await tx.user.update({
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
        const [itemId, offerType] = (order.targetId || '').split(':::');
        await tx.offeringRecord.create({
          data: {
            userId: order.userId,
            itemId: itemId || order.targetId || '',
            amount: order.amount,
            type: offerType || 'single',
            status: 'active',
          },
        });

        await auditLog({
          userId: order.userId,
          action: 'offering_create',
          details: { orderNo: order.orderNo, targetId: order.targetId },
          status: 'success',
        });
      }
    });

    await auditLog({
      userId: order.userId,
      action: 'order_pay',
      details: { orderNo: order.orderNo, amount: order.amount, method: 'mock' },
      status: 'success',
    });

    return NextResponse.json({
      message: '支付成功',
      order: {
        orderNo: order.orderNo,
        amount: order.amount,
        status: 'paid',
        type: order.type,
      },
    });
  } catch (error) {
    console.error('Mock支付失败:', error);
    return NextResponse.json({ error: '支付失败' }, { status: 500 });
  }
}
