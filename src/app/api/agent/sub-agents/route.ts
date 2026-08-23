import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll, execute } from '@/lib/d1';
import { requireAgent } from '@/lib/auth-server';
import { sanitizeString } from '@/lib/security';
import { hashPassword } from '@/lib/password';
import { auditLog } from '@/lib/audit';

/**
 * GET /api/agent/sub-agents
 * 获取当前代理商的下级 SaaS 分站列表
 * 返回：id、companyName、domain、isActive、createdAt、currentMonthGMV、totalCommission
 */
export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAgent(req);
    if (!allowed || !session) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const userId = session.sub;
    const agent = await queryFirst('SELECT * FROM Agent WHERE userId = ?', userId) as any;
    if (!agent) {
      return NextResponse.json({ error: '代理商信息不存在' }, { status: 404 });
    }

    // 查询直接下级分站
    const subAgents = await queryAll(
      `SELECT id, userId, companyName, domain, isActive, createdAt,
              currentMonthGMV, totalCommission, commissionRate, maxCustomers,
              plan, level, contactName, contactPhone, contactEmail
       FROM Agent
       WHERE parentAgentId = ?
       ORDER BY createdAt DESC`,
      agent.id
    );

    const list = (subAgents as any[]).map((s) => ({
      id: s.id,
      userId: s.userId,
      companyName: s.companyName || '',
      domain: s.domain || '',
      isActive: !!s.isActive,
      createdAt: s.createdAt,
      currentMonthGMV: Number(s.currentMonthGMV || 0),
      totalCommission: Number(s.totalCommission || 0),
      commissionRate: Number(s.commissionRate || 0),
      maxCustomers: Number(s.maxCustomers || 0),
      plan: s.plan || 'trial',
      level: s.level || 'saas',
      contactName: s.contactName || '',
      contactPhone: s.contactPhone || '',
      contactEmail: s.contactEmail || '',
    }));

    // 汇总统计
    const stats = {
      total: list.length,
      activeCount: list.filter((s) => s.isActive).length,
      monthGMV: list.reduce((sum, s) => sum + s.currentMonthGMV, 0),
      totalCommission: list.reduce((sum, s) => sum + s.totalCommission, 0),
    };

    return NextResponse.json({ subAgents: list, stats });
  } catch (error) {
    console.error('获取下级分站列表失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

/**
 * POST /api/agent/sub-agents
 * 创建下级 SaaS 分站
 */
export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAgent(req);
    if (!allowed || !session) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const agentUserId = session.sub;
    const agent = await queryFirst('SELECT * FROM Agent WHERE userId = ?', agentUserId) as any;
    if (!agent) {
      return NextResponse.json({ error: '代理商信息不存在' }, { status: 404 });
    }

    // 1. 检查权限：maxSubAgents > 0 或 level === 'source'
    const maxSubAgents = Number(agent.maxSubAgents || 0);
    const isSource = (agent.level || 'saas') === 'source';
    if (!isSource && maxSubAgents <= 0) {
      return NextResponse.json({ error: '当前套餐不支持创建下级分站' }, { status: 403 });
    }

    // 2. 检查下级数量是否已达上限（仅非 source 模式下检查）
    if (!isSource && maxSubAgents > 0) {
      const countResult = await queryFirst(
        'SELECT COUNT(*) as count FROM Agent WHERE parentAgentId = ?',
        agent.id
      ) as any;
      const currentCount = Number(countResult?.count || 0);
      if (currentCount >= maxSubAgents) {
        return NextResponse.json(
          { error: `已达最大下级分站数限制（${maxSubAgents} 个）` },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const companyName = sanitizeString(body.companyName || '');
    const contactName = sanitizeString(body.contactName || '');
    const contactPhone = sanitizeString(body.contactPhone || '');
    const contactEmail = sanitizeString(body.contactEmail || '').toLowerCase();
    const domain = sanitizeString(body.domain || '');
    const commissionRate = Number(body.commissionRate);
    const maxCustomers = Number(body.maxCustomers || 100);

    if (!companyName) {
      return NextResponse.json({ error: '请输入公司名' }, { status: 400 });
    }
    if (!contactEmail) {
      return NextResponse.json({ error: '请输入联系人邮箱' }, { status: 400 });
    }
    if (!Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 1) {
      return NextResponse.json({ error: '分润比例需在 0~1 之间' }, { status: 400 });
    }

    // 3. 分润比例不能超过当前代理商的分润比例
    const parentRate = Number(agent.commissionRate || 0.3);
    if (commissionRate > parentRate) {
      return NextResponse.json(
        { error: `分润比例不能超过您的分润比例（${(parentRate * 100).toFixed(0)}%）` },
        { status: 400 }
      );
    }

    // 邮箱不能重复
    const existingUser = await queryFirst('SELECT id FROM User WHERE email = ?', contactEmail) as any;
    if (existingUser) {
      return NextResponse.json({ error: '该邮箱已注册' }, { status: 400 });
    }

    // 4. 创建 User 账号（role='agent'）
    const password = body.password || `SA${Date.now().toString(36).slice(-6).toUpperCase()}`;
    const passwordHash = await hashPassword(password);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    await execute(
      `INSERT INTO User (id, email, passwordHash, name, phone, role, memberLevel, memberExpiryAt, createdAt)
       VALUES (?, ?, ?, ?, ?, 'agent', 'free', NULL, ?)`,
      userId, contactEmail, passwordHash, contactName || companyName, contactPhone || null, now
    );

    // 5. 创建 Agent 记录（parentAgentId=当前代理商ID, level='saas', plan='trial'）
    const agentId = `agt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const subAgentMonthlyFee = Number(agent.subAgentMonthlyFee || 99);
    const planExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 试用 30 天

    await execute(
      `INSERT INTO Agent
       (id, userId, companyName, contactName, contactPhone, contactEmail, domain,
        commissionRate, parentAgentId, level, plan, planExpiry,
        maxCustomers, currentMonthGMV, totalCommission, balance,
        subAgentCommissionRate, maxSubAgents, subAgentMonthlyFee,
        isActive, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'saas', 'trial', ?, ?, 0, 0, 0, 0.4, 0, ?, 1, ?)`,
      agentId, userId, companyName, contactName, contactPhone || null, contactEmail, domain || null,
      commissionRate, agent.id, planExpiry, maxCustomers, subAgentMonthlyFee, now
    );

    // 6. 生成邀请码（REF开头）
    let referralCode = `REF${agentId.slice(-8).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    try {
      await execute(
        `INSERT INTO ReferralCode (id, agentId, code, usageCount, createdAt)
         VALUES (?, ?, ?, 0, ?)`,
        `rc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, agentId, referralCode, now
      );
    } catch {
      // 表可能不存在，给 Agent 表更新 referralCode 字段
      try {
        await execute('UPDATE Agent SET referralCode = ? WHERE id = ?', referralCode, agentId);
      } catch {}
    }

    await auditLog({
      userId: agentUserId,
      action: 'agent_create_sub_agent',
      details: {
        subAgentId: agentId,
        subAgentUserId: userId,
        companyName,
        contactEmail,
        commissionRate,
        parentAgentId: agent.id,
      },
      status: 'success',
    });

    return NextResponse.json({
      message: '下级分站创建成功',
      subAgent: {
        id: agentId,
        userId,
        companyName,
        domain,
        contactName,
        contactEmail,
        commissionRate,
        maxCustomers,
        level: 'saas',
        plan: 'trial',
        planExpiry,
        referralCode,
      },
      credentials: { email: contactEmail, password },
    });
  } catch (error) {
    console.error('创建下级分站失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}
