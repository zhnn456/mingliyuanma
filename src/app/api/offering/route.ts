import { NextRequest, NextResponse } from 'next/server';
import { queryAll } from '@/lib/d1';
import { requireAuth } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get('type');

    if (type === 'leaderboard') {
      const top = await queryAll(
        'SELECT userId, SUM(amount) as totalAmount, COUNT(*) as count FROM OfferingRecord GROUP BY userId ORDER BY totalAmount DESC LIMIT 20'
      ) as any[];

      let leaderboard = top.map((r: any, i: number) => ({
        rank: i + 1, userId: r.userId, name: '善信', totalAmount: r.totalAmount || 0, count: r.count
      }));

      if (top.length > 0) {
        const userIds = top.map((r: any) => r.userId);
        const placeholders = userIds.map(() => '?').join(',');
        const users = await queryAll(
          `SELECT id, name FROM User WHERE id IN (${placeholders})`,
          ...userIds
        ) as any[];
        const userMap = new Map(users.map((u: any) => [u.id, u.name || '善信']));
        leaderboard = top.map((r: any, i: number) => ({
          rank: i + 1, userId: r.userId, name: userMap.get(r.userId) || '善信', totalAmount: r.totalAmount || 0, count: r.count
        }));
      }

      return NextResponse.json({ leaderboard });
    }

    if (type === 'records' || type === 'expiring') {
      const { allowed, session } = await requireAuth(req);
      if (!allowed || !session) return NextResponse.json({ error: '未登录' }, { status: 401 });

      if (type === 'expiring') {
        const later = new Date(Date.now() + 7 * 86400000).toISOString();
        const records = await queryAll(
          "SELECT * FROM OfferingRecord WHERE userId = ? AND status = 'active' AND endDate IS NOT NULL AND endDate <= ? ORDER BY endDate ASC",
          session.user.id, later
        );
        return NextResponse.json({ records });
      }

      const records = await queryAll(
        'SELECT * FROM OfferingRecord WHERE userId = ? ORDER BY createdAt DESC LIMIT 50',
        session.user.id
      );
      return NextResponse.json({ records });
    }

    const categories = await queryAll('SELECT * FROM OfferingCategory WHERE isActive = 1 ORDER BY sortOrder ASC');
    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('获取供奉数据失败:', error?.message);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
