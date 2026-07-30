'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-client';
import Link from 'next/link';

interface DashboardData {
  stats: {
    pendingCommission: number;
    settledCommission: number;
    monthCommission: number;
    totalCommission: number;
    monthCount: number;
    pendingCount: number;
  };
  recentOrders: any[];
  monthlyTrend: { month: string; amount: number }[];
  agent: { brandName: string; companyName: string };
}

export default function AgentDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch('/api/agent/dashboard');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {}
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-400">加载中...</div>;

  const stats = data?.stats;
  const recentOrders = data?.recentOrders || [];
  const monthlyTrend = data?.monthlyTrend || [];
  const agent = data?.agent;

  const maxMonthAmount = Math.max(...monthlyTrend.map(m => m.amount), 1);

  const orderStatusMap: Record<string, string> = {
    pending: '待支付', paid: '已支付', failed: '失败', refunded: '已退款',
  };
  const orderStatusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            您好{agent?.brandName ? `，${agent.brandName}` : ''} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">欢迎回到代理商后台，以下是您的分润数据概览</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="text-xs text-gray-500 mb-2">本月GMV</div>
            <div className="text-2xl font-bold text-blue-600">
              ¥{stats.monthCommission.toFixed(2)}
            </div>
            <div className="text-xs text-gray-400 mt-1">{stats.monthCount} 笔订单</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="text-xs text-gray-500 mb-2">本月佣金</div>
            <div className="text-2xl font-bold text-green-600">
              ¥{stats.monthCommission.toFixed(2)}
            </div>
            <div className="text-xs text-gray-400 mt-1">{stats.monthCount} 笔分润</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="text-xs text-gray-500 mb-2">待结算佣金</div>
            <div className="text-2xl font-bold text-orange-600">
              ¥{stats.pendingCommission.toFixed(2)}
            </div>
            <div className="text-xs text-gray-400 mt-1">{stats.pendingCount} 笔待处理</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="text-xs text-gray-500 mb-2">累计佣金</div>
            <div className="text-2xl font-bold text-red-600">
              ¥{stats.totalCommission.toFixed(2)}
            </div>
            <div className="text-xs text-gray-400 mt-1">含已结算 ¥{stats.settledCommission.toFixed(2)}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-bold text-gray-800 mb-4">近6个月分润趋势</h3>
          <div className="space-y-3">
            {monthlyTrend.map((m) => (
              <div key={m.month}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">{m.month}</span>
                  <span className="font-medium">¥{m.amount.toFixed(2)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                    style={{ width: `${(m.amount / maxMonthAmount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-bold text-gray-800 mb-4">最近订单</h3>
          {recentOrders.length === 0 ? (
            <p className="text-center py-8 text-gray-400 text-sm">暂无订单记录</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {order.userEmail || order.userName || '-'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.productTypeName || order.productType} · {order.createdAt ? new Date(order.createdAt).toLocaleDateString('zh-CN') : '-'}
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-sm font-bold text-gray-900">¥{(order.amount || 0).toFixed(2)}</div>
                    <span className={`text-xs px-2 py-0.5 rounded ${orderStatusColor[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {orderStatusMap[order.status] || order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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