/**
 * 代理商功能状态接口（供中央服务器巡检使用）
 * 
 * 中央服务器请求此接口，检查代理商是否篡改功能配置
 */
import { NextRequest, NextResponse } from 'next/server';
import { parseLicense } from '@/lib/license-generator';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const license = process.env.APP_LICENSE_KEY || '';
  const parsed = license ? parseLicense(license) : null;

  if (!parsed) {
    return NextResponse.json({
      status: 'unknown',
      reason: '授权码无效',
    });
  }

  const localFeatures = parsed.payload.features;
  const localLevel = parsed.payload.level;
  const localMaxUsers = parsed.payload.maxUsers;

  return NextResponse.json({
    status: 'ok',
    agentId: parsed.payload.agentId,
    features: localFeatures,
    level: localLevel,
    maxUsers: localMaxUsers,
    version: process.env.APP_VERSION || 'v4.0.0',
    modified: false,
    timestamp: Date.now(),
  });
}
