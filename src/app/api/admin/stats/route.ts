/**
 * 平台数据统计API
 * 功能：汇总展示用户数、订单数、收入、排盘量等核心指标，支持按代理商隔离数据
 * 用法：GET /api/admin/stats?days=30 - 返回统计摘要和最近7天趋势
 */
import { requireAdmin } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll } from '@/lib/d1';

/**
 * 获取当前请求的agentId（用于数据隔离）
 */
function getAgentId(req: NextRequest): string | null {
  return req.headers.get('x-agent-id') || null;
}

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const agentId = getAgentId(req);
    const today = new Date().toISOString().split('T')[0];

    // 容错查询：表不存在时返回 0（紫微/奇门/梅花功能未上线时表可能未建）
    const safeCount = async (table: string): Promise<number> => {
      try {
        const r = await queryFirst(`SELECT COUNT(*) as c FROM ${table}`) as any;
        return r?.c || 0;
      } catch {
        return 0;
      }
    };

    // 构建agent过滤条件
    const agentJoin = agentId ? 'JOIN User u ON o.userId = u.id AND u.agentId = ?' : '';
    const agentParam = agentId ? [agentId] : [];
    // mysql2不接受undefined，用null替代
    const safeAgentId = agentId || null;

    const [
      totalUsers,
      totalOrders,
      baziCount,
      ziweiCount,
      qimenCount,
      meihuaCount,
      totalOffering,
      paidAgg,
      todayOrders,
      todayUsers,
      totalPoints,
    ] = await Promise.all([
      queryFirst(
        safeAgentId
          ? 'SELECT COUNT(*) as c FROM User WHERE agentId = ?'
          : 'SELECT COUNT(*) as c FROM User',
        safeAgentId
      ),
      queryFirst(
        safeAgentId
          ? `SELECT COUNT(*) as c FROM "Order" o ${agentJoin}`
          : 'SELECT COUNT(*) as c FROM "Order"',
        ...(agentId ? [agentId] : [])
      ),
      safeCount('BaziRecord'),
      safeCount('ZiweiRecord'),
      safeCount('QimenRecord'),
      safeCount('MeihuaRecord'),
      safeCount('OfferingRecord'),
      queryFirst(
        safeAgentId
          ? `SELECT SUM(o.amount) as total FROM "Order" o ${agentJoin} WHERE o.status = ?`
          : "SELECT SUM(amount) as total FROM \"Order\" WHERE status = ?",
        ...(agentId ? [agentId, 'paid'] : ['paid'])
      ),
      queryFirst(
        safeAgentId
          ? `SELECT COUNT(*) as c FROM "Order" o ${agentJoin} AND DATE(o.createdAt) = ?`
          : "SELECT COUNT(*) as c FROM \"Order\" WHERE DATE(createdAt) = ?",
        today, ...(agentId ? [agentId] : [])
      ),
      queryFirst(
        safeAgentId
          ? 'SELECT COUNT(*) as c FROM User WHERE DATE(createdAt) = ? AND agentId = ?'
          : "SELECT COUNT(*) as c FROM User WHERE DATE(createdAt) = ?",
        today, safeAgentId
      ),
      queryFirst('SELECT COALESCE(SUM(balance), 0) as total FROM UserPoints'),
    ] as any[]);

    // 排盘总数 = 四种排盘类型之和
    const totalPaipanRecords = baziCount + ziweiCount + qimenCount + meihuaCount;

    const totalRevenue = paidAgg?.total || 0;

    // 会员等级分布
    const memberRows = await queryAll(
      safeAgentId
        ? 'SELECT memberLevel, COUNT(*) as count FROM User WHERE agentId = ? GROUP BY memberLevel'
        : 'SELECT memberLevel, COUNT(*) as count FROM User GROUP BY memberLevel',
      safeAgentId
    ) as any[];

    // 排盘类型分布
    const paipanTypeStats = [
      { type: '八字', count: baziCount },
      { type: '紫微', count: ziweiCount },
      { type: '奇门', count: qimenCount },
      { type: '梅花', count: meihuaCount },
    ];

    // 最近7天每日订单趋势
    const orderTrend: { date: string; orders: number }[] = [];
    const revenueTrend: { date: string; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      const r = await queryFirst(
        safeAgentId
          ? `SELECT COUNT(*) as c FROM "Order" o ${agentJoin} AND DATE(o.createdAt) = ?`
          : "SELECT COUNT(*) as c FROM \"Order\" WHERE DATE(createdAt) = ?",
        d, ...(agentId ? [agentId] : [])
      ) as any;
      const rev = await queryFirst(
        safeAgentId
          ? `SELECT SUM(o.amount) as total FROM "Order" o ${agentJoin} AND o.status = 'paid' AND DATE(o.createdAt) = ?`
          : "SELECT SUM(amount) as total FROM \"Order\" WHERE status = 'paid' AND DATE(createdAt) = ?",
        d, ...(agentId ? [agentId] : [])
      ) as any;
      orderTrend.push({ date: d, orders: r?.c || 0 });
      revenueTrend.push({ date: d, revenue: rev?.total || 0 });
    }

    // 最新用户（最近注册的5个）
    const recentUsers = await queryAll(
      safeAgentId
        ? 'SELECT id, name, email, createdAt FROM User WHERE agentId = ? ORDER BY createdAt DESC LIMIT 5'
        : 'SELECT id, name, email, createdAt FROM User ORDER BY createdAt DESC LIMIT 5',
      safeAgentId
    ) as any[];

    // 最新订单（最近的5个订单）
    const recentOrders = await queryAll(
      agentId
        ? `SELECT o.id, o.orderNo, o.type, o.amount, o.status, o.createdAt, u.name as userName, u.email as userEmail
           FROM "Order" o
           JOIN User u ON o.userId = u.id
           WHERE u.agentId = ?
           ORDER BY o.createdAt DESC LIMIT 5`
        : `SELECT o.id, o.orderNo, o.type, o.amount, o.status, o.createdAt, u.name as userName, u.email as userEmail
           FROM "Order" o
           LEFT JOIN User u ON o.userId = u.id
           ORDER BY o.createdAt DESC LIMIT 5`,
      safeAgentId
    ) as any[];

    return NextResponse.json({
      stats: {
        totalUsers: (totalUsers as any)?.c || 0,
        totalOrders: (totalOrders as any)?.c || 0,
        totalRevenue,
        todayOrders: (todayOrders as any)?.c || 0,
        todayUsers: (todayUsers as any)?.c || 0,
        totalPaipan: totalPaipanRecords,
        totalPaipanRecords,
        totalOffering: totalOffering,
        totalOfferingRecords: totalOffering,
        totalPoints: (totalPoints as any)?.total || 0,
        memberStats: memberRows.map((m: any) => ({ level: m.memberLevel, count: m.count })),
        paipanTypeStats,
        orderTrend,
        revenueTrend,
        dailyOrders: orderTrend.map((o: any) => ({ date: o.date, count: o.orders })),
        recentUsers,
        recentOrders,
      },
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
