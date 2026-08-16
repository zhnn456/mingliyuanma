import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll, execute, ensureCommissionTables } from '@/lib/d1';
import { requirePrimaryAdmin } from '@/lib/auth-server';
import { auditLog } from '@/lib/audit';

/**
 * 管理后台结算管理 API
 * - GET:  查询结算列表（从 SettlementRecord 表，支持状态筛选 + 分页）
 * - POST: 审批结算（approve/reject/paid），联动 CommissionRecord 和 Agent 余额
 *
 * 统一使用 SettlementRecord 表（与 commission.ts 的 generateWeeklySettlement 一致）
 * 废弃旧的 Settlement 表
 */

// 获取结算列表
export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requirePrimaryAdmin(req);
    if (!allowed) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }
    await ensureCommissionTables();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const agentId = searchParams.get('agentId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20') || 20));

    // 动态拼接查询条件
    const conditions: string[] = [];
    const params: any[] = [];
    if (status) { conditions.push('s.status = ?'); params.push(status); }
    if (agentId) { conditions.push('s.agentId = ?'); params.push(agentId); }
    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const offset = (page - 1) * pageSize;

    // 查询结算列表（JOIN Agent 获取代理商信息）
    const settlements = await queryAll(
      `SELECT s.*, a.brandName, a.companyName, a.contactName, a.contactPhone,
              u.email as agentEmail
       FROM SettlementRecord s
       LEFT JOIN Agent a ON a.id = s.agentId
       LEFT JOIN User u ON u.id = a.userId
       ${where}
       ORDER BY s.createdAt DESC
       LIMIT ${pageSize} OFFSET ${offset}`,
      ...params
    );

    // 统计总数
    const countRow = await queryFirst(
      `SELECT COUNT(*) as total FROM SettlementRecord s ${where}`,
      ...params
    ) as any;

    // 统计各状态金额
    const statsRow = await queryFirst(
      `SELECT
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as pendingCount,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN netCommission ELSE 0 END), 0) as pendingAmount,
        COALESCE(SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END), 0) as approvedCount,
        COALESCE(SUM(CASE WHEN status = 'approved' THEN netCommission ELSE 0 END), 0) as approvedAmount,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END), 0) as paidCount,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN netCommission ELSE 0 END), 0) as paidAmount
       FROM SettlementRecord`
    ) as any;

    return NextResponse.json({
      settlements,
      total: countRow?.total || 0,
      page,
      pageSize,
      totalPages: Math.ceil((countRow?.total || 0) / pageSize),
      stats: {
        total: statsRow?.total || 0,
        pendingCount: statsRow?.pendingCount || 0,
        pendingAmount: statsRow?.pendingAmount || 0,
        approvedCount: statsRow?.approvedCount || 0,
        approvedAmount: statsRow?.approvedAmount || 0,
        paidCount: statsRow?.paidCount || 0,
        paidAmount: statsRow?.paidAmount || 0,
      },
    });
  } catch (error: any) {
    console.error('获取结算列表失败:', error?.message);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

// 审批结算申请（approve/reject/paid）
export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requirePrimaryAdmin(req);
    if (!allowed || !session) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }
    await ensureCommissionTables();

    const body = await req.json();
    const { settlementId, action, note, paymentMethod } = body;
    if (!settlementId || !action) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }

    const validActions = ['approve', 'reject', 'paid'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: '无效操作' }, { status: 400 });
    }

    // 查询结算单
    const settlement = await queryFirst('SELECT * FROM SettlementRecord WHERE id = ?', settlementId) as any;
    if (!settlement) {
      return NextResponse.json({ error: '结算单不存在' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const statusMap: Record<string, string> = {
      approve: 'approved',
      reject: 'rejected',
      paid: 'paid',
    };

    if (action === 'approve') {
      // === 审批通过 ===
      // 1. 更新结算单状态
      await execute(
        'UPDATE SettlementRecord SET status = ?, auditRemark = ?, auditorId = ?, updatedAt = ? WHERE id = ?',
        'approved', note || '', session.sub, now, settlementId
      );
      if (settlement.orderCount > 0) {
        await execute(
          'UPDATE CommissionRecord SET status = \'settled\', settledAt = ? WHERE agentId = ? AND status = ? AND settlementId = ?',
          now, settlement.agentId, 'settling', settlementId
        );
      }

      // 3. 更新代理商余额：pendingCommission 减少，settledCommission 增加
      const netCommission = Number(settlement.netCommission || 0);
      await execute(
        'UPDATE Agent SET pendingCommission = COALESCE(pendingCommission, 0) - ?, settledCommission = COALESCE(settledCommission, 0) + ? WHERE id = ?',
        netCommission, netCommission, settlement.agentId
      );

    } else if (action === 'reject') {
      // === 审批拒绝 ===
      // 1. 更新结算单状态
      await execute(
        'UPDATE SettlementRecord SET status = ?, auditRemark = ?, auditorId = ?, updatedAt = ? WHERE id = ?',
        'rejected', note || '', session.sub, now, settlementId
      );
      await execute(
        'UPDATE CommissionRecord SET status = \'pending\', settlementId = NULL WHERE agentId = ? AND settlementId = ?',
        settlement.agentId, settlementId
      );

      // 3. 代理商余额不变（pendingCommission 不变，因为申请结算时没有减少）

    } else if (action === 'paid') {
      // === 打款 ===
      // 1. 更新结算单状态和打款信息
      await execute(
        'UPDATE SettlementRecord SET status = ?, auditRemark = ?, paidAt = ?, paidMethod = ?, auditorId = ?, updatedAt = ? WHERE id = ?',
        'paid', note || '', now, paymentMethod || 'bank_transfer', session.sub, now, settlementId
      );

      // 2. settledCommission 已经在 approve 时增加，paid 时不需要再改
    }

    await auditLog({
      userId: session.sub,
      action: 'admin_settlement_review',
      details: { settlementId, action, note, paymentMethod, agentId: settlement.agentId, amount: settlement.netCommission },
      status: 'success',
    });

    return NextResponse.json({ success: true, message: '审批成功' });
  } catch (error: any) {
    console.error('审批结算失败:', error?.message);
    return NextResponse.json({ error: '审批失败' }, { status: 500 });
  }
}
