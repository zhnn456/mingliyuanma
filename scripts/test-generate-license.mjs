/**
 * 测试用：生成有效授权码 + 插入测试代理商 + 插入测试升级包
 * 
 * 运行方式：node scripts/test-generate-license.mjs
 * 
 * 生成后会输出：
 *   1. 测试授权码
 *   2. 测试域名
 *   3. 模拟 update.sh 的完整调用流程验证
 */
import crypto from 'crypto';
import mysql from 'mysql2/promise';

// ===== 配置 =====
const CENTER_SECRET_KEY = 'zhiwei-center-secret-key-v4';
const TEST_DOMAIN = 'test-deploy.example.com';
const TEST_AGENT_ID = 'test-agent-001';
const TEST_VERSION = 'v4.0.0';

// ===== Base64 URL 编码/解码 =====
function base64UrlEncode(str) {
  return Buffer.from(str, 'utf-8').toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ===== HMAC-SHA256 签名 =====
function hmacSign(data) {
  return crypto.createHmac('sha256', CENTER_SECRET_KEY).update(data).digest('hex');
}

// ===== 生成授权码 =====
function generateLicense() {
  const payload = {
    agentId: TEST_AGENT_ID,
    features: ['bazi', 'ziwei', 'qimen', 'meihua', 'offering'],
    maxUsers: 1000,
    issuedAt: Date.now(),
    expiryAt: null, // 永不过期
    version: 2,
    domain: TEST_DOMAIN,
    level: 'source', // 源码买断
    monthlyFee: 0,
    upgradeExpiryAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1年后
    upgradePlan: 'free', // 免费升级
  };

  const payloadStr = JSON.stringify(payload);
  const signature = hmacSign(payloadStr);
  const license = `LIC.${base64UrlEncode(payloadStr)}.${signature}`;

  return { payload, license };
}

// ===== 主流程 =====
async function main() {
  console.log('============================================================');
  console.log('  知微阁 · 升级流程测试工具');
  console.log('============================================================\n');

  // 1. 生成授权码
  const { payload, license } = generateLicense();
  console.log('【1】生成的测试授权码：');
  console.log(`    ${license}\n`);
  console.log(`    域名: ${TEST_DOMAIN}`);
  console.log(`    等级: ${payload.level}`);
  console.log(`    升级方案: ${payload.upgradePlan}`);
  console.log(`    升级到期: ${new Date(payload.upgradeExpiryAt).toLocaleString('zh-CN')}\n`);

  // 2. 插入测试数据库记录
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'ming8',
    password: process.env.MYSQL_PASSWORD || 'Ming8@2026!',
    database: process.env.MYSQL_DATABASE || 'ming8_db',
    charset: 'utf8mb4',
  });

  try {
    // 插入测试代理商
    console.log('【2】插入测试代理商记录...');
    await pool.execute(
      `INSERT INTO Agent (id, userId, companyName, contactName, contactPhone, domain, licenseKey, level, plan, upgradePlan, upgradeExpiryAt, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
       ON DUPLICATE KEY UPDATE licenseKey=VALUES(licenseKey), upgradePlan=VALUES(upgradePlan), upgradeExpiryAt=VALUES(upgradeExpiryAt)`,
      [TEST_AGENT_ID, 'test-user-001', '测试公司', '测试联系人', '13800000000', TEST_DOMAIN, license, 'source', 'source', 'free', new Date(payload.upgradeExpiryAt)]
    );
    console.log('    OK\n');

    // 插入测试升级包记录
    console.log('【3】插入测试升级包记录...');
    
    // 创建假的更新包文件
    const fs = await import('fs');
    const testUpdateDir = '/www/ming8/updates/v4.1.0';
    const testUpdateFile = `${testUpdateDir}/update-v4.1.0.zip`;
    
    // 在本地创建测试文件（实际部署时在服务器上创建）
    const localTestDir = './test-updates/v4.1.0';
    const localTestFile = `${localTestDir}/update-v4.1.0.zip`;
    if (!fs.existsSync(localTestDir)) {
      fs.mkdirSync(localTestDir, { recursive: true });
    }
    // 创建一个假的zip文件（实际内容为文本）
    const testContent = `这是测试升级包 v4.1.0\n更新内容：\n1. 新增测试功能A\n2. 修复测试问题B\n3. 优化性能C`;
    fs.writeFileSync(localTestFile, testContent);
    console.log(`    本地测试文件已创建: ${localTestFile}`);
    
    await pool.execute(
      `INSERT INTO UpgradePackage (id, version, minVersion, filePath, fileSize, checksum, changelog, requiresMigration, status, publishedAt, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'published', NOW(), NOW(), NOW())
       ON DUPLICATE KEY UPDATE filePath=VALUES(filePath), status='published', publishedAt=NOW()`,
      ['pkg-test-v4.1.0', 'v4.1.0', 'v4.0.0', testUpdateFile, testContent.length, crypto.createHash('md5').update(testContent).digest('hex'), '1. 新增测试功能A\n2. 修复测试问题B\n3. 优化性能C']
    );
    console.log('    OK\n');

    // 3. 模拟 check 接口验证
    console.log('【4】模拟升级检查请求...');
    const checkUrl = `https://ming8.online/api/upgrade/check?license=${encodeURIComponent(license)}&domain=${encodeURIComponent(TEST_DOMAIN)}&currentVersion=${TEST_VERSION}`;
    console.log(`    URL: ${checkUrl}\n`);
    
    // 用 fetch 请求
    const response = await fetch(checkUrl);
    const result = await response.json();
    console.log('    响应状态:', response.status);
    console.log('    响应内容:', JSON.stringify(result, null, 2));
    console.log('');

    if (result.hasUpdate) {
      console.log('【5】✅ 升级检查通过！发现新版本:', result.latestVersion);
      console.log('    下载链接:', result.downloadUrl?.substring(0, 80) + '...');
      console.log('    升级到期:', result.upgradeExpiryAt);
      console.log('\n    客户端 update.sh 会使用此链接下载更新包');
    } else {
      console.log('【5】❌ 升级检查未通过:', result.reason);
    }

    console.log('\n============================================================');
    console.log('  测试完成');
    console.log('============================================================');
    console.log('\n请将以下信息配置到客户服务器的 .env 中用于测试：');
    console.log(`APP_LICENSE_KEY=${license}`);
    console.log(`NEXTAUTH_URL=https://${TEST_DOMAIN}`);
    console.log(`CENTER_API=https://ming8.online`);

  } catch (err) {
    console.error('错误:', err.message);
  } finally {
    await pool.end();
  }
}

main();
