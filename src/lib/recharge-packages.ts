/**
 * 充值套餐定义 — 单一数据源
 * 供 recharge/route.ts、payment/create、mock-confirm、callback 共享
 * 修改套餐只需改这一处
 */

export interface RechargePackage {
  id: string;
  price: number;     // 售价（元）
  points: number;    // 基础积分
  bonus: number;     // 赠送积分
  popular?: boolean;
}

export const RECHARGE_PACKAGES: RechargePackage[] = [
  { id: 'pkg_10', price: 10, points: 100, bonus: 0 },
  { id: 'pkg_50', price: 50, points: 500, bonus: 20 },
  { id: 'pkg_100', price: 100, points: 1000, bonus: 50, popular: true },
  { id: 'pkg_500', price: 500, points: 5000, bonus: 200 },
];

/** packageId → 实际到账积分（基础+赠送） */
export const PACKAGE_POINTS: Record<string, number> = Object.fromEntries(
  RECHARGE_PACKAGES.map(p => [p.id, p.points + p.bonus])
);

/** 根据 packageId 查找套餐 */
export function findRechargePackage(id: string | undefined | null): RechargePackage | undefined {
  if (!id) return undefined;
  return RECHARGE_PACKAGES.find(p => p.id === id);
}
