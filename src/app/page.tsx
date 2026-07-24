import Link from 'next/link';

const services = [
  {
    title: '四柱八字',
    description: '根据出生年月日时，推算天干地支，分析五行旺衰，解读命运密码',
    href: '/bazi',
    icon: '🏛️',
    color: 'from-red-500 to-red-700',
  },
  {
    title: '紫微斗数',
    description: '排列十二宫位星曜，揭示人生各方面运势走向',
    href: '/ziwei',
    icon: '⭐',
    color: 'from-purple-500 to-purple-700',
  },
  {
    title: '奇门遁甲',
    description: '古之帝王之术，预测决策、趋吉避凶',
    href: '/qimen',
    icon: '🔮',
    color: 'from-blue-500 to-blue-700',
  },
  {
    title: '梅花易数',
    description: '以数起卦，以象断事，简洁精准的占卜之术',
    href: '/meihua',
    icon: '🌸',
    color: 'from-pink-500 to-pink-700',
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-red-900 via-red-800 to-red-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 25% 25%, #c8a45c 1px, transparent 1px), radial-gradient(circle at 75% 75%, #c8a45c 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="chinese-gold">命理网</span>
            </h1>
            <p className="text-xl md:text-2xl text-red-100 mb-4">
              传承千年智慧 · 解读命运密码
            </p>
            <p className="text-lg text-red-200 mb-8 max-w-2xl mx-auto">
              融合四柱八字、紫微斗数、奇门遁甲、梅花易数四大传统命理体系，
              为您提供专业精准的命理分析服务
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/bazi" className="btn-secondary text-lg px-8 py-3 inline-block">
                开始排盘
              </Link>
              <Link href="/membership" className="btn-outline text-lg px-8 py-3 inline-block border-white text-white hover:bg-white hover:text-red-900">
                开通会员
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">命理服务</h2>
            <p className="text-gray-600">四大传统命理体系，全方位解读人生</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service) => (
              <Link
                key={service.title}
                href={service.href}
                className="card hover:shadow-xl transition-shadow duration-300 group"
              >
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-red-700 transition-colors">
                  {service.title}
                </h3>
                <p className="text-gray-600 text-sm">{service.description}</p>
                <div className="mt-4 text-red-700 font-medium text-sm">
                  立即体验 →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">为什么选择我们</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📚</span>
              </div>
              <h3 className="text-lg font-bold mb-2">传承经典</h3>
              <p className="text-gray-600 text-sm">
                严格遵循传统命理典籍，算法基于《三命通会》《紫微斗数全书》等经典
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-lg font-bold mb-2">隐私保护</h3>
              <p className="text-gray-600 text-sm">
                您的个人信息和排盘记录严格保密，数据安全有保障
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-bold mb-2">即时计算</h3>
              <p className="text-gray-600 text-sm">
                先进的计算引擎，毫秒级排盘响应，即时获取命理分析结果
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Membership CTA */}
      <section className="py-20 bg-gradient-to-r from-red-800 to-red-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">开通会员，解锁全部功能</h2>
          <p className="text-red-200 mb-8">
            无限次排盘、详细命理解读、大运流年分析、专属报告导出
          </p>
          <Link href="/membership" className="btn-secondary text-lg px-8 py-3 inline-block">
            查看会员套餐
          </Link>
        </div>
      </section>
    </div>
  );
}
