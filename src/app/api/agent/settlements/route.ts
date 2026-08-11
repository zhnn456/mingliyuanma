import { NextRequest, NextResponse } from 'next/server';
import { requireAgent } from '@/lib/auth-server';
import { queryFirst, queryAll, execute, ensureCommissionTables } from '@/lib/d1';

/**
 * 代理商结算 API
 * - GET: 查询自己的结算列表（从 SettlementRecord 表）
 * - POST: 申请结算（写入 SettlementRecord，更新 CommissionRecord 为 settling）
 *
 * 统一使用 SettlementRecord 表（与管理后台一致）
 */

export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAgent(req);
    if (!allowed || !session) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    await ensureCommissionTables();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || '';

    // 代理商只能看自己的结算单
    const agent = await queryFirst('SELECT id, pendingCommission, settledCommission FROM Agent WHERE userId = ?', session.sub) as any;
    if (!agent) {
      return NextResponse.json({ error: '代理商信息不存在' }, { status: 404 });
    }

    // 查询结算列表
    let where = 'agentId = ?';
    const params: any[] = [agent.id];
    if (status) {
      where += ' AND status = ?';
      params.push(status);
    }

    const settlements = await queryAll(
      `SELECT * FROM SettlementRecord WHERE ${where} ORDER BY createdAt DESC LIMIT 50`,
      ...params
    ) as any[];

    // 统计待结算和已结算金额
    const pendingRow = await queryFirst(
      'SELECT COALESCE(SUM(totalCommission), 0) as total, COUNT(*) as count FROM CommissionRecord WHERE agentId = ? AND status = ?',
      agent.id, 'pending'
    ) as any;

    const stats = {
      pendingAmount: Number(pendingRow?.total || 0),
      pendingCount: Number(pendingRow?.count || 0),
      settledAmount: Number(agent.settledCommission || 0),
      settlementCount: settlements.length,
    };

    return NextResponse.json({
      settlements,
      stats,
    });
  } catch (err: any) {
    console.error('查询结算列表失败:', err?.message);
    return NextResponse.json({ error: err?.message || '查询失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAgent(req);
    if (!allowed || !session) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    await ensureCommissionTables();

    const body = await req.json();
    const action = body.action;

    const agent = await queryFirst('SELECT id FROM Agent WHERE userId = ?', session.sub) as any;
    if (!agent) {
      return NextResponse.json({ error: '代理商信息不存在' }, { status: 404 });
    }

    if (action === 'apply') {
      const { period } = body;
      return applySettlement(agent.id, period);
    }

    return NextResponse.json({ error: '未知操作' }, { status: 400 });
  } catch (err: any) {
    console.error('结算操作失败:', err?.message);
    return NextResponse.json({ error: err?.message || '操作失败' }, { status: 500 });
  }
}

async function applySettlement(agentId: string, period: string) {
  // 计算待结算金额
  const pending = await queryFirst(
    `SELECT COALESCE(SUM(totalCommission), 0) as total, COALESCE(SUM(orderAmount), 0) as orderTotal, COUNT(*) as count
     FROM CommissionRecord
     WHERE agentId = ? AND status = 'pending'`,
    agentId
  ) as any;

  const totalAmount = Number(pending?.total || 0);
  const orderTotal = Number(pending?.orderTotal || 0);
  const count = Number(pending?.count || 0);

  if (count === 0 || totalAmount <= 0) {
    return NextResponse.json({ error: '没有可结算的分润' }, { status: 400 });
  }

  const settlementId = `set_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const periodStr = period || new Date().toISOString().slice(0, 7);

  // 写入 SettlementRecord 表（统一结算表）
  await execute(
    `INSERT INTO SettlementRecord (id, agentId, periodStart, periodEnd, orderCount, totalOrderAmount, totalCommission, netCommission, status, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))`,
    settlementId, agentId, periodStr, now,
    count, orderTotal, totalAmount, Math.round(totalAmount * 100) / 100
  );

  // 更新分润记录状态为 settling（待结算审批中）
  await execute(
    `UPDATE CommissionRecord SET status = 'settling', settlementId = ?
     WHERE agentId = ? AND status = 'pending'`,
    settlementId, agentId
  );

  return NextResponse.json({
    success: true,
    settlementId,
    amount: totalAmount,
    count,
    message: `已提交结算申请 ¥${totalAmount.toFixed(2)}`,
  });
}
