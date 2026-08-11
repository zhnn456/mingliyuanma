import { NextRequest, NextResponse } from 'next/server';
import { requireAgent } from '@/lib/auth-server';
import { queryFirst } from '@/lib/d1';

/**
 * 源码部署代理 - 授权信息 API
 * GET: 返回代理商的授权码、域名绑定、授权状态、更新服务状态等
 *
 * 仅源码部署代理可访问
 */
export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAgent(req);
    if (!allowed || !session) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const agent = await queryFirst('SELECT * FROM Agent WHERE userId = ?', session.sub) as any;
    if (!agent) {
      return NextResponse.json({ error: '代理商信息不存在' }, { status: 404 });
    }

    // 解析 siteConfig
    let siteConfig: any = {};
    try {
      siteConfig = JSON.parse(agent.siteConfig || '{}');
    } catch {}

    const deployMode: 'saas' | 'source' = siteConfig.deployMode || (siteConfig.level === 'source' || agent.level === 'source' ? 'source' : 'saas');

    // 非 source 模式也可以访问（保留兼容），但主要面向 source 代理
    const licenseExpiry = agent.licenseExpiry;
    const expiryDate = licenseExpiry ? new Date(licenseExpiry) : null;
    const remainingDays = expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / 86400000) : null;
    const isExpired = remainingDays !== null && remainingDays < 0;
    const isExpiringSoon = remainingDays !== null && remainingDays >= 0 && remainingDays <= 30;

    const updateServiceExpiry = siteConfig.updateServiceExpiry || null;
    const updateExpiryDate = updateServiceExpiry ? new Date(updateServiceExpiry) : null;
    const updateServiceRemainingDays = updateExpiryDate
      ? Math.ceil((updateExpiryDate.getTime() - Date.now()) / 86400000)
      : null;
    const updateServiceExpired = updateServiceRemainingDays !== null && updateServiceRemainingDays < 0;

    const planType = siteConfig.planType || agent.plan || (deployMode === 'source' ? 'annual' : 'monthly');
    const features = siteConfig.features || ['bazi', 'ziwei', 'qimen', 'meihua'];
    const maxUsers = siteConfig.maxUsers ?? (deployMode === 'source' ? -1 : 500);
    const authorizedDomain = siteConfig.authorizedDomain || agent.domain || null;

    const status = isExpired ? 'expired' : (isExpiringSoon ? 'expiring_soon' : 'active');

    return NextResponse.json({
      agent: {
        id: agent.id,
        brandName: agent.brandName,
        companyName: agent.companyName,
        domain: agent.domain,
        authorizedDomain,
        contactName: agent.contactName,
        contactPhone: agent.contactPhone,
        isActive: !!agent.isActive,
        level: agent.level || deployMode,
        planType,
        licenseKey: agent.licenseKey,
        licenseExpiry,
        createdAt: agent.createdAt,
      },
      license: {
        licenseKey: agent.licenseKey,
        authorizedDomain,
        expiryAt: licenseExpiry,
        remainingDays: remainingDays !== null ? Math.max(0, remainingDays) : null,
        isExpired,
        isExpiringSoon,
        status,
        planType,
        features,
        maxUsers,
        updateServiceExpiry,
        updateServiceRemainingDays: updateServiceRemainingDays !== null ? Math.max(0, updateServiceRemainingDays) : null,
        updateServiceExpired,
      },
    });
  } catch (error) {
    console.error('获取授权信息失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
