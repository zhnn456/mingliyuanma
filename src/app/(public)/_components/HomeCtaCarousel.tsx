'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

/**
 * 首页底部 CTA 轮播：会员服务 / 创业合作
 * 5 秒自动播放，可手动切换，悬停暂停
 */

const SLIDES = [
  {
    theme: 'red',
    tag: '会员尊享',
    title: '开通会员，解锁全部功能',
    desc: '无限次排盘 · 详细命理解读 · 大运流年分析 · 专属报告导出',
    items: ['无限排盘', '深度解读', 'PDF报告', '历史记录', '优先客服'],
    btn: '查看会员套餐',
    href: '/membership',
  },
  {
    theme: 'green',
    tag: '创业合作',
    title: '低成本创业 · 快速部署 · 即时赚钱',
    desc: '源码部署独立运营，100% 收益归你 · 单独 SaaS 开户，0 元试用、99 元/月起，最高 60% 分润',
    items: ['源码买断 2,980 元', '无限 SaaS 开户', '客户充值即分润', '当天上线', '0 开户费'],
    btn: '了解创业合作计划',
    href: '/partner',
  },
];

export default function HomeCtaCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIndex(i => (i + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, [paused]);

  const go = useCallback((i: number) => setIndex((i + SLIDES.length) % SLIDES.length), []);

  return (
    <section className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <div
          className="relative overflow-hidden rounded-2xl shadow-2xl"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {SLIDES.map((s, i) => (
              <div
                key={i}
                className={`w-full shrink-0 px-10 sm:px-16 py-16 text-center text-white relative ${
                  s.theme === 'red'
                    ? 'bg-gradient-to-r from-red-950 via-red-800 to-red-950'
                    : 'bg-gradient-to-r from-emerald-950 via-emerald-800 to-teal-900'
                }`}
              >
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

          {/* 左右箭头 */}
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
        <div className="flex justify-center gap-2 mt-5">
          {SLIDES.map((s, i) => (
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
      </div>
    </section>
  );
}
