import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalOrders,
      totalBaziRecords,
      totalZiweiRecords,
      totalQimenRecords,
      totalMeihuaRecords,
      totalOfferingRecords,
      paidOrders,
      todayOrders,
      todayUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.baziRecord.count(),
      prisma.ziweiRecord.count(),
      prisma.qimenRecord.count(),
      prisma.meihuaRecord.count(),
      prisma.offeringRecord.count(),
      prisma.order.aggregate({ where: { status: 'paid' }, _sum: { amount: true } }),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
    ]);

    const totalRevenue = paidOrders._sum.amount || 0;

    // 会员等级分布
    const memberStats = await prisma.user.groupBy({
      by: ['memberLevel'],
      _count: true,
    });

    // 最近7天每日订单趋势
    const last7Days: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      const count = await prisma.order.count({
        where: { createdAt: { gte: day, lt: nextDay } },
      });
      last7Days.push({ date: day.toISOString().split('T')[0], count });
    }

    return NextResponse.json({
      stats: {
        totalUsers,
        totalOrders,
        totalRevenue,
        todayOrders,
        todayUsers,
        totalBaziRecords,
        totalZiweiRecords,
        totalQimenRecords,
        totalMeihuaRecords,
        totalOfferingRecords,
        memberStats: memberStats.map((m) => ({ level: m.memberLevel, count: m._count })),
        dailyOrders: last7Days,
      },
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
