import { NextRequest, NextResponse } from 'next/server';
import { getSession, signToken } from '@/lib/auth-server';
import { queryFirst } from '@/lib/d1';
import { verifyPassword } from '@/lib/password';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: '请输入邮箱和密码' }, { status: 400 });
    }

    const user = await queryFirst(
      'SELECT id, email, name, passwordHash, role, memberLevel, memberExpiry FROM User WHERE email = ?',
      email.toLowerCase().trim()
    ) as any;

    if (!user) {
      return NextResponse.json({ error: '用户不存在或密码错误' }, { status: 401 });
    }

    if (!user.passwordHash) {
      return NextResponse.json({ error: '用户不存在或密码错误' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: '用户不存在或密码错误' }, { status: 401 });
    }

    const token = await signToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      memberLevel: user.memberLevel,
    });

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
    console.error('Login error:', error?.message);
    return NextResponse.json({ error: '登录失败' }, { status: 500 });
  }
}
