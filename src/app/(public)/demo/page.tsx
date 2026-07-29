'use client';

import { useState } from 'react';
import Link from 'next/link';

// ========== 数据定义 ==========
const services = [
  { title: '四柱八字', subtitle: 'Four Pillars of Destiny', description: '根据出生年月日时，推算天干地支，分析五行旺衰，解读命运密码', href: '/bazi', icon: '☰', features: ['四柱排盘', '大运流年', '格局分析', '用神取法'] },
  { title: '紫微斗数', subtitle: 'Zi Wei Dou Shu', description: '排列十二宫位星曜，揭示人生各方面运势走向', href: '/ziwei', icon: '★', features: ['十二宫位', '十四主星', '四化飞星', '大运运势'] },
  { title: '奇门遁甲', subtitle: 'Qi Men Dun Jia', description: '古之帝王之术，预测决策、趋吉避凶', href: '/qimen', icon: '◈', features: ['天地人神', '三奇六仪', '十干克应', '用神分析'] },
  { title: '梅花易数', subtitle: 'Mei Hua Yi Shu', description: '以数起卦，以象断事，简洁精准的占卜之术', href: '/meihua', icon: '✿', features: ['六种起卦', '体用分析', '卦象演变', '应期推断'] },
];

const features = [
  { title: '传承经典', desc: '严格遵循《三命通会》《紫微斗数全书》等传统命理典籍，算法经过多位命理师验证' },
  { title: '深度解读', desc: '不止排盘，更有格局分析、大运流年、分领域断语等深度命理解读' },
  { title: '隐私保护', desc: '您的个人信息和排盘记录严格保密，数据加密存储，安全有保障' },
  { title: '即时计算', desc: '先进计算引擎，毫秒级排盘响应，即时获取完整命理分析结果' },
  { title: '专业报告', desc: '可导出精美PDF命理报告，含完整排盘数据和深度解读分析' },
  { title: '多端适配', desc: '完美适配手机、平板、电脑，随时随地查看您的命理分析' },
];

// ========== 设计主题配置 ==========
const themes = [
  {
    id: 'classic',
    name: '经典墨金',
    label: '当前版本',
    hero: {
      bg: 'from-red-950 via-red-900 to-red-950',
      titleGrad: 'text-gradient-gold',
      subtitle: 'text-red-100',
      body: 'text-red-200/80',
    },
    section: {
      label: 'text-gold',
      title: 'text-gray-900',
      desc: 'text-gray-500',
    },
    cta: {
      bg: 'from-red-900 via-red-800 to-red-900',
      seal: '!text-gold !border-gold/40',
    },
    card: {
      bg: 'bg-gradient-to-br from-red-50 to-orange-50',
      icon: 'from-red-600 to-red-800',
      title: 'text-gray-900 group-hover:text-red-700',
    },
  },
  {
    id: 'dark',
    name: '暗黑高奢',
    label: '现代风格',
    hero: {
      bg: 'from-gray-950 via-slate-900 to-gray-950',
      titleGrad: 'bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent',
      subtitle: 'text-amber-100/90',
      body: 'text-gray-400',
    },
    section: {
      label: 'text-amber-400',
      title: 'text-white',
      desc: 'text-gray-400',
    },
    cta: {
      bg: 'from-gray-900 via-slate-800 to-gray-900',
      seal: '!text-amber-400 !border-amber-400/40',
    },
    card: {
      bg: 'bg-gradient-to-br from-gray-800/50 to-gray-900/50',
      icon: 'from-amber-500 to-yellow-600',
      title: 'text-white group-hover:text-amber-300',
    },
  },
  {
    id: 'minimal',
    name: '极简宣纸',
    label: '清新风格',
    hero: {
      bg: 'from-parchment-100 via-white to-parchment-50',
      titleGrad: 'text-gray-800',
      subtitle: 'text-gray-600',
      body: 'text-gray-500',
    },
    section: {
      label: 'text-amber-600',
      title: 'text-gray-800',
      desc: 'text-gray-500',
    },
    cta: {
      bg: 'from-parchment-200 via-parchment-100 to-parchment-200',
      seal: '!text-amber-600 !border-amber-600/40',
    },
    card: {
      bg: 'bg-gradient-to-br from-amber-50/50 to-orange-50/50',
      icon: 'from-amber-600 to-orange-700',
      title: 'text-gray-800 group-hover:text-amber-700',
    },
  },
];

// ========== 图标组件 ==========
const FeatureIcon = ({ color }: { color: string }) => (
  <svg className={`w-7 h-7 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z" />
  </svg>
);

const BoltIcon = () => (
  <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
  </svg>
);

const DeviceIcon = () => (
  <svg className="w-7 h-7 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 18h.01M8 21h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z" />
  </svg>
);

const featureIcons = [
  <FeatureIcon key="0" color="text-red-600" />,
  <FeatureIcon key="1" color="text-purple-600" />,
  <ShieldIcon key="2" />,
  <BoltIcon key="3" />,
  <ChartIcon key="4" />,
  <DeviceIcon key="5" />,
];

const featureColors = [
  'text-red-600 bg-red-50',
  'text-purple-600 bg-purple-50',
  'text-green-600 bg-green-50',
  'text-orange-600 bg-orange-50',
  'text-blue-600 bg-blue-50',
  'text-teal-600 bg-teal-50',
];

// ========== Hero 变体组件 ==========

/** 变体 A: 当前经典版 */
function HeroVariantA({ theme }: { theme: typeof themes[0] }) {
  return (
    <section className={`relative overflow-hidden bg-gradient-to-br ${theme.hero.bg} text-white`}>
      <div className="absolute inset-0 bg-hero-pattern opacity-20" />
      <div className="absolute top-20 left-10 w-80 h-80 bg-gold/5 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-44 relative z-10">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-4">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold/50" />
              <span className="seal-tag-gold !text-gold !border-gold/40 text-xs">千年传承</span>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold/50" />
            </div>
          </div>
          <h1 className="text-6xl md:text-8xl font-bold mb-6 tracking-wide">
            <span className={theme.hero.titleGrad}>命理网</span>
          </h1>
          <p className={`text-2xl md:text-3xl ${theme.hero.subtitle} mb-6 font-kai tracking-widest`}>
            传承千年智慧 · 解读命运密码
          </p>
          <p className={`text-lg ${theme.hero.body} mb-12 max-w-2xl mx-auto leading-relaxed`}>
            融合四柱八字、紫微斗数、奇门遁甲、梅花易数四大传统命理体系，
            为您提供专业精准的命理分析服务
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <Link href="/bazi" className="btn-secondary text-lg px-12 py-4">开始排盘</Link>
            <Link href="/membership" className="px-12 py-4 text-lg font-semibold rounded-[12px] border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all">开通会员</Link>
          </div>
          <div className="mt-20 flex justify-center gap-10 md:gap-20">
            {[{ num: '4大', label: '命理体系' }, { num: '50万+', label: '排盘数据' }, { num: '99.9%', label: '计算精度' }].map((s, i) => (
              <div key={i} className="text-center">
                <div className={`text-4xl font-bold ${theme.hero.titleGrad}`}>{s.num}</div>
                <div className="text-sm text-red-200/60 mt-2">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" className="w-full h-12 fill-[#F7F2E8]"><path d="M0,32L60,32C120,32,240,32,360,37.3C480,43,600,53,720,53.3C840,53,960,43,1080,37.3C1200,32,1320,32,1380,32L1440,32L1440,60L0,60Z" /></svg>
      </div>
    </section>
  );
}

/** 变体 B: 暗黑高奢 - 大图大字，叙事风格 */
function HeroVariantB({ theme }: { theme: typeof themes[0] }) {
  return (
    <section className={`relative overflow-hidden bg-gradient-to-br ${theme.hero.bg} text-white min-h-screen flex items-center`}>
      {/* 粒子背景 */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>
      {/* 光晕 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px]" />
      <div className="absolute top-10 right-20 w-48 h-48 bg-amber-400/10 rounded-full blur-[80px] animate-pulse" />
      <div className="absolute bottom-20 left-10 w-64 h-64 bg-yellow-500/5 rounded-full blur-[100px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10 w-full">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* 左侧文案 */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-400/60" />
              <span className="text-amber-400/80 text-sm tracking-[0.3em] uppercase font-light">MINGLI • 命理</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-[1.1]">
              <span className="block">洞悉命运</span>
              <span className="block mt-2 bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent">掌控人生</span>
            </h1>
            <p className="text-gray-400 text-lg md:text-xl leading-relaxed mb-10 max-w-lg">
              千年玄学智慧，融合现代科技算法。四大命理体系，为您揭开命运的神秘面纱。
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/bazi" className="group inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-bold rounded-full hover:from-amber-400 hover:to-yellow-500 transition-all duration-300 shadow-lg shadow-amber-500/25">
                开始探索
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
              <Link href="/membership" className="inline-flex items-center gap-3 px-10 py-4 border border-white/20 text-white rounded-full hover:bg-white/5 transition-all">
                了解更多
              </Link>
            </div>
            {/* 数据条 */}
            <div className="flex gap-8 mt-16 pt-10 border-t border-white/5">
              {[
                { num: '4', unit: '大', label: '命理体系' },
                { num: '50', unit: '万+', label: '用户信赖' },
                { num: '99.9', unit: '%', label: '计算精度' },
              ].map((s, i) => (
                <div key={i}>
                  <div className="text-3xl font-bold text-white">{s.num}<span className="text-amber-400 text-xl">{s.unit}</span></div>
                  <div className="text-gray-500 text-sm mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          {/* 右侧装饰 */}
          <div className="hidden md:flex justify-center">
            <div className="relative w-80 h-80">
              {/* 八卦环 */}
              <div className="absolute inset-0 animate-spin-slow opacity-20">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                  <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                  {Array.from({ length: 8 }).map((_, i) => {
                    const angle = (i * 45 - 90) * Math.PI / 180;
                    const x = 100 + 80 * Math.cos(angle);
                    const y = 100 + 80 * Math.sin(angle);
                    return (
                      <g key={i}>
                        <line x1="100" y1="100" x2={x} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                        <circle cx={x} cy={y} r="4" fill="rgba(251,191,36,0.3)" />
                      </g>
                    );
                  })}
                </svg>
              </div>
              {/* 中心太极 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-500/20 to-transparent border border-amber-500/20 animate-float">
                  <div className="w-full h-full rounded-full flex items-center justify-center">
                    <span className="text-4xl opacity-30">☯</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** 变体 C: 极简宣纸风 */
function HeroVariantC() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-parchment-100 via-white to-parchment-50 min-h-[90vh] flex items-center">
      {/* 宣纸纹理 */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23noise)\' opacity=\'0.5\'/%3E%3C/svg%3E")' }} />
      {/* 墨迹装饰 */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-radial from-amber-100/40 to-transparent rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-gradient-radial from-amber-100/30 to-transparent rounded-full blur-3xl" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10 text-center">
        <div className="mb-8">
          <span className="inline-block px-6 py-2 text-xs tracking-[0.3em] text-amber-700 border border-amber-300/50 rounded-full bg-amber-50/50">
            传承千年 · 玄学智慧
          </span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 text-gray-800 tracking-wide">
          命理网
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-4 font-kai tracking-widest">
          传承千年智慧 · 解读命运密码
        </p>
        <p className="text-gray-500 max-w-xl mx-auto mb-12 leading-relaxed">
          融合四柱八字、紫微斗数、奇门遁甲、梅花易数四大传统命理体系
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/bazi" className="px-10 py-4 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20">
            开始排盘
          </Link>
          <Link href="/membership" className="px-10 py-4 border border-gray-300 text-gray-700 rounded-full font-medium hover:border-gray-400 hover:bg-white/50 transition-all">
            开通会员
          </Link>
        </div>
        {/* 简约装饰线 */}
        <div className="mt-20 flex items-center justify-center gap-6">
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />
          <div className="flex gap-8">
            {['八字', '紫微', '奇门', '梅花'].map((s) => (
              <span key={s} className="text-gray-400 text-sm tracking-widest">{s}</span>
            ))}
          </div>
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />
        </div>
      </div>
    </section>
  );
}

// ========== Services 变体组件 ==========

/** 服务卡片变体 A: 经典卡片 */
function ServiceCardA({ service, color, theme }: { service: typeof services[0]; color: string; theme: typeof themes[0] }) {
  return (
    <Link href={service.href} className="group relative card card-hover overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className="relative z-10">
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${theme.card.icon} flex items-center justify-center text-3xl text-white mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          {service.icon}
        </div>
        <h3 className={`text-xl font-bold mb-2 ${theme.card.title} transition-colors`}>{service.title}</h3>
        <p className="text-sm text-gray-400 mb-4 tracking-wider uppercase">{service.subtitle}</p>
        <p className="text-gray-600 leading-relaxed mb-5">{service.description}</p>
        <div className="flex flex-wrap gap-2 mb-5">
          {service.features.map((f) => (
            <span key={f} className="px-3 py-1 text-xs bg-gray-50 text-gray-600 rounded-md border border-gray-100">{f}</span>
          ))}
        </div>
        <div className="flex items-center text-red-700 font-medium text-sm group-hover:gap-2 transition-all">
          立即体验
          <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
        </div>
      </div>
    </Link>
  );
}

/** 服务卡片变体 B: 暗黑玻璃态 */
function ServiceCardB({ service, idx }: { service: typeof services[0]; idx: number }) {
  const gradients = ['from-amber-500 to-yellow-600', 'from-violet-500 to-purple-600', 'from-blue-500 to-cyan-600', 'from-pink-500 to-rose-600'];
  const borders = ['border-amber-500/20', 'border-purple-500/20', 'border-cyan-500/20', 'border-rose-500/20'];
  return (
    <Link href={service.href} className={`group relative p-6 rounded-2xl bg-white/5 backdrop-blur-sm border ${borders[idx]} hover:bg-white/10 transition-all duration-300`}>
      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradients[idx]} flex items-center justify-center text-2xl text-white mb-5 shadow-lg`}>
        {service.icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">{service.title}</h3>
      <p className="text-sm text-gray-500 mb-4 tracking-wider">{service.subtitle}</p>
      <p className="text-gray-400 leading-relaxed mb-5">{service.description}</p>
      <div className="flex flex-wrap gap-2 mb-5">
        {service.features.map((f) => (
          <span key={f} className="px-3 py-1 text-xs bg-white/5 text-gray-400 rounded-md border border-white/10">{f}</span>
        ))}
      </div>
      <div className="flex items-center text-amber-400 font-medium text-sm group-hover:gap-2 transition-all">
        立即体验
        <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
      </div>
    </Link>
  );
}

/** 服务卡片变体 C: 极简线条风 */
function ServiceCardC({ service, idx }: { service: typeof services[0]; idx: number }) {
  const icons = ['☰', '★', '◈', '✿'];
  const colors = ['#DC2626', '#7C3AED', '#2563EB', '#E11D48'];
  return (
    <Link href={service.href} className="group relative p-6 rounded-xl bg-white border border-gray-100 hover:border-amber-200 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start gap-4">
        <span className="text-3xl" style={{ color: colors[idx] }}>{icons[idx]}</span>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800 mb-1">{service.title}</h3>
          <p className="text-xs text-gray-400 mb-3 tracking-wider">{service.subtitle}</p>
          <p className="text-sm text-gray-500 leading-relaxed mb-4">{service.description}</p>
          <div className="flex flex-wrap gap-2">
            {service.features.map((f) => (
              <span key={f} className="px-2 py-0.5 text-xs text-gray-400 bg-gray-50 rounded">{f}</span>
            ))}
          </div>
        </div>
        <svg className="w-5 h-5 text-gray-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </div>
    </Link>
  );
}

// ========== 主页面 ==========
const sectionVariants = ['hero', 'services', 'features', 'cta'] as const;
type SectionKey = typeof sectionVariants[number];

export default function DemoPage() {
  const [activeSection, setActiveSection] = useState<SectionKey>('hero');
  const [activeTheme, setActiveTheme] = useState('classic');

  const theme = themes.find(t => t.id === activeTheme) || themes[0];

  return (
    <div className="min-h-screen bg-parchment-50">
      {/* ============ 顶部导航 ============ */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* 左侧标题 */}
            <div>
              <h1 className="text-xl font-bold text-gray-800">首页设计对比 Demo</h1>
              <p className="text-xs text-gray-400 mt-0.5">当前版本 vs 暗黑高奢 vs 极简宣纸</p>
            </div>

            {/* 主题切换 */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">主题：</span>
              <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTheme(t.id)}
                    className={`px-4 py-2 text-xs font-medium rounded-md transition-all ${
                      activeTheme === t.id
                        ? 'bg-white text-gray-800 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t.name}
                    <span className="ml-1 text-[10px] opacity-60">({t.label})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 区域导航 */}
          <div className="flex gap-1 mt-4 border-t border-gray-50 pt-3">
            {sectionVariants.map((key) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
                  activeSection === key
                    ? 'bg-amber-50 text-amber-700'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                {key === 'hero' ? 'Hero 头部' : key === 'services' ? '服务卡片' : key === 'features' ? '特色功能' : 'CTA 行动号召'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ============ 预览区域 ============ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 标题提示 */}
        <div className="mb-8 text-center">
          <p className="text-sm text-gray-400">
            当前预览：<span className="font-medium text-gray-600">
              {activeSection === 'hero' ? 'Hero 头部区域' : activeSection === 'services' ? '服务卡片区域' : activeSection === 'features' ? '特色功能区域' : 'CTA 行动号召区域'}
            </span>
            {' '}· 共 3 种设计风格
          </p>
        </div>

        {/* ===== HERO 区域 ===== */}
        {activeSection === 'hero' && (
          <div className="space-y-12">
            {/* 变体 A */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 text-[10px] font-bold bg-red-900 text-white rounded">A</span>
                  <span className="text-sm font-medium text-gray-700">经典墨金 · 当前版本</span>
                </div>
                <span className="text-[10px] text-gray-400">暗色渐变 + 金色渐变文字 + 波浪分隔</span>
              </div>
              <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                <HeroVariantA theme={theme} />
              </div>
            </div>

            {/* 变体 B */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 text-[10px] font-bold bg-gray-900 text-amber-300 rounded">B</span>
                  <span className="text-sm font-medium text-gray-700">暗黑高奢 · 现代风格</span>
                </div>
                <span className="text-[10px] text-gray-400">左右分栏 + 粒子背景 + 八卦装饰 + 大标题</span>
              </div>
              <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                <HeroVariantB theme={theme} />
              </div>
            </div>

            {/* 变体 C */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 text-[10px] font-bold bg-amber-700 text-white rounded">C</span>
                  <span className="text-sm font-medium text-gray-700">极简宣纸 · 清新风格</span>
                </div>
                <span className="text-[10px] text-gray-400">浅色宣纸纹理 + 居中布局 + 圆角标签</span>
              </div>
              <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                <HeroVariantC />
              </div>
            </div>
          </div>
        )}

        {/* ===== SERVICES 区域 ===== */}
        {activeSection === 'services' && (
          <div className="space-y-12">
            {/* 变体 A */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 text-[10px] font-bold bg-red-900 text-white rounded">A</span>
                  <span className="text-sm font-medium text-gray-700">经典卡片 · 当前版本</span>
                </div>
                <span className="text-[10px] text-gray-400">四列网格 + 圆角卡片 + hover 渐变背景</span>
              </div>
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                <div className="text-center mb-10">
                  <span className="text-gold text-sm font-medium tracking-widest uppercase">SERVICES</span>
                  <h2 className="text-3xl font-bold text-gray-900 mt-2">命理服务</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {services.map((s, i) => (
                    <ServiceCardA key={s.title} service={s} color={['from-red-50 to-orange-50', 'from-purple-50 to-indigo-50', 'from-blue-50 to-cyan-50', 'from-pink-50 to-rose-50'][i]} theme={theme} />
                  ))}
                </div>
              </div>
            </div>

            {/* 变体 B */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 text-[10px] font-bold bg-gray-900 text-amber-300 rounded">B</span>
                  <span className="text-sm font-medium text-gray-700">暗黑玻璃态 · 现代风格</span>
                </div>
                <span className="text-[10px] text-gray-400">毛玻璃效果 + 暗色背景 + 彩色图标</span>
              </div>
              <div className="bg-gray-950 rounded-2xl p-8 border border-gray-800 shadow-sm">
                <div className="text-center mb-10">
                  <span className="text-amber-400 text-sm font-medium tracking-widest uppercase">SERVICES</span>
                  <h2 className="text-3xl font-bold text-white mt-2">命理服务</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {services.map((s, i) => (
                    <ServiceCardB key={s.title} service={s} idx={i} />
                  ))}
                </div>
              </div>
            </div>

            {/* 变体 C */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 text-[10px] font-bold bg-amber-700 text-white rounded">C</span>
                  <span className="text-sm font-medium text-gray-700">极简线条 · 清新风格</span>
                </div>
                <span className="text-[10px] text-gray-400">横向布局 + 白色卡片 + 线条装饰 + 轻阴影</span>
              </div>
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                <div className="text-center mb-10">
                  <span className="text-amber-600 text-sm font-medium tracking-widest uppercase">SERVICES</span>
                  <h2 className="text-3xl font-bold text-gray-800 mt-2">命理服务</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {services.map((s, i) => (
                    <ServiceCardC key={s.title} service={s} idx={i} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== FEATURES 区域 ===== */}
        {activeSection === 'features' && (
          <div className="space-y-12">
            {/* 变体 A */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 text-[10px] font-bold bg-red-900 text-white rounded">A</span>
                  <span className="text-sm font-medium text-gray-700">经典卡片 · 当前版本</span>
                </div>
                <span className="text-[10px] text-gray-400">三列网格 + 图标 + 左图标右文字</span>
              </div>
              <div className="bg-gradient-to-b from-white to-parchment-50 rounded-2xl p-8 border border-gray-200 shadow-sm">
                <div className="text-center mb-10">
                  <span className="text-gold text-sm font-medium tracking-widest uppercase">FEATURES</span>
                  <h2 className="text-3xl font-bold text-gray-900 mt-2">为什么选择我们</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {features.map((f, i) => (
                    <div key={i} className="card hover:shadow-lg transition-shadow duration-300 group">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 ${featureColors[i].split(' ')[1]} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                          {featureIcons[i]}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-gray-900 mb-1">{f.title}</h3>
                          <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 变体 B */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 text-[10px] font-bold bg-gray-900 text-amber-300 rounded">B</span>
                  <span className="text-sm font-medium text-gray-700">暗黑网格 · 现代风格</span>
                </div>
                <span className="text-[10px] text-gray-400">暗色背景 + 边框卡片 + 居中布局</span>
              </div>
              <div className="bg-gray-950 rounded-2xl p-8 border border-gray-800 shadow-sm">
                <div className="text-center mb-10">
                  <span className="text-amber-400 text-sm font-medium tracking-widest uppercase">FEATURES</span>
                  <h2 className="text-3xl font-bold text-white mt-2">为什么选择我们</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {features.map((f, i) => (
                    <div key={i} className="p-6 rounded-xl border border-gray-800 hover:border-amber-500/30 transition-all duration-300 group">
                      <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center mb-4 group-hover:bg-amber-500/10 transition-colors">
                        <div className="text-amber-400">{featureIcons[i]}</div>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 变体 C */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 text-[10px] font-bold bg-amber-700 text-white rounded">C</span>
                  <span className="text-sm font-medium text-gray-700">极简列表 · 清新风格</span>
                </div>
                <span className="text-[10px] text-gray-400">浅色背景 + 无边框 + 小图标 + 紧凑排版</span>
              </div>
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                <div className="text-center mb-10">
                  <span className="text-amber-600 text-sm font-medium tracking-widest uppercase">FEATURES</span>
                  <h2 className="text-3xl font-bold text-gray-800 mt-2">为什么选择我们</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {features.map((f, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-xl hover:bg-amber-50/50 transition-colors">
                      <div className={`w-10 h-10 rounded-lg ${featureColors[i].split(' ')[1]} flex items-center justify-center flex-shrink-0`}>
                        <div className={`w-5 h-5 ${featureColors[i].split(' ')[0]}`}>{featureIcons[i]}</div>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-800 mb-1">{f.title}</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== CTA 区域 ===== */}
        {activeSection === 'cta' && (
          <div className="space-y-12">
            {/* 变体 A */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 text-[10px] font-bold bg-red-900 text-white rounded">A</span>
                  <span className="text-sm font-medium text-gray-700">经典红色 · 当前版本</span>
                </div>
                <span className="text-[10px] text-gray-400">红色渐变背景 + 金色装饰 + 功能标签</span>
              </div>
              <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                <section className="relative overflow-hidden bg-gradient-to-r from-red-900 via-red-800 to-red-900 py-20">
                  <div className="absolute inset-0 bg-hero-pattern opacity-10" />
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
                  <div className="max-w-4xl mx-auto px-4 text-center relative z-10 text-white">
                    <span className="seal-tag-gold !text-gold !border-gold/40 mb-6 inline-flex">会员尊享</span>
                    <h2 className="text-4xl font-bold mb-4 mt-4">开通会员，解锁全部功能</h2>
                    <p className="text-red-200/80 mb-8 text-lg">无限次排盘 · 详细命理解读 · 大运流年分析 · 专属报告导出</p>
                    <div className="flex flex-wrap justify-center gap-3 mb-8">
                      {['无限排盘', '深度解读', 'PDF报告', '历史记录', '优先客服'].map((item) => (
                        <span key={item} className="px-4 py-2 bg-white/10 rounded-full text-sm border border-white/20 backdrop-blur-sm">✓ {item}</span>
                      ))}
                    </div>
                    <Link href="/membership" className="btn-secondary text-lg px-12 py-4 inline-flex">查看会员套餐</Link>
                  </div>
                </section>
              </div>
            </div>

            {/* 变体 B */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 text-[10px] font-bold bg-gray-900 text-amber-300 rounded">B</span>
                  <span className="text-sm font-medium text-gray-700">暗黑渐变 · 现代风格</span>
                </div>
                <span className="text-[10px] text-gray-400">毛玻璃卡片 + 渐变边框 + 左右分栏</span>
              </div>
              <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 py-20">
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '30px 30px' }} />
                  <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px]" />
                  <div className="max-w-5xl mx-auto px-4 relative z-10">
                    <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 md:p-14 border border-white/10">
                      <div className="grid md:grid-cols-2 gap-10 items-center">
                        <div className="text-center md:text-left">
                          <span className="text-amber-400 text-sm tracking-[0.3em] uppercase font-light">MEMBERSHIP</span>
                          <h2 className="text-3xl md:text-4xl font-bold text-white mt-3 mb-4">升级会员<br />解锁全部命理功能</h2>
                          <p className="text-gray-400 mb-6">无限次排盘 · 深度解读 · 专业报告导出</p>
                          <Link href="/membership" className="inline-flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-bold rounded-full hover:from-amber-400 hover:to-yellow-500 transition-all shadow-lg shadow-amber-500/25">
                            查看套餐
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                          </Link>
                        </div>
                        <div className="flex flex-wrap gap-3 justify-center md:justify-end">
                          {['无限排盘', '深度解读', 'PDF报告', '历史记录', '优先客服', '专属优惠'].map((item) => (
                            <span key={item} className="px-4 py-2 bg-white/5 rounded-full text-sm text-gray-300 border border-white/10">✓ {item}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* 变体 C */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 text-[10px] font-bold bg-amber-700 text-white rounded">C</span>
                  <span className="text-sm font-medium text-gray-700">极简宣纸 · 清新风格</span>
                </div>
                <span className="text-[10px] text-gray-400">浅色背景 + 边框装饰 + 简约文案</span>
              </div>
              <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                <section className="relative bg-gradient-to-b from-parchment-100 to-parchment-50 py-20">
                  <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
                    <div className="inline-block px-6 py-2 text-xs tracking-[0.3em] text-amber-700 border border-amber-300/50 rounded-full bg-amber-50/50 mb-6">会员服务</div>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">开通会员，解锁全部功能</h2>
                    <p className="text-gray-500 mb-8">无限次排盘 · 详细命理解读 · 大运流年分析 · 专属报告导出</p>
                    <div className="flex flex-wrap justify-center gap-3 mb-8">
                      {['无限排盘', '深度解读', 'PDF报告', '历史记录', '优先客服'].map((item) => (
                        <span key={item} className="px-4 py-2 bg-white text-gray-600 rounded-full text-sm border border-gray-200 shadow-sm">✓ {item}</span>
                      ))}
                    </div>
                    <Link href="/membership" className="inline-flex items-center gap-3 px-10 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20">
                      查看会员套餐
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </Link>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============ 底部总结 ============ */}
      <footer className="border-t border-gray-200 bg-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
            <div>
              <h4 className="font-bold text-gray-800 mb-3">A · 经典墨金（当前版本）</h4>
              <ul className="space-y-1 text-gray-500">
                <li>• 暗红渐变背景 + 金色渐变文字</li>
                <li>• 四列圆角卡片 + hover 渐变</li>
                <li>• 中式印章装饰元素</li>
                <li>• 波浪 SVG 过渡效果</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 mb-3">B · 暗黑高奢（现代风格）</h4>
              <ul className="space-y-1 text-gray-500">
                <li>• 深色渐变背景 + 粒子纹理</li>
                <li>• 毛玻璃效果 + 渐变边框</li>
                <li>• 八卦太极装饰动画</li>
                <li>• 左右分栏大标题布局</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 mb-3">C · 极简宣纸（清新风格）</h4>
              <ul className="space-y-1 text-gray-500">
                <li>• 宣纸纹理浅色背景</li>
                <li>• 白色卡片 + 轻量边框</li>
                <li>• 圆角标签装饰</li>
                <li>• 居中极简布局</li>
              </ul>
            </div>
          </div>
          <div className="text-center mt-8 text-xs text-gray-400">
            此页面为设计对比 Demo，不影响线上版本。各变体可自由组合使用。
          </div>
        </div>
      </footer>
    </div>
  );
}