'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ============ 动画工具（与 /deploy 页一致） ============
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, visible };
}

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ============ 数据 ============

// 六大核心卖点（招商重点）
const SELLING_POINTS = [
  {
    icon: '📦',
    title: '源码部署',
    desc: '完整源代码交付，一次买断永久使用。独立品牌、自主定价、可二次开发，平台 100% 收益归你，不依赖主站运行。',
    color: '#B45309',
    tag: '重点推荐',
  },
  {
    icon: '🌐',
    title: '无限 SaaS 开户',
    desc: 'SaaS 模式客户数不设限：终身版可服务近万名客户，一个账户运营整个命理平台，客户越多收益越高。',
    color: '#6D28D9',
    tag: '稳定复利',
  },
  {
    icon: '🚀',
    title: '单独 SaaS 开户',
    desc: '无需购买源码也能赚钱。0 元开户、免费试用 7 天、99 元/月即可开通，平台托管、无需服务器与备案，不懂技术也能做。',
    color: '#0891B2',
    tag: '零门槛',
  },
  {
    icon: '💰',
    title: '低成本创业',
    desc: '0 开户费、0 培训费、0 保证金。免费试用，99 元/月起步，源码买断仅 2,980 元一次性投入，试错成本极低。',
    color: '#059669',
    tag: '投入可控',
  },
  {
    icon: '⚡',
    title: '快速部署',
    desc: 'SaaS 模式当天开通即可营业；源码部署提供一键脚本与图文文档，最快当天上线，可选 300 元代部署服务。',
    color: '#D97706',
    tag: '当天上线',
  },
  {
    icon: '💵',
    title: '即时赚钱',
    desc: '客户充值即时分润，会员 50%、供奉 50%、报告最高 60%，另享月 GMV 阶梯加成与新客奖励，收益自动结算、随时可提。',
    color: '#DB2777',
    tag: '自动分账',
  },
];

// 两种赚钱模式对比
const MODE_COMPARE = [
  { label: '本质', saas: '销售代理（帮平台卖服务，按单分成）', source: '独立运营商（买断平台，收入全归自己）' },
  { label: '部署方式', saas: '平台托管，无需任何部署', source: '独立部署到自己的服务器' },
  { label: '数据归属', saas: '主站数据库统一管理', source: '独立数据库，完全自主掌控' },
  { label: '域名与品牌', saas: '平台子域名或绑定自定义域名（100 元/年）', source: '自有域名 + 全套品牌定制' },
  { label: '收入归属', saas: '按单分润，最高 60% + 阶梯加成', source: '100% 归代理商' },
  { label: '支付通道', saas: '使用平台支付通道，无需自己接入', source: '使用自己的支付账户收款' },
  { label: '技术要求', saas: '无需技术背景', source: '按文档操作即可（可选代部署服务）' },
  { label: '功能更新', saas: '平台自动同步，即时生效', source: '买断含更新服务，可拉取新版本' },
  { label: '客户归属', saas: '客户在平台注册，归属代理商', source: '客户完全属于代理商，与平台无关' },
  { label: '适合人群', saas: '刚起步 / 预算有限 / 不懂技术', source: '有客户资源 / 想独立运营 / 长期经营' },
];

// 平台优势（网站优势）
const PLATFORM_ADVANTAGES = [
  {
    icon: '☯',
    title: '四大命理模块',
    desc: '八字、紫微斗数、奇门遁甲、梅花易数完整排盘引擎 + 合盘分析，专业级算法，开箱即用',
    color: '#B45309',
  },
  {
    icon: '🙏',
    title: '在线祈福体系',
    desc: '虚拟祈福广场、民俗祈福体验、积分互动体系，增强用户粘性与复购',
    color: '#D97706',
  },
  {
    icon: '📚',
    title: '传统文化学堂',
    desc: '54 篇原创知识文章 + 图解，持续更新的内容生态，自带 SEO 流量入口',
    color: '#6D28D9',
  },
  {
    icon: '💳',
    title: '完整商业化闭环',
    desc: '积分充值、卡密兑换、多级会员、优惠券，从获客到变现全流程已跑通',
    color: '#059669',
  },
  {
    icon: '🔐',
    title: '多支付通道',
    desc: 'PayPal 国际收款、Z-Pay 易支付（无需备案）、微信/支付宝收款码，覆盖国内外用户',
    color: '#0891B2',
  },
  {
    icon: '🛡️',
    title: '合规化运营',
    desc: '全站文案合规改造、免责声明、隐私与法律条款完善，长期稳定运营无忧',
    color: '#DB2777',
  },
  {
    icon: '📈',
    title: 'SEO 深度优化',
    desc: '结构化数据、内链架构、自动站点地图，帮助你的站点从搜索引擎持续获取免费流量',
    color: '#D97706',
  },
  {
    icon: '🔧',
    title: '持续更新保障',
    desc: '版本迭代、更新公告、技术工单体系，售后支持随时响应',
    color: '#B45309',
  },
];

// 收益测算数据
const COMMISSION_RULES = [
  { type: '会员充值', rate: '50%', desc: '客户开通会员/充值时，按实付金额分润' },
  { type: '祈福消费', rate: '50%', desc: '客户在线祈福消费，按实付金额分润' },
  { type: 'PDF 报告', rate: '60%', desc: '客户购买排盘报告，分润比例最高' },
  { type: '新客奖励', rate: '+5%', desc: '首次消费客户额外加成' },
];

const TIER_RULES = [
  { range: '月 GMV 5,001 - 20,000 元', bonus: '+3%' },
  { range: '月 GMV 20,001 - 50,000 元', bonus: '+5%' },
  { range: '月 GMV 50,000 元以上', bonus: '+8%' },
];

// 快速部署流程
const DEPLOY_STEPS = [
  { step: '01', title: '选择方案', desc: 'SaaS 开户免费试用，或直接源码买断，随时切换升级' },
  { step: '02', title: '获取授权', desc: '支付后系统自动生成授权码，绑定你的域名即刻生效' },
  { step: '03', title: '部署上线', desc: 'SaaS 免部署当天营业；源码版一键脚本 + 图文文档，最快当天上线' },
  { step: '04', title: '开始赚钱', desc: '独立品牌自主定价，客户充值即分润，自动结算随时提现' },
];

// 定价方案（与全站价格配置中心一致）
const PLANS = [
  {
    name: '试用版',
    price: '0',
    period: '7 天',
    desc: '免费体验全部功能',
    features: ['全部命理模块', '最多 10 名客户', '标准技术支持'],
    highlight: false,
  },
  {
    name: '月费版',
    price: '99',
    period: '/月',
    desc: '适合初期运营',
    features: ['全部功能模块', '最多 500 名客户', '优先技术支持', '独立域名绑定', '佣金分润系统'],
    highlight: false,
  },
  {
    name: '年费版',
    price: '980',
    period: '/年',
    desc: '稳定长期运营',
    features: ['月费版全部功能', '年付更划算', '数据导出功能', '营销工具', '专属更新通道'],
    highlight: false,
  },
  {
    name: '终身版',
    price: '2,980',
    period: '一次付清',
    desc: '近万名客户上限',
    features: ['全部功能模块', '客户数近无限', '独立域名绑定', '专属客服', '永久使用'],
    highlight: true,
  },
  {
    name: '源码买断',
    price: '2,980',
    period: '一次买断',
    desc: '完全自主可控',
    features: ['完整源代码交付', '永久使用授权', '无限用户数', '自定义二次开发', '独立品牌运营', '不依赖主站运行'],
    highlight: true,
    badge: '推荐',
  },
];

// 开发路线图
const ROADMAP_DONE = [
  { time: '2026 · 第一阶段', title: '核心排盘引擎上线', items: ['八字 / 紫微 / 奇门 / 梅花四大排盘 + 合盘', '高级选项：起运方向、大运排法、藏干神煞'] },
  { time: '2026 · 第二阶段', title: '商业化闭环打通', items: ['积分充值、卡密兑换、优惠券体系', '多支付通道：PayPal / Z-Pay 易支付 / 收款码'] },
  { time: '2026 · 第三阶段', title: '内容与体验生态', items: ['在线祈福体系（真实/模拟双系统）', '传统文化学堂 54 篇文章 + SVG 图解', '多级会员体系'] },
  { time: '2026 · 第四阶段', title: '代理商双模式体系', items: ['SaaS 分润代理：阶梯佣金 + 新客奖励 + 月度结算', '源码部署代理：独立运营、100% 收益', '工单支持、更新日志、域名绑定'] },
  { time: '2026 · 当前', title: '流量与合规深耕', items: ['SEO 结构化数据与内链架构', '全站合规化改造与法律条款完善'] },
];

const ROADMAP_PLANNED = [
  { title: 'AI 智能解读', desc: '大模型辅助个性化分析报告' },
  { title: '移动端 / 小程序', desc: '触达更广泛的用户场景' },
  { title: '更多排盘模块', desc: '六爻、塔罗等新工具扩展' },
  { title: '多语言支持', desc: '面向海外市场的国际化' },
  { title: '营销工具增强', desc: '裂变活动与精细化运营' },
];

// FAQ
const FAQS = [
  {
    q: '我不懂技术，也能赚钱吗？',
    a: '可以。选择 SaaS 开户即可：平台托管、无需服务器与备案，0 元试用 7 天，99 元/月正式运营。你只需要邀请客户，客户消费你就拿分润。',
  },
  {
    q: '多久能上线开始赚钱？',
    a: 'SaaS 模式当天开通当天营业；源码部署提供一键部署脚本和图文教程，最快当天上线，也可购买 300 元/次的代部署服务。',
  },
  {
    q: '收益具体怎么算？',
    a: 'SaaS 模式下，会员充值、祈福消费分润 50%，PDF 报告分润 60%；月 GMV 超过 5,000 元还有 3%-8% 阶梯加成，新客户首单额外 +5%。源码部署模式收入 100% 归你。',
  },
  {
    q: '可以先免费试试吗？',
    a: '可以。SaaS 代理免费试用 7 天、最多 10 名客户，完整功能体验。试用满意再付费，先试 SaaS、业务稳定后升级源码买断，已付费用可抵扣。',
  },
  {
    q: '源码买断后能二次开发吗？',
    a: '可以。源码买断授权你完全自定义：修改界面、增加功能、调整业务逻辑都行。数据存储在你自己的服务器上，与主站完全隔离。',
  },
  {
    q: '数据安全有保障吗？',
    a: 'SaaS 模式由平台统一安全运维；源码部署模式下全部数据存储在你自己的服务器，完全自主掌控，我们不会访问你的任何用户数据。',
  },
];

// ============ 八卦装饰（浅色版） ============
function BaguaRing({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none">
      <circle cx="100" cy="100" r="98" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
      <circle cx="100" cy="100" r="85" stroke="currentColor" strokeWidth="0.5" opacity="0.14" />
      <circle cx="100" cy="100" r="70" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
      {['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'].map((s, i) => {
        const angle = (i * 45 - 90) * (Math.PI / 180);
        const r = 78;
        const x = 100 + r * Math.cos(angle);
        const y = 100 + r * Math.sin(angle);
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="11"
            fill="currentColor"
            opacity="0.3"
            style={{ fontFamily: 'serif' }}
          >
            {s}
          </text>
        );
      })}
      <circle cx="100" cy="100" r="25" fill="currentColor" opacity="0.08" />
      <path d="M100 75 A25 25 0 0 0 100 125 A12.5 12.5 0 0 1 100 100 A12.5 12.5 0 0 0 100 75Z" fill="currentColor" opacity="0.15" />
      <circle cx="100" cy="87.5" r="3" fill="currentColor" opacity="0.15" />
      <circle cx="100" cy="112.5" r="3" fill="currentColor" opacity="0.08" />
    </svg>
  );
}

// ============ 区块标题 ============
function SectionHeader({ en, title, desc }: { en: string; title: string; desc?: string }) {
  return (
    <div className="text-center mb-16">
      <span className="text-sm text-[#B45309] tracking-widest uppercase">{en}</span>
      <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-4 text-gray-900" style={{ fontFamily: "'Noto Serif SC', 'SimSun', serif" }}>
        {title}
      </h2>
      {desc && <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed">{desc}</p>}
    </div>
  );
}

// ============ 主页面 ============
export default function PartnerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDF8F0] via-white to-[#FDF8F0] text-gray-900 overflow-x-hidden" style={{ fontFamily: "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif" }}>
      {/* ======== HERO ======== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <BaguaRing className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] text-[#B45309] opacity-70 animate-[spin_120s_linear_infinite]" />
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#F0C27A] rounded-full blur-[120px] opacity-20" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#C4B5FD] rounded-full blur-[120px] opacity-20" />
          <div className="absolute top-[20%] left-[15%] w-1 h-1 bg-[#B45309] rounded-full opacity-30 animate-[float_8s_ease-in-out_infinite]" style={{ animationDelay: '0s' }} />
          <div className="absolute top-[60%] left-[80%] w-1.5 h-1.5 bg-[#B45309] rounded-full opacity-25 animate-[float_10s_ease-in-out_infinite]" style={{ animationDelay: '2s' }} />
          <div className="absolute top-[30%] left-[70%] w-1 h-1 bg-[#6D28D9] rounded-full opacity-30 animate-[float_7s_ease-in-out_infinite]" style={{ animationDelay: '4s' }} />
          <div className="absolute top-[70%] left-[10%] w-1.5 h-1.5 bg-[#B45309] rounded-full opacity-25 animate-[float_9s_ease-in-out_infinite]" style={{ animationDelay: '1s' }} />
          <div className="absolute top-[45%] left-[50%] w-1 h-1 bg-[#D97706] rounded-full opacity-30 animate-[float_11s_ease-in-out_infinite]" style={{ animationDelay: '3s' }} />
          <div className="absolute top-[80%] left-[40%] w-1 h-1 bg-[#0891B2] rounded-full opacity-25 animate-[float_8.5s_ease-in-out_infinite]" style={{ animationDelay: '5s' }} />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#B45309]/30 bg-[#B45309]/5 mb-8 animate-[fadeInUp_0.6s_ease-out]">
            <span className="w-2 h-2 bg-[#B45309] rounded-full animate-pulse" />
            <span className="text-sm text-[#B45309] font-medium">知微阁 · 创业合作计划</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 animate-[fadeInUp_0.6s_ease-out_0.1s] opacity-0" style={{ animationFillMode: 'forwards', fontFamily: "'Noto Serif SC', 'SimSun', serif" }}>
            <span className="bg-gradient-to-r from-[#B45309] via-[#C49A6C] to-[#B45309] bg-clip-text text-transparent">
              低成本创业
            </span>
            <br />
            <span className="text-gray-900">快速部署 · 即时赚钱</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10 animate-[fadeInUp_0.6s_ease-out_0.2s] opacity-0" style={{ animationFillMode: 'forwards' }}>
            一套完整的命理平台：源码部署 100% 收益归你，
            <br className="hidden sm:block" />
            或单独 SaaS 开户 0 元试用 · 99 元/月起，客户充值即分润。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-[fadeInUp_0.6s_ease-out_0.3s] opacity-0" style={{ animationFillMode: 'forwards' }}>
            <Link
              href="/contact"
              className="px-8 py-4 bg-gradient-to-r from-[#D97706] to-[#B45309] text-white font-semibold rounded-xl hover:shadow-[0_8px_30px_rgba(180,83,9,0.3)] transition-all duration-300 text-lg"
            >
              立即咨询
            </Link>
            <a
              href="#models"
              className="px-8 py-4 border border-gray-300 bg-white text-gray-700 font-semibold rounded-xl hover:border-[#B45309] hover:text-[#B45309] transition-all duration-300 text-lg"
            >
              查看赚钱模式
            </a>
          </div>

          <div className="mt-20 animate-bounce opacity-30">
            <svg className="w-6 h-6 mx-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* ======== 数据信任条 ======== */}
      <section className="py-10 px-4 border-y border-[#E8DCC8] bg-[#F5F0E8]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          {[
            { num: '0 元', label: '开户费 / 培训费' },
            { num: '99 元', label: 'SaaS 月费起步' },
            { num: '2,980 元', label: '源码一次买断' },
            { num: '最高 60%', label: '订单分润比例' },
          ].map((s, i) => (
            <Reveal key={i} delay={i * 80}>
              <div className="text-2xl sm:text-3xl font-bold text-[#B45309]">{s.num}</div>
              <div className="text-sm text-gray-600 mt-1">{s.label}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ======== 六大核心卖点 ======== */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <SectionHeader
              en="Why Partner With Us"
              title="六大理由，选择知微阁创业"
              desc="从 0 元试用到源码买断，总有一种方式适合你的创业阶段"
            />
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SELLING_POINTS.map((f, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="group relative p-6 rounded-2xl border border-[#E8DCC8] bg-white hover:shadow-lg hover:border-[#D4C4A8] transition-all duration-500 h-full">
                  {f.tag && (
                    <span className="absolute top-4 right-4 text-[10px] px-2 py-0.5 rounded-full border border-[#B45309]/30 text-[#B45309] bg-[#B45309]/5">
                      {f.tag}
                    </span>
                  )}
                  <div className="text-3xl mb-4">{f.icon}</div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: f.color }}>{f.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: `radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${f.color}0D, transparent 70%)` }}
                  />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ======== 两种赚钱模式对比 ======== */}
      <section id="models" className="py-24 px-4 bg-[#F5F0E8] border-y border-[#E8DCC8]">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <SectionHeader
              en="Two Business Models"
              title="两种赚钱模式，任你选择"
              desc="SaaS 代理：帮我卖货，我给你分钱；源码部署：把平台买下来，自己当老板"
            />
          </Reveal>

          <Reveal>
            <div className="grid sm:grid-cols-2 gap-6 mb-12">
              <div className="p-6 rounded-2xl border border-[#0891B2]/30 bg-white">
                <div className="text-2xl mb-2">🚀</div>
                <h3 className="text-xl font-bold text-[#0891B2] mb-1">SaaS 开户 · 销售代理</h3>
                <p className="text-sm text-gray-600 mb-4">无需技术、无需服务器，平台托管，按单分成</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-3 py-1 rounded-full bg-[#0891B2]/5 border border-[#0891B2]/20 text-gray-700">0 元开户</span>
                  <span className="px-3 py-1 rounded-full bg-[#0891B2]/5 border border-[#0891B2]/20 text-gray-700">最高 60% 分润</span>
                  <span className="px-3 py-1 rounded-full bg-[#0891B2]/5 border border-[#0891B2]/20 text-gray-700">阶梯加成</span>
                  <span className="px-3 py-1 rounded-full bg-[#0891B2]/5 border border-[#0891B2]/20 text-gray-700">新客奖励</span>
                  <span className="px-3 py-1 rounded-full bg-[#0891B2]/5 border border-[#0891B2]/20 text-gray-700">自动结算</span>
                </div>
              </div>
              <div className="p-6 rounded-2xl border border-[#B45309]/40 bg-white">
                <div className="text-2xl mb-2">📦</div>
                <h3 className="text-xl font-bold text-[#B45309] mb-1">源码部署 · 独立运营商</h3>
                <p className="text-sm text-gray-600 mb-4">一次买断，独立品牌，100% 收益归你</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-3 py-1 rounded-full bg-[#B45309]/5 border border-[#B45309]/20 text-gray-700">2,980 元买断</span>
                  <span className="px-3 py-1 rounded-full bg-[#B45309]/5 border border-[#B45309]/20 text-gray-700">100% 收益</span>
                  <span className="px-3 py-1 rounded-full bg-[#B45309]/5 border border-[#B45309]/20 text-gray-700">无限用户</span>
                  <span className="px-3 py-1 rounded-full bg-[#B45309]/5 border border-[#B45309]/20 text-gray-700">二次开发</span>
                  <span className="px-3 py-1 rounded-full bg-[#B45309]/5 border border-[#B45309]/20 text-gray-700">独立部署</span>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="rounded-2xl border border-[#E8DCC8] bg-white overflow-x-auto shadow-sm">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-[#F5F0E8] border-b border-[#E8DCC8] text-left">
                    <th className="px-5 py-4 text-gray-500 font-medium w-[15%]">对比项</th>
                    <th className="px-5 py-4 font-bold text-[#0891B2] w-[42%]">SaaS 开户</th>
                    <th className="px-5 py-4 font-bold text-[#B45309] w-[43%]">源码部署</th>
                  </tr>
                </thead>
                <tbody>
                  {MODE_COMPARE.map((row, i) => (
                    <tr key={i} className="border-b border-[#F0E8DC] last:border-0">
                      <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{row.label}</td>
                      <td className="px-5 py-3.5 text-gray-700 leading-relaxed">{row.saas}</td>
                      <td className="px-5 py-3.5 text-gray-700 leading-relaxed">{row.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>

          <Reveal>
            <div className="mt-8 p-5 rounded-xl border border-[#B45309]/25 bg-gradient-to-r from-[#B45309]/10 to-[#6D28D9]/5 text-sm text-gray-700 leading-relaxed">
              <span className="font-bold text-[#B45309]">💡 进阶路径：</span>
              先开 SaaS 账户免费试用，业务稳定后再升级源码买断，已付费用可抵扣 —— 风险最低的创业路径。
            </div>
          </Reveal>
        </div>
      </section>

      {/* ======== 平台优势 ======== */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <SectionHeader
              en="Platform Advantages"
              title="为什么选知微阁"
              desc="不是一套空壳源码，而是经过完整商业验证、持续迭代的成熟平台"
            />
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLATFORM_ADVANTAGES.map((f, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className="group relative p-5 rounded-2xl border border-[#E8DCC8] bg-white hover:shadow-md hover:border-[#D4C4A8] transition-all duration-500 h-full">
                  <div className="text-2xl mb-3">{f.icon}</div>
                  <h3 className="text-base font-bold mb-1.5" style={{ color: f.color }}>{f.title}</h3>
                  <p className="text-gray-600 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/"
                className="px-6 py-3 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm hover:border-[#B45309] hover:text-[#B45309] transition-all duration-300"
              >
                在线体验平台
              </Link>
              <Link
                href="/deploy"
                className="px-6 py-3 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm hover:border-[#B45309] hover:text-[#B45309] transition-all duration-300"
              >
                查看源码部署方案
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ======== 收益测算 ======== */}
      <section className="py-24 px-4 bg-[#F5F0E8] border-y border-[#E8DCC8]">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <SectionHeader
              en="Earnings Model"
              title="收益是怎么算的"
              desc="所有分润规则真实透明，订单实付即结算，自动入账随时提现"
            />
          </Reveal>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* SaaS 分润规则 */}
            <Reveal>
              <div className="rounded-2xl border border-[#0891B2]/30 bg-white p-6 h-full shadow-sm">
                <h3 className="text-xl font-bold text-[#0891B2] mb-5">SaaS 模式 · 分润规则</h3>
                <div className="space-y-3 mb-6">
                  {COMMISSION_RULES.map((r, i) => (
                    <div key={i} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-[#F5F0E8] border border-[#E8DCC8]">
                      <div>
                        <div className="text-sm text-gray-800 font-medium">{r.type}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{r.desc}</div>
                      </div>
                      <div className="text-lg font-bold text-[#B45309] whitespace-nowrap">{r.rate}</div>
                    </div>
                  ))}
                </div>
                <div className="text-sm text-gray-600 mb-3">📈 月 GMV 阶梯加成（额外奖励）：</div>
                <div className="space-y-2">
                  {TIER_RULES.map((t, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#F5F0E8] text-sm">
                      <span className="text-gray-600">{t.range}</span>
                      <span className="text-[#B45309] font-bold">{t.bonus}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* 算例 */}
            <Reveal delay={100}>
              <div className="rounded-2xl border border-[#B45309]/40 bg-white p-6 h-full flex flex-col shadow-sm">
                <h3 className="text-xl font-bold text-[#B45309] mb-5">真实算例</h3>
                <div className="space-y-4 flex-1">
                  <div className="p-4 rounded-xl bg-[#F5F0E8] border border-[#E8DCC8]">
                    <div className="text-xs text-gray-500 mb-2">📱 SaaS 代理 · 月营收测算</div>
                    <div className="text-sm text-gray-700 leading-relaxed">
                      月 GMV <span className="text-gray-900 font-bold">10,000 元</span>（客户充值 + 报告消费）
                      <br />
                      基础分润 50% + 阶梯加成 3% = <span className="text-[#B45309] font-bold">5,300 元/月</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-[#F5F0E8] border border-[#E8DCC8]">
                    <div className="text-xs text-gray-500 mb-2">🆕 新客首单奖励</div>
                    <div className="text-sm text-gray-700 leading-relaxed">
                      新客户首单充值 <span className="text-gray-900 font-bold">100 元</span>
                      <br />
                      50% 分润 + 5% 新客奖励 = <span className="text-[#B45309] font-bold">55 元</span> 即时到账
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-[#F5F0E8] border border-[#E8DCC8]">
                    <div className="text-xs text-gray-500 mb-2">🏪 源码部署 · 独立运营测算</div>
                    <div className="text-sm text-gray-700 leading-relaxed">
                      月营收 <span className="text-gray-900 font-bold">10,000 元</span>
                      <br />
                      收入 <span className="text-[#B45309] font-bold">100% 归你</span>（仅扣除支付通道费约 1%）
                      <br />
                      <span className="text-gray-500 text-xs">2,980 元买断 ≈ 不到一个月回本</span>
                    </div>
                  </div>
                </div>
                <div className="mt-5 text-center">
                  <Link
                    href="/contact"
                    className="inline-block px-6 py-3 bg-gradient-to-r from-[#D97706] to-[#B45309] text-white font-semibold rounded-lg text-sm hover:shadow-[0_8px_30px_rgba(180,83,9,0.3)] transition-all duration-300"
                  >
                    咨询收益测算
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ======== 快速部署流程 ======== */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <SectionHeader
              en="Quick Launch"
              title="四步，从今天到上线"
              desc="最快当天完成部署，第二天开始接单赚钱"
            />
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {DEPLOY_STEPS.map((s, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="relative p-6 rounded-2xl border border-[#E8DCC8] bg-white hover:shadow-md transition-shadow h-full">
                  <div className="text-4xl font-bold text-[#E8DCC8] mb-3" style={{ fontFamily: "'Noto Serif SC', serif" }}>{s.step}</div>
                  <h3 className="text-lg font-bold mb-2 text-[#B45309]">{s.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
                  {i < DEPLOY_STEPS.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 text-[#D4C4A8]">→</div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ======== 定价方案 ======== */}
      <section id="plans" className="py-24 px-4 bg-[#F5F0E8] border-y border-[#E8DCC8]">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <SectionHeader
              en="Pricing"
              title="透明定价，无隐藏费用"
              desc="0 开户费、0 培训费、0 保证金；所有价格与平台价格配置一致"
            />
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5 items-stretch">
            {PLANS.map((p, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className={`relative h-full p-6 rounded-2xl border transition-all duration-500 flex flex-col ${
                  p.highlight
                    ? 'border-[#B45309]/50 bg-gradient-to-b from-[#B45309]/10 to-white shadow-md hover:border-[#B45309]'
                    : 'border-[#E8DCC8] bg-white hover:border-[#D4C4A8] hover:shadow-md'
                }`}>
                  {p.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r from-[#D97706] to-[#B45309] text-white whitespace-nowrap">
                      {p.badge}
                    </span>
                  )}
                  <h3 className="text-base font-bold text-gray-900 mb-1">{p.name}</h3>
                  <p className="text-xs text-gray-500 mb-4">{p.desc}</p>
                  <div className="mb-5">
                    <span className="text-3xl font-bold text-gray-900">{p.price}</span>
                    <span className="text-sm text-gray-500 ml-1">{p.period}</span>
                  </div>
                  <ul className="space-y-2 mb-6 flex-1">
                    {p.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed">
                        <span className="text-[#B45309] mt-0.5">✓</span>{f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/contact"
                    className={`block text-center py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                      p.highlight
                        ? 'bg-gradient-to-r from-[#D97706] to-[#B45309] text-white hover:shadow-[0_8px_25px_rgba(180,83,9,0.3)]'
                        : 'border border-gray-300 bg-white text-gray-700 hover:border-[#B45309] hover:text-[#B45309]'
                    }`}
                  >
                    {p.name === '试用版' ? '免费试用' : '咨询开通'}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <p className="text-center text-xs text-gray-500 mt-6">
              另有独立域名绑定服务 100 元/年 · 源码代部署服务 300 元/次（可选）· SaaS 升级源码买断已付费用可抵扣
            </p>
          </Reveal>
        </div>
      </section>

      {/* ======== 开发路线图 ======== */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <SectionHeader
              en="Roadmap"
              title="开发路线图"
              desc="平台持续迭代，你的站点同步受益"
            />
          </Reveal>

          {/* 已上线 */}
          <Reveal>
            <h3 className="text-lg font-bold text-[#059669] mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
              已上线 · 2026 年
            </h3>
          </Reveal>
          <div className="relative pl-6 border-l border-[#E8DCC8] space-y-8 mb-14">
            {ROADMAP_DONE.map((m, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className="relative">
                  <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-[#059669] border-2 border-white" />
                  <div className="text-xs text-[#059669]/80 mb-1">{m.time}</div>
                  <h4 className="text-base font-bold mb-2 text-gray-900">{m.title}</h4>
                  <ul className="space-y-1">
                    {m.items.map((it, j) => (
                      <li key={j} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-[#059669] mt-0.5">✓</span>{it}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>

          {/* 规划中 */}
          <Reveal>
            <h3 className="text-lg font-bold text-[#6D28D9] mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#6D28D9]" />
              规划中 · 持续迭代
            </h3>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {ROADMAP_PLANNED.map((m, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className="p-4 rounded-xl border border-dashed border-[#D4C4A8] bg-[#FDF8F0] h-full">
                  <div className="text-xs text-[#6D28D9] mb-1.5">🚧 规划中</div>
                  <div className="text-sm font-bold text-gray-800 mb-1">{m.title}</div>
                  <div className="text-xs text-gray-500 leading-relaxed">{m.desc}</div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <p className="text-center text-xs text-gray-500 mt-8">
              SaaS 代理自动同步所有更新 · 源码买断客户可按更新服务获取新版本源代码
            </p>
          </Reveal>
        </div>
      </section>

      {/* ======== FAQ ======== */}
      <section className="py-24 px-4 bg-[#F5F0E8] border-y border-[#E8DCC8]">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <SectionHeader en="FAQ" title="常见问题" />
          </Reveal>

          <div className="space-y-4">
            {FAQS.map((f, i) => (
              <Reveal key={i} delay={i * 50}>
                <details className="group rounded-xl border border-[#E8DCC8] bg-white overflow-hidden">
                  <summary className="cursor-pointer list-none flex items-center justify-between gap-4 px-5 py-4 text-sm font-medium text-gray-800 hover:text-[#B45309] transition-colors">
                    {f.q}
                    <span className="text-gray-400 group-open:rotate-45 transition-transform text-lg shrink-0">＋</span>
                  </summary>
                  <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{f.a}</div>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ======== 底部 CTA ======== */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#F0C27A] rounded-full blur-[160px] opacity-25" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900" style={{ fontFamily: "'Noto Serif SC', 'SimSun', serif" }}>
              你的创业，从今天开始
            </h2>
            <p className="text-gray-600 mb-8 max-w-xl mx-auto">
              免费试用 7 天，或直接咨询源码部署方案 ——
              低成本、快上线、即时赚钱。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="px-8 py-4 bg-gradient-to-r from-[#D97706] to-[#B45309] text-white font-semibold rounded-xl hover:shadow-[0_8px_30px_rgba(180,83,9,0.3)] transition-all duration-300 text-lg"
              >
                免费注册体验
              </Link>
              <Link
                href="/contact"
                className="px-8 py-4 border border-gray-300 bg-white text-gray-700 font-semibold rounded-xl hover:border-[#B45309] hover:text-[#B45309] transition-all duration-300 text-lg"
              >
                联系创业顾问
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ======== 底部 ======== */}
      <footer className="py-12 px-4 border-t border-[#E8DCC8]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <span>© 2026 知微阁 · 创业合作计划</span>
          <div className="flex gap-6 flex-wrap justify-center">
            <Link href="/deploy" className="hover:text-[#B45309] transition-colors">源码部署</Link>
            <Link href="/terms" className="hover:text-[#B45309] transition-colors">服务条款</Link>
            <Link href="/privacy" className="hover:text-[#B45309] transition-colors">隐私政策</Link>
            <Link href="/contact" className="hover:text-[#B45309] transition-colors">联系我们</Link>
          </div>
        </div>
      </footer>

      {/* ======== 全局动画关键帧 ======== */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.5); }
        }
      `}</style>
    </div>
  );
}
