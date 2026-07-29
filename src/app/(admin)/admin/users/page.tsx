'use client';

import { useState, useEffect } from 'react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editField, setEditField] = useState('');
  const [editValue, setEditValue] = useState('');

  const pageSize = 20;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (keyword) params.set('keyword', keyword);
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setTotal(data.total || 0);
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleEdit = async () => {
    if (!editUserId) return;
    try {
      await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: editUserId, [editField]: editValue }),
      });
      setEditUserId(null);
      fetchUsers();
    } catch {}
  };

  const memberLevels = ['free', 'monthly', 'yearly', 'lifetime'];
  const roles = ['user', 'admin', 'agent'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">用户管理</h2>
          <p className="text-sm text-gray-500">共 {total} 个用户</p>
        </div>
      </div>

      {/* 搜索 */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="搜索邮箱、名称或手机号" className="flex-1 px-4 py-2 border rounded-lg text-sm" />
        <button type="submit" className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800">搜索</button>
      </form>

      {/* 表格 */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-4 py-3 text-gray-500 font-medium">邮箱</th>
              <th className="px-4 py-3 text-gray-500 font-medium">名称</th>
              <th className="px-4 py-3 text-gray-500 font-medium">会员等级</th>
              <th className="px-4 py-3 text-gray-500 font-medium">角色</th>
              <th className="px-4 py-3 text-gray-500 font-medium">使用量</th>
              <th className="px-4 py-3 text-gray-500 font-medium">注册时间</th>
              <th className="px-4 py-3 text-gray-500 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900">{u.email}</td>
                <td className="px-4 py-3">{u.name || '-'}</td>
                <td className="px-4 py-3">
                  <select value={u.memberLevel} onChange={e => { setEditUserId(u.id); setEditField('memberLevel'); setEditValue(e.target.value); }}
                    className="text-xs px-2 py-1 border rounded"
                  >
                    {memberLevels.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select value={u.role} onChange={e => { setEditUserId(u.id); setEditField('role'); setEditValue(e.target.value); }}
                    className="text-xs px-2 py-1 border rounded"
                  >
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-gray-600">{u.dailyUsage || 0}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('zh-CN') : '-'}</td>
                <td className="px-4 py-3">
                  <button onClick={async () => {
                    if (!confirm('确认更新?')) return;
                    setEditUserId(u.id); setEditField('memberLevel'); setEditValue(u.memberLevel);
                    await handleEdit();
                  }} className="text-xs text-red-600 hover:text-red-800">保存</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-500">第 {page} / {Math.ceil(total / pageSize)} 页</span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50">上一页</button>
          <button disabled={page >= Math.ceil(total / pageSize)} onClick={() => setPage(p => p + 1)} className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50">下一页</button>
        </div>
      </div>
    </div>
  );
}
