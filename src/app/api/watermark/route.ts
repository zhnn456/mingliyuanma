/**
 * 代理商水印接口（供中央服务器巡检使用）
 * 
 * 中央服务器定期请求此接口，验证：
 * 1. 水印是否存在（防止删除）
 * 2. agentId 是否匹配
 * 3. 功能是否被篡改
 */
import { NextRequest, NextResponse } from 'next/server';
import { parseLicense } from '@/lib/license-generator';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const license = searchParams.get('license') || process.env.APP_LICENSE_KEY || '';

  if (!license) {
    return NextResponse.json({ error: '未配置授权码' }, { status: 400 });
  }

  const parsed = parseLicense(license);
  if (!parsed) {
    return NextResponse.json({ error: '授权码格式错误' }, { status: 400 });
  }

  return NextResponse.json({
    status: 'ok',
    agentId: parsed.payload.agentId,
    brandName: process.env.NEXT_PUBLIC_BRAND_NAME || '代理商',
    version: process.env.APP_VERSION || 'v4.0.0',
    features: parsed.payload.features,
    domain: process.env.NEXTAUTH_URL || '',
    timestamp: Date.now(),
  });
}
