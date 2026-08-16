'use client';

import { useState, useEffect, useMemo } from 'react';

type RecordItem = {
  id: string;
  userId: string;
  name: string;
  gender: string;
  birthDate: string;
  birthTime: string;
  createdAt: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  agentId: string | null;
  agentName: string | null;
  type: string;
};

type AgentOption = { id: string; companyName: string; brandName: string; contactName: string };

const TYPE_OPTIONS = [
  { value: '', label: '全部类型' },
  { value: 'bazi', label: '八字' },
  { value: 'ziwei', label: '紫微' },
  { value: 'qimen', label: '奇门' },
  { value: 'meihua', label: '梅花' },
];

const TYPE_COLOR: Record<string, string> = {
  '八字': 'bg-mingli-100 text-mingli-700',
  '紫微': 'bg-pink-100 text-pink-700',
  '奇门': 'bg-emerald-100 text-emerald-700',
  '梅花': 'bg-amber-100 text-amber-700',
};

const GENDER_LABEL: Record<string, string> = {
  male: '男',
  female: '女',
};

export default function AdminRecordsPage() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const pageSize = 20;

  // 加载代理商列表（用于筛选）
  useEffect(() => {
    fetch('/api/admin/agents?page=1&pageSize=100')
      .then(res => res.ok ? res.json() : null)
      .then(d => {
        if (d) setAgents(d.agents || []);
      })
      .catch(() => {});
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (typeFilter) params.set('type', typeFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (agentFilter) params.set('agentId', agentFilter);
      const res = await fetch(`/api/admin/records?${params}`);
      if (res.ok) {
        const d = await res.json();
        setRecords(d.records || []);
        setTotal(d.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [page, typeFilter, startDate, endDate, agentFilter]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  const handleTypeChange = (v: string) => {
    setTypeFilter(v);
    setPage(1);
  };

  const handleReset = () => {
    setTypeFilter('');
    setStartDate('');
    setEndDate('');
    setAgentFilter('');
    setPage(1);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">排盘记录管理</h2>
          <p className="text-sm text-gray-500">共 {total} 条记录</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={typeFilter}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={agentFilter}
            onChange={(e) => { setAgentFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          >
            <option value="">全部代理商</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.companyName || a.brandName || a.contactName || a.id}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
            placeholder="开始时间"
          />
          <span className="text-gray-400 text-sm">至</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
            placeholder="结束时间"
          />
          <button
            onClick={handleReset}
            className="px-3 py-2 text-sm border rounded-lg bg-white hover:bg-gray-50"
          >
            重置
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-4 py-3 text-gray-500 font-medium">类型</th>
              <th className="px-4 py-3 text-gray-500 font-medium">用户</th>
              <th className="px-4 py-3 text-gray-500 font-medium">所属代理商</th>
              <th className="px-4 py-3 text-gray-500 font-medium">性别</th>
              <th className="px-4 py-3 text-gray-500 font-medium">排盘信息</th>
              <th className="px-4 py-3 text-gray-500 font-medium">创建时间</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">加载中...</td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">暂无记录</td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={`${r.type}-${r.id}`} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${TYPE_COLOR[r.type] || 'bg-gray-100 text-gray-700'}`}>
                      {r.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{r.userName || '-'}</div>
                    <div className="text-xs text-gray-500">
                      {r.userEmail || r.userPhone || r.userId}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {r.agentName || (r.agentId ? r.agentId : <span className="text-gray-300">—</span>)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {GENDER_LABEL[r.gender] || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {r.type === '八字' || r.type === '紫微' ? (
                      <>
                        <div>{r.name || '-'} · {r.birthDate}</div>
                        {r.birthTime && <div className="text-xs text-gray-400">{r.birthTime}</div>}
                      </>
                    ) : r.type === '奇门' ? (
                      <div>{r.birthDate || '-'}</div>
                    ) : (
                      <div>
                        {r.birthTime && <span className="text-xs px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded mr-1">{r.birthTime}</span>}
                        <span>{r.birthDate || '-'}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {r.createdAt ? new Date(r.createdAt).toLocaleString('zh-CN') : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-500">
          第 {page} / {totalPages} 页
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 text-sm border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 text-sm border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
}
