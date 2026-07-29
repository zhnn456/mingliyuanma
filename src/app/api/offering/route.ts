import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security';
import { queryFirst, queryAll, execute } from '@/lib/d1';

export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAuth();
    if (!session?.user?.email) return NextResponse.json({ error: '未登录' }, { status: 401 });

    const user = await queryFirst('SELECT id, email, name FROM User WHERE email = ?', session.user.email) as any;
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

    const type = req.nextUrl.searchParams.get('type');

    if (type === 'leaderboard') {
      const topUsers = await queryAll(
        `SELECT userId, SUM(amount) as totalAmount, COUNT(*) as count 
         FROM OfferingRecord GROUP BY userId ORDER BY totalAmount DESC LIMIT 20`
      ) as any[];

      const userIds = topUsers.map((u: any) => u.userId);
      const users = await queryAll(
        userIds.length > 0
          ? `SELECT id, name, avatar FROM User WHERE id IN (${userIds.map(() => '?').join(',')})`
          : 'SELECT id, name, avatar FROM User WHERE 1=0',
        ...userIds
      ) as any[];
      const userMap = new Map(users.map((u: any) => [u.id, u]));

      return NextResponse.json({
        leaderboard: topUsers.map((u: any, i: number) => {
          const info = userMap.get(u.userId);
          return { rank: i + 1, userId: u.userId, name: info?.name || '善信', avatar: info?.avatar, totalAmount: u.totalAmount || 0, count: u.count };
        })
      });
    }

    if (type === 'records') {
      const records = await queryAll('SELECT * FROM OfferingRecord WHERE userId = ? ORDER BY createdAt DESC LIMIT 50', user.id);
      return NextResponse.json({ records });
    }

    if (type === 'expiring') {
      const now = new Date().toISOString();
      const sevenDaysLater = new Date(Date.now() + 7 * 86400000).toISOString();
      const records = await queryAll(
        "SELECT * FROM OfferingRecord WHERE userId = ? AND status = 'active' AND endDate IS NOT NULL AND endDate <= ? ORDER BY endDate ASC",
        user.id, sevenDaysLater
      );
      return NextResponse.json({ records });
    }

    const categories = await queryAll(
      'SELECT * FROM OfferingCategory WHERE isActive = 1 ORDER BY sortOrder ASC'
    );
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('获取供奉数据失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAuth();
    if (!session?.user?.email) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const user = await queryFirst('SELECT id, email FROM User WHERE email = ?', session.user.email) as any;
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

    const body = await req.json();
    const { itemId, quantity, dedication, type: supplyType } = body;

    if (!itemId) return NextResponse.json({ error: '请选择供奉物品' }, { status: 400 });

    const item = await queryFirst('SELECT * FROM OfferingItem WHERE id = ? OR name = ?', itemId, itemId) as any;
    if (!item) return NextResponse.json({ error: '供奉物品不存在' }, { status: 404 });

    const VALID_TYPES = ['single', 'monthly', 'yearly'];
    const sType = VALID_TYPES.includes(supplyType) ? supplyType : 'single';

    const price = sType === 'monthly' ? (item.priceMonth || item.priceSingle || 10)
                : sType === 'yearly' ? (item.priceYear || item.priceSingle || 10)
                : (item.priceSingle || 10);
    const qty = Math.max(1, typeof quantity === 'number' ? quantity : parseInt(quantity) || 1);
    const amount = price * qty;

    let endDate: string | null = null;
    const now = new Date();
    if (sType === 'monthly') endDate = new Date(now.getTime() + 30 * 86400000).toISOString();
    else if (sType === 'yearly') endDate = new Date(now.getTime() + 365 * 86400000).toISOString();

    const recordId = `off_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    await execute(
      'INSERT INTO OfferingRecord (id, userId, itemId, amount, type, supplyIds, endDate, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      recordId, user.id, item.id, amount, sType,
      dedication ? JSON.stringify({ dedication }) : null,
      endDate, endDate ? 'active' : 'completed', now.toISOString()
    );

    return NextResponse.json({ record: { id: recordId }, message: '供奉成功，功德无量' });
  } catch (error) {
    console.error('供奉失败:', error);
    return NextResponse.json({ error: '供奉失败，请重试' }, { status: 500 });
  }
}
