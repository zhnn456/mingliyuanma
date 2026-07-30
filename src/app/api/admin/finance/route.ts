import { requireAdmin } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll } from '@/lib/d1';

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    let rangeStart: Date;
    let rangeEnd: Date = new Date(now);
    rangeEnd.setHours(23, 59, 59, 999);

    if (startDateParam && endDateParam) {
      rangeStart = new Date(startDateParam);
      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd = new Date(endDateParam);
      rangeEnd.setHours(23, 59, 59, 999);
    } else {
      rangeStart = new Date(now.getTime() - (days - 1) * 86400000);
      rangeStart.setHours(0, 0, 0, 0);
    }

    const startStr = rangeStart.toISOString().split('T')[0];
    const endStr = rangeEnd.toISOString().split('T')[0];

    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
    const weekStart = new Date(now.getTime() - (dayOfWeek - 1) * 86400000);
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthStartStr = monthStart.toISOString().split('T')[0];

    const [
      todayRev,
      weekRev,
      monthRev,
      totalRev,
      totalOrdersRow,
      refundRow,
      typeRows,
      paymentRows,
      payingUsersRow,
    ] = await Promise.all([
      queryFirst(
        "SELECT COALESCE(SUM(amount), 0) as total FROM \"Order\" WHERE status = 'paid' AND DATE(COALESCE(paidAt, createdAt)) = ?",
        today
      ),
      queryFirst(
        "SELECT COALESCE(SUM(amount), 0) as total FROM \"Order\" WHERE status = 'paid' AND DATE(COALESCE(paidAt, createdAt)) >= ? AND DATE(COALESCE(paidAt, createdAt)) <= ?",
        weekStartStr, today
      ),
      queryFirst(
        "SELECT COALESCE(SUM(amount), 0) as total FROM \"Order\" WHERE status = 'paid' AND DATE(COALESCE(paidAt, createdAt)) >= ? AND DATE(COALESCE(paidAt, createdAt)) <= ?",
        monthStartStr, today
      ),
      queryFirst(
        "SELECT COALESCE(SUM(amount), 0) as total FROM \"Order\" WHERE status = 'paid'"
      ),
      queryFirst(
        "SELECT COUNT(*) as cnt FROM \"Order\" WHERE status = 'paid'"
      ),
      queryFirst(
        `SELECT
           COUNT(*) as totalOrders,
           SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END) as refundedOrders,
           COALESCE(SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END), 0) as refundAmount
         FROM "Order"
         WHERE status = 'paid' OR status = 'refunded'`
      ),
      queryAll(
        `SELECT type, COALESCE(SUM(amount), 0) as amount, COUNT(*) as count
         FROM "Order"
         WHERE status = 'paid'
         GROUP BY type`
      ),
      queryAll(
        `SELECT paymentMethod, COALESCE(SUM(amount), 0) as amount, COUNT(*) as count
         FROM "Order"
         WHERE status = 'paid' AND paymentMethod IS NOT NULL
         GROUP BY paymentMethod`
      ),
      queryFirst(
        "SELECT COUNT(DISTINCT userId) as cnt FROM \"Order\" WHERE status = 'paid'"
      ),
    ] as any[]);

    const totalRevenue = totalRev?.total || 0;
    const todayRevenue = todayRev?.total || 0;
    const weekRevenue = weekRev?.total || 0;
    const monthRevenue = monthRev?.total || 0;
    const totalOrders = totalOrdersRow?.cnt || 0;
    const refundedOrders = refundRow?.refundedOrders || 0;
    const refundAmount = refundRow?.refundAmount || 0;
    const refundRate = totalOrders > 0 ? (refundedOrders / totalOrders) * 100 : 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const payingUsers = payingUsersRow?.cnt || 0;

    const totalByType = typeRows.reduce((s: number, r: any) => s + (r.amount || 0), 0) || 1;
    const revenueByType = typeRows.map((r: any) => ({
      type: r.type,
      amount: r.amount || 0,
      count: r.count || 0,
      percentage: Math.round(((r.amount || 0) / totalByType) * 10000) / 100,
    }));

    const totalByPayment = paymentRows.reduce((s: number, r: any) => s + (r.amount || 0), 0) || 1;
    const revenueByPaymentMethod = paymentRows.map((r: any) => ({
      method: r.paymentMethod,
      amount: r.amount || 0,
      count: r.count || 0,
      percentage: Math.round(((r.amount || 0) / totalByPayment) * 10000) / 100,
    }));

    const trendDays = days;
    const revenueTrend: { date: string; revenue: number; orders: number; avgOrderValue: number }[] = [];
    for (let i = trendDays - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      const dayRev = await queryFirst(
        "SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as cnt FROM \"Order\" WHERE status = 'paid' AND DATE(COALESCE(paidAt, createdAt)) = ?",
        dateStr
      ) as any;
      const rev = dayRev?.total || 0;
      const ords = dayRev?.cnt || 0;
      revenueTrend.push({
        date: dateStr,
        revenue: rev,
        orders: ords,
        avgOrderValue: ords > 0 ? Math.round((rev / ords) * 100) / 100 : 0,
      });
    }

    return NextResponse.json({
      todayRevenue: Math.round(todayRevenue * 100) / 100,
      weekRevenue: Math.round(weekRevenue * 100) / 100,
      monthRevenue: Math.round(monthRevenue * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      payingUsers,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      refundRate: Math.round(refundRate * 100) / 100,
      refundedOrders,
      refundAmount: Math.round(refundAmount * 100) / 100,
      revenueByType,
      revenueByPaymentMethod,
      revenueTrend,
      range: { start: startStr, end: endStr, days: trendDays },
    });
  } catch (error) {
    console.error('获取财务统计失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}