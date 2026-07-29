/**
 * 服务端鉴权工具 — raw D1 版
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

function getTokenFromRequest(req?: Request | NextRequest): string | null {
  if (!req) return null;
  const cookie = req.headers.get('cookie');
  if (!cookie) return null;
  const match = cookie.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function parseToken(token: string): any {
  try {
    const binary = atob(token);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

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

    const payload = parseToken(token);
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
