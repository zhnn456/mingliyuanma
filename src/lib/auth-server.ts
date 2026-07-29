/**
 * 服务端认证逻辑
 * - Token 生成 / 验证（HMAC-SHA256 签名）
 * - Session 解析
 * - 权限守卫（requireAuth / requireAdmin / requireAgent）
 */
import { NextRequest } from 'next/server';

const TOKEN_TTL = 86_400_000;

function getSecretKey(): string {
  const secret = process.env.NEXTAUTH_SECRET || 'mingli-dev-secret-key-change-in-production';
  if (secret === 'mingli-dev-secret-key-change-in-production') {
    console.warn('[auth-server] ⚠️ 使用了开发密钥！生产环境必须设置 NEXTAUTH_SECRET');
  }
  return secret;
}

export async function signToken(payload: Record<string, any>): Promise<string> {
  const secret = getSecretKey();
  const data = { ...payload, iat: Date.now(), exp: Date.now() + TOKEN_TTL };
  const encodedPayload = btoa(JSON.stringify(data));

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(encodedPayload));
  const sigHex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `${encodedPayload}.${sigHex}`;
}

export async function verifyAndParseToken(token: string): Promise<any> {
  try {
    const lastDot = token.lastIndexOf('.');
    if (lastDot === -1) return null;
    const payload = token.slice(0, lastDot);
    const sig = token.slice(lastDot + 1);

    const secret = getSecretKey();
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const expectedSig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const expectedHex = Array.from(new Uint8Array(expectedSig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    if (sig !== expectedHex) return null;

    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const data = JSON.parse(new TextDecoder().decode(bytes));

    if (data.exp && data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export async function getSession(req: NextRequest) {
  const cookie = req.headers.get('cookie') || '';
  const match = cookie.match(/(?:^|;\s*)token=([^;]+)/);
  if (!match) return null;
  const token = decodeURIComponent(match[1]);
  return verifyAndParseToken(token);
}

export function requireAuth(req: NextRequest) {
  return getSession(req);
}

export async function requireAdmin(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return null;
  if (session.role !== 'admin') return null;
  return session;
}

export async function requireAgent(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return null;
  if (!['admin', 'agent'].includes(session.role)) return null;
  return session;
}
