import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/security';
import { listAllPointsLedger, addPoints } from '@/lib/d1';

export async function GET(req: NextRequest) {
  const { allowed } = await requireAdmin(req);
  if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const data = await listAllPointsLedger(page, 20);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { allowed } = await requireAdmin(req);
  if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });
  const { userId, amount, type, remark } = await req.json();
  if (!userId || !amount) return NextResponse.json({ error: '参数不足' }, { status: 400 });
  const balance = await addPoints(userId, amount, type || 'admin_adjust', remark || '管理员调整');
  return NextResponse.json({ balance });
}
