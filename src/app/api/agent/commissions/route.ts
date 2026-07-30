import { NextRequest, NextResponse } from 'next/server';
import { requireAgent } from '@/lib/auth-server';
import { queryFirst } from '@/lib/d1';
import { listCommissionRecords, getAgentCommissionStats } from '@/lib/commission';

export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAgent(req);
    if (!allowed || !session) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const agent = await queryFirst('SELECT * FROM Agent WHERE userId = ?', session.sub) as any;
    if (!agent) return NextResponse.json({ error: '代理商信息不存在' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const productType = searchParams.get('productType') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const [result, stats] = await Promise.all([
      listCommissionRecords({ agentId: agent.id, status, productType, startDate, endDate, page, pageSize }),
      getAgentCommissionStats(agent.id),
    ]);

    return NextResponse.json({
      records: result.records,
      total: result.total,
      stats: {
        pendingCommission: stats.pendingCommission,
        settledCommission: stats.settledCommission,
        monthCommission: stats.monthCommission,
        totalCommission: stats.totalCommission,
      },
    });
  } catch (error) {
    console.error('获取代理商分润记录失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}