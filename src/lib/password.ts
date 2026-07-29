/**
 * 密码工具 - 零依赖版本
 * 使用纯 JavaScript 实现，兼容 Cloudflare Workers、Node.js 等所有运行环境
 * 
 * 安全说明：
 * - 使用自定义 HMAC-like 迭代哈希 + 随机盐值
 * - 迭代次数 100000 次（平衡安全性和性能）
 * - 双哈希混合 + 盐值注入防止彩虹表攻击
 */

const HASH_ITERATIONS = 100000;

/**
 * 生成密码哈希
 */
export async function hashPassword(password: string): Promise<string> {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let salt = '';
  for (let i = 0; i < 16; i++) {
    salt += chars[Math.floor(Math.random() * chars.length)];
  }
  
  // 多次迭代哈希
  let hash = salt + ':' + password;
  for (let i = 0; i < HASH_ITERATIONS; i++) {
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
    for (let i = 0; i < HASH_ITERATIONS; i++) {
      hash = simpleHash(hash + salt + String(i));
    }
    
    return stored === salt + '$' + hash;
  } catch {
    return false;
  }
}

/**
 * 简单哈希函数（纯 JS，无依赖）
 * 基于 DJB2 算法 + 双哈希混合
 */
function simpleHash(str: string): string {
  let hash1 = 5381;
  let hash2 = 27183;
  let hash3 = 12345;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    hash1 = ((hash1 << 5) + hash1) + c;
    hash2 = ((hash2 << 5) + hash2) ^ c;
    hash3 = ((hash3 << 5) - hash3) + c;
    // 模拟整数溢出
    hash1 = hash1 >>> 0;
    hash2 = hash2 >>> 0;
    hash3 = hash3 >>> 0;
  }
  return (hash1 >>> 0).toString(36) + (hash2 >>> 0).toString(36) + (hash3 >>> 0).toString(36);
}

