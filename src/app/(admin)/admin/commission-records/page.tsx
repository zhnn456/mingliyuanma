'use client';

import { useState, useEffect } from 'react';

interface CommissionRecord {
  id: string;
  orderId: string;
  agentId: string;
  userId: string;
  productType: string;
  orderAmount: number;
  totalCommission: number;
  status: string;
  createdAt: string;
  userName?: string;
  userEmail?: string;
  agentBrand?: string;
}

interface Agent {
  id: string;
  brandName?: string;
  companyName?: string;
}

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  membership: '会员',
  offering: '咨询',
  pdf_report: 'PDF报告',
  all: '全部产品',
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待结算', color: 'bg-amber-100 text-amber-800' },
  settled: { label: '已结算', color: 'bg-blue-100 text-blue-800' },
  clawed_back: { label: '已冲销', color: 'bg-red-100 text-red-800' },
};

export default function CommissionRecordsPage() {
  const [records, setRecords] = useState<CommissionRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalCommission: 0, monthCommission: 0, pendingCommission: 0, clawbackAmount: 0 });
  const [agents, setAgents] = useState<Agent[]>([]);

  const [keyword, setKeyword] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (keyword) params.set('keyword', keyword);
      if (agentFilter) params.set('agentId', agentFilter);
      if (productFilter) params.set('productType', productFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const res = await fetch(`/api/admin/commission-records?${params}`);
      if (res.ok) {
        const d = await res.json();
        setRecords(d.records || []);
        setTotal(d.total || 0);
        if (d.stats) setStats(d.stats);
      }
    } catch {} finally { setLoading(false); }
  };

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/admin/agents');
      if (res.ok) {
        const d = await res.json();
        setAgents((d.agents || []).map((a: any) => ({
          id: a.id, brandName: a.brandName, companyName: a.companyName,
        })));
      }
    } catch {}
  };

  useEffect(() => { fetchData(); }, [page]);
  useEffect(() => { fetchAgents(); }, []);

  const onSearch = () => { setPage(1); fetchData(); };

  const handleClawback = async (orderId: string) => {
    if (!confirm(`确定对订单 ${orderId} 执行退款冲销？此操作将回退该订单的所有分润记录。`)) return;
    const res = await fetch('/api/admin/commission-records', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clawback', orderId }),
    });
    if (res.ok) { const d = await res.json(); alert(`成功冲销 ${d.clawedBackCount} 条分润记录`); fetchData(); }
    else { const e = await res.json(); alert(e.error || '冲销失败'); }
  };

  const handleExport = () => {
    const headers = ['订单号', '代理商', '客户', '产品类型', '订单金额', '分润金额', '状态', '创建时间'];
    const rows = records.map((r) => [
      r.orderId,
      r.agentBrand || r.agentId,
      r.userName || r.userEmail || r.userId,
      PRODUCT_TYPE_LABELS[r.productType] || r.productType,
      r.orderAmount.toFixed(2),
      r.totalCommission.toFixed(2),
      (STATUS_MAP[r.status] || { label: r.status }).label,
      r.createdAt,
    ]);
    const csv = [headers, ...rows].map(row => row.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `分润记录_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fmtMoney = (n: number) => '¥' + (n || 0).toFixed(2);
  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-slate-900">分润记录</h1>
        <p className="text-sm text-slate-500 mt-1">查看所有分润明细及退款冲销记录</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { label: '总分润', value: fmtMoney(stats.totalCommission), color: 'text-blue-600' },
          { label: '本月分润', value: fmtMoney(stats.monthCommission), color: 'text-purple-600' },
          { label: '待结算', value: fmtMoney(stats.pendingCommission), color: 'text-amber-600' },
          { label: '退款冲销', value: fmtMoney(stats.clawbackAmount), color: 'text-red-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border p-4">
            <div className="text-sm text-slate-500">{s.label}</div>
            <div className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="flex items-center gap-2 p-4 border-b flex-wrap">
          <input type="text" placeholder="搜索订单号/客户名/客户邮箱" value={keyword} onChange={(e) => setKeyword(e.target.value)} className="px-3 py-2 border rounded-lg text-sm w-56" />
          <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">全部代理商</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.brandName || a.companyName || a.id}</option>
            ))}
          </select>
          <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">全部产品</option>
            {Object.entries(PRODUCT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">全部状态</option>
            {Object.entries(STATUS_MAP).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
            <span className="text-gray-400">~</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
          </div>
          <button onClick={onSearch} className="px-3 py-1.5 bg-slate-100 rounded-lg text-sm hover:bg-slate-200">搜索</button>
          <div className="flex-1" />
          <button onClick={handleExport} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">导出CSV</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left">
                <th className="px-4 py-3 text-gray-500 font-medium">订单号</th>
                <th className="px-4 py-3 text-gray-500 font-medium">代理商</th>
                <th className="px-4 py-3 text-gray-500 font-medium">客户</th>
                <th className="px-4 py-3 text-gray-500 font-medium">产品类型</th>
                <th className="px-4 py-3 text-gray-500 font-medium">订单金额</th>
                <th className="px-4 py-3 text-gray-500 font-medium">分润金额</th>
                <th className="px-4 py-3 text-gray-500 font-medium">状态</th>
                <th className="px-4 py-3 text-gray-500 font-medium">创建时间</th>
                <th className="px-4 py-3 text-gray-500 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
              ) : records.map((r) => {
                const st = STATUS_MAP[r.status] || { label: r.status, color: 'bg-gray-100 text-gray-600' };
                return (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{r.orderId}</td>
                    <td className="px-4 py-3 text-gray-600">{r.agentBrand || r.agentId}</td>
                    <td className="px-4 py-3 text-gray-600">{r.userName || r.userEmail || r.userId}</td>
                    <td className="px-4 py-3 text-gray-600">{PRODUCT_TYPE_LABELS[r.productType] || r.productType}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtMoney(r.orderAmount)}</td>
                    <td className="px-4 py-3 font-medium text-green-600">{fmtMoney(r.totalCommission)}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded ${st.color}`}>{st.label}</span></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{r.createdAt}</td>
                    <td className="px-4 py-3">
                      {r.status !== 'clawed_back' && (
                        <button onClick={() => handleClawback(r.orderId)} className="text-red-500 hover:text-red-700 text-xs">冲销</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-4 border-t">
          <span className="text-sm text-gray-500">共 {total} 条</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 border rounded text-sm disabled:opacity-50">上一页</button>
            <span className="px-3 py-1 text-sm">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 border rounded text-sm disabled:opacity-50">下一页</button>
          </div>
        </div>
      </div>
    </div>
  );
}