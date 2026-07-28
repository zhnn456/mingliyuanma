/**
 * Cloudflare Workers 兼容补丁
 *
 * 问题：NextAuth v4 把字符串 secret 传给 @panva/hkdf，
 * @panva/hkdf 调用 crypto.hkdf()，而 Workers 的 crypto.hkdf()
 * 基于 Web Crypto API，不接受字符串参数（只接受 Uint8Array/ArrayBuffer），
 * 报 "Code generation from strings disallowed for this context"。
 *
 * 修复：monkey-patch crypto.hkdf，把字符串参数转成 Uint8Array。
 */
import crypto from 'crypto';

const _origHkdf = (crypto as any).hkdf;
if (_origHkdf && typeof _origHkdf === 'function') {
  (crypto as any).hkdf = function (
    digest: string,
    ikm: any,
    salt: any,
    info: any,
    keylen: number,
    callback: Function
  ) {
    const toBuf = (v: any) => {
      if (typeof v === 'string') return new TextEncoder().encode(v);
      if (v instanceof ArrayBuffer) return new Uint8Array(v);
      return v;
    };
    return _origHkdf.call(this, digest, toBuf(ikm), toBuf(salt), toBuf(info), keylen, callback);
  };
}

// 同时 patch createSecretKey，防止其他库从字符串生成 key
const _origCreateSecretKey = crypto.createSecretKey.bind(crypto);
(crypto as any).createSecretKey = (key: any, encoding?: any) => {
  if (typeof key === 'string') {
    return _origCreateSecretKey(new TextEncoder().encode(key));
  }
  return _origCreateSecretKey(key, encoding ?? undefined);
};
