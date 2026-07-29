import { NextRequest, NextResponse } from 'next/server';
import { queryFirst } from '@/lib/d1';
import { getSession } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const orderNo = searchParams.get('orderNo');
    if (!orderNo) return NextResponse.json({ error: '缺少订单号' }, { status: 400 });

    const order = await queryFirst(
      'SELECT * FROM "Order" WHERE orderNo = ?',
      orderNo
    ) as any;

    if (!order) return NextResponse.json({ error: '订单不存在' }, { status: 404 });

    if (order.userId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: '无权查看此订单' }, { status: 403 });
    }

    const payment = await queryFirst(
      'SELECT * FROM Payment WHERE orderId = ?',
      order.id
    ) as any;

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
  } catch (error: any) {
    console.error('查询订单状态失败:', error?.message);
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }
}
