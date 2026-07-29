import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security';
import { queryAll } from '@/lib/d1';

export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAuth(req);
    if (!allowed || !session) return NextResponse.json({ error: '未登录' }, { status: 401 });

    const orders = await queryAll(
      `SELECT id, orderNo, amount, status, type, createdAt FROM "Order" WHERE userId = ? ORDER BY createdAt DESC LIMIT 50`,
      session.user.id
    );
    return NextResponse.json({ orders });
  } catch (error) {
    console.error('获取订单失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
