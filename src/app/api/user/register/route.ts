import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/password';
import { sanitizeString, validateEmail, validatePassword, getClientIP, checkIPRateLimit } from '@/lib/security';
import { queryFirst, execute } from '@/lib/d1';
import { auditLog } from '@/lib/audit';
import { MEMBER_LEVELS } from '@/lib/pricing';

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

    // 获取agentId：优先使用请求头中的x-agent-id（由middleware设置）
    const agentIdFromHeader = req.headers.get('x-agent-id');

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
    } else if (agentIdFromHeader) {
      // 如果没有agentRef但middleware设置了agentId，使用该agentId
      agentId = agentIdFromHeader;
    }

    const passwordHash = await hashPassword(password);
    const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    // 使用统一的会员等级常量
    const memberLevel = 'free' as const;

    await execute(
      'INSERT INTO User (id, email, name, passwordHash, role, memberLevel, agentId, dailyUsage, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)',
      id, email, name || email.split('@')[0], passwordHash, 'user', memberLevel, agentId || null, now, now
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
      user: {
        id,
        email,
        name: name || email.split('@')[0],
        agentId: agentId || null,
        memberLevel,
        memberLevelName: MEMBER_LEVELS[memberLevel],
      },
    });
  } catch (error) {
    console.error('注册错误:', error);
    return NextResponse.json({ error: '注册失败，请稍后重试' }, { status: 500 });
  }
}
