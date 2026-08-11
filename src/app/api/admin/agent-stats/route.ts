import { requireAdmin } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll } from '@/lib/d1';

function getTimeRangeWhere(timeRange: string): { where: string; params: any[] } {
  const params: any[] = [];
  let where = '';
  const now = new Date();

  switch (timeRange) {
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      where = 'WHERE o.createdAt >= ?';
      params.push(start);
      break;
    }
    case 'quarter': {
      const q = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), q * 3, 1).toISOString();
      where = 'WHERE o.createdAt >= ?';
      params.push(start);
      break;
    }
    case 'year': {
      const start = new Date(now.getFullYear(), 0, 1).toISOString();
      where = 'WHERE o.createdAt >= ?';
      params.push(start);
      break;
    }
    default:
      where = '';
  }

  return { where, params };
}

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get('timeRange') || 'all';
    const sortBy = searchParams.get('sortBy') || 'revenue';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    let agentWhere = 'WHERE 1=1';
    const agentParams: any[] = [];
    if (status) {
      agentWhere += ' AND a.isActive = ?';
      agentParams.push(status === 'active' ? 1 : 0);
    }

    const agents = await queryAll(
      `SELECT a.id, a.userId, a.companyName, a.contactName, a.contactPhone, a.domain, a.brandName, a.isActive, a.licenseExpiry, a.createdAt,
              u.email as userEmail, u.name as userName
       FROM Agent a
       LEFT JOIN User u ON a.userId = u.id
       ${agentWhere}
       ORDER BY a.createdAt DESC`,
      ...agentParams
    );

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { where: orderWhere, params: orderParams } = getTimeRangeWhere(timeRange);

    const sortFieldMap: Record<string, string> = {
      revenue: 'totalAmount',
      orders: 'orderCount',
      users: 'userCount',
      paipan: 'paipanCount',
    };
    const sortField = sortFieldMap[sortBy] || 'totalAmount';

    const results = await Promise.all(
      agents.map(async (agent: any) => {
        const orderSql = orderWhere
          ? `SELECT COALESCE(SUM(amount), 0) as totalAmount, COUNT(*) as orderCount FROM "Order" o ${orderWhere} AND o.userId = ?`
          : `SELECT COALESCE(SUM(amount), 0) as totalAmount, COUNT(*) as orderCount FROM "Order" o WHERE o.userId = ?`;

        const orderRow = await queryFirst(orderSql, ...orderParams, agent.userId) as any;

        const userCount = await queryFirst(
          'SELECT COUNT(*) as cnt FROM User WHERE id = ?',
          agent.userId
        ) as any;

        const paipanCount = await queryFirst(
          `SELECT COUNT(*) as cnt FROM (
             SELECT id FROM BaziRecord WHERE userId = ?
             UNION ALL
             SELECT id FROM ZiweiRecord WHERE userId = ?
             UNION ALL
             SELECT id FROM QimenRecord WHERE userId = ?
             UNION ALL
             SELECT id FROM MeihuaRecord WHERE userId = ?
           ) AS sub`,
          agent.userId, agent.userId, agent.userId, agent.userId
        ) as any;

        const activePaipanCount = await queryFirst(
          `SELECT COUNT(*) as cnt FROM (
             SELECT id FROM BaziRecord WHERE userId = ? AND createdAt >= ?
             UNION ALL
             SELECT id FROM ZiweiRecord WHERE userId = ? AND createdAt >= ?
             UNION ALL
             SELECT id FROM QimenRecord WHERE userId = ? AND createdAt >= ?
             UNION ALL
             SELECT id FROM MeihuaRecord WHERE userId = ? AND createdAt >= ?
           ) AS sub`,
          agent.userId, thirtyDaysAgo,
          agent.userId, thirtyDaysAgo,
          agent.userId, thirtyDaysAgo,
          agent.userId, thirtyDaysAgo
        ) as any;

        const trendSql = orderWhere
          ? `SELECT DATE(o.createdAt) as date, COALESCE(SUM(o.amount), 0) as amount, COUNT(*) as orders
             FROM "Order" o ${orderWhere} AND o.userId = ?
             GROUP BY DATE(o.createdAt)
             ORDER BY date DESC LIMIT 30`
          : `SELECT DATE(o.createdAt) as date, COALESCE(SUM(o.amount), 0) as amount, COUNT(*) as orders
             FROM "Order" o WHERE o.userId = ?
             GROUP BY DATE(o.createdAt)
             ORDER BY date DESC LIMIT 30`;

        const trendRows = await queryAll(trendSql, ...orderParams, agent.userId);

        const revenueTrend = trendRows.map((row: any) => ({
          date: row.date,
          amount: Number(row.amount) || 0,
          orders: row.orders || 0,
        }));

        return {
          id: agent.id,
          userId: agent.userId,
          companyName: agent.companyName || agent.brandName || '-',
          contactName: agent.contactName || '-',
          contactPhone: agent.contactPhone || '-',
          domain: agent.domain || '-',
          brandName: agent.brandName || '-',
          isActive: agent.isActive,
          licenseExpiry: agent.licenseExpiry,
          createdAt: agent.createdAt,
          userEmail: agent.userEmail,
          userName: agent.userName,
          orderCount: orderRow?.orderCount || 0,
          totalAmount: Number(orderRow?.totalAmount) || 0,
          userCount: userCount?.cnt || 0,
          paipanCount: paipanCount?.cnt || 0,
          activePaipanCount: activePaipanCount?.cnt || 0,
          revenueTrend,
        };
      })
    );

    const sorted = results.sort((a, b) => (b[sortField] || 0) - (a[sortField] || 0));

    const totalAgents = sorted.length;
    const activeAgents = sorted.filter((a: any) => a.isActive).length;
    const totalUsers = sorted.reduce((sum: number, a: any) => sum + (a.userCount || 0), 0);
    const totalRevenue = sorted.reduce((sum: number, a: any) => sum + (a.totalAmount || 0), 0);

    const startIdx = (page - 1) * pageSize;
    const paged = sorted.slice(startIdx, startIdx + pageSize);

    return NextResponse.json({
      summary: {
        totalAgents,
        activeAgents,
        totalUsers,
        totalRevenue,
      },
      agents: paged,
      total: totalAgents,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('获取代理商经营数据失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}