import { NextRequest, NextResponse } from 'next/server';

function getUserId(req: NextRequest): string | null {
  try {
    const m = (req.headers.get('cookie') || '').match(/token=([^;]+)/);
    if (!m) return null;
    return JSON.parse(new TextDecoder().decode(new Uint8Array(atob(decodeURIComponent(m[1])).split('').map(c => c.charCodeAt(0))))).sub || null;
  } catch { return null; }
}

async function getDB() {
  const { getCloudflareContext } = require('@opennextjs/cloudflare');
  const ctx = await getCloudflareContext({ async: true });
  return ctx.env.DB;
}

export async function GET(req: NextRequest) {
  try {
    const db = await getDB();
    const userId = getUserId(req);
    const type = req.nextUrl.searchParams.get('type');

    if (type === 'leaderboard') {
      const top = await db.prepare(
        'SELECT userId, SUM(amount) as totalAmount, COUNT(*) as count FROM OfferingRecord GROUP BY userId ORDER BY totalAmount DESC LIMIT 20'
      ).all() as any;
      const rows = top.results || [];

      let leaderboard = rows.map((r: any, i: number) => ({
        rank: i + 1, userId: r.userId, name: '善信', totalAmount: r.totalAmount || 0, count: r.count
      }));

      if (rows.length > 0) {
        const userIds = rows.map((r: any) => r.userId);
        const users = await db.prepare(
          `SELECT id, name FROM User WHERE id IN (${userIds.map(() => '?').join(',')})`
        ).bind(...userIds).all() as any;
        const userMap = new Map((users.results || []).map((u: any) => [u.id, u.name || '善信']));
        leaderboard = rows.map((r: any, i: number) => ({
          rank: i + 1, userId: r.userId, name: userMap.get(r.userId) || '善信', totalAmount: r.totalAmount || 0, count: r.count
        }));
      }

      return NextResponse.json({ leaderboard });
    }

    if (!userId) return NextResponse.json({ error: '未登录' }, { status: 401 });

    if (type === 'records') {
      const records = await db.prepare('SELECT * FROM OfferingRecord WHERE userId = ? ORDER BY createdAt DESC LIMIT 50').bind(userId).all() as any;
      return NextResponse.json({ records: records.results || [] });
    }

    if (type === 'expiring') {
      const now = new Date().toISOString();
      const later = new Date(Date.now() + 7 * 86400000).toISOString();
      const records = await db.prepare(
        "SELECT * FROM OfferingRecord WHERE userId = ? AND status = 'active' AND endDate IS NOT NULL AND endDate <= ? ORDER BY endDate ASC"
      ).bind(userId, later).all() as any;
      return NextResponse.json({ records: records.results || [] });
    }

    // Default: categories
    const categories = await db.prepare('SELECT * FROM OfferingCategory WHERE isActive = 1 ORDER BY sortOrder ASC').all() as any;
    return NextResponse.json({ categories: categories.results || [] });
  } catch (error: any) {
    console.error('获取供奉数据失败:', error?.message);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
