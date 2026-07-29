/**
 * 服务端鉴权工具 — raw D1 版
 * 使用 HMAC-SHA256 签名令牌
 */
import { NextRequest, NextResponse } from 'next/server';

export interface Session {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    memberLevel: string;
  };
}

// Token 密钥（环境变量优先，开发环境用默认值）
function getSecretKey(): string {
  return process.env.NEXTAUTH_SECRET || 'mingli-dev-secret-key-change-in-production';
}

/**
 * 使用 Web Crypto API 计算 HMAC-SHA256 签名
 */
async function signToken(payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecretKey()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const sigHex = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return payload + '.' + sigHex;
}

/**
 * 验证令牌签名并解析
 */
async function verifyAndParseToken(token: string): Promise<any> {
  try {
    const lastDot = token.lastIndexOf('.');
    if (lastDot === -1) return null;
    const payload = token.slice(0, lastDot);
    const sig = token.slice(lastDot + 1);

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(getSecretKey()),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const expectedSig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const expectedHex = Array.from(new Uint8Array(expectedSig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (sig !== expectedHex) return null;

    // Base64 解码 payload
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

function getTokenFromRequest(req?: Request | NextRequest): string | null {
  if (!req) return null;
  const cookie = req.headers.get('cookie');
  if (!cookie) return null;
  const match = cookie.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export { signToken };

async function queryUserById(id: string) {
  try {
    const { getCloudflareContext } = require('@opennextjs/cloudflare');
    const ctx = await getCloudflareContext({ async: true });
    const db = ctx.env.DB;
    if (!db) return null;
    return await db.prepare('SELECT id, email, name, role, memberLevel FROM User WHERE id = ?').bind(id).first() as any;
  } catch {
    return null;
  }
}

export async function getSession(req?: Request | NextRequest): Promise<Session | null> {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return null;

    const payload = await verifyAndParseToken(token);
    if (!payload?.sub) return null;
    if (payload.exp && payload.exp < Date.now()) return null;

    const user = await queryUserById(payload.sub);
    if (!user) return null;

    return {
      user: {
        id: user.id,
        email: user.email || '',
        name: user.name,
        role: user.role,
        memberLevel: user.memberLevel,
      },
    };
  } catch {
    return null;
  }
}

export async function requireAuth(req?: Request | NextRequest): Promise<{ allowed: boolean; session: Session | null }> {
  const session = await getSession(req);
  return session ? { allowed: true, session } : { allowed: false, session: null };
}

export async function requireAdmin(req?: Request | NextRequest): Promise<{ allowed: boolean; session: Session | null }> {
  const session = await getSession(req);
  if (!session || session.user.role !== 'admin') return { allowed: false, session: null };
  return { allowed: true, session };
}

export async function requireAgent(req?: Request | NextRequest): Promise<{ allowed: boolean; session: Session | null }> {
  const session = await getSession(req);
  if (!session || !['admin', 'agent'].includes(session.user.role)) return { allowed: false, session: null };
  return { allowed: true, session };
}
