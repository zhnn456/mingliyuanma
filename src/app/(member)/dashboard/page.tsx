'use client';

import { useAuth } from '@/lib/auth-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const memberLevelMap: Record<string, string> = {
  free: '免费用户', monthly: '月卡会员', yearly: '年卡会员', lifetime: '终身会员',
};

export default function DashboardPage() {
  const { user: session, loading } = useAuth();
  const router = useRouter();
  const [points, setPoints] = useState(0);
  const [signed, setSigned] = useState(false);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    if (!loading && !session) { router.push('/login'); return; }
    if (session) {
      fetch('/api/user/points').then(r => r.json()).then(d => setPoints(d.balance || 0)).catch(() => {});
      fetch('/api/user/signin').then(r => r.json()).then(d => setSigned(d.signed || false)).catch(() => {});
    }
  }, [session, loading, router]);

  const handleSignIn = async () => {
    setSigning(true);
    try {
      const res = await fetch('/api/user/signin', { method: 'POST' });
      if (res.ok) { const d = await res.json(); setPoints(d.balance); setSigned(true); }
    } catch {} finally { setSigning(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full" /></div>;
  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment-50 via-paper to-white py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 用户信息卡片 */}
        <div className="card mb-8 relative overflow-hidden">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center text-2xl font-bold text-red-700 border border-red-200 shadow-sm">
                {(session?.name || '?')[0]}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">你好，{session?.name || '用户'}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-gray-500 text-sm">会员等级：</span>
                  <span className={`text-sm font-medium px-3 py-0.5 rounded ${session?.memberLevel === 'free' ? 'bg-gray-100 text-gray-600' : 'bg-gradient-to-r from-gold/20 to-gold/10 text-gold-dark border border-gold/30'}`}>
                    {memberLevelMap[session?.memberLevel || 'free']}
                  </span>
                </div>
              </div>
            </div>
            {session?.memberLevel === 'free' && (
              <Link href="/membership" className="btn-secondary text-sm">升级会员</Link>
            )}
          </div>

          {/* 积分 + 签到 */}
          <div className="border-t border-parchment-100 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-xs text-gray-500">灵珠</span>
                    <div className="text-lg font-bold text-purple-700">{points}</div>
              </div>
              <Link href="/profile/points" className="text-xs text-red-600 hover:text-red-800">明细 →</Link>
            </div>
            <button onClick={handleSignIn} disabled={signed || signing}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${signed ? 'bg-gray-100 text-gray-400 cursor-default' : 'bg-red-700 text-white hover:bg-red-800'}`}>
              {signing ? '签到中...' : signed ? '✅ 已签到' : '🎯 每日签到 +5分'}
            </button>
          </div>
        </div>

        {/* 快捷入口 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { href: '/bazi', icon: '☰', title: '八字排盘', desc: '四柱八字，洞察命运', color: 'from-red-500 to-red-700' },
            { href: '/ziwei', icon: '★', title: '紫微斗数', desc: '紫微十二宫，解析人生', color: 'from-purple-500 to-indigo-700' },
            { href: '/qimen', icon: '◈', title: '奇门遁甲', desc: '三奇八门，择吉避凶', color: 'from-blue-500 to-cyan-700' },
            { href: '/meihua', icon: '✿', title: '梅花易数', desc: '卦象推理，预测未来', color: 'from-pink-500 to-rose-700' },
          ].map(s => (
            <Link key={s.href} href={s.href} className="group card card-hover p-5 text-center">
              <div className={`w-14 h-14 mx-auto rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-2xl text-white shadow-md group-hover:scale-110 transition-transform mb-3`}>{s.icon}</div>
              <div className="font-bold text-gray-900">{s.title}</div>
              <div className="text-xs text-gray-500 mt-1">{s.desc}</div>
            </Link>
          ))}
        </div>

        {/* 供奉入口 */}
        <Link href="/offering" className="card p-6 flex items-center justify-between group hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🙏</div>
            <div>
              <div className="font-bold text-gray-900">在线供奉</div>
              <div className="text-sm text-gray-500">虔诚供奉，积累功德，祈福平安</div>
            </div>
          </div>
          <div className="text-red-700 group-hover:translate-x-1 transition-transform">→</div>
        </Link>
      </div>
    </div>
  );
}
