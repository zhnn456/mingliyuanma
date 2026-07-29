import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/security';

/**
 * 查询订单支付状态
 */
export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAuth();
    if (!allowed || !session) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orderNo = searchParams.get('orderNo');

    if (!orderNo) {
      return NextResponse.json({ error: '缺少订单号' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { orderNo },
    });

    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 });
    }

    // 普通用户只能查看自己的订单
    if (order.userId !== (session.user as any).id && (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: '无权查看此订单' }, { status: 403 });
    }

    // 单独查询支付记录
    const payment = await prisma.payment.findUnique({
      where: { orderId: order.id },
    });

    return NextResponse.json({
      order: {
        orderNo: order.orderNo,
        amount: order.amount,
        status: order.status,
        type: order.type,
        targetId: order.targetId,
        paymentMethod: order.paymentMethod,
        paidAt: order.paidAt,
        createdAt: order.createdAt,
        payment: payment ? {
          method: payment.method,
          transactionId: payment.transactionId,
          status: payment.status,
        } : null,
      },
    });
  } catch (error) {
    console.error('查询订单状态失败:', error);
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }
}
