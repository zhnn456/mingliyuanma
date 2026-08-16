import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll, execute } from '@/lib/d1';
import { requireAgent } from '@/lib/auth-server'
import { sanitizeString } from '@/lib/security';
import { auditLog } from '@/lib/audit';

/**
 * 获取代理商设置
 * 代理商子站：从 SiteConfig 表读取
 * 主站：从 Agent 表读取
 */
export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAgent(req);
    if (!allowed || !session) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const userId = session.sub;

    // 代理商子站环境：从 SiteConfig 表读取
    if (process.env.APP_AGENT_ID) {
      let brandName = process.env.NEXT_PUBLIC_BRAND_NAME || '授权站点';
      let logo = '';
      let tagline = '';
      let siteName = '';
      let themeColor = '#D4916A';
      let customerServiceQR = '';
      let contactEmail = '';
      let contactWechat = '';
      let footerText = '';
      let announcement = '';

      try {
        const configs = await queryAll(`SELECT "key", value FROM SiteConfig`) as any[];
        if (configs && configs.length > 0) {
          for (const c of configs) {
            if (c.key === 'brandName' && c.value) brandName = c.value;
            if (c.key === 'logo' && c.value) logo = c.value;
            if (c.key === 'tagline' && c.value) tagline = c.value;
            if (c.key === 'siteName' && c.value) siteName = c.value;
            if (c.key === 'themeColor' && c.value) themeColor = c.value;
            if (c.key === 'customerServiceQR' && c.value) customerServiceQR = c.value;
            if (c.key === 'contactEmail' && c.value) contactEmail = c.value;
            if (c.key === 'contactWechat' && c.value) contactWechat = c.value;
            if (c.key === 'footerText' && c.value) footerText = c.value;
            if (c.key === 'announcement' && c.value) announcement = c.value;
          }
        }
      } catch {}

      // 获取授权信息（从环境变量）
      const licenseKey = process.env.APP_LICENSE_KEY || '';
      const domain = process.env.NEXTAUTH_URL || '';

      return NextResponse.json({
        agent: {
          id: process.env.APP_AGENT_ID,
          companyName: brandName,
          brandName,
          domain: domain.replace('https://', '').replace('http://', ''),
          logo,
          contactName: '',
          contactPhone: '',
          licenseKey,
          licenseExpiry: null,
          isActive: true,
          siteName,
          themeColor,
          customerServiceQR,
          contactEmail,
          contactWechat,
          footerText,
          announcement,
          siteConfig: {
            maxUsers: 1000,
            customPricing: false,
            whiteLabel: false,
            level: 'basic',
            monthlyFee: 99,
            tagline,
          },
        },
      });
    }

    // 主站环境：从 Agent 表读取
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
        level: (agent as any).level || 'saas',
        plan: (agent as any).plan,
        siteName: (agent as any).siteName || '',
        themeColor: (agent as any).themeColor || '#D4916A',
        customerServiceQR: (agent as any).customerServiceQR || '',
        contactEmail: (agent as any).contactEmail || '',
        contactWechat: (agent as any).contactWechat || '',
        footerText: (agent as any).footerText || '',
        announcement: (agent as any).announcement || '',
        siteConfig,
      },
    });
  } catch (error) {
    console.error('获取代理商设置失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

/**
 * 更新代理商设置
 * 代理商子站：保存到 SiteConfig 表（即时生效）
 * 主站：更新 Agent 表
 */
export async function PUT(req: NextRequest) {
  try {
    const { allowed, session } = await requireAgent(req);
    if (!allowed || !session) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const userId = session.sub;
    const body = await req.json();
    const {
      brandName, logo, companyName, contactName, contactPhone,
      siteName, themeColor, customerServiceQR, contactEmail, contactWechat, footerText, announcement,
    } = body;

    // 代理商子站环境：保存到 SiteConfig 表
    if (process.env.APP_AGENT_ID) {
      const now = new Date().toISOString();

      const upsertConfig = async (key: string, value: string) => {
        await execute(
          `INSERT INTO SiteConfig ("key", value, updatedAt) VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET value = ?, updatedAt = ?`,
          key, value, now, value, now
        );
      };

      if (brandName !== undefined) {
        await upsertConfig('brandName', sanitizeString(brandName));
      }

      if (logo !== undefined) {
        await upsertConfig('logo', logo);
      }

      if (siteName !== undefined) {
        await upsertConfig('siteName', sanitizeString(siteName));
      }

      if (themeColor !== undefined) {
        await upsertConfig('themeColor', sanitizeString(themeColor));
      }

      if (customerServiceQR !== undefined) {
        await upsertConfig('customerServiceQR', customerServiceQR);
      }

      if (contactEmail !== undefined) {
        await upsertConfig('contactEmail', sanitizeString(contactEmail));
      }

      if (contactWechat !== undefined) {
        await upsertConfig('contactWechat', sanitizeString(contactWechat));
      }

      if (footerText !== undefined) {
        await upsertConfig('footerText', sanitizeString(footerText));
      }

      if (announcement !== undefined) {
        await upsertConfig('announcement', sanitizeString(announcement));
      }

      // 返回更新后的数据
      let updatedBrand = brandName || process.env.NEXT_PUBLIC_BRAND_NAME || '授权站点';
      let updatedLogo = logo || '';

      return NextResponse.json({
        agent: {
          id: process.env.APP_AGENT_ID,
          brandName: updatedBrand,
          companyName: companyName || updatedBrand,
          logo: updatedLogo,
          isActive: true,
          siteName: siteName !== undefined ? siteName : '',
          themeColor: themeColor !== undefined ? themeColor : '#D4916A',
          customerServiceQR: customerServiceQR !== undefined ? customerServiceQR : '',
          contactEmail: contactEmail !== undefined ? contactEmail : '',
          contactWechat: contactWechat !== undefined ? contactWechat : '',
          footerText: footerText !== undefined ? footerText : '',
          announcement: announcement !== undefined ? announcement : '',
        },
      });
    }

    // 主站环境：更新 Agent 表
    const agent = await queryFirst('SELECT * FROM Agent WHERE userId = ?', userId);

    if (!agent) {
      return NextResponse.json({ error: '代理商信息不存在' }, { status: 404 });
    }

    const updateData: any = {};
    if (brandName !== undefined) updateData.brandName = sanitizeString(brandName);
    if (logo !== undefined) updateData.logo = logo;
    if (companyName !== undefined) updateData.companyName = sanitizeString(companyName);
    if (contactName !== undefined) updateData.contactName = sanitizeString(contactName);
    if (contactPhone !== undefined) updateData.contactPhone = sanitizeString(contactPhone);
    if (siteName !== undefined) updateData.siteName = sanitizeString(siteName);
    if (themeColor !== undefined) updateData.themeColor = sanitizeString(themeColor);
    if (customerServiceQR !== undefined) updateData.customerServiceQR = customerServiceQR;
    if (contactEmail !== undefined) updateData.contactEmail = sanitizeString(contactEmail);
    if (contactWechat !== undefined) updateData.contactWechat = sanitizeString(contactWechat);
    if (footerText !== undefined) updateData.footerText = sanitizeString(footerText);
    if (announcement !== undefined) updateData.announcement = sanitizeString(announcement);

    const sets: string[] = [];
    const params: any[] = [];
    if (updateData.brandName !== undefined) { sets.push('brandName = ?'); params.push(updateData.brandName); }
    if (updateData.logo !== undefined) { sets.push('logo = ?'); params.push(updateData.logo); }
    if (updateData.companyName !== undefined) { sets.push('companyName = ?'); params.push(updateData.companyName); }
    if (updateData.contactName !== undefined) { sets.push('contactName = ?'); params.push(updateData.contactName); }
    if (updateData.contactPhone !== undefined) { sets.push('contactPhone = ?'); params.push(updateData.contactPhone); }
    if (updateData.siteName !== undefined) { sets.push('siteName = ?'); params.push(updateData.siteName); }
    if (updateData.themeColor !== undefined) { sets.push('themeColor = ?'); params.push(updateData.themeColor); }
    if (updateData.customerServiceQR !== undefined) { sets.push('customerServiceQR = ?'); params.push(updateData.customerServiceQR); }
    if (updateData.contactEmail !== undefined) { sets.push('contactEmail = ?'); params.push(updateData.contactEmail); }
    if (updateData.contactWechat !== undefined) { sets.push('contactWechat = ?'); params.push(updateData.contactWechat); }
    if (updateData.footerText !== undefined) { sets.push('footerText = ?'); params.push(updateData.footerText); }
    if (updateData.announcement !== undefined) { sets.push('announcement = ?'); params.push(updateData.announcement); }

    if (sets.length > 0) {
      // 更新 updatedAt 时间戳
      sets.push('updatedAt = ?');
      params.push(new Date().toISOString());
      params.push((agent as any).id);
      await execute(`UPDATE Agent SET ${sets.join(', ')} WHERE id = ?`, ...params);
    }

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
