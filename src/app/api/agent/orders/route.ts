import { NextRequest, NextResponse } from 'next/server';
import { requireAgent } from '@/lib/auth-server';
import { queryAll } from '@/lib/d1';

export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAgent(req);
    if (!allowed || !session) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const agents = await queryAll('SELECT id FROM Agent WHERE userId = ?', session.sub) as any[];
    if (agents.length === 0) return NextResponse.json({ orders: [] });

    const agentId = agents[0].id;
    // 查 agent_customer 关联的客户（key格式: agent_customer:{userId}, value格式: {agentId}）
    const customerLinks = await queryAll(
      "SELECT `key` FROM SiteConfig WHERE category = 'agent_customer' AND value = ?",
      agentId
    ) as any[];
    // 从 key 中提取 userId
    const customerIds = customerLinks.map((c: any) => c.key.replace('agent_customer:', ''));
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
