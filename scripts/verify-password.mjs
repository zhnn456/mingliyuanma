/** 在服务器上验证 admin@test.com 的密码哈希 */
import crypto from 'crypto';
import mysql from 'mysql2/promise';

function verifyPasswordCompat(password, storedHash) {
  // 解析 pbkdf2_100000$salt$key
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

  const [rows] = await pool.query(
    "SELECT email, passwordHash FROM User WHERE email IN ('admin@test.com','demo@ming8.online','282063152@qq.com')"
  );

  for (const row of rows) {
    const pwd = row.email === 'demo@ming8.online' ? 'demo123456' : 'admin123';
    const ok = verifyPasswordCompat(pwd, row.passwordHash);
    console.log(`${row.email} | admin123 验证: ${ok ? 'PASS' : 'FAIL'} | hash前40: ${row.passwordHash.slice(0, 40)}`);
  }

  await pool.end();
}

main();
