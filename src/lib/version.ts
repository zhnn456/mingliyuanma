/**
 * 系统版本信息
 * 构建时会自动注入版本号
 */

export const APP_VERSION = 'v4.0.0';
export const APP_NAME = '命理网';
export const APP_CODENAME = '商源';

export interface SystemVersion {
  version: string;
  name: string;
  codename: string;
  buildTime: string;
  nodeEnv: string;
}

export function getSystemVersion(): SystemVersion {
  return {
    version: APP_VERSION,
    name: APP_NAME,
    codename: APP_CODENAME,
    buildTime: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV || 'production',
  };
}
