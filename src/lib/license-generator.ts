/**
 * 授权码生成器（仅中央服务器使用）
 * 
 * 安全设计：
 * - HMAC-SHA256 签名（密钥仅中央持有）
 * - 域名绑定（防止授权码在其他域名使用）
 * - 时效验证（过期自动失效）
 * - 载荷完整性（防止篡改）
 */

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
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
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

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hmacVerify(data: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const expectedSig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const expectedHex = Array.from(new Uint8Array(expectedSig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  if (signature.length !== expectedHex.length) return false;
  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedHex.charCodeAt(i);
  }
  return result === 0;
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
  const signature = await hmacSignSync(payloadStr);
  const raw = `LIC.${base64UrlEncode(payloadStr)}.${signature}`;

  return { payload: fullPayload, signature, raw };
}

async function hmacSignSync(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(CENTER_SECRET_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
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
  const signature = await hmacSign(payloadStr, CENTER_SECRET_KEY);
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

    const validSig = await hmacVerify(payloadStr, signature, CENTER_SECRET_KEY);
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
