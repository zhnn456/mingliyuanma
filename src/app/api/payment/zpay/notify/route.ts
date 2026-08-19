/**
 * Z-Pay 异步回调接口
 * 
 * Z-Pay 支付成功后通过 GET 方式回调此接口
 * 必须返回字符串 'success' 确认收款
 * 重试策略：0/15/15/30/180/1800 秒
 */
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, execute, batch } from '@/lib/d1';
import { auditLog } from '@/lib/audit';
import { grantLingzhu, MEMBERSHIP_GIFT_LINGZHU } from '@/lib/rate-limit';
import { PACKAGE_POINTS } from '@/lib/recharge-packages';
import { createPaymentService, MEMBERSHIP_PLANS } from '@/lib/payment';

export async function GET(req: NextRequest) {
  try {
    // 解析回调参数
    const { searchParams } = new URL(req.url);
    const params: Record<string, string> = {};
    searchParams.forEach((v, k) => { params[k] = v; });

    console.log('[Z-Pay 回调] 收到回调:', JSON.stringify(params));

    // 验证签名并解析（统一走 createPaymentService，读取后台 DB 配置）
    // Z-Pay 回调是 GET，把 query string 作为 rawBody 传给 handleCallback
    const rawBody = searchParams.toString();
    const paymentService = await createPaymentService();
    const result = await paymentService.handleCallback('zpay', rawBody, {});

    if (!result.success) {
      console.error('[Z-Pay 回调] 签名验证失败');
      return new NextResponse('fail', { status: 400 });
    }

    // 查找订单
    const order = await queryFirst(
      'SELECT * FROM "Order" WHERE orderNo = ?',
      result.orderNo
    ) as any;

    if (!order) {
      console.error('[Z-Pay 回调] 订单不存在:', result.orderNo);
      return new NextResponse('fail', { status: 404 });
    }

    // 金额校验
    if (Math.abs(order.amount - result.amount) > 0.01) {
      console.error('[Z-Pay 回调] 金额不匹配:', order.amount, result.amount);
      return new NextResponse('fail', { status: 400 });
    }

    // 原子性抢占：防止重复处理
    const claimResult = await execute(
      'UPDATE "Order" SET status = ?, transactionId = ?, paidAt = ?, updatedAt = ? WHERE id = ? AND status = ?',
      'paid', result.transactionId, new Date().toISOString(), new Date().toISOString(), order.id, 'pending'
    );

    if (claimResult.changes === 0) {
      // 已处理，幂等返回成功
      console.log('[Z-Pay 回调] 订单已处理，幂等返回');
      return new NextResponse('success');
    }

    const now = new Date().toISOString();
    const randSuffix = Math.random().toString(36).slice(2, 8);

    const batchStatements: Array<{ sql: string; params?: any[] }> = [
      {
        sql: 'INSERT INTO Payment (id, orderId, userId, method, amount, status, transactionId, paidAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        params: [`pay_${Date.now()}_${randSuffix}`, order.id, order.userId, 'zpay', order.amount, 'success', result.transactionId, now, now],
      },
    ];

    // 根据订单类型处理业务逻辑
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
        details: { level: order.targetId, orderNo: order.orderNo, method: 'zpay' },
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
        details: { orderNo: order.orderNo, targetId: order.targetId, method: 'zpay' },
        status: 'success',
      });
    } else if (order.type === 'recharge') {
      const points = PACKAGE_POINTS[order.targetId] || 0;
      if (points > 0) {
        batchStatements.push({
          sql: 'INSERT INTO UserPoints (userId, balance, updatedAt) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE balance = balance + ?, updatedAt = ?',
          params: [order.userId, points, now, points, now],
        });
        batchStatements.push({
          sql: 'INSERT INTO PointsLedger (id, userId, amount, balance, type, remark, createdAt) VALUES (?, ?, ?, (SELECT balance FROM UserPoints WHERE userId = ?), ?, ?, ?)',
          params: [`pts_${Date.now()}_${randSuffix}`, order.userId, points, order.userId, 'recharge', `充值${points}积分`, now],
        });
      }

      await auditLog({
        userId: order.userId,
        action: 'recharge_success',
        details: { orderNo: order.orderNo, points, amount: order.amount, method: 'zpay' },
        status: 'success',
      });
    }

    await batch(batchStatements);

    // 分润处理
    try {
      const { processCommission } = await import('@/lib/commission-engine');
      await processCommission(order.id, order.userId, order.amount);
    } catch (err) {
      console.error('[Z-Pay 回调] 分润处理失败:', err);
    }

    // 会员赠送积分
    if (order.type === 'membership') {
      const giftAmount = MEMBERSHIP_GIFT_LINGZHU[order.targetId] || 0;
      if (giftAmount > 0) {
        try {
          await grantLingzhu(order.userId, giftAmount, `开通会员赠送${giftAmount}积分`);
        } catch (err) {
          console.error('[Z-Pay 回调] 会员赠送积分失败:', err);
        }
      }
    }

    await auditLog({
      userId: order.userId,
      action: 'order_pay',
      details: { orderNo: order.orderNo, amount: order.amount, method: 'zpay' },
      status: 'success',
    });

    console.log('[Z-Pay 回调] 处理成功:', result.orderNo);
    return new NextResponse('success');
  } catch (error: any) {
    console.error('[Z-Pay 回调] 处理失败:', error?.message);
    return new NextResponse('fail', { status: 500 });
  }
}