/**
 * 源码代理测试数据构造脚本
 * - 生成测试用户和代理商记录
 * - 生成 HMAC 签名的授权码
 * - 模拟购买订单和续费记录
 *
 * 使用方法：node deploy/generate-test-source-agent.js
 */
const mysql = require('mysql2/promise');
const crypto = require('crypto');

// ============ 配置 ============
const DB_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'ming8',
  password: process.env.MYSQL_PASSWORD || 'Ming8@2026!',
  database: process.env.MYSQL_DATABASE || 'ming8_db',
  charset: 'utf8mb4',
};

const CENTER_SECRET_KEY = process.env.CENTER_SECRET_KEY || 'zhiwei-center-secret-key-v4';
const ITERATIONS = 100000;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

// ============ 测试数据 ============
const TEST_USER = {
  email: 'test_source@ming8.com',
  password: 'Test@2026',
  name: '张测试',
  phone: '13800138001',
};

const TEST_AGENT = {
  brandName: '紫微测试源码代理公司',
  companyName: '紫微测试源码代理有限公司',
  contactName: '张测试',
  contactPhone: '13800138001',
  domain: 'test-source.ming8.online',
  planType: 'annual', // 年度授权
  level: 'source',
};

// ============ 工具函数 ============
function base64UrlEncode(str) {
  return Buffer.from(str, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64Encode(buf) {
  return Buffer.from(buf).toString('base64');
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
  return `pbkdf2_${ITERATIONS}$${base64Encode(salt)}$${base64Encode(key)}`;
}

function hmacSign(data, secret) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

async function generateLicense(payload) {
  const fullPayload = {
    agentId: payload.agentId,
    features: payload.features,
    maxUsers: payload.maxUsers,
    issuedAt: Date.now(),
    expiryAt: payload.expiryAt,
    version: 2,
    domain: payload.domain,
    level: payload.level,
    monthlyFee: payload.monthlyFee || 0,
  };
  const payloadStr = JSON.stringify(fullPayload);
  const signature = hmacSign(payloadStr, CENTER_SECRET_KEY);
  return `LIC.${base64UrlEncode(payloadStr)}.${signature}`;
}

function genId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function isoNow() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function isoPlusDays(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
}

// ============ 主流程 ============
async function main() {
  console.log('='.repeat(60));
  console.log('源码代理测试数据构造脚本');
  console.log('='.repeat(60));

  const pool = mysql.createPool(DB_CONFIG);
  const conn = await pool.getConnection();

  try {
    // 1. 创建测试用户
    console.log('\n[1/6] 创建测试用户...');
    await conn.execute('DELETE FROM User WHERE email = ?', [TEST_USER.email]);
    const userId = genId('usr');
    const passwordHash = await hashPassword(TEST_USER.password);
    const now = isoNow();
    await conn.execute(
      `INSERT INTO User (id, email, passwordHash, name, phone, role, memberLevel, createdAt)
       VALUES (?, ?, ?, ?, ?, 'agent', 'lifetime', ?)`,
      [userId, TEST_USER.email, passwordHash, TEST_USER.name, TEST_USER.phone, now]
    );
    console.log(`  ✓ 用户已创建: ${TEST_USER.email} / ${TEST_USER.password}`);
    console.log(`  - userId: ${userId}`);

    // 2. 生成授权码
    console.log('\n[2/6] 生成 HMAC 签名授权码...');
    const agentId = genId('agt');
    const expiryDays = TEST_AGENT.planType === 'lifetime' ? 36500 : 365;
    const expiryTs = Date.now() + expiryDays * 24 * 60 * 60 * 1000;
    const licenseKey = await generateLicense({
      agentId,
      features: ['bazi', 'ziwei', 'qimen', 'meihua'],
      maxUsers: 10000,
      expiryAt: expiryTs,
      domain: TEST_AGENT.domain,
      level: TEST_AGENT.level,
      monthlyFee: 0,
    });
    console.log(`  ✓ 授权码已生成`);
    console.log(`  - agentId: ${agentId}`);
    console.log(`  - 授权码: ${licenseKey.substring(0, 80)}...`);
    console.log(`  - 完整长度: ${licenseKey.length}`);

    // 3. 创建代理商记录
    console.log('\n[3/6] 创建代理商记录...');
    await conn.execute('DELETE FROM Agent WHERE brandName = ?', [TEST_AGENT.brandName]);
    const siteConfig = {
      maxUsers: 10000,
      customPricing: true,
      whiteLabel: true,
      level: 'source',
      monthlyFee: 0,
      deployMode: 'source',
      planType: TEST_AGENT.planType,
      commissionRate: 0,
      agentTier: 'annual',
      totalCustomers: 0,
      authorizedDomain: TEST_AGENT.domain,
      updateServiceExpiry: isoPlusDays(365),
      version: '4.0.0',
      features: ['bazi', 'ziwei', 'qimen', 'meihua'],
    };
    await conn.execute(
      `INSERT INTO Agent (id, userId, companyName, contactName, contactPhone, domain, brandName, subdomain, licenseKey, licenseExpiry, siteConfig, balance, maxCustomers, plan, planExpiry, level, isActive, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        agentId, userId,
        TEST_AGENT.companyName, TEST_AGENT.contactName, TEST_AGENT.contactPhone,
        TEST_AGENT.domain, TEST_AGENT.brandName, 'test-source',
        licenseKey, isoPlusDays(expiryDays),
        JSON.stringify(siteConfig),
        0, 10000, TEST_AGENT.planType, isoPlusDays(expiryDays),
        'source', 1, now
      ]
    );
    console.log(`  ✓ 代理商已创建: ${TEST_AGENT.brandName}`);
    console.log(`  - 域名: ${TEST_AGENT.domain}`);
    console.log(`  - 套餐: 年度授权 (365天)`);
    console.log(`  - 到期: ${isoPlusDays(expiryDays)}`);

    // 4. 创建 AgentLicense 记录
    console.log('\n[4/6] 创建授权记录...');
    await conn.execute('DELETE FROM AgentLicense WHERE agentId = ?', [agentId]);
    const licenseId = genId('lic');
    await conn.execute(
      `INSERT INTO AgentLicense (id, agentId, licenseKey, domain, maxUsers, expiryAt, features, status, createdAt, signature)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
      [
        licenseId, agentId, licenseKey, TEST_AGENT.domain, 10000,
        isoPlusDays(expiryDays),
        JSON.stringify(['bazi', 'ziwei', 'qimen', 'meihua']),
        now, hmacSign(licenseKey, CENTER_SECRET_KEY)
      ]
    );
    console.log(`  ✓ 授权记录已创建: ${licenseId}`);

    // 5. 模拟购买订单
    console.log('\n[5/6] 模拟购买订单（年度授权 2980元）...');
    await conn.execute('DELETE FROM `Order` WHERE agentId = ?', [agentId]);
    const orderId = genId('ord');
    const orderNo = `SRC${Date.now()}`;
    await conn.execute(
      `INSERT INTO \`Order\` (id, orderNo, userId, agentId, type, amount, status, paymentMethod, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, 'agent_license', 2980, 'paid', 'wechat', ?, ?)`,
      [orderId, orderNo, userId, agentId, now, now]
    );
    console.log(`  ✓ 购买订单已创建`);
    console.log(`  - 订单号: ${orderNo}`);
    console.log(`  - 金额: ¥2980`);
    console.log(`  - 状态: 已支付`);

    // 6. 模拟续费记录
    console.log('\n[6/6] 模拟续费记录...');
    // 确保 RenewRecord 表存在
    await conn.execute(
      `CREATE TABLE IF NOT EXISTS \`RenewRecord\` (
        \`id\` VARCHAR(64) NOT NULL PRIMARY KEY,
        \`agentId\` VARCHAR(64) NOT NULL,
        \`type\` VARCHAR(32) NOT NULL,
        \`amount\` DECIMAL(10,2) NOT NULL,
        \`status\` VARCHAR(20) NOT NULL DEFAULT 'pending',
        \`remark\` TEXT NULL,
        \`auditorId\` VARCHAR(64) NULL,
        \`auditRemark\` TEXT NULL,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NULL,
        INDEX \`idx_renew_agentId\` (\`agentId\`),
        INDEX \`idx_renew_status\` (\`status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    );

    // 续费记录1：已完成的年度续费（模拟30天前完成）
    const renewId1 = genId('renew');
    await conn.execute(
      `INSERT INTO RenewRecord (id, agentId, type, amount, status, remark, auditorId, auditRemark, createdAt, updatedAt)
       VALUES (?, ?, 'annual_renew', 1980, 'paid', '续费一年授权', ?, '已通过，微信支付', ?, ?)`,
      [renewId1, agentId, userId, isoPlusDays(-30), isoPlusDays(-29)]
    );
    console.log(`  ✓ 续费记录1（已完成）: 年度续费 ¥1980，30天前完成`);

    // 续费记录2：待审批的更新服务续费（模拟当前申请）
    const renewId2 = genId('renew');
    await conn.execute(
      `INSERT INTO RenewRecord (id, agentId, type, amount, status, remark, createdAt, updatedAt)
       VALUES (?, ?, 'update_service', 980, 'pending', '续费更新服务一年', ?, ?)`,
      [renewId2, agentId, now, now]
    );
    console.log(`  ✓ 续费记录2（待审批）: 更新服务续费 ¥980，刚申请`);

    // 续费记录3：已拒绝的升级永久申请（模拟60天前被拒绝）
    const renewId3 = genId('renew');
    await conn.execute(
      `INSERT INTO RenewRecord (id, agentId, type, amount, status, remark, auditorId, auditRemark, createdAt, updatedAt)
       VALUES (?, ?, 'upgrade_lifetime', 6800, 'rejected', '尝试升级永久授权', ?, '信息不全，请补充营业执照', ?, ?)`,
      [renewId3, agentId, userId, isoPlusDays(-60), isoPlusDays(-58)]
    );
    console.log(`  ✓ 续费记录3（已拒绝）: 升级永久 ¥6800，60天前被拒绝`);

    // ============ 输出汇总 ============
    console.log('\n' + '='.repeat(60));
    console.log('✓ 测试数据构造完成！');
    console.log('='.repeat(60));
    console.log('\n📋 测试账号信息：');
    console.log(`  登录邮箱: ${TEST_USER.email}`);
    console.log(`  登录密码: ${TEST_USER.password}`);
    console.log(`  代理商ID: ${agentId}`);
    console.log(`  品牌名称: ${TEST_AGENT.brandName}`);
    console.log(`  绑定域名: ${TEST_AGENT.domain}`);
    console.log(`  代理类型: 源码部署代理`);
    console.log(`  套餐类型: 年度授权（365天）`);
    console.log(`\n🔑 授权码：`);
    console.log(`  ${licenseKey}`);
    console.log(`\n💰 模拟订单：`);
    console.log(`  购买订单 ${orderNo} - 年度授权 ¥2980 - 已支付`);
    console.log(`\n🔄 续费记录：`);
    console.log(`  1. 年度续费 ¥1980 - 已完成（30天前）`);
    console.log(`  2. 更新服务续费 ¥980 - 待审批（刚申请）`);
    console.log(`  3. 升级永久 ¥6800 - 已拒绝（60天前）`);
    console.log(`\n🌐 测试访问：`);
    console.log(`  代理商后台: https://ming8.online/agent`);
    console.log(`  授权管理: https://ming8.online/agent/license`);
    console.log(`  续费管理: https://ming8.online/agent/renew`);
    console.log(`  技术工单: https://ming8.online/agent/tickets`);
    console.log('\n' + '='.repeat(60));

  } catch (err) {
    console.error('❌ 构造失败:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    conn.release();
    await pool.end();
  }
}

main();
