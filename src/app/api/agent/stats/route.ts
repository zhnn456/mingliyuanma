import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll } from '@/lib/d1';
import { requireAgent } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAgent(req);
    if (!allowed || !session) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const userId = (session.user as any).id;

    const agent = await queryFirst('SELECT * FROM Agent WHERE userId = ?', userId);

    if (!agent) {
      return NextResponse.json({ error: '代理商信息不存在' }, { status: 404 });
    }

    const customerLinks = await queryAll(
      'SELECT * FROM SiteConfig WHERE category = ? AND value = ?',
      'agent_customer', agent.id
    );

    const customerIds = customerLinks.map(c => c.key.replace('agent_customer:', ''));
    const customerCount = customerIds.length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    let totalBazi = 0, totalZiwei = 0, totalQimen = 0, totalMeihua = 0;
    let todayBazi = 0, todayZiwei = 0, todayQimen = 0, todayMeihua = 0;

    if (customerIds.length > 0) {
      const placeholders = customerIds.map(() => '?').join(',');
      const countSql = (table: string) =>
        `SELECT COUNT(*) as count FROM ${table} WHERE userId IN (${placeholders})`;
      const todayCountSql = (table: string) =>
        `SELECT COUNT(*) as count FROM ${table} WHERE userId IN (${placeholders}) AND createdAt >= ?`;

      [totalBazi, totalZiwei, totalQimen, totalMeihua] = await Promise.all([
        (queryFirst(countSql('BaziRecord'), ...customerIds) as any)?.count || 0,
        (queryFirst(countSql('ZiweiRecord'), ...customerIds) as any)?.count || 0,
        (queryFirst(countSql('QimenRecord'), ...customerIds) as any)?.count || 0,
        (queryFirst(countSql('MeihuaRecord'), ...customerIds) as any)?.count || 0,
      ]);

      [todayBazi, todayZiwei, todayQimen, todayMeihua] = await Promise.all([
        (queryFirst(todayCountSql('BaziRecord'), ...customerIds, todayStr) as any)?.count || 0,
        (queryFirst(todayCountSql('ZiweiRecord'), ...customerIds, todayStr) as any)?.count || 0,
        (queryFirst(todayCountSql('QimenRecord'), ...customerIds, todayStr) as any)?.count || 0,
        (queryFirst(todayCountSql('MeihuaRecord'), ...customerIds, todayStr) as any)?.count || 0,
      ]);
    }

    const orderLinks = await queryAll(
      'SELECT * FROM SiteConfig WHERE category = ? AND value = ?',
      'agent_order', agent.id
    );
    const orderIds = orderLinks.map(c => c.key.replace('agent_order:', ''));

    let totalRevenue = 0;
    let totalOrders = 0;
    let todayOrders = 0;

    if (orderIds.length > 0) {
      const orderPlaceholders = orderIds.map(() => '?').join(',');
      const orders = await queryAll(
        `SELECT * FROM "Order" WHERE id IN (${orderPlaceholders}) AND status = ?`,
        ...orderIds, 'paid'
      ) as any[];
      totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
      totalOrders = orders.length;
      todayOrders = orders.filter(o => o.paidAt && o.paidAt >= todayStr).length;
    }

    let siteConfig: any = {};
    try {
      siteConfig = JSON.parse(agent.siteConfig || '{}');
    } catch {}

    const license = await queryFirst(
      'SELECT * FROM AgentLicense WHERE agentId = ? AND status = ? ORDER BY createdAt DESC',
      agent.id, 'active'
    );

    return NextResponse.json({
      agent: {
        id: agent.id,
        companyName: agent.companyName,
        brandName: agent.brandName,
        domain: agent.domain,
        licenseKey: agent.licenseKey,
        licenseExpiry: agent.licenseExpiry,
        isActive: agent.isActive,
        siteConfig,
      },
      license: license ? {
        licenseKey: (license as any).licenseKey,
        maxUsers: (license as any).maxUsers,
        expiryAt: (license as any).expiryAt,
        features: (license as any).features ? JSON.parse((license as any).features) : [],
      } : null,
      stats: {
        customerCount,
        totalOrders,
        todayOrders,
        totalRevenue,
        records: {
          bazi: totalBazi,
          ziwei: totalZiwei,
          qimen: totalQimen,
          meihua: totalMeihua,
          total: totalBazi + totalZiwei + totalQimen + totalMeihua,
        },
        todayRecords: {
          bazi: todayBazi,
          ziwei: todayZiwei,
          qimen: todayQimen,
          meihua: todayMeihua,
          total: todayBazi + todayZiwei + todayQimen + todayMeihua,
        },
      },
    });
  } catch (error) {
    console.error('获取代理商统计失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}