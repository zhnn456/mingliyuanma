'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

const plans = [
  {
    name: '免费用户',
    level: 'free',
    price: 0,
    period: '',
    features: ['每日1次基础排盘', '基础八字排盘', '五行分析', '大运排列'],
    highlight: false,
  },
  {
    name: '月卡会员',
    level: 'monthly',
    price: 29.9,
    period: '/月',
    features: ['无限次排盘', '基础命理解读', '四大命理模块', '历史记录保存', '优先客服支持'],
    highlight: false,
  },
  {
    name: '年卡会员',
    level: 'yearly',
    price: 199,
    period: '/年',
    features: ['无限次排盘', '详细命理解读', '四大命理模块', '历史记录保存', '导出PDF报告', '专属运势分析', '优先新功能体验'],
    highlight: true,
  },
  {
    name: '终身会员',
    level: 'lifetime',
    price: 599,
    period: '/永久',
    features: ['所有年卡权益', '终身免费更新', '一对一咨询', '专属命理课程', '优先新功能体验', '线下活动资格'],
    highlight: false,
  },
];

export default function MembershipPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">会员中心</h1>
          <p className="text-gray-600">选择合适的套餐，解锁全部命理功能</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.level}
              className={`card relative ${plan.highlight ? 'ring-2 ring-red-600 shadow-xl' : ''}`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs px-3 py-1 rounded-full">
                  推荐
                </div>
              )}
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold chinese-red">
                    {plan.price === 0 ? '免费' : `¥${plan.price}`}
                  </span>
                  {plan.period && <span className="text-gray-500 text-sm">{plan.period}</span>}
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              {plan.price > 0 ? (
                session ? (
                  <button className="w-full btn-primary py-2">
                    立即开通
                  </button>
                ) : (
                  <Link href="/login" className="w-full btn-primary py-2 text-center block">
                    登录后开通
                  </Link>
                )
              ) : (
                <Link href="/bazi" className="w-full btn-outline py-2 text-center block">
                  免费使用
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
