'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface RechargePackage {
  id: string;
  price: number;
  points: number;
  bonus: number;
  popular?: boolean;
}

const FALLBACK_PACKAGES: RechargePackage[] = [
  { id: 'pkg_10', price: 10, points: 100, bonus: 0 },
  { id: 'pkg_50', price: 50, points: 500, bonus: 20 },
  { id: 'pkg_100', price: 100, points: 1000, bonus: 50, popular: true },
  { id: 'pkg_500', price: 500, points: 5000, bonus: 200 },
];

const PLAN_COLORS: Record<string, string> = {
  pkg_10: 'from-blue-500 to-blue-700',
  pkg_50: 'from-green-500 to-green-700',
  pkg_100: 'from-purple-500 to-purple-700',
  pkg_500: 'from-red-500 to-red-700',
};

export default function RechargePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [packages, setPackages] = useState<RechargePackage[]>(FALLBACK_PACKAGES);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return; // 等 auth 加载完
    if (!user) { router.push('/login?redirect=/profile/recharge'); return; }
    fetch('/api/user/lingzhu').then(r => r.json()).then(d => setBalance(d.balance || 0)).catch(() => {});
    fetch('/api/user/recharge').then(r => r.json()).then(d => {
      if (d.packages?.length) setPackages(d.packages);
    }).catch(() => {});
  }, [user, authLoading, router]);

  if (authLoading) return <div className="text-center py-20 text-gray-400">加载中...</div>;
  if (!user) return null;

  const handleRecharge = async (pkg: RechargePackage) => {
    if (loadingId) return;
    setLoadingId(pkg.id);
    setError('');
    try {
      // 1. 创建充值订单
      const createRes = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'recharge',
          method: 'wechat', // 默认预选微信，用户可在支付页改
          targetId: pkg.id,
        }),
      });
      const data = await createRes.json();
      if (!createRes.ok) {
        setError(data.error || '创建订单失败');
        return;
      }
      // 2. 跳转到支付页，由用户选择支付方式完成支付
      const orderNo = data.order?.orderNo;
      if (!orderNo) {
        setError('订单创建异常，未获取到订单号');
        return;
      }
      router.push(`/pay/${orderNo}`);
    } catch {
      setError('网络错误，请重试');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-10 px-4">
      <Link href="/profile" className="text-sm text-gray-500 hover:text-red-700 mb-4 inline-block">← 返回个人中心</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">积分充值</h1>
      <p className="text-sm text-gray-500 mb-6">1元 = 10积分，充值越多赠送越多</p>

      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 mb-6 text-center border border-purple-200">
        <div className="text-xs text-purple-600">当前积分</div>
        <div className="text-4xl font-bold text-purple-800 mt-1">{balance} 💎</div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {packages.map(pkg => {
          const totalPoints = pkg.points + (pkg.bonus || 0);
          const colorClass = PLAN_COLORS[pkg.id] || 'from-purple-500 to-purple-700';
          const isLoading = loadingId === pkg.id;
          return (
            <div
              key={pkg.id}
              className={`bg-white rounded-xl border-2 p-5 relative ${pkg.popular ? 'border-purple-400 shadow-md' : 'border-gray-200 hover:border-purple-300'} transition-all`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 right-4 bg-purple-600 text-white text-xs px-3 py-0.5 rounded-full">推荐</div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-gray-900">{totalPoints} 积分</div>
                  <div className="text-sm text-gray-500">
                    ¥{pkg.price}
                    {pkg.bonus > 0 && <span className="text-green-600 ml-2">+赠送{pkg.bonus}</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleRecharge(pkg)}
                  disabled={!!loadingId}
                  className={`px-6 py-2.5 rounded-lg text-white text-sm font-medium bg-gradient-to-r ${colorClass} disabled:opacity-50 hover:opacity-90`}
                >
                  {isLoading ? '处理中...' : '购买'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <div className="font-medium mb-1">💡 其他充值方式</div>
        <p className="text-xs text-amber-700">
          · 卡密兑换：前往 <Link href="/profile/redeem" className="underline font-medium">卡密兑换</Link> 页面输入卡密直接充值<br/>
          · PayPal/支付宝：点击购买后可在支付页选择对应支付方式
        </p>
      </div>

      <p className="text-xs text-gray-400 text-center mt-6">
        充值即表示同意
        <a href="/terms" target="_blank" className="text-amber-600 hover:text-amber-700 underline mx-0.5">服务协议</a>
        · 积分仅限本平台使用
      </p>
    </div>
  );
}
