import { requireAdmin } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll } from '@/lib/d1';

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) {
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
      totalPaipan,
      paidAgg,
      todayOrders,
      todayUsers,
      totalPoints,
    ] = await Promise.all([
      queryFirst('SELECT COUNT(*) as c FROM User'),
      queryFirst('SELECT COUNT(*) as c FROM "Order"'),
      queryFirst('SELECT COUNT(*) as c FROM BaziRecord'),
      queryFirst('SELECT COUNT(*) as c FROM ZiweiRecord'),
      queryFirst('SELECT COUNT(*) as c FROM QimenRecord'),
      queryFirst('SELECT COUNT(*) as c FROM MeihuaRecord'),
      queryFirst('SELECT COUNT(*) as c FROM OfferingRecord'),
      queryFirst('SELECT COUNT(*) as c FROM BaziRecord') as any,
      queryFirst('SELECT SUM(amount) as total FROM "Order" WHERE status = ?', 'paid'),
      queryFirst("SELECT COUNT(*) as c FROM \"Order\" WHERE DATE(createdAt) = ?", today),
      queryFirst("SELECT COUNT(*) as c FROM User WHERE DATE(createdAt) = ?", today),
      queryFirst('SELECT COALESCE(SUM(balance), 0) as total FROM UserPoints'),
    ] as any[]);

    // 排盘总数 = 四种排盘类型之和
    const baziCount = (totalBazi as any)?.c || 0;
    const ziweiCount = (totalZiwei as any)?.c || 0;
    const qimenCount = (totalQimen as any)?.c || 0;
    const meihuaCount = (totalMeihua as any)?.c || 0;
    const totalPaipanRecords = baziCount + ziweiCount + qimenCount + meihuaCount;

    const totalRevenue = paidAgg?.total || 0;

    // 会员等级分布
    const memberRows = await queryAll('SELECT memberLevel, COUNT(*) as count FROM User GROUP BY memberLevel') as any[];

    // 排盘类型分布
    const paipanTypeStats = [
      { type: '八字', count: baziCount },
      { type: '紫微', count: ziweiCount },
      { type: '奇门', count: qimenCount },
      { type: '梅花', count: meihuaCount },
    ];

    // 最近7天每日订单趋势
    const orderTrend: { date: string; orders: number }[] = [];
    const revenueTrend: { date: string; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      const r = await queryFirst("SELECT COUNT(*) as c FROM \"Order\" WHERE DATE(createdAt) = ?", d) as any;
      const rev = await queryFirst("SELECT SUM(amount) as total FROM \"Order\" WHERE status = 'paid' AND DATE(createdAt) = ?", d) as any;
      orderTrend.push({ date: d, orders: r?.c || 0 });
      revenueTrend.push({ date: d, revenue: rev?.total || 0 });
    }

    // 最新用户（最近注册的5个）
    const recentUsers = await queryAll(
      'SELECT id, name, email, createdAt FROM User ORDER BY createdAt DESC LIMIT 5'
    ) as any[];

    // 最新订单（最近的5个订单）
    const recentOrders = await queryAll(
      `SELECT o.id, o.orderNo, o.type, o.amount, o.status, o.createdAt, u.name as userName, u.email as userEmail
       FROM "Order" o
       LEFT JOIN User u ON o.userId = u.id
       ORDER BY o.createdAt DESC LIMIT 5`
    ) as any[];

    return NextResponse.json({
      stats: {
        totalUsers: (totalUsers as any)?.c || 0,
        totalOrders: (totalOrders as any)?.c || 0,
        totalRevenue,
        todayOrders: (todayOrders as any)?.c || 0,
        todayUsers: (todayUsers as any)?.c || 0,
        totalPaipan: totalPaipanRecords,
        totalPaipanRecords,
        totalOffering: (totalOffering as any)?.c || 0,
        totalOfferingRecords: (totalOffering as any)?.c || 0,
        totalPoints: (totalPoints as any)?.total || 0,
        memberStats: memberRows.map((m: any) => ({ level: m.memberLevel, count: m.count })),
        paipanTypeStats,
        orderTrend,
        revenueTrend,
        dailyOrders: orderTrend.map((o: any) => ({ date: o.date, count: o.orders })),
        recentUsers,
        recentOrders,
      },
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
