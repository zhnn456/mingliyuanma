import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, execute, batch, addPoints } from '@/lib/d1';
import { requireAuth } from '@/lib/auth-server';
import { MEMBERSHIP_PLANS } from '@/lib/payment';
import { auditLog } from '@/lib/audit';
import { PACKAGE_POINTS } from '@/lib/recharge-packages';

export async function POST(req: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_MOCK_PAY !== 'true') {
      return NextResponse.json({ error: '此接口仅在开发环境可用' }, { status: 403 });
    }

    const { allowed, session } = await requireAuth(req);
    if (!allowed || !session) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const body = await req.json();
    const { orderNo } = body;
    if (!orderNo) return NextResponse.json({ error: '缺少订单号' }, { status: 400 });

    const order = await queryFirst('SELECT * FROM "Order" WHERE orderNo = ?', orderNo) as any;
    if (!order) return NextResponse.json({ error: '订单不存在' }, { status: 404 });
    if (order.userId !== session.sub) return NextResponse.json({ error: '无权操作此订单' }, { status: 403 });
    if (order.status === 'paid') return NextResponse.json({ message: '订单已支付' });

    const transactionId = `mock_tx_${Date.now()}`;
    const now = new Date().toISOString();

    const batchStatements: Array<{ sql: string; params?: any[] }> = [
      {
        sql: 'UPDATE "Order" SET status = ?, transactionId = ?, paidAt = ?, updatedAt = ? WHERE id = ?',
        params: ['paid', transactionId, now, now, order.id],
      },
      {
        sql: 'INSERT INTO Payment (id, orderId, userId, method, amount, status, transactionId, paidAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        params: [`pay_${Date.now()}`, order.id, order.userId, 'mock', order.amount, 'success', transactionId, now, now, now],
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
    } else if (order.type === 'recharge') {
      // 充值积分到账（mock-confirm 在 batch 之外单独处理，因为 addPoints 内部已含原子 upsert + 流水）
      const points = PACKAGE_POINTS[order.targetId] || 0;
      if (points > 0) {
        // 先提交订单/支付记录的批次
        await batch(batchStatements);
        // 再发放积分（addPoints 已封装为原子操作）
        await addPoints(order.userId, points, 'recharge', `充值${points}积分（订单${order.orderNo}）`);

        await auditLog({
          userId: order.userId,
          action: 'recharge_success',
          details: { orderNo: order.orderNo, points, amount: order.amount, method: 'mock' },
          status: 'success',
        });

        return NextResponse.json({
          message: '支付成功',
          order: { orderNo: order.orderNo, amount: order.amount, status: 'paid', type: order.type },
          points,
        });
      }
    }

    await batch(batchStatements);

    // 分润处理 - 用户消费时自动分润给代理商
    try {
      const { processCommission } = await import('@/lib/commission-engine');
      await processCommission(order.id, order.userId, order.amount);
    } catch (err) {
      console.error('分润处理失败:', err);
    }

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
