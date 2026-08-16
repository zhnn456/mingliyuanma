/**
 * 升级下载 token 管理
 * 
 * 内存缓存，用于 check 接口生成 token，download 接口验证 token
 * 重启后清空（无状态，客户需重新检查更新）
 */
import crypto from 'crypto';

interface DownloadTokenInfo {
  agentId: string;
  version: string;
  clientIP: string;
  expiry: number;
}

const _downloadTokens = new Map<string, DownloadTokenInfo>();
const MAX_TOKENS = 500;

/** 生成下载 token */
export function createDownloadToken(agentId: string, version: string, clientIP: string): string {
  if (_downloadTokens.size >= MAX_TOKENS) cleanupExpiredTokens();
  const token = crypto.randomBytes(32).toString('hex');
  _downloadTokens.set(token, {
    agentId,
    version,
    clientIP,
    expiry: Date.now() + 2 * 60 * 60 * 1000, // 2小时有效
  });
  return token;
}

/** 验证下载 token */
export function getDownloadTokenInfo(token: string): DownloadTokenInfo | undefined {
  return _downloadTokens.get(token);
}

/** 删除下载 token（一次性使用） */
export function removeDownloadToken(token: string): void {
  _downloadTokens.delete(token);
}

/** 清理过期 token（定期调用） */
export function cleanupExpiredTokens(): void {
  const now = Date.now();
  for (const [token, info] of _downloadTokens) {
    if (info.expiry < now) {
      _downloadTokens.delete(token);
    }
  }
}