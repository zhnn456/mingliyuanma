'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 flex items-center gap-2">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          加载中...
        </div>
      </div>
    );
  }

  if (!session) return null;

  const memberLevelMap: Record<string, string> = {
    free: '免费用户',
    monthly: '月卡会员',
    yearly: '年卡会员',
    lifetime: '终身会员',
  };

  const services = [
    { href: '/bazi', icon: '☰', title: '四柱八字', desc: '排盘分析', gradient: 'from-red-500 to-red-700', bg: 'from-red-50 to-orange-50' },
    { href: '/ziwei', icon: '★', title: '紫微斗数', desc: '命盘排列', gradient: 'from-purple-500 to-indigo-700', bg: 'from-purple-50 to-indigo-50' },
    { href: '/qimen', icon: '◈', title: '奇门遁甲', desc: '起局预测', gradient: 'from-blue-500 to-cyan-700', bg: 'from-blue-50 to-cyan-50' },
    { href: '/meihua', icon: '✿', title: '梅花易数', desc: '数字起卦', gradient: 'from-pink-500 to-rose-700', bg: 'from-pink-50 to-rose-50' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment-50 via-paper to-white py-12">
      <div className="absolute inset-0 bg-mesh-gradient opacity-30 pointer-events-none" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* 用户信息卡片 */}
        <div className="card mb-10 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-gold/5 to-transparent rounded-full blur-2xl" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center text-2xl font-bold text-red-700 border border-red-200 shadow-sm">
                {(session.user?.name || '?')[0]}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 font-kai">
                  你好，{session.user?.name || '用户'}
                </h1>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-gray-500">会员等级：</span>
                  <span className={`font-medium px-3 py-0.5 rounded ${
                    (session.user as any)?.memberLevel === 'free'
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-gradient-to-r from-gold/20 to-gold/10 text-gold-dark border border-gold/30'
                  }`}>
                    {memberLevelMap[(session.user as any)?.memberLevel || 'free']}
                  </span>
                </div>
              </div>
            </div>
            {(session.user as any)?.memberLevel === 'free' && (
              <Link href="/membership" className="btn-secondary">
                升级会员
              </Link>
            )}
          </div>
        </div>

        {/* 功能入口 */}
        <div className="mb-6">
          <div className="section-label">SERVICES</div>
          <h2 className="text-2xl font-bold text-gray-900 font-kai">命理服务</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {services.map((service) => (
            <Link
              key={service.href}
              href={service.href}
              className="group relative card card-hover overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${service.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative z-10">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.gradient} flex items-center justify-center text-2xl text-white mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {service.icon}
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-red-700 transition-colors font-kai text-xl">
                  {service.title}
                </h3>
                <p className="text-gray-500 mt-1.5">{service.desc}</p>
                <div className="flex items-center text-red-700 font-medium text-sm mt-4 group-hover:gap-2 transition-all">
                  立即体验
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 供奉入口 */}
        <div className="mb-3">
          <div className="section-label">BLESSING</div>
          <h2 className="text-xl font-bold text-gray-900 font-kai">供奉祈福</h2>
        </div>
        <Link href="/offering" className="group card card-hover flex items-center gap-5 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-2xl text-white shadow-lg group-hover:scale-110 transition-transform relative z-10">
            🙏
          </div>
          <div className="relative z-10 flex-1">
            <h3 className="font-bold text-gray-900 group-hover:text-red-700 transition-colors font-kai text-xl">在线供奉</h3>
            <p className="text-gray-500 mt-1.5">供奉祈福，积累功德</p>
          </div>
          <svg className="w-5 h-5 text-gray-400 group-hover:text-red-700 group-hover:translate-x-1 transition-all relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
