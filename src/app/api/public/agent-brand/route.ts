import { NextResponse } from 'next/server';
import { queryAll } from '@/lib/d1';
import { verifyAndParseToken } from '@/lib/auth-server';

/**
 * 公开 API：获取当前站点品牌信息
 * 用于 Header/Footer/法律页面显示品牌名称和 Logo
 */
export async function GET(req: Request) {
  try {
    // 代理商子站环境：从 SiteConfig 表读取
    if (process.env.APP_AGENT_ID) {
      let brandName = process.env.NEXT_PUBLIC_BRAND_NAME || '授权站点';
      let logo = '';

      try {
        const configs = await queryAll(`SELECT \`key\`, value FROM SiteConfig WHERE \`key\` IN ('brandName', 'logo', 'tagline')`) as any[];
        if (configs && configs.length > 0) {
          for (const c of configs) {
            if (c.key === 'brandName' && c.value) brandName = c.value;
            if (c.key === 'logo' && c.value) logo = c.value;
          }
        }
      } catch {}

      return NextResponse.json({
        agent: {
          id: process.env.APP_AGENT_ID,
          brandName,
          logo: logo || null,
          isActive: true,
        },
      });
    }

    // 主站环境：检查 cookie 中的代理商 token
    const cookie = req.headers.get('cookie') || '';
    const match = cookie.match(/(?:^|;\s*)token=([^;]+)/);
    if (match) {
      const payload = await verifyAndParseToken(match[1]);
      if (payload && payload.role === 'agent') {
        const userId = payload.sub;
        if (userId) {
          const agents = await queryAll(
            `SELECT id, brandName, companyName, logo, isActive FROM Agent WHERE userId = ?`,
            userId
          ) as any[];
          if (agents && agents.length > 0) {
            const a = agents[0];
            if (a.isActive) {
              return NextResponse.json({
                agent: {
                  id: a.id,
                  brandName: a.brandName || a.companyName || '授权站点',
                  logo: a.logo || null,
                  isActive: true,
                },
              });
            }
          }
        }
      }
    }

    return NextResponse.json({ agent: null });
  } catch {
    return NextResponse.json({ agent: null });
  }
}
