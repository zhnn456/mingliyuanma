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

// ============ 1. 检查 Workers 不兼容的 API ============
function checkIncompatibleAPIs() {
  console.log('\n🔍 检查 Workers 不兼容的 API...');

  const incompatiblePatterns = [
    { regex: /from\s+['"]crypto['"]/, msg: 'import from "crypto" — Workers 不支持 Node.js crypto 模块' },
    { regex: /from\s+['"]fs['"]/, msg: 'import from "fs" — Workers 不支持文件系统（脚本文件除外）' },
    { regex: /from\s+['"]os['"]/, msg: 'import from "os" — Workers 不支持 os 模块' },
    { regex: /Buffer\.from\s*\(/, msg: 'Buffer.from() — Workers 不支持 Node.js Buffer' },
    { regex: /export\s+const\s+runtime\s*=\s*['"]edge['"]/, msg: 'runtime = "edge" — OpenNext Cloudflare 不需要此声明' },
  ];

  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        for (const { regex, msg } of incompatiblePatterns) {
          const matches = content.match(new RegExp(regex, 'g'));
          if (matches) {
            // 排除注释行和动态 require（在条件分支中）
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
              if (regex.test(lines[i]) && !lines[i].trim().startsWith('//') && !lines[i].trim().startsWith('*')) {
                const relPath = path.relative(root, fullPath);
                // 允许 scripts/ 和 lib/knowledge/server.ts 中的动态 require
                if (relPath.startsWith('scripts') || relPath.includes('knowledge/server.ts')) continue;
                error(`${relPath}:${i + 1} — ${msg}`);
              }
            }
          }
        }
      }
    }
  }

  scanDir(srcDir);

  if (errors === 0) {
    ok('未发现 Workers 不兼容的 API');
  }
}

// ============ 2. 检查必要文件是否存在 ============
function checkRequiredFiles() {
  console.log('\n📁 检查必要配置文件...');

  const requiredFiles = [
    'wrangler.toml',
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

// ============ 3. 检查 wrangler.toml 配置 ============
function checkWranglerConfig() {
  console.log('\n⚙️  检查 wrangler.toml 配置...');

  const wranglerPath = path.join(root, 'wrangler.toml');
  if (!fs.existsSync(wranglerPath)) return;

  const content = fs.readFileSync(wranglerPath, 'utf-8');

  if (content.includes('main = ".open-next/worker.js"')) {
    ok('main 指向 OpenNext worker');
  } else {
    error('wrangler.toml 中 main 未指向 .open-next/worker.js');
  }

  if (content.includes('nodejs_compat')) {
    ok('nodejs_compat 已启用');
  } else {
    warn('未找到 nodejs_compat 兼容标志');
  }

  if (content.includes('[[d1_databases]]')) {
    ok('D1 数据库已配置');
  } else {
    warn('未找到 D1 数据库配置');
  }

  if (content.includes('[[kv_namespaces]]')) {
    ok('KV 命名空间已配置');
  } else {
    warn('未找到 KV 命名空间配置');
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

  const shouldIgnore = ['.open-next', '.next', '.env', 'node_modules', '.wrangler'];
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

checkIncompatibleAPIs();
checkRequiredFiles();
checkWranglerConfig();
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
