import { NextRequest, NextResponse } from 'next/server';
import { requireAgent } from '@/lib/auth-server';
import { queryFirst, queryAll } from '@/lib/d1';
import { getAgentCommissionStats } from '@/lib/commission';

/**
 * 代理商经营数据看板 API
 * - SaaS代理：返回分润统计（pending/settled/total）+ 分润趋势
 * - 源码部署代理：返回收入统计（总收入/本月收入）+ 授权状态 + 收入趋势
 */
export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAgent(req);
    if (!allowed || !session) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const agent = await queryFirst('SELECT * FROM Agent WHERE userId = ?', session.sub) as any;
    if (!agent) return NextResponse.json({ error: '代理商信息不存在' }, { status: 404 });

    const agentId = agent.id;

    // 解析 siteConfig 获取部署模式
    let siteConfig: any = {};
    try {
      siteConfig = JSON.parse(agent.siteConfig || '{}');
    } catch {}

    const deployMode: 'saas' | 'source' = siteConfig.deployMode || (siteConfig.level === 'source' ? 'source' : 'saas');

    if (deployMode === 'source') {
      // === 源码部署代理：返回收入统计 + 授权状态 ===
      return await getSourceAgentDashboard(agent, agentId, siteConfig);
    } else {
      // === SaaS代理：返回分润统计 ===
      return await getSaasAgentDashboard(agent, agentId);
    }
  } catch (error) {
    console.error('获取代理商仪表盘数据失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

/** SaaS代理看板：分润统计 + 分润趋势 + 最近订单 */
async function getSaasAgentDashboard(agent: any, agentId: string) {
  const [stats, recentOrders, monthlyTrend] = await Promise.all([
    getAgentCommissionStats(agentId),
    (async () => {
      const rows = await queryAll(
        `SELECT o.*, u.name as userName, u.email as userEmail,
          CASE o.type
            WHEN 'membership' THEN '会员'
            WHEN 'offering' THEN '服务'
            WHEN 'pdf_report' THEN 'PDF报告'
            WHEN 'recharge' THEN '充值'
            ELSE o.type
          END as productTypeName
         FROM "Order" o
         LEFT JOIN User u ON o.userId = u.id
         WHERE o.agentId = ?
         ORDER BY o.createdAt DESC LIMIT 5`,
        agentId
      ) as any[];
      return rows;
    })(),
    (async () => {
      const months: { month: string; amount: number }[] = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
        const row = await queryFirst(
          `SELECT COALESCE(SUM(totalCommission), 0) as total
           FROM "CommissionRecord"
           WHERE agentId = ? AND status != 'clawed_back'
           AND createdAt >= ? AND createdAt < ?`,
          agentId, monthStart, monthEnd
        ) as any;
        months.push({ month: monthStr, amount: row?.total || 0 });
      }
      return months;
    })(),
  ]);

  return NextResponse.json({
    mode: 'saas',
    stats: {
      pendingCommission: stats.pendingCommission,
      settledCommission: stats.settledCommission,
      monthCommission: stats.monthCommission,
      totalCommission: stats.totalCommission,
      monthCount: stats.monthCount,
      pendingCount: stats.pendingCount,
    },
    recentOrders,
    monthlyTrend,
    agent: {
      brandName: agent.brandName,
      companyName: agent.companyName,
    },
  });
}

/** 源码部署代理看板：收入统计 + 授权状态 + 收入趋势 */
async function getSourceAgentDashboard(agent: any, agentId: string, siteConfig: any) {
  // 统计收入（从 Order 表）
  const totalRevenueRow = await queryFirst(
    `SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
     FROM "Order" WHERE agentId = ? AND status = 'paid'`,
    agentId
  ) as any;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthRevenueRow = await queryFirst(
    `SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
     FROM "Order" WHERE agentId = ? AND status = 'paid' AND createdAt >= ?`,
    agentId, monthStart
  ) as any;

  // 统计客户数
  const customerRow = await queryFirst(
    'SELECT COUNT(*) as total FROM User WHERE agentId = ?',
    agentId
  ) as any;

  const newCustomerRow = await queryFirst(
    'SELECT COUNT(*) as total FROM User WHERE agentId = ? AND createdAt >= ?',
    agentId, monthStart
  ) as any;

  // 最近订单
  const recentOrders = await queryAll(
    `SELECT o.*, u.name as userName, u.email as userEmail,
      CASE o.type
        WHEN 'membership' THEN '会员'
        WHEN 'offering' THEN '服务'
        WHEN 'pdf_report' THEN 'PDF报告'
        WHEN 'recharge' THEN '充值'
        ELSE o.type
      END as productTypeName
     FROM "Order" o
     LEFT JOIN User u ON o.userId = u.id
     WHERE o.agentId = ?
     ORDER BY o.createdAt DESC LIMIT 5`,
    agentId
  ) as any[];

  // 近6月收入趋势
  const months: { month: string; amount: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthStartISO = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
    const monthEndISO = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
    const row = await queryFirst(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM "Order" WHERE agentId = ? AND status = 'paid'
       AND createdAt >= ? AND createdAt < ?`,
      agentId, monthStartISO, monthEndISO
    ) as any;
    months.push({ month: monthStr, amount: row?.total || 0 });
  }

  // 授权状态
  const licenseExpiry = agent.licenseExpiry;
  const expiryDate = licenseExpiry ? new Date(licenseExpiry) : null;
  const remainingDays = expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / 86400000) : null;
  const isExpired = remainingDays !== null && remainingDays < 0;
  const isExpiringSoon = remainingDays !== null && remainingDays >= 0 && remainingDays <= 30;

  return NextResponse.json({
    mode: 'source',
    stats: {
      totalRevenue: totalRevenueRow?.total || 0,
      totalOrders: totalRevenueRow?.count || 0,
      monthRevenue: monthRevenueRow?.total || 0,
      monthOrders: monthRevenueRow?.count || 0,
      totalCustomers: customerRow?.total || 0,
      newCustomers: newCustomerRow?.total || 0,
    },
    license: {
      status: isExpired ? 'expired' : (isExpiringSoon ? 'expiring_soon' : 'active'),
      expiryDate: licenseExpiry,
      remainingDays: remainingDays !== null ? Math.max(0, remainingDays) : null,
      planType: siteConfig.planType || 'annual',
      updateServiceExpiry: siteConfig.updateServiceExpiry || null,
    },
    recentOrders,
    monthlyTrend: months,
    agent: {
      brandName: agent.brandName,
      companyName: agent.companyName,
      domain: agent.domain,
    },
  });
}
