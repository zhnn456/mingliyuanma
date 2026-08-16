/**
 * 授权码生成器（仅中央服务器使用）
 * 
 * 安全设计：
 * - HMAC-SHA256 签名（密钥仅中央持有）
 * - 域名绑定（防止授权码在其他域名使用）
 * - 时效验证（过期自动失效）
 * - 载荷完整性（防止篡改）
 */

import { createHmac, timingSafeEqual } from 'crypto';

export interface LicensePayload {
  agentId: string;
  features: string[];
  maxUsers: number;
  issuedAt: number;
  expiryAt: number | null;
  version: number;
  domain?: string;
  level?: 'basic' | 'standard' | 'premium' | 'saas' | 'source';
  monthlyFee?: number;
  upgradeExpiryAt?: number | null;
  upgradePlan?: 'free' | 'annual' | 'none';
}

export interface SignedLicense {
  payload: LicensePayload;
  signature: string;
  raw: string;
}

const CENTER_SECRET_KEY = process.env.CENTER_SECRET_KEY || 'zhiwei-center-secret-key-v4';

const ENABLED_FEATURES = ['bazi', 'ziwei', 'qimen', 'meihua', 'offering', 'marketing', 'data-export'];

function base64UrlEncode(str: string): string {
  return Buffer.from(str, 'utf-8').toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(b64url: string): string {
  let base64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64.length % 4;
  if (padding === 2) base64 += '==';
  else if (padding === 3) base64 += '=';
  else if (padding === 1) throw new Error('Invalid base64url string');
  return Buffer.from(base64, 'base64').toString('utf-8');
}

function hmacSign(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data, 'utf-8').digest('hex');
}

function hmacVerify(data: string, signature: string, secret: string): boolean {
  const expectedHex = createHmac('sha256', secret).update(data, 'utf-8').digest('hex');
  if (signature.length !== expectedHex.length) return false;
  try {
    return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedHex, 'hex'));
  } catch {
    return false;
  }
}

export async function generateAgentLicense(payload: Omit<LicensePayload, 'version' | 'issuedAt'>): Promise<SignedLicense> {
  const fullPayload: LicensePayload = {
    agentId: payload.agentId,
    features: payload.features.filter(f => ENABLED_FEATURES.includes(f)),
    maxUsers: payload.maxUsers,
    issuedAt: Date.now(),
    expiryAt: payload.expiryAt,
    version: 2,
    domain: payload.domain,
    level: payload.level,
    monthlyFee: payload.monthlyFee,
    upgradeExpiryAt: payload.upgradeExpiryAt,
    upgradePlan: payload.upgradePlan,
  };

  const payloadStr = JSON.stringify(fullPayload);
  const signature = hmacSign(payloadStr, CENTER_SECRET_KEY);
  const raw = `LIC.${base64UrlEncode(payloadStr)}.${signature}`;

  return { payload: fullPayload, signature, raw };
}

export async function generateAgentLicenseAsync(
  payload: Omit<LicensePayload, 'version' | 'issuedAt'>
): Promise<SignedLicense> {
  const fullPayload: LicensePayload = {
    agentId: payload.agentId,
    features: payload.features.filter(f => ENABLED_FEATURES.includes(f)),
    maxUsers: payload.maxUsers,
    issuedAt: Date.now(),
    expiryAt: payload.expiryAt,
    version: 2,
    domain: payload.domain,
    level: payload.level,
    monthlyFee: payload.monthlyFee,
    upgradeExpiryAt: payload.upgradeExpiryAt,
    upgradePlan: payload.upgradePlan,
  };

  const payloadStr = JSON.stringify(fullPayload);
  const signature = hmacSign(payloadStr, CENTER_SECRET_KEY);
  const raw = `LIC.${base64UrlEncode(payloadStr)}.${signature}`;

  return { payload: fullPayload, signature, raw };
}

export async function verifyLicenseSignature(license: string, expectedDomain?: string): Promise<{ valid: boolean; payload?: LicensePayload; reason?: string }> {
  try {
    const parts = license.split('.');
    if (parts.length !== 3 || parts[0] !== 'LIC') {
      return { valid: false, reason: '授权码格式错误' };
    }

    const payloadStr = base64UrlDecode(parts[1]);
    const signature = parts[2];

    const payload: LicensePayload = JSON.parse(payloadStr);

    const validSig = hmacVerify(payloadStr, signature, CENTER_SECRET_KEY);
    if (!validSig) {
      return { valid: false, reason: '签名验证失败' };
    }

    if (payload.expiryAt && payload.expiryAt < Date.now()) {
      return { valid: false, reason: '授权已过期' };
    }

    if (expectedDomain && payload.domain && payload.domain !== expectedDomain) {
      return { valid: false, reason: '域名不匹配' };
    }

    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, reason: err?.message || '验证异常' };
  }
}

export function parseLicense(license: string): { payload: LicensePayload; valid: boolean } | null {
  try {
    const parts = license.split('.');
    if (parts.length !== 3 || parts[0] !== 'LIC') return null;
    const payloadStr = base64UrlDecode(parts[1]);
    const payload = JSON.parse(payloadStr);
    return { payload, valid: true };
  } catch {
    return null;
  }
}

export { ENABLED_FEATURES, CENTER_SECRET_KEY };
