'use client';

import { useState, useEffect } from 'react';

const typeMap: Record<string, string> = {
  users: '用户数据',
  orders: '订单数据',
  records: '测算记录',
  transactions: '交易流水',
  members: '会员数据',
  agents: '代理商数据',
  coupons: '优惠券数据',
};

const statusMap: Record<string, { label: string; color: string }> = {
  processing: { label: '进行中', color: 'bg-amber-100 text-amber-800' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800' },
  failed: { label: '失败', color: 'bg-red-100 text-red-800' },
  pending: { label: '等待中', color: 'bg-gray-100 text-gray-600' },
};

interface ExportTask {
  id: string;
  type: string;
  format: string;
  status: string;
  fileUrl: string | null;
  params: string | null;
  createdBy: string | null;
  createdAt: string;
}

export default function ExportsPage() {
  const [data, setData] = useState<ExportTask[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({ total: 0, processing: 0, completed: 0, failed: 0 });

  const [form, setForm] = useState({ type: 'users', format: 'csv' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (searchKeyword) params.set('keyword', searchKeyword);
      if (typeFilter) params.set('type', typeFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/exports?${params}`);
      if (res.ok) {
        const d = await res.json();
        setData(d.data || []);
        setTotal(d.total || 0);
      }
    } catch {} finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/exports?pageSize=10000');
      if (res.ok) {
        const d = await res.json();
        const all = d.data || [];
        setStats({
          total: all.length,
          processing: all.filter((t: ExportTask) => t.status === 'processing' || t.status === 'pending').length,
          completed: all.filter((t: ExportTask) => t.status === 'completed').length,
          failed: all.filter((t: ExportTask) => t.status === 'failed').length,
        });
      }
    } catch {}
  };

  useEffect(() => { fetchData(); }, [page]);
  useEffect(() => { fetchStats(); }, []);

  const onSearch = () => { setPage(1); fetchData(); fetchStats(); };

  const openCreate = () => {
    setForm({ type: 'users', format: 'csv' });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    const res = await fetch('/api/admin/exports', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) { setShowModal(false); fetchData(); fetchStats(); }
    else { const e = await res.json(); alert(e.error || '创建失败'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此导出任务？')) return;
    const res = await fetch(`/api/admin/exports?id=${id}`, { method: 'DELETE' });
    if (res.ok) { fetchData(); fetchStats(); }
  };

  const handleDownload = (url: string | null) => {
    if (!url) { alert('文件链接不存在'); return; }
    window.open(url, '_blank');
  };

  const fmtDate = (s: string | null) => s ? new Date(s).toLocaleString('zh-CN') : '-';
  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-slate-900">导出任务</h1>
        <p className="text-sm text-slate-500 mt-1">管理数据导出任务</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { label: '总任务', value: stats.total, color: 'text-blue-600' },
          { label: '进行中', value: stats.processing, color: 'text-amber-600' },
          { label: '已完成', value: stats.completed, color: 'text-green-600' },
          { label: '失败', value: stats.failed, color: 'text-red-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border p-4">
            <div className="text-sm text-slate-500">{s.label}</div>
            <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="flex items-center gap-3 p-4 border-b">
          <input
            value={keyword} onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder="搜索类型/任务ID"
            className="px-3 py-2 border rounded-lg text-sm flex-1"
          />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">全部类型</option>
            {Object.entries(typeMap).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">全部状态</option>
            {Object.entries(statusMap).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
          </select>
          <button onClick={onSearch} className="px-4 py-2 bg-slate-100 rounded-lg text-sm hover:bg-slate-200">搜索</button>
          <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">+ 新建导出</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left">
                <th className="px-4 py-3 text-gray-500 font-medium">类型</th>
                <th className="px-4 py-3 text-gray-500 font-medium">格式</th>
                <th className="px-4 py-3 text-gray-500 font-medium">状态</th>
                <th className="px-4 py-3 text-gray-500 font-medium">文件链接</th>
                <th className="px-4 py-3 text-gray-500 font-medium">创建者</th>
                <th className="px-4 py-3 text-gray-500 font-medium">创建时间</th>
                <th className="px-4 py-3 text-gray-500 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
              ) : data.map((t) => {
                const st = statusMap[t.status] || { label: t.status, color: 'bg-gray-100 text-gray-600' };
                return (
                  <tr key={t.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{typeMap[t.type] || t.type}</td>
                    <td className="px-4 py-3"><span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded uppercase">{t.format}</span></td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded ${st.color}`}>{st.label}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[160px] truncate" title={t.fileUrl || ''}>{t.fileUrl || '-'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{t.createdBy || '-'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(t.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {t.status === 'completed' && t.fileUrl && (
                          <button onClick={() => handleDownload(t.fileUrl)} className="text-green-600 hover:text-green-800 text-xs">下载</button>
                        )}
                        <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-700 text-xs">删除</button>
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

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">新建导出任务</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">导出类型 *</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                  {Object.entries(typeMap).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">导出格式 *</label>
                <select value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="csv">CSV</option>
                  <option value="xlsx">Excel (xlsx)</option>
                </select>
              </div>
              <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
                提示：导出任务将在后台异步处理，完成后可在列表中下载文件。
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">取消</button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">创建任务</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
