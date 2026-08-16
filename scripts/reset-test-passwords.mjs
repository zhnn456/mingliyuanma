/**
 * 重置所有后台测试账号密码为统一密码
 *
 * 规则：
 *   admin 角色 → admin123
 *   agent 角色 → agent123
 *   demo  角色 → demo123456
 *
 * 用法：在服务器执行
 *   cd /www/ming8 && source .env && node scripts/reset-test-passwords.mjs
 */
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

const PASSWORD_MAP = {
  admin: 'admin123',
  agent: 'agent123',
  demo: 'demo123456',
};

const TARGET_EMAILS = [
  '282063152@qq.com',
  'admin@test.com',
  'admin-test-1786442571@zhiwei.com',
  'agent@test.com',
  'agent-test@example.com',
  'test-prod2@test.com',
  'test_source@ming8.com',
  'demo@ming8.online',
];

async function main() {
  console.log('============================================================');
  console.log('  重置后台测试账号密码');
  console.log('============================================================\n');

  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'ming8',
    password: process.env.MYSQL_PASSWORD || 'Ming8@2026!',
    database: process.env.MYSQL_DATABASE || 'ming8_db',
    charset: 'utf8mb4',
  });

  try {
    const [rows] = await pool.query(
      'SELECT id, email, name, role FROM User WHERE email IN (?)',
      [TARGET_EMAILS]
    );

    console.log(`找到 ${rows.length} 个账号:\n`);
    console.log('邮箱'.padEnd(40) + '姓名'.padEnd(16) + '角色'.padEnd(8) + '新密码');
    console.log('-'.repeat(80));

    for (const row of rows) {
      const newPassword = PASSWORD_MAP[row.role] || 'admin123';
      const hash = hashPasswordCompat(newPassword);
      await pool.execute(
        'UPDATE User SET passwordHash = ?, updatedAt = NOW() WHERE email = ?',
        [hash, row.email]
      );
      console.log(
        (row.email || '').padEnd(40) +
        (row.name || '').padEnd(16) +
        (row.role || '').padEnd(8) +
        newPassword
      );
    }

    console.log('\n============================================================');
    console.log('  全部密码已重置');
    console.log('============================================================');
  } catch (err) {
    console.error('错误:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
