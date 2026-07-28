/**
 * 密码工具 - 零依赖版本
 * 用纯 JavaScript 实现，不依赖任何外部库和 Web Crypto API
 * 兼容 Cloudflare Workers、Node.js 等所有运行环境
 */

/**
 * 生成密码哈希（使用简单的 HMAC-like 算法 + salt）
 */
export async function hashPassword(password: string): Promise<string> {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let salt = '';
  for (let i = 0; i < 16; i++) {
    salt += chars[Math.floor(Math.random() * chars.length)];
  }
  
  // 多次哈希（模拟 bcrypt 的迭代）
  let hash = salt + ':' + password;
  for (let i = 0; i < 1000; i++) {
    hash = simpleHash(hash + salt + String(i));
  }
  
  return salt + '$' + hash;
}

/**
 * 验证密码
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const parts = stored.split('$');
    if (parts.length < 2) return false;
    const salt = parts[0];
    
    let hash = salt + ':' + password;
    for (let i = 0; i < 1000; i++) {
      hash = simpleHash(hash + salt + String(i));
    }
    
    return stored === salt + '$' + hash;
  } catch {
    return false;
  }
}

/**
 * 简单哈希函数（纯 JS，无依赖）
 * 基于 DJB2 算法（非加密安全，但足以防止明文泄漏）
 */
function simpleHash(str: string): string {
  let hash1 = 5381;
  let hash2 = 27183;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    hash1 = ((hash1 << 5) + hash1) + c;
    hash2 = ((hash2 << 5) + hash2) ^ c;
    // 模拟溢出（保持与 JS 整数范围一致）
    hash1 = hash1 & 0x7FFFFFFF;
    hash2 = hash2 & 0x7FFFFFFF;
  }
  return hash1.toString(36) + hash2.toString(36);
}
