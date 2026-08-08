import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll, execute, ensureCommissionTables } from '@/lib/d1';
import { requireAdmin } from '@/lib/auth-server';
import { auditLog } from '@/lib/audit';

// 确保 Settlement 表存在（与代理商后台共用同一张表，实现联动）
// 在代理商端 schema 基础上补充 adminNote 列，用于记录管理员审批备注
async function ensureSettlementTable() {
  await ensureCommissionTables();
  await execute(`CREATE TABLE IF NOT EXISTS "Settlement" (
    id TEXT PRIMARY KEY,
    agentId TEXT NOT NULL,
    period TEXT,
    amount REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    note TEXT,
    adminNote TEXT,
    createdAt TEXT,
    updatedAt TEXT
  )`);
  await execute('CREATE INDEX IF NOT EXISTS "set_agentId_idx" ON "Settlement"("agentId")');
  await execute('CREATE INDEX IF NOT EXISTS "set_status_idx" ON "Settlement"("status")');

  // 老表可能缺少 adminNote 列，按需补列
  const cols = await queryAll("PRAGMA table_info('Settlement')") as any[];
  const colNames = cols.map(c => c.name);
  if (!colNames.includes('adminNote')) {
    try { await execute('ALTER TABLE "Settlement" ADD COLUMN "adminNote" TEXT'); } catch {}
  }
}

// 获取所有代理商的结算申请列表（支持状态筛选）
export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }
    await ensureSettlementTable();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    let sql = `SELECT s.*, a.brandName, a.companyName, a.contactName, a.contactPhone, u.email as agentEmail
               FROM Settlement s
               LEFT JOIN Agent a ON a.id = s.agentId
               LEFT JOIN User u ON u.id = a.userId
               ORDER BY s.createdAt DESC`;
    if (status) {
      sql = `SELECT s.*, a.brandName, a.companyName, a.contactName, a.contactPhone, u.email as agentEmail
             FROM Settlement s
             LEFT JOIN Agent a ON a.id = s.agentId
             LEFT JOIN User u ON u.id = a.userId
             WHERE s.status = ?
             ORDER BY s.createdAt DESC`;
    }
    const settlements = await queryAll(sql, ...(status ? [status] : []));
    return NextResponse.json({ settlements });
  } catch (error) {
    console.error('获取结算列表失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

// 审批结算申请（approve/reject/paid）
export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed || !session) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }
    await ensureSettlementTable();
    const body = await req.json();
    const { settlementId, action, note } = body;
    if (!settlementId || !action) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }
    const validActions = ['approve', 'reject', 'paid'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: '无效操作' }, { status: 400 });
    }
    const statusMap: Record<string, string> = {
      approve: 'approved',
      reject: 'rejected',
      paid: 'paid',
    };
    await execute('UPDATE Settlement SET status = ?, adminNote = ?, updatedAt = ? WHERE id = ?', statusMap[action], note || '', new Date().toISOString(), settlementId);
    await auditLog({
      userId: session.sub,
      action: 'admin_settlement_review',
      details: { settlementId, action, note },
      status: 'success',
    });
    return NextResponse.json({ success: true, message: '审批成功' });
  } catch (error) {
    console.error('审批结算失败:', error);
    return NextResponse.json({ error: '审批失败' }, { status: 500 });
  }
}
