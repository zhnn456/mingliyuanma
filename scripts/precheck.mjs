/**
 * 部署前预检脚本
 * 在推送代码前运行，检查常见的部署失败原因
 * 用法: npm run precheck
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');

let errors = 0;
let warnings = 0;

function error(msg) {
  console.error(`  ❌ ${msg}`);
  errors++;
}
function warn(msg) {
  console.warn(`  ⚠️  ${msg}`);
  warnings++;
}
function ok(msg) {
  console.log(`  ✅ ${msg}`);
}

// ============ 2. 检查必要文件是否存在 ============
function checkRequiredFiles() {
  console.log('\n📁 检查必要配置文件...');

  const requiredFiles = [
    'package.json',
    'next.config.js',
    'prisma/schema.prisma',
  ];

  for (const file of requiredFiles) {
    const fullPath = path.join(root, file);
    if (fs.existsSync(fullPath)) {
      ok(`${file} 存在`);
    } else {
      error(`${file} 不存在`);
    }
  }
}

// ============ 4. 检查 .gitignore ============
function checkGitignore() {
  console.log('\n📝 检查 .gitignore...');

  const gitignorePath = path.join(root, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    warn('.gitignore 不存在');
    return;
  }

  const content = fs.readFileSync(gitignorePath, 'utf-8');

  const shouldIgnore = ['.next', '.env', 'node_modules'];
  for (const item of shouldIgnore) {
    if (content.includes(item)) {
      ok(`${item} 已在 .gitignore 中`);
    } else {
      warn(`${item} 未在 .gitignore 中`);
    }
  }
}

// ============ 主流程 ============
console.log('═══════════════════════════════════════');
console.log('  部署前预检 — 检查常见部署失败原因');
console.log('═══════════════════════════════════════');

checkRequiredFiles();
checkGitignore();

console.log('\n═══════════════════════════════════════');
if (errors > 0) {
  console.error(`❌ 预检失败: ${errors} 个错误, ${warnings} 个警告`);
  console.error('   请修复以上错误后再推送代码');
  process.exit(1);
} else {
  console.log(`✅ 预检通过: 0 个错误, ${warnings} 个警告`);
  console.log('   可以安全推送代码');
  process.exit(0);
}
