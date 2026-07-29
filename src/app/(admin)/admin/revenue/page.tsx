'use client';

import { useState, useEffect } from 'react';

export default function AdminRevenuePage() {
  const [data, setData] = useState<any>(null);
  const [range, setRange] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/revenue?range=${range}`)
      .then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [range]);

  if (loading) return <div className="text-center py-20 text-gray-400">加载中...</div>;

  const s = data?.summary || {};
  const summaryCards = [
    { label: '总收入', value: `¥${(s.totalRevenue || 0).toFixed(2)}`, color: 'text-green-600' },
    { label: '净收入', value: `¥${(s.netRevenue || 0).toFixed(2)}`, color: 'text-blue-600' },
    { label: '订单数', value: s.totalOrders || 0, color: 'text-purple-600' },
    { label: '客单价', value: `¥${(s.avgOrderValue || 0).toFixed(2)}`, color: 'text-orange-600' },
    { label: '退款总额', value: `¥${(s.refundTotal || 0).toFixed(2)}`, color: 'text-red-600' },
    { label: '退款笔数', value: s.refundCount || 0, color: 'text-gray-600' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">收入统计</h2>
        <select value={range} onChange={e => setRange(Number(e.target.value))} className="px-3 py-2 border rounded-lg text-sm">
          <option value={7}>近7天</option>
          <option value={30}>近30天</option>
          <option value={90}>近90天</option>
          <option value={365}>近1年</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {summaryCards.map((c, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="text-xs text-gray-500">{c.label}</div>
            <div className={`text-lg font-bold ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* 每日收入趋势 */}
      <div className="bg-white rounded-xl p-5 shadow-sm border mb-6">
        <h3 className="font-bold text-gray-900 mb-4">每日收入趋势</h3>
        <div className="flex items-end gap-1 h-32">
          {(data?.dailyRevenue || []).map((d: any, i: number) => {
            const max = Math.max(...(data?.dailyRevenue || []).map((x: any) => x.amount), 1);
            const h = (d.amount / max) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-red-600/80 rounded-t" style={{ height: `${Math.max(h, 1)}%`, minHeight: '2px' }} title={`${d.date}: ¥${d.amount?.toFixed(2)}`} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <h3 className="font-bold text-gray-900 mb-3">按类型</h3>
          {(data?.revenueByType || []).map((r: any) => (
            <div key={r.type} className="flex justify-between py-2 border-b text-sm">
              <span className="text-gray-600">{r.type === 'membership' ? '会员' : r.type === 'offering' ? '供奉' : r.type}</span>
              <span className="font-bold">¥{(r.amount || 0).toFixed(2)} ({r.count}笔)</span>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <h3 className="font-bold text-gray-900 mb-3">按支付方式</h3>
          {(data?.revenueByMethod || []).map((r: any) => (
            <div key={r.type} className="flex justify-between py-2 border-b text-sm">
              <span className="text-gray-600">{r.type === 'wechat' ? '微信' : r.type === 'alipay' ? '支付宝' : r.type === 'mock' ? '模拟' : r.type || '未知'}</span>
              <span className="font-bold">¥{(r.amount || 0).toFixed(2)} ({r.count}笔)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
