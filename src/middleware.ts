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
const EXEMPT_PATHS = ['/_next', '/favicon.ico', '/api/health', '/api/auth/login', '/api/license/verify', '/api/watermark', '/api/features', '/api/internal'];
const AGENT_PROTECTED_PATHS = ['/agent', '/api/agent'];

// 代理商同步状态
let agentSynced = false;
let lastSyncTime = 0;

// 域名→代理商解析缓存（避免每请求都 fetch）
const agentDomainCache = new Map<string, { agentId: string | null; expireAt: number }>();
const DOMAIN_CACHE_TTL = 5 * 60 * 1000; // 5分钟

// 在线验证缓存（避免每请求都远程验证）
let licenseValid = true;       // 授权是否有效
let licenseCheckTime = 0;       // 上次验证时间
let licenseFailCount = 0;       // 连续失败次数
const LICENSE_CHECK_INTERVAL = 10 * 60 * 1000; // 10分钟验证一次
const LICENSE_FAIL_THRESHOLD = 3; // 连续失败3次后锁定

interface RateEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateEntry>();

let _cachedSecret: string | null = null;

async function getSecretKey(): Promise<string> {
  if (_cachedSecret) return _cachedSecret;

  // 从环境变量获取（普通服务器通过 process.env 注入）
  try {
    if (process.env?.NEXTAUTH_SECRET) {
      _cachedSecret = process.env.NEXTAUTH_SECRET;
      return _cachedSecret;
    }
  } catch {}

  // 回退密钥（与配置文件中保持一致，生产环境务必设置 NEXTAUTH_SECRET）
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

  // 主站环境：解析代理商子域名/独立域名，注入 agentId 到请求头
  // 仅在主站（非代理商子站）执行，不影响 APP_LICENSE_KEY 域名验证逻辑
  let resolvedAgentId: string | null = null;
  if (!isAgentEnv) {
    const host = req.headers.get('host') || '';
    // 检查内存缓存
    const cached = agentDomainCache.get(host);
    if (cached && Date.now() < cached.expireAt) {
      resolvedAgentId = cached.agentId;
    } else {
      try {
        // 用 localhost 直接调用，避免 HTTPS 往返（NEXTAUTH_URL 是 https:// 会回到 Nginx）
        const res = await fetch(`http://localhost:3001/api/internal/agent-domain?host=${encodeURIComponent(host)}`, {
          headers: { 'x-internal-request': '1' },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.agentId) {
            resolvedAgentId = data.agentId;
          }
        }
        // 缓存结果（包括无代理商的情况，避免重复查询）
        agentDomainCache.set(host, { agentId: resolvedAgentId, expireAt: Date.now() + DOMAIN_CACHE_TTL });
      } catch {
        // 数据库查询失败时不阻断请求
      }
    }
  }

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
      };
      await fetch(`${centerApi}/api/agent/sync`, initOptions);
    } catch {}
  }

  // 域名验证：代理商子站必须使用授权绑定的域名
  // APP_BOUND_DOMAIN 配置后，运行时校验当前域名是否匹配
  if (isAgentEnv) {
    const boundDomain = process.env.APP_BOUND_DOMAIN || '';
    if (boundDomain) {
      const currentHost = req.headers.get('host') || '';
      // 提取主域名（去掉端口和 www 前缀）
      const currentMain = currentHost.replace(/^www\./, '').split(':')[0];
      const boundMain = boundDomain.replace(/^https?:\/\//, '').replace(/^www\./, '').split(':')[0];
      if (currentMain !== boundMain) {
        // 域名不匹配，锁定核心功能
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { error: '授权验证失败：域名不匹配，请联系平台管理员' },
            { status: 403 }
          );
        }
        // 非 API 页面返回锁定提示页
        if (!pathname.startsWith('/_next')) {
          return new NextResponse(
            `<!DOCTYPE html><html><head><meta charset="utf-8"><title>授权验证失败</title></head>
            <body style="display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:sans-serif;background:#fef2f2;">
            <div style="text-align:center;padding:2rem;">
            <h1 style="color:#dc2626;">⚠️ 授权验证失败</h1>
            <p style="color:#7f1d1d;">当前域名未获授权，请联系平台管理员。</p>
            </div></body></html>`,
            { status: 403, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        }
      }
    }
  }

  // 代理商路由保护：检查 License（带缓存机制）
  if (isAgentEnv) {
    const now = Date.now();
    const needCheck = (now - licenseCheckTime) > LICENSE_CHECK_INTERVAL;

    if (needCheck) {
      licenseCheckTime = now;
      const licenseKey = process.env.APP_LICENSE_KEY || '';
      const centerApi = process.env.CENTER_API || '';
      const domain = process.env.NEXTAUTH_URL || '';

      try {
        const params = new URLSearchParams({ license: licenseKey, domain });
        const res = await fetch(`${centerApi}/api/license/verify?${params}`, {
          method: 'GET',
        });

        if (res.ok) {
          const data = await res.json();
          if (data.valid) {
            licenseValid = true;
            licenseFailCount = 0;
          } else {
            licenseFailCount++;
            if (licenseFailCount >= LICENSE_FAIL_THRESHOLD) {
              licenseValid = false;
            }
          }
        } else {
          licenseFailCount++;
          // 网络错误不立即锁定（可能是临时网络问题）
          if (licenseFailCount >= LICENSE_FAIL_THRESHOLD + 2) {
            licenseValid = false;
          }
        }
      } catch {
        // 网络异常，不立即锁定
        licenseFailCount++;
      }
    }

    // 授权失效后锁定核心功能
    if (!licenseValid) {
      // 允许访问的路径：登录页、静态资源、健康检查
      const allowedPaths = ['/_next', '/favicon.ico', '/api/health', '/api/auth/login', '/api/license'];
      if (!allowedPaths.some(p => pathname.startsWith(p))) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { error: '授权已过期，请联系平台续费', code: 'LICENSE_EXPIRED' },
            { status: 503 }
          );
        }
        if (!pathname.startsWith('/_next')) {
          return new NextResponse(
            `<!DOCTYPE html><html><head><meta charset="utf-8"><title>授权已过期</title></head>
            <body style="display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:sans-serif;background:#fffbeb;">
            <div style="text-align:center;padding:2rem;">
            <h1 style="color:#d97706;">⚠️ 授权已过期</h1>
            <p style="color:#92400e;">系统授权已过期，请联系平台续费恢复服务。</p>
            </div></body></html>`,
            { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        }
      }
    }
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

  // 创建响应，如已解析到代理商则将 agentId 注入请求头供下游 API 使用
  const requestHeaders = new Headers(req.headers);
  if (resolvedAgentId) {
    requestHeaders.set('x-agent-id', resolvedAgentId);
  }
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
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
