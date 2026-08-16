/**
 * 一键升级 API
 * 源码站后端从中央站下载升级包并自动应用
 *
 * 流程：
 * 1. 调用中央站 /api/upgrade/check 获取下载 token
 * 2. 下载升级包到本地临时目录
 * 3. 解压覆盖文件
 * 4. 触发 PM2 重启
 */
import { NextRequest, NextResponse } from 'next/server';
import { requirePrimaryAdmin } from '@/lib/auth-server';
import { statSync, createWriteStream } from 'fs';
import { createHash } from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const { allowed } = await requirePrimaryAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const licenseKey = process.env.APP_LICENSE_KEY || '';
    const domain = process.env.NEXTAUTH_URL || '';
    const currentVersion = process.env.APP_VERSION || 'v4.0.0';
    const centerApi = process.env.CENTER_API || '';

    if (!licenseKey || !centerApi) {
      return NextResponse.json({ error: '非源码部署站，无法使用此功能' }, { status: 400 });
    }

    // 1. 调用中央站检查更新并获取下载 token
    const params = new URLSearchParams({ license: licenseKey, domain, currentVersion });
    const checkRes = await fetch(`${centerApi}/api/upgrade/check?${params}`, {
      signal: AbortSignal.timeout(15000),
    });
    const checkData = await checkRes.json();

    if (!checkData.hasUpdate) {
      return NextResponse.json({ success: false, reason: checkData.reason || '暂无可用更新' });
    }

    if (!checkData.downloadToken) {
      return NextResponse.json({ success: false, reason: '获取下载令牌失败' });
    }

    // 2. 下载升级包
    const downloadUrl = `${centerApi}/api/upgrade/download?token=${checkData.downloadToken}`;
    const tmpDir = '/tmp/ming8-upgrade';
    const archivePath = `${tmpDir}/update.archive`;

    // 创建临时目录
    await execAsync(`mkdir -p ${tmpDir}`);

    const dlRes = await fetch(downloadUrl, { signal: AbortSignal.timeout(120000) });
    if (!dlRes.ok) {
      const text = await dlRes.text();
      return NextResponse.json({
        success: false,
        reason: `下载失败: HTTP ${dlRes.status} - ${text.substring(0, 100)}`,
      });
    }

    // 写入文件并同时计算 SHA256
    const fileStream = createWriteStream(archivePath);
    const hash = createHash('sha256');
    const reader = dlRes.body?.getReader();
    if (!reader) {
      return NextResponse.json({ success: false, reason: '下载流读取失败' });
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const buf = Buffer.from(value);
      fileStream.write(buf);
      hash.update(buf);
    }
    fileStream.end();
    await new Promise<void>((resolve) => fileStream.on('finish', () => resolve()));

    const fileSize = statSync(archivePath).size;
    const actualChecksum = hash.digest('hex');
    console.log(`[Upgrade] 升级包已下载: ${(fileSize / 1024 / 1024).toFixed(1)} MB, SHA256: ${actualChecksum.slice(0, 16)}...`);

    // 2.5 验证 checksum
    const expectedChecksum = checkData.checksum;
    if (expectedChecksum && actualChecksum !== expectedChecksum) {
      try { await execAsync(`rm -rf ${tmpDir}`); } catch {}
      return NextResponse.json({
        success: false,
        reason: `文件校验失败：SHA256 不匹配（下载文件可能已损坏或不完整）`,
      });
    }
    console.log('[Upgrade] SHA256 验证通过');

    // 3. 备份当前版本
    const backupDir = `/www/ming8-backup-${Date.now()}`;
    console.log('[Upgrade] 备份当前版本...');
    await execAsync(`cp -r /www/ming8/.next ${backupDir}`);

    // 4. 检测文件格式并解压升级包
    console.log('[Upgrade] 检测文件格式并解压...');
    const { stdout: fileType } = await execAsync(`file -b ${archivePath}`);
    const isZip = fileType.includes('Zip archive') || fileType.includes('zip');
    const isGzip = fileType.includes('gzip') || fileType.includes('tar');

    if (isZip) {
      console.log('[Upgrade] 文件格式: ZIP');
      await execAsync(`cd ${tmpDir} && unzip -o update.archive`);
    } else if (isGzip) {
      console.log('[Upgrade] 文件格式: GZIP/TAR');
      await execAsync(`cd ${tmpDir} && tar -xzf update.archive`);
    } else {
      // 兜底：尝试先 tar 后 unzip
      try {
        await execAsync(`cd ${tmpDir} && tar -xzf update.archive`);
      } catch {
        await execAsync(`cd ${tmpDir} && unzip -o update.archive`);
      }
    }

    // 5. 应用升级（覆盖文件）
    console.log('[Upgrade] 应用升级...');

    // 检查升级包内容结构
    const { stdout: lsResult } = await execAsync(`ls ${tmpDir}/`);
    const contents = lsResult.trim().split('\n').map(s => s.trim());

    for (const item of contents) {
      const srcPath = `${tmpDir}/${item}`;
      const destPath = `/www/ming8/${item}`;

      if (item === '.next') {
        // 覆盖 .next/static 和 .next/server
        await execAsync(`rm -rf /www/ming8/.next/static /www/ming8/.next/server`);
        await execAsync(`cp -r ${srcPath}/static /www/ming8/.next/static 2>/dev/null || true`);
        await execAsync(`cp -r ${srcPath}/server /www/ming8/.next/server 2>/dev/null || true`);
        await execAsync(`cp ${srcPath}/BUILD_ID /www/ming8/.next/BUILD_ID 2>/dev/null || true`);
      } else if (item === 'public') {
        await execAsync(`cp -r ${srcPath}/* /www/ming8/public/ 2>/dev/null || true`);
      } else if (item === 'server.js' || item === 'ecosystem.config.js') {
        await execAsync(`cp ${srcPath} ${destPath} 2>/dev/null || true`);
      }
    }

    // 6. 清理临时文件
    try {
      await execAsync(`rm -rf ${tmpDir}`);
    } catch {}

    // 7. 异步重启 PM2（延迟 2 秒，让 API 响应先返回）
    console.log('[Upgrade] 升级完成，正在重启...');
    setTimeout(() => {
      exec('pm2 restart ming8 --update-env', (err) => {
        if (err) console.error('[Upgrade] PM2 重启失败:', err?.message);
      });
    }, 2000);

    return NextResponse.json({
      success: true,
      message: '升级完成，服务正在重启',
      oldVersion: currentVersion,
      newVersion: checkData.latestVersion,
      changelog: checkData.changelog || '',
      backupPath: backupDir,
      restartIn: '2秒',
    });
  } catch (error: any) {
    console.error('[Upgrade] 一键升级错误:', error?.message);
    return NextResponse.json({
      success: false,
      reason: `升级失败: ${error?.message || '未知错误'}`,
    }, { status: 500 });
  }
}
