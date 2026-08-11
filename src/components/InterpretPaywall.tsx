'use client';

import { useState } from 'react';
import Link from 'next/link';

interface PaywallProps {
  /** 401=未登录 402=需要付费 */
  status: 401 | 402;
  /** 需要的积分数 */
  cost?: number;
  /** 当前积分余额 */
  balance?: number;
  /** 模块名称 */
  moduleLabel: string;
  /** 确认消耗积分 */
  onConfirmPay?: () => void;
  /** 关闭弹窗 */
  onClose?: () => void;
}

export function InterpretPaywall({
  status,
  cost = 50,
  balance = 0,
  moduleLabel,
  onConfirmPay,
  onClose,
}: PaywallProps) {
  const [paying, setPaying] = useState(false);

  const handlePay = () => {
    if (!onConfirmPay) return;
    setPaying(true);
    onConfirmPay();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部渐变 */}
        <div className="bg-gradient-to-r from-amber-500 via-red-600 to-amber-500 px-6 py-8 text-center text-white">
          <div className="text-4xl mb-3">{status === 401 ? '🔐' : '💎'}</div>
          <h2 className="text-xl font-bold">
            {status === 401 ? '登录后查看解读' : `${moduleLabel}深度解读`}
          </h2>
          <p className="text-sm text-white/80 mt-1">
            {status === 401 ? '排盘免费，解读需登录' : '解锁命盘深度分析'}
          </p>
        </div>

        {/* 内容 */}
        <div className="px-6 py-5">
          {status === 401 ? (
            /* 未登录 */
            <div className="space-y-4">
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <p className="text-sm text-gray-700 leading-relaxed">
                  排盘结果已为您展示完毕，如需查看<span className="font-bold text-red-600">{moduleLabel}详细解读</span>，
                  请先<span className="font-bold">登录</span>或<span className="font-bold">注册</span>。
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  新用户注册即送100积分，可免费解读2次
                </p>
              </div>
              <Link href="/login" className="block w-full text-center py-3 bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold rounded-xl hover:opacity-90 transition">
                登录 / 注册
              </Link>
              <button onClick={onClose} className="w-full text-center py-2 text-gray-500 text-sm hover:text-gray-700">
                暂时不看
              </button>
            </div>
          ) : (
            /* 需要付费 */
            <div className="space-y-4">
              {/* 剩余免费次数提示 */}
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                <p className="text-sm text-blue-700">
                  今日免费解读次数已用完
                </p>
              </div>

              {/* 积分支付选项 */}
              <div className="border-2 border-red-500 rounded-xl p-4 bg-red-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-gray-900">积分解锁</span>
                  <span className="text-2xl">💎 {cost}</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  当前余额：<span className={balance >= cost ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>{balance}</span> 积分
                </p>
                <button
                  onClick={handlePay}
                  disabled={paying || balance < cost}
                  className="w-full py-2.5 bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {paying ? '支付中...' : balance >= cost ? `消耗 ${cost} 积分解锁` : '积分不足，去充值'}
                </button>
                {balance < cost && (
                  <Link href="/profile/recharge" className="block text-center text-xs text-red-600 mt-2 hover:underline">
                    点击充值积分 →
                  </Link>
                )}
              </div>

              {/* 分割线 */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">或者</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* 会员选项 */}
              <div className="border-2 border-amber-400 rounded-xl p-4 bg-gradient-to-br from-amber-50 to-yellow-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-gray-900">开通会员</span>
                  <span className="text-lg">👑</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  会员无限次免费解读，每月还送300积分
                </p>
                <Link href="/membership" className="block w-full text-center py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold rounded-lg hover:opacity-90 transition">
                  查看会员套餐
                </Link>
              </div>

              <button onClick={onClose} className="w-full text-center py-2 text-gray-500 text-sm hover:text-gray-700">
                暂时不看
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
