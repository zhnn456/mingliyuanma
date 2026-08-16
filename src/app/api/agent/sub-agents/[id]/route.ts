import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, execute } from '@/lib/d1';
import { requireAgent } from '@/lib/auth-server';
import { auditLog } from '@/lib/audit';

/**
 * 校验当前代理商是否拥有该下级分站
 */
async function getOwnedSubAgent(req: NextRequest, id: string) {
  const { allowed, session } = await requireAgent(req);
  if (!allowed || !session) {
    return { error: NextResponse.json({ error: '无权限' }, { status: 403 }), agent: null };
  }
  const parent = await queryFirst('SELECT * FROM Agent WHERE userId = ?', session.sub) as any;
  if (!parent) {
    return { error: NextResponse.json({ error: '代理商信息不存在' }, { status: 404 }), agent: null };
  }
  const subAgent = await queryFirst('SELECT * FROM Agent WHERE id = ? AND parentAgentId = ?', id, parent.id) as any;
  if (!subAgent) {
    return { error: NextResponse.json({ error: '下级分站不存在或无权操作' }, { status: 404 }), agent: null };
  }
  return { error: null, agent: subAgent, parent, session };
}

/**
 * GET /api/agent/sub-agents/[id]
 * 获取单个下级分站详情
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { error, agent } = await getOwnedSubAgent(req, id);
    if (error || !agent) return error;

    const user = await queryFirst('SELECT id, email, name, phone, createdAt FROM User WHERE id = ?', agent.userId) as any;

    // 客户数
    const customerCountRow = await queryFirst(
      'SELECT COUNT(*) as count FROM SiteConfig WHERE category = ? AND value = ?',
      'agent_customer', agent.id
    ) as any;

    return NextResponse.json({
      subAgent: {
        id: agent.id,
        userId: agent.userId,
        companyName: agent.companyName || '',
        domain: agent.domain || '',
        isActive: !!agent.isActive,
        createdAt: agent.createdAt,
        currentMonthGMV: Number(agent.currentMonthGMV || 0),
        totalCommission: Number(agent.totalCommission || 0),
        commissionRate: Number(agent.commissionRate || 0),
        maxCustomers: Number(agent.maxCustomers || 0),
        plan: agent.plan || 'trial',
        level: agent.level || 'saas',
        planExpiry: agent.planExpiry || null,
        contactName: agent.contactName || '',
        contactPhone: agent.contactPhone || '',
        contactEmail: agent.contactEmail || '',
        subAgentCommissionRate: Number(agent.subAgentCommissionRate || 0.4),
        maxSubAgents: Number(agent.maxSubAgents || 0),
        subAgentMonthlyFee: Number(agent.subAgentMonthlyFee || 99),
        customerCount: Number(customerCountRow?.count || 0),
        user: user ? {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          createdAt: user.createdAt,
        } : null,
      },
    });
  } catch (error) {
    console.error('获取下级分站详情失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

/**
 * PATCH /api/agent/sub-agents/[id]
 * 修改下级分站：启用/停用、修改分润比例、修改最大客户数
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { error, agent, parent, session } = await getOwnedSubAgent(req, id);
    if (error || !agent || !parent || !session) return error;

    const body = await req.json();
    const sets: string[] = [];
    const sqlParams: any[] = [];

    if (body.isActive !== undefined) {
      sets.push('isActive = ?');
      sqlParams.push(body.isActive ? 1 : 0);
    }

    if (body.commissionRate !== undefined) {
      const newRate = Number(body.commissionRate);
      if (!Number.isFinite(newRate) || newRate < 0 || newRate > 1) {
        return NextResponse.json({ error: '分润比例需在 0~1 之间' }, { status: 400 });
      }
      // 不能超过父代理商的分润比例
      const parentRate = Number(parent.commissionRate || 0.3);
      if (newRate > parentRate) {
        return NextResponse.json(
          { error: `分润比例不能超过您的分润比例（${(parentRate * 100).toFixed(0)}%）` },
          { status: 400 }
        );
      }
      sets.push('commissionRate = ?');
      sqlParams.push(newRate);
    }

    if (body.maxCustomers !== undefined) {
      const newMax = Number(body.maxCustomers);
      if (!Number.isFinite(newMax) || newMax < 0) {
        return NextResponse.json({ error: '最大客户数必须为非负数' }, { status: 400 });
      }
      sets.push('maxCustomers = ?');
      sqlParams.push(newMax);
    }

    if (body.domain !== undefined) {
      sets.push('domain = ?');
      sqlParams.push(body.domain || null);
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: '没有需要更新的字段' }, { status: 400 });
    }

    sets.push('updatedAt = ?');
    sqlParams.push(new Date().toISOString());
    sqlParams.push(agent.id);

    await execute(`UPDATE Agent SET ${sets.join(', ')} WHERE id = ?`, ...sqlParams);

    await auditLog({
      userId: session.sub,
      action: 'agent_update_sub_agent',
      details: { subAgentId: agent.id, updated: Object.keys(body) },
      status: 'success',
    });

    const updated = await queryFirst('SELECT * FROM Agent WHERE id = ?', agent.id) as any;
    return NextResponse.json({
      message: '更新成功',
      subAgent: {
        id: updated.id,
        companyName: updated.companyName,
        domain: updated.domain,
        isActive: !!updated.isActive,
        commissionRate: Number(updated.commissionRate || 0),
        maxCustomers: Number(updated.maxCustomers || 0),
      },
    });
  } catch (error) {
    console.error('更新下级分站失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

/**
 * DELETE /api/agent/sub-agents/[id]
 * 删除下级分站（停用 + 解绑关系）
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { error, agent, parent, session } = await getOwnedSubAgent(req, id);
    if (error || !agent || !parent || !session) return error;

    // 解除父子关系并停用（保留数据可追溯，避免硬删除造成数据丢失）
    await execute(
      'UPDATE Agent SET parentAgentId = NULL, isActive = 0, updatedAt = ? WHERE id = ?',
      new Date().toISOString(), agent.id
    );

    await auditLog({
      userId: session.sub,
      action: 'agent_delete_sub_agent',
      details: { subAgentId: agent.id, companyName: agent.companyName },
      status: 'success',
    });

    return NextResponse.json({ message: '下级分站已删除' });
  } catch (error) {
    console.error('删除下级分站失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
