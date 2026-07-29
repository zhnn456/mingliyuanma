/**
 * 会员使用限制中间件
 * 统一管理各 API 的调用频率和次数限制
 * 使用 D1 直接操作，避免 Prisma 在 Workers 上的兼容性问题
 */
import { queryFirst, execute } from '@/lib/d1';
import { NextResponse } from 'next/server';
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

export const DEFAULT_LIMITS: Record<string, LimitConfig> = {
  bazi:  { free: 1, monthly: 999, yearly: 999, lifetime: 999, guest: 1, allowGuest: true },
  ziwei: { free: 1, monthly: 999, yearly: 999, lifetime: 999, guest: 1, allowGuest: true },
  qimen: { free: 1, monthly: 999, yearly: 999, lifetime: 999, guest: 1, allowGuest: true },
  meihua:{ free: 3, monthly: 999, yearly: 999, lifetime: 999, guest: 3, allowGuest: true },
};

export async function checkUsageLimit(moduleName: string, customLimits?: LimitConfig, req?: Request) {
  const session = await getSession(req);
  const limits = customLimits || DEFAULT_LIMITS[moduleName];

  if (!limits) {
    return { canUse: true, session };
  }

  if (!session) {
    if (!limits.allowGuest) {
      return {
        canUse: false,
        session: null,
        error: NextResponse.json({ error: '请先登录后使用' }, { status: 401 }),
      };
    }
    return { canUse: true, session: null };
  }

  try {
    const user = await queryFirst(
      'SELECT id, memberLevel, memberExpiry, dailyUsage, lastUsageDate FROM User WHERE id = ?',
      session.user.id
    ) as any;

    if (!user) {
      return { canUse: true, session };
    }

    let effectiveLevel = (user.memberLevel || 'free') as MemberLevelKey;
    if (effectiveLevel !== 'free' && effectiveLevel !== 'lifetime') {
      if (user.memberExpiry && new Date(user.memberExpiry) < new Date()) {
        await execute(
          'UPDATE User SET memberLevel = ?, memberExpiry = NULL, updatedAt = ? WHERE id = ?',
          'free', new Date().toISOString(), user.id
        );
        effectiveLevel = 'free';
      }
    }

    const today = new Date().toISOString().split('T')[0];
    let dailyUsage = user.dailyUsage || 0;

    if (user.lastUsageDate !== today) {
      dailyUsage = 0;
    }

    const limit = (limits as any)[effectiveLevel] ?? limits.free;

    if (dailyUsage >= limit) {
      return {
        canUse: false,
        session,
        error: NextResponse.json(
          { error: `今日免费次数已用完（${limit}次），请升级会员或明日再试` },
          { status: 403 }
        ),
      };
    }

    await execute(
      'UPDATE User SET dailyUsage = ?, lastUsageDate = ?, updatedAt = ? WHERE id = ?',
      dailyUsage + 1, today, new Date().toISOString(), user.id
    );

    return { canUse: true, session };
  } catch {
    return { canUse: true, session };
  }
}
