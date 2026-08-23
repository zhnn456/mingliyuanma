import { NextRequest, NextResponse } from 'next/server';
import { getSession, signToken } from '@/lib/auth-server';
import { queryFirst, execute } from '@/lib/d1';
import { verifyPassword, hashPassword } from '@/lib/password';
import { checkIPRateLimit, getClientIP } from '@/lib/security';

// 登录速率限制：同一 IP 每分钟最多 10 次尝试
const LOGIN_RATE_LIMIT = 10;
const LOGIN_RATE_WINDOW = 60_000; // 1 分钟

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: '请输入邮箱和密码' }, { status: 400 });
    }

    // 登录速率限制（IP 级别）
    const ip = getClientIP(req);
    const rateLimit = await checkIPRateLimit(ip, LOGIN_RATE_LIMIT, LOGIN_RATE_WINDOW);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
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

    // 源码部署代理商不登录主站后台（独立站点自带 admin 后台，主站 /agent 仅面向 SaaS 代理）
    if (user.role === 'agent') {
      const agent = await queryFirst('SELECT level, siteConfig FROM Agent WHERE userId = ?', user.id) as any;
      if (agent) {
        let deployMode = '';
        try {
          const sc = typeof agent.siteConfig === 'string' ? JSON.parse(agent.siteConfig) : (agent.siteConfig || {});
          deployMode = sc.deployMode || sc.level || '';
        } catch { /* 忽略解析错误 */ }
        const isSourceAgent = agent.level === 'source' || deployMode === 'source';
        if (isSourceAgent) {
          return NextResponse.json(
            { error: '您已独立部署站点，请直接登录您的站点后台（域名/admin）管理，主站代理商后台仅面向 SaaS 代理' },
            { status: 403 }
          );
        }
      }
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

    const cookieStr = `token=${token}; Path=/; SameSite=Lax; Max-Age=2592000; Secure; HttpOnly`;

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
    return NextResponse.json({ error: '登录失败，请稍后再试' }, { status: 500 });
  }
}
