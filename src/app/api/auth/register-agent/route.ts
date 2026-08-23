import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/password';
import { sanitizeString, validateEmail, validatePassword, validatePhone, getClientIP, checkIPRateLimit } from '@/lib/security';
import { queryFirst, execute, ensureCommissionTables } from '@/lib/d1';
import { auditLog } from '@/lib/audit';
import { generateAgentLicenseAsync } from '@/lib/license-generator';
import { signToken } from '@/lib/auth-server';

const TRIAL_DAYS = 7;

/** 生成代理商推荐码：REF + 6 位随机大写字母数字 */
function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const buf = new Uint8Array(6);
  globalThis.crypto.getRandomValues(buf);
  return 'REF' + Array.from(buf).map((b: number) => chars[b % chars.length]).join('');
}

/** 生成全局唯一推荐码（重试直至不冲突） */
async function generateUniqueReferralCode(maxAttempts = 5): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const code = generateReferralCode();
    const exists = await queryFirst('SELECT id FROM Agent WHERE referralCode = ?', code);
    if (!exists) return code;
  }
  // 极小概率冲突时，附加时间戳后缀保证唯一
  return generateReferralCode() + Date.now().toString(36).slice(-4).toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIP(req);
    const rateLimit = await checkIPRateLimit(ip, 3, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: '注册尝试过于频繁' }, { status: 429 });
    }

    const body = await req.json();
    let { email, password, brandName, contactName, contactPhone } = body;
    email = sanitizeString(email).toLowerCase();
    password = String(password || '');
    brandName = brandName ? sanitizeString(brandName).slice(0, 60) : undefined;
    contactName = contactName ? sanitizeString(contactName).slice(0, 30) : '';
    contactPhone = contactPhone ? sanitizeString(contactPhone) : '';

    if (!validateEmail(email)) {
      return NextResponse.json({ error: '请输入有效的邮箱地址' }, { status: 400 });
    }
    const pwdCheck = validatePassword(password);
    if (!pwdCheck.valid) {
      return NextResponse.json({ error: pwdCheck.message }, { status: 400 });
    }
    if (!contactName) {
      return NextResponse.json({ error: '请输入联系人姓名' }, { status: 400 });
    }
    if (!contactPhone || !validatePhone(contactPhone)) {
      return NextResponse.json({ error: '请输入有效的联系人手机号' }, { status: 400 });
    }

    const existing = await queryFirst('SELECT id FROM User WHERE email = ?', email);
    if (existing) {
      await auditLog({ action: 'register', ip, status: 'failed', details: { email, reason: 'email_exists', role: 'agent' } });
      return NextResponse.json({ error: '该邮箱已注册' }, { status: 400 });
    }

    // 确保 Agent 表已包含扩展字段（commissionRate/level/plan/planExpiry/referralCode 等）
    await ensureCommissionTables();

    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();
    const nowTs = Date.now();
    const expiryTs = nowTs + TRIAL_DAYS * 24 * 60 * 60 * 1000;
    const planExpiry = new Date(expiryTs).toISOString();

    const userId = `usr_${nowTs}_${Math.random().toString(36).slice(2, 8)}`;
    const agentId = `agt_${nowTs}_${Math.random().toString(36).slice(2, 8)}`;
    const referralCode = await generateUniqueReferralCode();

    // 1. 创建 User，role = 'agent'
    await execute(
      `INSERT INTO User (id, email, passwordHash, name, phone, role, memberLevel, agentId, dailyUsage, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, 'agent', 'trial', ?, 0, ?, ?)`,
      userId, email, passwordHash, contactName, contactPhone, agentId, now, now
    );

    // 2. 生成授权码（HMAC 签名，试用期 7 天）
    const signedLicense = await generateAgentLicenseAsync({
      agentId,
      features: ['bazi', 'ziwei', 'qimen', 'meihua'],
      maxUsers: 500,
      expiryAt: expiryTs,
      level: 'basic',
      monthlyFee: 0,
    });
    const licenseKey = signedLicense.raw;

    // 3. 创建 Agent 记录
    await execute(
      `INSERT INTO Agent (
        id, userId, companyName, contactName, contactPhone, brandName,
        licenseKey, licenseExpiry, siteConfig, isActive,
        commissionRate, level, plan, planExpiry, balance, referralCode, maxCustomers, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, 0, ?, 500, ?, ?)`,
      agentId,
      userId,
      brandName || contactName,
      contactName,
      contactPhone,
      brandName || contactName,
      licenseKey,
      planExpiry,
      JSON.stringify({
        maxUsers: 500,
        customPricing: false,
        whiteLabel: false,
        level: 'basic',
        monthlyFee: 0,
        trial: true,
      }),
      0.3,                // commissionRate
      'saas',             // level
      'trial',            // plan
      planExpiry,         // planExpiry
      referralCode,       // referralCode
      now,                // createdAt
      now                 // updatedAt
    );

    // 4. 记录授权码到 AgentLicense 表（与 admin 创建流程保持一致）
    const licenseId = `lic_${nowTs}_${Math.random().toString(36).slice(2, 8)}`;
    await execute(
      `INSERT INTO AgentLicense (id, agentId, licenseKey, domain, maxUsers, expiryAt, features, status, createdAt, updatedAt, signature)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
      licenseId,
      agentId,
      licenseKey,
      null,
      500,
      planExpiry,
      JSON.stringify(['bazi', 'ziwei', 'qimen', 'meihua']),
      now,
      now,
      signedLicense.signature
    );

    await auditLog({
      userId,
      action: 'register',
      ip,
      userAgent: req.headers.get('user-agent') || undefined,
      status: 'success',
      details: { email, role: 'agent', agentId, brandName, referralCode, plan: 'trial' },
    });

    // 5. 签发登录 Token，便于注册后自动登录
    let token: string | undefined;
    try {
      token = await signToken({
        sub: userId,
        email,
        name: contactName,
        role: 'agent',
        memberLevel: 'trial',
      });
    } catch (signErr: any) {
      console.error('[register-agent] signToken error:', signErr?.message);
    }

    const responseBody = {
      message: '代理商注册成功',
      user: { id: userId, email, name: contactName, role: 'agent' },
      agent: {
        id: agentId,
        userId,
        brandName: brandName || contactName,
        contactName,
        contactPhone,
        level: 'saas',
        plan: 'trial',
        planExpiry,
        commissionRate: 0.3,
        referralCode,
        licenseKey,
        licenseExpiry: planExpiry,
        isActive: 1,
      },
    };

    if (token) {
      const cookieStr = `token=${token}; Path=/; SameSite=Lax; Max-Age=2592000; Secure; HttpOnly`;
      return new NextResponse(JSON.stringify(responseBody), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': cookieStr,
        },
      });
    }

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error('代理商注册错误:', error);
    return NextResponse.json({ error: '注册失败，请稍后重试' }, { status: 500 });
  }
}
