'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ============ 动画工具 ============
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
const FEATURES = [
  {
    icon: '☯',
    title: '八字排盘',
    desc: '四柱八字精准排盘，十神分析、大运流年、用神喜忌，完整命理体系',
    color: '#c2410c',
  },
  {
    icon: '⭐',
    title: '紫微斗数',
    desc: '十二宫位完整排盘，三方四正、飞星四化、大限流年，专业级解读',
    color: '#7c3aed',
  },
  {
    icon: '🔮',
    title: '奇门遁甲',
    desc: '九宫八卦盘面，八门九星八神，格局分析、用神定位，高清SVG展示',
    color: '#0891b2',
  },
  {
    icon: '🌸',
    title: '梅花易数',
    desc: '多种起卦方式，本卦互卦变卦，体用生克，精准问题解读',
    color: '#db2777',
  },
  {
    icon: '🙏',
    title: '在线祈福',
    desc: '虚拟供奉广场，佛像神像供奉，灵珠积分体系，增强用户粘性',
    color: '#d97706',
  },
  {
    icon: '👥',
    title: '会员系统',
    desc: '多级会员体系，积分充值，卡密兑换，完整的商业化变现闭环',
    color: '#059669',
  },
];

const PLANS = [
  {
    name: '试用版',
    price: '0',
    period: '7天',
    desc: '快速体验全部功能',
    features: ['全部命理模块', '最多10名用户', '标准技术支持', '7天完整功能'],
    highlight: false,
  },
  {
    name: '月费版',
    price: '99',
    period: '/月',
    desc: '适合初期运营',
    features: ['全部功能模块', '最多500名用户', '优先技术支持', '独立域名绑定', '佣金分润系统'],
    highlight: true,
  },
  {
    name: '年费版',
    price: '980',
    period: '/年',
    desc: '稳定长期运营',
    features: ['月费版全部功能', '年付享8.2折', '数据导出功能', '营销工具', '专属更新通道'],
    highlight: false,
  },
  {
    name: '源码买断',
    price: '2,980',
    period: '',
    desc: '完全自主可控',
    highlight: true,
    features: ['完整源代码交付', '永久使用授权', '无限用户数', '自定义二次开发', '独立品牌运营', '不依赖主站运行'],
    badge: '推荐',
  },
];

const STEPS = [
  { step: '01', title: '选择方案', desc: '根据你的运营需求，选择合适的套餐方案' },
  { step: '02', title: '获取授权', desc: '支付完成后，系统自动生成授权码，绑定你的域名' },
  { step: '03', title: '部署上线', desc: '下载源码包，上传至你的服务器，一键初始化，即刻运行' },
  { step: '04', title: '开始运营', desc: '独立品牌，自主定价，坐享全部收益，我们提供持续更新' },
];

const FAQS = [
  {
    q: '源码部署需要什么技术基础？',
    a: '需要基本的 Linux 服务器操作经验（如使用宝塔面板）。我们提供详细的一键部署脚本和文档，即使没有编程经验也能完成部署。',
  },
  {
    q: '源码部署后可以修改代码吗？',
    a: '可以。源码买断版授权你完全自定义二次开发，包括修改界面、增加功能模块、调整业务逻辑等。',
  },
  {
    q: '授权码有使用期限吗？',
    a: '源码买断版为永久授权，无使用期限限制。月费/年费版在订阅期内有效。',
  },
  {
    q: '支持绑定自己的域名吗？',
    a: '支持。你可以绑定独立域名，完全使用自己的品牌对外运营，用户不会感知到主站。',
  },
  {
    q: '后续有更新怎么办？',
    a: '我们持续迭代主站功能，源码买断用户可获取后续更新的源代码。月费/年费用户在订阅期内免费获取更新。',
  },
  {
    q: '数据安全吗？',
    a: '全部数据存储在你的服务器上，完全由你掌控。我们不会访问你的任何用户数据。',
  },
];

// ============ 八卦装饰 ============
function BaguaRing({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none">
      <circle cx="100" cy="100" r="98" stroke="currentColor" strokeWidth="0.5" opacity="0.12" />
      <circle cx="100" cy="100" r="85" stroke="currentColor" strokeWidth="0.5" opacity="0.08" />
      <circle cx="100" cy="100" r="70" stroke="currentColor" strokeWidth="0.5" opacity="0.06" />
      {['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'].map((s, i) => {
        const angle = (i * 45 - 90) * (Math.PI / 180);
        const r = 78;
        const x = 100 + r * Math.cos(angle);
        const y = 100 + r * Math.sin(angle);
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="11" fill="currentColor" opacity="0.2" style={{ fontFamily: 'serif' }}>
            {s}
          </text>
        );
      })}
      <circle cx="100" cy="100" r="25" fill="currentColor" opacity="0.04" />
      <path d="M100 75 A25 25 0 0 0 100 125 A12.5 12.5 0 0 1 100 100 A12.5 12.5 0 0 0 100 75Z" fill="currentColor" opacity="0.08" />
      <circle cx="100" cy="87.5" r="3" fill="currentColor" opacity="0.08" />
      <circle cx="100" cy="112.5" r="3" fill="currentColor" opacity="0.04" />
    </svg>
  );
}

// ============ 主页面 ============
export default function DeployPage() {
  return (
    <div className="min-h-screen bg-[#faf7f2] text-[#2d2d2d] overflow-x-hidden" style={{ fontFamily: "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif" }}>
      {/* ======== HERO ======== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#f5f0e8] to-[#faf7f2]">
        {/* 背景装饰 */}
        <div className="absolute inset-0 pointer-events-none">
          <BaguaRing className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] text-[#c2410c] opacity-15 animate-[spin_120s_linear_infinite]" />
          <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-[#c2410c] rounded-full blur-[100px] opacity-[0.04]" />
          <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-[#7c3aed] rounded-full blur-[100px] opacity-[0.03]" />
          {/* 水墨粒子 */}
          <div className="absolute top-[20%] left-[15%] w-1 h-1 bg-[#c2410c] rounded-full opacity-15 animate-[float_8s_ease-in-out_infinite]" style={{ animationDelay: '0s' }} />
          <div className="absolute top-[60%] left-[80%] w-1.5 h-1.5 bg-[#c2410c] rounded-full opacity-10 animate-[float_10s_ease-in-out_infinite]" style={{ animationDelay: '2s' }} />
          <div className="absolute top-[30%] left-[70%] w-1 h-1 bg-[#7c3aed] rounded-full opacity-12 animate-[float_7s_ease-in-out_infinite]" style={{ animationDelay: '4s' }} />
          <div className="absolute top-[70%] left-[10%] w-1.5 h-1.5 bg-[#c2410c] rounded-full opacity-10 animate-[float_9s_ease-in-out_infinite]" style={{ animationDelay: '1s' }} />
          <div className="absolute top-[45%] left-[50%] w-1 h-1 bg-[#d97706] rounded-full opacity-12 animate-[float_11s_ease-in-out_infinite]" style={{ animationDelay: '3s' }} />
          <div className="absolute top-[80%] left-[40%] w-1 h-1 bg-[#0891b2] rounded-full opacity-10 animate-[float_8.5s_ease-in-out_infinite]" style={{ animationDelay: '5s' }} />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#c2410c]/20 bg-[#c2410c]/5 mb-8 animate-[fadeInUp_0.6s_ease-out]">
            <span className="w-2 h-2 bg-[#c2410c] rounded-full animate-pulse" />
            <span className="text-sm text-[#c2410c] font-medium">源码部署 · 独立运营</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 animate-[fadeInUp_0.6s_ease-out_0.1s] opacity-0" style={{ animationFillMode: 'forwards', fontFamily: "'Noto Serif SC', 'SimSun', serif" }}>
            <span className="text-[#1a3a2e]">
              拥有你自己的
            </span>
            <br />
            <span className="text-[#c2410c]">命理平台</span>
          </h1>

          <p className="text-lg sm:text-xl text-[#6b6b6b] max-w-2xl mx-auto mb-10 animate-[fadeInUp_0.6s_ease-out_0.2s] opacity-0" style={{ animationFillMode: 'forwards' }}>
            完整源码交付，独立品牌运营，一键部署上线。
            <br className="hidden sm:block" />
            八字 · 紫微 · 奇门 · 梅花 — 四大命理模块，开箱即用。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-[fadeInUp_0.6s_ease-out_0.3s] opacity-0" style={{ animationFillMode: 'forwards' }}>
            <Link
              href="/contact"
              className="px-8 py-4 bg-[#c2410c] text-white font-semibold rounded-xl hover:bg-[#9a3412] transition-all duration-300 text-lg shadow-lg shadow-[#c2410c]/20"
            >
              立即咨询
            </Link>
            <a
              href="#plans"
              className="px-8 py-4 border-2 border-[#c2410c]/20 text-[#c2410c] font-semibold rounded-xl hover:border-[#c2410c] hover:bg-[#c2410c]/5 transition-all duration-300 text-lg"
            >
              查看方案
            </a>
          </div>

          <div className="mt-20 animate-bounce opacity-30">
            <svg className="w-6 h-6 mx-auto text-[#6b6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* ======== 平台展示 ======== */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <span className="text-sm text-[#c2410c] tracking-widest uppercase font-medium">Platform Preview</span>
              <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-4 text-[#1a3a2e]" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                四大命理模块，一站俱全
              </h2>
              <p className="text-[#6b6b6b] max-w-xl mx-auto">八字、紫微斗数、奇门遁甲、梅花易数，集成完整命理工具链</p>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="group relative p-6 rounded-2xl border border-[#e5d5c0] bg-white hover:shadow-lg hover:shadow-[#c2410c]/5 hover:-translate-y-1 transition-all duration-500">
                  <div className="text-3xl mb-4">{f.icon}</div>
                  <h3 className="text-lg font-bold mb-2 text-[#1a3a2e]">{f.title}</h3>
                  <p className="text-[#6b6b6b] text-sm leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ======== 为什么选择源码部署 ======== */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <span className="text-sm text-[#c2410c] tracking-widest uppercase font-medium">Why Source Code</span>
              <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-4 text-[#1a3a2e]" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                为什么选择源码部署？
              </h2>
            </div>
          </Reveal>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <Reveal>
              <div className="space-y-8">
                {[
                  { title: '完全自主可控', desc: '代码在你手里，服务器在你手里，数据在你手里。不依赖任何第三方平台，不受任何规则限制。' },
                  { title: '独立品牌运营', desc: '绑定你自己的域名，设置你自己的品牌名称和Logo，用户完全感知不到主站的存在。' },
                  { title: '自定义二次开发', desc: '源码在手，你可以自由修改界面风格、增加功能模块、调整业务逻辑，打造独一无二的平台。' },
                  { title: '收益100%归你', desc: '自主定价，自由设置会员套餐和充值档位，所有收入直接进入你的账户，无需分成。' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#c2410c]/10 flex items-center justify-center text-[#c2410c] text-lg font-bold" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1 text-[#1a3a2e]">{item.title}</h3>
                      <p className="text-[#6b6b6b] text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="relative">
                <div className="aspect-[4/3] rounded-2xl border border-[#e5d5c0] bg-gradient-to-br from-[#c2410c]/5 to-[#7c3aed]/5 p-8 flex items-center justify-center overflow-hidden">
                  <BaguaRing className="w-64 h-64 text-[#c2410c] opacity-30" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🗂️</div>
                      <p className="text-[#6b6b6b] text-sm">完整源码包</p>
                      <p className="text-[#c2410c] text-xs mt-1 font-medium">一键部署 · 即刻上线</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-[#c2410c]/10 rounded-2xl blur-xl" />
                <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-[#7c3aed]/10 rounded-2xl blur-xl" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ======== 价格方案 ======== */}
      <section id="plans" className="py-24 px-4 bg-[#faf7f2]">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <span className="text-sm text-[#c2410c] tracking-widest uppercase font-medium">Pricing</span>
              <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-4 text-[#1a3a2e]" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                选择适合你的方案
              </h2>
              <p className="text-[#6b6b6b] max-w-xl mx-auto">从免费试用到源码买断，灵活选择，随时升级</p>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className={`relative rounded-2xl p-6 h-full flex flex-col transition-all duration-300 ${
                  plan.highlight
                    ? 'border-2 border-[#c2410c] bg-white shadow-lg shadow-[#c2410c]/10'
                    : 'border border-[#e5d5c0] bg-white hover:shadow-md'
                }`}>
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#c2410c] to-[#e85d2c] text-white text-xs font-bold rounded-full">
                      {plan.badge}
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-1 text-[#1a3a2e]">{plan.name}</h3>
                    <p className="text-[#9a9a9a] text-xs">{plan.desc}</p>
                  </div>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-[#1a3a2e]" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                      {plan.price === '0' ? '免费' : `¥${plan.price}`}
                    </span>
                    {plan.period && <span className="text-[#9a9a9a] text-sm ml-1">{plan.period}</span>}
                  </div>
                  <ul className="space-y-2.5 flex-1 mb-6">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-[#6b6b6b]">
                        <svg className="w-4 h-4 text-[#c2410c] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/contact"
                    className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                      plan.highlight
                        ? 'bg-[#c2410c] text-white hover:bg-[#9a3412] shadow-lg shadow-[#c2410c]/20'
                        : 'border-2 border-[#e5d5c0] text-[#c2410c] hover:border-[#c2410c] hover:bg-[#c2410c]/5'
                    }`}
                  >
                    {plan.price === '0' ? '免费试用' : '立即咨询'}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ======== 部署流程 ======== */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <span className="text-sm text-[#c2410c] tracking-widest uppercase font-medium">Process</span>
              <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-4 text-[#1a3a2e]" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                四步即可上线运营
              </h2>
              <p className="text-[#6b6b6b] max-w-xl mx-auto">从选择方案到正式运营，最快当天即可完成</p>
            </div>
          </Reveal>

          <div className="relative">
            <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-[#c2410c]/20 to-transparent" />

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {STEPS.map((step, i) => (
                <Reveal key={i} delay={i * 150}>
                  <div className="text-center relative">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-white border border-[#e5d5c0] flex items-center justify-center relative shadow-sm">
                      <span className="text-3xl font-bold text-[#c2410c]/15" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                        {step.step}
                      </span>
                      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 96 96">
                        <circle cx="48" cy="48" r="44" fill="none" stroke="currentColor" strokeWidth="1" className="text-[#e5d5c0]" />
                        <circle cx="48" cy="48" r="44" fill="none" stroke="#c2410c" strokeWidth="1.5" strokeDasharray={`${(i + 1) * 69} 276`} strokeLinecap="round" className="opacity-25" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-[#1a3a2e]">{step.title}</h3>
                    <p className="text-[#6b6b6b] text-sm">{step.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ======== 技术栈 ======== */}
      <section className="py-24 px-4 bg-[#faf7f2]">
        <div className="max-w-4xl mx-auto text-center">
          <Reveal>
            <span className="text-sm text-[#c2410c] tracking-widest uppercase font-medium">Tech Stack</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-12 text-[#1a3a2e]" style={{ fontFamily: "'Noto Serif SC', serif" }}>
              现代化技术架构
            </h2>
          </Reveal>

          <Reveal delay={100}>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { name: 'Next.js 15', desc: 'React 全栈框架' },
                { name: 'TypeScript', desc: '类型安全' },
                { name: 'MySQL 8.0', desc: '数据存储' },
                { name: 'Tailwind CSS', desc: '原子化样式' },
                { name: 'PM2', desc: '进程守护' },
                { name: 'Nginx', desc: '反向代理' },
                { name: 'Node.js 20', desc: '运行环境' },
                { name: 'Prisma ORM', desc: '数据库工具' },
              ].map((tech, i) => (
                <div key={i} className="px-5 py-3 rounded-xl border border-[#e5d5c0] bg-white hover:shadow-sm transition-all duration-300">
                  <div className="font-semibold text-sm text-[#1a3a2e]">{tech.name}</div>
                  <div className="text-xs text-[#9a9a9a] mt-0.5">{tech.desc}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ======== FAQ ======== */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <span className="text-sm text-[#c2410c] tracking-widest uppercase font-medium">FAQ</span>
              <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-4 text-[#1a3a2e]" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                常见问题
              </h2>
            </div>
          </Reveal>

          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <Reveal key={i} delay={i * 80}>
                <details className="group rounded-xl border border-[#e5d5c0] bg-white overflow-hidden">
                  <summary className="flex items-center justify-between p-5 cursor-pointer list-none hover:bg-[#faf7f2] transition-colors">
                    <span className="font-medium text-sm text-[#1a3a2e] pr-4">{faq.q}</span>
                    <svg className="w-5 h-5 flex-shrink-0 text-[#9a9a9a] group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-5 pb-5 text-sm text-[#6b6b6b] leading-relaxed">
                    {faq.a}
                  </div>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ======== CTA ======== */}
      <section className="py-24 px-4 bg-[#faf7f2]">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal>
            <div className="relative rounded-3xl border border-[#c2410c]/20 bg-gradient-to-br from-[#c2410c]/5 to-[#7c3aed]/5 p-12 sm:p-16 overflow-hidden">
              <BaguaRing className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] text-[#c2410c] opacity-8" />
              <div className="relative z-10">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-[#1a3a2e]" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                  准备好拥有你自己的命理平台了吗？
                </h2>
                <p className="text-[#6b6b6b] mb-8 max-w-md mx-auto">
                  立即联系我们，获取专属方案建议和技术支持，最快当天即可上线运营。
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/contact"
                    className="px-8 py-4 bg-[#c2410c] text-white font-semibold rounded-xl hover:bg-[#9a3412] transition-all duration-300 shadow-lg shadow-[#c2410c]/20"
                  >
                    立即咨询
                  </Link>
                  <Link
                    href="/membership"
                    className="px-8 py-4 border-2 border-[#e5d5c0] text-[#c2410c] font-semibold rounded-xl hover:border-[#c2410c] hover:bg-[#c2410c]/5 transition-all duration-300"
                  >
                    在线体验
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ======== 底部 ======== */}
      <footer className="py-12 px-4 border-t border-[#e5d5c0]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#9a9a9a]">
          <span>© 2026 知微阁 · 源码部署解决方案</span>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-[#c2410c] transition-colors">服务条款</Link>
            <Link href="/privacy" className="hover:text-[#c2410c] transition-colors">隐私政策</Link>
            <Link href="/contact" className="hover:text-[#c2410c] transition-colors">联系我们</Link>
          </div>
        </div>
      </footer>

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