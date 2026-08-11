import { NextResponse } from 'next/server';
import { queryAll, queryFirst } from '@/lib/d1';

const ANON_NAMES = [
  '心愿·慧', '心愿·明', '心愿·诚', '心愿·德', '心愿·仁',
  '静心·行者', '清风·远客', '明月·照心', '松间·听雨',
  '福慧·常乐', '随缘·欢喜', '安然·自在',
  '山间·清风', '溪畔·白云',
  '初心·不改', '心愿·常新',
  '吉祥·如意', '喜乐·安康',
  '雅集·知音', '悠然·南山',
];

const ITEMS = ['清香', '鲜花', '水果', '素食', '祈福灯', '香炉'];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '刚刚';
  if (m < 60) return `${m}分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}小时前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}天前`;
  return `${Math.floor(d / 30)}月前`;
}

export async function GET() {
  try {
    const real = await queryAll(`
      SELECT o.id, o.userId, o.itemId, o.amount, o.supplyIds, o.createdAt,
             u.name as userName
      FROM OfferingRecord o
      LEFT JOIN User u ON o.userId = u.id
      ORDER BY o.createdAt DESC LIMIT 20
    `) as any[];

    const realItems = real.map((r: any) => {
      let dedication = '';
      try { const d = JSON.parse(r.supplyIds || '{}'); dedication = d.dedication || ''; } catch {}
      return {
        userName: r.userName || '用户',
        itemName: r.itemId || '祈福',
        amount: r.amount || 0,
        dedication,
        timeAgo: timeAgo(r.createdAt),
        isReal: true,
      };
    });

    const stats = await queryFirst(`
      SELECT COUNT(*) as totalOff, COALESCE(SUM(amount),0) as totalLing,
             (SELECT COUNT(DISTINCT userId) FROM OfferingRecord) as totalUsers
      FROM OfferingRecord
    `) as any;
    const totalOff = stats?.totalOff || 0;
    const totalLing = stats?.totalLing || 0;
    const totalUsers = stats?.totalUsers || 0;

    const fakeCount = Math.max(50, 100 - realItems.length);
    const fakeItems: any[] = [];
    const now = Date.now();
    for (let i = 0; i < fakeCount; i++) {
      const name = ANON_NAMES[Math.floor(Math.random() * ANON_NAMES.length)];
      const item = ITEMS[Math.floor(Math.random() * ITEMS.length)];
      const prices: Record<string, number> = { '清香': 100, '鲜花': 200, '水果': 300, '素食': 500, '祈福灯': 1000, '香炉': 2000 };
      const amount = prices[item] || 100;
      const minutesAgo = Math.floor(Math.random() * 10080);
      const dedication = ['阖家平安', '身体健康', '工作顺利', '学业有成', '姻缘美满', '', '', ''][Math.floor(Math.random() * 8)];
      fakeItems.push({
        userName: name,
        itemName: item,
        amount,
        dedication: dedication || '',
        timeAgo: minutesAgo < 1 ? '刚刚' : minutesAgo < 60 ? `${minutesAgo}分钟前` : minutesAgo < 1440 ? `${Math.floor(minutesAgo / 60)}小时前` : `${Math.floor(minutesAgo / 1440)}天前`,
        isReal: false,
      });
    }

    const allItems = [...realItems, ...fakeItems].sort((a, b) => {
      const ta = a.timeAgo === '刚刚' ? 0 : parseInt(a.timeAgo) || 99999;
      const tb = b.timeAgo === '刚刚' ? 0 : parseInt(b.timeAgo) || 99999;
      return ta - tb;
    });

    return NextResponse.json({
      items: allItems,
      stats: {
        totalOfferings: totalOff + fakeCount,
        totalUsers: totalUsers + 18,
        totalLingzhu: totalLing + fakeItems.reduce((s: number, i: any) => s + i.amount, 0),
        realCount: realItems.length,
        fakeCount,
      },
    });
  } catch (error: any) {
    console.error('祈福广场获取失败:', error?.message);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
