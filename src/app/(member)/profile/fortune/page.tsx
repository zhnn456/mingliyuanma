'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function FortunePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [fortune, setFortune] = useState<any>(null);
  const [needBazi, setNeedBazi] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetch('/api/user/fortune').then(r => {
      if (r.status === 400) return r.json().then(d => { setNeedBazi(d.needBazi); setLoading(false); });
      return r.json().then(d => { setFortune(d.fortune); setLoading(false); });
    }).catch(() => setLoading(false));
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <Link href="/profile" className="text-sm text-gray-500 hover:text-red-700 mb-4 inline-block">← 返回个人中心</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">今日运势</h1>

      {loading ? <div className="text-center py-20 text-gray-400">加载中...</div> : needBazi ? (
        <div className="card p-8 text-center">
          <div className="text-5xl mb-4">🔮</div>
          <p className="text-gray-600 mb-4">需要先进行一次八字排盘才能生成运势分析</p>
          <Link href="/bazi" className="btn-primary px-6 py-2">去排盘</Link>
        </div>
      ) : fortune ? (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-xs text-gray-500">{new Date(fortune.date).toLocaleDateString('zh-CN')}</div>
              <div className="text-lg font-bold text-gray-900">每日运势</div>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-yellow-50 rounded-full flex items-center justify-center text-3xl">☯</div>
          </div>

          {fortune.content?.overall && (
            <div className="bg-red-50 rounded-xl p-4 mb-4">
              <div className="font-bold text-gray-900 text-sm mb-1">综合运势</div>
              <div className="text-gray-700">{fortune.content.overall}</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'career', label: '事业', icon: '💼', color: 'bg-blue-50' },
              { key: 'wealth', label: '财运', icon: '💰', color: 'bg-green-50' },
              { key: 'health', label: '健康', icon: '🏥', color: 'bg-yellow-50' },
              { key: 'love', label: '感情', icon: '❤️', color: 'bg-pink-50' },
            ].map(item => (
              <div key={item.key} className={`${item.color} rounded-xl p-4`}>
                <div className="text-xs text-gray-500 mb-1">{item.icon} {item.label}</div>
                <div className="text-sm font-medium text-gray-900">{fortune.content[item.key] || '平平'}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-8 text-center text-gray-400">获取运势失败</div>
      )}
    </div>
  );
}
