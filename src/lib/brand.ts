import { cache } from 'react';
import { queryFirst } from './d1';

/**
 * 获取站点品牌名称（server 端）
 * 优先读 SiteConfig 中品牌设置页配置的 brandName，未配置则返回默认"知微阁"
 * 使用 React cache 避免同一请求内重复查库
 */
export const getBrandName = cache(async (): Promise<string> => {
  try {
    const row = await queryFirst(`SELECT value FROM SiteConfig WHERE "key" = 'brandName'`) as any;
    if (row?.value) return String(row.value);
  } catch {
    // 表不存在或查询失败时使用默认值
  }
  return '知微阁';
});
