'use client';

import { useState, useEffect } from 'react';

export default function AdminBlacklistPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterType, setFilterType] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newExpiry, setNewExpiry] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const pageSize = 20;

  const fetchList = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (keyword) params.set('keyword', keyword);
      if (filterType) params.set('type', filterType);
      const res = await fetch(`/api/admin/blacklist?${params}`);
      if (res.ok) {
        const d = await res.json();
        setItems(d.items || []);
        setTotal(d.total || 0);
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchList(); }, [page, keyword, filterType]);

  const handleSearch = () => { setKeyword(searchInput); setPage(1); };

  const handleAdd = async () => {
    if (!newUserId.trim()) { alert('请输入用户 ID 或邮箱'); return; }
    setSubmitting(true);
    try {
      const expiryAt = newExpiry ? new Date(newExpiry).toISOString() : null;
      const res = await fetch('/api/admin/blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: newUserId.trim(),
          reason: newReason.trim(),
          expiryAt,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setNewUserId('');
        setNewReason('');
        setNewExpiry('');
        fetchList();
      } else {
        const d = await res.json();
        alert(d.error || '添加失败');
      }
    } catch (e: any) {
      alert('网络错误');
    } finally { setSubmitting(false); }
  };

  const handleRemove = async (item: any) => {
    if (!confirm(`确定解封用户 ${item.userId}？`)) return;
    try {
      const res = await fetch(`/api/admin/blacklist?userId=${encodeURIComponent(item.userId)}`, {
        method: 'DELETE',
      });
      if (res.ok) fetchList();
      else {
        const d = await res.json();
        alert(d.error || '解封失败');
      }
    } catch { alert('网络错误'); }
  };

  const statusBadge = (item: any) => {
    const expired = item.expiryAt && new Date(item.expiryAt) < new Date();
    if (expired) return <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">已过期</span>;
    if (item.permanent) return <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">永久</span>;
    return <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-700">临时</span>;
  };

  const formatDate = (v: string | null) =>
    v ? new Date(v).toLocaleString('zh-CN') : '永久';

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">黑名单管理</h2>
          <p className="text-sm text-gray-500">共 {total} 条记录</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
            placeholder="搜索用户ID/邮箱/原因"
            className="px-3 py-2 border rounded-lg text-sm w-56"
          />
          <button onClick={handleSearch} className="px-3 py-2 text-sm border rounded-lg bg-white hover:bg-gray-50">搜索</button>
          <select
            value={filterType}
            onChange={e => { setFilterType(e.target.value); setPage(1); }}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">全部类型</option>
            <option value="permanent">永久封禁</option>
            <option value="temporary">临时封禁</option>
          </select>
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            + 添加黑名单
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-4 py-3 text-gray-500 font-medium">用户ID</th>
              <th className="px-4 py-3 text-gray-500 font-medium">邮箱</th>
              <th className="px-4 py-3 text-gray-500 font-medium">昵称</th>
              <th className="px-4 py-3 text-gray-500 font-medium">封禁原因</th>
              <th className="px-4 py-3 text-gray-500 font-medium">类型</th>
              <th className="px-4 py-3 text-gray-500 font-medium">封禁时间</th>
              <th className="px-4 py-3 text-gray-500 font-medium">过期时间</th>
              <th className="px-4 py-3 text-gray-500 font-medium">操作人</th>
              <th className="px-4 py-3 text-gray-500 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
            )}
            {!loading && items.map((it: any) => (
              <tr key={it.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{it.userId}</td>
                <td className="px-4 py-3">{it.userEmail || '-'}</td>
                <td className="px-4 py-3">{it.userName || '-'}</td>
                <td className="px-4 py-3 text-gray-700">{it.reason || '-'}</td>
                <td className="px-4 py-3">{statusBadge(it)}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{formatDate(it.createdAt)}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{formatDate(it.expiryAt)}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{it.operator || '-'}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleRemove(it)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    解封
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-500">
          {total === 0 ? '无数据' : `第 ${page} / ${Math.ceil(total / pageSize)} 页`}
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50"
          >
            上一页
          </button>
          <button
            disabled={page >= Math.ceil(total / pageSize)}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="px-6 py-4 border-b">
              <h3 className="text-base font-bold">添加到黑名单</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">用户 ID / 邮箱 *</label>
                <input
                  value={newUserId}
                  onChange={e => setNewUserId(e.target.value)}
                  placeholder="输入用户 ID 或邮箱地址"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">封禁原因</label>
                <textarea
                  value={newReason}
                  onChange={e => setNewReason(e.target.value)}
                  placeholder="请填写封禁原因"
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">过期时间（留空为永久）</label>
                <input
                  type="datetime-local"
                  value={newExpiry}
                  onChange={e => setNewExpiry(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                disabled={submitting}
                className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleAdd}
                disabled={submitting}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? '提交中...' : '确认添加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
