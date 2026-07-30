import { requireAdmin } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll, ensureCommissionTables } from '@/lib/d1';
import { listSettlements, generateWeeklySettlement, approveSettlement, markSettlementPaid } from '@/lib/commission';

async function ensureTable() {
  await ensureCommissionTables();
}

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();

    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId') || undefined;
    const status = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const [listResult, statsResult] = await Promise.all([
      listSettlements(agentId, status, page, pageSize),
      queryFirst(
        `SELECT
           COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendingCount,
           COALESCE(SUM(CASE WHEN status = 'pending' THEN netCommission ELSE 0 END), 0) as pendingAmount,
           COALESCE(SUM(CASE WHEN status = 'approved' THEN netCommission ELSE 0 END), 0) as approvedAmount,
           COALESCE(SUM(CASE WHEN status = 'paid' THEN netCommission ELSE 0 END), 0) as paidAmount
         FROM "SettlementRecord"`
      ) as any,
    ]);

    return NextResponse.json({
      settlements: listResult.settlements,
      total: listResult.total,
      page: listResult.page,
      pageSize: listResult.pageSize,
      stats: {
        pendingSettlementCount: statsResult?.pendingCount || 0,
        pendingAmount: statsResult?.pendingAmount || 0,
        approvedAmount: statsResult?.approvedAmount || 0,
        paidAmount: statsResult?.paidAmount || 0,
      },
    });
  } catch (error) {
    console.error('获取结算列表失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();

    const body = await req.json();
    const { action } = body;

    if (action === 'generate') {
      const { weekStart, weekEnd } = body;
      if (!weekStart || !weekEnd) {
        return NextResponse.json({ error: '请选择结算周期' }, { status: 400 });
      }

      const agents = await queryAll('SELECT id FROM "Agent" WHERE isActive = 1') as any[];
      if (agents.length === 0) {
        return NextResponse.json({ error: '没有活跃的代理商' }, { status: 400 });
      }

      const results: any[] = [];
      for (const agent of agents) {
        try {
          const result = await generateWeeklySettlement(agent.id, weekStart, weekEnd);
          if (result) results.push(result);
        } catch (e) {
          console.error(`生成 ${agent.id} 结算失败:`, e);
        }
      }

      return NextResponse.json({
        success: true,
        generatedCount: results.length,
        results,
      });
    }

    if (action === 'generate-for-agent') {
      const { agentId, weekStart, weekEnd } = body;
      if (!agentId || !weekStart || !weekEnd) {
        return NextResponse.json({ error: '参数不足' }, { status: 400 });
      }

      const result = await generateWeeklySettlement(agentId, weekStart, weekEnd);
      if (!result) {
        return NextResponse.json({ error: '该代理商此周期没有待结算分润' }, { status: 400 });
      }
      return NextResponse.json({ success: true, ...result });
    }

    if (action === 'approve') {
      const { settlementId, remark } = body;
      if (!settlementId) return NextResponse.json({ error: '缺少结算单ID' }, { status: 400 });

      await approveSettlement(settlementId, 'approve', session.sub || session.id, remark);
      return NextResponse.json({ success: true });
    }

    if (action === 'reject') {
      const { settlementId, remark } = body;
      if (!settlementId) return NextResponse.json({ error: '缺少结算单ID' }, { status: 400 });

      await approveSettlement(settlementId, 'reject', session.sub || session.id, remark);
      return NextResponse.json({ success: true });
    }

    if (action === 'mark-paid') {
      const { settlementId, paidMethod, paidAccount } = body;
      if (!settlementId) return NextResponse.json({ error: '缺少结算单ID' }, { status: 400 });
      if (!paidMethod || !paidAccount) {
        return NextResponse.json({ error: '支付方式和账号为必填项' }, { status: 400 });
      }

      await markSettlementPaid(settlementId, paidMethod, paidAccount);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: '无效的操作' }, { status: 400 });
  } catch (error: any) {
    console.error('结算操作失败:', error);
    return NextResponse.json({ error: error.message || '操作失败' }, { status: 500 });
  }
}