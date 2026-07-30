const { webcrypto } = require('crypto');
global.crypto = webcrypto;

const ITERATIONS = 100000;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

async function hashPassword(password) {
  const salt = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(salt);
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: KEY_LENGTH * 8 }, true, ['encrypt']);
  const keyBytes = new Uint8Array(await crypto.subtle.exportKey('raw', key));
  
  function arrToB64(buf) {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return Buffer.from(binary, 'binary').toString('base64');
  }
  
  return 'pbkdf2_' + ITERATIONS + '$' + arrToB64(salt) + '$' + arrToB64(keyBytes);
}

hashPassword('admin123').then(hash => {
  require('fs').writeFileSync('f:/mingliyuanma/update_password.sql', "UPDATE User SET passwordHash='" + hash + "' WHERE email='282063152@qq.com';");
  console.log('Hash: ' + hash);
  console.log('SQL file written');
});
