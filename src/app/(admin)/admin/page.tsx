'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

interface TrendPoint {
  date: string;
  orders: number;
  revenue: number;
}

interface MemberLevel {
  level: string;
  count: number;
}

interface PaipanType {
  type: string;
  count: number;
}

interface RecentUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface RecentOrder {
  id: string;
  orderNo: string;
  userName: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface AdminStats {
  totalUsers: number;
  todayUsers: number;
  totalOrders: number;
  todayOrders: number;
  totalRevenue: number;
  todayRevenue?: number;
  totalPaipan?: number;
  totalOffering?: number;
  totalPoints?: number;
  totalBaziRecords?: number;
  totalZiweiRecords?: number;
  totalQimenRecords?: number;
  totalMeihuaRecords?: number;
  orderTrend?: TrendPoint[];
  revenueTrend?: TrendPoint[];
  memberStats?: MemberLevel[];
  paipanTypeStats?: PaipanType[];
  recentUsers?: RecentUser[];
  recentOrders?: RecentOrder[];
}

interface ApiResponse {
  stats: AdminStats;
}

interface StatCard {
  key: string;
  label: string;
  icon: string;
  color: string;
  isMoney?: boolean;
}

const STAT_CARDS: StatCard[] = [
  { key: 'totalUsers', label: '用户总数', icon: '👥', color: 'bg-blue-500' },
  { key: 'todayUsers', label: '今日新增', icon: '📅', color: 'bg-green-500' },
  { key: 'totalOrders', label: '总订单', icon: '🧾', color: 'bg-purple-500' },
  { key: 'todayOrders', label: '今日订单', icon: '📊', color: 'bg-red-500' },
  { key: 'totalRevenue', label: '总收入', icon: '💰', color: 'bg-yellow-500', isMoney: true },
  { key: 'totalPaipan', label: '排盘总数', icon: '☯️', color: 'bg-mingli-400' },
  { key: 'totalOffering', label: '供奉总数', icon: '🙏', color: 'bg-amber-500' },
  { key: 'totalPoints', label: '积分总数', icon: '⭐', color: 'bg-pink-500' },
];

const QUICK_LINKS = [
  { href: '/admin/users', label: '用户管理', icon: '👥', desc: '查看和管理所有用户' },
  { href: '/admin/orders', label: '订单管理', icon: '🧾', desc: '处理订单和退款' },
  { href: '/admin/revenue', label: '收入统计', icon: '💰', desc: '查看收入和分析' },
  { href: '/admin/agents', label: '代理商', icon: '🤝', desc: '管理二级代理商' },
  { href: '/admin/rules', label: '排盘规则', icon: '📖', desc: '管理命理规则库' },
  { href: '/admin/coupons', label: '优惠券', icon: '🎟️', desc: '发布和管理优惠券' },
  { href: '/admin/points', label: '积分管理', icon: '⭐', desc: '管理积分规则和发放' },
  { href: '/admin/config', label: '系统设置', icon: '⚙️', desc: '配置系统参数' },
];

const ORDER_STATUS_MAP: Record<string, string> = {
  pending: '待支付',
  paid: '已支付',
  failed: '失败',
  refunded: '已退款',
};

const ORDER_STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-600',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiResponse = await res.json();
      setStats(data.stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const maxOrders = useMemo(() => {
    if (!stats?.orderTrend?.length) return 0;
    return Math.max(...stats.orderTrend.map((p) => p.orders), 1);
  }, [stats]);

  const maxRevenue = useMemo(() => {
    if (!stats?.revenueTrend?.length) return 0;
    return Math.max(...stats.revenueTrend.map((p) => p.revenue), 1);
  }, [stats]);

  const maxMemberCount = useMemo(() => {
    if (!stats?.memberStats?.length) return 0;
    return Math.max(...stats.memberStats.map((m) => m.count), 1);
  }, [stats]);

  const totalPaipan = useMemo(() => {
    if (!stats?.paipanTypeStats?.length) return 0;
    return stats.paipanTypeStats.reduce((sum, p) => sum + p.count, 0) || 1;
  }, [stats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mr-3" />
        加载中...
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-20">
        <div className="text-red-500 mb-4">加载失败：{error || '未知错误'}</div>
        <button onClick={loadStats} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">管理员控制台</h1>
          <p className="text-sm text-gray-500 mt-1">
            欢迎回来，以下是平台运营概览
          </p>
        </div>
        <button
          onClick={loadStats}
          className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <span>🔄</span>
          <span>刷新</span>
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.map((card) => {
          const raw = (stats as unknown as Record<string, number>)[card.key];
          const value = card.isMoney
            ? `¥${(raw || 0).toFixed(2)}`
            : raw ?? 0;
          return (
            <div
              key={card.key}
              className="bg-white rounded-xl p-5 shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center text-white text-lg shrink-0`}
                >
                  {card.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-gray-500 truncate">{card.label}</div>
                  <div className="text-xl font-bold text-gray-900 truncate">{value}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 趋势图区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 订单趋势 */}
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <h2 className="font-bold text-gray-900 mb-4">最近 7 天订单趋势</h2>
          {stats.orderTrend && stats.orderTrend.length > 0 ? (
            <div className="flex items-end gap-2 h-48">
              {stats.orderTrend.map((p) => {
                const h = maxOrders > 0 ? (p.orders / maxOrders) * 100 : 0;
                return (
                  <div key={p.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <div className="text-xs text-gray-600 font-semibold">
                      {p.orders}
                    </div>
                    <div
                      className="w-full bg-gradient-to-t from-red-400 to-red-300 rounded-t transition-all"
                      style={{ height: `${h}%`, minHeight: p.orders > 0 ? '4px' : '0' }}
                      title={`${p.date}: ${p.orders} 订单`}
                    />
                    <div className="text-xs text-gray-500 truncate w-full text-center">
                      {p.date.slice(5)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-12 text-sm">暂无数据</div>
          )}
        </div>

        {/* 收入趋势 */}
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <h2 className="font-bold text-gray-900 mb-4">最近 7 天收入趋势</h2>
          {stats.revenueTrend && stats.revenueTrend.length > 0 ? (
            <div className="flex items-end gap-2 h-48">
              {stats.revenueTrend.map((p) => {
                const h = maxRevenue > 0 ? (p.revenue / maxRevenue) * 100 : 0;
                return (
                  <div key={p.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <div className="text-xs text-gray-600 font-semibold">
                      ¥{p.revenue.toFixed(0)}
                    </div>
                    <div
                      className="w-full bg-gradient-to-t from-green-400 to-green-300 rounded-t transition-all"
                      style={{ height: `${h}%`, minHeight: p.revenue > 0 ? '4px' : '0' }}
                      title={`${p.date}: ¥${p.revenue.toFixed(2)}`}
                    />
                    <div className="text-xs text-gray-500 truncate w-full text-center">
                      {p.date.slice(5)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-12 text-sm">暂无数据</div>
          )}
        </div>
      </div>

      {/* 分布图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 会员等级分布 */}
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <h2 className="font-bold text-gray-900 mb-4">会员等级分布</h2>
          {stats.memberStats && stats.memberStats.length > 0 ? (
            <div className="space-y-3">
              {stats.memberStats.map((m) => {
                const pct = (m.count / maxMemberCount) * 100;
                return (
                  <div key={m.level} className="flex items-center gap-3">
                    <span className="w-24 text-sm text-gray-600 shrink-0">{m.level}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div
                        className="bg-red-500 h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-700 w-14 text-right">
                      {m.count}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8 text-sm">暂无数据</div>
          )}
        </div>

        {/* 排盘类型分布 */}
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <h2 className="font-bold text-gray-900 mb-4">排盘类型分布</h2>
          {stats.paipanTypeStats && stats.paipanTypeStats.length > 0 ? (
            <div className="space-y-3">
              {stats.paipanTypeStats.map((p) => {
                const pct = (p.count / totalPaipan) * 100;
                const colorMap: Record<string, string> = {
                  '八字': 'bg-blue-500',
                  '紫微': 'bg-purple-500',
                  '奇门': 'bg-green-500',
                  '梅花': 'bg-pink-500',
                };
                const barColor = colorMap[p.type] || 'bg-gray-500';
                return (
                  <div key={p.type} className="flex items-center gap-3">
                    <span className="w-24 text-sm text-gray-600 shrink-0">{p.type}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div
                        className={`${barColor} h-full rounded-full transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-700 w-20 text-right">
                      {p.count} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8 text-sm">暂无数据</div>
          )}
        </div>
      </div>

      {/* 最新动态 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 最近用户 */}
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">最近用户</h2>
            <Link href="/admin/users" className="text-xs text-red-500 hover:underline">
              查看全部 →
            </Link>
          </div>
          {stats.recentUsers && stats.recentUsers.length > 0 ? (
            <div className="space-y-3">
              {stats.recentUsers.slice(0, 5).map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 py-2 border-b last:border-0"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
                    {(u.name || u.email || '?').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {u.name || u.email}
                    </div>
                    <div className="text-xs text-gray-500">
                      {u.email}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 shrink-0">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('zh-CN') : '-'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8 text-sm">暂无用户</div>
          )}
        </div>

        {/* 最近订单 */}
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">最近订单</h2>
            <Link href="/admin/orders" className="text-xs text-red-500 hover:underline">
              查看全部 →
            </Link>
          </div>
          {stats.recentOrders && stats.recentOrders.length > 0 ? (
            <div className="space-y-3">
              {stats.recentOrders.slice(0, 5).map((o) => (
                <div
                  key={o.id}
                  className="flex items-center gap-3 py-2 border-b last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {o.userName || '-'}
                      <span className="ml-2 text-xs text-gray-500">{o.type}</span>
                    </div>
                    <div className="text-xs text-gray-400 font-mono truncate">
                      {o.orderNo}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-gray-900">
                      ¥{(o.amount || 0).toFixed(2)}
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${ORDER_STATUS_COLOR[o.status] || ''}`}
                    >
                      {ORDER_STATUS_MAP[o.status] || o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8 text-sm">暂无订单</div>
          )}
        </div>
      </div>

      {/* 快捷入口 */}
      <div>
        <h2 className="font-bold text-gray-900 mb-4">快捷入口</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {QUICK_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white rounded-xl p-5 shadow-sm border hover:shadow-md transition-all hover:border-red-200 hover:-translate-y-0.5"
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="font-bold text-gray-900 text-sm">{item.label}</div>
              <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
