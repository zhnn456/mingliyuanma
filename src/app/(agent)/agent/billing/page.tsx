'use client';

import { useState, useEffect } from 'react';

interface PlanInfo {
  key: string;
  name: string;
  price: number;
  durationDays: number;
  maxCustomers: number;
  features: string[];
  current: boolean;
}

interface CurrentPlan {
  plan: string;
  planName: string;
  planExpiry: string | null;
  daysLeft: number;
  expired: boolean;
  maxCustomers: number;
  balance: number;
}

export default function AgentBillingPage() {
  const [current, setCurrent] = useState<CurrentPlan | null>(null);
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [agentLevel, setAgentLevel] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [confirmPlan, setConfirmPlan] = useState<PlanInfo | null>(null);

  const fetchBilling = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agent/billing');
      if (res.ok) {
        const d = await res.json();
        setCurrent(d.current);
        setPlans(d.plans || []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchBilling(); }, []);

  useEffect(() => {
    fetch('/api/agent/settings')
      .then((r) => r.json())
      .then((d) => {
        setAgentLevel(d.agent?.level || 'saas');
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, []);

  const handleSelect = async (key: string) => {
    const plan = plans.find(p => p.key === key);
    if (!plan) return;

    // 付费套餐：弹出付费确认弹窗
    if (plan.price > 0) {
      setConfirmPlan(plan);
      return;
    }

    // 试用版：直接开通
    await doSwitchPlan(key);
  };

  const doSwitchPlan = async (key: string) => {
    setSubmitting(key);
    setMessage(null);
    setConfirmPlan(null);
    try {
      const res = await fetch('/api/agent/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: key }),
      });
      const d = await res.json();
      if (res.ok) {
        setCurrent(d.current);
        setPlans(d.plans || []);
        setMessage({ type: 'success', text: d.message || '套餐切换成功' });
      } else if (res.status === 402) {
        // 余额不足
        setMessage({
          type: 'error',
          text: `余额不足，需要 ¥${d.cost}，当前余额 ¥${d.balance}，差额 ¥${d.shortfall}。请联系平台管理员充值。`
        });
      } else {
        setMessage({ type: 'error', text: d.error || '切换失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误' });
    }
    setSubmitting(null);
  };

  if (checking) {
    return <div className="p-6 text-center text-gray-400">加载中...</div>;
  }
  if (agentLevel === 'source') {
    return (
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-8 text-center">
        <div className="text-4xl mb-3">🔒</div>
        <p className="text-blue-700 font-medium">套餐管理功能仅 SaaS 代理可用，源码部署代理请使用授权管理查看授权状态</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-400">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">套餐管理</h1>
        <p className="text-sm text-gray-500 mt-1">选择适合您的代理商套餐</p>
      </div>

      {/* 当前套餐状态条 */}
      {current && (
        <div className="bg-white rounded-2xl border shadow-sm p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-2xl">📦</div>
            <div>
              <div className="text-sm text-gray-500">当前套餐</div>
              <div className="text-lg font-bold text-gray-900 flex items-center gap-2">
                {current.planName}
                {current.expired && (
                  <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">已过期</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <div className="text-gray-400">到期时间</div>
              <div className="font-medium text-gray-900">
                {current.planExpiry ? new Date(current.planExpiry).toLocaleDateString('zh-CN') : '永久'}
              </div>
            </div>
            <div>
              <div className="text-gray-400">剩余天数</div>
              <div className="font-medium text-gray-900">{current.daysLeft} 天</div>
            </div>
            <div>
              <div className="text-gray-400">客户上限</div>
              <div className="font-medium text-gray-900">{current.maxCustomers} 人</div>
            </div>
            <div>
              <div className="text-gray-400">账户余额</div>
              <div className="font-medium text-gray-900">¥{Number(current.balance || 0).toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div
          className={`rounded-xl p-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 套餐卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((p) => {
          const isCurrent = p.current;
          const isSubmitting = submitting === p.key;
          return (
            <div
              key={p.key}
              className={`rounded-2xl border shadow-sm p-6 flex flex-col transition-all ${
                isCurrent
                  ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">{p.name}</h3>
                {isCurrent && (
                  <span className="text-xs px-2 py-1 bg-teal-500 text-white rounded-full">当前套餐</span>
                )}
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900">¥{p.price}</span>
                <span className="text-sm text-gray-500">/{p.durationDays}天</span>
              </div>
              <div className="mt-1 text-xs text-gray-400">最多 {p.maxCustomers} 位客户</div>

              <ul className="mt-5 space-y-2.5 flex-1">
                {p.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-teal-500 mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelect(p.key)}
                disabled={isCurrent || !!submitting}
                className={`mt-6 w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isCurrent
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60'
                }`}
              >
                {isSubmitting ? '处理中...' : isCurrent ? '当前套餐' : '选择套餐'}
              </button>
            </div>
          );
        })}
      </div>
      {/* 付费确认弹窗 */}
      {confirmPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setConfirmPlan(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="text-4xl mb-2">💳</div>
              <h3 className="text-lg font-bold text-gray-900">套餐升级确认</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">目标套餐</span>
                <span className="font-medium text-gray-900">{confirmPlan.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">套餐价格</span>
                <span className="font-medium text-red-600">¥{confirmPlan.price}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">当前余额</span>
                <span className={`font-medium ${current && current.balance >= confirmPlan.price ? 'text-green-600' : 'text-red-600'}`}>
                  ¥{current ? Number(current.balance).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">扣款后余额</span>
                <span className="font-medium text-gray-900">
                  ¥{current ? Math.max(0, Number(current.balance) - confirmPlan.price).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">有效期</span>
                <span className="font-medium text-gray-900">{confirmPlan.durationDays} 天</span>
              </div>
            </div>
            {current && current.balance < confirmPlan.price ? (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 text-center">
                余额不足，差额 ¥{(confirmPlan.price - Number(current.balance)).toFixed(2)}。请联系平台管理员充值后升级。
              </div>
            ) : (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                确认后将立即从账户余额扣除 ¥{confirmPlan.price}，套餐即时生效。
              </div>
            )}
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmPlan(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              {current && current.balance >= confirmPlan.price ? (
                <button
                  onClick={() => doSwitchPlan(confirmPlan.key)}
                  disabled={!!submitting}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? '处理中...' : '确认扣款升级'}
                </button>
              ) : (
                <button
                  disabled
                  className="flex-1 py-2.5 rounded-xl bg-gray-300 text-gray-500 text-sm cursor-not-allowed"
                >
                  余额不足
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
