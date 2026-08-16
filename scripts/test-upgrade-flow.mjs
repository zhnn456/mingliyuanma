/**
 * 在服务器端执行的测试脚本
 * 使用项目实际的 license-generator 逻辑生成授权码
 * 并插入测试数据，验证完整升级流程
 * 
 * 用法：在服务器上 cd /www/ming8 && node scripts/test-upgrade-flow.mjs
 */
import crypto from 'crypto';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

// 从环境变量读取密钥（与线上一致）
const CENTER_SECRET_KEY = process.env.CENTER_SECRET_KEY || 'zhiwei-center-secret-key-v4';
const TEST_DOMAIN = 'test-deploy.example.com';
const TEST_AGENT_ID = 'test-agent-001';

// ===== Base64 URL 编码 =====
function base64UrlEncode(str) {
  return Buffer.from(str, 'utf-8').toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ===== HMAC-SHA256 签名（与 crypto.subtle 等价） =====
function hmacSignHex(data, secret) {
  return crypto.createHmac('sha256', secret).update(data, 'utf-8').digest('hex');
}

// ===== 生成授权码 =====
function generateLicense() {
  const payload = {
    agentId: TEST_AGENT_ID,
    features: ['bazi', 'ziwei', 'qimen', 'meihua', 'offering'],
    maxUsers: 1000,
    issuedAt: Date.now(),
    expiryAt: null,
    version: 2,
    domain: TEST_DOMAIN,
    level: 'source',
    monthlyFee: 0,
    upgradeExpiryAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
    upgradePlan: 'free',
  };

  const payloadStr = JSON.stringify(payload);
  const signature = hmacSignHex(payloadStr, CENTER_SECRET_KEY);
  return `LIC.${base64UrlEncode(payloadStr)}.${signature}`;
}

// ===== 主流程 =====
async function main() {
  console.log('============================================================');
  console.log('  知微阁 · 升级流程测试工具');
  console.log('============================================================\n');

  const license = generateLicense();
  console.log('【1】测试授权码：');
  console.log(`    ${license}\n`);
  console.log(`    密钥来源: ${process.env.CENTER_SECRET_KEY ? '环境变量' : '默认值'}\n`);

  // 连接数据库
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'ming8',
    password: process.env.MYSQL_PASSWORD || 'Ming8@2026!',
    database: process.env.MYSQL_DATABASE || 'ming8_db',
    charset: 'utf8mb4',
  });

  try {
    // 2. 执行迁移（如果还没执行）
    console.log('【2】检查/执行数据库迁移...');
    const migrationSql = fs.readFileSync(path.join(process.cwd(), 'scripts/mysql-migrate-v4.1.0.sql'), 'utf-8');
    const statements = migrationSql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));
    for (const stmt of statements) {
      try {
        await pool.query(stmt);
      } catch (e) {
        // 忽略已存在的错误
      }
    }
    console.log('    OK\n');

    // 3. 插入测试代理商
    console.log('【3】插入测试代理商记录...');
    const upgradeExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    await pool.execute(
      `INSERT INTO Agent (id, userId, companyName, contactName, contactPhone, domain, licenseKey, level, plan, upgradePlan, upgradeExpiryAt, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
       ON DUPLICATE KEY UPDATE licenseKey=VALUES(licenseKey), upgradePlan=VALUES(upgradePlan), upgradeExpiryAt=VALUES(upgradeExpiryAt)`,
      [TEST_AGENT_ID, 'test-user-001', '测试公司', '测试联系人', '13800000000', TEST_DOMAIN, license, 'source', 'source', 'free', upgradeExpiry]
    );
    console.log('    OK\n');

    // 4. 创建测试更新包文件
    console.log('【4】创建测试更新包...');
    const updateDir = '/www/ming8/updates/v4.1.0';
    if (!fs.existsSync(updateDir)) {
      fs.mkdirSync(updateDir, { recursive: true });
    }
    const updateFile = `${updateDir}/update-v4.1.0.zip`;
    const testContent = `这是测试升级包 v4.1.0\n更新内容：\n1. 新增测试功能A\n2. 修复测试问题B\n3. 优化性能C`;
    
    // 创建一个简单的 ZIP 文件（实际上是个文本文件，用于测试下载流程）
    fs.writeFileSync(updateFile, testContent);
    const fileSize = fs.statSync(updateFile).size;
    const checksum = crypto.createHash('md5').update(testContent).digest('hex');
    console.log(`    文件: ${updateFile} (${fileSize} bytes)\n`);

    // 5. 插入升级包记录
    console.log('【5】插入升级包记录...');
    await pool.execute(
      `INSERT INTO UpgradePackage (id, version, minVersion, filePath, fileSize, checksum, changelog, requiresMigration, status, publishedAt, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'published', NOW(), NOW(), NOW())
       ON DUPLICATE KEY UPDATE filePath=VALUES(filePath), fileSize=VALUES(fileSize), checksum=VALUES(checksum), status='published', publishedAt=NOW()`,
      ['pkg-test-v4.1.0', 'v4.1.0', 'v4.0.0', updateFile, fileSize, checksum, '1. 新增测试功能A\n2. 修复测试问题B\n3. 优化性能C']
    );
    console.log('    OK\n');

    // 6. 模拟 check 接口调用
    console.log('【6】模拟升级检查请求...');
    const checkUrl = `http://localhost:3001/api/upgrade/check?license=${encodeURIComponent(license)}&domain=${encodeURIComponent(TEST_DOMAIN)}&currentVersion=v4.0.0`;
    console.log(`    URL: ${checkUrl}`);
    
    const response = await fetch(checkUrl);
    const result = await response.json();
    console.log(`    HTTP状态: ${response.status}`);
    console.log(`    响应: ${JSON.stringify(result, null, 2)}\n`);

    if (result.hasUpdate) {
      console.log('【7】✅ 升级检查通过！发现新版本:', result.latestVersion);
      console.log('    下载链接:', result.downloadUrl?.substring(0, 100) + '...');
      
      // 7. 模拟下载
      console.log('\n【8】模拟下载更新包...');
      const dlResponse = await fetch(result.downloadUrl);
      const dlStatus = dlResponse.status;
      const dlContent = await dlResponse.text();
      console.log(`    HTTP状态: ${dlStatus}`);
      console.log(`    文件内容: ${dlContent.substring(0, 100)}`);
      console.log(`    文件大小: ${dlContent.length} bytes`);
      
      if (dlStatus === 200) {
        console.log('\n============================================================');
        console.log('  ✅ 完整升级流程验证通过！');
        console.log('============================================================');
        console.log('  check 接口 → 验证授权码 → 验证升级权益 → 返回 token');
        console.log('  download 接口 → 验证 token → 返回文件');
        console.log('  全流程正常工作');
      } else {
        console.log('\n  ❌ 下载失败:', dlStatus);
      }
    } else {
      console.log('【7】❌ 升级检查未通过:', result.reason);
      console.log('\n  可能原因：');
      console.log('  1. CENTER_SECRET_KEY 不一致（本地 vs 服务器）');
      console.log('  2. 数据库迁移未执行');
      console.log('  3. 代理商记录未插入');
    }

    console.log('\n============================================================');
    console.log('  测试授权码（配置到客户 .env 中）：');
    console.log(`APP_LICENSE_KEY=${license}`);
    console.log(`NEXTAUTH_URL=https://${TEST_DOMAIN}`);
    console.log(`CENTER_API=https://ming8.online`);
    console.log('============================================================');

  } catch (err) {
    console.error('错误:', err.message);
    console.error(err.stack);
  } finally {
    await pool.end();
  }
}

main();
