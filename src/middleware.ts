/**
 * Next.js 中间件
 * - 管理后台路由保护
 * - IP 级别速率限制
 * - 安全响应头注入
 */
import { NextRequest, NextResponse } from 'next/server';

const RATE_LIMIT_MAX = 100;
const RATE_LIMIT_WINDOW = 60_000;
const EXEMPT_PATHS = ['/_next', '/favicon.ico', '/api/health', '/api/auth/login'];

interface RateEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateEntry>();

function cleanupRateLimit() {
  const now = Date.now();
  rateLimitMap.forEach((entry, key) => {
    if (now > entry.resetTime) rateLimitMap.delete(key);
  });
}

function getTokenFromCookie(req: NextRequest): string | null {
  const cookie = req.headers.get('cookie');
  if (!cookie) return null;
  const match = cookie.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function parseToken(token: string): any {
  try {
    const binary = atob(token);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (EXEMPT_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 管理后台路由保护
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = getTokenFromCookie(req);
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    const payload = parseToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // IP 速率限制
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  const now = Date.now();
  if (now % 100 === 0) cleanupRateLimit();
  const key = `ip:${ip}`;
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
  } else {
    entry.count++;
    if (entry.count > RATE_LIMIT_MAX) {
      return NextResponse.json({ error: '请求过于频繁' }, { status: 429 });
    }
  }

  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
