import { NextRequest, NextResponse } from 'next/server';
import { getSession, signToken } from '@/lib/auth-server';
import { queryFirst, execute } from '@/lib/d1';
import { verifyPassword, hashPassword } from '@/lib/password';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: '请输入邮箱和密码' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    let user;
    try {
      user = await queryFirst(
        'SELECT id, email, name, passwordHash, role, memberLevel, memberExpiryAt FROM User WHERE email = ?',
        normalizedEmail
      ) as any;
    } catch (dbErr: any) {
      console.error('[login] 数据库查询错误:', dbErr?.message);
      return NextResponse.json({ error: '数据库错误' }, { status: 500 });
    }

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

    // 自动升级旧格式密码哈希
    if (!user.passwordHash.startsWith('pbkdf2_')) {
      try {
        const newHash = await hashPassword(password);
        await execute('UPDATE User SET passwordHash = ? WHERE id = ?', newHash, user.id);
      } catch {
        // 升级失败不影响登录
      }
    }

    let token: string;
    try {
      token = await signToken({
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        memberLevel: user.memberLevel,
      });
    } catch (signErr: any) {
      console.error('signToken error:', signErr?.message);
      return NextResponse.json({ error: 'Token生成失败: ' + signErr?.message }, { status: 500 });
    }

    const cookieStr = `token=${token}; Path=/; SameSite=Lax; Max-Age=2592000; Secure`;

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
