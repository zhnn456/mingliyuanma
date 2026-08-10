import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, execute, batch } from '@/lib/d1';
import { createPaymentService, MEMBERSHIP_PLANS } from '@/lib/payment';
import { auditLog } from '@/lib/audit';
import { grantLingzhu, MEMBERSHIP_GIFT_LINGZHU } from '@/lib/rate-limit';

// 充值套餐（与 recharge/route.ts 保持一致）
const RECHARGE_PACKAGES: Record<string, number> = {
  pkg_100: 100,
  pkg_500: 550,
  pkg_1000: 1200,
  pkg_3000: 3800,
};

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const method = searchParams.get('method');

    // 拒绝 mock 方式，只接受真实支付回调
    if (method !== 'wechat' && method !== 'alipay') {
      return NextResponse.json({ code: 'FAIL', message: '无效的支付方式' }, { status: 400 });
    }

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

    const order = await queryFirst(
      'SELECT * FROM "Order" WHERE orderNo = ?',
      result.orderNo
    ) as any;

    if (!order) {
      console.error('回调订单不存在:', result.orderNo);
      return NextResponse.json({ code: 'FAIL', message: '订单不存在' }, { status: 404 });
    }

    // 金额校验（防篡改）
    const paidAmount = result.amount;
    if (isNaN(paidAmount) || Math.abs(order.amount - paidAmount) > 0.01) {
      console.error('回调金额不匹配:', order.amount, paidAmount);
      return NextResponse.json({ code: 'FAIL', message: '金额不匹配' }, { status: 400 });
    }

    // 原子性抢占：只有 pending 状态才能更新为 paid
    // 防止并发回调导致重复处理（双倍充值）
    const claimResult = await execute(
      'UPDATE "Order" SET status = ?, transactionId = ?, paidAt = ?, updatedAt = ? WHERE id = ? AND status = ?',
      'paid', result.transactionId, new Date().toISOString(), new Date().toISOString(), order.id, 'pending'
    );

    if (claimResult.changes === 0) {
      // 订单已被其他回调处理，幂等返回成功
      return NextResponse.json({ code: 'SUCCESS', message: '成功' });
    }

    const now = new Date().toISOString();
    const randSuffix = Math.random().toString(36).slice(2, 8);

    const batchStatements: Array<{ sql: string; params?: any[] }> = [
      {
        sql: 'INSERT INTO Payment (id, orderId, userId, method, amount, status, transactionId, paidAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        params: [`pay_${Date.now()}_${randSuffix}`, order.id, order.userId, result.method, order.amount, 'success', result.transactionId, now, now],
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
        params: [`off_${Date.now()}_${randSuffix}`, order.userId, itemId || order.targetId || '', order.amount, offerType || 'single', 'completed', now],
      });

      await auditLog({
        userId: order.userId,
        action: 'offering_create',
        details: { orderNo: order.orderNo, targetId: order.targetId },
        status: 'success',
      });
    } else if (order.type === 'recharge') {
      // 充值灵珠到账
      const points = RECHARGE_PACKAGES[order.targetId];
      if (points) {
        batchStatements.push({
          sql: 'INSERT INTO UserPoints (userId, balance, updatedAt) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE balance = balance + VALUES(balance), updatedAt = VALUES(updatedAt)',
          params: [order.userId, points, now],
        });
        batchStatements.push({
          sql: 'INSERT INTO PointsLedger (id, userId, amount, balance, type, remark, createdAt) VALUES (?, ?, ?, (SELECT balance FROM UserPoints WHERE userId = ?), ?, ?, ?)',
          params: [`pts_${Date.now()}_${randSuffix}`, order.userId, points, order.userId, 'recharge', `充值${points}灵珠`, now],
        });
      }

      await auditLog({
        userId: order.userId,
        action: 'recharge_success',
        details: { orderNo: order.orderNo, points, amount: order.amount },
        status: 'success',
      });
    }

    await batch(batchStatements);

    // 分润处理 - 用户消费时自动分润给代理商
    try {
      const { processCommission } = await import('@/lib/commission-engine');
      await processCommission(order.id, order.userId, order.amount);
    } catch (err) {
      console.error('分润处理失败:', err);
    }

    // 会员开通赠送灵珠
    if (order.type === 'membership') {
      const giftAmount = MEMBERSHIP_GIFT_LINGZHU[order.targetId] || 0;
      if (giftAmount > 0) {
        try {
          await grantLingzhu(order.userId, giftAmount, `开通会员赠送${giftAmount}灵珠`);
        } catch (err) {
          console.error('会员赠送灵珠失败:', err);
        }
      }
    }

    await auditLog({
      userId: order.userId,
      action: 'order_pay',
      details: { orderNo: order.orderNo, amount: order.amount, method: result.method },
      status: 'success',
    });

    if (method === 'wechat') {
      return NextResponse.json({ return_code: 'SUCCESS', return_msg: 'OK' });
    }
    return NextResponse.json({ code: 'SUCCESS', message: '成功' });
  } catch (error: any) {
    console.error('支付回调处理失败:', error?.message);
    return NextResponse.json({ code: 'FAIL', message: '处理失败' }, { status: 500 });
  }
}
