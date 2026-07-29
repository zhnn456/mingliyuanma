import { NextRequest, NextResponse } from 'next/server';

function getUserId(req: NextRequest): string | null {
  try {
    const cookie = req.headers.get('cookie') || '';
    const m = cookie.match(/token=([^;]+)/);
    if (!m) return null;
    return JSON.parse(new TextDecoder().decode(new Uint8Array(atob(decodeURIComponent(m[1])).split('').map(c => c.charCodeAt(0))))).sub || null;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId) return NextResponse.json({ error: '未登录' }, { status: 401 });

    const { getCloudflareContext } = require('@opennextjs/cloudflare');
    const ctx = await getCloudflareContext({ async: true });
    const db = ctx.env.DB;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // 检查今日是否已签到
    const signed = await db.prepare("SELECT value FROM SiteConfig WHERE key = ?").bind(`signin:${userId}:${today}`).first();
    if (signed) return NextResponse.json({ error: '今日已签到' }, { status: 400 });

    // 计算连续签到天数
    const lastSigned = await db.prepare("SELECT value FROM SiteConfig WHERE key = ?").bind(`signin:${userId}:${yesterday}`).first();
    let streak = 1;
    if (lastSigned) {
      const s = await db.prepare("SELECT value FROM SiteConfig WHERE key = ?").bind(`signin_streak:${userId}`).first() as any;
      streak = (parseInt(s?.value || '0') || 0) + 1;
    }

    const basePoints = 5;
    const bonusPoints = streak >= 7 ? 10 : 0;
    const total = basePoints + bonusPoints;

    // 记签到
    await db.prepare("INSERT INTO SiteConfig (key, value, category, updatedAt) VALUES (?, ?, 'signin', ?)").bind(`signin:${userId}:${today}`, '1', new Date().toISOString()).run();
    await db.prepare("UPDATE SiteConfig SET value = ?, updatedAt = ? WHERE key = ?").bind(String(streak), new Date().toISOString(), `signin_streak:${userId}`).run();

    // 加灵珠
    const row = await db.prepare('SELECT balance FROM UserPoints WHERE userId = ?').bind(userId).first() as any;
    const current = row?.balance || 0;
    const newBalance = current + total;
    const now = new Date().toISOString();
    await db.prepare('INSERT INTO PointsLedger (id, userId, amount, balance, type, remark, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(`pts_${Date.now()}`, userId, total, newBalance, 'daily_signin', bonusPoints > 0 ? `连续签到${streak}天` : '每日签到', now).run();
    await db.prepare('INSERT OR REPLACE INTO UserPoints (userId, balance, updatedAt) VALUES (?, ?, ?)').bind(userId, newBalance, now).run();

    return NextResponse.json({ points: total, basePoints, bonusPoints, streak, balance: newBalance, message: '签到成功' });
  } catch (error: any) {
    console.error('签到失败:', error?.message);
    return NextResponse.json({ error: '签到失败' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId) return NextResponse.json({ error: '未登录' }, { status: 401 });

    const { getCloudflareContext } = require('@opennextjs/cloudflare');
    const ctx = await getCloudflareContext({ async: true });
    const db = ctx.env.DB;

    const today = new Date().toISOString().split('T')[0];
    const signed = !!(await db.prepare("SELECT 1 FROM SiteConfig WHERE key = ?").bind(`signin:${userId}:${today}`).first());
    const streakRow = await db.prepare("SELECT value FROM SiteConfig WHERE key = ?").bind(`signin_streak:${userId}`).first() as any;
    const streak = parseInt(streakRow?.value || '0') || 0;
    const balanceRow = await db.prepare('SELECT balance FROM UserPoints WHERE userId = ?').bind(userId).first() as any;
    const balance = balanceRow?.balance || 0;

    return NextResponse.json({ signed, today, streak, balance });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
