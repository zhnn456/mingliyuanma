/**
 * 版本检查器（代理商端）
 * 
 * 检查中央服务器是否有新版本可用
 * 定时执行（每 30 分钟）或手动触发
 */

const CENTER_API = process.env.CENTER_API || 'https://mingli-yuanma.zhnn456.workers.dev';
const LICENSE_KEY = process.env.APP_LICENSE_KEY || '';
const CURRENT_VERSION = process.env.APP_VERSION || 'v4.0.0';
const CURRENT_DOMAIN = process.env.NEXTAUTH_URL || '';

let _lastCheckTime = 0;
let _cachedUpdate: { hasUpdate: boolean; latest: string; changelog: any[] } | null = null;

export interface UpdateInfo {
  hasUpdate: boolean;
  latest: string | null;
  current: string;
  changelog: Array<{
    version: string;
    title: string;
    category: string;
    content: string;
    createdAt: string;
  }>;
  checkedAt: number;
  downloadUrl?: string;
}

export async function checkForUpdates(force = false): Promise<UpdateInfo> {
  if (!force && _cachedUpdate && Date.now() - _lastCheckTime < 30 * 60 * 1000) {
    return {
      hasUpdate: _cachedUpdate.hasUpdate,
      latest: _cachedUpdate.latest,
      current: CURRENT_VERSION,
      changelog: _cachedUpdate.changelog,
      checkedAt: _lastCheckTime,
    };
  }

  try {
    const params = new URLSearchParams({
      license: LICENSE_KEY,
      current: CURRENT_VERSION,
      domain: CURRENT_DOMAIN,
    });

    const initOptions: any = {
      method: 'GET',
      cf: { cacheTtl: 0 },
    };
    const res = await fetch(`${CENTER_API}/api/version/check?${params}`, initOptions);

    if (res.ok) {
      const data = await res.json();
      _cachedUpdate = {
        hasUpdate: data.hasUpdate || false,
        latest: data.latest || null,
        changelog: data.changelog || [],
      };
      _lastCheckTime = Date.now();

      return {
        hasUpdate: data.hasUpdate || false,
        latest: data.latest || null,
        current: CURRENT_VERSION,
        changelog: data.changelog || [],
        checkedAt: _lastCheckTime,
        downloadUrl: data.downloadUrl,
      };
    }
  } catch {}

  return {
    hasUpdate: false,
    latest: null,
    current: CURRENT_VERSION,
    changelog: [],
    checkedAt: _lastCheckTime,
  };
}

export function getCachedUpdate(): UpdateInfo | null {
  if (!_cachedUpdate) return null;
  return {
    hasUpdate: _cachedUpdate.hasUpdate,
    latest: _cachedUpdate.latest,
    current: CURRENT_VERSION,
    changelog: _cachedUpdate.changelog,
    checkedAt: _lastCheckTime,
  };
}

export function getCurrentVersion(): string {
  return CURRENT_VERSION;
}

export function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/i, '').split(/[.\-]/);
  const pb = b.replace(/^v/i, '').split(/[.\-]/);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = parseInt(pa[i] || '0', 10);
    const nb = parseInt(pb[i] || '0', 10);
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}
