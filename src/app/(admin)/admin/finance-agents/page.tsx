'use client';

import { useState, useEffect } from 'react';

export default function AdminFinanceAgentsPage() {
  const [shares, setShares] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [summaryPeriod, setSummaryPeriod] = useState('month');
  const pageSize = 20;

  const fetchShares = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (statusFilter) params.set('status', statusFilter);
      if (startDate) params.set('startDate', new Date(startDate).toISOString());
      if (endDate) params.set('endDate', new Date(endDate + 'T23:59:59').toISOString());
      const res = await fetch(`/api/admin/finance-agents?${params}`);
      if (res.ok) { const d = await res.json(); setShares(d.shares || []); setTotal(d.total || 0); }
    } catch {} finally { setLoading(false); }
  };

  const fetchSummary = async () => {
    try {
      const res = await fetch(`/api/admin/finance-agents?summary=true&period=${summaryPeriod}`);
      if (res.ok) { const d = await res.json(); setSummary(d); }
    } catch {}
  };

  useEffect(() => { fetchShares(); }, [page, statusFilter, startDate, endDate]);
  useEffect(() => { fetchSummary(); }, [summaryPeriod]);

  const handleSelectAll = () => {
    if (selectedIds.length === shares.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(shares.map((s: any) => s.id));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBatchAction = async (action: string) => {
    if (selectedIds.length === 0) return;
    if (!confirm(`确定要对选中的 ${selectedIds.length} 条记录执行${action === 'settle' ? '结算' : '取消'}操作吗？`)) return;
    try {
      const res = await fetch('/api/admin/finance-agents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, action }),
      });
      if (res.ok) {
        setSelectedIds([]);
        fetchShares();
        fetchSummary();
      }
    } catch {}
  };

  const statusMap: Record<string, string> = { pending: '待结算', settled: '已结算', cancelled: '已取消' };
  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    settled: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-600',
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">代理商分润</h2>
        <p className="text-sm text-gray-500">管理代理商分润记录与结算</p>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => { setSummaryPeriod('month'); setPage(1); }}
          className={`px-3 py-1.5 text-sm rounded-lg ${summaryPeriod === 'month' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >本月</button>
        <button
          onClick={() => { setSummaryPeriod('quarter'); setPage(1); }}
          className={`px-3 py-1.5 text-sm rounded-lg ${summaryPeriod === 'quarter' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >本季度</button>
        <button
          onClick={() => { setSummaryPeriod('year'); setPage(1); }}
          className={`px-3 py-1.5 text-sm rounded-lg ${summaryPeriod === 'year' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >本年</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-sm text-gray-500">分润总额</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">¥{summary?.summary?.totalShare?.toFixed(2) || '0.00'}</div>
          <div className="text-xs text-gray-400 mt-1">{summary?.summary?.totalRecords || 0} 条记录</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-sm text-gray-500">已结算金额</div>
          <div className="text-2xl font-bold text-green-600 mt-1">¥{summary?.summary?.settledAmount?.toFixed(2) || '0.00'}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-sm text-gray-500">待结算金额</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">¥{summary?.summary?.pendingAmount?.toFixed(2) || '0.00'}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); setSelectedIds([]); }} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">全部状态</option>
            <option value="pending">待结算</option>
            <option value="settled">已结算</option>
            <option value="cancelled">已取消</option>
          </select>
          <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); setSelectedIds([]); }} className="px-3 py-2 border rounded-lg text-sm" placeholder="开始日期" />
          <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); setSelectedIds([]); }} className="px-3 py-2 border rounded-lg text-sm" placeholder="结束日期" />
          {(startDate || endDate) && (
            <button onClick={() => { setStartDate(''); setEndDate(''); setPage(1); }} className="text-sm text-gray-500 hover:text-gray-700">清除</button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <>
              <span className="text-sm text-gray-500">已选 {selectedIds.length} 条</span>
              <button onClick={() => handleBatchAction('settle')} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">批量结算</button>
              <button onClick={() => handleBatchAction('cancel')} className="px-3 py-1.5 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600">批量取消</button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-4 py-3 text-gray-500 font-medium w-10">
                <input type="checkbox" checked={selectedIds.length === shares.length && shares.length > 0} onChange={handleSelectAll} className="w-4 h-4" />
              </th>
              <th className="px-4 py-3 text-gray-500 font-medium">代理商</th>
              <th className="px-4 py-3 text-gray-500 font-medium">订单号</th>
              <th className="px-4 py-3 text-gray-500 font-medium">订单金额</th>
              <th className="px-4 py-3 text-gray-500 font-medium">分润比例</th>
              <th className="px-4 py-3 text-gray-500 font-medium">分润金额</th>
              <th className="px-4 py-3 text-gray-500 font-medium">状态</th>
              <th className="px-4 py-3 text-gray-500 font-medium">结算周期</th>
              <th className="px-4 py-3 text-gray-500 font-medium">创建时间</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">加载中...</td></tr>
            ) : shares.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">暂无分润记录</td></tr>
            ) : (
              shares.map((s: any) => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => handleSelectOne(s.id)} className="w-4 h-4" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{s.companyName || '-'}</div>
                    {s.contactName && <div className="text-xs text-gray-500">{s.contactName}</div>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{s.orderNo || s.orderId || '-'}</td>
                  <td className="px-4 py-3">¥{(s.orderAmount || s.amount || 0).toFixed(2)}</td>
                  <td className="px-4 py-3">{((s.rate || 0) * 100).toFixed(0)}%</td>
                  <td className="px-4 py-3 font-bold text-indigo-600">¥{(s.shareAmount || 0).toFixed(2)}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded ${statusColor[s.status] || ''}`}>{statusMap[s.status] || s.status}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{s.period || '-'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{s.createdAt ? new Date(s.createdAt).toLocaleString('zh-CN') : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-500">第 {page} / {Math.ceil(total / pageSize)} 页 · 共 {total} 条记录</span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50">上一页</button>
          <button disabled={page >= Math.ceil(total / pageSize)} onClick={() => setPage(p => p + 1)} className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50">下一页</button>
        </div>
      </div>
    </div>
  );
}