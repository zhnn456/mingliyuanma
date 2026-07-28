/**
 * @panva/hkdf 的 Workers 兼容替代实现
 *
 * 原版 @panva/hkdf 在有 crypto.hkdf 时会用它，
 * 但 Workers 的 crypto.hkdf 基于 Web Crypto API，不接受字符串参数，
 * 报 "Code generation from strings disallowed for this context"。
 *
 * 这个实现强制用 createHmac fallback（能接受字符串）。
 */
import crypto from 'crypto';

const toBuf = (v: unknown): Buffer | Uint8Array => {
  if (typeof v === 'string') return Buffer.from(v);
  if (v instanceof ArrayBuffer) return new Uint8Array(v);
  return v as Buffer | Uint8Array;
};

export default async function hkdf(
  digest: string,
  ikm: unknown,
  salt: unknown,
  info: unknown,
  keylen: number
): Promise<Uint8Array> {
  const ikmBuf = toBuf(ikm);
  const saltBuf = toBuf(salt) as Uint8Array;
  const infoBuf = toBuf(info) as Uint8Array;

  const hashlen = parseInt(digest.substr(3), 10) >> 3 || 20;
  const prk = crypto
    .createHmac(digest, saltBuf.byteLength ? saltBuf : new Uint8Array(hashlen))
    .update(ikmBuf)
    .digest();
  const N = Math.ceil(keylen / hashlen);
  const T = new Uint8Array(hashlen * N + infoBuf.byteLength + 1);
  let prev = 0;
  let start = 0;
  for (let c = 1; c <= N; c++) {
    T.set(infoBuf, start);
    T[start + infoBuf.byteLength] = c;
    T.set(
      crypto
        .createHmac(digest, prk)
        .update(T.subarray(prev, start + infoBuf.byteLength + 1))
        .digest(),
      start
    );
    prev = start;
    start += hashlen;
  }
  return T.slice(0, keylen);
}
