/**
 * 佣金记录查询API
 * 功能：查询各代理商佣金明细、平台佣金统计、佣金追回
 * 用途：佣金对账、财务审计、异常佣金处理
 */
import { requireAdmin } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { listCommissionRecords, getPlatformCommissionStats, clawbackCommission } from '@/lib/commission';
import { auditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const params = {
      agentId: searchParams.get('agentId') || undefined,
      productType: searchParams.get('productType') || undefined,
      status: searchParams.get('status') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      keyword: searchParams.get('keyword') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '20'),
    };

    const [listResult, stats] = await Promise.all([
      listCommissionRecords(params),
      getPlatformCommissionStats(),
    ]);

    return NextResponse.json({
      records: listResult.records,
      total: listResult.total,
      page: listResult.page,
      pageSize: listResult.pageSize,
      stats: {
        totalCommission: stats.totalCommission,
        monthCommission: stats.monthCommission,
        pendingCommission: stats.pendingCommission,
        clawbackAmount: stats.clawbackAmount,
      },
    });
  } catch (error) {
    console.error('获取分润记录失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const body = await req.json();
    const { action, orderId } = body;

    if (action === 'clawback') {
      if (!orderId) return NextResponse.json({ error: '缺少订单ID' }, { status: 400 });

      const count = await clawbackCommission(orderId);
      await auditLog({
        userId: session?.sub,
        action: 'admin_clawback_commission',
        details: { orderId, clawedBackCount: count },
        status: 'success',
      });
      return NextResponse.json({ success: true, clawedBackCount: count });
    }

    return NextResponse.json({ error: '无效的操作' }, { status: 400 });
  } catch (error) {
    console.error('分润操作失败:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}