/**
 * @panva/hkdf 的 Workers 兼容替代实现
 *
 * 使用 Web Crypto API (crypto.subtle) 实现 HKDF，
 * 兼容 Cloudflare Workers 环境。
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBuf(v: unknown): ArrayBuffer {
  if (typeof v === 'string') return encoder.encode(v).buffer as ArrayBuffer;
  if (v instanceof ArrayBuffer) return v;
  if (v && typeof v === 'object' && 'buffer' in v) return (v as any).buffer;
  return encoder.encode(String(v)).buffer as ArrayBuffer;
}

export default async function hkdf(
  digest: string,
  ikm: unknown,
  salt: unknown,
  info: unknown,
  keylen: number
): Promise<Uint8Array> {
  const ikmBuf = toBuf(ikm);
  const saltBuf = toBuf(salt);
  const infoBuf = toBuf(info);

  const hashMap: Record<string, string> = {
    'sha256': 'SHA-256',
    'sha384': 'SHA-384',
    'sha512': 'SHA-512',
  };
  const algo = hashMap[digest.toLowerCase()] || 'SHA-256';

  const baseKey = await crypto.subtle.importKey(
    'raw',
    ikmBuf,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );

  const derived = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: algo,
      salt: saltBuf,
      info: infoBuf,
    },
    baseKey,
    { name: 'AES-GCM', length: keylen * 8 },
    false,
    ['encrypt']
  );

  const result = await crypto.subtle.exportKey('raw', derived);
  return new Uint8Array(result);
}
