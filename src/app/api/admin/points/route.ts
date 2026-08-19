/**
 * 积分管理API
 * 功能：积分流水查询、积分增减操作
 * 用途：积分系统管理、用户积分调整
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { auditLog } from '@/lib/audit';
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
  const { allowed, session } = await requireAdmin(req);
  if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });
  const { userId, amount, type, remark } = await req.json();
  if (!userId || !amount) return NextResponse.json({ error: '参数不足' }, { status: 400 });
  const balance = await addPoints(userId, amount, type || 'admin_adjust', remark || '管理员调整');
  await auditLog({
    userId: session?.sub,
    action: 'admin_update_user',
    details: { userId, points: amount },
    status: 'success',
  });
  return NextResponse.json({ balance });
}
