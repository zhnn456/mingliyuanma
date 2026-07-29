import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const { getCloudflareContext } = require('@opennextjs/cloudflare');
    const ctx = await getCloudflareContext({ async: true });
    const db = ctx.env.DB;

    const records = await db.prepare(`
      SELECT o.id, o.userId, o.itemId, o.amount, o.supplyIds, o.createdAt,
             u.name as userName, i.name as itemName
      FROM OfferingRecord o
      LEFT JOIN User u ON o.userId = u.id
      LEFT JOIN OfferingItem i ON o.itemId = i.id
      ORDER BY o.createdAt DESC LIMIT 30
    `).all() as any;

    const stats = await db.prepare(
      'SELECT COUNT(*) as totalOfferings, COALESCE(SUM(amount),0) as totalLingzhu FROM OfferingRecord'
    ).first() as any;

    const items = (records.results || []).map((r: any) => {
      let dedication = '';
      try { const d = JSON.parse(r.supplyIds || '{}'); dedication = d.dedication || ''; } catch {}
      return {
        id: r.id, userId: r.userId,
        userName: r.userName || '善信',
        itemName: r.itemName || '供奉',
        amount: r.amount || 0, dedication,
        createdAt: r.createdAt,
      };
    });

    return NextResponse.json({
      items,
      totalOfferings: (stats as any)?.totalOfferings || 0,
      totalLingzhu: (stats as any)?.totalLingzhu || 0,
    });
  } catch (error: any) {
    console.error('供奉广场获取失败:', error?.message);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
