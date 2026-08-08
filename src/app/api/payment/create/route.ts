import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server'
import { getClientIP, checkIPRateLimit, sanitizeString } from '@/lib/security';
import { createPaymentService, generateOrderNo, MEMBERSHIP_PLANS, PaymentMethod } from '@/lib/payment';
import { queryFirst, queryAll, execute } from '@/lib/d1';
import { auditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAuth(req);
    if (!allowed || !session) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const ip = getClientIP(req);
    const rateLimit = checkIPRateLimit(ip, 10, 60000);
    if (!rateLimit.allowed) return NextResponse.json({ error: '操作过于频繁' }, { status: 429 });

    const body = await req.json();
    const { type, method, couponCode } = body;
    let targetId = body.targetId;

    const VALID_METHODS = ['wechat', 'alipay', 'mock'];
    if (!method || !VALID_METHODS.includes(method)) return NextResponse.json({ error: '无效的支付方式' }, { status: 400 });
    const paymentMethod = method as PaymentMethod;

    let amount = 0;
    let title = '';
    let targetType: 'membership' | 'offering' | 'pdf_report' = 'membership';

    if (type === 'membership') {
      const plan = MEMBERSHIP_PLANS.find(p => p.level === targetId);
      if (!plan) return NextResponse.json({ error: '无效的会员套餐' }, { status: 400 });
      amount = plan.price; title = `命理网${plan.name}`; targetType = 'membership';
    } else if (type === 'offering') {
      let item = await queryFirst('SELECT * FROM OfferingItem WHERE id = ?', targetId) as any;
      if (!item) item = await queryFirst('SELECT * FROM OfferingItem WHERE name = ?', targetId) as any;
      const offerType = sanitizeString(body.offerType || 'single');

      // 月供/年供改为灵珠支付，不走人民币
      if (offerType === 'monthly' || offerType === 'yearly') {
        const lingzhuAmount = offerType === 'monthly' ? 3000 : 30000;
        const itemName = item?.name || (offerType === 'monthly' ? '月供供奉' : '年供供奉');
        const itemId = item?.id || `sub_${offerType}`;
        const now = new Date().toISOString();
        const userId = session.sub;

        // 扣减灵珠
        const deductResult = await execute(
          'UPDATE UserPoints SET balance = balance - ?, updatedAt = ? WHERE userId = ? AND balance >= ?',
          lingzhuAmount, now, userId, lingzhuAmount
        );

        if (deductResult.changes === 0) {
          const row = await queryFirst('SELECT balance FROM UserPoints WHERE userId = ?', userId) as any;
          const balance = row?.balance || 0;
          return NextResponse.json({ error: `灵珠不足，需要${lingzhuAmount}灵珠，当前${balance}灵珠` }, { status: 400 });
        }

        const updatedRow = await queryFirst('SELECT balance FROM UserPoints WHERE userId = ?', userId) as any;
        const newBalance = updatedRow?.balance || 0;

        // 灵珠流水
        await execute(
          'INSERT INTO PointsLedger (id, userId, amount, balance, type, remark, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
          `pts_${Date.now()}`, userId, -lingzhuAmount, newBalance, 'offering', `供奉${itemName}(${offerType === 'monthly' ? '月供' : '年供'})`, now
        );

        // 完成供奉记录
        await execute(
          'INSERT INTO OfferingRecord (id, userId, itemId, amount, type, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
          `off_${Date.now()}`, userId, itemId, lingzhuAmount, offerType, 'completed', now
        );

        await auditLog({ userId, action: 'offering_create', ip, details: { itemId, offerType, cost: lingzhuAmount }, status: 'success' });

        return NextResponse.json({ success: true, cost: lingzhuAmount, balance: newBalance, message: '供奉成功' });
      }

      // 单次供奉：保持原有人民币支付逻辑
      if (!item) return NextResponse.json({ error: '无效的供奉项目' }, { status: 400 });
      amount = item.priceSingle || 0;
      title = `供奉 - ${item.name}`; targetType = 'offering';
      targetId = `${item.id}:::single`;
    } else if (type === 'pdf_report') {
      amount = 9.9; title = '命理报告PDF'; targetType = 'pdf_report';
    } else {
      return NextResponse.json({ error: '无效的订单类型' }, { status: 400 });
    }

    if (amount <= 0) return NextResponse.json({ error: '支付金额异常' }, { status: 400 });

    // 优惠券
    let discount = 0;
    let appliedCoupon: any = null;
    if (couponCode) {
      const coupon = await queryFirst('SELECT * FROM Coupon WHERE code = ? AND isActive = 1', couponCode) as any;
      if (!coupon) return NextResponse.json({ error: '优惠码无效' }, { status: 400 });
      if (coupon.validTo && new Date(coupon.validTo) < new Date()) return NextResponse.json({ error: '优惠码已过期' }, { status: 400 });
      if (coupon.validFrom && new Date(coupon.validFrom) > new Date()) return NextResponse.json({ error: '优惠码尚未生效' }, { status: 400 });
      if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) return NextResponse.json({ error: '优惠码已用完' }, { status: 400 });
      if (amount < coupon.minAmount) return NextResponse.json({ error: `未达到最低消费¥${coupon.minAmount}` }, { status: 400 });

      discount = coupon.type === 'percentage' ? amount * (coupon.value / 100) : coupon.value;
      if (discount > amount) discount = amount;
      appliedCoupon = coupon;
      // 增加使用次数
      await execute('UPDATE Coupon SET usedCount = usedCount + 1 WHERE id = ?', coupon.id);
    }

    const finalAmount = parseFloat((amount - discount).toFixed(2));
    const orderNo = generateOrderNo();
    const userId = session.sub;

    const orderId = `ord_${Date.now()}`;
    const now = new Date().toISOString();
    await execute(
      `INSERT INTO "Order" (id, orderNo, userId, type, targetId, amount, status, paymentMethod, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
      orderId, orderNo, userId, targetType, targetId, finalAmount, paymentMethod, now, now
    );
    const order = await queryFirst('SELECT * FROM "Order" WHERE id = ?', orderId);

    const paymentService = createPaymentService();
    const result = await paymentService.createOrder({
      orderNo, amount: finalAmount, title, description: title,
      method: paymentMethod, userId, targetType, targetId: type === 'offering' ? targetId?.split(':::')[0] : targetId,
      returnUrl: body.returnUrl,
    });

    await auditLog({ userId, action: 'order_create', ip, details: { orderNo, amount: finalAmount, type: targetType, method: paymentMethod, discount }, status: 'success' });

    return NextResponse.json({
      order: { id: (order as any).id, orderNo, amount: finalAmount, status: 'pending', type: targetType, originalAmount: amount, discount },
      payment: result,
    });
  } catch (error) {
    console.error('创建支付订单失败:', error);
    return NextResponse.json({ error: '创建订单失败' }, { status: 500 });
  }
}
