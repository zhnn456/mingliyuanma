import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/password';
import { signToken } from '@/lib/auth-server';

/**
 * 直接从 D1 查询用户（不经过 Prisma，避免适配器兼容问题）
 */
async function findUserByEmail(email: string) {
  try {
    const { getCloudflareContext } = require('@opennextjs/cloudflare');
    // 在 async 函数中需要用 async: true
    const ctx = await getCloudflareContext({ async: true });
    const db = ctx.env.DB;
    if (!db) {
      console.error('D1 binding DB not found');
      return null;
    }
    const stmt = db.prepare('SELECT id, email, name, passwordHash, role, memberLevel, memberExpiry FROM User WHERE email = ?');
    const result = await stmt.bind(email).first();
    return result as any;
  } catch (e: any) {
    console.error('DB query error:', e?.message, e?.stack);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: '请输入邮箱和密码' }, { status: 400 });
    }

    const user = await findUserByEmail(email.toLowerCase().trim());
    if (!user) {
      return NextResponse.json({ error: '用户不存在或密码错误' }, { status: 401 });
    }

    // 验证密码
    if (!user.passwordHash) {
      return NextResponse.json({ error: '用户不存在或密码错误' }, { status: 401 });
    }
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: '用户不存在或密码错误' }, { status: 401 });
    }

    // 签名令牌（HMAC-SHA256，防篡改）
    const payload = JSON.stringify({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      memberLevel: user.memberLevel,
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });
    const encoder = new TextEncoder();
    const bytes = encoder.encode(payload);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const token = await signToken(btoa(binary));
    const cookieStr = `token=${encodeURIComponent(token)}; Path=/; SameSite=Lax; Max-Age=2592000; Secure`;

    return new NextResponse(JSON.stringify({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        memberLevel: user.memberLevel,
      },
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookieStr,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error?.message, error?.stack);
    return NextResponse.json({ error: '登录失败: ' + (error?.message || '未知错误') }, { status: 500 });
  }
}
