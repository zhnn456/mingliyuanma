import { NextRequest, NextResponse } from 'next/server';
import { verifyLicenseSignature, parseLicense, CENTER_SECRET_KEY } from '@/lib/license-generator';
import { queryFirst, queryAll } from '@/lib/d1';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const license = searchParams.get('license') || '';
  const domain = searchParams.get('domain') || '';
  const version = searchParams.get('version') || '';
  const action = searchParams.get('action') || 'verify';

  if (!license) {
    return NextResponse.json({ valid: false, reason: '缺少授权码' }, { status: 400 });
  }

  // 1. HMAC 签名验证
  const verification = await verifyLicenseSignature(license, domain || undefined);

  if (!verification.valid || !verification.payload) {
    return NextResponse.json({
      valid: false,
      reason: verification.reason || '授权验证失败',
    }, { status: 401 });
  }

  const payload = verification.payload;

  // 2. 查询数据库中的授权状态
  let dbStatus = 'active';
  let dbLicense: any = null;
  try {
    dbLicense = await queryFirst(
      'SELECT status, features, maxUsers, expiryAt FROM AgentLicense WHERE licenseKey = ?',
      license
    ) as any;

    if (dbLicense) {
      if (dbLicense.status !== 'active') {
        dbStatus = dbLicense.status;
      }
      if (dbLicense.expiryAt && new Date(dbLicense.expiryAt) < new Date()) {
        dbStatus = 'expired';
      }
    }
  } catch {}

  if (dbStatus === 'revoked' || dbStatus === 'frozen') {
    return NextResponse.json({
      valid: false,
      reason: '授权已被冻结，请联系管理员',
      status: dbStatus,
    }, { status: 403 });
  }

  if (dbStatus === 'expired') {
    return NextResponse.json({
      valid: false,
      reason: '授权已过期，请续费后使用',
      status: 'expired',
    }, { status: 403 });
  }

  // 3. 返回授权信息
  const agentInfo = await queryFirst(
    'SELECT a.id, a.brandName, a.domain, a.isActive, a.companyName FROM Agent a LEFT JOIN AgentLicense al ON a.id = al.agentId WHERE al.licenseKey = ?',
    license
  ) as any;

  const features = dbLicense?.features
    ? JSON.parse(dbLicense.features)
    : payload.features;

  const maxUsers = dbLicense?.maxUsers || payload.maxUsers || 1000;

  return NextResponse.json({
    valid: true,
    payload: {
      agentId: payload.agentId,
      brandName: agentInfo?.brandName || agentInfo?.companyName || '代理商',
      domain: agentInfo?.domain || payload.domain,
      features,
      maxUsers,
      level: payload.level,
      monthlyFee: payload.monthlyFee,
      expiryAt: payload.expiryAt ? new Date(payload.expiryAt).toISOString() : null,
    },
    serverTime: Date.now(),
    clientIp: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '',
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { license, domain, action } = body;

    if (!license) {
      return NextResponse.json({ valid: false, reason: '缺少授权码' }, { status: 400 });
    }

    const verification = await verifyLicenseSignature(license, domain);

    if (!verification.valid || !verification.payload) {
      return NextResponse.json({
        valid: false,
        reason: verification.reason || '授权验证失败',
      }, { status: 401 });
    }

    const payload = verification.payload;

    // 记录验证日志
    try {
      await queryFirst(
        'SELECT id FROM SiteConfig WHERE key = ?',
        `license_log:${payload.agentId}:${Date.now()}`
      );
    } catch {}

    return NextResponse.json({
      valid: true,
      payload: {
        agentId: payload.agentId,
        features: payload.features,
        level: payload.level,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || '服务器错误' }, { status: 500 });
  }
}
