import { NextRequest, NextResponse } from 'next/server';
import { requireAgent, requireAdmin } from '@/lib/auth-server';
import { queryFirst, queryAll, execute } from '@/lib/d1';
import { getSettlementPeriod, formatPeriod } from '@/lib/commission-engine';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId') || '';
    const period = searchParams.get('period') || '';
    const status = searchParams.get('status') || '';

    const conditions: string[] = [];
    const params: any[] = [];

    if (agentId) {
      conditions.push('agentId = ?');
      params.push(agentId);
    }

    if (period) {
      const [year, month] = period.split('-');
      conditions.push(`strftime('%Y-%m', createdAt) = ?`);
      params.push(`${year}-${month.padStart(2, '0')}`);
    }

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const records = await queryAll(
      `SELECT id, agentId, orderId, orderAmount, commissionRate, commissionAmount, status, period, createdAt
       FROM CommissionRecord
       ${whereClause}
       ORDER BY createdAt DESC
       LIMIT 100`,
      ...params
    ) as any[];

    // 统计各状态金额
    const stats = {
      pending: 0,
      settled: 0,
      cancelled: 0,
    };

    records.forEach((r: any) => {
      if (r.status === 'pending') stats.pending += r.commissionAmount;
      else if (r.status === 'settled') stats.settled += r.commissionAmount;
      else if (r.status === 'cancelled') stats.cancelled += r.commissionAmount;
    });

    return NextResponse.json({
      records,
      stats,
      total: records.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || '查询失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, agentId, period, settlementId } = body;

    if (action === 'apply_settlement') {
      return applySettlement(agentId, period);
    }

    if (action === 'approve_settlement') {
      return approveSettlement(settlementId);
    }

    if (action === 'reject_settlement') {
      return rejectSettlement(settlementId);
    }

    if (action === 'mark_settled') {
      return markSettled(settlementId);
    }

    return NextResponse.json({ error: '未知操作' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || '操作失败' }, { status: 500 });
  }
}

async function applySettlement(agentId: string, period: string) {
  // 计算该周期待结算金额
  const pendingCommissions = await queryAll(
    `SELECT SUM(commissionAmount) as total, COUNT(*) as count
     FROM CommissionRecord
     WHERE agentId = ? AND status = 'pending'`,
    agentId
  ) as any;

  const totalAmount = pendingCommissions[0]?.total || 0;
  const count = pendingCommissions[0]?.count || 0;

  if (count === 0 || totalAmount <= 0) {
    return NextResponse.json({ error: '没有可结算的分润' }, { status: 400 });
  }

  // 创建结算单
  const settlementId = `set_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  await execute(
    `INSERT INTO Settlement (id, agentId, period, amount, status, note, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)`,
    settlementId, agentId, period, totalAmount,
    `申请结算（${count}笔分润）`, now, now
  );

  // 更新分润记录状态为结算中
  await execute(
    `UPDATE CommissionRecord SET status = 'settling', period = ?, updatedAt = ?
     WHERE agentId = ? AND status = 'pending'`,
    period, now, agentId
  );

  return NextResponse.json({
    success: true,
    settlementId,
    amount: totalAmount,
    count,
    message: `已提交结算申请：${formatPeriod(period)} ¥${totalAmount.toFixed(2)}`,
  });
}

async function approveSettlement(settlementId: string) {
  const now = new Date().toISOString();

  await execute(
    `UPDATE Settlement SET status = 'approved', updatedAt = ? WHERE id = ?`,
    now, settlementId
  );

  return NextResponse.json({
    success: true,
    message: '结算单已批准',
  });
}

async function rejectSettlement(settlementId: string) {
  const now = new Date().toISOString();

  const settlement = await queryFirst(
    'SELECT agentId, period FROM Settlement WHERE id = ?',
    settlementId
  ) as any;

  // 恢复分润记录状态
  if (settlement) {
    await execute(
      `UPDATE CommissionRecord SET status = 'pending', updatedAt = ?
       WHERE agentId = ? AND period = ? AND status = 'settling'`,
      now, settlement.agentId, settlement.period
    );
  }

  await execute(
    `UPDATE Settlement SET status = 'rejected', updatedAt = ? WHERE id = ?`,
    now, settlementId
  );

  return NextResponse.json({
    success: true,
    message: '结算单已驳回',
  });
}

async function markSettled(settlementId: string) {
  const now = new Date().toISOString();

  const settlement = await queryFirst(
    'SELECT agentId, period, amount FROM Settlement WHERE id = ?',
    settlementId
  ) as any;

  if (settlement) {
    // 真正结算：标记分润记录为已结算
    await execute(
      `UPDATE CommissionRecord SET status = 'settled', updatedAt = ?
       WHERE agentId = ? AND period = ? AND status = 'settling'`,
      now, settlement.agentId, settlement.period
    );

    // 记录到审计日志
    await execute(
      `INSERT INTO SiteConfig (id, key, value, category, updatedAt)
       VALUES (?, ?, ?, 'commission', ?)`,
      `audit_${Date.now()}`,
      `settlement_paid:${settlementId}`,
      JSON.stringify({ agentId: settlement.agentId, amount: settlement.amount }),
      now
    );
  }

  await execute(
    `UPDATE Settlement SET status = 'paid', updatedAt = ? WHERE id = ?`,
    now, settlementId
  );

  return NextResponse.json({
    success: true,
    message: '结算完成',
  });
}
