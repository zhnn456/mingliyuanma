'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CustomerServiceQR from '@/components/CustomerServiceQR';

/**
 * 卡密兑换页面
 * 用户输入卡密（4-4-4-4 格式，自动添加连字符）进行兑换
 * 兑换成功后显示充值金额，提供返回链接
 */
export default function RedeemPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; type?: string; value?: number; balance?: number } | null>(null);

  // 未登录跳转
  useEffect(() => {
    if (!user) { router.push('/login'); }
  }, [user, router]);

  if (!user) return null;

  // 卡密输入格式化：自动添加连字符（4-4-4-4-4，支持20位卡密）
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 只保留字母数字，转大写
    const raw = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 20);
    // 每 4 位插入连字符
    const formatted = raw.match(/.{1,4}/g)?.join('-') || '';
    setCode(formatted);
    // 清除上次结果
    if (result) setResult(null);
  };

  // 兑换卡密
  const handleRedeem = async () => {
    if (!code) { setResult({ success: false, message: '请输入卡密' }); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/user/redeem-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const d = await res.json();
      if (res.ok) {
        setResult({
          success: true,
          message: d.message || '兑换成功',
          type: d.type,
          value: d.value,
          balance: d.balance,
        });
        setCode('');
      } else {
        setResult({ success: false, message: d.error || '兑换失败' });
      }
    } catch {
      setResult({ success: false, message: '网络错误，请稍后重试' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center gap-8 py-10 px-4">
      <div className="max-w-md flex-1">
        <Link href="/profile" className="text-sm text-gray-500 hover:text-red-700 mb-4 inline-block">← 返回个人中心</Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">卡密兑换</h1>
        <p className="text-sm text-gray-500 mb-6">输入您的卡密进行充值，支持积分卡和代理商余额卡</p>

        {/* 兑换表单 */}
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">卡密代码</label>
            <input
              type="text"
              value={code}
              onChange={handleCodeChange}
              onKeyDown={e => { if (e.key === 'Enter' && !loading) handleRedeem(); }}
              placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
              className="w-full px-4 py-3 border-2 rounded-lg text-center text-lg font-mono font-bold tracking-widest focus:border-purple-400 outline-none uppercase"
              maxLength={24}
              autoComplete="off"
            />
            <p className="text-xs text-gray-400 mt-1">请输入 20 位卡密（无需手动输入连字符）</p>
          </div>

          <button
            onClick={handleRedeem}
            disabled={loading || !code}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:from-purple-700 hover:to-purple-800 transition-colors"
          >
            {loading ? '兑换中...' : '立即兑换'}
          </button>
        </div>

        {/* 兑换结果 */}
        {result && (
          <div className={`mt-4 rounded-xl p-5 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {result.success ? (
              <div className="text-center">
                <div className="text-4xl mb-2">✅</div>
                <div className="font-bold text-green-800 text-lg mb-1">兑换成功</div>
                <div className="text-sm text-green-700 mb-3">{result.message}</div>
                {result.balance !== undefined && (
                  <div className="text-xs text-green-600">
                    {result.type === 'lingzhu' ? `当前积分余额：${result.balance}` : `当前代理商余额：¥${result.balance}`}
                  </div>
                )}
                <div className="mt-4 flex gap-2 justify-center">
                  <Link href="/profile" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">返回个人中心</Link>
                  <button
                    onClick={() => setResult(null)}
                    className="px-4 py-2 border border-green-300 text-green-700 rounded-lg text-sm hover:bg-green-100"
                  >
                    继续兑换
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-4xl mb-2">❌</div>
                <div className="font-bold text-red-800 text-lg mb-1">兑换失败</div>
                <div className="text-sm text-red-700">{result.message}</div>
                <button
                  onClick={() => setResult(null)}
                  className="mt-3 px-4 py-2 border border-red-300 text-red-700 rounded-lg text-sm hover:bg-red-100"
                >
                  重新输入
                </button>
              </div>
            )}
          </div>
        )}

        {/* 说明 */}
        <div className="mt-6 bg-gray-50 rounded-xl p-4 text-xs text-gray-500 space-y-1">
          <div className="font-medium text-gray-600 mb-1">使用说明</div>
          <div>· 积分卡：兑换后增加积分余额，可用于排盘解读</div>
          <div>· 代理商余额卡：仅代理商可使用，兑换后增加代理商余额</div>
          <div>· 卡密为一次性使用，兑换后即失效</div>
          <div>· 如遇问题请联系客服</div>
        </div>
      </div>
      <CustomerServiceQR />
    </div>
  );
}
