/**
 * 更新日志服务
 * 
 * 提供创建、查询、回滚更新日志的服务方法
 * 可在版本管理、部署流程中自动调用
 */

import { queryFirst, queryAll, execute } from './d1';

export interface CreateLogInput {
  version: string;
  title: string;
  content: string;
  type?: 'update' | 'feature' | 'fix' | 'security' | 'hotfix';
  isMajor?: boolean;
  changes?: { type: string; title: string; description?: string; breaking?: boolean }[];
  tag?: string;
  operatorId?: string;
  operatorName?: string;
}

/**
 * 创建更新日志
 */
export async function createUpdateLog(input: CreateLogInput): Promise<{ id: string }> {
  const {
    version,
    title,
    content,
    type = 'update',
    isMajor = false,
    changes,
    tag,
    operatorId,
    operatorName,
  } = input;

  if (!version || !title || !content) {
    throw new Error('版本号、标题和内容为必填项');
  }

  const id = `ul${Date.now()}`;
  const changesJson = changes ? JSON.stringify(changes) : null;
  const finalOperatorName = operatorName || '系统';

  await execute(
    `INSERT INTO UpdateLog (id, version, title, content, type, isMajor, changes, operatorId, operatorName, tag, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'success')`,
    id, version, title, content, type, isMajor ? 1 : 0, changesJson, operatorId || null, finalOperatorName, tag || null
  );

  return { id };
}

/**
 * 记录代码变更摘要
 * 在构建/部署时调用，自动收集 git diff 或变更信息
 */
export async function recordCodeChanges(
  version: string,
  changes: Array<{
    type: 'feature' | 'fix' | 'improvement' | 'security';
    title: string;
    files?: string[];
  }>
): Promise<{ id: string }> {
  const changeTypes: Record<string, string> = {
    feature: '新功能',
    fix: '修复',
    improvement: '改进',
    security: '安全',
  };

  const content = changes
    .map((c, i) => `${i + 1}. [${changeTypes[c.type]}] ${c.title}`)
    .join('\n');

  const hasBreakingChange = changes.some((c) => c.files && c.files.some((f) => f.includes('breaking')));
  const isMajor = hasBreakingChange || changes.length >= 5;

  return createUpdateLog({
    version,
    title: `v${version} 发布`,
    content,
    type: isMajor ? 'feature' : 'update',
    isMajor,
    changes: changes.map((c) => ({
      type: c.type === 'improvement' ? 'update' : c.type,
      title: c.title,
      description: c.files ? `涉及文件: ${c.files.join(', ')}` : undefined,
      breaking: c.type === 'security' && c.files?.some((f) => f.includes('breaking')),
    })),
  });
}

/**
 * 获取当前最新版本
 */
export async function getCurrentVersion(): Promise<string | null> {
  const result = await queryFirst(
    'SELECT version FROM UpdateLog WHERE status = "success" ORDER BY createdAt DESC LIMIT 1'
  ) as any;
  return result?.version || null;
}

/**
 * 记录系统启动/重启事件
 */
export async function recordSystemEvent(
  event: 'startup' | 'restart' | 'shutdown',
  details?: string
): Promise<void> {
  const version = await getCurrentVersion() || 'unknown';
  const id = `ul${Date.now()}`;
  
  await execute(
    `INSERT INTO UpdateLog (id, version, title, content, type, isMajor, status)
     VALUES (?, ?, ?, ?, 'hotfix', 0, 'success')`,
    id,
    version,
    `系统${event === 'startup' ? '启动' : event === 'restart' ? '重启' : '关闭'}`,
    details || `系统于 ${new Date().toISOString()} 进行${event === 'startup' ? '启动' : event === 'restart' ? '重启' : '关闭'}操作`
  );
}

/**
 * 获取版本历史
 */
export async function getVersionHistory(limit: number = 50): Promise<any[]> {
  return queryAll(
    'SELECT * FROM UpdateLog WHERE status = "success" ORDER BY createdAt DESC LIMIT ?',
    limit
  );
}

/**
 * 执行版本回滚
 */
export async function rollbackToVersion(targetVersion: string, reason: string, operatorName?: string): Promise<void> {
  const id = `ul${Date.now()}`;
  const currentVersion = await getCurrentVersion();
  
  await execute(
    `INSERT INTO UpdateLog (id, version, title, content, type, isMajor, status, rollbackVersion, operatorName)
     VALUES (?, ?, ?, ?, 'hotfix', 0, 'rolled_back', ?, ?)`,
    id,
    targetVersion,
    `回滚至 v${targetVersion}`,
    `回滚自 v${currentVersion || 'unknown'}，原因：${reason}`,
    currentVersion || null,
    operatorName || '系统'
  );

  if (currentVersion) {
    await execute(
      'UPDATE UpdateLog SET status = "rolled_back" WHERE version = ? AND status = "success"',
      currentVersion
    );
  }
}
