/**
 * 密码工具 — Cloudflare Workers 兼容版
 * 使用 Web Crypto SubtleCrypto 的 PBKDF2-SHA256
 * CF Workers 原生支持 SubtleCrypto，零依赖
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
    false,
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
    if (parts.length !== 3) return false;

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
      false,
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
  } catch {
    return false;
  }
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
