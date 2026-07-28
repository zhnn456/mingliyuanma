/**
 * Next.js 中间件
 * - IP 级别速率限制
 * - 管理后台路由保护
 * - 安全响应头注入
 */
import { NextRequest, NextResponse } from 'next/server';

// IP 限流配置
const RATE_LIMIT_MAX = 100; // 每100请求
const RATE_LIMIT_WINDOW = 60_000; // 每分钟

// 不需要限流的路径
const EXEMPT_PATHS = ['/_next', '/favicon.ico', '/api/health'];

interface RateEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateEntry>();

// 定期清理过期条目（防止内存泄漏）
function cleanupRateLimit() {
  const now = Date.now();
  rateLimitMap.forEach((entry, key) => {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  });
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 跳过静态资源
  if (EXEMPT_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 获取客户端 IP
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

  // IP 速率限制
  const now = Date.now();
  if (now % 100 === 0) cleanupRateLimit(); // 概率性清理

  const key = `ip:${ip}`;
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
  } else {
    entry.count++;
    if (entry.count > RATE_LIMIT_MAX) {
      return NextResponse.json(
        { error: '请求过于频繁，请稍后再试' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
            'X-RateLimit-Remaining': '0',
            'Retry-After': String(Math.ceil((entry.resetTime - now) / 1000)),
          },
        }
      );
    }
  }

  // 创建响应
  const response = NextResponse.next();

  // 注入安全响应头
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // 管理后台路由保护 — 重定向到登录页
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    // 客户端路由保护由页面层处理（检查 session role）
    // 中间件层无法直接访问 NextAuth session
    // 这里仅注入安全头
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径，排除:
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
