import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/security';
import { queryFirst, queryAll } from '@/lib/d1';

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = 20;

    let agents: any[];
    if (agentId) {
      const a = await queryFirst('SELECT a.*, u.email as userEmail, u.name as userName FROM Agent a LEFT JOIN User u ON a.userId = u.id WHERE a.id = ?', agentId);
      agents = a ? [a] : [];
    } else {
      agents = await queryAll('SELECT a.*, u.email as userEmail, u.name as userName FROM Agent a LEFT JOIN User u ON a.userId = u.id ORDER BY a.createdAt DESC') as any[];
    }

    // 为每个代理商查询业务数据
    const result = await Promise.all(agents.map(async (agent: any) => {
      // 查该代理商的客户（通过 siteConfig 记录）
      const customerRows = await queryAll("SELECT value FROM SiteConfig WHERE category = 'agent_customer' AND value = ?", agent.id) as any[];
      const customerCount = customerRows.length;

      // 查用户的订单
      const orderStats = await queryFirst(
        `SELECT COUNT(*) as totalOrders, COALESCE(SUM(amount),0) as totalRevenue FROM "Order" WHERE status='paid' AND userId IN (SELECT userId FROM Agent WHERE id=?)`,
        agent.id
      ) as any;

      return {
        id: agent.id,
        brandName: agent.brandName || agent.companyName || '-',
        contactName: agent.contactName,
        email: agent.userEmail,
        userEmail: agent.userEmail,
        isActive: agent.isActive,
        licenseKey: agent.licenseKey,
        licenseExpiry: agent.licenseExpiry,
        createdAt: agent.createdAt,
        stats: {
          customerCount,
          totalOrders: (orderStats as any)?.totalOrders || 0,
          totalRevenue: (orderStats as any)?.totalRevenue || 0,
        },
      };
    }));

    return NextResponse.json({ agents: result });
  } catch (error) {
    console.error('获取代理商数据失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
