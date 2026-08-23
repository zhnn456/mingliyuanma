import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, batch } from '@/lib/d1';
import { createPaymentService, MEMBERSHIP_PLANS } from '@/lib/payment';
import { auditLog } from '@/lib/audit';
import { grantLingzhu, MEMBERSHIP_GIFT_LINGZHU } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const paymentService = await createPaymentService();
    const result = await paymentService.handleCallback('alipay', rawBody, headers);

    if (!result.success) {
      return new NextResponse('fail', { status: 400 });
    }

    const order = await queryFirst(
      'SELECT * FROM "Order" WHERE orderNo = ?',
      result.orderNo
    ) as any;

    if (!order) {
      console.error('支付宝回调订单不存在:', result.orderNo);
      return new NextResponse('fail', { status: 404 });
    }

    const paidAmount = result.amount;
    if (isNaN(paidAmount) || Math.abs(order.amount - paidAmount) > 0.01) {
      console.error('支付宝回调金额不匹配:', order.amount, paidAmount);
      return new NextResponse('fail', { status: 400 });
    }

    if (order.status === 'paid') {
      return new NextResponse('success', { status: 200 });
    }

    const now = new Date().toISOString();

    const batchStatements: Array<{ sql: string; params?: any[] }> = [
      {
        sql: 'UPDATE "Order" SET status = ?, transactionId = ?, paidAt = ?, updatedAt = ? WHERE id = ?',
        params: ['paid', result.transactionId, now, now, order.id],
      },
      {
        sql: 'INSERT INTO Payment (id, orderId, userId, method, amount, status, transactionId, paidAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        params: [`pay_${Date.now()}`, order.id, order.userId, result.method, order.amount, 'success', result.transactionId, now, now],
      },
    ];

    if (order.type === 'membership') {
      const plan = MEMBERSHIP_PLANS.find((p) => p.level === order.targetId);
      const days = plan?.durationDays ?? 30;
      const expiry = days ? new Date(Date.now() + days * 86400000).toISOString() : null;

      batchStatements.push({
        sql: 'UPDATE User SET memberLevel = ?, memberExpiryAt = ?, updatedAt = ? WHERE id = ?',
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

    // 会员开通赠送积分
    if (order.type === 'membership') {
      const giftAmount = MEMBERSHIP_GIFT_LINGZHU[order.targetId] || 0;
      if (giftAmount > 0) {
        try {
          await grantLingzhu(order.userId, giftAmount, `开通${order.targetId}会员赠送`);
        } catch (e) {
          console.error('[支付宝回调] 赠送积分失败:', e);
        }
      }
    }

    await auditLog({
      userId: order.userId,
      action: 'order_pay',
      details: { orderNo: order.orderNo, amount: order.amount, method: result.method },
      status: 'success',
    });

    return new NextResponse('success', { status: 200 });
  } catch (error: any) {
    console.error('支付宝回调处理失败:', error?.message);
    return new NextResponse('fail', { status: 500 });
  }
}
