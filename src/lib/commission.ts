import { queryFirst, queryAll, execute, ensureCommissionTables } from './d1';

// 可分润的产品类型
export const COMMISSION_PRODUCT_TYPES = ['membership', 'offering', 'pdf_report'] as const;
export type CommissionProductType = typeof COMMISSION_PRODUCT_TYPES[number];

// 分润基数公式
// 可分润金额 = 订单实付金额 - 支付手续费(1%) - 优惠券金额
const PAYMENT_FEE_RATE = 0.01;

// 阶梯分润规则（月GMV区间 -> 加成比例）
const TIER_RULES = [
  { min: 0, max: 5000, bonus: 0 },
  { min: 5001, max: 20000, bonus: 0.03 },
  { min: 20001, max: 50000, bonus: 0.05 },
  { min: 50001, max: Infinity, bonus: 0.08 },
];

// 默认分润比例
const DEFAULT_RATES: Record<string, number> = {
  membership: 0.50,
  offering: 0.50,
  pdf_report: 0.60,
};

export interface CommissionResult {
  agentId: string;
  orderId: string;
  userId: string;
  productType: string;
  productId?: string;
  orderAmount: number;
  baseAmount: number;
  commissionRate: number;
  commissionAmount: number;
  tierBonusAmount: number;
  newCustomerBonusAmount: number;
  totalCommission: number;
  isNewCustomer: boolean;
}

/** 获取阶梯加成 */
function getTierBonus(monthGMV: number): number {
  for (const tier of TIER_RULES) {
    if (monthGMV >= tier.min && monthGMV <= tier.max) {
      return tier.bonus;
    }
  }
  return 0;
}

/** 获取代理商的分润规则 */
async function getAgentCommissionRule(agentId: string, productType: string) {
  const rule = await queryFirst(
    'SELECT * FROM "CommissionRule" WHERE (agentId = ? OR agentId IS NULL) AND productType IN (?, ?) AND isActive = 1 ORDER BY CASE WHEN agentId = ? THEN 0 ELSE 1 END, CASE WHEN productType = ? THEN 0 ELSE 1 END LIMIT 1',
    agentId, productType, 'all', agentId, productType
  ) as any;
  return rule;
}

/** 计算订单分润 */
export async function calculateCommission(params: {
  agentId: string;
  orderId: string;
  userId: string;
  productType: string;
  productId?: string;
  orderAmount: number;
  couponAmount?: number;
  paymentFee?: number;
  isNewCustomer?: boolean;
}): Promise<CommissionResult | null> {
  const {
    agentId, orderId, userId, productType, productId,
    orderAmount, couponAmount = 0, paymentFee, isNewCustomer = false,
  } = params;

  if (!COMMISSION_PRODUCT_TYPES.includes(productType as any)) return null;
  if (orderAmount <= 0) return null;

  await ensureCommissionTables();

  const rule = await getAgentCommissionRule(agentId, productType);
  const agent = await queryFirst('SELECT * FROM "Agent" WHERE id = ?', agentId) as any;
  if (!agent) return null;

  const fee = paymentFee ?? Math.round(orderAmount * PAYMENT_FEE_RATE * 100) / 100;
  const baseAmount = Math.max(0, orderAmount - fee - couponAmount);

  const baseRate = rule?.baseRate ?? agent.commissionRate ?? DEFAULT_RATES[productType] ?? 0.20;
  const tierBonusRate = rule?.tierBonus ?? 0;
  const newCustomerBonusRate = rule?.newCustomerBonus ?? 0.05;

  const tierBonus = getTierBonus(agent.currentMonthGMV || 0);
  const effectiveTierBonus = Math.max(tierBonus, tierBonusRate);

  const commissionRate = Math.min(1, baseRate + effectiveTierBonus);
  const commissionAmount = Math.round(baseAmount * commissionRate * 100) / 100;
  const tierBonusAmount = Math.round(baseAmount * effectiveTierBonus * 100) / 100;
  const newCustomerBonusAmount = isNewCustomer
    ? Math.min(500, Math.round(baseAmount * newCustomerBonusRate * 100) / 100)
    : 0;
  const totalCommission = Math.round((commissionAmount + newCustomerBonusAmount) * 100) / 100;

  return {
    agentId, orderId, userId, productType, productId,
    orderAmount, baseAmount,
    commissionRate, commissionAmount, tierBonusAmount,
    newCustomerBonusAmount, totalCommission,
    isNewCustomer,
  };
}

/** 保存分润记录 */
export async function saveCommissionRecord(result: CommissionResult) {
  await ensureCommissionTables();
  const id = `cr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  await execute(
    `INSERT INTO "CommissionRecord" (id, agentId, orderId, userId, productType, productId, orderAmount, baseAmount, commissionRate, commissionAmount, tierBonusAmount, newCustomerBonusAmount, totalCommission, status, isNewCustomer, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'))`,
    id, result.agentId, result.orderId, result.userId,
    result.productType, result.productId || null,
    result.orderAmount, result.baseAmount,
    result.commissionRate, result.commissionAmount,
    result.tierBonusAmount, result.newCustomerBonusAmount,
    result.totalCommission, result.isNewCustomer ? 1 : 0
  );

  // 同时更新订单表的分润字段
  await execute(
    'UPDATE "Order" SET commissionRate = ?, commissionAmount = ?, commissionSettled = 0 WHERE id = ?',
    result.commissionRate, result.totalCommission, result.orderId
  );

  // 累加代理商待结算佣金
  await execute(
    'UPDATE "Agent" SET pendingCommission = COALESCE(pendingCommission, 0) + ?, totalCommission = COALESCE(totalCommission, 0) + ?, currentMonthGMV = COALESCE(currentMonthGMV, 0) + ? WHERE id = ?',
    result.totalCommission, result.commissionAmount, result.baseAmount, result.agentId
  );

  return id;
}

/** 处理退款冲销 */
export async function clawbackCommission(orderId: string) {
  await ensureCommissionTables();

  const records = await queryAll(
    'SELECT * FROM "CommissionRecord" WHERE orderId = ? AND status NOT IN ("clawed_back")',
    orderId
  ) as any[];

  for (const record of records) {
    const clawbackAmount = record.totalCommission;
    await execute(
      'UPDATE "CommissionRecord" SET status = "clawed_back", clawbackAmount = ?, createdAt = datetime("now") WHERE id = ?',
      clawbackAmount, record.id
    );
    await execute(
      'UPDATE "Agent" SET pendingCommission = COALESCE(pendingCommission, 0) - ?, totalCommission = COALESCE(totalCommission, 0) - ? WHERE id = ?',
      clawbackAmount, record.commissionAmount, record.agentId
    );
  }

  await execute('UPDATE "Order" SET commissionSettled = 2 WHERE id = ?', orderId);
  return records.length;
}

/** 生成周结算单 */
export async function generateWeeklySettlement(agentId: string, weekStart: string, weekEnd: string) {
  await ensureCommissionTables();

  const records = await queryAll(
    `SELECT * FROM "CommissionRecord"
     WHERE agentId = ? AND status = 'pending'
     AND createdAt >= ? AND createdAt < ?`,
    agentId, weekStart, weekEnd
  ) as any[];

  if (records.length === 0) return null;

  const totalCommission = records.reduce((sum, r) => sum + r.totalCommission, 0);
  const totalOrderAmount = records.reduce((sum, r) => sum + r.orderAmount, 0);
  const netCommission = Math.round(totalCommission * 100) / 100;

  const settlementId = `st_${Date.now()}`;

  await execute(
    `INSERT INTO "SettlementRecord" (id, agentId, periodStart, periodEnd, orderCount, totalOrderAmount, totalCommission, netCommission, status, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))`,
    settlementId, agentId, weekStart, weekEnd,
    records.length, totalOrderAmount, totalCommission, netCommission
  );

  // 标记分润记录为已结算
  for (const r of records) {
    await execute(
      'UPDATE "CommissionRecord" SET status = "settled", settlementId = ?, settledAt = datetime("now") WHERE id = ?',
      settlementId, r.id
    );
  }

  await execute(
    'UPDATE "Agent" SET pendingCommission = COALESCE(pendingCommission, 0) - ? WHERE id = ?',
    netCommission, agentId
  );

  return { settlementId, orderCount: records.length, totalCommission: netCommission };
}

/** 获取代理商分润统计 */
export async function getAgentCommissionStats(agentId: string) {
  await ensureCommissionTables();

  const pendingRow = await queryFirst(
    'SELECT COALESCE(SUM(totalCommission), 0) as total, COUNT(*) as cnt FROM "CommissionRecord" WHERE agentId = ? AND status = "pending"',
    agentId
  ) as any;

  const settledRow = await queryFirst(
    'SELECT COALESCE(SUM(totalCommission), 0) as total, COUNT(*) as cnt FROM "CommissionRecord" WHERE agentId = ? AND status = "settled"',
    agentId
  ) as any;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthStr = monthStart.toISOString();

  const monthRow = await queryFirst(
    'SELECT COALESCE(SUM(totalCommission), 0) as total, COUNT(*) as cnt FROM "CommissionRecord" WHERE agentId = ? AND createdAt >= ?',
    agentId, monthStr
  ) as any;

  const totalRow = await queryFirst(
    'SELECT COALESCE(SUM(totalCommission), 0) as total, COUNT(*) as cnt FROM "CommissionRecord" WHERE agentId = ?',
    agentId
  ) as any;

  return {
    pendingCommission: pendingRow?.total || 0,
    pendingCount: pendingRow?.cnt || 0,
    settledCommission: settledRow?.total || 0,
    settledCount: settledRow?.cnt || 0,
    monthCommission: monthRow?.total || 0,
    monthCount: monthRow?.cnt || 0,
    totalCommission: totalRow?.total || 0,
    totalCount: totalRow?.cnt || 0,
  };
}

/** 获取平台分润总统计 */
export async function getPlatformCommissionStats() {
  await ensureCommissionTables();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthStr = monthStart.toISOString();

  const totalRow = await queryFirst(
    'SELECT COALESCE(SUM(totalCommission), 0) as total, COUNT(*) as cnt FROM "CommissionRecord" WHERE status != "clawed_back"'
  ) as any;

  const monthRow = await queryFirst(
    'SELECT COALESCE(SUM(totalCommission), 0) as total, COUNT(*) as cnt FROM "CommissionRecord" WHERE createdAt >= ? AND status != "clawed_back"',
    monthStr
  ) as any;

  const todayRow = await queryFirst(
    'SELECT COALESCE(SUM(totalCommission), 0) as total, COUNT(*) as cnt FROM "CommissionRecord" WHERE createdAt >= ? AND status != "clawed_back"',
    todayStr
  ) as any;

  const pendingRow = await queryFirst(
    'SELECT COALESCE(SUM(totalCommission), 0) as total, COUNT(*) as cnt FROM "CommissionRecord" WHERE status = "pending"'
  ) as any;

  const clawbackRow = await queryFirst(
    'SELECT COALESCE(SUM(clawbackAmount), 0) as total, COUNT(*) as cnt FROM "CommissionRecord" WHERE status = "clawed_back"'
  ) as any;

  return {
    totalCommission: totalRow?.total || 0,
    totalCount: totalRow?.cnt || 0,
    monthCommission: monthRow?.total || 0,
    monthCount: monthRow?.cnt || 0,
    todayCommission: todayRow?.total || 0,
    todayCount: todayRow?.cnt || 0,
    pendingCommission: pendingRow?.total || 0,
    pendingCount: pendingRow?.cnt || 0,
    clawbackAmount: clawbackRow?.total || 0,
    clawbackCount: clawbackRow?.cnt || 0,
  };
}

/** 获取分润记录列表（管理端） */
export async function listCommissionRecords(params: {
  agentId?: string;
  productType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}) {
  await ensureCommissionTables();
  const { agentId, productType, status, startDate, endDate, keyword, page = 1, pageSize = 20 } = params;
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const values: any[] = [];

  if (agentId) { conditions.push('r.agentId = ?'); values.push(agentId); }
  if (productType) { conditions.push('r.productType = ?'); values.push(productType); }
  if (status) { conditions.push('r.status = ?'); values.push(status); }
  if (startDate) { conditions.push('r.createdAt >= ?'); values.push(startDate); }
  if (endDate) { conditions.push('r.createdAt <= ?'); values.push(endDate); }
  if (keyword) { conditions.push('(u.name LIKE ? OR u.email LIKE ? OR r.orderId LIKE ?)'); values.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`); }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const rows = await queryAll(
    `SELECT r.*, u.name as userName, u.email as userEmail, a.brandName as agentBrand
     FROM "CommissionRecord" r
     LEFT JOIN "User" u ON r.userId = u.id
     LEFT JOIN "Agent" a ON r.agentId = a.id
     ${where}
     ORDER BY r.createdAt DESC LIMIT ? OFFSET ?`,
    ...values, pageSize, offset
  ) as any[];

  const countRow = await queryFirst(
    `SELECT COUNT(*) as total FROM "CommissionRecord" r
     LEFT JOIN "User" u ON r.userId = u.id
     LEFT JOIN "Agent" a ON r.agentId = a.id
     ${where}`,
    ...values
  ) as any;

  return { records: rows, total: countRow?.total || 0, page, pageSize };
}

/** 获取代理商结算列表 */
export async function listSettlements(agentId?: string, status?: string, page = 1, pageSize = 20) {
  await ensureCommissionTables();
  const offset = (page - 1) * pageSize;
  const conditions: string[] = [];
  const values: any[] = [];

  if (agentId) { conditions.push('s.agentId = ?'); values.push(agentId); }
  if (status) { conditions.push('s.status = ?'); values.push(status); }
  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const rows = await queryAll(
    `SELECT s.*, a.brandName as agentBrand, a.contactName as agentContact, a.companyName
     FROM "SettlementRecord" s
     LEFT JOIN "Agent" a ON s.agentId = a.id
     ${where}
     ORDER BY s.createdAt DESC LIMIT ? OFFSET ?`,
    ...values, pageSize, offset
  ) as any[];

  const countRow = await queryFirst(
    `SELECT COUNT(*) as total FROM "SettlementRecord" s ${where}`,
    ...values
  ) as any;

  return { settlements: rows, total: countRow?.total || 0, page, pageSize };
}

/** 审批结算单 */
export async function approveSettlement(settlementId: string, action: 'approve' | 'reject', auditorId: string, remark?: string) {
  await ensureCommissionTables();

  const settlement = await queryFirst('SELECT * FROM "SettlementRecord" WHERE id = ?', settlementId) as any;
  if (!settlement) throw new Error('结算单不存在');

  if (settlement.status !== 'pending') throw new Error('结算单已处理');

  const newStatus = action === 'approve' ? 'approved' : 'rejected';
  await execute(
    `UPDATE "SettlementRecord" SET status = ?, auditorId = ?, auditRemark = ?, updatedAt = datetime('now') WHERE id = ?`,
    newStatus, auditorId, remark || null, settlementId
  );

  if (action === 'approve') {
    await execute(
      'UPDATE "Agent" SET pendingCommission = COALESCE(pendingCommission, 0) - ?, totalCommission = COALESCE(totalCommission, 0) - ? WHERE id = ?',
      settlement.netCommission, settlement.commissionAmount, settlement.agentId
    );
  }

  return { success: true, status: newStatus };
}

/** 完成结算打款 */
export async function markSettlementPaid(settlementId: string, paidMethod: string, paidAccount: string) {
  await ensureCommissionTables();

  const settlement = await queryFirst('SELECT * FROM "SettlementRecord" WHERE id = ?', settlementId) as any;
  if (!settlement) throw new Error('结算单不存在');
  if (settlement.status !== 'approved') throw new Error('结算单未批准');

  await execute(
    `UPDATE "SettlementRecord" SET status = 'paid', paidAt = datetime('now'), paidMethod = ?, paidAccount = ?, updatedAt = datetime('now') WHERE id = ?`,
    paidMethod, paidAccount, settlementId
  );

  return { success: true };
}
