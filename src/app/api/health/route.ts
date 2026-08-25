import { NextResponse } from 'next/server';
import { getSystemVersion } from '@/lib/version';

export async function GET() {
  const isProd = process.env.NODE_ENV === 'production';
  // 安全基线（安全审计 V-4）：生产环境不暴露版本号/产品代号，避免攻击者对齐已知版本漏洞
  if (isProd) {
    return NextResponse.json({ status: 'ok' });
  }
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    ...getSystemVersion(),
  });
}
