'use client';

import { useState, useEffect, useMemo } from 'react';

type FortuneTeller = {
  id: string;
  userId: string;
  name: string | null;
  avatar: string | null;
  bio: string | null;
  specialties: string[];
  rating: number;
  isActive: number | boolean;
  createdAt: string;
  userEmail: string | null;
  userPhone: string | null;
  userUserName: string | null;
  userRole: string | null;
};

type UserOption = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
};

const DEFAULT_FORM = {
  userId: '',
  name: '',
  avatar: '',
  bio: '',
  specialtiesText: '',
  rating: 5,
  isActive: true,
};

export default function AdminFortuneTellersPage() {
  const [list, setList] = useState<FortuneTeller[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [stats, setStats] = useState({ total: 0, active: 0, avgRating: 0 });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FortuneTeller | null>(null);
  const [formData, setFormData] = useState({ ...DEFAULT_FORM });
  const [saving, setSaving] = useState(false);

  // 用户搜索（新增命理师时选择用户）
  const [userSearch, setUserSearch] = useState('');
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (keyword) params.set('keyword', keyword);
      const res = await fetch(`/api/admin/fortune-tellers?${params}`);
      if (res.ok) {
        const d = await res.json();
        setList(d.data || []);
        setTotal(d.total || 0);
        if (d.stats) setStats(d.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const searchUsers = async () => {
    if (!userSearch.trim()) {
      setUserOptions([]);
      return;
    }
    setSearchingUsers(true);
    try {
      const params = new URLSearchParams({ page: '1', pageSize: '20', keyword: userSearch });
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const d = await res.json();
        setUserOptions(d.users || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSearchingUsers(false);
    }
  };

  const openCreateModal = () => {
    setEditing(null);
    setFormData({ ...DEFAULT_FORM });
    setUserSearch('');
    setUserOptions([]);
    setModalOpen(true);
  };

  const openEditModal = (ft: FortuneTeller) => {
    setEditing(ft);
    setFormData({
      userId: ft.userId,
      name: ft.name || '',
      avatar: ft.avatar || '',
      bio: ft.bio || '',
      specialtiesText: ft.specialties.join('、'),
      rating: ft.rating,
      isActive: !!ft.isActive,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const specialties = formData.specialtiesText
      .split(/[、,，]/)
      .map((s) => s.trim())
      .filter(Boolean);

    setSaving(true);
    try {
      const body: any = {
        name: formData.name || null,
        avatar: formData.avatar || null,
        bio: formData.bio || null,
        specialties,
        rating: Number(formData.rating) || 5,
        isActive: formData.isActive,
        ...(editing ? { id: editing.id } : { userId: formData.userId }),
      };

      if (!editing && !body.userId) {
        alert('请选择要设为命理师的用户');
        setSaving(false);
        return;
      }

      const res = await fetch('/api/admin/fortune-tellers', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setModalOpen(false);
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || '保存失败');
      }
    } catch (e) {
      console.error(e);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (ft: FortuneTeller) => {
    const res = await fetch('/api/admin/fortune-tellers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: ft.id, isActive: !ft.isActive }),
    });
    if (res.ok) fetchData();
  };

  const handleDelete = async (ft: FortuneTeller) => {
    if (!confirm(`确定移除命理师「${ft.name || ft.userUserName || ft.userEmail || ''}」？`)) return;
    const res = await fetch(`/api/admin/fortune-tellers?id=${ft.id}`, { method: 'DELETE' });
    if (res.ok) fetchData();
  };

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    return (
      <span className="text-amber-500 text-sm">
        {'★'.repeat(full)}{half ? '☆' : ''}
        <span className="text-gray-400 ml-1 text-xs">{rating.toFixed(1)}</span>
      </span>
    );
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="text-sm text-gray-500">命理师总数</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="text-sm text-gray-500">启用中</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.active}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="text-sm text-gray-500">平均评分</div>
          <div className="text-2xl font-bold text-amber-500 mt-1">{stats.avgRating.toFixed(1)}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">命理师管理</h2>
          <p className="text-sm text-gray-500">共 {total} 位命理师</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="搜索姓名 / 邮箱 / 专长"
            className="px-3 py-2 border rounded-lg text-sm bg-white w-52"
          />
          <button onClick={handleSearch} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">搜索</button>
          <button onClick={openCreateModal} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">+ 新增命理师</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-4 py-3 text-gray-500 font-medium">姓名</th>
              <th className="px-4 py-3 text-gray-500 font-medium">邮箱</th>
              <th className="px-4 py-3 text-gray-500 font-medium">专长</th>
              <th className="px-4 py-3 text-gray-500 font-medium">评分</th>
              <th className="px-4 py-3 text-gray-500 font-medium">状态</th>
              <th className="px-4 py-3 text-gray-500 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">加载中...</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">暂无命理师，点击「新增命理师」添加</td></tr>
            ) : (
              list.map((ft) => (
                <tr key={ft.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {ft.avatar ? (
                        <img src={ft.avatar} alt="" className="w-8 h-8 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">{(ft.name || ft.userUserName || '?').slice(0, 1)}</div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{ft.name || ft.userUserName || '-'}</div>
                        {ft.bio && <div className="text-xs text-gray-400 max-w-[200px] truncate" title={ft.bio}>{ft.bio}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{ft.userEmail || ft.userPhone || ft.userId}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[220px]">
                      {ft.specialties.length ? ft.specialties.map((s, i) => (
                        <span key={i} className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">{s}</span>
                      )) : <span className="text-gray-400">-</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">{renderStars(ft.rating)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(ft)}
                      className={`text-xs px-2 py-1 rounded transition-colors ${
                        ft.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {ft.isActive ? '启用中' : '已禁用'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEditModal(ft)} className="text-blue-600 hover:text-blue-800 text-xs">编辑</button>
                      <button onClick={() => toggleActive(ft)} className="text-amber-600 hover:text-amber-800 text-xs">
                        {ft.isActive ? '禁用' : '启用'}
                      </button>
                      <button onClick={() => handleDelete(ft)} className="text-red-500 hover:text-red-700 text-xs">移除</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-500">第 {page} / {totalPages} 页</span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 text-sm border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >上一页</button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 text-sm border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >下一页</button>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{editing ? '编辑命理师' : '新增命理师'}</h3>

            {!editing && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">选择用户 *</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                    placeholder="按姓名/邮箱/手机号搜索用户"
                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  />
                  <button onClick={searchUsers} className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">搜索</button>
                </div>
                {searchingUsers && <div className="text-xs text-gray-400">搜索中...</div>}
                {userOptions.length > 0 && (
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    {userOptions.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setFormData({ ...formData, userId: u.id, name: u.name || formData.name });
                          setUserOptions([]);
                          setUserSearch(`${u.name || ''} ${u.email || u.phone || ''}`.trim());
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b last:border-0 ${
                          formData.userId === u.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="font-medium">{u.name || '(未命名)'}</div>
                        <div className="text-xs text-gray-500">{u.email || u.phone || u.id} · {u.role}</div>
                      </button>
                    ))}
                  </div>
                )}
                {formData.userId && (
                  <div className="text-xs text-green-600 mt-1">已选择用户 ID: {formData.userId}</div>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">展示姓名</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="对外展示的命理师姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">头像链接</label>
                <input
                  type="text"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">简介</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  rows={3}
                  placeholder="命理师简介"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">专长（用顿号或逗号分隔）</label>
                <input
                  type="text"
                  value={formData.specialtiesText}
                  onChange={(e) => setFormData({ ...formData, specialtiesText: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="八字命理、紫微斗数、风水"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">评分（0-5）</label>
                  <input
                    type="number"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    min={0}
                    max={5}
                    step={0.1}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 mt-7">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700">启用</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">取消</button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? '保存中...' : (editing ? '保存' : '创建')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function handleSearch() {
    setPage(1);
    fetchData();
  }
}
