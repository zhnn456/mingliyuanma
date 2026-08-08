import { NextResponse } from 'next/server';

/**
 * 授权状态 API
 * 代理商可查看当前授权状态
 */
export async function GET() {
  const isAgentEnv = !!process.env.APP_LICENSE_KEY && !!process.env.APP_AGENT_ID;

  if (!isAgentEnv) {
    return NextResponse.json({
      isAgentSite: false,
      message: '当前为平台主站，无需授权验证',
    });
  }

  const licenseKey = process.env.APP_LICENSE_KEY || '';
  const agentId = process.env.APP_AGENT_ID || '';
  const boundDomain = process.env.APP_BOUND_DOMAIN || '';
  const version = process.env.APP_VERSION || 'v4.0.0';

  // 授权码部分隐藏
  const maskedLicense = licenseKey
    ? licenseKey.slice(0, 8) + '****' + licenseKey.slice(-4)
    : '未配置';

  return NextResponse.json({
    isAgentSite: true,
    agentId,
    licenseKey: maskedLicense,
    boundDomain: boundDomain || '未配置',
    version,
    status: 'active',
    message: '授权正常',
    checkedAt: new Date().toISOString(),
  });
}
