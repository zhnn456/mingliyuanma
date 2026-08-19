/**
 * 收入趋势API
 * 功能：按时间范围查询付费订单流水，支持自定义日期范围
 * 用途：收入趋势分析、日收入统计
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { queryAll } from '@/lib/d1';

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('range') || '30');
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const paidOrders = await queryAll(
      `SELECT * FROM "Order" WHERE status = 'paid' AND createdAt >= ? ORDER BY createdAt`, since
    ) as any[];
    const refundOrders = await queryAll(
      `SELECT * FROM "Order" WHERE status = 'refunded' AND createdAt >= ? ORDER BY createdAt`, since
    ) as any[];

    const sum = (arr: any[], field: string) => arr.reduce((s, o) => s + (o[field] || 0), 0);
    const totalRevenue = sum(paidOrders, 'amount');
    const refundTotal = sum(refundOrders, 'amount');

    // 将 Date 对象或字符串统一转为 'YYYY-MM-DD' 前缀，便于按日过滤
    const toDayPrefix = (v: any): string => {
      if (!v) return '';
      if (v instanceof Date) return v.toISOString().slice(0, 10);
      return String(v).slice(0, 10);
    };

    const dailyRevenue: { date: string; amount: number; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      const dayOrders = paidOrders.filter((o: any) => toDayPrefix(o.createdAt).startsWith(d));
      dailyRevenue.push({ date: d, amount: sum(dayOrders, 'amount'), count: dayOrders.length });
    }

    const groupBy = (orders: any[], field: string) => {
      const map: Record<string, { amount: number; count: number }> = {};
      orders.forEach((o: any) => {
        const k = o[field] || '未知';
        if (!map[k]) map[k] = { amount: 0, count: 0 };
        map[k].amount += o.amount || 0;
        map[k].count += 1;
      });
      return Object.entries(map).map(([k, v]) => ({ type: k, ...v }));
    };

    const nameMap: Record<string, string> = {
      membership: '会员', offering: '供奉', pdf_report: 'PDF报告',
      wechat: '微信支付', alipay: '支付宝', mock: '模拟支付',
    };

    return NextResponse.json({
      summary: {
        totalRevenue, totalOrders: paidOrders.length,
        avgOrderValue: paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0,
        refundTotal, refundCount: refundOrders.length, netRevenue: totalRevenue - refundTotal,
      },
      dailyRevenue,
      revenueByType: groupBy(paidOrders, 'type').map(r => ({ ...r, typeName: nameMap[r.type] || r.type })),
      revenueByMethod: groupBy(paidOrders, 'paymentMethod').map(r => ({ ...r, methodName: nameMap[r.type] || r.type })),
    });
  } catch (error) {
    console.error('获取收入分析失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
