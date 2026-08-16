import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { queryFirst, execute } from '@/lib/d1';

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAuth(req);
    if (!allowed || !session) return NextResponse.json({ error: '请先登录' }, { status: 401 });
    const userId = session.sub;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const signed = await queryFirst("SELECT 1 FROM SiteConfig WHERE `key` = ?", `signin:${userId}:${today}`);
    if (signed) return NextResponse.json({ error: '今日已签到' }, { status: 400 });

    const lastSigned = await queryFirst("SELECT 1 FROM SiteConfig WHERE `key` = ?", `signin:${userId}:${yesterday}`);
    let streak = 1;
    if (lastSigned) {
      const s = await queryFirst("SELECT value FROM SiteConfig WHERE `key` = ?", `signin_streak:${userId}`) as any;
      streak = (parseInt(s?.value || '0') || 0) + 1;
    }

    const basePoints = 5;
    const bonusPoints = streak >= 7 ? 10 : 0;
    const total = basePoints + bonusPoints;
    const now = new Date().toISOString();

    await execute("INSERT INTO SiteConfig (`key`, value, category, updatedAt) VALUES (?, ?, 'signin', ?)", `signin:${userId}:${today}`, '1', now);
    await execute("UPDATE SiteConfig SET value = ?, updatedAt = ? WHERE `key` = ?", String(streak), now, `signin_streak:${userId}`);

    const row = await queryFirst('SELECT balance FROM UserPoints WHERE userId = ?', userId) as any;
    const current = row?.balance || 0;
    const newBalance = current + total;

    await execute('INSERT INTO PointsLedger (id, userId, amount, balance, type, remark, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      `pts_${Date.now()}`, userId, total, newBalance, 'daily_signin', bonusPoints > 0 ? `连续签到${streak}天` : '每日签到', now);
    await execute('INSERT OR REPLACE INTO UserPoints (userId, balance, updatedAt) VALUES (?, ?, ?)', userId, newBalance, now);

    return NextResponse.json({ points: total, basePoints, bonusPoints, streak, balance: newBalance, message: '签到成功' });
  } catch (error: any) {
    console.error('签到失败:', error?.message);
    return NextResponse.json({ error: '签到失败，请稍后重试' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAuth(req);
    if (!allowed || !session) return NextResponse.json({ error: '请先登录' }, { status: 401 });
    const userId = session.sub;

    const today = new Date().toISOString().split('T')[0];
    const signed = !!(await queryFirst("SELECT 1 FROM SiteConfig WHERE `key` = ?", `signin:${userId}:${today}`));
    const streakRow = await queryFirst("SELECT value FROM SiteConfig WHERE `key` = ?", `signin_streak:${userId}`) as any;
    const streak = parseInt(streakRow?.value || '0') || 0;
    const balanceRow = await queryFirst('SELECT balance FROM UserPoints WHERE userId = ?', userId) as any;
    const balance = balanceRow?.balance || 0;

    return NextResponse.json({ signed, today, streak, balance });
  } catch (error: any) {
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }
}
