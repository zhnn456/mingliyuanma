/**
 * 会员使用限制中间件
 * 统一管理各 API 的调用频率和次数限制
 * 使用 D1 直接操作，避免 Prisma 在 Workers 上的兼容性问题
 *
 * 核心策略：
 * - 排盘（chart）：免费不限次
 * - 解读（interpretation）：免费用户每日限免，超出后灵珠付费，会员无限
 */
import { queryFirst, execute } from '@/lib/d1';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';

export interface LimitConfig {
  free: number;
  monthly: number;
  yearly: number;
  lifetime: number;
  guest: number;
  allowGuest?: boolean;
}

export type MemberLevelKey = 'free' | 'monthly' | 'yearly' | 'lifetime';

/**
 * 解读次数限制（排盘不限制，只有解读才限制）
 */
export const INTERPRET_LIMITS: Record<string, LimitConfig> = {
  bazi:  { free: 1, monthly: 999, yearly: 999, lifetime: 999, guest: 0, allowGuest: false },
  ziwei: { free: 1, monthly: 999, yearly: 999, lifetime: 999, guest: 0, allowGuest: false },
  qimen: { free: 1, monthly: 999, yearly: 999, lifetime: 999, guest: 0, allowGuest: false },
  meihua:{ free: 3, monthly: 999, yearly: 999, lifetime: 999, guest: 0, allowGuest: false },
};

/**
 * 灵珠收费标准（每次解读消耗的灵珠数）
 */
export const INTERPRET_COST_LINGZHU = 50;

/**
 * 会员开通赠送灵珠
 */
export const MEMBERSHIP_GIFT_LINGZHU: Record<string, number> = {
  monthly: 300,
  yearly: 2000,
  lifetime: 6000,
};

/**
 * 获取用户有效会员等级
 */
async function getEffectiveMemberLevel(userId: string): Promise<{ level: MemberLevelKey; user: any }> {
  const user = await queryFirst(
    'SELECT id, memberLevel, memberExpiry, dailyUsage, lastUsageDate FROM User WHERE id = ?',
    userId
  ) as any;

  if (!user) return { level: 'free', user: null };

  let level = (user.memberLevel || 'free') as MemberLevelKey;
  if (level !== 'free' && level !== 'lifetime') {
    if (user.memberExpiry && new Date(user.memberExpiry) < new Date()) {
      await execute(
        'UPDATE User SET memberLevel = ?, memberExpiry = NULL, updatedAt = ? WHERE id = ?',
        'free', new Date().toISOString(), user.id
      );
      level = 'free';
    }
  }
  return { level, user };
}

/**
 * 检查解读次数限制
 * 返回 canInterpret = true 表示可以免费解读
 * 返回 canInterpret = false, needLingzhu = true 表示需要扣灵珠
 */
export async function checkInterpretLimit(moduleName: string, req?: NextRequest) {
  const session = req ? await getSession(req) : null;
  const limits = INTERPRET_LIMITS[moduleName];

  if (!limits) {
    return { canInterpret: true, session, needLingzhu: false };
  }

  if (!session) {
    if (!limits.allowGuest) {
      return {
        canInterpret: false,
        session: null,
        needLingzhu: false,
        error: NextResponse.json({ error: '请先登录后使用' }, { status: 401 }),
      };
    }
    // 游客允许有限次数
    return { canInterpret: true, session: null, needLingzhu: false };
  }

  try {
    const { level, user } = await getEffectiveMemberLevel(session.sub);
    if (!user) return { canInterpret: true, session, needLingzhu: false };

    // 会员无限解读
    if (level !== 'free') {
      return { canInterpret: true, session, needLingzhu: false, memberLevel: level };
    }

    // 免费用户检查每日次数
    const today = new Date().toISOString().split('T')[0];
    let dailyUsage = user.dailyUsage || 0;
    if (user.lastUsageDate !== today) {
      dailyUsage = 0;
    }

    const limit = (limits as any)[level] ?? limits.free;

    if (dailyUsage < limit) {
      // 还有免费次数
      await execute(
        'UPDATE User SET dailyUsage = ?, lastUsageDate = ?, updatedAt = ? WHERE id = ?',
        dailyUsage + 1, today, new Date().toISOString(), user.id
      );
      return { canInterpret: true, session, needLingzhu: false, remainingFree: limit - dailyUsage - 1 };
    }

    // 免费次数用完，需要灵珠
    return { canInterpret: false, session, needLingzhu: true, cost: INTERPRET_COST_LINGZHU };
  } catch {
    return { canInterpret: true, session, needLingzhu: false };
  }
}

/**
 * 扣除灵珠（用于解读付费）
 */
export async function deductLingzhu(userId: string, amount: number, reason: string): Promise<{ success: boolean; balance: number }> {
  const now = new Date().toISOString();

  const result = await execute(
    'UPDATE UserPoints SET balance = balance - ?, updatedAt = ? WHERE userId = ? AND balance >= ?',
    amount, now, userId, amount
  );

  if (result.changes === 0) {
    const row = await queryFirst('SELECT balance FROM UserPoints WHERE userId = ?', userId) as any;
    return { success: false, balance: row?.balance || 0 };
  }

  const row = await queryFirst('SELECT balance FROM UserPoints WHERE userId = ?', userId) as any;
  const newBalance = row?.balance || 0;

  await execute(
    'INSERT INTO PointsLedger (id, userId, amount, balance, type, remark, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    `pts_${Date.now()}`, userId, -amount, newBalance, 'interpret', reason, now
  );

  return { success: true, balance: newBalance };
}

/**
 * 赠送灵珠（会员开通时）
 */
export async function grantLingzhu(userId: string, amount: number, reason: string): Promise<void> {
  const now = new Date().toISOString();

  // 检查是否已有 UserPoints 记录
  const existing = await queryFirst('SELECT userId FROM UserPoints WHERE userId = ?', userId);
  if (existing) {
    await execute(
      'UPDATE UserPoints SET balance = balance + ?, updatedAt = ? WHERE userId = ?',
      amount, now, userId
    );
  } else {
    await execute(
      'INSERT INTO UserPoints (userId, balance, updatedAt) VALUES (?, ?, ?)',
      userId, amount, now
    );
  }

  const row = await queryFirst('SELECT balance FROM UserPoints WHERE userId = ?', userId) as any;
  const newBalance = row?.balance || 0;

  await execute(
    'INSERT INTO PointsLedger (id, userId, amount, balance, type, remark, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    `pts_${Date.now()}`, userId, amount, newBalance, 'reward', reason, now
  );
}

/**
 * @deprecated 使用 checkInterpretLimit 代替
 */
export async function checkUsageLimit(moduleName: string, _customLimits?: LimitConfig, req?: NextRequest) {
  const session = req ? await getSession(req) : null;

  if (!session) {
    return { canUse: true, session: null };
  }

  return { canUse: true, session };
}
