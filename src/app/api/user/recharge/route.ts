import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { execute } from '@/lib/d1';

const PACKAGES = [
  { id: 'pkg_100', amount: 100, points: 100 },
  { id: 'pkg_500', amount: 500, points: 550 },
  { id: 'pkg_1000', amount: 1000, points: 1200 },
  { id: 'pkg_3000', amount: 3000, points: 3800 },
];

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAuth(req);
    if (!allowed || !session) return NextResponse.json({ error: '请先登录' }, { status: 401 });
    const userId = session.sub;

    const body = await req.json();
    const { packageId } = body;
    const pkg = PACKAGES.find((p) => p.id === packageId);
    if (!pkg) return NextResponse.json({ error: '无效的充值套餐' }, { status: 400 });

    const now = new Date().toISOString();
    const orderId = `ord_${Date.now()}`;
    const orderNo = `RC${Date.now()}`;

    await execute(
      'INSERT INTO "Order" (id, orderNo, userId, type, targetId, amount, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      orderId, orderNo, userId, 'recharge', pkg.id, pkg.amount, 'pending', now, now
    );

    return NextResponse.json({ orderId, orderNo, amount: pkg.amount, points: pkg.points, message: '订单创建成功，请扫码支付' });
  } catch (error: any) {
    console.error('充值失败:', error?.message);
    return NextResponse.json({ error: '创建订单失败，请稍后重试' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ packages: PACKAGES });
}
