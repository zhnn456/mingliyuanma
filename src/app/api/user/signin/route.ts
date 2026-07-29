import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security';
import { getConfig, setConfig, addPoints } from '@/lib/d1';

export async function POST(req: NextRequest) {
  const { allowed, session } = await requireAuth(req);
  if (!allowed || !session) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const today = new Date().toISOString().split('T')[0];
  const key = `signin:${session.user.id}:${today}`;
  const existing = await getConfig(key);
  if (existing) return NextResponse.json({ error: '今日已签到' }, { status: 400 });

  const points = 5; // 每日签到送5积分
  await setConfig(key, '1', 'signin');
  const balance = await addPoints(session.user.id, points, 'daily_signin', `每日签到`);

  return NextResponse.json({ points, balance, message: '签到成功' });
}

export async function GET(req: NextRequest) {
  const { allowed, session } = await requireAuth(req);
  if (!allowed || !session) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const today = new Date().toISOString().split('T')[0];
  const key = `signin:${session.user.id}:${today}`;
  const signed = !!(await getConfig(key));
  return NextResponse.json({ signed, today });
}
