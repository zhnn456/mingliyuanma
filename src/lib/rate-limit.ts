/**
 * 会员使用限制中间件
 * 统一管理各 API 的调用频率和次数限制
 */
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { NextResponse } from 'next/server';

export interface LimitConfig {
  /** 每日免费限制次数 */
  free: number;
  /** 月卡每日限制次数 */
  monthly: number;
  /** 年卡每日限制次数 */
  yearly: number;
  /** 终身每日限制次数 */
  lifetime: number;
  /** 游客每日限制次数（未登录） */
  guest: number;
  /** 是否允许游客使用 */
  allowGuest?: boolean;
}

export type MemberLevelKey = 'free' | 'monthly' | 'yearly' | 'lifetime';

// 各模块默认限制配置
export const DEFAULT_LIMITS: Record<string, LimitConfig> = {
  bazi:  { free: 1, monthly: 999, yearly: 999, lifetime: 999, guest: 1, allowGuest: true },
  ziwei: { free: 1, monthly: 999, yearly: 999, lifetime: 999, guest: 1, allowGuest: true },
  qimen: { free: 1, monthly: 999, yearly: 999, lifetime: 999, guest: 1, allowGuest: true },
  meihua:{ free: 3, monthly: 999, yearly: 999, lifetime: 999, guest: 3, allowGuest: true },
};

/**
 * 检查用户是否可以使用指定模块
 * @returns { canUse: boolean; session: any; error?: NextResponse }
 */
export async function checkUsageLimit(moduleName: string, customLimits?: LimitConfig) {
  const session = await getServerSession(authOptions);
  const limits = customLimits || DEFAULT_LIMITS[moduleName];

  if (!limits) {
    return { canUse: true, session };
  }

  // 游客处理
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
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
    });

    if (!user) {
      return { canUse: true, session };
    }

    // 检查会员是否过期 — 过期自动降级为 free
    let effectiveLevel = user.memberLevel as MemberLevelKey;
    if (effectiveLevel !== 'free' && effectiveLevel !== 'lifetime') {
      if (user.memberExpiry && new Date(user.memberExpiry) < new Date()) {
        // 会员已过期，自动降级并更新数据库
        await prisma.user.update({
          where: { id: user.id },
          data: { memberLevel: 'free', memberExpiry: null },
        });
        effectiveLevel = 'free';
      }
    }

    const today = new Date().toISOString().split('T')[0];
    let dailyUsage = user.dailyUsage;

    // 如果不是今天，重置计数
    if (user.lastUsageDate !== today) {
      dailyUsage = 0;
    }

    const limit = limits[effectiveLevel] ?? limits.free;

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

    // 增加使用次数
    await prisma.user.update({
      where: { id: user.id },
      data: {
        dailyUsage: dailyUsage + 1,
        lastUsageDate: today,
      },
    });

    return { canUse: true, session };
  } catch {
    // 出错时允许使用（降级处理）
    return { canUse: true, session };
  }
}
