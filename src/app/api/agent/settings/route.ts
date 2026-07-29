import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAgent, sanitizeString } from '@/lib/security';
import { auditLog } from '@/lib/audit';

/**
 * 获取代理商设置
 */
export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAgent(req);
    if (!allowed || !session) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const agent = await prisma.agent.findUnique({ where: { userId } });

    if (!agent) {
      return NextResponse.json({ error: '代理商信息不存在' }, { status: 404 });
    }

    let siteConfig: any = {};
    try {
      siteConfig = JSON.parse(agent.siteConfig || '{}');
    } catch {}

    return NextResponse.json({
      agent: {
        id: agent.id,
        companyName: agent.companyName,
        brandName: agent.brandName,
        domain: agent.domain,
        logo: agent.logo,
        contactName: agent.contactName,
        contactPhone: agent.contactPhone,
        licenseKey: agent.licenseKey,
        licenseExpiry: agent.licenseExpiry,
        isActive: agent.isActive,
        siteConfig,
      },
    });
  } catch (error) {
    console.error('获取代理商设置失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

/**
 * 更新代理商设置（白标定制）
 */
export async function PUT(req: NextRequest) {
  try {
    const { allowed, session } = await requireAgent(req);
    if (!allowed || !session) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const agent = await prisma.agent.findUnique({ where: { userId } });

    if (!agent) {
      return NextResponse.json({ error: '代理商信息不存在' }, { status: 404 });
    }

    const body = await req.json();
    const { brandName, logo, companyName, contactName, contactPhone, siteConfig } = body;

    const updateData: any = {};
    if (brandName !== undefined) updateData.brandName = sanitizeString(brandName);
    if (logo !== undefined) updateData.logo = logo;
    if (companyName !== undefined) updateData.companyName = sanitizeString(companyName);
    if (contactName !== undefined) updateData.contactName = sanitizeString(contactName);
    if (contactPhone !== undefined) updateData.contactPhone = sanitizeString(contactPhone);

    // 合并 siteConfig
    if (siteConfig) {
      let existingConfig: any = {};
      try {
        existingConfig = JSON.parse(agent.siteConfig || '{}');
      } catch {}
      updateData.siteConfig = JSON.stringify({ ...existingConfig, ...siteConfig });
    }

    const updated = await prisma.agent.update({
      where: { id: agent.id },
      data: updateData,
    });

    await auditLog({
      userId,
      action: 'agent_update_customer',
      details: { agentId: agent.id, updated: Object.keys(updateData) },
      status: 'success',
    });

    return NextResponse.json({ agent: updated });
  } catch (error) {
    console.error('更新代理商设置失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}
