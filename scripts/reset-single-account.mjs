/** 单独重置 admin@test.com 密码并立即验证 */
import crypto from 'crypto';
import mysql from 'mysql2/promise';

function hashPasswordCompat(password) {
  const ITERATIONS = 100000;
  const SALT_LENGTH = 16;
  const KEY_LENGTH = 32;
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
  return `pbkdf2_${ITERATIONS}$${salt.toString('base64')}$${key.toString('base64')}`;
}

function verifyPasswordCompat(password, storedHash) {
  if (!storedHash || !storedHash.startsWith('pbkdf2_')) return false;
  const parts = storedHash.split('$');
  if (parts.length !== 3) return false;
  const iterations = parseInt(parts[0].replace('pbkdf2_', ''));
  const salt = Buffer.from(parts[1], 'base64');
  const storedKey = parts[2];
  const key = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256');
  return key.toString('base64') === storedKey;
}

async function main() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'ming8',
    password: process.env.MYSQL_PASSWORD || 'Ming8@2026!',
    database: process.env.MYSQL_DATABASE || 'ming8_db',
    charset: 'utf8mb4',
  });

  const email = 'admin@test.com';
  const password = 'admin123';

  // 1. 生成哈希
  const hash = hashPasswordCompat(password);
  console.log('新哈希:', hash);

  // 2. 立即验证哈希
  const ok1 = verifyPasswordCompat(password, hash);
  console.log('本地验证:', ok1 ? 'PASS' : 'FAIL');

  // 3. 更新数据库
  await pool.execute(
    'UPDATE User SET passwordHash = ?, updatedAt = NOW() WHERE email = ?',
    [hash, email]
  );
  console.log('数据库已更新');

  // 4. 从数据库读回验证
  const [rows] = await pool.query('SELECT passwordHash FROM User WHERE email = ?', [email]);
  const dbHash = rows[0]?.passwordHash;
  console.log('数据库读回哈希:', dbHash);
  console.log('哈希一致:', dbHash === hash ? 'YES' : 'NO');

  // 5. 验证数据库中的哈希
  const ok2 = verifyPasswordCompat(password, dbHash);
  console.log('数据库哈希验证:', ok2 ? 'PASS' : 'FAIL');

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
