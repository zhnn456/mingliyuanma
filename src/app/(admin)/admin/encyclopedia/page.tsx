'use client';

import { useState, useEffect, useMemo } from 'react';

type Encyclopedia = {
  id: string;
  title: string;
  category: string;
  content: string | null;
  tags: string[];
  viewCount: number;
  sortOrder: number;
  isActive: number | boolean;
  createdAt: string;
  updatedAt: string;
};

const CATEGORIES = [
  '八字命理',
  '紫微斗数',
  '奇门遁甲',
  '梅花易数',
  '风水堪舆',
  '姓名学',
  '其他',
];

const CATEGORY_COLOR: Record<string, string> = {
  '八字命理': 'bg-red-100 text-red-700',
  '紫微斗数': 'bg-pink-100 text-pink-700',
  '奇门遁甲': 'bg-emerald-100 text-emerald-700',
  '梅花易数': 'bg-amber-100 text-amber-700',
  '风水堪舆': 'bg-indigo-100 text-indigo-700',
  '姓名学': 'bg-purple-100 text-purple-700',
  '其他': 'bg-gray-100 text-gray-700',
};

const DEFAULT_FORM = {
  title: '',
  category: '其他',
  content: '',
  tagsText: '',
  sortOrder: 0,
  isActive: true,
};

export default function AdminEncyclopediaPage() {
  const [list, setList] = useState<Encyclopedia[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [stats, setStats] = useState({ total: 0, active: 0, totalViews: 0 });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Encyclopedia | null>(null);
  const [formData, setFormData] = useState({ ...DEFAULT_FORM });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (keyword) params.set('keyword', keyword);
      if (category) params.set('category', category);
      const res = await fetch(`/api/admin/encyclopedia?${params}`);
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
  }, [page, category]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const handleReset = () => {
    setKeyword('');
    setCategory('');
    setPage(1);
  };

  const openCreateModal = () => {
    setEditing(null);
    setFormData({ ...DEFAULT_FORM });
    setModalOpen(true);
  };

  const openEditModal = (item: Encyclopedia) => {
    setEditing(item);
    setFormData({
      title: item.title,
      category: item.category,
      content: item.content || '',
      tagsText: item.tags.join('、'),
      sortOrder: item.sortOrder,
      isActive: !!item.isActive,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      alert('请填写标题');
      return;
    }
    const tags = formData.tagsText
      .split(/[、,，]/)
      .map((s) => s.trim())
      .filter(Boolean);

    setSaving(true);
    try {
      const body = {
        title: formData.title.trim(),
        category: formData.category,
        content: formData.content,
        tags,
        sortOrder: Number(formData.sortOrder) || 0,
        isActive: formData.isActive,
        ...(editing ? { id: editing.id } : {}),
      };
      const res = await fetch('/api/admin/encyclopedia', {
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

  const toggleActive = async (item: Encyclopedia) => {
    const res = await fetch('/api/admin/encyclopedia', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, isActive: !item.isActive }),
    });
    if (res.ok) fetchData();
  };

  const handleDelete = async (item: Encyclopedia) => {
    if (!confirm(`确定删除百科条目「${item.title}」？`)) return;
    const res = await fetch(`/api/admin/encyclopedia?id=${item.id}`, { method: 'DELETE' });
    if (res.ok) fetchData();
  };

  const formatDate = (s: string | null) => (s ? new Date(s).toLocaleString('zh-CN') : '-');

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="text-sm text-gray-500">总条目数</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="text-sm text-gray-500">已上架</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.active}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="text-sm text-gray-500">总浏览量</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{stats.totalViews}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">命理百科</h2>
          <p className="text-sm text-gray-500">共 {total} 条记录</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="搜索标题 / 内容 / 标签"
            className="px-3 py-2 border rounded-lg text-sm bg-white w-52"
          />
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          >
            <option value="">全部分类</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button onClick={handleSearch} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">搜索</button>
          <button onClick={handleReset} className="px-4 py-2 text-sm border rounded-lg bg-white hover:bg-gray-50">重置</button>
          <button onClick={openCreateModal} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">+ 新增条目</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-4 py-3 text-gray-500 font-medium">标题</th>
              <th className="px-4 py-3 text-gray-500 font-medium">分类</th>
              <th className="px-4 py-3 text-gray-500 font-medium">标签</th>
              <th className="px-4 py-3 text-gray-500 font-medium">浏览数</th>
              <th className="px-4 py-3 text-gray-500 font-medium">状态</th>
              <th className="px-4 py-3 text-gray-500 font-medium">更新时间</th>
              <th className="px-4 py-3 text-gray-500 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">加载中...</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">暂无百科条目</td></tr>
            ) : (
              list.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{item.title}</div>
                    {item.sortOrder ? <div className="text-xs text-gray-400">排序 {item.sortOrder}</div> : null}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${CATEGORY_COLOR[item.category] || 'bg-gray-100 text-gray-700'}`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {item.tags.length ? item.tags.map((t, i) => (
                        <span key={i} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">{t}</span>
                      )) : <span className="text-gray-400">-</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.viewCount ?? 0}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(item)}
                      className={`text-xs px-2 py-1 rounded transition-colors ${
                        item.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {item.isActive ? '已上架' : '已下架'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(item.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEditModal(item)} className="text-blue-600 hover:text-blue-800 text-xs">编辑</button>
                      <button onClick={() => handleDelete(item)} className="text-red-500 hover:text-red-700 text-xs">删除</button>
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
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{editing ? '编辑百科条目' : '新增百科条目'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="条目标题"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">排序（数字越小越靠前）</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    min={0}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">标签（用顿号或逗号分隔）</label>
                <input
                  type="text"
                  value={formData.tagsText}
                  onChange={(e) => setFormData({ ...formData, tagsText: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="基础、入门、进阶"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                  rows={10}
                  placeholder="支持 Markdown 格式的内容"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">立即上架</span>
                </label>
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
}
