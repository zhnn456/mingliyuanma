import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { queryFirst, batch, execute } from '@/lib/d1';
import { createPaymentService } from '@/lib/payment';
import { auditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed || !session) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const { orderNo, reason } = await req.json();
    if (!orderNo) {
      return NextResponse.json({ error: '缺少订单号' }, { status: 400 });
    }

    const order = await queryFirst(
      'SELECT * FROM "Order" WHERE orderNo = ?',
      orderNo
    ) as any;

    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 });
    }

    if (order.status !== 'paid') {
      return NextResponse.json({ error: '订单状态不支持退款' }, { status: 400 });
    }

    const paymentService = await createPaymentService();
    const refundResult = await paymentService.refund(
      order.orderNo,
      order.amount,
      order.paymentMethod,
      reason
    );

    if (!refundResult.success) {
      await auditLog({
        userId: order.userId,
        action: 'order_refund',
        details: { orderNo: order.orderNo, amount: order.amount, reason, error: '退款接口失败' },
        status: 'failed',
      });
      return NextResponse.json({ error: '退款失败' }, { status: 500 });
    }

    const now = new Date().toISOString();
    const refundNo = `RF${Date.now()}`;

    await batch([
      {
        sql: 'UPDATE "Order" SET status = ?, updatedAt = ? WHERE id = ?',
        params: ['refunded', now, order.id],
      },
      {
        sql: 'INSERT INTO Payment (id, orderId, userId, method, amount, status, transactionId, paidAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        params: [
          `pay_refund_${Date.now()}`,
          order.id,
          order.userId,
          order.paymentMethod,
          order.amount,
          'refund',
          refundResult.refundId || refundNo,
          now,
          now,
        ],
      },
    ]);

    await auditLog({
      userId: order.userId,
      action: 'order_refund',
      details: {
        orderNo: order.orderNo,
        amount: order.amount,
        reason,
        refundId: refundResult.refundId,
        refundNo,
        operatorId: session.sub,
      },
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      orderNo: order.orderNo,
      refundId: refundResult.refundId,
      refundNo,
    });
  } catch (error: any) {
    console.error('退款处理失败:', error?.message);
    return NextResponse.json({ error: '退款处理失败' }, { status: 500 });
  }
}
