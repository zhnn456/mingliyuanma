'use client';

import { useState, useEffect } from 'react';

type UserTag = {
  id: string;
  name: string;
  color: string;
  description: string;
  createdAt: string;
  userCount: number;
};

type TagUser = {
  id: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  taggedAt: string;
};

const PRESET_COLORS = [
  '#6366f1', '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
];

export default function AdminTagsPage() {
  const [tags, setTags] = useState<UserTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [tagModal, setTagModal] = useState(false);
  const [editingTag, setEditingTag] = useState<UserTag | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#6366f1',
    description: '',
  });

  const [batchModal, setBatchModal] = useState(false);
  const [batchUsers, setBatchUsers] = useState<any[]>([]);
  const [batchUserIds, setBatchUserIds] = useState<string[]>([]);
  const [batchTagIds, setBatchTagIds] = useState<string[]>([]);
  const [userKeyword, setUserKeyword] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [batchMode, setBatchMode] = useState<'add' | 'remove'>('add');
  const pageSize = 20;

  const [viewTagUsers, setViewTagUsers] = useState<UserTag | null>(null);
  const [tagUsers, setTagUsers] = useState<TagUser[]>([]);
  const [tagUserPage, setTagUserPage] = useState(1);
  const [tagUserTotal, setTagUserTotal] = useState(0);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/tags');
      if (res.ok) {
        const data = await res.json();
        setTags(data.tags || []);
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchTags(); }, []);

  const openAddTag = () => {
    setEditingTag(null);
    setFormData({ name: '', color: '#6366f1', description: '' });
    setTagModal(true);
  };

  const openEditTag = (tag: UserTag) => {
    setEditingTag(tag);
    setFormData({ name: tag.name, color: tag.color, description: tag.description });
    setTagModal(true);
  };

  const handleSaveTag = async () => {
    if (!formData.name) return;
    try {
      if (editingTag) {
        await fetch('/api/admin/tags', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingTag.id, ...formData }),
        });
      } else {
        await fetch('/api/admin/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }
      setTagModal(false);
      fetchTags();
    } catch {}
  };

  const handleDeleteTag = async (id: string) => {
    if (!confirm('确定删除此标签？关联的用户标签关系也会被移除。')) return;
    try {
      await fetch(`/api/admin/tags?id=${id}`, { method: 'DELETE' });
      fetchTags();
    } catch {}
  };

  const fetchUsersForBatch = async () => {
    try {
      const params = new URLSearchParams({ page: String(userPage), pageSize: String(pageSize) });
      if (userKeyword) params.set('keyword', userKeyword);
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setBatchUsers(data.users || []);
        setUserTotal(data.total || 0);
      }
    } catch {}
  };

  const openBatchModal = () => {
    setBatchUserIds([]);
    setBatchTagIds([]);
    setBatchMode('add');
    setUserPage(1);
    setUserKeyword('');
    setBatchModal(true);
    fetchUsersForBatch();
  };

  useEffect(() => {
    if (batchModal) fetchUsersForBatch();
  }, [userPage, userKeyword]);

  const toggleUser = (userId: string) => {
    setBatchUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const toggleTag = (tagId: string) => {
    setBatchTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleBatchSubmit = async () => {
    if (batchUserIds.length === 0 || batchTagIds.length === 0) return;
    try {
      const res = await fetch('/api/admin/tags/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: batchUserIds,
          tagIds: batchTagIds,
          mode: batchMode,
        }),
      });
      if (res.ok) {
        alert(batchMode === 'add' ? `已为 ${batchUserIds.length} 个用户添加 ${batchTagIds.length} 个标签` : `已移除标签`);
        setBatchModal(false);
        fetchTags();
      }
    } catch {}
  };

  const fetchTagUsers = async (tag: UserTag) => {
    setViewTagUsers(tag);
    setTagUserPage(1);
    try {
      const res = await fetch(`/api/admin/tags?tagId=${tag.id}&page=1&pageSize=20`);
      if (res.ok) {
        const data = await res.json();
        setTagUsers(data.rows || []);
        setTagUserTotal(data.total || 0);
      }
    } catch {}
  };

  const loadMoreTagUsers = async () => {
    if (!viewTagUsers) return;
    const nextPage = tagUserPage + 1;
    try {
      const res = await fetch(`/api/admin/tags?tagId=${viewTagUsers.id}&page=${nextPage}&pageSize=20`);
      if (res.ok) {
        const data = await res.json();
        setTagUsers(prev => [...prev, ...(data.rows || [])]);
        setTagUserTotal(data.total || 0);
        setTagUserPage(nextPage);
      }
    } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">用户标签</h2>
          <p className="text-sm text-gray-500">共 {tags.length} 个标签</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openBatchModal}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800"
          >
            批量打标签
          </button>
          <button
            onClick={openAddTag}
            className="px-4 py-2 bg-red-700 text-white rounded-lg text-sm hover:bg-red-800"
          >
            + 新增标签
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : tags.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border">
          暂无标签，点击「新增标签」创建
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left">
                <th className="px-4 py-3 text-gray-500 font-medium">标签</th>
                <th className="px-4 py-3 text-gray-500 font-medium">颜色</th>
                <th className="px-4 py-3 text-gray-500 font-medium">描述</th>
                <th className="px-4 py-3 text-gray-500 font-medium">用户数</th>
                <th className="px-4 py-3 text-gray-500 font-medium">创建时间</th>
                <th className="px-4 py-3 text-gray-500 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr key={tag.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <span
                      className="inline-block w-3 h-3 rounded-full mr-2 align-middle"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-block w-6 h-6 rounded border"
                      style={{ backgroundColor: tag.color }}
                    />
                  </td>
                  <td className="px-4 py-3 text-gray-600">{tag.description || '-'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => fetchTagUsers(tag)}
                      className="text-blue-600 hover:underline"
                    >
                      {tag.userCount} 人
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {tag.createdAt ? new Date(tag.createdAt).toLocaleString('zh-CN') : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditTag(tag)}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDeleteTag(tag.id)}
                        className="text-red-600 hover:underline text-xs"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tagModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">{editingTag ? '编辑标签' : '新增标签'}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-700 block mb-1">标签名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="如: VIP用户"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-gray-700 block mb-1">颜色</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded border-2 transition-all ${
                        formData.color === color ? 'border-gray-900 scale-110' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={formData.color}
                    onChange={e => setFormData({ ...formData, color: e.target.value })}
                    className="w-8 h-8 rounded border cursor-pointer"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-700 block mb-1">描述</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="标签用途说明"
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setTagModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSaveTag}
                className="flex-1 px-4 py-2 bg-red-700 text-white rounded-lg text-sm hover:bg-red-800"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {batchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">批量打标签</h3>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-700">选择用户</h4>
                  <span className="text-xs text-blue-600">已选 {batchUserIds.length} 人</span>
                </div>
                <input
                  type="text"
                  value={userKeyword}
                  onChange={e => { setUserKeyword(e.target.value); setUserPage(1); }}
                  placeholder="搜索用户..."
                  className="w-full px-3 py-2 border rounded-lg text-sm mb-2"
                />
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {batchUsers.map((user: any) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={batchUserIds.includes(user.id)}
                        onChange={() => toggleUser(user.id)}
                        className="rounded"
                      />
                      <span className="text-sm">{user.name || user.email}</span>
                      <span className="text-xs text-gray-400">{user.email}</span>
                    </label>
                  ))}
                  {batchUsers.length === 0 && (
                    <div className="text-center py-4 text-gray-400 text-sm">无用户</div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">共 {userTotal} 个用户</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setUserPage(p => Math.max(1, p - 1))}
                      disabled={userPage <= 1}
                      className="px-2 py-1 text-xs border rounded disabled:opacity-50"
                    >
                      上一页
                    </button>
                    <button
                      onClick={() => setUserPage(p => p + 1)}
                      disabled={userPage * pageSize >= userTotal}
                      className="px-2 py-1 text-xs border rounded disabled:opacity-50"
                    >
                      下一页
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-700">选择标签</h4>
                  <span className="text-xs text-blue-600">已选 {batchTagIds.length} 个</span>
                </div>
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {tags.map((tag) => (
                    <label
                      key={tag.id}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={batchTagIds.includes(tag.id)}
                        onChange={() => toggleTag(tag.id)}
                        className="rounded"
                      />
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm">{tag.name}</span>
                    </label>
                  ))}
                  {tags.length === 0 && (
                    <div className="text-center py-4 text-gray-400 text-sm">无标签</div>
                  )}
                </div>

                <div className="mt-4">
                  <label className="text-sm text-gray-700 block mb-2">操作模式</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={batchMode === 'add'}
                        onChange={() => setBatchMode('add')}
                      />
                      <span className="text-sm">添加标签</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={batchMode === 'remove'}
                        onChange={() => setBatchMode('remove')}
                      />
                      <span className="text-sm">移除标签</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setBatchModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleBatchSubmit}
                disabled={batchUserIds.length === 0 || batchTagIds.length === 0}
                className="flex-1 px-4 py-2 bg-red-700 text-white rounded-lg text-sm hover:bg-red-800 disabled:opacity-50"
              >
                确认（{batchMode === 'add' ? '添加' : '移除'} {batchTagIds.length} 个标签到 {batchUserIds.length} 个用户）
              </button>
            </div>
          </div>
        </div>
      )}

      {viewTagUsers && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold">
                  <span
                    className="inline-block w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: viewTagUsers.color }}
                  />
                  {viewTagUsers.name} - 标签用户
                </h3>
                <p className="text-sm text-gray-500">共 {tagUserTotal} 个用户</p>
              </div>
              <button
                onClick={() => setViewTagUsers(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {tagUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-400">暂无用户</div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b text-left">
                      <th className="px-4 py-2 text-gray-500 font-medium">用户</th>
                      <th className="px-4 py-2 text-gray-500 font-medium">邮箱</th>
                      <th className="px-4 py-2 text-gray-500 font-medium">手机号</th>
                      <th className="px-4 py-2 text-gray-500 font-medium">打标签时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tagUsers.map((user, idx) => (
                      <tr key={`${user.id}-${idx}`} className="border-b last:border-b-0 hover:bg-gray-50">
                        <td className="px-4 py-2">{user.userName || '-'}</td>
                        <td className="px-4 py-2 text-gray-600">{user.userEmail || '-'}</td>
                        <td className="px-4 py-2 text-gray-600">{user.userPhone || '-'}</td>
                        <td className="px-4 py-2 text-xs text-gray-500">
                          {user.taggedAt ? new Date(user.taggedAt).toLocaleString('zh-CN') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tagUsers.length < tagUserTotal && (
              <button
                onClick={loadMoreTagUsers}
                className="mt-4 w-full py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                加载更多
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}