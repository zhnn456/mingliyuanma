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
        title: '排盘功能',
        items: ['每日1次基础排盘', '基础八字排盘', '五行属性分析', '大运流年排列'],
      },
      {
        title: '基础服务',
        items: ['每日运势简报', '知识库基础文章', '社区祈福广场'],
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
        items: ['四大命理工具无限使用', '详细八字解读（十神·格局·用神）', '紫微斗数三合四化分析', '奇门遁甲完整盘面', '梅花易数体用生克'],
      },
      {
        title: '增值服务',
        items: ['每日运势详报', '历史记录永久保存', '知识库全文阅读', '供奉9折优惠', '优先客服支持'],
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
        items: ['月卡全部权益', '流年流月运势分析', '双人合婚分析', '择日选吉功能', '命理报告导出PDF'],
      },
      {
        title: '增值服务',
        items: ['每月赠送100灵珠', '专属年度运势报告', '供奉8折优惠', '优先新功能体验', '专属客服通道'],
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
        items: ['年卡全部权益', '终身免费更新', '每月1次一对一咨询', '专属命理课程', '定制深度命理报告'],
      },
      {
        title: '尊享特权',
        items: ['每月赠送200灵珠', '供奉7折优惠', '尊贵终身徽章', '线下活动资格', '专属数据备份'],
      },
    ],
  },
];

// 权益对比表
const comparisonTable = [
  { feature: '每日排盘次数', free: '1次', monthly: '无限', yearly: '无限', lifetime: '无限' },
  { feature: '八字详细解读', free: '—', monthly: '✓', yearly: '✓', lifetime: '✓' },
  { feature: '紫微斗数分析', free: '—', monthly: '✓', yearly: '✓', lifetime: '✓' },
  { feature: '奇门遁甲排盘', free: '—', monthly: '✓', yearly: '✓', lifetime: '✓' },
  { feature: '梅花易数分析', free: '—', monthly: '✓', yearly: '✓', lifetime: '✓' },
  { feature: '每日运势', free: '简报', monthly: '详报', yearly: '详报', lifetime: '详报' },
  { feature: '流年流月分析', free: '—', monthly: '—', yearly: '✓', lifetime: '✓' },
  { feature: '双人合婚分析', free: '—', monthly: '—', yearly: '✓', lifetime: '✓' },
  { feature: '择日选吉', free: '—', monthly: '—', yearly: '✓', lifetime: '✓' },
  { feature: '导出PDF报告', free: '—', monthly: '—', yearly: '✓', lifetime: '✓' },
  { feature: '历史记录保存', free: '7天', monthly: '永久', yearly: '永久', lifetime: '永久' },
  { feature: '知识库访问', free: '基础', monthly: '全部', yearly: '全部', lifetime: '全部' },
  { feature: '供奉折扣', free: '—', monthly: '9折', yearly: '8折', lifetime: '7折' },
  { feature: '每月赠送灵珠', free: '—', monthly: '—', yearly: '100', lifetime: '200' },
  { feature: '一对一咨询', free: '—', monthly: '—', yearly: '—', lifetime: '每月1次' },
  { feature: '专属命理课程', free: '—', monthly: '—', yearly: '—', lifetime: '✓' },
  { feature: '客服优先级', free: '普通', monthly: '优先', yearly: '专属通道', lifetime: 'VIP通道' },
];

// 常见问题
const faqs = [
  {
    q: '会员权益什么时候生效？',
    a: '支付成功后立即生效，所有功能即时解锁，无需等待。',
  },
  {
    q: '月卡会员如何扣费？',
    a: '月卡为一次性付费，到期后需手动续费，不会自动扣款。续费后权益继续有效。',
  },
  {
    q: '灵珠有什么用？',
    a: '灵珠是平台虚拟积分，可用于供奉祈福、兑换供品、解锁特殊功能等。会员每月获赠的灵珠会自动充入账户。',
  },
  {
    q: '终身会员的"一对一咨询"是什么？',
    a: '终身会员每月可预约1次专业命理师一对一咨询，通过工单系统提交问题，48小时内获得专属解答。',
  },
  {
    q: '供奉折扣怎么计算？',
    a: '会员在供奉祈福时，所有供品价格自动按会员等级打折。例如年卡会员享8折，原价100灵珠的供品只需80灵珠。',
  },
  {
    q: '可以退款吗？',
    a: '虚拟商品一经开通不支持退款。建议先使用免费功能体验，确认满意后再购买会员。',
  },
  {
    q: '历史记录能保存多久？',
    a: '免费用户保留7天，付费会员永久保存所有排盘记录和分析结果，可随时查看和对比。',
  },
];

export default function MembershipPage() {
  const { user: session } = useAuth();
  const router = useRouter();
  const [buying, setBuying] = useState<string | null>(null);
  const [buyError, setBuyError] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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
          method: 'paypal',
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
                {plan.level === 'yearly' && (
                  <p className="text-xs text-green-600 mt-1">日均低至 ¥0.55</p>
                )}
                {plan.level === 'lifetime' && (
                  <p className="text-xs text-gold mt-1">一次付费 · 永久使用</p>
                )}
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

        {/* 权益对比表 */}
        <div className="mt-16">
          <div className="page-header">
            <div className="section-label justify-center">COMPARE</div>
            <h2 className="page-header-title">
              <span>权益对比</span>
            </h2>
            <p className="page-header-subtitle">详细对比各套餐功能差异</p>
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-4 font-bold text-gray-700 min-w-[160px]">功能</th>
                  <th className="text-center py-4 px-3 font-medium text-gray-500">免费</th>
                  <th className="text-center py-4 px-3 font-medium text-blue-600">月卡</th>
                  <th className="text-center py-4 px-3 font-bold text-red-700 bg-red-50/50">年卡</th>
                  <th className="text-center py-4 px-3 font-medium text-gold">终身</th>
                </tr>
              </thead>
              <tbody>
                {comparisonTable.map((row, i) => (
                  <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-gray-50/50' : ''}`}>
                    <td className="py-3 px-4 text-gray-700 font-medium">{row.feature}</td>
                    <td className="text-center py-3 px-3 text-gray-500">{row.free}</td>
                    <td className="text-center py-3 px-3 text-blue-600">{row.monthly}</td>
                    <td className="text-center py-3 px-3 text-red-700 bg-red-50/30 font-medium">{row.yearly}</td>
                    <td className="text-center py-3 px-3 text-gold font-medium">{row.lifetime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 为什么选择知微阁 */}
        <div className="mt-16">
          <div className="page-header">
            <div className="section-label justify-center">WHY US</div>
            <h2 className="page-header-title">
              <span>为什么选择知微阁</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="card p-6 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-red-50 flex items-center justify-center text-2xl mb-3">🏮</div>
              <h3 className="text-base font-bold text-gray-900 mb-2">四大命理体系</h3>
              <p className="text-sm text-gray-500">八字、紫微斗数、奇门遁甲、梅花易数，一站式命理分析平台，涵盖中华传统命理学精髓</p>
            </div>
            <div className="card p-6 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-blue-50 flex items-center justify-center text-2xl mb-3">📜</div>
              <h3 className="text-base font-bold text-gray-900 mb-2">深度解读</h3>
              <p className="text-sm text-gray-500">不仅排盘，更有十神格局、用神分析、流年流月运势等深度解读，让命理分析更有参考价值</p>
            </div>
            <div className="card p-6 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-gold/10 flex items-center justify-center text-2xl mb-3">🕯️</div>
              <h3 className="text-base font-bold text-gray-900 mb-2">祈福供奉</h3>
              <p className="text-sm text-gray-500">在线供奉祈福广场，多种供品选择，会员享专属折扣，让心灵找到寄托</p>
            </div>
            <div className="card p-6 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-green-50 flex items-center justify-center text-2xl mb-3">🔒</div>
              <h3 className="text-base font-bold text-gray-900 mb-2">隐私安全</h3>
              <p className="text-sm text-gray-500">所有命理数据加密存储，仅本人可见，支持永久保存和历史记录对比</p>
            </div>
            <div className="card p-6 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-purple-50 flex items-center justify-center text-2xl mb-3">📚</div>
              <h3 className="text-base font-bold text-gray-900 mb-2">知识库</h3>
              <p className="text-sm text-gray-500">丰富命理知识文章，从入门到精通，帮助您理解命理分析背后的原理</p>
            </div>
            <div className="card p-6 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-red-50 flex items-center justify-center text-2xl mb-3">💎</div>
              <h3 className="text-base font-bold text-gray-900 mb-2">持续更新</h3>
              <p className="text-sm text-gray-500">功能持续迭代，新增命理工具和分析维度，会员享优先体验权</p>
            </div>
          </div>
        </div>

        {/* 常见问题 */}
        <div className="mt-16">
          <div className="page-header">
            <div className="section-label justify-center">FAQ</div>
            <h2 className="page-header-title">
              <span>常见问题</span>
            </h2>
          </div>

          <div className="max-w-3xl mx-auto mt-8 space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50/50 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-800">{faq.q}</span>
                  <svg
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-sm text-gray-600 border-t border-gray-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 底部说明 */}
        <div className="mt-12 p-6 card space-y-4">
          <div className="flex items-start gap-3">
            <span className="text-lg">💡</span>
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-800 mb-1">支付方式说明</p>
              <p>支付宝、微信支付正在配置中，目前可通过以下方式开通会员：</p>
              <ul className="mt-2 space-y-1 ml-4 list-disc text-gray-500">
                <li><span className="text-gray-700 font-medium">PayPal 支付</span>：点击上方"立即开通"直接使用（支持信用卡、借记卡）</li>
                <li><span className="text-gray-700 font-medium">卡密兑换</span>：联系管理员购买激活码，前往<Link href="/profile/redeem" className="text-red-600 underline">卡密兑换</Link>页面激活</li>
              </ul>
            </div>
          </div>
          <div className="divider-gold" />
          <p className="text-xs text-gray-400 text-center">
            会员权益即时生效 · 如有疑问请联系客服
          </p>
        </div>
      </div>
    </div>
  );
}
