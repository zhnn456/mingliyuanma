import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, execute, ensureAgentDomainFields } from '@/lib/d1';
import { requireAgent } from '@/lib/auth-server';
import { auditLog } from '@/lib/audit';
import { AGENT_ADDONS } from '@/lib/pricing';
import { getMainDomain } from '@/lib/agent-domain';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * GET - 获取当前代理商的域名信息
 * 返回：subdomain、完整子域名 URL、customDomain、customDomainExpiry、余额
 */
export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAgent(req);
    if (!allowed || !session) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    await ensureAgentDomainFields();

    const agent = await queryFirst(
      'SELECT id, brandName, subdomain, customDomain, customDomainExpiry, balance FROM Agent WHERE userId = ?',
      session.sub
    ) as any;

    if (!agent) {
      return NextResponse.json({ error: '代理商信息不存在' }, { status: 404 });
    }

    const mainDomain = getMainDomain();
    const subdomain = agent.subdomain || '';
    const fullSubdomain = subdomain ? `${subdomain}.${mainDomain}` : '';

    // 判断独立域名状态
    let customDomainStatus: 'none' | 'active' | 'expired' = 'none';
    if (agent.customDomain) {
      const expiry = agent.customDomainExpiry ? new Date(agent.customDomainExpiry) : null;
      customDomainStatus = expiry && expiry.getTime() > Date.now() ? 'active' : 'expired';
    }

    return NextResponse.json({
      subdomain,
      fullSubdomain,
      mainDomain,
      customDomain: agent.customDomain || null,
      customDomainExpiry: agent.customDomainExpiry || null,
      customDomainStatus,
      balance: Number(agent.balance ?? 0),
      price: AGENT_ADDONS.customDomain.price,
      durationDays: AGENT_ADDONS.customDomain.durationDays,
    });
  } catch (error) {
    console.error('获取域名信息失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

/**
 * POST - 绑定/续费独立域名
 * - 校验域名格式与唯一性
 * - 检查余额 >= AGENT_ADDONS.customDomain.price
 * - 扣款并更新 customDomain、customDomainExpiry
 * - 记录审计日志
 */
export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAgent(req);
    if (!allowed || !session) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    await ensureAgentDomainFields();

    const agent = await queryFirst(
      'SELECT id, brandName, subdomain, customDomain, customDomainExpiry, balance FROM Agent WHERE userId = ?',
      session.sub
    ) as any;

    if (!agent) {
      return NextResponse.json({ error: '代理商信息不存在' }, { status: 404 });
    }

    const body = await req.json();
    const rawDomain = (body?.domain || '').toString().trim().toLowerCase();

    if (!rawDomain) {
      return NextResponse.json({ error: '请输入域名' }, { status: 400 });
    }

    // 规范化：去掉协议、路径、端口
    const domain = rawDomain
      .replace(/^https?:\/\//, '')
      .split('/')[0]
      .split(':')[0]
      .replace(/^www\./, '');

    // 域名格式校验
    if (!/^[a-z0-9]([a-z0-9.-]*\.)+[a-z]{2,}$/.test(domain)) {
      return NextResponse.json({ error: '域名格式不正确，例如 example.com' }, { status: 400 });
    }

    // 不允许绑定主站域名或其子域名
    const mainDomain = getMainDomain().toLowerCase();
    if (domain === mainDomain || domain.endsWith(`.${mainDomain}`)) {
      return NextResponse.json({ error: '不能绑定主站域名或其子域名' }, { status: 400 });
    }

    // 检查域名是否已被其他代理商占用
    const existing = await queryFirst(
      'SELECT id FROM Agent WHERE customDomain = ? AND id != ?',
      domain, agent.id
    ) as any;
    if (existing) {
      return NextResponse.json({ error: '该域名已被其他代理商绑定' }, { status: 400 });
    }

    // 检查余额
    const price = AGENT_ADDONS.customDomain.price;
    const currentBalance = Number(agent.balance ?? 0);
    if (currentBalance < price) {
      return NextResponse.json({
        error: '账户余额不足',
        needRecharge: true,
        cost: price,
        balance: currentBalance,
        shortfall: price - currentBalance,
      }, { status: 402 });
    }

    // 扣款并更新域名信息
    const newBalance = currentBalance - price;
    const now = new Date();
    // 如果已有未过期的域名，在原到期时间基础上续期；否则从现在起算
    let baseExpiry = now;
    if (agent.customDomainExpiry) {
      const prevExpiry = new Date(agent.customDomainExpiry);
      if (prevExpiry.getTime() > now.getTime()) {
        baseExpiry = prevExpiry;
      }
    }
    const newExpiry = new Date(baseExpiry.getTime() + AGENT_ADDONS.customDomain.durationDays * DAY_MS).toISOString();

    await execute(
      'UPDATE Agent SET customDomain = ?, customDomainExpiry = ?, balance = ? WHERE id = ?',
      domain, newExpiry, newBalance, agent.id
    );

    await auditLog({
      userId: session.sub,
      action: 'admin_update_agent',
      details: {
        agentId: agent.id,
        customDomain: domain,
        customDomainExpiry: newExpiry,
        paid: price,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
      },
      status: 'success',
    });

    return NextResponse.json({
      message: `域名绑定成功，已从余额扣除 ¥${price}`,
      customDomain: domain,
      customDomainExpiry: newExpiry,
      customDomainStatus: 'active',
      balance: newBalance,
    });
  } catch (error) {
    console.error('绑定独立域名失败:', error);
    return NextResponse.json({ error: '绑定失败' }, { status: 500 });
  }
}
