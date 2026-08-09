/**
 * 代理商域名解析工具
 * - 子域名模式：{subdomain}.ming8.online（主站主域名从 NEXTAUTH_URL 解析）
 * - 独立域名模式：代理商自行绑定并配置 CNAME 指向主站
 */
import { queryFirst } from '@/lib/d1';

/**
 * 获取主站域名（从 NEXTAUTH_URL 环境变量解析）
 * 例如 https://ming8.online → ming8.online
 */
export function getMainDomain(): string {
  try {
    const url = process.env.NEXTAUTH_URL || '';
    // 去掉协议、端口和路径
    return url
      .replace(/^https?:\/\//, '')
      .split('/')[0]
      .split(':')[0]
      .toLowerCase();
  } catch {
    return '';
  }
}

/** 解析结果类型 */
export type ParsedAgentDomain =
  | { type: 'subdomain'; subdomain: string }
  | { type: 'custom'; domain: string }
  | null;

/**
 * 从 Host 头解析代理商域名信息
 * @param host Host 头（如 xxx.ming8.online 或独立域名 www.example.com）
 * @returns 子域名信息 / 独立域名信息，主站返回 null
 */
export function parseAgentDomain(host: string): ParsedAgentDomain {
  if (!host) return null;

  // 去掉端口并转小写
  const hostname = host.split(':')[0].toLowerCase();
  const mainDomain = getMainDomain().toLowerCase();

  if (!mainDomain) return null;

  // 主站或 www 前缀：返回 null（非代理商）
  if (hostname === mainDomain || hostname === `www.${mainDomain}`) {
    return null;
  }

  // 子域名模式：xxx.ming8.online
  if (hostname.endsWith(`.${mainDomain}`)) {
    const subdomain = hostname.slice(0, -(mainDomain.length + 1));
    // www 已处理，过滤空值
    if (subdomain && subdomain !== 'www') {
      return { type: 'subdomain', subdomain };
    }
    return null;
  }

  // 独立域名模式
  return { type: 'custom', domain: hostname };
}

/**
 * 根据域名查询代理商信息（先查子域名，再查独立域名）
 * @param host Host 头
 * @returns 代理商记录或 null
 */
export async function getAgentByDomain(host: string) {
  const parsed = parseAgentDomain(host);
  if (!parsed) return null;

  if (parsed.type === 'subdomain') {
    return await queryFirst('SELECT * FROM Agent WHERE subdomain = ?', parsed.subdomain);
  }

  // 独立域名
  return await queryFirst('SELECT * FROM Agent WHERE customDomain = ?', parsed.domain);
}

/**
 * 根据品牌名生成子域名
 * 规则：转小写、空格/下划线转连字符、仅保留 a-z 0-9 和连字符
 * 例如 "My Brand" → "my-brand"
 */
export function generateSubdomain(brandName: string): string {
  if (!brandName) return '';
  const sub = brandName
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')      // 空格和下划线转连字符
    .replace(/[^a-z0-9-]/g, '')   // 仅保留 a-z 0-9 和连字符（中文等会被过滤）
    .replace(/-+/g, '-')           // 多个连符合并为一个
    .replace(/^-|-$/g, '');        // 去掉首尾连字符
  return sub;
}
