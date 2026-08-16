import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '八字排盘·紫微斗数·奇门遁甲·梅花易数 - 在线传统文化智慧平台',
  description: '知微阁提供免费八字排盘、紫微斗数排盘、奇门遁甲排盘、梅花易数起卦等在线工具，融合四柱八字、紫微斗数、奇门遁甲、梅花易数四大传统命理体系，并收录54篇传统文化知识文章。',
  keywords: ['八字排盘', '紫微斗数', '奇门遁甲', '梅花易数', '在线排盘', '算命', '命理', '传统文化', '国学', '知微阁'],
  alternates: {
    canonical: 'https://ming8.online/',
  },
  openGraph: {
    title: '知微阁 - 八字排盘·紫微斗数·奇门遁甲·梅花易数在线工具',
    description: '免费八字排盘、紫微斗数、奇门遁甲、梅花易数在线工具与传统文化知识库。',
    type: 'website',
    locale: 'zh_CN',
    siteName: '知微阁',
    url: 'https://ming8.online/',
  },
};

const siteJsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: '知微阁',
      url: 'https://ming8.online/',
      inLanguage: 'zh-CN',
      description: '提供八字排盘、紫微斗数排盘、奇门遁甲排盘、梅花易数起卦在线工具与传统文化知识库的智慧平台。',
    },
    {
      '@type': 'Organization',
      name: '知微阁',
      url: 'https://ming8.online/',
      description: '以传统文化视角，融合现代科技提供八字、紫微斗数、奇门遁甲、梅花易数排盘与解读服务。',
    },
  ],
});

const services = [
  {
    title: '四柱八字',
    subtitle: 'Four Pillars of Destiny',
    description: '根据出生年月日时排列干支，分析五行能量，提供传统文化视角的性格解读',
    href: '/bazi',
    icon: '☰',
    gradient: 'from-red-600 to-red-800',
    bgGradient: 'from-red-50 to-orange-50',
    features: ['四柱排盘', '大运流年', '格局分析', '用神取法'],
  },
  {
    title: '紫微斗数',
    subtitle: 'Zi Wei Dou Shu',
    description: '排列十二宫位星曜，解读性格特质与文化意象',
    href: '/ziwei',
    icon: '★',
    gradient: 'from-purple-600 to-indigo-700',
    bgGradient: 'from-purple-50 to-indigo-50',
    features: ['十二宫位', '十四主星', '四化飞星', '大限运势'],
  },
  {
    title: '奇门遁甲',
    subtitle: 'Qi Men Dun Jia',
    description: '古典决策智慧的文化展示与娱乐解读',
    href: '/qimen',
    icon: '◈',
    gradient: 'from-blue-600 to-cyan-700',
    bgGradient: 'from-blue-50 to-cyan-50',
    features: ['天地人神', '三奇六仪', '十干克应', '用神分析'],
  },
  {
    title: '梅花易数',
    subtitle: 'Mei Hua Yi Shu',
    description: '以数起卦，以象会意，古典哲学思维的趣味呈现',
    href: '/meihua',
    icon: '✿',
    gradient: 'from-pink-600 to-rose-700',
    bgGradient: 'from-pink-50 to-rose-50',
    features: ['六种起卦', '体用分析', '卦象演变', '应期推断'],
  },
];

const features = [
  { title: '传承经典', icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20', desc: '参考《三命通会》《紫微斗数全书》等传统典籍整理而成', color: 'text-red-600', bg: 'bg-red-50' },
  { title: '深度解读', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z', desc: '不止排盘，更有格局分析、大运流年、分领域断语等深度文化解读', color: 'text-purple-600', bg: 'bg-purple-50' },
  { title: '隐私保护', icon: 'M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z', desc: '您的个人信息和排盘记录严格保密，数据加密存储，安全有保障', color: 'text-green-600', bg: 'bg-green-50' },
  { title: '即时计算', icon: 'M13 10V3L4 14h7v7l9-11h-7z', desc: '先进计算引擎，毫秒级排盘响应，即时获取完整解读结果', color: 'text-orange-600', bg: 'bg-orange-50' },
  { title: '专业报告', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z', desc: '可导出精美PDF文化报告，含完整排盘数据和深度解读分析', color: 'text-blue-600', bg: 'bg-blue-50' },
  { title: '多端适配', icon: 'M12 18h.01M8 21h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z', desc: '完美适配手机、平板、电脑，随时随地查看您的解读内容', color: 'text-teal-600', bg: 'bg-teal-50' },
];

export default function HomePage() {
  return (
    <div>
      {/* 结构化数据：WebSite + Organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: siteJsonLd }}
      />
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-red-950 via-red-900 to-red-950 text-white">
        {/* 背景纹理 */}
        <div className="absolute inset-0 bg-hero-pattern opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-red-950/50" />

        {/* 装饰圆 */}
        <div className="absolute top-20 left-10 w-80 h-80 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-44 relative z-10">
          <div className="text-center">
            {/* 印章装饰 */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center gap-4">
                <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold/50" />
                <span className="seal-tag-gold !text-gold !border-gold/40 text-xs">千年传承</span>
                <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold/50" />
              </div>
            </div>

            <h1 className="text-6xl md:text-8xl font-bold mb-6 tracking-wide">
              <span className="text-gradient-gold">知微阁</span>
            </h1>
            <p className="text-2xl md:text-3xl text-red-100 mb-6 font-kai tracking-widest">
              传承千年智慧 · 解读文化密码
            </p>
            <p className="text-lg text-red-200/80 mb-12 max-w-2xl mx-auto leading-relaxed">
              融合四柱八字、紫微斗数、奇门遁甲、梅花易数四大传统命理体系，
              为您提供专业精准的命理分析服务
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <Link href="/bazi" className="btn-secondary text-lg px-12 py-4">
                开始排盘
              </Link>
              <Link href="/membership" className="px-12 py-4 text-lg font-semibold rounded-[12px] border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all">
                开通会员
              </Link>
            </div>

            {/* 统计数据 */}
            <div className="mt-20 flex justify-center gap-10 md:gap-20">
              {[
                { num: '4大', label: '命理体系' },
                { num: '50万+', label: '排盘数据' },
                { num: '99.9%', label: '计算精度' },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-4xl font-bold text-gradient-gold">{s.num}</div>
                  <div className="text-sm text-red-200/60 mt-2">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 底部波浪过渡 */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full h-12 fill-[#F7F2E8]">
            <path d="M0,32L60,32C120,32,240,32,360,37.3C480,43,600,53,720,53.3C840,53,960,43,1080,37.3C1200,32,1320,32,1380,32L1440,32L1440,60L0,60Z" />
          </svg>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-px w-10 bg-gold/40" />
              <span className="text-gold text-sm font-medium tracking-widest uppercase">SERVICES</span>
              <div className="h-px w-10 bg-gold/40" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">命理服务</h2>
            <p className="text-gray-500 text-lg">四大传统命理体系，全方位解读人生</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, i) => (
              <Link
                key={service.title}
                href={service.href}
                className="group relative card card-hover overflow-hidden"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* 背景渐变 */}
                <div className={`absolute inset-0 bg-gradient-to-br ${service.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="relative z-10">
                  {/* 图标 */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.gradient} flex items-center justify-center text-3xl text-white mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {service.icon}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-red-700 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-sm text-gray-400 mb-4 tracking-wider uppercase">{service.subtitle}</p>
                  <p className="text-gray-600 leading-relaxed mb-5">{service.description}</p>

                  {/* 功能标签 */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {service.features.map((f) => (
                      <span key={f} className="px-3 py-1 text-xs bg-gray-50 text-gray-600 rounded-md border border-gray-100">
                        {f}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center text-red-700 font-medium text-sm group-hover:gap-2 transition-all">
                    立即体验
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-28 bg-gradient-to-b from-white to-parchment-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-px w-10 bg-gold/40" />
              <span className="text-gold text-sm font-medium tracking-widest uppercase">FEATURES</span>
              <div className="h-px w-10 bg-gold/40" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">为什么选择我们</h2>
            <p className="text-gray-500 text-lg">专业、深度、安全、便捷的命理服务平台</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div
                key={i}
                className="card hover:shadow-lg transition-shadow duration-300 group"
              >
                <div className="flex items-start gap-5">
                  <div className={`w-14 h-14 ${feature.bg} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <svg className={`w-7 h-7 ${feature.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={feature.icon} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Membership CTA */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-900 via-red-800 to-red-900" />
        <div className="absolute inset-0 bg-hero-pattern opacity-10" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10 text-white">
          <span className="seal-tag-gold !text-gold !border-gold/40 mb-6 inline-flex">会员尊享</span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 mt-4">开通会员，解锁全部功能</h2>
          <p className="text-red-200/80 mb-10 text-lg leading-relaxed">
            无限次排盘 · 详细命理解读 · 大运流年分析 · 专属报告导出
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {['无限排盘', '深度解读', 'PDF报告', '历史记录', '优先客服'].map((item) => (
              <span key={item} className="px-5 py-2 bg-white/10 rounded-full text-sm border border-white/20 backdrop-blur-sm">
                ✓ {item}
              </span>
            ))}
          </div>
          <Link href="/membership" className="btn-secondary text-lg px-12 py-4 inline-flex">
            查看会员套餐
          </Link>
        </div>
      </section>

      {/* Partner CTA - 创业合作入口 */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-950 via-red-800 to-red-950" />
        <div className="absolute inset-0 bg-hero-pattern opacity-10" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10 text-white">
          <span className="seal-tag-gold !text-gold !border-gold/40 mb-6 inline-flex">创业合作</span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 mt-4">低成本创业 · 快速部署 · 即时赚钱</h2>
          <p className="text-red-200/80 mb-10 text-lg leading-relaxed">
            源码部署独立运营，100% 收益归你 · 单独 SaaS 开户，0 元试用、99 元/月起，最高 60% 分润
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {['源码买断 2,980 元', '无限 SaaS 开户', '客户充值即分润', '当天上线', '0 开户费'].map((item) => (
              <span key={item} className="px-5 py-2 bg-white/10 rounded-full text-sm border border-white/20 backdrop-blur-sm">
                ✓ {item}
              </span>
            ))}
          </div>
          <Link href="/partner" className="btn-secondary text-lg px-12 py-4 inline-flex">
            了解创业合作计划
          </Link>
        </div>
      </section>
    </div>
  );
}
