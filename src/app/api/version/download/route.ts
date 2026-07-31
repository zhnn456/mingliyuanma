import { NextRequest, NextResponse } from 'next/server';
import { verifyLicenseSignature } from '@/lib/license-generator';
import { queryFirst, queryAll, execute } from '@/lib/d1';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const license = searchParams.get('license') || '';
  const version = searchParams.get('version') || '';
  const token = searchParams.get('token') || '';

  if (!license) {
    return NextResponse.json({ error: '缺少授权码' }, { status: 400 });
  }

  // 验证授权
  const verification = await verifyLicenseSignature(license);
  if (!verification.valid) {
    return NextResponse.json({ error: '授权验证失败', reason: verification.reason }, { status: 401 });
  }

  // 验证下载 token（可选，防滥用）
  if (token) {
    // token 验证逻辑可以后续添加（如签名 URL）
  }

  // 查询版本信息
  const versionInfo = await queryFirst(
    'SELECT version, downloadUrl, checksum, isDeprecated FROM Version WHERE version = ?',
    version
  ) as any;

  if (!versionInfo) {
    return NextResponse.json({ error: '版本不存在' }, { status: 404 });
  }

  if (versionInfo.isDeprecated) {
    return NextResponse.json({ error: '该版本已弃用' }, { status: 410 });
  }

  // 记录下载
  try {
    const agentId = verification.payload?.agentId || 'unknown';
    await execute(
      `INSERT INTO SiteConfig (id, key, value, category, updatedAt) VALUES (?, ?, ?, ?, ?)`,
      `dl_${Date.now()}`,
      `version_download:${agentId}:${version}`,
      new Date().toISOString(),
      'version',
      new Date().toISOString()
    );
  } catch {}

  return NextResponse.json({
    version: versionInfo.version,
    downloadUrl: versionInfo.downloadUrl,
    checksum: versionInfo.checksum,
    expiresAt: Date.now() + 600_000,
  });
}
