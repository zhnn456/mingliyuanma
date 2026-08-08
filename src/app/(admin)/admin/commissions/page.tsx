'use client';

import { useState, useEffect } from 'react';

interface CommissionRecord {
  id: string;
  agentId: string;
  orderId: string;
  productType: string;
  orderAmount: number;
  commissionRate: number;
  commissionAmount: number;
  totalCommission: number;
  status: string;
  createdAt: string;
  brandName?: string;
  contactName?: string;
}

interface Agent {
  id: string;
  brandName?: string;
  companyName?: string;
}

interface CommissionStats {
  totalRecords: number;
  totalCommission: number;
  pendingAmount: number;
  settledAmount: number;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待结算', color: 'bg-amber-100 text-amber-800' },
  settled: { label: '已结算', color: 'bg-green-100 text-green-800' },
  clawed_back: { label: '已冲销', color: 'bg-red-100 text-red-800' },
};

export default function AdminCommissionsPage() {
  const [records, setRecords] = useState<CommissionRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CommissionStats>({ totalRecords: 0, totalCommission: 0, pendingAmount: 0, settledAmount: 0 });
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentFilter, setAgentFilter] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (agentFilter) params.set('agentId', agentFilter);
      const res = await fetch(`/api/admin/commissions?${params}`);
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

  const fmtMoney = (n: number) => '¥' + (n || 0).toFixed(2);
  const fmtRate = (n: number) => ((n || 0) * 100).toFixed(1) + '%';
  const fmtDate = (s: string) => s ? new Date(s).toLocaleString('zh-CN') : '-';
  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-slate-900">分润管理</h1>
        <p className="text-sm text-slate-500 mt-1">查看所有代理商的分润记录与统计</p>
      </div>

      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[
          { label: '总分润金额', value: fmtMoney(stats.totalCommission), color: 'text-blue-600' },
          { label: '待结算金额', value: fmtMoney(stats.pendingAmount), color: 'text-amber-600' },
          { label: '已结算金额', value: fmtMoney(stats.settledAmount), color: 'text-green-600' },
          { label: '分润记录数', value: stats.totalRecords, color: 'text-purple-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border p-4">
            <div className="text-sm text-slate-500">{s.label}</div>
            <div className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* 分润记录表格 */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="flex items-center gap-2 p-4 border-b flex-wrap">
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">全部代理商</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.brandName || a.companyName || a.id}</option>
            ))}
          </select>
          <button
            onClick={onSearch}
            className="px-3 py-1.5 bg-slate-100 rounded-lg text-sm hover:bg-slate-200"
          >
            搜索
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left">
                <th className="px-4 py-3 text-gray-500 font-medium">代理商</th>
                <th className="px-4 py-3 text-gray-500 font-medium">订单金额</th>
                <th className="px-4 py-3 text-gray-500 font-medium">分润比例</th>
                <th className="px-4 py-3 text-gray-500 font-medium">分润金额</th>
                <th className="px-4 py-3 text-gray-500 font-medium">状态</th>
                <th className="px-4 py-3 text-gray-500 font-medium">时间</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
              ) : records.map((r) => {
                const st = STATUS_MAP[r.status] || { label: r.status, color: 'bg-gray-100 text-gray-600' };
                return (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">
                      <div className="font-medium">{r.brandName || r.contactName || r.agentId}</div>
                      <div className="text-xs text-gray-400">{r.contactName || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{fmtMoney(r.orderAmount)}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtRate(r.commissionRate)}</td>
                    <td className="px-4 py-3 font-medium text-green-600">{fmtMoney(r.commissionAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${st.color}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(r.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        <div className="flex items-center justify-between p-4 border-t">
          <span className="text-sm text-gray-500">共 {total} 条</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50"
            >
              上一页
            </button>
            <span className="px-3 py-1 text-sm">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
