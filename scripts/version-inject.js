/**
 * 构建时版本注入脚本（CommonJS 语法，兼容无 type:module 的项目）
 *
 * 执行流程：
 * 1. 读取 package.json 版本号
 * 2. 获取 git commit hash（短）
 * 3. 记录构建时间
 * 4. 注入到 src/lib/version.ts（APP_VERSION / BUILD_TIME / GIT_COMMIT）
 */

const { readFileSync, writeFileSync } = require('fs');
const { resolve } = require('path');
const { execSync } = require('child_process');

const projectRoot = resolve(__dirname, '..');

function gitShortHash() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: projectRoot })
      .toString()
      .trim();
  } catch {
    return 'unknown';
  }
}

function injectVersion() {
  const packageJsonPath = resolve(projectRoot, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const version = packageJson.version;
  const buildTime = new Date().toISOString();
  const gitCommit = gitShortHash();

  const versionTsPath = resolve(projectRoot, 'src', 'lib', 'version.ts');
  let versionTs = readFileSync(versionTsPath, 'utf-8');

  versionTs = versionTs.replace(
    /export const APP_VERSION = '[^']*';/,
    `export const APP_VERSION = '${version}';`
  );
  versionTs = versionTs.replace(
    /export const BUILD_TIME = '[^']*';/,
    `export const BUILD_TIME = '${buildTime}';`
  );
  versionTs = versionTs.replace(
    /export const GIT_COMMIT = '[^']*';/,
    `export const GIT_COMMIT = '${gitCommit}';`
  );

  writeFileSync(versionTsPath, versionTs, 'utf-8');

  console.log(`[version-inject] 版本已注入: ${version} (${gitCommit})`);
  console.log(`[version-inject] buildTime: ${buildTime}`);
}

injectVersion();
