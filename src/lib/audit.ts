/**
 * 审计日志系统
 * 记录所有重要操作，用于安全审计和问题追踪
 */
import { prisma } from '@/lib/db/prisma';

export type AuditAction =
  | 'login' | 'logout' | 'register'
  | 'bazi_paipan' | 'ziwei_paipan' | 'qimen_paipan' | 'meihua_paipan'
  | 'order_create' | 'order_pay' | 'order_refund'
  | 'member_upgrade' | 'member_expire'
  | 'admin_update_user' | 'admin_update_order' | 'admin_update_config'
  | 'admin_toggle_agent' | 'admin_create_agent'
  | 'agent_login' | 'agent_update_customer'
  | 'pdf_generate' | 'pdf_download'
  | 'offering_create'
  | 'security_violation' | 'rate_limit_hit';

export interface AuditLogData {
  userId?: string;
  action: AuditAction;
  ip?: string;
  userAgent?: string;
  details?: Record<string, any>;
  status?: 'success' | 'failed' | 'warning';
}

/**
 * 记录审计日志
 * 使用 SiteConfig 表存储（避免修改 schema），以特定 key 前缀标识
 */
export async function auditLog(data: AuditLogData): Promise<void> {
  try {
    // 使用 SiteConfig 表存储审计日志，key 格式: audit:YYYY-MM-DD:timestamp
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timestamp = now.getTime();
    const key = `audit:${dateStr}:${timestamp}:${Math.random().toString(36).slice(2, 8)}`;
    const value = JSON.stringify({
      userId: data.userId || null,
      action: data.action,
      ip: data.ip || null,
      userAgent: data.userAgent || null,
      details: data.details || null,
      status: data.status || 'success',
      timestamp: now.toISOString(),
    });

    await prisma.siteConfig.create({
      data: { key, value, category: 'audit' },
    });
  } catch (error) {
    // 审计日志写入失败不应影响主流程
    console.error('审计日志写入失败:', error);
  }
}

/**
 * 查询审计日志
 */
export async function queryAuditLogs(options: {
  date?: string;
  action?: AuditAction;
  userId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ logs: any[]; total: number }> {
  const { date, action, userId, status, limit = 50, offset = 0 } = options;

  let whereClause: any = { category: 'audit' };

  if (date) {
    whereClause.key = { startsWith: `audit:${date}:` };
  } else {
    // 默认查今天的
    const today = new Date().toISOString().split('T')[0];
    whereClause.key = { startsWith: `audit:${today}:` };
  }

  const configs = await prisma.siteConfig.findMany({
    where: whereClause,
    orderBy: { key: 'desc' },
    take: limit,
    skip: offset,
  });

  let logs = configs.map((c: any) => {
    try {
      return JSON.parse(c.value);
    } catch {
      return null;
    }
  }).filter(Boolean);

  // 内存过滤
  if (action) logs = logs.filter((l: any) => l.action === action);
  if (userId) logs = logs.filter((l: any) => l.userId === userId);
  if (status) logs = logs.filter((l: any) => l.status === status);

  return { logs, total: logs.length };
}

/**
 * 清理30天前的审计日志
 */
export async function cleanOldAuditLogs(): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const result = await prisma.siteConfig.deleteMany({
    where: {
      category: 'audit',
      key: { lt: `audit:${cutoffStr}:` },
    },
  });

  return result.count;
}
