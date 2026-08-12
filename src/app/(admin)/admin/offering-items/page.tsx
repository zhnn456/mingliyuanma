'use client';

import { useState, useEffect, useCallback } from 'react';

type Category = {
  id: string;
  name: string;
  icon?: string;
};

type OfferingItem = {
  id: string;
  category: string;
  name: string;
  icon?: string;
  image?: string;
  description?: string;
  price: number;
  priceMonth: number;
  priceYear: number;
  isActive: number | boolean;
  sortOrder: number;
  stock: number;
  categoryName?: string;
  categoryIcon?: string;
};

const emptyForm = {
  category: '',
  name: '',
  icon: '',
  image: '',
  description: '',
  price: 0,
  priceMonth: 0,
  priceYear: 0,
  sortOrder: 0,
  isActive: true,
  stock: 0,
};

export default function OfferingItemsPage() {
  const [data, setData] = useState<OfferingItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, categories: 0 });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (keyword) params.set('keyword', keyword);
      if (categoryId) params.set('categoryId', categoryId);

      const res = await fetch(`/api/admin/offering-items?${params}`);
      if (res.ok) {
        const d = await res.json();
        setData(d.data || []);
        setTotal(d.total || 0);
        if (d.stats) setStats(d.stats);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, categoryId]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/offering');
      if (res.ok) {
        const d = await res.json();
        setCategories(d.categories || []);
      }
    } catch {}
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const openAdd = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      category: categories[0]?.id || '',
    });
    setModalOpen(true);
  };

  const openEdit = (it: OfferingItem) => {
    setEditingId(it.id);
    setForm({
      category: it.category || '',
      name: it.name || '',
      icon: it.icon || '',
      image: it.image || '',
      description: it.description || '',
      price: Number(it.price) || 0,
      priceMonth: Number(it.priceMonth) || 0,
      priceYear: Number(it.priceYear) || 0,
      sortOrder: Number(it.sortOrder) || 0,
      isActive: it.isActive === true || it.isActive === 1,
      stock: Number(it.stock) || 0,
    });
    setModalOpen(true);
  };

  const submit = async () => {
    if (!form.name || !form.category) {
      alert('请填写名称并选择分类');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price) || 0,
        priceMonth: Number(form.priceMonth) || 0,
        priceYear: Number(form.priceYear) || 0,
        sortOrder: Number(form.sortOrder) || 0,
        stock: Number(form.stock) || 0,
        isActive: form.isActive,
      };
      const res = await fetch('/api/admin/offering-items', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });
      if (res.ok) {
        setModalOpen(false);
        fetchData();
      } else {
        const d = await res.json();
        alert(d.error || '操作失败');
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (it: OfferingItem) => {
    const next = !(it.isActive === true || it.isActive === 1);
    const res = await fetch('/api/admin/offering-items', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: it.id, isActive: next }),
    });
    if (res.ok) fetchData();
    else alert('操作失败');
  };

  const remove = async (id: string) => {
    if (!confirm('确定删除该供奉项目？')) return;
    const res = await fetch(`/api/admin/offering-items?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      if (data.length === 1 && page > 1) setPage(page - 1);
      else fetchData();
    } else {
      const d = await res.json();
      alert(d.error || '删除失败');
    }
  };

  const onSearch = () => {
    setPage(1);
    fetchData();
  };

  const statCards = [
    { label: '总项目数', value: stats.total, color: 'text-slate-900' },
    { label: '上架中', value: stats.active, color: 'text-green-700' },
    { label: '已下架', value: stats.inactive, color: 'text-red-700' },
    { label: '分类数', value: stats.categories, color: 'text-amber-700' },
  ];

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-slate-900">供奉项目管理</h1>
        <p className="text-[13px] text-slate-500 mt-1">管理供奉项目，包括分类、价格、上下架等</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="text-xs text-gray-500">{s.label}</div>
            <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4 flex flex-wrap items-center gap-3">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          placeholder="搜索项目名称或描述"
          className="px-3 py-2 border rounded-lg text-sm flex-1 min-w-[200px]"
        />
        <select
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="">全部分类</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon ? `${c.icon} ` : ''}{c.name}
            </option>
          ))}
        </select>
        <button
          onClick={onSearch}
          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200"
        >
          搜索
        </button>
        <button
          onClick={() => {
            setKeyword('');
            setCategoryId('');
            setPage(1);
          }}
          className="px-4 py-2 text-slate-500 text-sm hover:text-slate-700"
        >
          重置
        </button>
        <div className="ml-auto">
          <button
            onClick={openAdd}
            className="px-4 py-2 bg-red-700 text-white rounded-lg text-sm hover:bg-red-800"
          >
            + 添加项目
          </button>
        </div>
      </div>

      {/* 表格 */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-4 py-3 text-gray-500 font-medium">图片</th>
              <th className="px-4 py-3 text-gray-500 font-medium">名称</th>
              <th className="px-4 py-3 text-gray-500 font-medium">分类</th>
              <th className="px-4 py-3 text-gray-500 font-medium">单次价格</th>
              <th className="px-4 py-3 text-gray-500 font-medium">月价格</th>
              <th className="px-4 py-3 text-gray-500 font-medium">年价格</th>
              <th className="px-4 py-3 text-gray-500 font-medium">库存</th>
              <th className="px-4 py-3 text-gray-500 font-medium">排序</th>
              <th className="px-4 py-3 text-gray-500 font-medium">状态</th>
              <th className="px-4 py-3 text-gray-500 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {data.map((it) => {
              const active = it.isActive === true || it.isActive === 1;
              return (
                <tr key={it.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {it.image ? (
                      <img
                        src={it.image}
                        alt={it.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                        🧧
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {it.icon ? <span className="mr-1">{it.icon}</span> : null}
                    {it.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {categories.find(c => c.id === it.category)?.icon || ''}{' '}
                    {categories.find(c => c.id === it.category)?.name || it.category || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-700">¥{Number(it.price || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-700">¥{Number(it.priceMonth || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-700">¥{Number(it.priceYear || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-600">{it.stock ?? 0}</td>
                  <td className="px-4 py-3 text-gray-600">{it.sortOrder ?? 0}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {active ? '上架中' : '已下架'}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => openEdit(it)}
                      className="text-xs text-mingli-500 hover:text-mingli-700"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => toggleActive(it)}
                      className="text-xs text-orange-600 hover:text-orange-800"
                    >
                      {active ? '下架' : '上架'}
                    </button>
                    <button
                      onClick={() => remove(it.id)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              );
            })}
            {data.length === 0 && !loading && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-400">
                  暂无供奉项目
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      <div className="flex items-center justify-between mt-4 text-sm">
        <div className="text-gray-500">共 {total} 条，第 {page}/{totalPages} 页</div>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            上一页
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            下一页
          </button>
        </div>
      </div>

      {/* 加载中 */}
      {loading && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-40 pointer-events-none">
          <div className="bg-white px-4 py-2 rounded-lg shadow text-sm text-gray-600">加载中...</div>
        </div>
      )}

      {/* 添加/编辑弹窗 */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-gray-900 mb-4">
              {editingId ? '编辑项目' : '添加项目'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">所属分类 *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">-- 请选择分类 --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon ? `${c.icon} ` : ''}{c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">项目名称 *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="如：清香"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">图标 Emoji</label>
                  <input
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="如：🏮"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">库存数量</label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="如：1000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">图片 URL</label>
                <input
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">描述</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">单次价格</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">月价格</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.priceMonth}
                    onChange={(e) => setForm({ ...form, priceMonth: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">年价格</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.priceYear}
                    onChange={(e) => setForm({ ...form, priceYear: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">排序</label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="itemActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                <label htmlFor="itemActive" className="text-sm text-gray-700">
                  上架该物品
                </label>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2 border rounded-lg text-sm"
                >
                  取消
                </button>
                <button
                  onClick={submit}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-red-700 text-white rounded-lg text-sm disabled:opacity-50"
                >
                  {saving ? '保存中...' : editingId ? '保存' : '创建'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
