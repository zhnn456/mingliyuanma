'use client';

import { useState, useEffect } from 'react';

const typeMap: Record<string, string> = {
  discount: '折扣',
  coupon: '优惠券',
  points: '积分赠送',
  free_service: '免费服务',
};

const statusMap: Record<string, string> = {
  ongoing: '进行中',
  ended: '已结束',
  upcoming: '未开始',
};

interface Campaign {
  id: string;
  name: string;
  type: string;
  description: string | null;
  rules: string | null;
  discount: string | null;
  startAt: string | null;
  endAt: string | null;
  isActive: number;
  createdAt: string;
}

export default function CampaignsPage() {
  const [data, setData] = useState<Campaign[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [stats, setStats] = useState({ total: 0, ongoing: 0, ended: 0, upcoming: 0 });

  const [form, setForm] = useState({
    name: '', type: 'discount', description: '', rules: '', discount: '',
    startAt: '', endAt: '', isActive: true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (searchKeyword) params.set('keyword', searchKeyword);
      if (typeFilter) params.set('type', typeFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/campaigns?${params}`);
      if (res.ok) {
        const d = await res.json();
        setData(d.data || []);
        setTotal(d.total || 0);
      }
    } catch {} finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/campaigns?pageSize=10000');
      if (res.ok) {
        const d = await res.json();
        const all = d.data || [];
        const now = new Date();
        setStats({
          total: all.length,
          ongoing: all.filter((c: Campaign) => c.isActive && c.startAt && c.endAt && new Date(c.startAt) <= now && new Date(c.endAt) >= now).length,
          ended: all.filter((c: Campaign) => c.endAt && new Date(c.endAt) < now).length,
          upcoming: all.filter((c: Campaign) => c.startAt && new Date(c.startAt) > now).length,
        });
      }
    } catch {}
  };

  useEffect(() => { fetchData(); }, [page]);
  useEffect(() => { fetchStats(); }, []);

  const onSearch = () => { setPage(1); fetchData(); fetchStats(); };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', type: 'discount', description: '', rules: '', discount: '', startAt: '', endAt: '', isActive: true });
    setShowModal(true);
  };

  const openEdit = (c: Campaign) => {
    setEditing(c);
    setForm({
      name: c.name, type: c.type, description: c.description || '', rules: c.rules || '',
      discount: c.discount || '', startAt: c.startAt ? c.startAt.slice(0, 16) : '',
      endAt: c.endAt ? c.endAt.slice(0, 16) : '', isActive: c.isActive === 1,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name) { alert('请填写活动名称'); return; }
    const payload = {
      ...form,
      startAt: form.startAt ? new Date(form.startAt).toISOString() : null,
      endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
    };
    if (editing) {
      const res = await fetch('/api/admin/campaigns', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, ...payload }),
      });
      if (res.ok) { setShowModal(false); fetchData(); fetchStats(); }
      else { const e = await res.json(); alert(e.error || '更新失败'); }
    } else {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) { setShowModal(false); fetchData(); fetchStats(); }
      else { const e = await res.json(); alert(e.error || '创建失败'); }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此活动？')) return;
    const res = await fetch(`/api/admin/campaigns?ids=${id}`, { method: 'DELETE' });
    if (res.ok) { fetchData(); fetchStats(); }
  };

  const toggleActive = async (c: Campaign) => {
    const res = await fetch('/api/admin/campaigns', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, isActive: c.isActive !== 1 }),
    });
    if (res.ok) { fetchData(); fetchStats(); }
  };

  const fmtDate = (s: string | null) => s ? new Date(s).toLocaleString('zh-CN') : '-';

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-slate-900">活动管理</h1>
        <p className="text-sm text-slate-500 mt-1">管理营销活动、折扣与优惠券</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { label: '总数', value: stats.total, color: 'text-blue-600' },
          { label: '进行中', value: stats.ongoing, color: 'text-green-600' },
          { label: '已结束', value: stats.ended, color: 'text-gray-600' },
          { label: '未开始', value: stats.upcoming, color: 'text-amber-600' },
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
            placeholder="搜索活动名称"
            className="px-3 py-2 border rounded-lg text-sm flex-1"
          />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">全部类型</option>
            {Object.entries(typeMap).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">全部状态</option>
            {Object.entries(statusMap).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button onClick={onSearch} className="px-4 py-2 bg-slate-100 rounded-lg text-sm hover:bg-slate-200">搜索</button>
          <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">+ 新增活动</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left">
                <th className="px-4 py-3 text-gray-500 font-medium">活动名称</th>
                <th className="px-4 py-3 text-gray-500 font-medium">类型</th>
                <th className="px-4 py-3 text-gray-500 font-medium">折扣/优惠</th>
                <th className="px-4 py-3 text-gray-500 font-medium">开始时间</th>
                <th className="px-4 py-3 text-gray-500 font-medium">结束时间</th>
                <th className="px-4 py-3 text-gray-500 font-medium">状态</th>
                <th className="px-4 py-3 text-gray-500 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
              ) : data.map((c) => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">{typeMap[c.type] || c.type}</span></td>
                  <td className="px-4 py-3 text-gray-600">{c.discount || '-'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(c.startAt)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(c.endAt)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(c)} className={`text-xs px-2 py-1 rounded ${c.isActive === 1 ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                      {c.isActive === 1 ? '启用中' : '已停用'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(c)} className="text-blue-600 hover:text-blue-800 text-xs">编辑</button>
                      <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700 text-xs">删除</button>
                    </div>
                  </td>
                </tr>
              ))}
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
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{editing ? '编辑活动' : '新增活动'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">活动名称 *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="请输入活动名称" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">活动类型 *</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                  {Object.entries(typeMap).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">折扣/优惠内容</label>
                <input value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="如：8折、满100减20、赠送100积分" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">活动描述</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} placeholder="活动描述" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">活动规则</label>
                <textarea value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} placeholder="活动规则说明" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
                  <input type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
                  <input type="datetime-local" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4" />
                <span className="text-sm font-medium text-gray-700">立即启用</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">取消</button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">{editing ? '保存' : '创建'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
