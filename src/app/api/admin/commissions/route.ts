/**
 * 佣金统计API
 * 功能：查询代理商佣金汇总、待结算金额、已结算金额
 * 用途：代理商佣金看板、财务对账
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { queryFirst, queryAll, ensureCommissionTables } from '@/lib/d1';

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureCommissionTables();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.max(1, parseInt(searchParams.get('pageSize') || '20'));
    const agentId = searchParams.get('agentId') || '';
    const offset = (page - 1) * pageSize;

    // 构建查询条件
    const conditions: string[] = [];
    const values: any[] = [];
    if (agentId) {
      conditions.push('cr.agentId = ?');
      values.push(agentId);
    }
    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // 查询分润记录（关联 Agent 获取品牌名）
    const recordsSql = `SELECT cr.*, a.brandName, a.contactName
FROM CommissionRecord cr
LEFT JOIN Agent a ON cr.agentId = a.id
${where}
ORDER BY cr.createdAt DESC
LIMIT ${pageSize} OFFSET ${offset}`;
    const records = await queryAll(recordsSql, ...values);

    // 查询总数
    const countSql = `SELECT COUNT(*) as total FROM CommissionRecord cr ${where}`;
    const countRow = await queryFirst(countSql, ...values) as any;
    const total = countRow?.total || 0;

    // 统计信息
    const statsSql = `SELECT
  COUNT(*) as totalRecords,
  COALESCE(SUM(cr.commissionAmount), 0) as totalCommission,
  COALESCE(SUM(CASE WHEN cr.status = 'pending' THEN cr.commissionAmount ELSE 0 END), 0) as pendingAmount,
  COALESCE(SUM(CASE WHEN cr.status = 'settled' THEN cr.commissionAmount ELSE 0 END), 0) as settledAmount
FROM CommissionRecord cr
${where}`;
    const statsRow = await queryFirst(statsSql, ...values) as any;

    return NextResponse.json({
      records,
      total,
      page,
      pageSize,
      stats: {
        totalRecords: statsRow?.totalRecords || 0,
        totalCommission: statsRow?.totalCommission || 0,
        pendingAmount: statsRow?.pendingAmount || 0,
        settledAmount: statsRow?.settledAmount || 0,
      },
    });
  } catch (error) {
    console.error('获取管理后台分润记录失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
