import { NextRequest, NextResponse } from 'next/server';

// 脱敏名称池
const ANON_NAMES = [
  '善信·慧', '善信·明', '善信·诚', '善信·德', '善信·仁',
  '虔诚·行者', '虔诚·居士', '虔诚·信士', '虔诚·善人',
  '福慧·双修', '福慧·随缘', '福慧·清净',
  '菩提·心', '菩提·愿', '菩提·行',
  '妙音·天', '妙音·海',
  '净心·莲', '净心·禅',
  '如意·珠', '如意·宝',
  '吉祥·云', '吉祥·光',
  '慈悲·喜', '慈悲·舍',
];

const ITEMS = ['清香', '鲜花', '水果', '素食', '供灯', '宝鼎'];

/** 相对时间 */
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
    const { getCloudflareContext } = require('@opennextjs/cloudflare');
    const ctx = await getCloudflareContext({ async: true });
    const db = ctx.env.DB;

    // 查真实记录
    const real = await db.prepare(`
      SELECT o.id, o.userId, o.itemId, o.amount, o.supplyIds, o.createdAt,
             u.name as userName, i.name as itemName
      FROM OfferingRecord o
      LEFT JOIN User u ON o.userId = u.id
      LEFT JOIN OfferingItem i ON o.itemId = i.id
      ORDER BY o.createdAt DESC LIMIT 20
    `).all() as any;

    const realItems = (real.results || []).map((r: any) => {
      let dedication = '';
      try { const d = JSON.parse(r.supplyIds || '{}'); dedication = d.dedication || ''; } catch {}
      return {
        userName: r.userName || '善信',
        itemName: r.itemName || '供奉',
        amount: r.amount || 0,
        dedication,
        timeAgo: timeAgo(r.createdAt),
        isReal: true,
      };
    });

    // 统计
    const stats = await db.prepare(`
      SELECT COUNT(*) as totalOff, COALESCE(SUM(amount),0) as totalLing,
             (SELECT COUNT(DISTINCT userId) FROM OfferingRecord) as totalUsers
      FROM OfferingRecord
    `).first() as any;
    const totalOff = (stats as any)?.totalOff || 0;
    const totalLing = (stats as any)?.totalLing || 0;
    const totalUsers = (stats as any)?.totalUsers || 0;

    // 模拟数据 - 虚构更多供奉记录，脱敏展示
    const fakeCount = Math.max(50, 100 - realItems.length);
    const fakeItems = [];
    const now = Date.now();
    for (let i = 0; i < fakeCount; i++) {
      const name = ANON_NAMES[Math.floor(Math.random() * ANON_NAMES.length)];
      const item = ITEMS[Math.floor(Math.random() * ITEMS.length)];
      const prices: Record<string, number> = { '清香': 100, '鲜花': 200, '水果': 300, '素食': 500, '供灯': 1000, '宝鼎': 2000 };
      const amount = prices[item] || 100;
      const minutesAgo = Math.floor(Math.random() * 10080); // 随机7天内
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

    // 合并真实+模拟，混排按时间排序
    const allItems = [...realItems, ...fakeItems].sort((a, b) => {
      const ta = a.timeAgo === '刚刚' ? 0 : parseInt(a.timeAgo) || 99999;
      const tb = b.timeAgo === '刚刚' ? 0 : parseInt(b.timeAgo) || 99999;
      return ta - tb;
    });

    return NextResponse.json({
      items: allItems,
      stats: {
        totalOfferings: totalOff + fakeCount,
        totalUsers: totalUsers + 18, // 虚构人数
        totalLingzhu: totalLing + fakeItems.reduce((s, i) => s + i.amount, 0),
        realCount: realItems.length,
        fakeCount,
      },
    });
  } catch (error: any) {
    console.error('供奉广场获取失败:', error?.message);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
