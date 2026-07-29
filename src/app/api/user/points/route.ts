import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { getUserPoints, listPointsLedger } from '@/lib/d1';

export async function GET(req: NextRequest) {
  const { allowed, session } = await requireAuth(req);
  if (!allowed || !session) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const balance = await getUserPoints(session.user.id);
  const ledger = await listPointsLedger(session.user.id, page, 20);
  return NextResponse.json({ balance, ...ledger });
}
