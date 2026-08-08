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

    // BigInt 序列化转换
    const serialize = (obj: any) => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj === 'bigint') return Number(obj);
      if (Array.isArray(obj)) return obj.map(serialize);
      if (typeof obj === 'object') {
        const out: any = {};
        for (const [k, v] of Object.entries(obj)) out[k] = serialize(v);
        return out;
      }
      return obj;
    };

    return NextResponse.json({
      records: serialize(result.records),
      total: Number(result.total || 0),
      stats: {
        pendingCommission: Number(stats.pendingCommission || 0),
        settledCommission: Number(stats.settledCommission || 0),
        monthCommission: Number(stats.monthCommission || 0),
        totalCommission: Number(stats.totalCommission || 0),
      },
    });
  } catch (error) {
    console.error('获取代理商分润记录失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}