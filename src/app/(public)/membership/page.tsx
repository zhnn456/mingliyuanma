'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-client';
import Link from 'next/link';

const plans = [
  {
    name: '免费用户',
    level: 'free',
    price: 0,
    period: '',
    number: '01',
    badge: 'FREE',
    tag: '免费体验',
    desc: '适合初次体验命理排盘的用户',
    icon: '⚪',
    color: 'gray',
    highlight: false,
    featureGroups: [
      {
        title: '基础功能',
        items: ['每日1次基础排盘', '基础八字排盘', '五行分析', '大运排列'],
      },
    ],
  },
  {
    name: '月卡会员',
    level: 'monthly',
    price: 29.9,
    period: '/月',
    number: '02',
    badge: 'PLUS',
    tag: '灵活订阅',
    desc: '适合短期高频使用命理服务的用户',
    icon: '◐',
    color: 'blue',
    highlight: false,
    featureGroups: [
      {
        title: '排盘与解读',
        items: ['无限次排盘', '基础命理解读', '四大命理模块'],
      },
      {
        title: '增值服务',
        items: ['历史记录保存', '优先客服支持'],
      },
    ],
  },
  {
    name: '年卡会员',
    level: 'yearly',
    price: 199,
    period: '/年',
    number: '03',
    badge: 'PRO',
    tag: '超值推荐',
    desc: '适合长期需要命理分析服务的用户',
    icon: '★',
    color: 'red',
    highlight: true,
    featureGroups: [
      {
        title: '排盘与解读',
        items: ['无限次排盘', '详细命理解读', '四大命理模块'],
      },
      {
        title: '增值服务',
        items: ['历史记录保存', '导出PDF报告', '专属运势分析', '优先新功能体验'],
      },
    ],
  },
  {
    name: '终身会员',
    level: 'lifetime',
    price: 599,
    period: '/永久',
    number: '04',
    badge: 'ULTRA',
    tag: '尊贵终身',
    desc: '适合命理爱好者与专业从业者',
    icon: '◈',
    color: 'gold',
    highlight: false,
    featureGroups: [
      {
        title: '全部权益',
        items: ['所有年卡权益', '终身免费更新', '一对一咨询', '专属命理课程'],
      },
      {
        title: '尊享特权',
        items: ['优先新功能体验', '线下活动资格'],
      },
    ],
  },
];

export default function MembershipPage() {
  const { user: session } = useAuth();
  const router = useRouter();
  const [buying, setBuying] = useState<string | null>(null);
  const [buyError, setBuyError] = useState('');

  const handleBuy = async (level: string) => {
    setBuying(level);
    setBuyError('');

    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'membership',
          targetId: level,
          method: 'mock',
        }),
      });

      const data = await res.json();
      if (res.ok && data.order?.orderNo) {
        router.push(`/pay/${data.order.orderNo}`);
      } else {
        setBuyError(data.error || '下单失败');
        setBuying(null);
      }
    } catch {
      setBuyError('网络错误，请重试');
      setBuying(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment-50 via-paper to-white py-12">
      <div className="absolute inset-0 bg-mesh-gradient opacity-30 pointer-events-none" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* 页面标题 */}
        <div className="page-header">
          <div className="section-label justify-center">MEMBERSHIP</div>
          <h1 className="page-header-title">
            <span>会员中心</span>
          </h1>
          <p className="page-header-subtitle">选择合适的套餐，解锁全部命理功能</p>
        </div>

        {/* 错误提示 */}
        {buyError && (
          <div className="max-w-md mx-auto mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm text-center">
            {buyError}
          </div>
        )}

        {/* 套餐列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.level}
              className={`card relative flex flex-col p-6 ${plan.highlight ? 'ring-2 ring-red-600 shadow-xl' : ''} ${
                plan.highlight ? 'bg-gradient-to-b from-red-50/50 to-white' : ''
              }`}
            >
              {/* 序号与标签 */}
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-bold tracking-widest ${
                  plan.color === 'gold' ? 'text-gold' :
                  plan.color === 'red' ? 'text-red-700' :
                  plan.color === 'blue' ? 'text-blue-600' :
                  'text-gray-400'
                }`}>
                  {plan.number} / {plan.badge}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  plan.color === 'gold' ? 'bg-gold/10 text-gold' :
                  plan.color === 'red' ? 'bg-red-50 text-red-700' :
                  plan.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {plan.tag}
                </span>
              </div>

              {/* 推荐标记 */}
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-700 to-red-900 text-white text-xs px-4 py-1 rounded-full shadow-md font-medium">
                  ★ 推荐
                </div>
              )}

              {/* 图标与名称 */}
              <div className="text-center mb-4">
                <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-2xl mb-3 ${
                  plan.color === 'gold' ? 'bg-gold/10 text-gold' :
                  plan.color === 'red' ? 'bg-red-50 text-red-700' :
                  plan.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {plan.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 font-kai">{plan.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{plan.desc}</p>
              </div>

              {/* 价格 */}
              <div className="text-center mb-5">
                <div className="flex items-baseline justify-center gap-1">
                  <span className={`text-4xl font-bold ${plan.highlight ? 'chinese-red' : 'text-gray-900'}`}>
                    {plan.price === 0 ? '免费' : `¥${plan.price}`}
                  </span>
                  {plan.period && <span className="text-gray-500 text-sm">{plan.period}</span>}
                </div>
              </div>

              <div className="divider-gold mb-4" />

              {/* 功能分组列表 */}
              <div className="flex-1 mb-6">
                {plan.featureGroups.map((group, gi) => (
                  <div key={gi} className={gi > 0 ? 'mt-4' : ''}>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{group.title}</h4>
                    <ul className="space-y-2">
                      {group.items.map((feature, i) => (
                        <li key={i} className="flex items-start text-sm text-gray-600">
                          <svg className={`w-4 h-4 mr-2 flex-shrink-0 mt-0.5 ${plan.highlight ? 'text-red-600' : 'text-green-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* 操作按钮 */}
              {plan.price > 0 ? (
                session ? (
                  <button
                    onClick={() => handleBuy(plan.level)}
                    disabled={buying === plan.level}
                    className={`w-full btn-primary text-sm disabled:opacity-50 ${
                      plan.highlight ? '' : '!bg-transparent !text-red-700 !border-red-700 hover:!bg-red-700 hover:!text-white'
                    }`}
                  >
                    {buying === plan.level ? '订单创建中...' : '立即开通'}
                  </button>
                ) : (
                  <Link href="/login" className={`w-full text-sm text-center block ${
                    plan.highlight ? 'btn-primary' : 'btn-outline'
                  }`}>
                    登录后开通
                  </Link>
                )
              ) : (
                <Link href="/bazi" className="w-full btn-outline text-center block">
                  免费使用
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* 底部说明 */}
        <div className="text-center mt-12 p-6 card">
          <p className="text-sm text-gray-500">
            所有套餐支持微信/支付宝支付 · 会员权益即时生效 · 如有疑问请联系客服
          </p>
        </div>
      </div>
    </div>
  );
}
