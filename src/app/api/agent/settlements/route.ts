import { NextRequest, NextResponse } from 'next/server';
import { requireAgent, requireAdmin } from '@/lib/auth-server';
import { queryFirst, queryAll, execute } from '@/lib/d1';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAgent(req);
    if (!allowed || !session) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || '';

    const conditions: string[] = [];
    const params: any[] = [];

    // 代理商只能看自己的结算单
    const agent = await queryFirst('SELECT id FROM Agent WHERE userId = ?', session.sub) as any;
    if (!agent) {
      return NextResponse.json({ error: '代理商信息不存在' }, { status: 404 });
    }

    conditions.push('agentId = ?');
    params.push(agent.id);

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    const settlements = await queryAll(
      `SELECT * FROM Settlement WHERE ${conditions.join(' AND ')} ORDER BY createdAt DESC LIMIT 50`,
      ...params
    ) as any[];

    // 计算统计
    const stats = {
      totalAmount: 0,
      pendingCount: 0,
      approvedCount: 0,
      paidCount: 0,
    };

    settlements.forEach((s: any) => {
      if (s.status === 'pending') stats.pendingCount++;
      else if (s.status === 'approved') stats.approvedCount++;
      else if (s.status === 'paid') {
        stats.paidCount++;
        stats.totalAmount += s.amount;
      }
    });

    return NextResponse.json({
      settlements,
      stats,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || '查询失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAgent(req);
    if (!allowed || !session) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

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
    return NextResponse.json({ error: err?.message || '操作失败' }, { status: 500 });
  }
}

async function applySettlement(agentId: string, period: string) {
  // 计算待结算金额
  const pending = await queryAll(
    `SELECT SUM(commissionAmount) as total, COUNT(*) as count
     FROM CommissionRecord
     WHERE agentId = ? AND status = 'pending'`,
    agentId
  ) as any[];

  const totalAmount = pending[0]?.total || 0;
  const count = pending[0]?.count || 0;

  if (count === 0 || totalAmount <= 0) {
    return NextResponse.json({ error: '没有可结算的分润' }, { status: 400 });
  }

  const settlementId = `set_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  await execute(
    `INSERT INTO Settlement (id, agentId, period, amount, status, note, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)`,
    settlementId, agentId, period || new Date().toISOString().slice(0, 7), totalAmount,
    `申请结算（${count}笔分润）`, now, now
  );

  // 更新分润状态
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
    message: `已提交结算申请 ¥${totalAmount.toFixed(2)}`,
  });
}
