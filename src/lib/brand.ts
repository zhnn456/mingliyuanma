import { cache } from 'react';
import { queryFirst } from './d1';
import { headers } from 'next/headers';

/**
 * 站点品牌配置（server 端）
 * 优先读 SiteConfig 中品牌设置页配置，未配置则返回默认值
 * 使用 React cache 避免同一请求内重复查库
 */

export const getBrandName = cache(async (): Promise<string> => {
  return (await getBrandConfig()).brandName;
});

/**
 * 获取站点品牌配置：brandName / tagline / supportEmail（联系邮箱）
 * 三份法律声明页面（服务条款/隐私政策/版权声明）统一从这里读取，避免硬编码不实主体信息
 */
export const getBrandConfig = cache(async (): Promise<{
  brandName: string;
  tagline: string;
  supportEmail: string;
}> => {
  const defaults = { brandName: '知微阁', tagline: '传承千年智慧，融合现代科技', supportEmail: 'support@ming8.online' };
  const out = { ...defaults };
  for (const key of Object.keys(out) as (keyof typeof out)[]) {
    try {
      const row = await queryFirst(`SELECT value FROM SiteConfig WHERE \`key\` = ?`, key) as any;
      if (row?.value && String(row.value).trim()) out[key] = String(row.value).trim();
    } catch {
      // 表不存在或查询失败时使用默认值
    }
  }
  return out;
});

/**
 * 获取当前站点域名（host），用于法律声明中标注备案/联系方式时引用实际部署域名
 * 若无法从请求头获取，退回 NEXT_PUBLIC_SITE_URL 或空串
 */
export const getCurrentDomain = cache(async (): Promise<string> => {
  try {
    const h = await headers();
    const host = h.get('host') || '';
    if (host) return host.split(':')[0];
  } catch {
    // headers() 在非请求上下文抛错，忽略
  }
  return process.env.NEXT_PUBLIC_SITE_URL
    ? process.env.NEXT_PUBLIC_SITE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '')
    : '';
});
