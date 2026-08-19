/**
 * 全站价格配置中心
 * 所有收费项目的价格都在这里定义，方便统一管理和修改。
 * 修改价格时只需改这一处，全站自动生效。
 */

// ============ 会员等级定义 ============
export const MEMBER_LEVELS = {
  free: '免费用户',
  basic: '基础会员',
  premium: '高级会员',
  lifetime: '终身会员',
} as const;

export type MemberLevel = keyof typeof MEMBER_LEVELS;

// ============ 代理商套餐价格 ============
export const AGENT_PLANS = {
  trial: {
    name: '试用版',
    price: 0,                    // 修改这里调整试用版价格
    durationDays: 7,
    maxCustomers: 10,
    commissionRate: 0.30,
  },
  monthly: {
    name: '月费版',
    price: 99,                   // 修改这里调整月费版价格
    durationDays: 30,
    maxCustomers: 500,
    commissionRate: 0.30,
  },
  yearly: {
    name: '年费版',
    price: 980,                  // 修改这里调整年费版价格
    durationDays: 365,
    maxCustomers: 500,
    commissionRate: 0.30,
  },
  flagship: {
    name: '旗舰版',
    price: 2980,                 // 修改这里调整旗舰版价格
    durationDays: 365,
    maxCustomers: 9999,
    commissionRate: 0.35,
  },
} as const;

// ============ 代理商增值服务 ============
export const AGENT_ADDONS = {
  // 独立域名绑定费用（年费）
  customDomain: {
    name: '独立域名绑定',
    price: 100,                  // 修改这里调整独立域名年费
    durationDays: 365,
  },
  // 源码部署买断费
  sourceCodeLicense: {
    name: '源码部署授权',
    price: 2980,                 // 修改这里调整源码买断费
    durationDays: 36500,
  },
} as const;

// ============ 代理商等级与分润比例 ============
export const AGENT_TIERS = {
  trial: { name: '试用代理', minCustomers: 0, commissionRate: 0.30 },
  formal: { name: '正式代理', minCustomers: 0, commissionRate: 0.30 },
  silver: { name: '银牌代理', minCustomers: 100, commissionRate: 0.32 },
  gold: { name: '金牌代理', minCustomers: 500, commissionRate: 0.35 },
  diamond: { name: '钻石代理', minCustomers: 1000, commissionRate: 0.38 },
} as const;

// ============ 用户积分充值 ============
export const LINGZHU_PLANS = [
  { lingzhu: 100, price: 10, bonus: 0 },     // 修改这里调整充值档位
  { lingzhu: 500, price: 50, bonus: 20 },
  { lingzhu: 1000, price: 100, bonus: 50 },
  { lingzhu: 5000, price: 500, bonus: 200 },
] as const;

// ============ 解读费用 ============
export const INTERPRET_COST = {
  bazi: 50,          // 修改这里调整八字解读积分消耗
  ziwei: 50,          // 紫微斗数
  qimen: 80,         // 奇门遁甲
  meihua: 30,         // 梅花易数
  hepan: 100,        // 合盘
} as const;

// ============ 卡密面额 ============
export const CARD_KEY_DENOMINATIONS = [
  { value: 10, lingzhu: 100, label: '10元卡(100积分)' },
  { value: 50, lingzhu: 500, label: '50元卡(500积分)' },
  { value: 100, lingzhu: 1000, label: '100元卡(1000积分)' },
  { value: 500, lingzhu: 5000, label: '500元卡(5000积分)' },
] as const;

// ============ 汇率 ============
export const LINGZHU_PER_YUAN = 10;  // 1元 = 10积分

// ============ 提现规则 ============
export const WITHDRAWAL_RULES = {
  minAmount: 100,        // 最低提现金额（元）
  maxPerMonth: 3,        // 每月最多提现次数
  feeRate: 0.05,         // 提现手续费率（5%）
  reviewDays: 3,         // 审核时限（工作日）
} as const;

// ============ 获取代理商等级 ============
export function getAgentTier(customerCount: number): typeof AGENT_TIERS[keyof typeof AGENT_TIERS] {
  if (customerCount >= AGENT_TIERS.diamond.minCustomers) return AGENT_TIERS.diamond;
  if (customerCount >= AGENT_TIERS.gold.minCustomers) return AGENT_TIERS.gold;
  if (customerCount >= AGENT_TIERS.silver.minCustomers) return AGENT_TIERS.silver;
  if (customerCount >= AGENT_TIERS.formal.minCustomers) return AGENT_TIERS.formal;
  return AGENT_TIERS.trial;
}

// ============ 根据套餐类型获取配置 ============
export function getAgentPlanConfig(planType: string) {
  return AGENT_PLANS[planType as keyof typeof AGENT_PLANS] || AGENT_PLANS.monthly;
}
