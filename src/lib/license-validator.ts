/**
 * 授权验证器（代理商端使用）
 * 
 * 双验证机制：
 * 1. 本地解析 License（快速提取信息）
 * 2. 远程验证（向中央服务器确认）
 * 
 * 容错策略：
 * - 24 小时宽限期（远程失败时允许使用缓存）
 * - 功能降级（授权过期后限制功能）
 */

import type { LicensePayload } from './license-generator';

const GRACE_PERIOD = 24 * 60 * 60 * 1000; // 24 小时
const DEGRADE_AFTER = 72 * 60 * 60 * 1000; // 72 小时后只读

let _cachedPayload: LicensePayload | null = null;
let _lastVerifiedAt: number = 0;
let _cachePromise: Promise<LicenseVerification> | null = null;

export interface LicenseVerification {
  valid: boolean;
  payload?: LicensePayload;
  reason?: string;
  offline?: boolean;
  degraded?: boolean;
}

const CENTER_API = process.env.CENTER_API || 'https://mingli-yuanma.zhnn456.workers.dev';
const LICENSE_KEY = process.env.APP_LICENSE_KEY || '';
const CURRENT_DOMAIN = process.env.NEXTAUTH_URL || '';
const CURRENT_VERSION = process.env.APP_VERSION || 'v4.0.0';

export function getLicenseConfig() {
  return { CENTER_API, LICENSE_KEY, CURRENT_DOMAIN, CURRENT_VERSION };
}

export function getCachedLicense(): LicensePayload | null {
  if (Date.now() - _lastVerifiedAt > GRACE_PERIOD * 2) {
    _cachedPayload = null;
  }
  return _cachedPayload;
}

export function setCachedLicense(payload: LicensePayload | null, verifiedAt: number = Date.now()) {
  _cachedPayload = payload;
  _lastVerifiedAt = verifiedAt;
}

export async function verifyLicense(): Promise<LicenseVerification> {
  if (!LICENSE_KEY) {
    return { valid: false, reason: '未配置授权码' };
  }

  if (_cachePromise) return _cachePromise;

  _cachePromise = doVerifyLicense().finally(() => { _cachePromise = null; });
  return _cachePromise;
}

async function doVerifyLicense(): Promise<LicenseVerification> {
  try {
    const url = `${CENTER_API}/api/license/verify`;
    const params = new URLSearchParams({
      license: LICENSE_KEY,
      domain: CURRENT_DOMAIN,
      version: CURRENT_VERSION,
    });

    const initOptions: any = {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cf: { cacheTtl: 0 },
    };
    const res = await fetch(`${url}?${params}`, initOptions);

    if (res.ok) {
      const data = await res.json();
      if (data.valid && data.payload) {
        setCachedLicense(data.payload);
        return { valid: true, payload: data.payload };
      }
      return { valid: false, reason: data.reason || '授权验证失败' };
    }
  } catch {}

  // 远程失败，使用本地缓存
  const cached = getCachedLicense();
  if (cached) {
    const age = Date.now() - _lastVerifiedAt;
    if (age < GRACE_PERIOD) {
      return { valid: true, payload: cached, offline: true };
    }
    if (age < DEGRADE_AFTER) {
      return { valid: true, payload: cached, offline: true, degraded: true };
    }
  }

  return { valid: false, reason: '授权验证超时，请联系管理员' };
}

export function hasFeature(feature: string): boolean {
  const payload = getCachedLicense();
  if (!payload) return false;
  return payload.features.includes(feature);
}

export function isFeatureAllowed(feature: string): boolean {
  const verification = getCachedLicense();
  if (!verification) return false;
  if (!verification.features?.includes(feature)) return false;
  return true;
}

export function getAgentInfo(): { brandName: string; features: string[]; level: string } | null {
  const payload = getCachedLicense();
  if (!payload) return null;
  return {
    brandName: `代理商 ${payload.agentId}`,
    features: payload.features,
    level: payload.level || 'basic',
  };
}

export function isOnline(): boolean {
  return Date.now() - _lastVerifiedAt < GRACE_PERIOD;
}

export function isDegraded(): boolean {
  const cached = getCachedLicense();
  if (!cached) return true;
  return Date.now() - _lastVerifiedAt > DEGRADE_AFTER;
}
