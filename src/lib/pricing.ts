/**
 * 全站价格配置中心
 * 所有收费项目的价格都在这里定义，方便统一管理和修改。
 * 修改价格时只需改这一处，全站自动生效。
 */

// ============ 代理商套餐价格 ============
export const AGENT_PLANS = {
  trial: {
    name: '试用版',
    price: 0,                    // 修改这里调整试用版价格
    durationDays: 7,
    maxCustomers: 10,
  },
  monthly: {
    name: '月费版',
    price: 99,                   // 修改这里调整月费版价格
    durationDays: 30,
    maxCustomers: 500,
  },
  yearly: {
    name: '年费版',
    price: 980,                  // 修改这里调整年费版价格
    durationDays: 365,
    maxCustomers: 500,
  },
  lifetime: {
    name: '终身版',
    price: 2980,                 // 修改这里调整终身版价格
    durationDays: 36500,
    maxCustomers: 9999,
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

// ============ 用户灵珠充值 ============
export const LINGZHU_PLANS = [
  { lingzhu: 100, price: 10, bonus: 0 },     // 修改这里调整充值档位
  { lingzhu: 500, price: 50, bonus: 20 },
  { lingzhu: 1000, price: 100, bonus: 50 },
  { lingzhu: 5000, price: 500, bonus: 200 },
] as const;

// ============ 解读费用 ============
export const INTERPRET_COST = {
  bazi: 50,          // 修改这里调整八字解读灵珠消耗
  ziwei: 50,          // 紫微斗数
  qimen: 80,         // 奇门遁甲
  meihua: 30,         // 梅花易数
  hepan: 100,        // 合盘
} as const;

// ============ 卡密面额 ============
export const CARD_KEY_DENOMINATIONS = [
  { value: 10, lingzhu: 100, label: '10元卡(100灵珠)' },
  { value: 50, lingzhu: 500, label: '50元卡(500灵珠)' },
  { value: 100, lingzhu: 1000, label: '100元卡(1000灵珠)' },
  { value: 500, lingzhu: 5000, label: '500元卡(5000灵珠)' },
] as const;

// ============ 汇率 ============
export const LINGZHU_PER_YUAN = 10;  // 1元 = 10灵珠
