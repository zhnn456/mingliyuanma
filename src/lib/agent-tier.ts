/**
 * 代理商等级自动升级
 * 每月1号自动统计客户数，达标自动升级
 */

import { queryFirst, queryAll, execute } from '@/lib/d1';
import { AGENT_TIERS } from '@/lib/pricing';

/**
 * 获取代理商当前等级
 */
export function getAgentTier(customerCount: number) {
  if (customerCount >= AGENT_TIERS.diamond.minCustomers) return AGENT_TIERS.diamond;
  if (customerCount >= AGENT_TIERS.gold.minCustomers) return AGENT_TIERS.gold;
  if (customerCount >= AGENT_TIERS.silver.minCustomers) return AGENT_TIERS.silver;
  if (customerCount >= AGENT_TIERS.formal.minCustomers) return AGENT_TIERS.formal;
  return AGENT_TIERS.trial;
}

/**
 * 升级代理商等级
 */
export async function upgradeAgentTier(agentId: string): Promise<{ success: boolean; newTier: string; oldRate: number; newRate: number }> {
  const agent = await queryFirst('SELECT commissionRate, level FROM Agent WHERE id = ?', agentId);
  if (!agent) {
    return { success: false, newTier: '', oldRate: 0, newRate: 0 };
  }

  // 只处理SaaS代理
  if (agent.level !== 'saas') {
    return { success: false, newTier: '', oldRate: agent.commissionRate || 0, newRate: 0 };
  }

  // 统计客户数
  const customerCount = await queryFirst(
    'SELECT COUNT(*) as cnt FROM User WHERE agentId = ?',
    agentId
  );

  const tier = getAgentTier(customerCount?.cnt || 0);

  // 如果等级没有变化，不需要升级
  if (Math.abs((agent.commissionRate || 0) - tier.commissionRate) < 0.001) {
    return { success: false, newTier: tier.name, oldRate: agent.commissionRate || 0, newRate: tier.commissionRate };
  }

  // 升级
  await execute(
    'UPDATE Agent SET commissionRate = ? WHERE id = ?',
    tier.commissionRate, agentId
  );

  return { success: true, newTier: tier.name, oldRate: agent.commissionRate || 0, newRate: tier.commissionRate };
}

/**
 * 升级所有SaaS代理商等级
 */
export async function upgradeAllAgentTiers(): Promise<{ total: number; upgraded: number }> {
  const agents = await queryAll(
    'SELECT id FROM Agent WHERE level = ? AND isActive = ?',
    'saas', 1
  );

  let upgraded = 0;
  for (const agent of agents) {
    const result = await upgradeAgentTier(agent.id);
    if (result.success) {
      upgraded++;
      console.log(`[AgentTier] 代理商 ${agent.id} 升级到 ${result.newTier}，分润比例 ${result.oldRate} -> ${result.newRate}`);
    }
  }

  return { total: agents.length, upgraded };
}

/**
 * 定时任务：每月1号执行
 */
export async function monthlyAgentTierUpgrade() {
  const now = new Date();
  // 只在每月1号执行
  if (now.getDate() !== 1) {
    return { skipped: true, reason: '不是每月1号' };
  }

  const result = await upgradeAllAgentTiers();
  return result;
}
