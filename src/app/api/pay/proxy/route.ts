import { NextRequest, NextResponse } from 'next/server';
import { requireAgent, requireAdmin } from '@/lib/auth-server';
import { queryFirst, queryAll, execute } from '@/lib/d1';
import { verifyLicenseSignature } from '@/lib/license-generator';
import { calculateCommission, getLevelFromFeatures } from '@/lib/commission-engine';

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'proxy';

    const body = await req.json();
    const { agentId, userId, itemId, itemName, amount, paymentMethod, ...extraData } = body;

    if (!agentId || !userId || !itemId || !amount) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 1. 验证代理商授权
    const agent = await queryFirst(
      'SELECT a.id, a.brandName, al.licenseKey, al.features, al.status FROM Agent a LEFT JOIN AgentLicense al ON a.id = al.agentId WHERE a.id = ?',
      agentId
    ) as any;

    if (!agent) {
      return NextResponse.json({ error: '代理商不存在' }, { status: 404 });
    }

    if (agent.status !== 'active') {
      return NextResponse.json({ error: '代理商授权已失效' }, { status: 403 });
    }

    // 2. 计算分润
    const features = agent.features ? JSON.parse(agent.features) : ['bazi'];
    const level = getLevelFromFeatures(features);
    const commission = calculateCommission(amount, level);
    commission.agentId = agentId;

    // 3. 创建订单
    const orderNo = `ORD${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    await execute(
      `INSERT INTO Order (id, orderNo, userId, type, targetId, amount, status, paymentMethod, createdAt, updatedAt)
       VALUES (?, ?, ?, 'purchase', ?, ?, 'pending', ?, ?, ?)`,
      orderId, orderNo, userId, itemId, amount, paymentMethod || 'wechat', now, now
    );

    await execute(
      `INSERT INTO Payment (id, orderId, userId, method, amount, status, createdAt)
       VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
      paymentId, orderId, userId, paymentMethod || 'wechat', amount, now
    );

    // 4. 记录分润（待结算）
    const commissionId = `comm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await execute(
      `INSERT INTO CommissionRecord (id, agentId, orderId, orderAmount, commissionRate, commissionAmount, status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
      commissionId, agentId, orderId, amount, commission.commissionRate, commission.agentAmount, now
    );

    // 5. 生成支付链接（模拟，实际需对接微信/支付宝）
    const paymentUrl = generatePaymentUrl(orderNo, amount, paymentMethod || 'wechat');

    return NextResponse.json({
      success: true,
      orderId,
      orderNo,
      paymentId,
      paymentUrl,
      commission: {
        rate: commission.commissionRate,
        agentAmount: commission.agentAmount,
        platformAmount: commission.platformAmount,
      },
      expiresIn: 1800,
    });
  } catch (err: any) {
    console.error('支付代理失败:', err);
    return NextResponse.json({ error: err?.message || '支付处理失败' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderNo = searchParams.get('orderNo') || '';

    if (!orderNo) {
      return NextResponse.json({ error: '缺少订单号' }, { status: 400 });
    }

    const order = await queryFirst(
      `SELECT o.*, p.status as paymentStatus, p.transactionId, al.agentId
       FROM "Order" o
       LEFT JOIN "Payment" p ON o.id = p.orderId
       LEFT JOIN AgentLicense al ON p.id IS NOT NULL
       WHERE o.orderNo = ?`,
      orderNo
    ) as any;

    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || '查询失败' }, { status: 500 });
  }
}

function generatePaymentUrl(orderNo: string, amount: number, method: string): string {
  const params = new URLSearchParams({
    orderNo,
    amount: String(amount),
    method,
    t: String(Date.now()),
  });
  // 实际对接时替换为真实支付网关
  return `https://pay.mingli-yuanma.workers.dev/pay?${params}`;
}
