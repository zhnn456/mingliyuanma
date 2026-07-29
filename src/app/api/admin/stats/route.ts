import { requireAdmin, requireAgent, requireAuth } from '@/lib/security';
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll } from '@/lib/d1';

export async function GET() {
  try {
    const { allowed, session } = await requireAdmin();
    if (!session || session?.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const today = new Date().toISOString().split('T')[0];

    const [
      totalUsers,
      totalOrders,
      totalBazi,
      totalZiwei,
      totalQimen,
      totalMeihua,
      totalOffering,
      paidAgg,
      todayOrders,
      todayUsers,
    ] = await Promise.all([
      queryFirst('SELECT COUNT(*) as c FROM User'),
      queryFirst('SELECT COUNT(*) as c FROM "Order"'),
      queryFirst('SELECT COUNT(*) as c FROM BaziRecord'),
      queryFirst('SELECT COUNT(*) as c FROM ZiweiRecord'),
      queryFirst('SELECT COUNT(*) as c FROM QimenRecord'),
      queryFirst('SELECT COUNT(*) as c FROM MeihuaRecord'),
      queryFirst('SELECT COUNT(*) as c FROM OfferingRecord'),
      queryFirst('SELECT SUM(amount) as total FROM "Order" WHERE status = ?', 'paid'),
      queryFirst("SELECT COUNT(*) as c FROM \"Order\" WHERE DATE(createdAt) = ?", today),
      queryFirst("SELECT COUNT(*) as c FROM User WHERE DATE(createdAt) = ?", today),
    ] as any[]);

    const totalRevenue = paidAgg?.total || 0;

    // 会员等级分布
    const memberRows = await queryAll('SELECT memberLevel, COUNT(*) as count FROM User GROUP BY memberLevel') as any[];

    // 最近7天每日订单趋势
    const last7Days: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      const r = await queryFirst("SELECT COUNT(*) as c FROM \"Order\" WHERE DATE(createdAt) = ?", d) as any;
      last7Days.push({ date: d, count: r?.c || 0 });
    }

    return NextResponse.json({
      stats: {
        totalUsers: (totalUsers as any)?.c || 0,
        totalOrders: (totalOrders as any)?.c || 0,
        totalRevenue,
        todayOrders: (todayOrders as any)?.c || 0,
        todayUsers: (todayUsers as any)?.c || 0,
        totalBaziRecords: (totalBazi as any)?.c || 0,
        totalZiweiRecords: (totalZiwei as any)?.c || 0,
        totalQimenRecords: (totalQimen as any)?.c || 0,
        totalMeihuaRecords: (totalMeihua as any)?.c || 0,
        totalOfferingRecords: (totalOffering as any)?.c || 0,
        memberStats: memberRows.map((m: any) => ({ level: m.memberLevel, count: m.count })),
        dailyOrders: last7Days,
      },
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
