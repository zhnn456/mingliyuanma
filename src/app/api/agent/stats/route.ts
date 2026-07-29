import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAgent } from '@/lib/security';

/**
 * 代理商仪表盘统计数据
 */
export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAgent(req);
    if (!allowed || !session) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const userId = (session.user as any).id;

    // 获取代理商信息
    const agent = await prisma.agent.findUnique({
      where: { userId },
    });

    if (!agent) {
      return NextResponse.json({ error: '代理商信息不存在' }, { status: 404 });
    }

    // 统计该代理商的客户数（通过 siteConfig 记录的 agent-customer 关系）
    const customerLinks = await prisma.siteConfig.findMany({
      where: {
        category: 'agent_customer',
        value: agent.id,
      },
    });

    const customerIds = customerLinks.map(c => c.key.replace('agent_customer:', ''));
    const customerCount = customerIds.length;

    // 统计客户的排盘记录数
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalBazi = 0, totalZiwei = 0, totalQimen = 0, totalMeihua = 0;
    let todayBazi = 0, todayZiwei = 0, todayQimen = 0, todayMeihua = 0;

    if (customerIds.length > 0) {
      [totalBazi, totalZiwei, totalQimen, totalMeihua] = await Promise.all([
        prisma.baziRecord.count({ where: { userId: { in: customerIds } } }),
        prisma.ziweiRecord.count({ where: { userId: { in: customerIds } } }),
        prisma.qimenRecord.count({ where: { userId: { in: customerIds } } }),
        prisma.meihuaRecord.count({ where: { userId: { in: customerIds } } }),
      ]);

      [todayBazi, todayZiwei, todayQimen, todayMeihua] = await Promise.all([
        prisma.baziRecord.count({ where: { userId: { in: customerIds }, createdAt: { gte: today } } }),
        prisma.ziweiRecord.count({ where: { userId: { in: customerIds }, createdAt: { gte: today } } }),
        prisma.qimenRecord.count({ where: { userId: { in: customerIds }, createdAt: { gte: today } } }),
        prisma.meihuaRecord.count({ where: { userId: { in: customerIds }, createdAt: { gte: today } } }),
      ]);
    }

    // 统计该代理商名下的订单和收入
    // 通过 siteConfig 记录的 agent-order 关系
    const orderLinks = await prisma.siteConfig.findMany({
      where: {
        category: 'agent_order',
        value: agent.id,
      },
    });
    const orderIds = orderLinks.map(c => c.key.replace('agent_order:', ''));

    let totalRevenue = 0;
    let totalOrders = 0;
    let todayOrders = 0;

    if (orderIds.length > 0) {
      const orders = await prisma.order.findMany({
        where: { id: { in: orderIds }, status: 'paid' },
      });
      totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0);
      totalOrders = orders.length;
      todayOrders = orders.filter(o => o.paidAt && o.paidAt >= today).length;
    }

    // 解析代理商配置
    let siteConfig: any = {};
    try {
      siteConfig = JSON.parse(agent.siteConfig || '{}');
    } catch {}

    // 授权信息
    const license = await prisma.agentLicense.findFirst({
      where: { agentId: agent.id, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });

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
        licenseKey: license.licenseKey,
        maxUsers: license.maxUsers,
        expiryAt: license.expiryAt,
        features: license.features ? JSON.parse(license.features) : [],
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
