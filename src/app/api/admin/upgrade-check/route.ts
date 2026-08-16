/**
 * 管理后台升级检查接口
 * 在服务端读取环境变量，调用中央站检查新版本
 */
import { NextRequest, NextResponse } from 'next/server';
import { requirePrimaryAdmin } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requirePrimaryAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const licenseKey = process.env.APP_LICENSE_KEY || '';
    const domain = process.env.NEXTAUTH_URL || '';
    const currentVersion = process.env.APP_VERSION || 'v4.0.0';
    const centerApi = process.env.CENTER_API || '';

    // 中央站不需要检查升级
    if (!licenseKey || !centerApi) {
      return NextResponse.json({
        isCenter: true,
        currentVersion,
        message: '中央平台模式，无需检查升级',
      });
    }

    // 调用中央站的升级检查 API
    const params = new URLSearchParams({
      license: licenseKey,
      domain,
      currentVersion,
    });

    const res = await fetch(`${centerApi}/api/upgrade/check?${params}`, {
      method: 'GET',
      headers: { 'User-Agent': 'ming8-admin/1.0' },
      signal: AbortSignal.timeout(15000),
    });

    const data = await res.json();

    return NextResponse.json({
      isCenter: false,
      currentVersion,
      centerApi,
      ...data,
    });
  } catch (error: any) {
    console.error('[UpgradeCheck] 错误:', error?.message);

    // 网络错误时返回基本信息
    return NextResponse.json({
      isCenter: !process.env.APP_LICENSE_KEY,
      currentVersion: process.env.APP_VERSION || 'v4.0.0',
      hasUpdate: false,
      reason: '无法连接中央服务器检查更新（网络错误）',
      error: error?.message || '未知错误',
    });
  }
}
