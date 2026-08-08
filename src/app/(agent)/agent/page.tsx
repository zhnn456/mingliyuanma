'use client';

import { useAuth } from '@/lib/auth-client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AgentStats {
  agent: any;
  license: any;
  stats: {
    customerCount: number;
    totalOrders: number;
    todayOrders: number;
    totalRevenue: number;
    records: { bazi: number; ziwei: number; qimen: number; meihua: number; total: number };
    todayRecords: { bazi: number; ziwei: number; qimen: number; meihua: number; total: number };
  };
}

interface CommissionStats {
  monthCommission: number;
  pendingCommission: number;
  settledCommission: number;
  totalCommission: number;
}

export default function AgentHomePage() {
  const { user: session } = useAuth();
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [commission, setCommission] = useState<CommissionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.role === 'agent') {
      loadOverview();
      loadCommission();
    } else {
      setLoading(false);
    }
  }, [session]);

  const loadOverview = async () => {
    try {
      const res = await fetch('/api/agent/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {}
    setLoading(false);
  };

  const loadCommission = async () => {
    try {
      const res = await fetch('/api/agent/commissions?pageSize=1');
      if (res.ok) {
        const data = await res.json();
        if (data.stats) setCommission(data.stats);
      }
    } catch {}
  };

  if (!session) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h1>
        <Link href="/login" className="text-blue-600 hover:underline">去登录</Link>
      </div>
    );
  }

  if (loading) return <div className="text-center py-20 text-gray-400">加载中...</div>;

  if (!stats) return <div className="text-center py-20 text-gray-400">暂无数据</div>;

  return (
    <div className="space-y-6">
      {/* 欢迎信息 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          您好{stats.agent?.brandName ? `，${stats.agent.brandName}` : ''} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">欢迎回到代理商后台，以下是您的数据概览</p>
      </div>

      {/* 授权状态卡片 */}
      {stats.agent && (
        <div className={`p-4 rounded-xl border ${stats.agent.isActive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${stats.agent.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium text-gray-700">
                授权状态：{stats.agent.isActive ? '正常' : '已禁用'}
              </span>
              {stats.agent.licenseExpiry && (
                <span className="text-xs text-gray-500">
                  到期：{new Date(stats.agent.licenseExpiry).toLocaleDateString('zh-CN')}
                </span>
              )}
            </div>
            <Link href="/agent/settings" className="text-xs text-blue-600 hover:underline">
              查看授权详情 →
            </Link>
          </div>
        </div>
      )}

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: '客户总数', value: stats.stats.customerCount, color: 'text-blue-600', icon: '👥' },
          { label: '总订单', value: stats.stats.totalOrders, color: 'text-purple-600', icon: '📦' },
          { label: '今日订单', value: stats.stats.todayOrders, color: 'text-orange-600', icon: '📈' },
          { label: '总收入', value: `¥${stats.stats.totalRevenue.toFixed(0)}`, color: 'text-red-600', icon: '💰' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border p-5 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-xs text-gray-500 mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* 收益概览 */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">收益概览</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: '本月分润', value: `¥${(commission?.monthCommission || 0).toFixed(2)}`, color: 'text-blue-600', icon: '📅' },
            { label: '待结算金额', value: `¥${(commission?.pendingCommission || 0).toFixed(2)}`, color: 'text-amber-600', icon: '⏳' },
            { label: '可提现余额', value: `¥${(commission?.settledCommission || 0).toFixed(2)}`, color: 'text-green-600', icon: '💳' },
            { label: '累计收益', value: `¥${(commission?.totalCommission || 0).toFixed(2)}`, color: 'text-purple-600', icon: '🏆' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl shadow-sm border p-5 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xs text-gray-500 mb-1">{s.label}</div>
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 快捷操作 */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">快捷操作</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link href="/agent/invite" className="bg-white rounded-xl shadow-sm border p-4 text-center hover:border-blue-300 transition-colors">
            <div className="text-3xl mb-2">🙋</div>
            <div className="text-sm font-medium text-gray-700">邀请用户</div>
          </Link>
          <Link href="/agent/billing" className="bg-white rounded-xl shadow-sm border p-4 text-center hover:border-blue-300 transition-colors">
            <div className="text-3xl mb-2">📦</div>
            <div className="text-sm font-medium text-gray-700">套餐管理</div>
          </Link>
          <Link href="/agent/commissions" className="bg-white rounded-xl shadow-sm border p-4 text-center hover:border-blue-300 transition-colors">
            <div className="text-3xl mb-2">💰</div>
            <div className="text-sm font-medium text-gray-700">分润记录</div>
          </Link>
          <Link href="/agent/settings" className="bg-white rounded-xl shadow-sm border p-4 text-center hover:border-blue-300 transition-colors">
            <div className="text-3xl mb-2">⚙️</div>
            <div className="text-sm font-medium text-gray-700">代理设置</div>
          </Link>
        </div>
      </div>

      {/* 排盘统计 + 授权摘要 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-bold text-gray-800 mb-3">排盘统计</h3>
          <div className="space-y-3">
            {[
              { name: '四柱八字', total: stats.stats.records.bazi, today: stats.stats.todayRecords.bazi, color: 'bg-red-500' },
              { name: '紫微斗数', total: stats.stats.records.ziwei, today: stats.stats.todayRecords.ziwei, color: 'bg-purple-500' },
              { name: '奇门遁甲', total: stats.stats.records.qimen, today: stats.stats.todayRecords.qimen, color: 'bg-blue-500' },
              { name: '梅花易数', total: stats.stats.records.meihua, today: stats.stats.todayRecords.meihua, color: 'bg-pink-500' },
            ].map(r => {
              const max = Math.max(stats.stats.records.bazi, stats.stats.records.ziwei, stats.stats.records.qimen, stats.stats.records.meihua, 1);
              return (
                <div key={r.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{r.name}</span>
                    <span className="font-medium">{r.total} <span className="text-xs text-gray-400">(今日{r.today})</span></span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${r.color} rounded-full transition-all`} style={{ width: `${(r.total / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-bold text-gray-800 mb-3">授权信息</h3>
          {stats.license ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">最大用户数</span>
                <span className="font-medium">{stats.license.maxUsers || '无限'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">到期时间</span>
                <span className="font-medium">{stats.license.expiryAt ? new Date(stats.license.expiryAt).toLocaleDateString('zh-CN') : '永久'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">已开通功能</span>
                <span className="font-medium">
                  {Array.isArray(stats.license.features) ? stats.license.features.join('、') : '全部'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">授权密钥</span>
                <span className="font-mono text-xs text-gray-700">{stats.license.licenseKey?.slice(0, 20)}...</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">暂无有效授权</p>
          )}
          <div className="mt-3">
            <Link href="/agent/settings" className="text-xs text-blue-600 hover:underline">
              前往代理设置查看完整信息 →
            </Link>
          </div>
        </div>
      </div>

      {/* 快捷入口 */}
      <div className="grid grid-cols-3 gap-4">
        <Link href="/agent/agent-orders" className="bg-white rounded-xl shadow-sm border p-4 text-center hover:border-blue-300 transition-colors">
          <div className="text-3xl mb-2">🧾</div>
          <div className="text-sm font-medium text-gray-700">我的订单</div>
        </Link>
        <Link href="/agent/commissions" className="bg-white rounded-xl shadow-sm border p-4 text-center hover:border-blue-300 transition-colors">
          <div className="text-3xl mb-2">💰</div>
          <div className="text-sm font-medium text-gray-700">分润记录</div>
        </Link>
        <Link href="/agent/agent-settlements" className="bg-white rounded-xl shadow-sm border p-4 text-center hover:border-blue-300 transition-colors">
          <div className="text-3xl mb-2">🏦</div>
          <div className="text-sm font-medium text-gray-700">结算中心</div>
        </Link>
      </div>
    </div>
  );
}
