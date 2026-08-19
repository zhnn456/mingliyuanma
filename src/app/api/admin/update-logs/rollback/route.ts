/**
 * 更新日志 - 回滚操作 API
 * 
 * 用于执行版本回滚操作
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePrimaryAdmin } from '@/lib/auth-server';
import { queryFirst, execute } from '@/lib/d1';
import { auditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requirePrimaryAdmin(req);
    if (!allowed) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const body = await req.json();
    const { targetVersion, reason } = body;

    if (!targetVersion) {
      return NextResponse.json({ error: '请提供目标版本号' }, { status: 400 });
    }

    // 查找目标版本的日志
    const targetLog = await queryFirst(
      'SELECT * FROM UpdateLog WHERE version = ? AND status = "success" ORDER BY createdAt DESC LIMIT 1',
      targetVersion
    );

    if (!targetLog) {
      return NextResponse.json({ error: '目标版本不存在或不可回滚' }, { status: 404 });
    }

    // 记录回滚操作
    const id = `ul${Date.now()}`;
    const currentVersion = await queryFirst('SELECT version FROM UpdateLog WHERE status = "success" ORDER BY createdAt DESC LIMIT 1') as any;
    
    const operatorName = session?.name || session?.email || '管理员';
    const rollbackTitle = `回滚至 v${targetVersion}`;
    const rollbackContent = `回滚自 v${currentVersion?.version || 'unknown'}，原因：${reason || '未提供'}`;

    await execute(
      `INSERT INTO UpdateLog (id, version, title, content, type, isMajor, changes, operatorId, operatorName, status, rollbackVersion, kind)
       VALUES (?, ?, ?, ?, 'hotfix', 0, ?, ?, 'rolled_back', ?, 'rollback')`,
      id, targetVersion, rollbackTitle, rollbackContent,
      JSON.stringify([{
        type: 'hotfix',
        title: '版本回滚',
        description: rollbackContent,
        breaking: false,
      }]),
      session?.id || null, operatorName,
      currentVersion?.version || null
    );

    // 更新之前的日志状态为已回滚
    if (currentVersion?.version) {
      await execute(
        'UPDATE UpdateLog SET status = "rolled_back" WHERE version = ? AND status = "success"',
        currentVersion.version
      );
    }

    await auditLog({
      userId: session?.sub,
      action: 'admin_rollback_updatelog',
      details: { targetVersion, reason, rollbackLogId: id, fromVersion: currentVersion?.version },
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      rollbackLogId: id,
      targetVersion,
    });
  } catch (error: any) {
    console.error('[update-logs/rollback] 错误:', error?.message);
    return NextResponse.json({ error: '回滚失败' }, { status: 500 });
  }
}
