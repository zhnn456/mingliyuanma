/**
 * JWT 工具 — 纯 Web Crypto API 实现
 * 纯 JavaScript 实现（零 Node.js 依赖）
 */

const ALGORITHM = { name: 'HMAC', hash: 'SHA-256' };

function base64url(data: Uint8Array | ArrayBuffer): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64urlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  // 补 padding
  while (str.length % 4) str += '=';
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * 签发 JWT
 */
export async function signJWT(
  payload: Record<string, any>,
  secret: string,
  expiresInSeconds: number = 30 * 24 * 3600 // 默认30天
): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);

  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const headerB64 = base64url(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64url(new TextEncoder().encode(JSON.stringify(fullPayload)));
  const signingInput = headerB64 + '.' + payloadB64;

  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    ALGORITHM,
    false,
    ['sign']
  );

  const signature = await globalThis.crypto.subtle.sign(ALGORITHM, key, new TextEncoder().encode(signingInput));

  return signingInput + '.' + base64url(signature);
}

/**
 * 验证 JWT，返回 payload（过期/无效返回 null）
 */
export async function verifyJWT(token: string, secret: string): Promise<Record<string, any> | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const signingInput = headerB64 + '.' + payloadB64;

    const key = await globalThis.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      ALGORITHM,
      false,
      ['verify']
    );

    const isValid = await globalThis.crypto.subtle.verify(
      ALGORITHM,
      key,
      base64urlDecode(signatureB64) as BufferSource,
      new TextEncoder().encode(signingInput) as BufferSource
    );

    if (!isValid) return null;

    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(payloadB64)));

    // 检查过期
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * 从 Request 中读取 JWT（从 cookie 或 Authorization header）
 */
export function getTokenFromRequest(req: Request): string | null {
  // 先查 Authorization header
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    return auth.slice(7);
  }

  // 再查 cookie
  const cookie = req.headers.get('cookie');
  if (!cookie) return null;

  const match = cookie.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
