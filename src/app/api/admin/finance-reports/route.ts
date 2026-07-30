import { requireAdmin } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll } from '@/lib/d1';

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'monthly';
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    let dateCondition = '';
    const params: any[] = [];

    if (type === 'custom' && startDate && endDate) {
      dateCondition = 'WHERE o."createdAt" >= ? AND o."createdAt" <= ?';
      params.push(startDate + 'T00:00:00.000Z', endDate + 'T23:59:59.999Z');
    } else if (type === 'yearly') {
      dateCondition = 'WHERE o."createdAt" >= ? AND o."createdAt" <= ?';
      params.push(`${year}-01-01T00:00:00.000Z`, `${year}-12-31T23:59:59.999Z`);
    } else {
      const lastDay = new Date(year, month, 0).getDate();
      dateCondition = 'WHERE o."createdAt" >= ? AND o."createdAt" <= ?';
      params.push(
        `${year}-${String(month).padStart(2, '0')}-01T00:00:00.000Z`,
        `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59.999Z`
      );
    }

    const ordersSql = `SELECT o.* FROM "Order" o ${dateCondition}`;
    const orders = await queryAll(ordersSql, ...params);

    const paidOrders = orders.filter((o: any) => o.status === 'paid');
    const refundedOrders = orders.filter((o: any) => o.status === 'refunded');

    const totalRevenue = paidOrders.reduce((sum: number, o: any) => sum + (o.amount || 0), 0);
    const refundAmount = refundedOrders.reduce((sum: number, o: any) => sum + (o.amount || 0), 0);
    const refundCount = refundedOrders.length;
    const totalOrderCount = orders.length;
    const refundRate = totalOrderCount > 0 ? (refundCount / totalOrderCount) * 100 : 0;

    let newUserCount = 0;
    if (type === 'custom' && startDate && endDate) {
      const userRow = await queryFirst(
        'SELECT COUNT(*) as cnt FROM "User" WHERE "createdAt" >= ? AND "createdAt" <= ?',
        startDate + 'T00:00:00.000Z',
        endDate + 'T23:59:59.999Z'
      ) as any;
      newUserCount = userRow?.cnt || 0;
    } else if (type === 'yearly') {
      const userRow = await queryFirst(
        'SELECT COUNT(*) as cnt FROM "User" WHERE "createdAt" >= ? AND "createdAt" <= ?',
        `${year}-01-01T00:00:00.000Z`,
        `${year}-12-31T23:59:59.999Z`
      ) as any;
      newUserCount = userRow?.cnt || 0;
    } else {
      const lastDay = new Date(year, month, 0).getDate();
      const userRow = await queryFirst(
        'SELECT COUNT(*) as cnt FROM "User" WHERE "createdAt" >= ? AND "createdAt" <= ?',
        `${year}-${String(month).padStart(2, '0')}-01T00:00:00.000Z`,
        `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59.999Z`
      ) as any;
      newUserCount = userRow?.cnt || 0;
    }

    const typeMap: Record<string, number> = {};
    paidOrders.forEach((o: any) => {
      const t = o.type || 'unknown';
      if (!typeMap[t]) typeMap[t] = 0;
      typeMap[t] += o.amount || 0;
    });

    const paymentMap: Record<string, number> = {};
    const paymentOrders = orders.filter((o: any) => o.status !== 'failed');
    paymentOrders.forEach((o: any) => {
      const p = o.paymentMethod || 'unknown';
      if (!paymentMap[p]) paymentMap[p] = 0;
      if (o.status === 'refunded') {
        const refundRow = queryFirst(
          'SELECT refundAmount FROM Payment WHERE orderId = ?',
          o.id
        ).catch(() => null);
        paymentMap[p] += o.amount || 0;
      } else {
        paymentMap[p] += o.amount || 0;
      }
    });

    let monthlyComparison: any[] = [];
    if (type === 'yearly') {
      monthlyComparison = await buildMonthlyComparison(year);
    } else {
      monthlyComparison = await buildMonthlyComparison(year);
    }

    const summary = {
      totalRevenue,
      orderCount: totalOrderCount,
      refundCount,
      refundAmount,
      refundRate: parseFloat(refundRate.toFixed(2)),
      newUserCount,
      profitEstimate: parseFloat((totalRevenue - refundAmount).toFixed(2)),
    };

    const byType = Object.entries(typeMap).map(([type, amount]) => ({
      type,
      amount: parseFloat(amount.toFixed(2)),
    }));

    const byPayment = Object.entries(paymentMap).map(([method, amount]) => ({
      method,
      amount: parseFloat(amount.toFixed(2)),
    }));

    return NextResponse.json({
      type,
      year,
      month: type === 'monthly' ? month : null,
      summary,
      monthlyComparison,
      byType,
      byPayment,
      startDate: type === 'custom' ? startDate : null,
      endDate: type === 'custom' ? endDate : null,
    });
  } catch (error) {
    console.error('获取财务报表失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

async function buildMonthlyComparison(year: number): Promise<any[]> {
  const months: any[] = [];
  for (let m = 1; m <= 12; m++) {
    const lastDay = new Date(year, m, 0).getDate();
    const startOfMonth = `${year}-${String(m).padStart(2, '0')}-01T00:00:00.000Z`;
    const endOfMonth = `${year}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59.999Z`;

    const orders = await queryAll(
      'SELECT * FROM "Order" WHERE "createdAt" >= ? AND "createdAt" <= ?',
      startOfMonth, endOfMonth
    );

    const paidOrders = orders.filter((o: any) => o.status === 'paid');
    const refundedOrders = orders.filter((o: any) => o.status === 'refunded');
    const monthRevenue = paidOrders.reduce((sum: number, o: any) => sum + (o.amount || 0), 0);
    const monthRefundAmount = refundedOrders.reduce((sum: number, o: any) => sum + (o.amount || 0), 0);

    const userRow = await queryFirst(
      'SELECT COUNT(*) as cnt FROM "User" WHERE "createdAt" >= ? AND "createdAt" <= ?',
      startOfMonth, endOfMonth
    ) as any;

    months.push({
      month: `${year}-${String(m).padStart(2, '0')}`,
      revenue: parseFloat(monthRevenue.toFixed(2)),
      orderCount: orders.length,
      refundCount: refundedOrders.length,
      refundAmount: parseFloat(monthRefundAmount.toFixed(2)),
      newUsers: userRow?.cnt || 0,
    });
  }

  for (let i = months.length - 1; i > 0; i--) {
    const current = months[i].revenue;
    const prev = months[i - 1].revenue;
    if (prev > 0) {
      months[i].revenueChange = parseFloat(((current - prev) / prev * 100).toFixed(2));
    } else if (current > 0) {
      months[i].revenueChange = 100;
    } else {
      months[i].revenueChange = 0;
    }
  }
  if (months.length > 0) {
    months[0].revenueChange = null;
  }

  return months;
}