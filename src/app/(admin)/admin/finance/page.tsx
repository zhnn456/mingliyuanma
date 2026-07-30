'use client';

import { useState, useEffect, useMemo } from 'react';

interface RevenueTrendPoint {
  date: string;
  revenue: number;
  orders: number;
  avgOrderValue: number;
}

interface RevenueByType {
  type: string;
  amount: number;
  count: number;
  percentage: number;
}

interface RevenueByPayment {
  method: string;
  amount: number;
  count: number;
  percentage: number;
}

interface FinanceData {
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  totalRevenue: number;
  totalOrders: number;
  payingUsers: number;
  avgOrderValue: number;
  refundRate: number;
  refundedOrders: number;
  refundAmount: number;
  revenueByType: RevenueByType[];
  revenueByPaymentMethod: RevenueByPayment[];
  revenueTrend: RevenueTrendPoint[];
  range: { start: string; end: string; days: number };
}

const TYPE_LABELS: Record<string, string> = {
  membership: '会员',
  offering: '供奉',
  pdf_report: 'PDF报告',
};

const TYPE_COLORS: Record<string, string> = {
  membership: 'bg-blue-500',
  offering: 'bg-amber-500',
  pdf_report: 'bg-purple-500',
};

const PAYMENT_LABELS: Record<string, string> = {
  wechat: '微信支付',
  alipay: '支付宝',
  stripe: 'Stripe',
  paypal: 'PayPal',
  bank_transfer: '银行转账',
};

const PAYMENT_COLORS: Record<string, string> = {
  wechat: 'bg-green-500',
  alipay: 'bg-blue-500',
  stripe: 'bg-indigo-500',
  paypal: 'bg-sky-500',
  bank_transfer: 'bg-gray-500',
};

const STAT_CARDS = [
  { key: 'todayRevenue', label: '今日收入', icon: '📅', color: 'bg-red-500' },
  { key: 'weekRevenue', label: '本周收入', icon: '📆', color: 'bg-orange-500' },
  { key: 'monthRevenue', label: '本月收入', icon: '🗓️', color: 'bg-purple-500' },
  { key: 'totalRevenue', label: '总收入', icon: '💰', color: 'bg-yellow-500' },
];

const QUICK_RANGES = [
  { days: 7, label: '7天' },
  { days: 30, label: '30天' },
  { days: 90, label: '90天' },
];

export default function AdminFinancePage() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (showCustom && customStart && customEnd) {
        params.set('startDate', customStart);
        params.set('endDate', customEnd);
      } else {
        params.set('days', String(days));
      }
      const res = await fetch(`/api/admin/finance?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [days, showCustom, customStart, customEnd]);

  const maxRevenue = useMemo(() => {
    if (!data?.revenueTrend?.length) return 0;
    return Math.max(...data.revenueTrend.map((p) => p.revenue), 1);
  }, [data]);

  const maxTypeAmount = useMemo(() => {
    if (!data?.revenueByType?.length) return 0;
    return Math.max(...data.revenueByType.map((t) => t.amount), 1);
  }, [data]);

  const maxPaymentAmount = useMemo(() => {
    if (!data?.revenueByPaymentMethod?.length) return 0;
    return Math.max(...data.revenueByPaymentMethod.map((p) => p.amount), 1);
  }, [data]);

  const handleExport = () => {
    if (!data) return;
    const headers = ['日期', '收入', '订单数', '客单价'];
    const rows = data.revenueTrend.map((p) => [
      p.date,
      p.revenue.toFixed(2),
      p.orders,
      p.avgOrderValue.toFixed(2),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-report-${data.range.start}-${data.range.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mr-3" />
        加载中...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <div className="text-red-500 mb-4">加载失败：{error || '未知错误'}</div>
        <button onClick={loadData} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">收入总览</h1>
          <p className="text-sm text-gray-500 mt-1">
            财务统计数据分析 ({data.range.start} 至 {data.range.end})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white border rounded-lg p-1">
            {QUICK_RANGES.map((r) => (
              <button
                key={r.days}
                onClick={() => { setDays(r.days); setShowCustom(false); }}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  !showCustom && days === r.days
                    ? 'bg-red-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowCustom(!showCustom)}
            className={`px-3 py-1.5 text-xs border rounded-lg ${
              showCustom ? 'bg-red-500 text-white border-red-500' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            自定义
          </button>
          <button
            onClick={loadData}
            className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50 flex items-center gap-1"
          >
            <span>🔄</span>
            <span>刷新</span>
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-1.5 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-1"
          >
            <span>📥</span>
            <span>导出</span>
          </button>
        </div>
      </div>

      {showCustom && (
        <div className="flex items-center gap-2 bg-white border rounded-lg p-3">
          <span className="text-sm text-gray-600">自定义时间范围：</span>
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="px-3 py-1.5 border rounded-lg text-sm"
          />
          <span className="text-gray-400">至</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="px-3 py-1.5 border rounded-lg text-sm"
          />
          <button
            onClick={() => { if (customStart && customEnd) loadData(); }}
            className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            应用
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.map((card) => {
          const raw = (data as unknown as Record<string, number>)[card.key];
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
                  <div className="text-xl font-bold text-gray-900 truncate">
                    ¥{(raw || 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="text-xs text-gray-500 mb-1">总订单数</div>
          <div className="text-2xl font-bold text-gray-900">{data.totalOrders}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="text-xs text-gray-500 mb-1">付费用户数</div>
          <div className="text-2xl font-bold text-gray-900">{data.payingUsers}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="text-xs text-gray-500 mb-1">客单价</div>
          <div className="text-2xl font-bold text-gray-900">¥{data.avgOrderValue.toFixed(2)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="text-xs text-gray-500 mb-1">退款率</div>
          <div className="text-2xl font-bold text-orange-500">{data.refundRate.toFixed(2)}%</div>
          <div className="text-xs text-gray-500 mt-1">{data.refundedOrders} 笔退款</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="text-xs text-gray-500 mb-1">退款金额</div>
          <div className="text-2xl font-bold text-red-500">¥{data.refundAmount.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="text-xs text-gray-500 mb-1">总收入 / 退款净额</div>
          <div className="text-2xl font-bold text-green-600">
            ¥{(data.totalRevenue - data.refundAmount).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">收入趋势（最近 {data.range.days} 天）</h2>
          <div className="text-xs text-gray-500">
            峰值：¥{maxRevenue.toFixed(2)}
          </div>
        </div>
        {data.revenueTrend.length > 0 ? (
          <div className="flex items-end gap-1 h-56 overflow-x-auto pb-2">
            {data.revenueTrend.map((p) => {
              const h = maxRevenue > 0 ? (p.revenue / maxRevenue) * 100 : 0;
              const showLabel = data.range.days <= 14 || data.revenueTrend.length <= 14;
              return (
                <div
                  key={p.date}
                  className="flex-1 flex flex-col items-center gap-1 min-w-[20px] group"
                >
                  <div className="text-xs text-gray-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    ¥{p.revenue.toFixed(0)}
                  </div>
                  <div
                    className="w-full bg-gradient-to-t from-green-400 to-green-300 rounded-t transition-all"
                    style={{ height: `${h}%`, minHeight: p.revenue > 0 ? '3px' : '0' }}
                    title={`${p.date}: ¥${p.revenue.toFixed(2)} (${p.orders}单)`}
                  />
                  {showLabel && (
                    <div className="text-xs text-gray-500 truncate w-full text-center">
                      {p.date.slice(5)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-12 text-sm">暂无数据</div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <h2 className="font-bold text-gray-900 mb-4">收入来源占比</h2>
          {data.revenueByType.length > 0 ? (
            <div className="space-y-3">
              {data.revenueByType.map((t) => {
                const pct = (t.amount / maxTypeAmount) * 100;
                return (
                  <div key={t.type} className="flex items-center gap-3">
                    <span className="w-24 text-sm text-gray-600 shrink-0">
                      {TYPE_LABELS[t.type] || t.type}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div
                        className={`${TYPE_COLORS[t.type] || 'bg-gray-500'} h-full rounded-full transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-700 w-28 text-right shrink-0">
                      ¥{t.amount.toFixed(2)} ({t.percentage.toFixed(1)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8 text-sm">暂无数据</div>
          )}
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <h2 className="font-bold text-gray-900 mb-4">支付方式统计</h2>
          {data.revenueByPaymentMethod.length > 0 ? (
            <div className="space-y-3">
              {data.revenueByPaymentMethod.map((p) => {
                const pct = (p.amount / maxPaymentAmount) * 100;
                return (
                  <div key={p.method} className="flex items-center gap-3">
                    <span className="w-24 text-sm text-gray-600 shrink-0">
                      {PAYMENT_LABELS[p.method] || p.method}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div
                        className={`${PAYMENT_COLORS[p.method] || 'bg-gray-500'} h-full rounded-full transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-700 w-28 text-right shrink-0">
                      ¥{p.amount.toFixed(2)} ({p.percentage.toFixed(1)}%)
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

      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <h2 className="font-bold text-gray-900 mb-4">客单价趋势</h2>
        {data.revenueTrend.length > 0 ? (
          <div className="flex items-end gap-1 h-40 overflow-x-auto pb-2">
            {data.revenueTrend.map((p) => {
              const maxAov = Math.max(...data.revenueTrend.map((x) => x.avgOrderValue), 1);
              const h = maxAov > 0 ? (p.avgOrderValue / maxAov) * 100 : 0;
              const showLabel = data.range.days <= 14 || data.revenueTrend.length <= 14;
              return (
                <div
                  key={p.date}
                  className="flex-1 flex flex-col items-center gap-1 min-w-[20px] group"
                >
                  <div className="text-xs text-gray-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    ¥{p.avgOrderValue.toFixed(1)}
                  </div>
                  <div
                    className="w-full bg-gradient-to-t from-purple-400 to-purple-300 rounded-t transition-all"
                    style={{ height: `${h}%`, minHeight: p.avgOrderValue > 0 ? '3px' : '0' }}
                    title={`${p.date}: ¥${p.avgOrderValue.toFixed(2)}`}
                  />
                  {showLabel && (
                    <div className="text-xs text-gray-500 truncate w-full text-center">
                      {p.date.slice(5)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8 text-sm">暂无数据</div>
        )}
      </div>
    </div>
  );
}