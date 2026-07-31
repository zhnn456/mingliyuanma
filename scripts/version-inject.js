/**
 * 构建时版本注入脚本
 * 
 * 执行流程：
 * 1. 读取 package.json 版本号
 * 2. 更新 src/lib/version.ts 中的 APP_VERSION
 * 3. 更新 wrangler.toml 中的版本变量
 * 4. 在构建产物中注入版本信息
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

function injectVersion() {
  const packageJsonPath = resolve(projectRoot, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const version = packageJson.version;

  const versionTsPath = resolve(projectRoot, 'src', 'lib', 'version.ts');
  let versionTs = readFileSync(versionTsPath, 'utf-8');
  versionTs = versionTs.replace(
    /export const APP_VERSION = '[^']*';/,
    `export const APP_VERSION = '${version}';`
  );
  versionTs = versionTs.replace(
    /export const APP_CODENAME = '[^']*';/,
    `export const APP_CODENAME = '商源';`
  );
  writeFileSync(versionTsPath, versionTs, 'utf-8');

  console.log(`[version-inject] ✅ 版本已注入: ${version}`);
  console.log(`[version-inject] 📄 src/lib/version.ts`);
}

injectVersion();
