'use client';

import { useAuth } from '@/lib/auth-client';
import Link from 'next/link';
import type { ReactNode } from 'react';

interface FeatureGateProps {
  /** 功能名称 */
  feature: string;
  /** 所需会员等级: 'free' | 'monthly' | 'yearly' | 'lifetime' */
  requiredLevel: 'free' | 'monthly' | 'yearly' | 'lifetime';
  /** 子内容 */
  children: ReactNode;
  /** 未解锁时的替代显示 */
  fallback?: ReactNode;
}

const LEVEL_NAMES: Record<string, string> = {
  free: '免费用户',
  monthly: '月卡会员',
  yearly: '年卡会员',
  lifetime: '终身会员',
};

const LEVEL_ORDER: Record<string, number> = {
  free: 0,
  monthly: 1,
  yearly: 2,
  lifetime: 3,
};

export function MemberBadge({ level }: { level: string }) {
  if (level === 'free') {
    return <span className="member-badge member-badge-free">🆓 免费</span>;
  }
  if (level === 'monthly' || level === 'yearly') {
    return <span className="member-badge member-badge-pro">👑 会员</span>;
  }
  return <span className="member-badge member-badge-vip">👑 终身</span>;
}

export function FeatureGate({ feature, requiredLevel, children, fallback }: FeatureGateProps) {
  const { user: session } = useAuth();
  
  const userLevel = session?.memberLevel || 'free';
  const canAccess = LEVEL_ORDER[userLevel] >= LEVEL_ORDER[requiredLevel];

  if (canAccess) {
    return <>{children}</>;
  }

  // 如果有自定义 fallback，使用
  if (fallback) {
    return <>{fallback}</>;
  }

  // 默认锁定状态
  return (
    <div className="relative group">
      {/* 模糊遮罩 */}
      <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-xl">
        <div className="text-center p-6">
          <div className="text-3xl mb-2">🔒</div>
          <p className="text-sm font-medium text-gray-700 mb-1">{feature} · 会员专属</p>
          <p className="text-xs text-gray-500 mb-3">
            升级为{LEVEL_NAMES[requiredLevel]}后解锁此功能
          </p>
          <Link
            href="/membership"
            className="inline-block btn-secondary text-sm !py-1.5 !px-4"
          >
            查看会员方案
          </Link>
        </div>
      </div>
      {/* 灰化的原内容 */}
      <div className="opacity-30 pointer-events-none select-none">
        {children}
      </div>
    </div>
  );
}

/** 会员专属标记 - 用于功能标题旁 */
export function ProBadge({ requiredLevel = 'monthly' }: { requiredLevel?: string }) {
  return (
    <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded ${
      requiredLevel === 'monthly' ? 'bg-gold-100 text-gold-700 border border-gold-300' : 'bg-red-100 text-red-700 border border-red-300'
    }`}>
      👑 {LEVEL_NAMES[requiredLevel]}
    </span>
  );
}

/** 免费标签 */
export function FreeBadge() {
  return <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 border border-green-300">🆓 免费</span>;
}
