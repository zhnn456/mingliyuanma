import { queryFirst, execute } from './d1';

/**
 * 分润引擎 - 用户消费时自动计算分润给代理商
 */

// 分润计算并记录
export async function processCommission(orderId: string, userId: string, orderAmount: number): Promise<{ processed: boolean; agentId?: string; commissionAmount?: number }> {
  // 1. 查询用户的 agentId
  const user = await queryFirst('SELECT agentId FROM User WHERE id = ?', userId) as any;
  if (!user || !user.agentId) return { processed: false };

  // 2. 查询代理商的分润比例和状态（含代理类型）
  const agent = await queryFirst('SELECT id, commissionRate, isActive, planExpiry, level FROM Agent WHERE id = ?', user.agentId) as any;
  if (!agent || !agent.isActive) return { processed: false };

  // 2.1 源码部署代理不触发分润（100% 收入归代理商自己）
  if (agent.level === 'source') return { processed: false };

  // 3. 检查授权是否过期
  if (agent.planExpiry && new Date(agent.planExpiry) < new Date()) return { processed: false };

  // 4. 计算分润
  const commissionRate = agent.commissionRate || 0.3;
  const commissionAmount = Math.round(orderAmount * commissionRate * 100) / 100;

  // 5. 更新订单分润信息
  await execute('UPDATE "Order" SET agentId = ?, commissionRate = ?, commissionAmount = ? WHERE id = ?',
    user.agentId, commissionRate, commissionAmount, orderId);

  // 6. 更新代理商余额和统计
  await execute('UPDATE Agent SET totalCommission = totalCommission + ?, pendingCommission = pendingCommission + ?, currentMonthGMV = currentMonthGMV + ? WHERE id = ?',
    commissionAmount, commissionAmount, orderAmount, user.agentId);

  // 7. 创建分润记录
  const recordId = `com_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  // 查询订单类型作为 productType
  const orderInfo = await queryFirst('SELECT type FROM "Order" WHERE id = ?', orderId) as any;
  const productType = orderInfo?.type || 'recharge';
  await execute(
    `INSERT INTO CommissionRecord (id, agentId, orderId, userId, productType, orderAmount, baseAmount, commissionRate, commissionAmount, totalCommission, status, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    recordId, user.agentId, orderId, userId, productType, orderAmount, orderAmount, commissionRate, commissionAmount, commissionAmount, 'pending', now
  );

  return { processed: true, agentId: user.agentId, commissionAmount };
}

// 获取代理商分润统计
export async function getAgentCommissionStats(agentId: string) {
  const stats = await queryFirst(
    'SELECT totalCommission, pendingCommission, currentMonthGMV, balance FROM Agent WHERE id = ?',
    agentId
  ) as any;
  return stats || { totalCommission: 0, pendingCommission: 0, currentMonthGMV: 0, balance: 0 };
}

// 获取分润记录列表
export async function listCommissionRecords(agentId: string, page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize;
  const records = await queryFirst(
    `SELECT * FROM CommissionRecord WHERE agentId = ? ORDER BY createdAt DESC LIMIT ${Number(pageSize)} OFFSET ${Number(offset)}`,
    agentId
  ) as any;
  return records || [];
}

// 获取结算周期
export function getSettlementPeriod(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// 格式化周期显示
export function formatPeriod(period: string): string {
  if (!period) return '';
  const [year, month] = period.split('-');
  if (!year || !month) return period;
  return `${year}年${parseInt(month)}月`;
}

// 根据功能列表获取代理等级
export function getLevelFromFeatures(features: string[]): string {
  if (!features || !Array.isArray(features)) return 'basic';
  if (features.includes('bazi') && features.includes('fortune') && features.includes('fengshui')) {
    return 'premium';
  }
  if (features.includes('bazi') && features.includes('fortune')) {
    return 'standard';
  }
  return 'basic';
}

// 计算分润金额
export function calculateCommission(amount: number, level: string = 'standard') {
  const rates: Record<string, number> = {
    basic: 0.2,
    standard: 0.3,
    premium: 0.4,
  };
  const commissionRate = rates[level] || 0.3;
  const agentAmount = Math.round(amount * commissionRate * 100) / 100;
  const platformAmount = Math.round((amount - agentAmount) * 100) / 100;
  return {
    commissionRate,
    agentAmount,
    platformAmount,
    agentId: '',
  };
}
