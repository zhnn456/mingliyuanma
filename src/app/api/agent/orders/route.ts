import { NextRequest, NextResponse } from 'next/server';
import { requireAgent } from '@/lib/auth-server';
import { queryAll } from '@/lib/d1';

export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAgent(req);
    if (!allowed || !session) return NextResponse.json({ error: '无权限' }, { status: 403 });

    if (session.user.role === 'admin') {
      const orders = await queryAll('SELECT o.*, u.email as userEmail FROM "Order" o LEFT JOIN User u ON o.userId = u.id ORDER BY o.createdAt DESC LIMIT 50');
      return NextResponse.json({ orders });
    }

    // agent - 查该代理商的客户订单
    const agents = await queryAll('SELECT id FROM Agent WHERE userId = ?', session.user.id) as any[];
    if (agents.length === 0) return NextResponse.json({ orders: [] });

    const agentId = agents[0].id;
    // 查 agent_customer 关联的客户
    const customers = await queryAll("SELECT value FROM SiteConfig WHERE category = 'agent_customer' AND value = ?", agentId) as any[];
    const customerIds = customers.map((c: any) => c.value);
    if (customerIds.length === 0) return NextResponse.json({ orders: [] });

    const placeholders = customerIds.map(() => '?').join(',');
    const orders = await queryAll(
      `SELECT o.*, u.email as userEmail FROM "Order" o LEFT JOIN User u ON o.userId = u.id WHERE o.userId IN (${placeholders}) ORDER BY o.createdAt DESC LIMIT 50`,
      ...customerIds
    );
    return NextResponse.json({ orders });
  } catch (error) {
    console.error('获取代理商订单失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
