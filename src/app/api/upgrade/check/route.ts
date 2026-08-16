/**
 * 升级检查接口
 * 
 * 客户端 update.sh 调用此接口检查是否有新版本
 * 验证授权码 + 升级权益后，返回下载 token
 * 
 * GET /api/upgrade/check?license=LIC.xxx&domain=xxx.com&currentVersion=v4.0.0
 */
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst } from '@/lib/d1';
import { verifyLicenseSignature } from '@/lib/license-generator';
import { createDownloadToken } from '@/lib/upgrade-tokens';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const license = searchParams.get('license');
    const domain = searchParams.get('domain');
    const currentVersion = searchParams.get('currentVersion') || 'v4.0.0';
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown';

    if (!license || !domain) {
      return NextResponse.json({ hasUpdate: false, reason: '缺少必要参数' }, { status: 400 });
    }

    // 1. 验证授权码签名
    const verifyResult = await verifyLicenseSignature(license, domain);
    if (!verifyResult.valid) {
      return NextResponse.json({ hasUpdate: false, reason: verifyResult.reason || '授权码无效' }, { status: 403 });
    }

    const payload = verifyResult.payload!;

    // 2. 查询代理商记录，获取升级权益
    const agent = await queryFirst('SELECT * FROM Agent WHERE licenseKey = ?', license) as any;
    if (!agent) {
      return NextResponse.json({ hasUpdate: false, reason: '代理商记录不存在' }, { status: 403 });
    }

    // 3. 检查升级权益
    const upgradePlan = agent.upgradePlan || payload.upgradePlan || 'none';
    const upgradeExpiryAt = agent.upgradeExpiryAt ? new Date(agent.upgradeExpiryAt).getTime() : null;

    if (upgradePlan === 'none' || !upgradeExpiryAt) {
      return NextResponse.json({
        hasUpdate: false,
        reason: '升级服务未激活，如需升级请联系客服购买年度升级服务（¥1000/年）',
        upgradePlan: 'none',
        upgradeExpiryAt: null,
      }, { status: 403 });
    }

    // 检查是否过期
    if (upgradeExpiryAt < Date.now()) {
      return NextResponse.json({
        hasUpdate: false,
        reason: `升级服务已于 ${new Date(upgradeExpiryAt).toLocaleDateString('zh-CN')} 到期，如需续费请联系客服（¥1000/年）`,
        upgradePlan,
        upgradeExpiryAt: new Date(upgradeExpiryAt).toISOString(),
      }, { status: 403 });
    }

    // 4. 查询最新版本
    const latestPackage = await queryFirst(
      'SELECT * FROM UpgradePackage WHERE status = ? ORDER BY publishedAt DESC LIMIT 1',
      'published'
    ) as any;

    if (!latestPackage) {
      return NextResponse.json({
        hasUpdate: false,
        reason: '暂无可用更新',
        currentVersion,
        upgradePlan,
        upgradeExpiryAt: new Date(upgradeExpiryAt).toISOString(),
      });
    }

    // 5. 版本比较
    if (!isNewerVersion(latestPackage.version, currentVersion)) {
      return NextResponse.json({
        hasUpdate: false,
        reason: '已是最新版本',
        currentVersion,
        latestVersion: latestPackage.version,
        upgradePlan,
        upgradeExpiryAt: new Date(upgradeExpiryAt).toISOString(),
      });
    }

    // 6. 检查最低版本要求（当前版本必须 >= minVersion）
    if (latestPackage.minVersion && isNewerVersion(latestPackage.minVersion, currentVersion)) {
      return NextResponse.json({
        hasUpdate: false,
        reason: `当前版本 ${currentVersion} 过低，需先升级到 ${latestPackage.minVersion} 或以上版本`,
        currentVersion,
        latestVersion: latestPackage.version,
        upgradePlan,
        upgradeExpiryAt: new Date(upgradeExpiryAt).toISOString(),
      });
    }

    // 7. 生成下载 token（2小时有效，绑定 IP）
    const downloadToken = createDownloadToken(agent.id, latestPackage.version, clientIP);

    // 8. 记录检查日志
    try {
      const { execute } = await import('@/lib/d1');
      await execute(
        'INSERT INTO UpgradeDownloadLog (id, agentId, licenseKey, domain, version, clientIP, downloadToken, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        agent.id,
        license.substring(0, 50),
        domain,
        latestPackage.version,
        clientIP,
        downloadToken.substring(0, 50),
        'check'
      );
    } catch {}

    return NextResponse.json({
      hasUpdate: true,
      latestVersion: latestPackage.version,
      currentVersion,
      changelog: latestPackage.changelog || '',
      requiresMigration: latestPackage.requiresMigration === 1,
      downloadUrl: `${process.env.NEXTAUTH_URL}/api/upgrade/download?token=${downloadToken}`,
      downloadToken,
      fileSize: latestPackage.fileSize || 0,
      checksum: latestPackage.checksum || '',
      upgradePlan,
      upgradeExpiryAt: new Date(upgradeExpiryAt).toISOString(),
    });
  } catch (error: any) {
    console.error('[Upgrade Check] 错误:', error?.message);
    return NextResponse.json({ hasUpdate: false, reason: '服务器错误' }, { status: 500 });
  }
}

/**
 * 版本号比较：判断 newVersion 是否比 oldVersion 新
 * 支持 v4.0.0 / 4.0.0 格式
 */
function isNewerVersion(newVer: string, oldVer: string): boolean {
  const normalize = (v: string) => v.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  const [n1, n2, n3] = normalize(newVer);
  const [o1, o2, o3] = normalize(oldVer);
  if (n1 !== o1) return n1 > o1;
  if (n2 !== o2) return n2 > o2;
  return (n3 || 0) > (o3 || 0);
}

