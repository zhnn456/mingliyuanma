/**
 * 审计日志系统
 * 记录所有重要操作，用于安全审计和问题追踪
 * 直接使用 MySQL 查询，避免 Prisma 带来的额外开销
 */
import { execute, queryAll } from '@/lib/d1';

export type AuditAction =
  | 'login' | 'logout' | 'register'
  | 'bazi_paipan' | 'ziwei_paipan' | 'qimen_paipan' | 'meihua_paipan'
  | 'order_create' | 'order_pay' | 'order_refund' | 'recharge_order_create' | 'recharge_success'
  | 'member_upgrade' | 'member_expire'
  | 'admin_update_user' | 'admin_update_order' | 'admin_update_config'
  | 'admin_toggle_agent' | 'admin_create_agent' | 'admin_delete_agent' | 'admin_update_agent'
  | 'admin_recharge_agent' | 'admin_settlement_review'
  | 'admin_card_key_generate' | 'admin_card_key_disable'
  | 'card_key_redeem'
  | 'agent_login' | 'agent_update_customer'
  | 'agent_create_sub_agent' | 'agent_update_sub_agent' | 'agent_delete_sub_agent'
  | 'pdf_generate' | 'pdf_download'
  | 'offering_create'
  | 'security_violation' | 'rate_limit_hit'
  | 'admin_create_admin' | 'admin_update_admin' | 'admin_delete_admin'
  | 'admin_create_announcement' | 'admin_update_announcement' | 'admin_delete_announcement'
  | 'admin_update_payment_config' | 'admin_update_brand_settings'
  | 'admin_create_updatelog' | 'admin_update_updatelog' | 'admin_delete_updatelog'
  | 'admin_apply_upgrade'
  | 'admin_rollback_upgrade'
  | 'admin_migrate_rules'
  | 'admin_publish_version' | 'admin_update_version' | 'admin_delete_version'
  | 'admin_rollback_updatelog' | 'admin_batch_tag' | 'admin_update_mock_config' | 'admin_clawback_commission';

export interface AuditLogData {
  userId?: string;
  action: AuditAction;
  ip?: string;
  userAgent?: string;
  details?: Record<string, any>;
  status?: 'success' | 'failed' | 'warning';
}

export async function auditLog(data: AuditLogData): Promise<void> {
  try {
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

    await execute(
      'INSERT INTO SiteConfig (id, "key", value, category, updatedAt) VALUES (?, ?, ?, ?, ?)',
      `audit_${timestamp}_${Math.random().toString(36).slice(2, 8)}`,
      key, value, 'audit', now.toISOString()
    );
  } catch {
    console.error('审计日志写入失败');
  }
}

export async function queryAuditLogs(options: {
  date?: string;
  action?: AuditAction;
  userId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ logs: any[]; total: number }> {
  const { date, action, userId, status, limit = 50, offset = 0 } = options;

  const targetDate = date || new Date().toISOString().split('T')[0];
  const rows = await queryAll(
    "SELECT * FROM SiteConfig WHERE category = 'audit' AND `key` LIKE ? ORDER BY `key` DESC",
    `audit:${targetDate}:%`
  ) as any[];

  let logs = rows.map((c: any) => {
    try { return { id: c.key, ...JSON.parse(c.value) }; } catch { return null; }
  }).filter(Boolean) as any[];

  if (action) logs = logs.filter((l: any) => l.action === action);
  if (userId) logs = logs.filter((l: any) => l.userId === userId);
  if (status) logs = logs.filter((l: any) => l.status === status);

  const total = logs.length;
  const pagedLogs = logs.slice(offset, offset + limit);
  return { logs: pagedLogs, total };
}

export async function cleanOldAuditLogs(): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const result = await execute(
    "DELETE FROM SiteConfig WHERE category = 'audit' AND `key` < ?",
    `audit:${cutoffStr}:`
  );
  return result.changes || 0;
}
