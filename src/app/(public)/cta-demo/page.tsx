'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

/**
 * 首页底部 CTA 形式对比测试页
 * 方案 1：左右轮播（自动播放 + 手动切换）
 * 方案 2：并排双卡
 * 方案 3：Tab 标签切换
 * 方案 4：上下分区 · 双色区分
 */

// ============ 通用数据 ============
const MEMBER_ITEMS = ['无限排盘', '深度解读', 'PDF报告', '历史记录', '优先客服'];
const PARTNER_ITEMS = ['源码买断 2,980 元', '无限 SaaS 开户', '客户充值即分润', '当天上线', '0 开户费'];

// ============ 方案 1：左右轮播 ============
function CarouselDemo() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIndex(i => (i + 1) % 2), 5000);
    return () => clearInterval(t);
  }, [paused]);

  const go = useCallback((i: number) => setIndex((i + 2) % 2), []);

  const slides = [
    {
      theme: 'red',
      tag: '会员尊享',
      title: '开通会员，解锁全部功能',
      desc: '无限次排盘 · 详细命理解读 · 大运流年分析 · 专属报告导出',
      items: MEMBER_ITEMS,
      btn: '查看会员套餐',
      href: '/membership',
    },
    {
      theme: 'green',
      tag: '创业合作',
      title: '低成本创业 · 快速部署 · 即时赚钱',
      desc: '源码部署独立运营，100% 收益归你 · 单独 SaaS 开户，最高 60% 分润',
      items: PARTNER_ITEMS,
      btn: '了解创业合作计划',
      href: '/partner',
    },
  ];

  return (
    <div className="relative max-w-4xl mx-auto">
      <div
        className="relative overflow-hidden rounded-2xl"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((s, i) => (
            <div key={i} className={`w-full shrink-0 px-10 sm:px-16 py-16 text-center text-white relative ${
              s.theme === 'red'
                ? 'bg-gradient-to-r from-red-950 via-red-800 to-red-950'
                : 'bg-gradient-to-r from-emerald-950 via-emerald-800 to-teal-900'
            }`}>
              <div className="absolute inset-0 bg-hero-pattern opacity-10" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
              <div className="relative z-10">
                <span className="seal-tag-gold mb-6 inline-flex">{s.tag}</span>
                <h2 className="text-3xl sm:text-4xl font-bold mb-4 mt-4">{s.title}</h2>
                <p className={`mb-10 text-lg leading-relaxed ${s.theme === 'red' ? 'text-red-200/80' : 'text-emerald-200/80'}`}>
                  {s.desc}
                </p>
                <div className="flex flex-wrap justify-center gap-4 mb-10">
                  {s.items.map(item => (
                    <span key={item} className="px-5 py-2 bg-white/10 rounded-full text-sm border border-white/20 backdrop-blur-sm">
                      ✓ {item}
                    </span>
                  ))}
                </div>
                <Link href={s.href} className="btn-secondary text-lg px-12 py-4 inline-flex">
                  {s.btn}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* 箭头 */}
        <button
          onClick={() => go(index - 1)}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors text-lg z-20"
          aria-label="上一页"
        >
          ‹
        </button>
        <button
          onClick={() => go(index + 1)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors text-lg z-20"
          aria-label="下一页"
        >
          ›
        </button>
      </div>

      {/* 圆点指示器 */}
      <div className="flex justify-center gap-2 mt-4">
        {slides.map((s, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              index === i ? (s.theme === 'red' ? 'w-8 bg-red-800' : 'w-8 bg-emerald-800') : 'w-2.5 bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`切换到第 ${i + 1} 页`}
          />
        ))}
      </div>
      <p className="text-center text-xs text-gray-400 mt-2">自动播放（5 秒）· 鼠标悬停暂停 · 可手动切换</p>
    </div>
  );
}

// ============ 方案 2：并排双卡 ============
function DualCardDemo() {
  return (
    <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
      {/* 会员卡 */}
      <div className="rounded-2xl overflow-hidden shadow-lg border border-red-100 flex flex-col">
        <div className="relative bg-gradient-to-r from-red-950 via-red-800 to-red-950 px-8 py-10 text-center text-white">
          <div className="absolute inset-0 bg-hero-pattern opacity-10" />
          <div className="relative z-10">
            <span className="seal-tag-gold mb-4 inline-flex">会员尊享</span>
            <h3 className="text-2xl font-bold mt-3">开通会员，解锁全部功能</h3>
            <p className="text-red-200/80 mt-2 text-sm leading-relaxed">无限次排盘 · 深度解读 · 专属报告</p>
          </div>
        </div>
        <div className="bg-white p-8 flex-1 flex flex-col">
          <div className="flex flex-wrap gap-3 mb-8 flex-1 content-start">
            {MEMBER_ITEMS.map(item => (
              <span key={item} className="px-4 py-1.5 bg-red-50 text-red-800 rounded-full text-xs border border-red-100">
                ✓ {item}
              </span>
            ))}
          </div>
          <Link href="/membership" className="btn-secondary w-full justify-center text-base">
            查看会员套餐
          </Link>
        </div>
      </div>

      {/* 创业卡 */}
      <div className="rounded-2xl overflow-hidden shadow-lg border border-emerald-100 flex flex-col">
        <div className="relative bg-gradient-to-r from-emerald-950 via-emerald-800 to-teal-900 px-8 py-10 text-center text-white">
          <div className="absolute inset-0 bg-hero-pattern opacity-10" />
          <div className="relative z-10">
            <span className="seal-tag-gold mb-4 inline-flex">创业合作</span>
            <h3 className="text-2xl font-bold mt-3">低成本创业 · 快速部署 · 即时赚钱</h3>
            <p className="text-emerald-200/80 mt-2 text-sm leading-relaxed">源码部署 100% 收益归你 · SaaS 开户最高 60% 分润</p>
          </div>
        </div>
        <div className="bg-white p-8 flex-1 flex flex-col">
          <div className="flex flex-wrap gap-3 mb-8 flex-1 content-start">
            {PARTNER_ITEMS.map(item => (
              <span key={item} className="px-4 py-1.5 bg-emerald-50 text-emerald-800 rounded-full text-xs border border-emerald-100">
                ✓ {item}
              </span>
            ))}
          </div>
          <Link href="/partner" className="w-full justify-center text-base inline-flex items-center gap-2 py-3 rounded-xl font-semibold text-white transition-all duration-300 bg-gradient-to-r from-emerald-700 to-teal-700 hover:shadow-[0_4px_16px_rgba(4,120,87,0.35)] hover:-translate-y-px">
            了解创业合作计划
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============ 方案 3：Tab 标签切换 ============
function TabDemo() {
  const [tab, setTab] = useState<'member' | 'partner'>('member');
  const isMember = tab === 'member';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Tab 栏 */}
      <div className="flex justify-center gap-2 mb-6">
        {([
          { key: 'member', label: '会员尊享', active: 'text-red-700 border-red-700 bg-red-50', theme: 'red' },
          { key: 'partner', label: '创业合作', active: 'text-emerald-700 border-emerald-700 bg-emerald-50', theme: 'green' },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-8 py-3 rounded-full border text-sm font-medium transition-all duration-300 ${
              tab === t.key ? t.active : 'border-gray-200 text-gray-500 bg-white hover:border-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 内容区 */}
      <div
        className={`relative rounded-2xl px-10 sm:px-16 py-16 text-center text-white overflow-hidden transition-colors duration-500 ${
          isMember
            ? 'bg-gradient-to-r from-red-950 via-red-800 to-red-950'
            : 'bg-gradient-to-r from-emerald-950 via-emerald-800 to-teal-900'
        }`}
      >
        <div className="absolute inset-0 bg-hero-pattern opacity-10" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        <div className="relative z-10">
          <span className="seal-tag-gold mb-6 inline-flex">{isMember ? '会员尊享' : '创业合作'}</span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 mt-4">
            {isMember ? '开通会员，解锁全部功能' : '低成本创业 · 快速部署 · 即时赚钱'}
          </h2>
          <p className={`mb-10 text-lg leading-relaxed ${isMember ? 'text-red-200/80' : 'text-emerald-200/80'}`}>
            {isMember
              ? '无限次排盘 · 详细命理解读 · 大运流年分析 · 专属报告导出'
              : '源码部署独立运营，100% 收益归你 · 单独 SaaS 开户，最高 60% 分润'}
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {(isMember ? MEMBER_ITEMS : PARTNER_ITEMS).map(item => (
              <span key={item} className="px-5 py-2 bg-white/10 rounded-full text-sm border border-white/20 backdrop-blur-sm">
                ✓ {item}
              </span>
            ))}
          </div>
          <Link href={isMember ? '/membership' : '/partner'} className="btn-secondary text-lg px-12 py-4 inline-flex">
            {isMember ? '查看会员套餐' : '了解创业合作计划'}
          </Link>
        </div>
      </div>
      <p className="text-center text-xs text-gray-400 mt-3">点击上方标签切换内容与主题色</p>
    </div>
  );
}

// ============ 方案 4：上下分区 · 双色区分 ============
function StackedDemo() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* 会员区 */}
      <div className="relative rounded-t-2xl bg-gradient-to-r from-red-950 via-red-800 to-red-950 px-10 sm:px-16 py-16 text-center text-white overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-10" />
        <div className="relative z-10">
          <span className="seal-tag-gold mb-6 inline-flex">会员尊享</span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 mt-4">开通会员，解锁全部功能</h2>
          <p className="text-red-200/80 mb-8 text-lg leading-relaxed">无限次排盘 · 详细命理解读 · 大运流年分析 · 专属报告导出</p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {MEMBER_ITEMS.map(item => (
              <span key={item} className="px-5 py-2 bg-white/10 rounded-full text-sm border border-white/20 backdrop-blur-sm">
                ✓ {item}
              </span>
            ))}
          </div>
          <Link href="/membership" className="btn-secondary text-lg px-12 py-4 inline-flex">查看会员套餐</Link>
        </div>
      </div>

      {/* 中间分隔装饰 */}
      <div className="h-3 bg-gradient-to-r from-red-800 via-gold to-emerald-800" />

      {/* 创业区 */}
      <div className="relative rounded-b-2xl bg-gradient-to-r from-emerald-950 via-emerald-800 to-teal-900 px-10 sm:px-16 py-16 text-center text-white overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-10" />
        <div className="relative z-10">
          <span className="seal-tag-gold mb-6 inline-flex">创业合作</span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 mt-4">低成本创业 · 快速部署 · 即时赚钱</h2>
          <p className="text-emerald-200/80 mb-8 text-lg leading-relaxed">源码部署独立运营，100% 收益归你 · 单独 SaaS 开户，最高 60% 分润</p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {PARTNER_ITEMS.map(item => (
              <span key={item} className="px-5 py-2 bg-white/10 rounded-full text-sm border border-white/20 backdrop-blur-sm">
                ✓ {item}
              </span>
            ))}
          </div>
          <Link href="/partner" className="px-12 py-4 inline-flex text-lg font-semibold text-white rounded-xl border border-white/30 hover:bg-white/10 hover:border-white/60 transition-all duration-300">
            了解创业合作计划
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============ 页面 ============
export default function CtaDemoPage() {
  return (
    <div className="min-h-screen bg-[#FDF8F0] text-gray-900" style={{ fontFamily: "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif" }}>
      {/* 页头说明 */}
      <header className="border-b border-[#E8DCC8] bg-white">
        <div className="max-w-5xl mx-auto px-4 py-10 text-center">
          <span className="seal-tag-gold">方案对比测试</span>
          <h1 className="text-3xl font-bold mt-4 mb-3" style={{ fontFamily: "'Noto Serif SC', serif" }}>
            首页底部 CTA 形式对比
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            针对「开通会员」与「创业合作」两个区块背景色过于接近的问题，提供 4 种形式。
            <br />
            <span className="font-semibold text-gray-700">请浏览后回复「选方案 X」，确认后应用到首页。</span>
          </p>
        </div>
      </header>

      <main className="py-16 space-y-24">
        {/* 方案 1 */}
        <section>
          <div className="max-w-4xl mx-auto px-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-8 h-8 rounded-full bg-red-800 text-white flex items-center justify-center font-bold">1</span>
              <h2 className="text-xl font-bold">左右轮播</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">推荐 · 自动播放</span>
            </div>
            <p className="text-sm text-gray-500">两个 CTA 合并为一个轮播组件，5 秒自动切换，可手动翻页；会员与创业使用不同主题色。</p>
          </div>
          <CarouselDemo />
        </section>

        {/* 方案 2 */}
        <section>
          <div className="max-w-4xl mx-auto px-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold">2</span>
              <h2 className="text-xl font-bold">并排双卡</h2>
            </div>
            <p className="text-sm text-gray-500">会员与创业左右并排成两张独立卡片，红金 / 翡翠金两套配色，信息一览无余。</p>
          </div>
          <DualCardDemo />
        </section>

        {/* 方案 3 */}
        <section>
          <div className="max-w-4xl mx-auto px-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-8 h-8 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold">3</span>
              <h2 className="text-xl font-bold">Tab 标签切换</h2>
            </div>
            <p className="text-sm text-gray-500">两个内容共用一个容器，顶部标签切换，主题色随标签变化，页面更紧凑。</p>
          </div>
          <TabDemo />
        </section>

        {/* 方案 4 */}
        <section>
          <div className="max-w-4xl mx-auto px-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-8 h-8 rounded-full bg-amber-800 text-white flex items-center justify-center font-bold">4</span>
              <h2 className="text-xl font-bold">上下分区 · 双色区分</h2>
            </div>
            <p className="text-sm text-gray-500">保留现有上下两个大区块的布局，但会员改为红金、创业改为翡翠金，中间用金色渐变分隔条区分。</p>
          </div>
          <StackedDemo />
        </section>
      </main>

      <footer className="border-t border-[#E8DCC8] bg-white py-8 text-center text-sm text-gray-500">
        知微阁 · CTA 方案对比测试页（/cta-demo）— 选择方案后此页可删除
      </footer>
    </div>
  );
}
