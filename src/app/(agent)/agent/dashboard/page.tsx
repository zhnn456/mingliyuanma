'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-client';
import Link from 'next/link';

interface SaaSDashboardData {
  mode: 'saas';
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

interface SourceDashboardData {
  mode: 'source';
  stats: {
    totalRevenue: number;
    totalOrders: number;
    monthRevenue: number;
    monthOrders: number;
    totalCustomers: number;
    newCustomers: number;
  };
  license: {
    status: 'active' | 'expiring_soon' | 'expired';
    expiryDate: string | null;
    remainingDays: number | null;
    planType: string;
    updateServiceExpiry: string | null;
  };
  recentOrders: any[];
  monthlyTrend: { month: string; amount: number }[];
  agent: { brandName: string; companyName: string; domain: string };
}

type DashboardData = SaaSDashboardData | SourceDashboardData;

export default function AgentDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch('/api/agent/dashboard');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          setError('加载失败');
        }
      } catch {
        setError('网络错误');
      }
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-400">加载中...</div>;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!data) return <div className="text-center py-20 text-gray-400">暂无数据</div>;

  const recentOrders = data.recentOrders || [];
  const monthlyTrend = data.monthlyTrend || [];
  const agent = data.agent;
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

  const licenseStatusMap: Record<string, { label: string; color: string }> = {
    active: { label: '授权有效', color: 'bg-green-100 text-green-800' },
    expiring_soon: { label: '即将到期', color: 'bg-orange-100 text-orange-800' },
    expired: { label: '已过期', color: 'bg-red-100 text-red-800' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            您好{agent?.brandName ? `，${agent.brandName}` : ''} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {data.mode === 'source'
              ? '欢迎回到代理商后台，以下是您的经营数据概览'
              : '欢迎回到代理商后台，以下是您的分润数据概览'}
          </p>
        </div>
      </div>

      {/* 统计卡片 */}
      {data.mode === 'source' ? (
        <SourceStats data={data} />
      ) : (
        <SaaSStats data={data} />
      )}

      {/* 源码部署代理：授权状态 */}
      {data.mode === 'source' && data.license && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800">授权状态</h3>
            <span className={`text-xs px-3 py-1 rounded-full ${licenseStatusMap[data.license.status]?.color || 'bg-gray-100'}`}>
              {licenseStatusMap[data.license.status]?.label || data.license.status}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-500">到期日期</div>
              <div className="font-medium text-gray-900 mt-1">
                {data.license.expiryDate ? new Date(data.license.expiryDate).toLocaleDateString('zh-CN') : '-'}
              </div>
            </div>
            <div>
              <div className="text-gray-500">剩余天数</div>
              <div className="font-medium text-gray-900 mt-1">
                {data.license.remainingDays !== null ? `${data.license.remainingDays} 天` : '-'}
              </div>
            </div>
            <div>
              <div className="text-gray-500">套餐类型</div>
              <div className="font-medium text-gray-900 mt-1">
                {data.license.planType === 'lifetime' ? '终身版' :
                 data.license.planType === 'yearly' ? '年费版' :
                 data.license.planType === 'monthly' ? '月费版' : data.license.planType}
              </div>
            </div>
            <div>
              <div className="text-gray-500">更新服务到期</div>
              <div className="font-medium text-gray-900 mt-1">
                {data.license.updateServiceExpiry ? new Date(data.license.updateServiceExpiry).toLocaleDateString('zh-CN') : '-'}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-bold text-gray-800 mb-4">
            {data.mode === 'source' ? '近6个月收入趋势' : '近6个月分润趋势'}
          </h3>
          <div className="space-y-3">
            {monthlyTrend.length === 0 ? (
              <p className="text-center py-4 text-gray-400 text-sm">暂无数据</p>
            ) : monthlyTrend.map((m) => (
              <div key={m.month}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">{m.month}</span>
                  <span className="font-medium">¥{(m.amount || 0).toFixed(2)}</span>
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
                      {order.productTypeName || order.productType || order.type} · {order.createdAt ? new Date(order.createdAt).toLocaleDateString('zh-CN') : '-'}
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

/** SaaS 代理统计卡片 */
function SaaSStats({ data }: { data: SaaSDashboardData }) {
  const stats = data.stats;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="text-xs text-gray-500 mb-2">本月GMV</div>
        <div className="text-2xl font-bold text-blue-600">¥{(stats.monthCommission || 0).toFixed(2)}</div>
        <div className="text-xs text-gray-400 mt-1">{stats.monthCount || 0} 笔订单</div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="text-xs text-gray-500 mb-2">本月佣金</div>
        <div className="text-2xl font-bold text-green-600">¥{(stats.monthCommission || 0).toFixed(2)}</div>
        <div className="text-xs text-gray-400 mt-1">{stats.monthCount || 0} 笔分润</div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="text-xs text-gray-500 mb-2">待结算佣金</div>
        <div className="text-2xl font-bold text-orange-600">¥{(stats.pendingCommission || 0).toFixed(2)}</div>
        <div className="text-xs text-gray-400 mt-1">{stats.pendingCount || 0} 笔待处理</div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="text-xs text-gray-500 mb-2">累计佣金</div>
        <div className="text-2xl font-bold text-red-600">¥{(stats.totalCommission || 0).toFixed(2)}</div>
        <div className="text-xs text-gray-400 mt-1">含已结算 ¥{(stats.settledCommission || 0).toFixed(2)}</div>
      </div>
    </div>
  );
}

/** 源码部署代理统计卡片 */
function SourceStats({ data }: { data: SourceDashboardData }) {
  const stats = data.stats;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="text-xs text-gray-500 mb-2">总收入</div>
        <div className="text-2xl font-bold text-blue-600">¥{(stats.totalRevenue || 0).toFixed(2)}</div>
        <div className="text-xs text-gray-400 mt-1">{stats.totalOrders || 0} 笔订单</div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="text-xs text-gray-500 mb-2">本月收入</div>
        <div className="text-2xl font-bold text-green-600">¥{(stats.monthRevenue || 0).toFixed(2)}</div>
        <div className="text-xs text-gray-400 mt-1">{stats.monthOrders || 0} 笔订单</div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="text-xs text-gray-500 mb-2">总客户数</div>
        <div className="text-2xl font-bold text-orange-600">{stats.totalCustomers || 0}</div>
        <div className="text-xs text-gray-400 mt-1">累计注册</div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="text-xs text-gray-500 mb-2">本月新增客户</div>
        <div className="text-2xl font-bold text-red-600">{stats.newCustomers || 0}</div>
        <div className="text-xs text-gray-400 mt-1">本月注册</div>
      </div>
    </div>
  );
}
