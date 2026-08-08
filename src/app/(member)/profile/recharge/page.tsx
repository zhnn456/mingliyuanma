'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const PLANS = [
  { lingzhu: 100, price: 10, bonus: 0, color: 'from-blue-500 to-blue-700' },
  { lingzhu: 500, price: 50, bonus: 20, color: 'from-green-500 to-green-700' },
  { lingzhu: 1000, price: 100, bonus: 50, color: 'from-purple-500 to-purple-700', popular: true },
  { lingzhu: 5000, price: 500, bonus: 200, color: 'from-red-500 to-red-700' },
];

export default function RechargePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetch('/api/user/lingzhu').then(r => r.json()).then(d => setBalance(d.balance || 0));
  }, [user, router]);

  const handleRecharge = async (plan: typeof PLANS[0]) => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/recharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lingzhu: plan.lingzhu }),
      });
      const d = await res.json();
      if (res.ok) {
        setBalance(d.balance);
        alert(`充值成功！获得 ${d.lingzhu} 灵珠`);
      } else {
        alert(d.error || '充值失败');
      }
    } catch { alert('网络错误'); } finally { setLoading(false); }
  };

  if (!user) return null;

  return (
    <div className="max-w-lg mx-auto py-10 px-4">
      <Link href="/profile" className="text-sm text-gray-500 hover:text-red-700 mb-4 inline-block">← 返回个人中心</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">灵珠充值</h1>
      <p className="text-sm text-gray-500 mb-6">1元 = 10灵珠，充值越多赠送越多</p>

      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 mb-6 text-center border border-purple-200">
        <div className="text-xs text-purple-600">当前灵珠</div>
        <div className="text-4xl font-bold text-purple-800 mt-1">{balance} 💎</div>
      </div>

      <div className="space-y-4">
        {PLANS.map(plan => (
          <div key={plan.lingzhu} className={`bg-white rounded-xl border-2 p-5 relative ${plan.popular ? 'border-purple-400 shadow-md' : 'border-gray-200 hover:border-purple-300'} transition-all`}>
            {plan.popular && (
              <div className="absolute -top-3 right-4 bg-purple-600 text-white text-xs px-3 py-0.5 rounded-full">推荐</div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-gray-900">{plan.lingzhu} 灵珠</div>
                <div className="text-sm text-gray-500">
                  ¥{plan.price}
                  {plan.bonus > 0 && <span className="text-green-600 ml-2">+赠送{plan.bonus}</span>}
                </div>
              </div>
              <button onClick={() => handleRecharge(plan)} disabled={loading}
                className={`px-6 py-2.5 rounded-lg text-white text-sm font-medium bg-gradient-to-r ${plan.color} disabled:opacity-50 hover:opacity-90`}>
                {loading ? '处理中...' : '购买'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center mt-6">
        充值即表示同意
        <a href="/terms" target="_blank" className="text-amber-600 hover:text-amber-700 underline mx-0.5">服务协议</a>
        · 灵珠仅限本平台使用
      </p>
    </div>
  );
}
