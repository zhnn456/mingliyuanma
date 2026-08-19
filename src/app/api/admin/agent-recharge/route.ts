/**
 * 代理商充值API
 * 功能：管理员为代理商账户充值或扣减余额（正数充值，负数扣减）
 * 用途：代理商账户余额管理，支持手动调账
 */
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, execute, ensureCommissionTables } from '@/lib/d1';
import { requirePrimaryAdmin } from '@/lib/auth-server';
import { auditLog } from '@/lib/audit';

// 管理员给代理商充值（正数充值，负数扣减）
export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requirePrimaryAdmin(req);
    if (!allowed || !session) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }
    await ensureCommissionTables();
    const body = await req.json();
    const { agentId, amount, reason } = body;
    if (!agentId || !amount || amount === 0) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }
    const agent = await queryFirst('SELECT id, balance FROM Agent WHERE id = ?', agentId) as any;
    if (!agent) {
      return NextResponse.json({ error: '代理商不存在' }, { status: 404 });
    }
    const oldBalance = Number(agent.balance ?? 0);
    const newBalance = oldBalance + Number(amount);
    if (newBalance < 0) {
      return NextResponse.json({ error: '扣减后余额不能为负' }, { status: 400 });
    }
    await execute('UPDATE Agent SET balance = ? WHERE id = ?', newBalance, agentId);
    await auditLog({
      userId: session.sub,
      action: 'admin_recharge_agent',
      details: { agentId, amount: Number(amount), reason: reason || '管理员充值', balanceBefore: oldBalance, balanceAfter: newBalance },
      status: 'success',
    });
    return NextResponse.json({ success: true, balance: newBalance, message: `充值成功，当前余额 ¥${newBalance}` });
  } catch (error) {
    console.error('代理商充值失败:', error);
    return NextResponse.json({ error: '充值失败' }, { status: 500 });
  }
}
