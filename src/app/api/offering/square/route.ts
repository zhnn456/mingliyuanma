import { NextResponse } from 'next/server';
import { queryAll, queryFirst, getMockConfig, seedMockConfig, calcMockStats } from '@/lib/d1';

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
const DEDICATIONS = ['阖家平安', '身体健康', '工作顺利', '学业有成', '姻缘美满', '心想事成', '财源广进', '福寿安康'];

/** 基于日期的伪随机数生成器（同一天同一索引返回相同值） */
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xFFFFFFFF;
    return (s >>> 0) / 0xFFFFFFFF;
  };
}

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
    // 真实数据
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

    const realStats = await queryFirst(`
      SELECT COUNT(*) as totalOff, COALESCE(SUM(amount),0) as totalLing,
             (SELECT COUNT(DISTINCT userId) FROM OfferingRecord) as totalUsers
      FROM OfferingRecord
    `) as any;

    // 模拟数据
    await seedMockConfig();
    const config = await getMockConfig();
    const mockStats = config ? calcMockStats(config) : { totalOfferings: 0, totalUsers: 0, totalLingzhu: 0, daysDiff: 0 };
    const isActive = config?.isActive ?? true;

    // 基于日期种子的伪随机生成模拟动态（同一天数据一致）
    const today = new Date();
    const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const rand = seededRandom(dateSeed);

    const mockCount = 60;
    const mockItems: any[] = [];
    const prices: Record<string, number> = { '清香': 100, '鲜花': 200, '水果': 300, '素食': 500, '祈福灯': 1000, '香炉': 2000 };
    for (let i = 0; i < mockCount; i++) {
      const nameIdx = Math.floor(rand() * ANON_NAMES.length);
      const itemIdx = Math.floor(rand() * ITEMS.length);
      const item = ITEMS[itemIdx];
      const amount = prices[item] || 100;
      const minutesAgo = Math.floor(rand() * 10080); // 0-7天
      const dedIdx = Math.floor(rand() * (DEDICATIONS.length + 3)); // 可能为空
      const dedication = dedIdx < DEDICATIONS.length ? DEDICATIONS[dedIdx] : '';
      mockItems.push({
        userName: ANON_NAMES[nameIdx],
        itemName: item,
        amount,
        dedication,
        timeAgo: minutesAgo < 1 ? '刚刚' : minutesAgo < 60 ? `${minutesAgo}分钟前` : minutesAgo < 1440 ? `${Math.floor(minutesAgo / 60)}小时前` : `${Math.floor(minutesAgo / 1440)}天前`,
        isReal: false,
      });
    }

    // 混合排序
    const allItems = [...realItems, ...mockItems].sort((a, b) => {
      const ta = a.timeAgo === '刚刚' ? 0 : parseInt(a.timeAgo) || 99999;
      const tb = b.timeAgo === '刚刚' ? 0 : parseInt(b.timeAgo) || 99999;
      return ta - tb;
    });

    return NextResponse.json({
      // 供前台展示：混合数据
      items: allItems,
      stats: {
        totalOfferings: (realStats?.totalOff || 0) + (isActive ? mockStats.totalOfferings : 0),
        totalUsers: (realStats?.totalUsers || 0) + (isActive ? mockStats.totalUsers : 0),
        totalLingzhu: (realStats?.totalLing || 0) + (isActive ? mockStats.totalLingzhu : 0),
      },
      // 分离数据供调试/后台使用
      _debug: {
        mock: {
          stats: isActive ? mockStats : { totalOfferings: 0, totalUsers: 0, totalLingzhu: 0 },
          items: mockItems,
        },
        real: {
          stats: {
            totalOfferings: realStats?.totalOff || 0,
            totalUsers: realStats?.totalUsers || 0,
            totalLingzhu: realStats?.totalLing || 0,
          },
          items: realItems,
        },
      },
    });
  } catch (error: any) {
    console.error('祈福广场获取失败:', error?.message);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}