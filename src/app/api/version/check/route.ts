import { NextRequest, NextResponse } from 'next/server';
import { verifyLicenseSignature } from '@/lib/license-generator';
import { queryFirst, queryAll } from '@/lib/d1';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const license = searchParams.get('license') || '';
  const currentVersion = searchParams.get('current') || '';
  const domain = searchParams.get('domain') || '';

  if (!license) {
    return NextResponse.json({ error: '缺少授权码' }, { status: 400 });
  }

  // 验证授权
  const verification = await verifyLicenseSignature(license, domain || undefined);
  if (!verification.valid) {
    return NextResponse.json({ error: '授权验证失败', reason: verification.reason }, { status: 401 });
  }

  // 查询最新版本
  const latestVersion = await queryFirst(
    'SELECT version, title, changelog, downloadUrl, checksum, releaseAt FROM Version WHERE isLatest = 1 ORDER BY releaseAt DESC LIMIT 1'
  ) as any;

  // 查询历史版本
  const changelog = await queryAll(
    'SELECT version, title, category, content, releaseAt FROM Version WHERE isDeprecated = 0 ORDER BY releaseAt DESC LIMIT 20'
  ) as any[];

  const hasUpdate = latestVersion && currentVersion
    ? compareVersions(latestVersion.version, currentVersion) > 0
    : !!latestVersion;

  return NextResponse.json({
    hasUpdate,
    latest: latestVersion?.version || null,
    current: currentVersion,
    changelog: changelog.map((c: any) => ({
      version: c.version,
      title: c.title,
      category: c.category,
      content: c.content,
      createdAt: c.releaseAt,
    })),
    downloadUrl: hasUpdate ? latestVersion?.downloadUrl : null,
    checksum: hasUpdate ? latestVersion?.checksum : null,
  });
}

function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/i, '').split(/[.\-]/);
  const pb = b.replace(/^v/i, '').split(/[.\-]/);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = parseInt(pa[i] || '0', 10);
    const nb = parseInt(pb[i] || '0', 10);
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}
