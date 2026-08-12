import { NextRequest, NextResponse } from 'next/server';
import { queryAll, ensureOfferingSupplyTable, seedDefaultSupplies } from '@/lib/d1';
import { requireAuth } from '@/lib/auth-server';

// 与前台 /api/offerings、后台 /api/admin/offering 保持一致的分类元数据
const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  wish: { label: '心愿祈福', icon: '🏮', color: 'bg-amber-50 text-amber-700' },
  culture: { label: '文化纪念', icon: '🎐', color: 'bg-blue-50 text-blue-700' },
  offering: { label: '鲜花供品', icon: '🌸', color: 'bg-pink-50 text-pink-700' },
  ritual: { label: '香烛用品', icon: '🕯️', color: 'bg-purple-50 text-purple-700' },
};

async function ensureReady() {
  await ensureOfferingSupplyTable();
  await seedDefaultSupplies(false);
}

export async function GET(req: NextRequest) {
  try {
    await ensureReady();

    const type = req.nextUrl.searchParams.get('type');

    if (type === 'supplies') {
      const supplies = await queryAll(
        'SELECT * FROM OfferingSupply WHERE isActive = 1 ORDER BY category ASC, sortOrder ASC'
      ) as any[];

      // 使用与前台一致的硬编码分类，避免依赖 OfferingCategory 表
      const categories = Object.entries(CATEGORY_META).map(([key, meta]) => ({
        id: key,
        name: meta.label,
        icon: meta.icon,
        color: meta.color,
      }));

      const grouped: Record<string, any[]> = {};
      for (const supply of supplies) {
        const cat = supply.category || 'general';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(supply);
      }

      return NextResponse.json({ supplies: grouped, categories });
    }

    if (type === 'leaderboard') {
      const top = await queryAll(
        'SELECT userId, SUM(amount) as totalAmount, COUNT(*) as count FROM OfferingRecord GROUP BY userId ORDER BY totalAmount DESC LIMIT 20'
      ) as any[];

      let leaderboard = top.map((r: any, i: number) => ({
        rank: i + 1, userId: r.userId, name: '用户', totalAmount: r.totalAmount || 0, count: r.count
      }));

      if (top.length > 0) {
        const userIds = top.map((r: any) => r.userId);
        const placeholders = userIds.map(() => '?').join(',');
        const users = await queryAll(
          `SELECT id, name FROM User WHERE id IN (${placeholders})`,
          ...userIds
        ) as any[];
        const userMap = new Map(users.map((u: any) => [u.id, u.name || '用户']));
        leaderboard = top.map((r: any, i: number) => ({
          rank: i + 1, userId: r.userId, name: userMap.get(r.userId) || '用户', totalAmount: r.totalAmount || 0, count: r.count
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
          session.sub, later
        );
        return NextResponse.json({ records });
      }

      const records = await queryAll(
        'SELECT * FROM OfferingRecord WHERE userId = ? ORDER BY createdAt DESC LIMIT 50',
        session.sub
      );
      return NextResponse.json({ records });
    }

    // 默认：返回与前台一致的硬编码分类
    const categories = Object.entries(CATEGORY_META).map(([key, meta]) => ({
      id: key,
      name: meta.label,
      icon: meta.icon,
      color: meta.color,
    }));
    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('获取供奉数据失败:', error?.message);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
