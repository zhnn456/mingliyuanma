/**
 * 提取客户端真实 IP（Edge/Node 运行时通用，不依赖 Node 专属模块）
 *
 * 安全基线（安全审计 V-1）：客户端可任意伪造 X-Forwarded-For 的首元素，
 * 若取首元素做限流键，攻击者轮换伪造头即可绕过所有限流。
 * 信任顺序：
 *  1. CF-Connecting-IP —— Cloudflare 强制覆盖为真实客户端 IP，经 CF 的请求不可伪造
 *  2. X-Real-IP        —— nginx 配置 proxy_set_header X-Real-IP $remote_addr 强制覆盖
 *  3. XFF 最后元素     —— $proxy_add_x_forwarded_for 追加的直接对端（最可信的一段）
 *  4. unknown
 */
export function getClientIPFromHeaders(headers: Headers): string {
  const cf = headers.get('cf-connecting-ip');
  if (cf) return cf.split(',')[0].trim();
  const real = headers.get('x-real-ip');
  if (real) return real.split(',')[0].trim();
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  return 'unknown';
}
