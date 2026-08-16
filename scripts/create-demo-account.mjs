/**
 * 创建演示账号（demo 角色）— 给想买源码部署的客户体验使用
 *
 * 权限：
 *   - 可登录、可进入 /admin 后台查看所有页面和数据
 *   - 写操作被锁定（前端按钮置灰+锁图标，后端 middleware 拦截 POST/PUT/DELETE）
 *
 * 用法：在服务器上执行
 *   cd /www/ming8 && node scripts/create-demo-account.mjs
 *
 * 或本地通过 remote 脚本：
 *   python scripts/remote-create-demo.py
 */
import crypto from 'crypto';
import mysql from 'mysql2/promise';

// ===== 演示账号配置 =====
const DEMO_EMAIL = 'demo@ming8.online';
const DEMO_PASSWORD = 'demo123456';
const DEMO_NAME = '演示体验';
const DEMO_ROLE = 'demo';

// ===== 生成与项目兼容的 PBKDF2 密码哈希 =====
function hashPasswordCompat(password) {
  const ITERATIONS = 100000;
  const SALT_LENGTH = 16;
  const KEY_LENGTH = 32;

  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');

  const saltB64 = salt.toString('base64');
  const keyB64 = key.toString('base64');

  return `pbkdf2_${ITERATIONS}$${saltB64}$${keyB64}`;
}

async function main() {
  console.log('============================================================');
  console.log('  创建演示账号（demo 角色）');
  console.log('============================================================\n');

  const passwordHash = hashPasswordCompat(DEMO_PASSWORD);
  console.log(`邮箱: ${DEMO_EMAIL}`);
  console.log(`密码: ${DEMO_PASSWORD}`);
  console.log(`角色: ${DEMO_ROLE}`);
  console.log(`密码哈希: ${passwordHash.substring(0, 30)}...\n`);

  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'ming8',
    password: process.env.MYSQL_PASSWORD || 'Ming8@2026!',
    database: process.env.MYSQL_DATABASE || 'ming8_db',
    charset: 'utf8mb4',
  });

  try {
    // 检查是否已存在
    const [rows] = await pool.query('SELECT id, email, role FROM User WHERE email = ?', [DEMO_EMAIL]);
    if (rows.length > 0) {
      // 已存在，更新密码和角色
      console.log('账号已存在，更新密码和角色...');
      await pool.execute(
        'UPDATE User SET passwordHash = ?, name = ?, role = ?, updatedAt = NOW() WHERE email = ?',
        [passwordHash, DEMO_NAME, DEMO_ROLE, DEMO_EMAIL]
      );
      console.log('更新完成\n');
    } else {
      // 新建
      console.log('创建新账号...');
      const id = `user_demo_${Date.now()}`;
      await pool.execute(
        `INSERT INTO User (id, email, name, passwordHash, role, memberLevel, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, 'free', NOW(), NOW())`,
        [id, DEMO_EMAIL, DEMO_NAME, passwordHash, DEMO_ROLE]
      );
      console.log('创建完成\n');
    }

    // 验证
    const [verify] = await pool.query('SELECT id, email, name, role FROM User WHERE email = ?', [DEMO_EMAIL]);
    console.log('验证结果:');
    console.log(`  ID: ${verify[0].id}`);
    console.log(`  邮箱: ${verify[0].email}`);
    console.log(`  姓名: ${verify[0].name}`);
    console.log(`  角色: ${verify[0].role}`);

    console.log('\n============================================================');
    console.log('  演示账号已就绪');
    console.log('============================================================');
    console.log(`登录地址: https://ming8.online/login`);
    console.log(`账号: ${DEMO_EMAIL}`);
    console.log(`密码: ${DEMO_PASSWORD}`);
    console.log(`后台: https://ming8.online/admin`);
    console.log('说明: 可查看所有后台页面和数据，写操作已锁定');
    console.log('============================================================');
  } catch (err) {
    console.error('错误:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
