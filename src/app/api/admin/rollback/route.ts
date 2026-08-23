/**
 * 一键回滚 API
 * 列出可用备份 + 从备份恢复 .next
 *
 * GET  /api/admin/rollback          列出 /www/ming8-backup-* 目录
 * POST /api/admin/rollback          执行回滚 { backupPath }
 */
import { NextRequest, NextResponse } from 'next/server';
import { requirePrimaryAdmin } from '@/lib/auth-server';
import { auditLog } from '@/lib/audit';
import { exec } from 'child_process';
import { promisify } from 'util';
import { execSync } from 'child_process';

const execAsync = promisify(exec);

const BACKUP_GLOB = '/www/ming8-backup-';
const APP_DIR = '/www/ming8';

/**
 * 将路径安全转义，防止 shell 注入
 * 只允许字母、数字、连字符、下划线、斜杠和点
 */
function shellEscapePath(path: string): string {
  // 严格白名单：只允许安全字符
  if (!/^[a-zA-Z0-9_\-/.]+$/.test(path)) {
    throw new Error('非法路径字符');
  }
  // 转义特殊字符（虽然白名单已限制，但双重保险）
  return path.replace(/['\`\$\\]/g, '\\$&');
}

/**
 * GET /api/admin/rollback
 * 列出所有可用备份
 */
export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requirePrimaryAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    // 列出所有 /www/ming8-backup-* 目录（使用安全的 shell 转义）
    const escapedGlob = shellEscapePath(BACKUP_GLOB);
    const { stdout } = await execAsync(`ls -d ${escapedGlob}* 2>/dev/null || echo ""`);
    const lines = stdout.trim().split('\n').filter(Boolean);

    const backups = await Promise.all(
      lines.map(async (path) => {
        const name = path.split('/').pop() || path;
        const ts = name.replace('ming8-backup-', '');
        let size = '';
        let mtime = '';
        try {
          const escapedPath = shellEscapePath(path);
          const { stdout: duOut } = await execAsync(`du -sh ${escapedPath} 2>/dev/null | awk '{print $1}'`);
          size = duOut.trim();
        } catch {}
        try {
          const escapedPath = shellEscapePath(path);
          const { stdout: statOut } = await execAsync(`stat -c '%y' ${escapedPath} 2>/dev/null | cut -d. -f1`);
          mtime = statOut.trim();
        } catch {}
        return { path, name, ts, size, mtime };
      })
    );

    // 按时间倒序
    backups.sort((a, b) => (a.ts < b.ts ? 1 : -1));

    return NextResponse.json({ backups });
  } catch (error: any) {
    console.error('列出备份失败:', error?.message);
    return NextResponse.json({ error: '列出备份失败' }, { status: 500 });
  }
}

/**
 * POST /api/admin/rollback
 * 从指定备份恢复 .next
 */
export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requirePrimaryAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { backupPath } = await req.json();
    if (!backupPath) {
      return NextResponse.json({ error: '缺少 backupPath 参数' }, { status: 400 });
    }

    // 安全检查：backupPath 必须以 /www/ming8-backup- 开头
    if (!backupPath.startsWith(BACKUP_GLOB)) {
      return NextResponse.json({ error: '非法的备份路径' }, { status: 400 });
    }

    // 严格路径校验：只允许字母、数字、连字符、下划线、斜杠
    if (!/^[a-zA-Z0-9_\-/.]+$/.test(backupPath)) {
      return NextResponse.json({ error: '非法路径字符' }, { status: 400 });
    }

    const escapedBackupPath = shellEscapePath(backupPath);

    // 验证备份目录存在且包含 .next
    try {
      const { stdout: check } = await execAsync(`ls ${escapedBackupPath}/BUILD_ID 2>/dev/null || ls ${escapedBackupPath}/server 2>/dev/null || echo ""`);
      if (!check.trim()) {
        return NextResponse.json({ error: '备份目录不包含有效的 .next 内容' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: '备份目录不存在或无法访问' }, { status: 400 });
    }

    const currentVersion = process.env.APP_VERSION || 'unknown';
    const rollbackBackup = `${BACKUP_GLOB}pre-rollback-${Date.now()}`;
    const escapedRollbackBackup = shellEscapePath(rollbackBackup);

    // 1. 先备份当前 .next（以防回滚后想再恢复）
    console.log(`[Rollback] 备份当前 .next 到 ${rollbackBackup}`);
    try {
      const escapedAppDir = shellEscapePath(APP_DIR);
      await execAsync(`cp -r ${escapedAppDir}/.next ${escapedRollbackBackup}`);
    } catch (e: any) {
      console.warn('[Rollback] 当前版本备份失败（继续回滚）:', e?.message);
    }

    // 2. 恢复备份的 .next
    console.log(`[Rollback] 从 ${backupPath} 恢复...`);

    // 删除当前 .next/static 和 .next/server
    const escapedAppDir = shellEscapePath(APP_DIR);
    await execAsync(`rm -rf ${escapedAppDir}/.next/static ${escapedAppDir}/.next/server`);

    // 检测备份结构：可能是 .next 本身，也可能是 .next 的内容
    const { stdout: lsBackup } = await execAsync(`ls ${escapedBackupPath}/`);
    const items = lsBackup.trim().split('\n').map(s => s.trim());

    if (items.includes('static') || items.includes('server') || items.includes('BUILD_ID')) {
      // 备份是 .next 的内容
      await execAsync(`cp -r ${escapedBackupPath}/static ${escapedAppDir}/.next/static 2>/dev/null || true`);
      await execAsync(`cp -r ${escapedBackupPath}/server ${escapedAppDir}/.next/server 2>/dev/null || true`);
      await execAsync(`cp ${escapedBackupPath}/BUILD_ID ${escapedAppDir}/.next/BUILD_ID 2>/dev/null || true`);
    } else if (items.some(i => i === '.next')) {
      // 备份包含 .next 目录
      // 这种情况不应该发生，但兜底处理
      console.warn('[Rollback] 备份结构异常：包含 .next 目录');
    }

    // 3. 记录审计
    await auditLog({
      userId: session?.sub,
      action: 'admin_rollback_upgrade',
      details: {
        restoredFrom: backupPath,
        preRollbackBackup: rollbackBackup,
        currentVersion,
      },
      status: 'success',
    });

    // 4. 异步重启 PM2
    console.log('[Rollback] 回滚完成，正在重启...');
    setTimeout(() => {
      exec('pm2 restart ming8 --update-env', (err) => {
        if (err) console.error('[Rollback] PM2 重启失败:', err?.message);
      });
    }, 2000);

    return NextResponse.json({
      success: true,
      message: '回滚完成，服务正在重启',
      restoredFrom: backupPath,
      preRollbackBackup: rollbackBackup,
      restartIn: '2秒',
    });
  } catch (error: any) {
    console.error('[Rollback] 回滚失败:', error?.message);
    return NextResponse.json({
      success: false,
      reason: `回滚失败: ${error?.message || '未知错误'}`,
    }, { status: 500 });
  }
}
