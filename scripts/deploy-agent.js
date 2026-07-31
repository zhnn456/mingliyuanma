#!/usr/bin/env node
/**
 * 命理网代理商一键部署脚本
 * 
 * 使用方法：
 *   node scripts/deploy-agent.js
 * 
 * 功能：
 *   1. 检查环境（Node.js、wrangler）
 *   2. 引导用户填写配置
 *   3. 生成 wrangler.toml
 *   4. 创建 D1 数据库
 *   5. 初始化数据库
 *   6. 构建项目
 *   7. 部署到 Cloudflare Workers
 */

const { execSync, spawnSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

function log(step, message) {
  console.log(`\n[${step}] ${message}`);
}

async function main() {
  console.log('========================================');
  console.log('   命理网代理商一键部署脚本 v4.0.0');
  console.log('========================================\n');

  // 1. 检查环境
  log('1/8', '检查环境...');

  try {
    const nodeVersion = execSync('node -v').toString().trim();
    console.log(`  Node.js: ${nodeVersion}`);
  } catch {
    console.error('  ❌ 未检测到 Node.js，请先安装 Node.js v18+');
    process.exit(1);
  }

  try {
    execSync('wrangler --version', { stdio: 'pipe' });
    console.log('  wrangler: 已安装');
  } catch {
    log('1/8', '安装 wrangler...');
    execSync('npm install -g wrangler', { stdio: 'inherit' });
  }

  // 2. 检查 wrangler 登录
  log('2/8', '检查 Cloudflare 登录状态...');
  try {
    execSync('wrangler whoami', { stdio: 'pipe' });
    console.log('  ✅ 已登录');
  } catch {
    log('2/8', '请先登录 Cloudflare：');
    execSync('wrangler login', { stdio: 'inherit' });
  }

  // 3. 收集配置信息
  log('3/8', '配置信息...');
  const agentId = await ask('  代理商代号（如 agent_001）: ');
  const brandName = await ask('  品牌名称（如 某某命理）: ');
  const licenseKey = await ask('  授权码（平台提供）: ');
  const nextauthSecret = require('crypto').randomBytes(32).toString('hex');

  if (!agentId || !brandName || !licenseKey) {
    console.error('  ❌ 所有字段都是必填项');
    process.exit(1);
  }

  // 4. 创建 D1 数据库
  log('4/8', '创建 D1 数据库...');
  let d1Id = '';
  try {
    const d1Output = execSync(
      `wrangler d1 create mingli-agent-${agentId}`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    const match = d1Output.match(/database_id\s*=\s*"([^"]+)"/);
    if (match) d1Id = match[1];
    console.log(`  ✅ D1 数据库已创建 (ID: ${d1Id})`);
  } catch (e) {
    console.log('  ⚠️  D1 数据库可能已存在，尝试获取 ID...');
    const listOutput = execSync('wrangler d1 list', { encoding: 'utf-8', stdio: 'pipe' });
    const match = listOutput.match(new RegExp(`mingli-agent-${agentId}.*?([a-f0-9-]{36})`, 'i'));
    if (match) d1Id = match[1];
  }

  if (!d1Id) {
    console.error('  ❌ 无法获取 D1 数据库 ID，请手动创建');
    process.exit(1);
  }

  // 5. 创建 KV 命名空间
  log('5/8', '创建 KV 命名空间...');
  let kvId = '';
  try {
    const kvOutput = execSync('wrangler kv namespace create KV', {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    const match = kvOutput.match(/id\s*=\s*"([^"]+)"/);
    if (match) kvId = match[1];
    console.log(`  ✅ KV 命名空间已创建 (ID: ${kvId})`);
  } catch (e) {
    console.log('  ⚠️  KV 可能已存在');
  }

  // 6. 生成 wrangler.toml
  log('6/8', '生成配置文件...');
  const template = fs.readFileSync(
    path.join(__dirname, '..', 'templates', 'agent-wrangler.toml'),
    'utf-8'
  );
  const wranglerConfig = template
    .replace(/\{\{AGENT_ID\}\}/g, agentId)
    .replace(/\{\{LICENSE_KEY\}\}/g, licenseKey)
    .replace(/\{\{BRAND_NAME\}\}/g, brandName)
    .replace(/\{\{NEXTAUTH_SECRET\}\}/g, nextauthSecret)
    .replace(/\{\{D1_DATABASE_ID\}\}/g, d1Id)
    .replace(/\{\{KV_NAMESPACE_ID\}\}/g, kvId || '待填写');

  fs.writeFileSync(path.join(__dirname, '..', 'wrangler.toml'), wranglerConfig);
  console.log('  ✅ wrangler.toml 已生成');

  // 7. 初始化数据库
  log('7/8', '初始化数据库...');
  try {
    execSync(
      `wrangler d1 execute mingli-agent-${agentId} --remote --file=prisma/migrate_v4.sql`,
      { stdio: 'inherit' }
    );
    console.log('  ✅ 数据库初始化完成');
  } catch {
    console.log('  ⚠️  数据库初始化可能失败，请手动执行迁移');
  }

  // 8. 构建并部署
  log('8/8', '构建并部署...');
  console.log('  正在构建项目（可能需要几分钟）...');

  try {
    execSync('npm run build:worker', { stdio: 'inherit' });
    console.log('  ✅ 构建完成');
  } catch {
    console.error('  ❌ 构建失败，请检查错误信息');
    process.exit(1);
  }

  console.log('  正在部署到 Cloudflare Workers...');
  try {
    execSync('npx wrangler deploy', { stdio: 'inherit' });
    console.log('\n========================================');
    console.log('   ✅ 部署完成！');
    console.log('========================================');
    console.log(`\n   代理商代号: ${agentId}`);
    console.log(`   品牌名称: ${brandName}`);
    console.log(`   访问域名: https://mingli-agent-${agentId}.<你的子域>.workers.dev`);
    console.log(`\n   下一步：`);
    console.log(`   1. 在 Cloudflare Dashboard 绑定自定义域名（可选）`);
    console.log(`   2. 访问上述域名，使用管理员账号登录`);
    console.log(`   3. 配置支付参数（微信/支付宝）`);
    console.log(`\n   如需帮助，请联系平台技术支持。`);
  } catch {
    console.error('  ❌ 部署失败，请检查错误信息');
    process.exit(1);
  }

  rl.close();
}

main().catch((err) => {
  console.error('部署失败:', err);
  process.exit(1);
});
