'use client';

import { useState, useEffect, useMemo } from 'react';

interface Summary {
  totalRevenue: number;
  orderCount: number;
  refundCount: number;
  refundAmount: number;
  refundRate: number;
  newUserCount: number;
  profitEstimate: number;
}

interface MonthlyComparison {
  month: string;
  revenue: number;
  orderCount: number;
  refundCount: number;
  refundAmount: number;
  newUsers: number;
  revenueChange: number | null;
}

interface BreakdownItem {
  type: string;
  amount: number;
}

interface BreakdownPayment {
  method: string;
  amount: number;
}

interface FinanceReport {
  type: string;
  year: number;
  month: number | null;
  summary: Summary;
  monthlyComparison: MonthlyComparison[];
  byType: BreakdownItem[];
  byPayment: BreakdownPayment[];
  startDate: string | null;
  endDate: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  membership: '会员',
  offering: '供奉',
  pdf_report: 'PDF报告',
  bazi: '八字排盘',
  ziwei: '紫微斗数',
  qimen: '奇门遁甲',
  meihua: '梅花易数',
};

const PAYMENT_LABELS: Record<string, string> = {
  wechat: '微信支付',
  alipay: '支付宝',
  alipay_h5: '支付宝H5',
  wechat_h5: '微信H5',
  points: '积分支付',
};

const TYPE_COLORS: Record<string, string> = {
  membership: 'bg-blue-500',
  offering: 'bg-amber-500',
  pdf_report: 'bg-purple-500',
  bazi: 'bg-green-500',
  ziwei: 'bg-pink-500',
  qimen: 'bg-indigo-500',
  meihua: 'bg-orange-500',
};

const PAYMENT_COLORS: Record<string, string> = {
  wechat: 'bg-green-500',
  alipay: 'bg-blue-500',
  alipay_h5: 'bg-blue-400',
  wechat_h5: 'bg-green-400',
  points: 'bg-yellow-500',
};

const SUMMARY_CARDS = [
  { key: 'totalRevenue', label: '总收入', icon: '💰', color: 'bg-yellow-500', isMoney: true },
  { key: 'orderCount', label: '订单数', icon: '🧾', color: 'bg-purple-500' },
  { key: 'refundAmount', label: '退款金额', icon: '↩️', color: 'bg-red-500', isMoney: true },
  { key: 'refundRate', label: '退款率', icon: '📉', color: 'bg-orange-500', isPercent: true },
  { key: 'profitEstimate', label: '利润估算', icon: '📈', color: 'bg-green-500', isMoney: true },
  { key: 'newUserCount', label: '新增用户', icon: '👥', color: 'bg-blue-500' },
];

export default function FinanceReportsPage() {
  const [report, setReport] = useState<FinanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<'monthly' | 'yearly' | 'custom'>('monthly');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('type', reportType);
      params.set('year', String(year));
      if (reportType === 'monthly') params.set('month', String(month));
      if (reportType === 'custom' && startDate && endDate) {
        params.set('startDate', startDate);
        params.set('endDate', endDate);
      }
      const res = await fetch(`/api/admin/finance-reports?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setReport(data);
    } catch (e) {
      console.error('加载报表失败:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const maxTypeAmount = useMemo(() => {
    if (!report?.byType?.length) return 0;
    return Math.max(...report.byType.map((b) => b.amount), 1);
  }, [report]);

  const maxPaymentAmount = useMemo(() => {
    if (!report?.byPayment?.length) return 0;
    return Math.max(...report.byPayment.map((b) => b.amount), 1);
  }, [report]);

  const maxMonthlyRevenue = useMemo(() => {
    if (!report?.monthlyComparison?.length) return 0;
    return Math.max(...report.monthlyComparison.map((m) => m.revenue), 1);
  }, [report]);

  const exportToCSV = () => {
    if (!report) return;
    const rows: string[] = [];
    rows.push('月份,收入,订单数,退款数,退款金额,新增用户,环比变化');
    report.monthlyComparison.forEach((m) => {
      rows.push(
        `${m.month},${m.revenue},${m.orderCount},${m.refundCount},${m.refundAmount},${m.newUsers},${m.revenueChange ?? '-'}%`
      );
    });
    rows.push('');
    rows.push('按类型分组');
    report.byType.forEach((b) => {
      rows.push(`${TYPE_LABELS[b.type] || b.type},${b.amount}`);
    });
    rows.push('');
    rows.push('按支付方式分组');
    report.byPayment.forEach((b) => {
      rows.push(`${PAYMENT_LABELS[b.method] || b.method},${b.amount}`);
    });
    const csvContent = '\ufeff' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-report-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mr-3" />
        加载中...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-20 text-red-500">
        加载报表失败，请稍后重试
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">财务报表</h2>
          <p className="text-sm text-gray-500 mt-1">
            {reportType === 'monthly' && `${year}年${month}月报表`}
            {reportType === 'yearly' && `${year}年度报表`}
            {reportType === 'custom' && `${startDate} 至 ${endDate}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToPDF}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <span>📄</span>
            <span>导出PDF</span>
          </button>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <span>📊</span>
            <span>导出Excel</span>
          </button>
          <button
            onClick={fetchReport}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <span>🔄</span>
            <span>刷新</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">报表类型:</label>
            <div className="flex border rounded-lg overflow-hidden">
              {(['monthly', 'yearly', 'custom'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setReportType(t)}
                  className={`px-3 py-2 text-sm ${
                    reportType === t
                      ? 'bg-red-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {t === 'monthly' ? '月度' : t === 'yearly' ? '年度' : '自定义'}
                </button>
              ))}
            </div>
          </div>

          {reportType === 'monthly' && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">年月:</label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                  <option key={y} value={y}>{y}年</option>
                ))}
              </select>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{m}月</option>
                ))}
              </select>
            </div>
          )}

          {reportType === 'yearly' && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">年份:</label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                  <option key={y} value={y}>{y}年</option>
                ))}
              </select>
            </div>
          )}

          {reportType === 'custom' && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">日期范围:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              />
              <span className="text-gray-400">至</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          )}

          <button
            onClick={fetchReport}
            className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            查询
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {SUMMARY_CARDS.map((card) => {
          const raw = (report.summary as unknown as Record<string, number>)[card.key];
          let displayValue: string | number;
          if (card.isMoney) {
            displayValue = `¥${(raw || 0).toFixed(2)}`;
          } else if (card.isPercent) {
            displayValue = `${(raw || 0).toFixed(2)}%`;
          } else {
            displayValue = raw ?? 0;
          }
          return (
            <div
              key={card.key}
              className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-lg ${card.color} flex items-center justify-center text-white text-base shrink-0`}
                >
                  {card.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-gray-500 truncate">{card.label}</div>
                  <div className="text-base font-bold text-gray-900 truncate">{displayValue}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <h2 className="font-bold text-gray-900 mb-4">月度收入对比</h2>
          {report.monthlyComparison.length > 0 ? (
            <div className="flex items-end gap-1 h-40">
              {report.monthlyComparison.map((m) => {
                const h = maxMonthlyRevenue > 0 ? (m.revenue / maxMonthlyRevenue) * 100 : 0;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <div className="text-xs text-gray-600 font-semibold truncate w-full text-center">
                      {m.revenue > 0 ? `¥${m.revenue.toFixed(0)}` : '-'}
                    </div>
                    <div
                      className="w-full bg-gradient-to-t from-red-400 to-red-300 rounded-t transition-all"
                      style={{ height: `${h}%`, minHeight: m.revenue > 0 ? '4px' : '0' }}
                      title={`${m.month}: ¥${m.revenue.toFixed(2)}`}
                    />
                    <div className="text-xs text-gray-500 truncate w-full text-center">
                      {m.month.slice(5)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8 text-sm">暂无数据</div>
          )}
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <h2 className="font-bold text-gray-900 mb-4">收入分布（按类型）</h2>
          {report.byType.length > 0 ? (
            <div className="space-y-3">
              {report.byType.map((b) => {
                const pct = (b.amount / maxTypeAmount) * 100;
                return (
                  <div key={b.type} className="flex items-center gap-3">
                    <span className="w-24 text-sm text-gray-600 shrink-0">
                      {TYPE_LABELS[b.type] || b.type}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div
                        className={`${TYPE_COLORS[b.type] || 'bg-gray-500'} h-full rounded-full transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-700 w-24 text-right">
                      ¥{b.amount.toFixed(2)}
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
        <h2 className="font-bold text-gray-900 mb-4">月度对比表格</h2>
        {report.monthlyComparison.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b text-left">
                  <th className="px-4 py-3 text-gray-500 font-medium">月份</th>
                  <th className="px-4 py-3 text-gray-500 font-medium">收入</th>
                  <th className="px-4 py-3 text-gray-500 font-medium">环比</th>
                  <th className="px-4 py-3 text-gray-500 font-medium">订单数</th>
                  <th className="px-4 py-3 text-gray-500 font-medium">退款数</th>
                  <th className="px-4 py-3 text-gray-500 font-medium">退款金额</th>
                  <th className="px-4 py-3 text-gray-500 font-medium">新增用户</th>
                </tr>
              </thead>
              <tbody>
                {report.monthlyComparison.map((m) => (
                  <tr key={m.month} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{m.month}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">¥{m.revenue.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {m.revenueChange === null ? (
                        <span className="text-gray-400">-</span>
                      ) : m.revenueChange > 0 ? (
                        <span className="text-green-600">↑ {m.revenueChange.toFixed(1)}%</span>
                      ) : m.revenueChange < 0 ? (
                        <span className="text-red-600">↓ {Math.abs(m.revenueChange).toFixed(1)}%</span>
                      ) : (
                        <span className="text-gray-400">0%</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{m.orderCount}</td>
                    <td className="px-4 py-3">{m.refundCount}</td>
                    <td className="px-4 py-3 text-red-600">¥{m.refundAmount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-blue-600">{m.newUsers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8 text-sm">暂无数据</div>
        )}
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <h2 className="font-bold text-gray-900 mb-4">支付方式分布</h2>
        {report.byPayment.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {report.byPayment.map((b) => {
              const pct = (b.amount / maxPaymentAmount) * 100;
              return (
                <div key={b.method} className="flex items-center gap-3">
                  <span className="w-28 text-sm text-gray-600 shrink-0">
                    {PAYMENT_LABELS[b.method] || b.method}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className={`${PAYMENT_COLORS[b.method] || 'bg-gray-500'} h-full rounded-full transition-all flex items-center justify-end pr-2`}
                      style={{ width: `${pct}%`, minWidth: '40px' }}
                    >
                      <span className="text-xs text-white font-medium">
                        {((b.amount / report.summary.totalRevenue) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-700 w-28 text-right">
                    ¥{b.amount.toFixed(2)}
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
  );
}