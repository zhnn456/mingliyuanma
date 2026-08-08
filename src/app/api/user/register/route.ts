import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/password';
import { sanitizeString, validateEmail, validatePassword, getClientIP, checkIPRateLimit } from '@/lib/security';
import { queryFirst, execute } from '@/lib/d1';
import { auditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIP(req);
    const rateLimit = checkIPRateLimit(ip, 5, 60000);
    if (!rateLimit.allowed) return NextResponse.json({ error: '注册尝试过于频繁' }, { status: 429 });

    const body = await req.json();
    let { email, password, name, phone, agentRef } = body;
    email = sanitizeString(email).toLowerCase();
    password = String(password || '');
    name = name ? sanitizeString(name).slice(0, 30) : undefined;
    phone = phone ? sanitizeString(phone) : undefined;
    agentRef = agentRef ? sanitizeString(agentRef) : undefined;

    if (!validateEmail(email)) return NextResponse.json({ error: '请输入有效的邮箱地址' }, { status: 400 });
    const pwdCheck = validatePassword(password);
    if (!pwdCheck.valid) return NextResponse.json({ error: pwdCheck.message }, { status: 400 });

    const existing = await queryFirst('SELECT id FROM User WHERE email = ?', email);
    if (existing) {
      await auditLog({ action: 'register', ip, status: 'failed', details: { email, reason: 'email_exists' } });
      return NextResponse.json({ error: '该邮箱已注册' }, { status: 400 });
    }

    // 如果有 agentRef，验证代理商是否存在且有效
    let agentId: string | undefined;
    let agentCommissionRate: number | undefined;
    if (agentRef) {
      const agent = await queryFirst(
        'SELECT id, commissionRate FROM Agent WHERE id = ? AND isActive = 1',
        agentRef
      ) as any;
      if (agent) {
        agentId = agent.id;
        agentCommissionRate = typeof agent.commissionRate === 'number' ? agent.commissionRate : undefined;
      }
    }

    const passwordHash = await hashPassword(password);
    const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    await execute(
      'INSERT INTO User (id, email, name, passwordHash, role, memberLevel, agentId, dailyUsage, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)',
      id, email, name || email.split('@')[0], passwordHash, 'user', 'free', agentId || null, now, now
    );

    if (phone) {
      await execute('UPDATE User SET phone = ? WHERE id = ?', phone, id);
    }

    await auditLog({
      userId: id,
      action: 'register',
      ip,
      userAgent: req.headers.get('user-agent') || undefined,
      status: 'success',
      details: { email, agentId, agentCommissionRate },
    });

    return NextResponse.json({
      message: '注册成功',
      user: { id, email, name: name || email.split('@')[0], agentId: agentId || null },
    });
  } catch (error) {
    console.error('注册错误:', error);
    return NextResponse.json({ error: '注册失败，请稍后重试' }, { status: 500 });
  }
}
