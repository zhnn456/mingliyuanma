'use client';

import { useState, useEffect } from 'react';

const typeMap: Record<string, string> = {
  system: '系统通知',
  activity: '活动通知',
  order: '订单通知',
  custom: '自定义',
};

const targetMap: Record<string, string> = {
  all: '全部用户',
  member: '会员',
  free: '免费用户',
  specific: '指定用户',
};

interface Notification {
  id: string;
  title: string;
  content: string | null;
  type: string;
  target: string;
  targetUsers: string | null;
  sentAt: string | null;
  readCount: number;
  totalCount: number;
  status: string;
  createdBy: string | null;
  createdAt: string;
}

export default function NotificationsPage() {
  const [data, setData] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Notification | null>(null);
  const [stats, setStats] = useState({ total: 0, sent: 0, readTotal: 0, sending: 0 });

  const [form, setForm] = useState({
    title: '', content: '', type: 'system', target: 'all', targetUsers: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (searchKeyword) params.set('keyword', searchKeyword);
      if (typeFilter) params.set('type', typeFilter);
      const res = await fetch(`/api/admin/notifications?${params}`);
      if (res.ok) {
        const d = await res.json();
        setData(d.data || []);
        setTotal(d.total || 0);
      }
    } catch {} finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/notifications?pageSize=10000');
      if (res.ok) {
        const d = await res.json();
        const all = d.data || [];
        setStats({
          total: all.length,
          sent: all.filter((n: Notification) => n.status === 'sent').length,
          readTotal: all.reduce((s: number, n: Notification) => s + (n.readCount || 0), 0),
          sending: all.filter((n: Notification) => n.status === 'pending' || n.status === 'sending').length,
        });
      }
    } catch {}
  };

  useEffect(() => { fetchData(); }, [page]);
  useEffect(() => { fetchStats(); }, []);

  const onSearch = () => { setPage(1); fetchData(); fetchStats(); };

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', content: '', type: 'system', target: 'all', targetUsers: '' });
    setShowModal(true);
  };

  const openEdit = (n: Notification) => {
    setEditing(n);
    setForm({
      title: n.title, content: n.content || '', type: n.type, target: n.target, targetUsers: n.targetUsers || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.type || !form.target) { alert('请填写必填项'); return; }
    if (editing) {
      const res = await fetch('/api/admin/notifications', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, ...form }),
      });
      if (res.ok) { setShowModal(false); fetchData(); fetchStats(); }
      else { const e = await res.json(); alert(e.error || '更新失败'); }
    } else {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) { setShowModal(false); fetchData(); fetchStats(); }
      else { const e = await res.json(); alert(e.error || '发送失败'); }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此通知？')) return;
    const res = await fetch(`/api/admin/notifications?ids=${id}`, { method: 'DELETE' });
    if (res.ok) { fetchData(); fetchStats(); }
  };

  const fmtDate = (s: string | null) => s ? new Date(s).toLocaleString('zh-CN') : '-';
  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-slate-900">推送通知</h1>
        <p className="text-sm text-slate-500 mt-1">管理推送通知与消息</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { label: '总通知', value: stats.total, color: 'text-blue-600' },
          { label: '已发送', value: stats.sent, color: 'text-green-600' },
          { label: '已读总数', value: stats.readTotal, color: 'text-purple-600' },
          { label: '发送中', value: stats.sending, color: 'text-amber-600' },
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
            placeholder="搜索标题/内容"
            className="px-3 py-2 border rounded-lg text-sm flex-1"
          />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">全部类型</option>
            {Object.entries(typeMap).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button onClick={onSearch} className="px-4 py-2 bg-slate-100 rounded-lg text-sm hover:bg-slate-200">搜索</button>
          <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">+ 发送通知</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left">
                <th className="px-4 py-3 text-gray-500 font-medium">标题</th>
                <th className="px-4 py-3 text-gray-500 font-medium">类型</th>
                <th className="px-4 py-3 text-gray-500 font-medium">目标</th>
                <th className="px-4 py-3 text-gray-500 font-medium">发送时间</th>
                <th className="px-4 py-3 text-gray-500 font-medium">已读/总数</th>
                <th className="px-4 py-3 text-gray-500 font-medium">状态</th>
                <th className="px-4 py-3 text-gray-500 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
              ) : data.map((n) => (
                <tr key={n.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium max-w-[240px] truncate" title={n.title}>{n.title}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">{typeMap[n.type] || n.type}</span></td>
                  <td className="px-4 py-3 text-gray-600">{targetMap[n.target] || n.target}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(n.sentAt)}</td>
                  <td className="px-4 py-3 text-gray-600">{n.readCount} / {n.totalCount}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded ${n.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                      {n.status === 'sent' ? '已发送' : n.status === 'pending' ? '待发送' : n.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(n)} className="text-blue-600 hover:text-blue-800 text-xs">编辑</button>
                      <button onClick={() => handleDelete(n.id)} className="text-red-500 hover:text-red-700 text-xs">删除</button>
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
            <h3 className="text-lg font-bold mb-4">{editing ? '编辑通知' : '发送通知'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">通知标题 *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="请输入通知标题" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">通知类型 *</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                    {Object.entries(typeMap).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">目标范围 *</label>
                  <select value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                    {Object.entries(targetMap).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              {form.target === 'specific' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">指定用户ID（逗号分隔）</label>
                  <input value={form.targetUsers} onChange={(e) => setForm({ ...form, targetUsers: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="user_1, user_2, user_3" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">通知内容</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" rows={4} placeholder="请输入通知内容" />
              </div>
              {form.title && form.content && (
                <div className="bg-gray-50 rounded-lg p-3 border">
                  <div className="text-xs text-gray-500 mb-1">预览：</div>
                  <div className="text-sm font-medium text-gray-900">{form.title}</div>
                  <div className="text-sm text-gray-600 mt-1">{form.content}</div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">取消</button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">{editing ? '保存' : '发送'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
