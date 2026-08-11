/**
 * 密码工具 — 纯 JS 实现
 * 使用 Web Crypto SubtleCrypto 的 PBKDF2-SHA256（新格式）
 * 兼容旧格式（salt$hash，2段式）
 */

const ITERATIONS = 100000;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

export async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(salt);

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH * 8 },
    true,
    ['encrypt']
  );

  const keyBytes = new Uint8Array(await crypto.subtle.exportKey('raw', key));
  const saltB64 = arrayBufferToBase64(salt);
  const keyB64 = arrayBufferToBase64(keyBytes);

  return `pbkdf2_${ITERATIONS}$${saltB64}$${keyB64}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const parts = stored.split('$');

    if (parts.length === 3 && parts[0].startsWith('pbkdf2_')) {
      return verifyPBKDF2(password, parts);
    }

    if (parts.length === 2) {
      return verifyOldFormat(password, parts[0], parts[1]);
    }

    return false;
  } catch {
    return false;
  }
}

async function verifyPBKDF2(password: string, parts: string[]): Promise<boolean> {
  const [algoPart, saltB64, keyB64] = parts;
  const iterations = parseInt(algoPart.split('_')[1] || '100000', 10);

  const salt = base64ToArrayBuffer(saltB64);
  const expectedKey = base64ToArrayBuffer(keyB64);

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: expectedKey.byteLength * 8 },
    true,
    ['encrypt']
  );

  const actualKey = new Uint8Array(await crypto.subtle.exportKey('raw', key));
  const expected = new Uint8Array(expectedKey);

  if (actualKey.length !== expected.length) return false;

  let diff = 0;
  for (let i = 0; i < actualKey.length; i++) {
    diff |= actualKey[i] ^ expected[i];
  }
  return diff === 0;
}

/**
 * 验证旧格式密码哈希（2段式 salt$hash）
 * 尝试多种可能的哈希算法
 */
async function verifyOldFormat(password: string, saltB64: string, hashB64: string): Promise<boolean> {
  try {
    const saltBytes = base64ToArrayBuffer(saltB64);
    const expectedHash = new Uint8Array(base64ToArrayBuffer(hashB64));
    const passwordBytes = new TextEncoder().encode(password);

    // 方案1: SHA-256(salt + password) 截断
    const combined1 = new Uint8Array(saltBytes.byteLength + passwordBytes.byteLength);
    combined1.set(new Uint8Array(saltBytes), 0);
    combined1.set(passwordBytes, saltBytes.byteLength);
    const hash1 = await sha256Bytes(combined1, expectedHash.length);
    if (timingEqual(hash1, expectedHash)) return true;

    // 方案2: SHA-256(password + salt) 截断
    const combined2 = new Uint8Array(passwordBytes.byteLength + saltBytes.byteLength);
    combined2.set(passwordBytes, 0);
    combined2.set(new Uint8Array(saltBytes), passwordBytes.byteLength);
    const hash2 = await sha256Bytes(combined2, expectedHash.length);
    if (timingEqual(hash2, expectedHash)) return true;

    // 方案3: HMAC-SHA256(salt, password) 截断
    const hmacHash = await hmacSha256(saltBytes, passwordBytes, expectedHash.length);
    if (timingEqual(hmacHash, expectedHash)) return true;

    return false;
  } catch {
    return false;
  }
}

async function sha256Bytes(data: BufferSource, truncateTo: number): Promise<Uint8Array> {
  const hash = await crypto.subtle.digest('SHA-256', data);
  const result = new Uint8Array(hash);
  return result.slice(0, truncateTo);
}

async function hmacSha256(keyData: BufferSource, message: BufferSource, truncateTo: number): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, message);
  const result = new Uint8Array(sig);
  return result.slice(0, truncateTo);
}

function timingEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

function arrayBufferToBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
