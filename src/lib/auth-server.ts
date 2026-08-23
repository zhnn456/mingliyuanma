/**
 * 服务端认证逻辑
 * - Token 生成 / 验证（HMAC-SHA256 签名）
 * - Session 解析
 * - 权限守卫（requireAuth / requireAdmin / requireAgent）
 */
import { NextRequest } from 'next/server';
import { createHmac } from 'crypto';

const TOKEN_TTL = 86_400_000; // 24小时

// 缓存密钥，但如果为空则不缓存，允许重试
let _cachedSecret: string | null = null;
let _cachedSecretPromise: Promise<string> | null = null;

/** 获取密钥（普通服务器通过 process.env 注入） */
async function getSecretKey(): Promise<string> {
  if (_cachedSecret) return _cachedSecret;
  if (_cachedSecretPromise) return _cachedSecretPromise;

  _cachedSecretPromise = (async () => {
    const secret = process.env?.NEXTAUTH_SECRET;
    if (!secret) {
      throw new Error('FATAL: NEXTAUTH_SECRET 环境变量未设置，服务无法启动');
    }
    _cachedSecret = secret;
    return _cachedSecret;
  })();

  return _cachedSecretPromise;
}

/** Base64URL 编码（URL 安全，无 padding） */
function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // btoa 得到标准 base64，转为 base64url
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, ''); // 移除 padding
}

/** Base64URL 解码 */
function base64UrlDecode(b64url: string): string {
  // base64url 转标准 base64
  let base64 = b64url
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  // 添加 padding
  const padding = base64.length % 4;
  if (padding === 2) base64 += '==';
  else if (padding === 3) base64 += '=';
  else if (padding === 1) throw new Error('Invalid base64url string');
  
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function getTier(): number {
  const centerApi = process.env.CENTER_API || '';
  return centerApi ? 1 : 0;
}

/** 签名 Token */
export async function signToken(payload: Record<string, any>): Promise<string> {
  const secret = await getSecretKey();
  const tier = getTier();
  const data = { ...payload, tier, iat: Date.now(), exp: Date.now() + TOKEN_TTL };
  const encodedPayload = base64UrlEncode(JSON.stringify(data));

  // 使用 Node.js crypto 模块计算 HMAC-SHA256 签名
  const sigHex = createHmac('sha256', secret).update(encodedPayload).digest('hex');

  return `${encodedPayload}.${sigHex}`;
}

/** 验证并解析 Token */
export async function verifyAndParseToken(token: string): Promise<any> {
  try {
    const lastDot = token.lastIndexOf('.');
    if (lastDot === -1) {
      console.warn('[auth] Token 格式错误: 缺少分隔符');
      return null;
    }
    
    const payload = token.slice(0, lastDot);
    const sig = token.slice(lastDot + 1);

    if (!payload || !sig) {
      console.warn('[auth] Token 缺少 payload 或签名');
      return null;
    }

    const secret = await getSecretKey();

    // 使用 Node.js crypto 模块计算期望签名（HMAC-SHA256）
    const expectedHex = createHmac('sha256', secret).update(payload).digest('hex');

    // 使用常量时间比较（防止时序攻击）
    if (!constantTimeEqual(sig, expectedHex)) {
      console.warn('[auth] Token 签名验证失败');
      return null;
    }

    const jsonStr = base64UrlDecode(payload);
    const data = JSON.parse(jsonStr);

    // 检查过期
    if (data.exp && data.exp < Date.now()) {
      console.warn('[auth] Token 已过期');
      return null;
    }
    
    return data;
  } catch (err: any) {
    console.error('[auth] Token 解析异常:', err?.message);
    return null;
  }
}

/** 常量时间比较（防止时序攻击） */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/** 从请求中获取 Session */
export async function getSession(req: NextRequest) {
  const cookie = req.headers.get('cookie') || '';
  const match = cookie.match(/(?:^|;\s*)token=([^;]+)/);
  if (!match) return null;
  const token = match[1];
  return verifyAndParseToken(token);
}

/** 要求已登录 */
export async function requireAuth(req: NextRequest) {
  const session = await getSession(req);
  return { allowed: !!session, session };
}

/** 要求管理员权限（demo 演示账号也可访问 GET 接口，写操作由 middleware 拦截） */
export async function requireAdmin(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return { allowed: false, session: null };
  if (session.role !== 'admin' && session.role !== 'demo') return { allowed: false, session: null };
  return { allowed: true, session };
}

/** 判断当前会话是否为演示账号 */
export function isDemoSession(session: any): boolean {
  return !!session && session.role === 'demo';
}

/** 要求代理商权限（管理员也可访问） */
export async function requireAgent(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return { allowed: false, session: null };
  if (session.role === 'agent' || session.role === 'admin') return { allowed: true, session };
  return { allowed: false, session: null };
}

export async function requirePrimaryAdmin(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return { allowed: false, session: null };
  if (session.role !== 'admin' && session.role !== 'demo') return { allowed: false, session: null };
  // 源码部署站（有授权码）的本地管理员拥有完整权限
  if (process.env.APP_LICENSE_KEY) return { allowed: true, session };
  // 中央站检查 tier（防止分站管理员越权访问中央级 API）
  if (process.env.CENTER_API && session.tier !== 0) return { allowed: false, session: null };
  return { allowed: true, session };
}
