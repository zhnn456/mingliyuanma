import { NextRequest, NextResponse } from 'next/server';
import { requireAgent } from '@/lib/auth-server';
import { queryFirst, execute } from '@/lib/d1';
import { listSettlements } from '@/lib/commission';
import { ensureCommissionTables } from '@/lib/d1';

export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAgent(req);
    if (!allowed || !session) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const agent = await queryFirst('SELECT * FROM Agent WHERE userId = ?', session.sub) as any;
    if (!agent) return NextResponse.json({ error: '代理商信息不存在' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const result = await listSettlements(agent.id, status, page, pageSize);

    const stats = await (async () => {
      const pendingRow = await queryFirst(
        `SELECT COALESCE(SUM(netCommission), 0) as total FROM "SettlementRecord" WHERE agentId = ? AND status = 'pending'`,
        agent.id
      ) as any;
      const approvedRow = await queryFirst(
        `SELECT COALESCE(SUM(netCommission), 0) as total FROM "SettlementRecord" WHERE agentId = ? AND status = 'approved'`,
        agent.id
      ) as any;
      const paidRow = await queryFirst(
        `SELECT COALESCE(SUM(netCommission), 0) as total FROM "SettlementRecord" WHERE agentId = ? AND status = 'paid'`,
        agent.id
      ) as any;
      return {
        pendingAmount: pendingRow?.total || 0,
        approvedAmount: approvedRow?.total || 0,
        paidAmount: paidRow?.total || 0,
      };
    })();

    return NextResponse.json({
      settlements: result.settlements,
      total: result.total,
      stats,
    });
  } catch (error) {
    console.error('获取代理商结算列表失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAgent(req);
    if (!allowed || !session) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const agent = await queryFirst('SELECT * FROM Agent WHERE userId = ?', session.sub) as any;
    if (!agent) return NextResponse.json({ error: '代理商信息不存在' }, { status: 404 });

    const body = await req.json();
    const { action } = body;

    if (action === 'apply-withdrawal') {
      const { amount, method, account } = body;
      if (!amount || amount <= 0) return NextResponse.json({ error: '请填写有效金额' }, { status: 400 });
      if (!method) return NextResponse.json({ error: '请选择打款方式' }, { status: 400 });
      if (!account) return NextResponse.json({ error: '请填写收款账户' }, { status: 400 });

      await ensureCommissionTables();

      const pendingSettlement = await queryFirst(
        `SELECT COALESCE(SUM(netCommission), 0) as total FROM "SettlementRecord" WHERE agentId = ? AND status = 'pending'`,
        agent.id
      ) as any;
      const available = pendingSettlement?.total || 0;

      if (amount > available) {
        return NextResponse.json({ error: `可提现金额不足，当前可提现 ¥${available.toFixed(2)}` }, { status: 400 });
      }

      const settlementId = `stw_${Date.now()}`;
      await execute(
        `INSERT INTO "SettlementRecord" (id, agentId, periodStart, periodEnd, orderCount, totalOrderAmount, totalCommission, netCommission, status, paidMethod, paidAccount, createdAt)
         VALUES (?, ?, '', '', 0, 0, ?, ?, 'pending', ?, ?, datetime('now'))`,
        settlementId, agent.id, amount, method, account
      );

      return NextResponse.json({ success: true, settlementId });
    }

    return NextResponse.json({ error: '未知操作' }, { status: 400 });
  } catch (error) {
    console.error('代理商结算操作失败:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}