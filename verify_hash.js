const { webcrypto } = require('crypto');
global.crypto = webcrypto;

async function verifyPassword(password, stored) {
  try {
    const parts = stored.split('$');
    if (parts.length === 3 && parts[0].startsWith('pbkdf2_')) {
      return verifyPBKDF2(password, parts);
    }
    return false;
  } catch(e) { return false; }
}

async function verifyPBKDF2(password, parts) {
  const [algoPart, saltB64, keyB64] = parts;
  const iterations = parseInt(algoPart.split('_')[1] || '100000', 10);
  const salt = base64ToArrayBuffer(saltB64);
  const expectedKey = base64ToArrayBuffer(keyB64);

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: expectedKey.byteLength * 8 }, true, ['encrypt']);
  const actualKey = new Uint8Array(await crypto.subtle.exportKey('raw', key));
  const expected = new Uint8Array(expectedKey);
  if (actualKey.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actualKey.length; i++) diff |= actualKey[i] ^ expected[i];
  return diff === 0;
}

function base64ToArrayBuffer(b64) {
  const binary = Buffer.from(b64, 'base64').toString('binary');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

const hash = 'pbkdf2_100000$5CHhIVsI5tmqCSK67ByZmg==$eNrh/0N1mQVitt5bvInl4xvMtKoPCZAlNO0siTQka3M=';
verifyPassword('admin123', hash).then(result => {
  console.log('VERIFY_RESULT: ' + result);
});
