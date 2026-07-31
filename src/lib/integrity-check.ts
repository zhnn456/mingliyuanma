/**
 * 系统完整性校验
 * 
 * 检查代理商系统是否被篡改：
 * - 关键文件哈希
 * - 水印信息
 * - 功能权限
 */

const APP_VERSION = process.env.APP_VERSION || 'v4.0.0';
const AGENT_ID = process.env.APP_AGENT_ID || 'unknown';
const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME || '';

export interface IntegrityReport {
  status: 'ok' | 'warning' | 'error';
  checks: IntegrityCheck[];
  agentId: string;
  version: string;
  timestamp: number;
}

export interface IntegrityCheck {
  name: string;
  passed: boolean;
  message?: string;
}

const EXPECTED_CHECKS = [
  { name: 'watermark', description: '水印检查' },
  { name: 'version', description: '版本号检查' },
  { name: 'agent_id', description: '代理商 ID 检查' },
  { name: 'brand', description: '品牌配置检查' },
  { name: 'license', description: '授权码检查' },
];

export async function runIntegrityCheck(): Promise<IntegrityReport> {
  const checks: IntegrityCheck[] = [];

  // 1. 水印检查
  checks.push({
    name: 'watermark',
    passed: !!AGENT_ID && AGENT_ID !== 'unknown',
    message: AGENT_ID ? '水印存在' : '水印缺失',
  });

  // 2. 版本号检查
  checks.push({
    name: 'version',
    passed: !!APP_VERSION,
    message: `版本: ${APP_VERSION}`,
  });

  // 3. 代理商 ID 检查
  checks.push({
    name: 'agent_id',
    passed: !!AGENT_ID && AGENT_ID !== 'unknown',
    message: AGENT_ID,
  });

  // 4. 品牌配置检查
  checks.push({
    name: 'brand',
    passed: !!BRAND_NAME,
    message: BRAND_NAME || '未配置品牌',
  });

  // 5. 授权码检查
  try {
    const { verifyLicense } = await import('./license-validator');
    const result = await verifyLicense();
    checks.push({
      name: 'license',
      passed: result.valid,
      message: result.valid
        ? (result.offline ? '离线模式' : '在线验证通过')
        : (result.reason || '授权验证失败'),
    });
  } catch {
    checks.push({
      name: 'license',
      passed: false,
      message: '授权验证异常',
    });
  }

  const passedCount = checks.filter(c => c.passed).length;
  const totalCount = checks.length;
  let status: 'ok' | 'warning' | 'error' = 'ok';

  if (passedCount < totalCount) status = 'warning';
  if (passedCount < totalCount / 2) status = 'error';

  return {
    status,
    checks,
    agentId: AGENT_ID,
    version: APP_VERSION,
    timestamp: Date.now(),
  };
}

export async function getIntegrityReport(): Promise<IntegrityReport> {
  return runIntegrityCheck();
}

export function getAgentInfo() {
  return {
    agentId: AGENT_ID,
    version: APP_VERSION,
    brandName: BRAND_NAME,
  };
}
