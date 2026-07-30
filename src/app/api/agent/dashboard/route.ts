import { NextRequest, NextResponse } from 'next/server';
import { requireAgent } from '@/lib/auth-server';
import { queryFirst, queryAll } from '@/lib/d1';
import { getAgentCommissionStats } from '@/lib/commission';

export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAgent(req);
    if (!allowed || !session) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const agent = await queryFirst('SELECT * FROM Agent WHERE userId = ?', session.sub) as any;
    if (!agent) return NextResponse.json({ error: '代理商信息不存在' }, { status: 404 });

    const agentId = agent.id;

    const [stats, recentOrders, monthlyTrend] = await Promise.all([
      getAgentCommissionStats(agentId),
      (async () => {
        const rows = await queryAll(
          `SELECT o.*, u.name as userName, u.email as userEmail,
            CASE o.productType
              WHEN 'membership' THEN '会员'
              WHEN 'offering' THEN '服务'
              WHEN 'pdf_report' THEN 'PDF报告'
              ELSE o.productType
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
  } catch (error) {
    console.error('获取代理商仪表盘数据失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}