import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, execute } from '@/lib/d1';
import { requireAgent } from '@/lib/auth-server'
import { sanitizeString } from '@/lib/security';
import { auditLog } from '@/lib/audit';

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

    let siteConfig: any = {};
    try {
      siteConfig = JSON.parse((agent as any).siteConfig || '{}');
    } catch {}

    return NextResponse.json({
      agent: {
        id: (agent as any).id,
        companyName: (agent as any).companyName,
        brandName: (agent as any).brandName,
        domain: (agent as any).domain,
        logo: (agent as any).logo,
        contactName: (agent as any).contactName,
        contactPhone: (agent as any).contactPhone,
        licenseKey: (agent as any).licenseKey,
        licenseExpiry: (agent as any).licenseExpiry,
        isActive: (agent as any).isActive,
        siteConfig,
      },
    });
  } catch (error) {
    console.error('获取代理商设置失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
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

    const body = await req.json();
    const { brandName, logo, companyName, contactName, contactPhone, siteConfig } = body;

    const updateData: any = {};
    if (brandName !== undefined) updateData.brandName = sanitizeString(brandName);
    if (logo !== undefined) updateData.logo = logo;
    if (companyName !== undefined) updateData.companyName = sanitizeString(companyName);
    if (contactName !== undefined) updateData.contactName = sanitizeString(contactName);
    if (contactPhone !== undefined) updateData.contactPhone = sanitizeString(contactPhone);

    if (siteConfig) {
      let existingConfig: any = {};
      try {
        existingConfig = JSON.parse((agent as any).siteConfig || '{}');
      } catch {}
      updateData.siteConfig = JSON.stringify({ ...existingConfig, ...siteConfig });
    }

    const sets: string[] = [];
    const params: any[] = [];
    if (updateData.brandName !== undefined) { sets.push('brandName = ?'); params.push(updateData.brandName); }
    if (updateData.logo !== undefined) { sets.push('logo = ?'); params.push(updateData.logo); }
    if (updateData.companyName !== undefined) { sets.push('companyName = ?'); params.push(updateData.companyName); }
    if (updateData.contactName !== undefined) { sets.push('contactName = ?'); params.push(updateData.contactName); }
    if (updateData.contactPhone !== undefined) { sets.push('contactPhone = ?'); params.push(updateData.contactPhone); }
    if (updateData.siteConfig !== undefined) { sets.push('siteConfig = ?'); params.push(updateData.siteConfig); }

    params.push((agent as any).id);
    await execute(`UPDATE Agent SET ${sets.join(', ')} WHERE id = ?`, ...params);

    const updated = { ...agent, ...updateData };

    await auditLog({
      userId,
      action: 'agent_update_customer',
      details: { agentId: (agent as any).id, updated: Object.keys(updateData) },
      status: 'success',
    });

    return NextResponse.json({ agent: updated });
  } catch (error) {
    console.error('更新代理商设置失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}