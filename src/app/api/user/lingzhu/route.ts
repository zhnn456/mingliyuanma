import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { queryFirst, queryAll } from '@/lib/d1';

export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAuth(req);
    if (!allowed || !session) return NextResponse.json({ error: '未登录' }, { status: 401 });
    const userId = session.sub;

    const row = await queryFirst('SELECT balance FROM UserPoints WHERE userId = ?', userId) as any;
    const balance = row?.balance || 0;

    const rows = await queryAll('SELECT * FROM PointsLedger WHERE userId = ? ORDER BY createdAt DESC LIMIT 20', userId);
    return NextResponse.json({ balance, rows });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || '查询失败' }, { status: 500 });
  }
}
