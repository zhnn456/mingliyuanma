import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, execute, batch } from '@/lib/d1';
import { getSession } from '@/lib/auth-server';
import { MEMBERSHIP_PLANS } from '@/lib/payment';
import { auditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_MOCK_PAY !== 'true') {
      return NextResponse.json({ error: '此接口仅在开发环境可用' }, { status: 403 });
    }

    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const body = await req.json();
    const { orderNo } = body;
    if (!orderNo) return NextResponse.json({ error: '缺少订单号' }, { status: 400 });

    const order = await queryFirst('SELECT * FROM "Order" WHERE orderNo = ?', orderNo) as any;
    if (!order) return NextResponse.json({ error: '订单不存在' }, { status: 404 });
    if (order.userId !== session.user.id) return NextResponse.json({ error: '无权操作此订单' }, { status: 403 });
    if (order.status === 'paid') return NextResponse.json({ message: '订单已支付' });

    const transactionId = `mock_tx_${Date.now()}`;
    const now = new Date().toISOString();

    const batchStatements: Array<{ sql: string; params?: any[] }> = [
      {
        sql: 'UPDATE "Order" SET status = ?, transactionId = ?, paidAt = ?, updatedAt = ? WHERE id = ?',
        params: ['paid', transactionId, now, now, order.id],
      },
      {
        sql: 'INSERT INTO Payment (id, orderId, userId, method, amount, status, transactionId, paidAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        params: [`pay_${Date.now()}`, order.id, order.userId, 'mock', order.amount, 'success', transactionId, now, now],
      },
    ];

    if (order.type === 'membership') {
      const plan = MEMBERSHIP_PLANS.find((p) => p.level === order.targetId);
      const days = plan?.durationDays ?? 30;
      const expiry = days ? new Date(Date.now() + days * 86400000).toISOString() : null;

      batchStatements.push({
        sql: 'UPDATE User SET memberLevel = ?, memberExpiry = ?, updatedAt = ? WHERE id = ?',
        params: [order.targetId || 'monthly', expiry, now, order.userId],
      });

      await auditLog({
        userId: order.userId,
        action: 'member_upgrade',
        details: { level: order.targetId, orderNo: order.orderNo },
        status: 'success',
      });
    } else if (order.type === 'offering') {
      const [itemId, offerType] = (order.targetId || '').split(':::');
      batchStatements.push({
        sql: 'INSERT INTO OfferingRecord (id, userId, itemId, amount, type, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        params: [`off_${Date.now()}`, order.userId, itemId || order.targetId || '', order.amount, offerType || 'single', 'completed', now],
      });

      await auditLog({
        userId: order.userId,
        action: 'offering_create',
        details: { orderNo: order.orderNo, targetId: order.targetId },
        status: 'success',
      });
    }

    await batch(batchStatements);

    await auditLog({
      userId: order.userId,
      action: 'order_pay',
      details: { orderNo: order.orderNo, amount: order.amount, method: 'mock' },
      status: 'success',
    });

    return NextResponse.json({
      message: '支付成功',
      order: { orderNo: order.orderNo, amount: order.amount, status: 'paid', type: order.type },
    });
  } catch (error: any) {
    console.error('Mock支付失败:', error?.message);
    return NextResponse.json({ error: '支付失败' }, { status: 500 });
  }
}
