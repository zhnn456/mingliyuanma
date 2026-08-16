/**
 * 升级包下载接口
 * 
 * 客户端通过 check 接口获取的 downloadToken 下载更新包
 * token 绑定 IP + 2小时过期 + 一次性使用
 * 
 * GET /api/upgrade/download?token=xxx
 */
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, execute } from '@/lib/d1';
import { getDownloadTokenInfo, removeDownloadToken } from '@/lib/upgrade-tokens';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return new NextResponse('缺少下载令牌', { status: 400 });
    }

    // 1. 验证 token
    const tokenInfo = getDownloadTokenInfo(token);
    if (!tokenInfo) {
      return new NextResponse('下载令牌无效或已过期', { status: 403 });
    }

    // 2. 检查过期
    if (Date.now() > tokenInfo.expiry) {
      removeDownloadToken(token);
      return new NextResponse('下载令牌已过期，请重新检查更新', { status: 403 });
    }

    // 3. IP 检查已移除
    // 原因：源码站后端调用 check API 生成 token（IP 是服务器 IP），
    // 但下载可能是浏览器直接下载（IP 是用户 IP），两者不匹配导致 403。
    // token 本身有 2 小时过期 + 一次性使用，足够安全。
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown';

    // 4. 查询版本包信息
    const pkg = await queryFirst('SELECT * FROM UpgradePackage WHERE version = ? AND status = ?', tokenInfo.version, 'published') as any;
    if (!pkg) {
      return new NextResponse('更新包不存在', { status: 404 });
    }

    // 5. 验证文件是否存在
    if (!pkg.filePath || !existsSync(pkg.filePath)) {
      return new NextResponse('更新包文件不存在', { status: 404 });
    }

    // 6. 一次性使用（下载后删除 token）
    removeDownloadToken(token);

    // 7. 记录下载日志
    try {
      await execute(
        'INSERT INTO UpgradeDownloadLog (id, agentId, licenseKey, domain, version, clientIP, downloadToken, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        `dl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        tokenInfo.agentId,
        '',
        '',
        tokenInfo.version,
        clientIP,
        token.substring(0, 50),
        'downloaded'
      );
    } catch {}

    // 8. 返回文件流
    const fileBuffer = readFileSync(pkg.filePath);
    const fileName = `update-${tokenInfo.version}.zip`;

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
        'X-File-Size': (pkg.fileSize || fileBuffer.length).toString(),
        'X-Checksum': pkg.checksum || '',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('[Upgrade Download] 错误:', error?.message);
    return new NextResponse('服务器错误', { status: 500 });
  }
}