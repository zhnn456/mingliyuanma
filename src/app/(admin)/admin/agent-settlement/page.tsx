'use client';

import { useState, useEffect } from 'react';

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待支付', color: 'bg-amber-100 text-amber-800' },
  paid: { label: '已支付', color: 'bg-green-100 text-green-800' },
};

interface Settlement {
  id: string;
  agentId: string;
  period: string;
  totalAmount: number;
  commissionRate: string | null;
  commissionAmount: number;
  status: string;
  paidAt: string | null;
  remark: string | null;
  companyName: string | null;
  contactName: string | null;
  agentEmail: string | null;
  userName: string | null;
  createdAt: string;
}

interface Agent {
  id: string;
  companyName: string | null;
  contactName: string | null;
}

export default function AgentSettlementPage() {
  const [data, setData] = useState<Settlement[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState({ totalAmount: 0, paidAmount: 0, pendingAmount: 0, periodCommission: 0 });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [detailItem, setDetailItem] = useState<Settlement | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);

  const [createForm, setCreateForm] = useState({
    agentId: '', period: '', totalAmount: 0, commissionRate: '10%', commissionAmount: 0, remark: '',
  });
  const [generatePeriod, setGeneratePeriod] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (periodFilter) params.set('period', periodFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/agent-settlement?${params}`);
      if (res.ok) {
        const d = await res.json();
        setData(d.data || []);
        setTotal(d.total || 0);
      }
    } catch {} finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams({ action: 'stats' });
      if (periodFilter) params.set('period', periodFilter);
      const res = await fetch(`/api/admin/agent-settlement?${params}`);
      if (res.ok) {
        const d = await res.json();
        setStats({
          totalAmount: d.totalAmount || 0,
          paidAmount: d.paidAmount || 0,
          pendingAmount: d.pendingAmount || 0,
          periodCommission: d.periodCommission || 0,
        });
      }
    } catch {}
  };

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/admin/agents?pageSize=1000');
      if (res.ok) {
        const d = await res.json();
        setAgents((d.data || d.agents || []).map((a: any) => ({
          id: a.id, companyName: a.companyName, contactName: a.contactName,
        })));
      }
    } catch {}
  };

  useEffect(() => { fetchData(); }, [page]);
  useEffect(() => { fetchStats(); }, [periodFilter]);

  const onSearch = () => { setPage(1); fetchData(); fetchStats(); };

  const openCreate = () => {
    setCreateForm({ agentId: '', period: '', totalAmount: 0, commissionRate: '10%', commissionAmount: 0, remark: '' });
    fetchAgents();
    setShowCreateModal(true);
  };

  const openGenerate = () => {
    setGeneratePeriod('');
    setShowGenerateModal(true);
  };

  const handleCreate = async () => {
    if (!createForm.agentId || !createForm.period) { alert('请选择代理商和结算周期'); return; }
    const res = await fetch('/api/admin/agent-settlement', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createForm),
    });
    if (res.ok) { setShowCreateModal(false); fetchData(); fetchStats(); }
    else { const e = await res.json(); alert(e.error || '创建失败'); }
  };

  const handleGenerate = async () => {
    if (!generatePeriod) { alert('请选择结算周期'); return; }
    const res = await fetch('/api/admin/agent-settlement', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'generate', period: generatePeriod }),
    });
    if (res.ok) {
      const d = await res.json();
      alert(d.message || '生成成功');
      setShowGenerateModal(false);
      fetchData(); fetchStats();
    } else {
      const e = await res.json(); alert(e.error || '生成失败');
    }
  };

  const markAsPaid = async (s: Settlement) => {
    if (!confirm(`确认标记「${s.companyName || s.agentId}」的 ${s.period} 结算为已支付？`)) return;
    const res = await fetch('/api/admin/agent-settlement', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, status: 'paid' }),
    });
    if (res.ok) { fetchData(); fetchStats(); }
    else { const e = await res.json(); alert(e.error || '操作失败'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此结算记录？')) return;
    const res = await fetch(`/api/admin/agent-settlement?id=${id}`, { method: 'DELETE' });
    if (res.ok) { fetchData(); fetchStats(); }
  };

  const fmtDate = (s: string | null) => s ? new Date(s).toLocaleString('zh-CN') : '-';
  const fmtMoney = (n: number) => '¥' + (n || 0).toFixed(2);
  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-slate-900">代理商结算</h1>
        <p className="text-sm text-slate-500 mt-1">管理代理商分润结算与支付</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { label: '总结算额', value: fmtMoney(stats.totalAmount), color: 'text-blue-600' },
          { label: '已支付', value: fmtMoney(stats.paidAmount), color: 'text-green-600' },
          { label: '待支付', value: fmtMoney(stats.pendingAmount), color: 'text-amber-600' },
          { label: '本期佣金', value: fmtMoney(stats.periodCommission), color: 'text-purple-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border p-4">
            <div className="text-sm text-slate-500">{s.label}</div>
            <div className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="flex items-center gap-3 p-4 border-b flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">结算周期</span>
            <input type="month" value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">全部状态</option>
            {Object.entries(statusMap).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
          </select>
          <button onClick={onSearch} className="px-4 py-2 bg-slate-100 rounded-lg text-sm hover:bg-slate-200">搜索</button>
          <div className="flex-1" />
          <button onClick={openGenerate} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">批量生成</button>
          <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">+ 新增结算</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left">
                <th className="px-4 py-3 text-gray-500 font-medium">代理商</th>
                <th className="px-4 py-3 text-gray-500 font-medium">结算周期</th>
                <th className="px-4 py-3 text-gray-500 font-medium">总金额</th>
                <th className="px-4 py-3 text-gray-500 font-medium">佣金比例</th>
                <th className="px-4 py-3 text-gray-500 font-medium">佣金金额</th>
                <th className="px-4 py-3 text-gray-500 font-medium">状态</th>
                <th className="px-4 py-3 text-gray-500 font-medium">支付时间</th>
                <th className="px-4 py-3 text-gray-500 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
              ) : data.map((s) => {
                const st = statusMap[s.status] || { label: s.status, color: 'bg-gray-100 text-gray-600' };
                return (
                  <tr key={s.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{s.companyName || s.agentId}<div className="text-xs text-gray-400">{s.contactName || s.userName || ''}</div></td>
                    <td className="px-4 py-3 text-gray-600">{s.period}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtMoney(s.totalAmount)}</td>
                    <td className="px-4 py-3 text-gray-600">{s.commissionRate || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtMoney(s.commissionAmount)}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded ${st.color}`}>{st.label}</span></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(s.paidAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setDetailItem(s)} className="text-blue-600 hover:text-blue-800 text-xs">查看</button>
                        {s.status === 'pending' && (
                          <button onClick={() => markAsPaid(s)} className="text-green-600 hover:text-green-800 text-xs">标记已付</button>
                        )}
                        <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700 text-xs">删除</button>
                      </div>
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

      {/* 新增结算 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">新增结算记录</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">代理商 *</label>
                <select value={createForm.agentId} onChange={(e) => setCreateForm({ ...createForm, agentId: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">请选择代理商</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>{a.companyName || a.contactName || a.id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">结算周期 *</label>
                <input type="month" value={createForm.period} onChange={(e) => setCreateForm({ ...createForm, period: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">总金额</label>
                  <input type="number" step="0.01" value={createForm.totalAmount} onChange={(e) => setCreateForm({ ...createForm, totalAmount: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">佣金比例</label>
                  <input value={createForm.commissionRate} onChange={(e) => setCreateForm({ ...createForm, commissionRate: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="如 10%" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">佣金金额</label>
                <input type="number" step="0.01" value={createForm.commissionAmount} onChange={(e) => setCreateForm({ ...createForm, commissionAmount: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea value={createForm.remark} onChange={(e) => setCreateForm({ ...createForm, remark: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} placeholder="备注说明" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">取消</button>
              <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">创建</button>
            </div>
          </div>
        </div>
      )}

      {/* 批量生成 */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">批量生成结算</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">结算周期 *</label>
                <input type="month" value={generatePeriod} onChange={(e) => setGeneratePeriod(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
                系统将为所有活跃代理商生成所选周期的结算记录（已有记录的将跳过）。
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowGenerateModal(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">取消</button>
              <button onClick={handleGenerate} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">生成</button>
            </div>
          </div>
        </div>
      )}

      {/* 详情 */}
      {detailItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">结算详情</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">代理商</span><span className="font-medium">{detailItem.companyName || detailItem.agentId}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">联系人</span><span>{detailItem.contactName || detailItem.userName || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">邮箱</span><span>{detailItem.agentEmail || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">结算周期</span><span>{detailItem.period}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">总金额</span><span className="font-medium">{fmtMoney(detailItem.totalAmount)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">佣金比例</span><span>{detailItem.commissionRate || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">佣金金额</span><span className="font-medium text-green-600">{fmtMoney(detailItem.commissionAmount)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">状态</span>
                <span className={`text-xs px-2 py-1 rounded ${(statusMap[detailItem.status] || {color:'bg-gray-100 text-gray-600'}).color}`}>{(statusMap[detailItem.status] || {label:detailItem.status}).label}</span>
              </div>
              <div className="flex justify-between"><span className="text-gray-500">支付时间</span><span>{fmtDate(detailItem.paidAt)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">创建时间</span><span>{fmtDate(detailItem.createdAt)}</span></div>
              {detailItem.remark && (
                <div className="border-t pt-3"><span className="text-gray-500 block mb-1">备注</span><span className="text-gray-700">{detailItem.remark}</span></div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              {detailItem.status === 'pending' && (
                <button onClick={() => { markAsPaid(detailItem); setDetailItem(null); }} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">标记已付</button>
              )}
              <button onClick={() => setDetailItem(null)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
