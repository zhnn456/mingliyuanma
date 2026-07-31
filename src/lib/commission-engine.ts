/**
 * 自动分润计算引擎
 * 
 * 分润规则：
 * - 平台分成：60%
 * - 代理商分润：40%
 * 
 * 代理商等级加成：
 * - 基础版：分润比例 30%
 * - 标准版：分润比例 40%
 * - 高级版：分润比例 50%
 */

export interface CommissionResult {
  orderAmount: number;
  platformAmount: number;
  agentAmount: number;
  commissionRate: number;
  agentId: string;
  level: 'basic' | 'standard' | 'premium';
}

const COMMISSION_RATES = {
  basic: 0.30,
  standard: 0.40,
  premium: 0.50,
};

const PLATFORM_RATES = {
  basic: 0.70,
  standard: 0.60,
  premium: 0.50,
};

export function calculateCommission(
  orderAmount: number,
  agentLevel: 'basic' | 'standard' | 'premium' = 'standard'
): CommissionResult {
  const agentRate = COMMISSION_RATES[agentLevel];
  const platformRate = PLATFORM_RATES[agentLevel];

  const agentAmount = Math.round(orderAmount * agentRate * 100) / 100;
  const platformAmount = Math.round(orderAmount * platformRate * 100) / 100;

  return {
    orderAmount,
    platformAmount,
    agentAmount,
    commissionRate: agentRate,
    agentId: '',
    level: agentLevel,
  };
}

export function getCommissionRate(level: string): number {
  return COMMISSION_RATES[level as keyof typeof COMMISSION_RATES] || 0.30;
}

export function getPlatformRate(level: string): number {
  return PLATFORM_RATES[level as keyof typeof PLATFORM_RATES] || 0.70;
}

export function getLevelFromFeatures(features: string[]): 'basic' | 'standard' | 'premium' {
  if (features.includes('data-export') && features.includes('marketing')) {
    return 'premium';
  }
  if (features.includes('marketing')) {
    return 'standard';
  }
  return 'basic';
}

export interface SettlementPeriod {
  period: string;
  startDate: Date;
  endDate: Date;
}

export function getSettlementPeriod(monthOffset: number = 0): SettlementPeriod {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + monthOffset;

  const periodMonth = month < 1 ? 12 : month;
  const periodYear = month < 1 ? year - 1 : year;

  const startDate = new Date(periodYear, periodMonth - 1, 1);
  const endDate = new Date(periodYear, periodMonth, 0, 23, 59, 59);

  return {
    period: `${periodYear}-${String(periodMonth).padStart(2, '0')}`,
    startDate,
    endDate,
  };
}

export function formatPeriod(period: string): string {
  const [year, month] = period.split('-');
  return `${year}年${parseInt(month)}月`;
}
