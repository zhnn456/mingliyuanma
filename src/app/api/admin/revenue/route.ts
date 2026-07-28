import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/security';

/**
 * 收入分析
 * GET /api/admin/revenue?range=30
 * 返回：总收入、日收入趋势、按类型分类收入、按支付方式分类
 */
export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin();
    if (!allowed) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const rangeDays = parseInt(searchParams.get('range') || '30');

    const now = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - rangeDays);

    // 已支付订单
    const paidOrders = await prisma.order.findMany({
      where: {
        status: 'paid',
        paidAt: { gte: startDate },
      },
      orderBy: { paidAt: 'desc' },
    });

    // 总收入
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.amount, 0);

    // 日收入趋势
    const dailyRevenue: { date: string; amount: number; count: number }[] = [];
    for (let i = rangeDays - 1; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayOrders = paidOrders.filter(o =>
        o.paidAt && o.paidAt >= day && o.paidAt < nextDay
      );

      dailyRevenue.push({
        date: day.toISOString().split('T')[0],
        amount: dayOrders.reduce((sum, o) => sum + o.amount, 0),
        count: dayOrders.length,
      });
    }

    // 按类型分类
    const revenueByType: Record<string, { amount: number; count: number }> = {};
    paidOrders.forEach(o => {
      const type = o.type || 'other';
      if (!revenueByType[type]) revenueByType[type] = { amount: 0, count: 0 };
      revenueByType[type].amount += o.amount;
      revenueByType[type].count++;
    });

    // 按支付方式分类
    const revenueByMethod: Record<string, { amount: number; count: number }> = {};
    paidOrders.forEach(o => {
      const method = o.paymentMethod || 'unknown';
      if (!revenueByMethod[method]) revenueByMethod[method] = { amount: 0, count: 0 };
      revenueByMethod[method].amount += o.amount;
      revenueByMethod[method].count++;
    });

    // 会员等级收入分布
    const membershipRevenue = paidOrders
      .filter(o => o.type === 'membership')
      .reduce((acc, o) => {
        const level = o.targetId || 'unknown';
        if (!acc[level]) acc[level] = { amount: 0, count: 0 };
        acc[level].amount += o.amount;
        acc[level].count++;
        return acc;
      }, {} as Record<string, { amount: number; count: number }>);

    // 退款统计
    const refundedOrders = await prisma.order.findMany({
      where: {
        status: 'refunded',
        updatedAt: { gte: startDate },
      },
    });
    const refundTotal = refundedOrders.reduce((sum, o) => sum + o.amount, 0);

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalOrders: paidOrders.length,
        avgOrderValue: paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0,
        refundTotal,
        refundCount: refundedOrders.length,
        netRevenue: totalRevenue - refundTotal,
      },
      dailyRevenue,
      revenueByType: Object.entries(revenueByType).map(([type, data]) => ({
        type,
        typeName: type === 'membership' ? '会员' : type === 'offering' ? '供奉' : type === 'pdf_report' ? 'PDF报告' : type,
        ...data,
      })),
      revenueByMethod: Object.entries(revenueByMethod).map(([method, data]) => ({
        method,
        methodName: method === 'wechat' ? '微信支付' : method === 'alipay' ? '支付宝' : method === 'mock' ? '测试' : method,
        ...data,
      })),
      membershipRevenue: Object.entries(membershipRevenue).map(([level, data]) => ({
        level,
        levelName: level === 'monthly' ? '月卡' : level === 'yearly' ? '年卡' : level === 'lifetime' ? '终身' : level,
        ...data,
      })),
    });
  } catch (error) {
    console.error('获取收入分析失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
