'use client';

import { useState, useEffect } from 'react';

const roleMap: Record<string, string> = {
  admin: '管理员',
  editor: '编辑',
};

interface AdminUser {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  role: string;
  createdAt: string;
}

export default function AdminsPage() {
  const [data, setData] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [stats, setStats] = useState({ admins: 0, editors: 0, totalUsers: 0 });

  const [form, setForm] = useState({
    email: '', name: '', phone: '', role: 'editor', password: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (searchKeyword) params.set('keyword', searchKeyword);
      const res = await fetch(`/api/admin/admins?${params}`);
      if (res.ok) {
        const d = await res.json();
        setData(d.data || []);
        setTotal(d.total || 0);
      }
    } catch {} finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/admins?pageSize=10000');
      if (res.ok) {
        const d = await res.json();
        const all = d.data || [];
        const usersRes = await fetch('/api/admin/users?pageSize=1');
        let totalUsers = 0;
        if (usersRes.ok) {
          const ud = await usersRes.json();
          totalUsers = ud.total || 0;
        }
        setStats({
          admins: all.filter((u: AdminUser) => u.role === 'admin').length,
          editors: all.filter((u: AdminUser) => u.role === 'editor').length,
          totalUsers,
        });
      }
    } catch {}
  };

  useEffect(() => { fetchData(); }, [page]);
  useEffect(() => { fetchStats(); }, []);

  const onSearch = () => { setPage(1); fetchData(); fetchStats(); };

  const openCreate = () => {
    setEditing(null);
    setForm({ email: '', name: '', phone: '', role: 'editor', password: '' });
    setShowModal(true);
  };

  const openEdit = (u: AdminUser) => {
    setEditing(u);
    setForm({ email: u.email || '', name: u.name || '', phone: u.phone || '', role: u.role, password: '' });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (editing) {
      const res = await fetch('/api/admin/admins', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, name: form.name, phone: form.phone, role: form.role }),
      });
      if (res.ok) { setShowModal(false); fetchData(); fetchStats(); }
      else { const e = await res.json(); alert(e.error || '更新失败'); }
    } else {
      if (!form.email || !form.password) { alert('请填写邮箱和密码'); return; }
      const res = await fetch('/api/admin/admins', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) { setShowModal(false); fetchData(); fetchStats(); }
      else { const e = await res.json(); alert(e.error || '创建失败'); }
    }
  };

  const handleRemoveRole = async (u: AdminUser) => {
    if (!confirm(`确定移除「${u.name || u.email}」的管理权限？该用户将变为普通用户。`)) return;
    const res = await fetch(`/api/admin/admins?id=${u.id}`, { method: 'DELETE' });
    if (res.ok) { fetchData(); fetchStats(); }
    else { const e = await res.json(); alert(e.error || '移除失败'); }
  };

  const fmtDate = (s: string | null) => s ? new Date(s).toLocaleString('zh-CN') : '-';
  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-slate-900">管理员权限</h1>
        <p className="text-sm text-slate-500 mt-1">管理后台管理员与编辑账号</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: '管理员数', value: stats.admins, color: 'text-blue-600' },
          { label: '编辑数', value: stats.editors, color: 'text-green-600' },
          { label: '总用户', value: stats.totalUsers, color: 'text-purple-600' },
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
            placeholder="搜索姓名/邮箱/手机"
            className="px-3 py-2 border rounded-lg text-sm flex-1"
          />
          <button onClick={onSearch} className="px-4 py-2 bg-slate-100 rounded-lg text-sm hover:bg-slate-200">搜索</button>
          <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">+ 添加管理员</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left">
                <th className="px-4 py-3 text-gray-500 font-medium">姓名</th>
                <th className="px-4 py-3 text-gray-500 font-medium">邮箱</th>
                <th className="px-4 py-3 text-gray-500 font-medium">手机</th>
                <th className="px-4 py-3 text-gray-500 font-medium">角色</th>
                <th className="px-4 py-3 text-gray-500 font-medium">创建时间</th>
                <th className="px-4 py-3 text-gray-500 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
              ) : data.map((u) => (
                <tr key={u.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.name || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{u.phone || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded ${u.role === 'admin' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                      {roleMap[u.role] || u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(u)} className="text-blue-600 hover:text-blue-800 text-xs">编辑角色</button>
                      <button onClick={() => handleRemoveRole(u)} className="text-red-500 hover:text-red-700 text-xs">移除权限</button>
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
            <h3 className="text-lg font-bold mb-4">{editing ? '编辑管理员' : '添加管理员'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱 {!editing && '*'}</label>
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="请输入邮箱" disabled={!!editing} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="请输入姓名" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">手机</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="请输入手机号" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">角色 *</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="admin">管理员</option>
                  <option value="editor">编辑</option>
                </select>
              </div>
              {!editing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">密码 *</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="请设置登录密码" />
                </div>
              )}
              {editing && (
                <div className="text-xs text-gray-500 bg-amber-50 p-2 rounded">提示：编辑模式下不可修改密码与邮箱，如需修改密码请前往用户管理。</div>
              )}
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
