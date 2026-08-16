/**
 * 管理员续费升级服务接口
 * 
 * POST /api/admin/upgrade/renew
 * Body: { agentId, plan, durationDays }
 * 
 * plan: 'free' | 'annual'
 * durationDays: 365 (1年) | 730 (2年) 等
 */
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll, execute } from '@/lib/d1';
import { requirePrimaryAdmin } from '@/lib/auth-server';
import { auditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requirePrimaryAdmin(req);
    if (!allowed || !session) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }
    const adminId = session.userId || 'admin';

    const body = await req.json();
    const { agentId, plan, durationDays } = body;

    if (!agentId || !plan || !durationDays) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    if (!['free', 'annual'].includes(plan)) {
      return NextResponse.json({ error: '无效的升级方案' }, { status: 400 });
    }

    const days = parseInt(durationDays, 10);
    if (isNaN(days) || days <= 0 || days > 3650) {
      return NextResponse.json({ error: '续费时长无效' }, { status: 400 });
    }

    // 查询代理商当前状态
    const agent = await queryFirst('SELECT id, companyName, domain, upgradePlan, upgradeExpiryAt FROM Agent WHERE id = ?', agentId) as any;
    if (!agent) {
      return NextResponse.json({ error: '代理商不存在' }, { status: 404 });
    }

    // 计算新的到期时间
    // 如果当前未过期，从当前到期时间续期；如果已过期或无，从现在开始
    const now = Date.now();
    const currentExpiry = agent.upgradeExpiryAt ? new Date(agent.upgradeExpiryAt).getTime() : 0;
    const baseTime = currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(baseTime + days * 24 * 60 * 60 * 1000);

    // 更新代理商记录
    await execute(
      'UPDATE Agent SET upgradePlan = ?, upgradeExpiryAt = ? WHERE id = ?',
      plan,
      newExpiry,
      agentId
    );

    // 同步更新授权码表
    await execute(
      'UPDATE AgentLicense SET upgradePlan = ?, upgradeExpiryAt = ? WHERE agentId = ?',
      plan,
      newExpiry,
      agentId
    );

    // 审计日志
    await auditLog({
      userId: adminId,
      action: 'agent_update' as any,
      details: {
        action: 'upgrade_renew',
        agentId,
        plan,
        durationDays: days,
        newExpiry: newExpiry.toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      agentId,
      companyName: agent.companyName,
      upgradePlan: plan,
      upgradeExpiryAt: newExpiry.toISOString(),
      message: `续费成功，升级服务有效期至 ${newExpiry.toLocaleDateString('zh-CN')}`,
    });
  } catch (error: any) {
    console.error('[Admin Upgrade Renew] 错误:', error?.message);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

/**
 * GET 查询代理商升级状态
 */
export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requirePrimaryAdmin(req);
    if (!allowed) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const agents = await queryAll(
      'SELECT id, companyName, contactName, contactPhone, domain, level, plan, upgradePlan, upgradeExpiryAt FROM Agent ORDER BY createdAt DESC'
    ) as any[];

    const now = new Date();
    const result = agents.map(a => ({
      ...a,
      upgradeActive: a.upgradeExpiryAt && new Date(a.upgradeExpiryAt) > now,
      upgradeExpiryAt: a.upgradeExpiryAt ? new Date(a.upgradeExpiryAt).toISOString() : null,
      daysRemaining: a.upgradeExpiryAt ? Math.ceil((new Date(a.upgradeExpiryAt).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)) : 0,
    }));

    return NextResponse.json({ agents: result });
  } catch (error: any) {
    console.error('[Admin Upgrade Status] 错误:', error?.message);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

