/**
 * 系统版本信息
 *
 * APP_VERSION / APP_CODENAME 由 version-inject.js 构建时从 package.json 注入
 * BUILD_TIME / GIT_COMMIT 由 version-inject.js 构建时注入
 * 未构建时（开发模式）使用占位符，getSystemVersion() 会回退到运行时值
 */

export const APP_VERSION = '4.0.0';
export const APP_NAME = '知微阁';
export const APP_CODENAME = '商源';

// 构建时注入（version-inject.js 替换占位符）
export const BUILD_TIME = '2026-08-11T13:26:04.246Z';
export const GIT_COMMIT = 'd863634';

export interface SystemVersion {
  version: string;
  name: string;
  codename: string;
  buildTime: string;
  gitCommit: string;
  nodeEnv: string;
}

export function getSystemVersion(): SystemVersion {
  return {
    version: APP_VERSION,
    name: APP_NAME,
    codename: APP_CODENAME,
    buildTime: !BUILD_TIME.startsWith('__') ? BUILD_TIME : new Date().toISOString(),
    gitCommit: !GIT_COMMIT.startsWith('__') ? GIT_COMMIT : 'dev',
    nodeEnv: process.env.NODE_ENV || 'production',
  };
}
