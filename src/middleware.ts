/**
 * Next.js 中间件 v4.0.0
 * - 管理后台路由保护（带 HMAC 签名验证）
 * - 代理商授权验证（License 检查）
 * - IP 级别速率限制
 * - 安全响应头注入
 */
import { NextRequest, NextResponse } from 'next/server';

const RATE_LIMIT_MAX = 100;
const RATE_LIMIT_WINDOW = 60_000;
const EXEMPT_PATHS = ['/_next', '/favicon.ico', '/api/health', '/api/auth/login', '/api/license/verify', '/api/watermark', '/api/features'];
const AGENT_PROTECTED_PATHS = ['/agent', '/api/agent'];

// 代理商同步状态
let agentSynced = false;
let lastSyncTime = 0;

interface RateEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateEntry>();

let _cachedSecret: string | null = null;

async function getSecretKey(): Promise<string> {
  if (_cachedSecret) return _cachedSecret;
  
  // 优先从环境变量获取
  try {
    if (process.env?.NEXTAUTH_SECRET) {
      _cachedSecret = process.env.NEXTAUTH_SECRET;
      return _cachedSecret;
    }
  } catch {}
  
  // 尝试从 Cloudflare context 获取
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const ctx = await getCloudflareContext({ async: true });
    const cfSecret = (ctx.env as any)?.NEXTAUTH_SECRET;
    if (cfSecret && typeof cfSecret === 'string') {
      _cachedSecret = cfSecret;
      return _cachedSecret;
    }
  } catch {}
  
  // 直接使用与 wrangler-deploy.toml 中一致的密钥
  _cachedSecret = 'mingli-secret-key-2026-production';
  return _cachedSecret;
}

async function verifyAndParseToken(token: string): Promise<any> {
  try {
    const lastDot = token.lastIndexOf('.');
    if (lastDot === -1) return null;
    const payload = token.slice(0, lastDot);
    const sig = token.slice(lastDot + 1);

    const secret = await getSecretKey();
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const expectedSig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const expectedHex = Array.from(new Uint8Array(expectedSig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (sig !== expectedHex) return null;

    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

function cleanupRateLimit() {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetTime) rateLimitMap.delete(key);
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (EXEMPT_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const cookie = req.headers.get('cookie') || '';
    const match = cookie.match(/(?:^|;\s*)token=([^;]+)/);
    if (!match) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    const token = match[1];
    const payload = await verifyAndParseToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // 代理商路由保护：检查 License（仅在代理商 Worker 环境）
  const isAgentProtected = AGENT_PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAgentEnv = !!process.env.APP_LICENSE_KEY && !!process.env.APP_AGENT_ID;

  // 代理商同步（每 5 分钟同步一次）
  if (isAgentEnv && !agentSynced || (Date.now() - lastSyncTime > 5 * 60 * 1000)) {
    agentSynced = true;
    lastSyncTime = Date.now();
    
    const licenseKey = process.env.APP_LICENSE_KEY || '';
    const agentId = process.env.APP_AGENT_ID || '';
    const centerApi = process.env.CENTER_API || '';
    const domain = process.env.NEXTAUTH_URL || '';
    const version = process.env.APP_VERSION || 'v4.0.0';

    try {
      const initOptions: any = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          license: licenseKey,
          agentId,
          domain,
          version,
          status: 'online',
        }),
        cf: { cacheTtl: 0 },
      };
      await fetch(`${centerApi}/api/agent/sync`, initOptions);
    } catch {}
  }

  // 代理商路由保护：检查 License
  if (isAgentProtected && isAgentEnv) {
    const licenseKey = process.env.APP_LICENSE_KEY || '';
    const centerApi = process.env.CENTER_API || '';
    const domain = process.env.NEXTAUTH_URL || '';

    try {
      const params = new URLSearchParams({ license: licenseKey, domain });
      const initOptions: any = {
        method: 'GET',
        cf: { cacheTtl: 300 },
      };
      const res = await fetch(`${centerApi}/api/license/verify?${params}`, initOptions);
      if (!res.ok) {
        // 远程验证失败，限制敏感功能
        if (pathname.startsWith('/api/agent/orders') || 
            pathname.startsWith('/api/agent/update') ||
            pathname.startsWith('/api/agent/settlements')) {
          return NextResponse.json({ error: '授权验证失败，请联系管理员' }, { status: 503 });
        }
      }
    } catch {}
  }

  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  cleanupRateLimit();
  const key = `ip:${ip}`;
  const entry = rateLimitMap.get(key);
  if (!entry || Date.now() > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: Date.now() + RATE_LIMIT_WINDOW });
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
  
  if (!pathname.startsWith('/_next/static') && !pathname.startsWith('/_next/image')) {
    response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    response.headers.set('CDN-Cache-Control', 'public, max-age=0, must-revalidate');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
