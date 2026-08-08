import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, execute, ensureCommissionTables } from '@/lib/d1';
import { requireAgent } from '@/lib/auth-server';
import { auditLog } from '@/lib/audit';

const PLANS = {
  trial: { name: '试用版', price: 0, durationDays: 7, maxCustomers: 10, features: ['基础数据看板', '客户管理(10人)'] },
  monthly: { name: '月费版', price: 99, durationDays: 30, maxCustomers: 500, features: ['完整数据看板', '客户管理(500人)', '品牌定制', '自动分润', '邀请链接'] },
  yearly: { name: '年费版', price: 980, durationDays: 365, maxCustomers: 500, features: ['完整数据看板', '客户管理(500人)', '品牌定制', '自动分润', '邀请链接', '送2个月'] },
};

const DAY_MS = 24 * 60 * 60 * 1000;

type PlanKey = keyof typeof PLANS;

function buildPlans(currentPlan: string) {
  return Object.entries(PLANS).map(([key, p]) => ({
    key,
    name: p.name,
    price: p.price,
    durationDays: p.durationDays,
    maxCustomers: p.maxCustomers,
    features: p.features,
    current: key === currentPlan,
  }));
}

/**
 * GET - 查询当前代理商的套餐信息
 */
export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAgent(req);
    if (!allowed || !session) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    await ensureCommissionTables();

    const agent = await queryFirst(
      'SELECT id, plan, planExpiry, maxCustomers, balance FROM Agent WHERE userId = ?',
      session.sub
    ) as any;

    if (!agent) {
      return NextResponse.json({ error: '代理商信息不存在' }, { status: 404 });
    }

    const planKey: PlanKey = (agent.plan || 'trial') as PlanKey;
    const planDef = PLANS[planKey] || PLANS.trial;
    const expiry = agent.planExpiry ? new Date(agent.planExpiry) : null;
    const daysLeft = expiry ? Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / DAY_MS)) : 0;
    const expired = expiry ? expiry.getTime() < Date.now() : false;

    return NextResponse.json({
      current: {
        plan: planKey,
        planName: planDef.name,
        planExpiry: agent.planExpiry,
        daysLeft,
        expired,
        maxCustomers: agent.maxCustomers ?? planDef.maxCustomers,
        balance: agent.balance ?? 0,
      },
      plans: buildPlans(planKey),
    });
  } catch (error) {
    console.error('获取套餐信息失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

/**
 * POST - 选择/切换套餐
 * - trial（试用版）：免费直接开通
 * - monthly/yearly：从代理商余额扣款，余额不足返回 402
 */
export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAgent(req);
    if (!allowed || !session) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    await ensureCommissionTables();

    const agent = await queryFirst(
      'SELECT id, plan, balance FROM Agent WHERE userId = ?',
      session.sub
    ) as any;

    if (!agent) {
      return NextResponse.json({ error: '代理商信息不存在' }, { status: 404 });
    }

    const body = await req.json();
    const plan = body?.plan as PlanKey;

    if (!plan || !PLANS[plan]) {
      return NextResponse.json({ error: '无效的套餐类型' }, { status: 400 });
    }

    const selected = PLANS[plan];
    const currentBalance = Number(agent.balance ?? 0);

    // 付费套餐：检查余额
    if (selected.price > 0) {
      if (currentBalance < selected.price) {
        return NextResponse.json({
          error: '账户余额不足',
          needRecharge: true,
          cost: selected.price,
          balance: currentBalance,
          shortfall: selected.price - currentBalance,
        }, { status: 402 });
      }

      // 扣款
      const newBalance = currentBalance - selected.price;
      const now = new Date();
      const planExpiry = new Date(now.getTime() + selected.durationDays * DAY_MS).toISOString();

      await execute(
        'UPDATE Agent SET plan = ?, planExpiry = ?, maxCustomers = ?, balance = ? WHERE id = ?',
        plan, planExpiry, selected.maxCustomers, newBalance, agent.id
      );

      await auditLog({
        userId: session.sub,
        action: 'member_upgrade',
        details: { agentId: agent.id, from: agent.plan || 'trial', to: plan, planExpiry, paid: selected.price, balanceBefore: currentBalance, balanceAfter: newBalance },
        status: 'success',
      });

      const daysLeft = Math.ceil((new Date(planExpiry).getTime() - Date.now()) / DAY_MS);

      return NextResponse.json({
        message: `套餐升级成功，已从余额扣除 ¥${selected.price}`,
        current: {
          plan,
          planName: selected.name,
          planExpiry,
          daysLeft,
          expired: false,
          maxCustomers: selected.maxCustomers,
          balance: newBalance,
        },
        plans: buildPlans(plan),
      });
    }

    // 试用版：免费直接开通
    const now = new Date();
    const planExpiry = new Date(now.getTime() + selected.durationDays * DAY_MS).toISOString();

    await execute(
      'UPDATE Agent SET plan = ?, planExpiry = ?, maxCustomers = ? WHERE id = ?',
      plan, planExpiry, selected.maxCustomers, agent.id
    );

    await auditLog({
      userId: session.sub,
      action: 'member_upgrade',
      details: { agentId: agent.id, from: agent.plan || 'unknown', to: plan, planExpiry },
      status: 'success',
    });

    const daysLeft = Math.ceil((new Date(planExpiry).getTime() - Date.now()) / DAY_MS);

    return NextResponse.json({
      message: '试用版已开通',
      current: {
        plan,
        planName: selected.name,
        planExpiry,
        daysLeft,
        expired: false,
        maxCustomers: selected.maxCustomers,
        balance: currentBalance,
      },
      plans: buildPlans(plan),
    });
  } catch (error) {
    console.error('切换套餐失败:', error);
    return NextResponse.json({ error: '切换失败' }, { status: 500 });
  }
}
