import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { sanitizeString, validateEmail, validatePassword, getClientIP, checkIPRateLimit } from '@/lib/security';
import { auditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    // IP 速率限制（注册接口更严格）
    const ip = getClientIP(req);
    const rateLimit = checkIPRateLimit(ip, 5, 60_000); // 每分钟最多5次注册
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: '注册尝试过于频繁，请稍后再试' },
        { status: 429 }
      );
    }

    const body = await req.json();
    let { email, password, name, phone } = body;

    // 清理输入
    email = sanitizeString(email).toLowerCase();
    password = String(password || '');
    name = name ? sanitizeString(name).slice(0, 30) : undefined;
    phone = phone ? sanitizeString(phone) : undefined;

    // 验证邮箱
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: '请输入有效的邮箱地址' },
        { status: 400 }
      );
    }

    // 验证密码强度
    const pwdCheck = validatePassword(password);
    if (!pwdCheck.valid) {
      return NextResponse.json(
        { error: pwdCheck.message },
        { status: 400 }
      );
    }

    // 验证手机号（可选）
    if (phone && !/^\d{11}$/.test(phone)) {
      return NextResponse.json(
        { error: '手机号格式不正确' },
        { status: 400 }
      );
    }

    // 检查邮箱是否已注册
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      await auditLog({
        action: 'register',
        ip,
        status: 'failed',
        details: { email, reason: 'email_exists' },
      });
      return NextResponse.json(
        { error: '该邮箱已注册' },
        { status: 400 }
      );
    }

    // 加密密码（使用12轮salt增强安全性）
    const passwordHash = await bcrypt.hash(password, 12);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || email.split('@')[0],
        phone: phone || null,
        role: 'user',
        memberLevel: 'free',
        dailyUsage: 0,
      },
    });

    // 审计日志
    await auditLog({
      userId: user.id,
      action: 'register',
      ip,
      userAgent: req.headers.get('user-agent') || undefined,
      status: 'success',
      details: { email },
    });

    return NextResponse.json({
      message: '注册成功',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('注册错误:', error);
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}
