import { NextRequest, NextResponse } from 'next/server';

const PLANS = [
  { lingzhu: 100, price: 10, bonus: 0 },
  { lingzhu: 500, price: 50, bonus: 20 },
  { lingzhu: 1000, price: 100, bonus: 50 },
  { lingzhu: 5000, price: 500, bonus: 200 },
];

export async function GET() {
  return NextResponse.json({ plans: PLANS });
}

export async function POST(req: NextRequest) {
  try {
    // 从 cookie 获取用户
    const cookie = req.headers.get('cookie') || '';
    const m = cookie.match(/token=([^;]+)/);
    if (!m) return NextResponse.json({ error: '未登录' }, { status: 401 });
    const payload = JSON.parse(new TextDecoder().decode(new Uint8Array(atob(decodeURIComponent(m[1])).split('').map(c => c.charCodeAt(0)))));
    if (!payload?.sub) return NextResponse.json({ error: '未登录' }, { status: 401 });

    const { lingzhu } = await req.json();
    const plan = PLANS.find(p => p.lingzhu === lingzhu);
    if (!plan) return NextResponse.json({ error: '无效的充值档位' }, { status: 400 });

    const total = plan.lingzhu + plan.bonus;
    const userId = payload.sub;
    const now = new Date().toISOString();

    const { getCloudflareContext } = require('@opennextjs/cloudflare');
    const ctx = await getCloudflareContext({ async: true });
    const db = ctx.env.DB;

    // 创建充值订单
    const orderId = `ling_${Date.now()}`;
    await db.prepare(
      'INSERT INTO RechargeOrder (id, userId, amount, lingzhu, bonus, payment, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(orderId, userId, plan.price, plan.lingzhu, plan.bonus, 'mock', 'paid', now).run();

    // 查当前余额
    const row = await db.prepare('SELECT balance FROM UserPoints WHERE userId = ?').bind(userId).first() as any;
    const currentBalance = row?.balance || 0;
    const newBalance = currentBalance + total;

    // 写流水
    const ledgerId = `pts_${Date.now()}`;
    await db.prepare(
      'INSERT INTO PointsLedger (id, userId, amount, balance, type, remark, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(ledgerId, userId, total, newBalance, 'recharge', `灵珠充值: ${plan.lingzhu}+${plan.bonus}`, now).run();

    // 更新余额
    await db.prepare(
      'INSERT OR REPLACE INTO UserPoints (userId, balance, updatedAt) VALUES (?, ?, ?)'
    ).bind(userId, newBalance, now).run();

    return NextResponse.json({ orderId, lingzhu: total, balance: newBalance, message: '充值成功' });
  } catch (error: any) {
    console.error('充值失败:', error?.message);
    return NextResponse.json({ error: '充值失败: ' + (error?.message || '未知错误') }, { status: 500 });
  }
}
