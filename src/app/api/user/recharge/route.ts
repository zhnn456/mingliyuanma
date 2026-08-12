import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { execute } from '@/lib/d1';
import { auditLog } from '@/lib/audit';
import { RECHARGE_PACKAGES } from '@/lib/recharge-packages';

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAuth(req);
    if (!allowed || !session) return NextResponse.json({ error: '请先登录' }, { status: 401 });
    const userId = session.sub;

    const body = await req.json();
    const { packageId } = body;
    const pkg = RECHARGE_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) return NextResponse.json({ error: '无效的充值套餐' }, { status: 400 });

    const now = new Date().toISOString();
    const randSuffix = Math.random().toString(36).slice(2, 8);
    const orderId = `ord_${Date.now()}_${randSuffix}`;
    const orderNo = `RC${Date.now()}${randSuffix}`;

    await execute(
      'INSERT INTO "Order" (id, orderNo, userId, type, targetId, amount, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      orderId, orderNo, userId, 'recharge', pkg.id, pkg.price, 'pending', now, now
    );

    await auditLog({
      userId,
      action: 'recharge_order_create',
      ip: req.headers.get('x-forwarded-for') || undefined,
      details: { orderNo, packageId: pkg.id, price: pkg.price, points: pkg.points + pkg.bonus },
      status: 'success',
    });

    return NextResponse.json({
      orderId,
      orderNo,
      amount: pkg.price,
      points: pkg.points + pkg.bonus,
      message: '订单创建成功',
    });
  } catch (error: any) {
    console.error('充值订单创建失败:', error?.message);
    return NextResponse.json({ error: '创建订单失败，请稍后重试' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ packages: RECHARGE_PACKAGES });
}
