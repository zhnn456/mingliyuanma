'use client';

import { useState, useEffect, useCallback } from 'react';

type Supply = {
  id: string;
  name: string;
  icon?: string;
  image?: string;
  price: number;
  description?: string;
  category: string;
  sortOrder: number;
  isActive: number | boolean;
  stock: number;
  createdAt?: string;
};

const CATEGORY_OPTIONS = [
  { value: 'buddha', label: '佛像类', icon: '🪷', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'deity', label: '神像类', icon: '⚡', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'ritual', label: '法器类', icon: '🔔', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'offering', label: '供品类', icon: '🌸', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  { value: 'deliverance', label: '超度类', icon: '🪷', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
];

const CATEGORY_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  buddha: { label: '佛像类', icon: '🪷', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  deity: { label: '神像类', icon: '⚡', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  ritual: { label: '法器类', icon: '🔔', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  offering: { label: '供品类', icon: '🌸', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  deliverance: { label: '超度类', icon: '🪷', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  general: { label: '普通供品', icon: '📦', color: 'bg-gray-50 text-gray-700 border-gray-200' },
  premium: { label: '精品供品', icon: '💎', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  special: { label: '特殊供品', icon: '✨', color: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const emptyForm = {
  name: '',
  icon: '',
  image: '',
  price: 0,
  description: '',
  category: 'buddha',
  sortOrder: 0,
  isActive: true,
  stock: 0,
};

export default function SuppliesPage() {
  const [data, setData] = useState<Supply[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, categories: 0 });
  const [categoryGroups, setCategoryGroups] = useState<Record<string, { label: string; icon: string; count: number; totalStock: number }>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async (forceSeed = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (keyword) params.set('keyword', keyword);
      if (category) params.set('category', category);
      if (forceSeed) params.set('forceSeed', '1');

      const res = await fetch(`/api/admin/supplies?${params}`);
      if (res.ok) {
        const d = await res.json();
        setData(d.data || []);
        setTotal(d.total || 0);
        if (d.stats) setStats(d.stats);
        if (d.categoryGroups) setCategoryGroups(d.categoryGroups);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, category]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setSelectedIds([]);
  }, [page, keyword, category]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEdit = (s: Supply) => {
    setEditingId(s.id);
    setForm({
      name: s.name || '',
      icon: s.icon || '',
      image: s.image || '',
      price: Number(s.price) || 0,
      description: s.description || '',
      category: s.category || 'buddha',
      sortOrder: Number(s.sortOrder) || 0,
      isActive: s.isActive === true || s.isActive === 1,
      stock: Number(s.stock) || 0,
    });
    setModalOpen(true);
  };

  const submit = async () => {
    if (!form.name) {
      alert('请填写名称');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price) || 0,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
        stock: Number(form.stock) || 0,
      };
      const res = await fetch('/api/admin/supplies', {
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

  const toggleActive = async (s: Supply) => {
    const next = !(s.isActive === true || s.isActive === 1);
    const res = await fetch('/api/admin/supplies', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, isActive: next }),
    });
    if (res.ok) fetchData();
    else alert('操作失败');
  };

  const remove = async (id: string) => {
    if (!confirm('确定删除该供品？')) return;
    const res = await fetch(`/api/admin/supplies?id=${encodeURIComponent(id)}`, {
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

  const removeBatch = async () => {
    if (selectedIds.length === 0) {
      alert('请先勾选要删除的供品');
      return;
    }
    if (!confirm(`确定删除选中的 ${selectedIds.length} 个供品？`)) return;
    const res = await fetch(`/api/admin/supplies?ids=${encodeURIComponent(selectedIds.join(','))}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setSelectedIds([]);
      if (data.length === selectedIds.length && page > 1) setPage(page - 1);
      else fetchData();
    } else {
      const d = await res.json();
      alert(d.error || '批量删除失败');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === data.length) setSelectedIds([]);
    else setSelectedIds(data.map((d) => d.id));
  };

  const onSearch = () => {
    setPage(1);
    fetchData();
  };

  const onCategoryTab = (cat: string) => {
    setCategory(cat);
    setPage(1);
  };

  const statCards = [
    { label: '总供品数', value: stats.total, color: 'text-slate-900' },
    { label: '上架中', value: stats.active, color: 'text-green-700' },
    { label: '已下架', value: stats.inactive, color: 'text-red-700' },
    { label: '分类数', value: stats.categories, color: 'text-amber-700' },
  ];

  const getCatInfo = (cat: string) => {
    return CATEGORY_LABELS[cat] || { label: cat, icon: '📦', color: 'bg-gray-50 text-gray-700 border-gray-200' };
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">供品管理</h1>
          <p className="text-[13px] text-slate-500 mt-1">管理供品信息，包括价格、库存、分类、上下架等</p>
        </div>
        <button
          onClick={async () => {
            if (!confirm('将重置为默认供品数据，确定？')) return;
            try {
              const res = await fetch('/api/admin/supplies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'seed' }),
              });
              if (res.ok) {
                const d = await res.json();
                alert(`✅ ${d.message || '供品数据已恢复'}，共 ${d.totalCount || 0} 条`);
                fetchData();
              } else {
                alert('恢复失败，请重试');
              }
            } catch {
              alert('网络错误，请重试');
            }
          }}
          className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs hover:bg-slate-200 transition-colors"
        >
          🔄 恢复默认供品
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="text-xs text-gray-500">{s.label}</div>
            <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-3 mb-3">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-sm text-gray-600 shrink-0">分类：</span>
          <button
            onClick={() => onCategoryTab('')}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              !category
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            全部
          </button>
          {CATEGORY_OPTIONS.map((c) => {
            const g = categoryGroups[c.value];
            return (
              <button
                key={c.value}
                onClick={() => onCategoryTab(c.value)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors flex items-center gap-1 ${
                  category === c.value
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span>{c.icon}</span>
                <span>{c.label}</span>
                {g && g.count > 0 && (
                  <span className={`ml-0.5 text-xs px-1.5 py-0.5 rounded ${
                    category === c.value
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {g.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder="搜索名称或描述"
            className="px-3 py-1.5 border rounded-lg text-sm w-48"
          />
          <button
            onClick={onSearch}
            className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200"
          >
            搜索
          </button>
          <button
            onClick={() => {
              setKeyword('');
              setCategory('');
              setPage(1);
            }}
            className="px-3 py-1.5 text-slate-500 text-sm hover:text-slate-700"
          >
            重置
          </button>
          <div className="flex-1" />
          {selectedIds.length > 0 && (
            <button
              onClick={removeBatch}
              className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm hover:bg-red-100"
            >
              批量删除 ({selectedIds.length})
            </button>
          )}
          <button
            onClick={openAdd}
            className="px-3 py-1.5 bg-red-700 text-white rounded-lg text-sm hover:bg-red-800"
          >
            + 添加供品
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-3 py-2.5 w-10">
                <input
                  type="checkbox"
                  checked={data.length > 0 && selectedIds.length === data.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-3 py-2.5 text-gray-500 font-medium">图片</th>
              <th className="px-3 py-2.5 text-gray-500 font-medium">名称</th>
              <th className="px-3 py-2.5 text-gray-500 font-medium">分类</th>
              <th className="px-3 py-2.5 text-gray-500 font-medium">价格</th>
              <th className="px-3 py-2.5 text-gray-500 font-medium">库存</th>
              <th className="px-3 py-2.5 text-gray-500 font-medium">描述</th>
              <th className="px-3 py-2.5 text-gray-500 font-medium">排序</th>
              <th className="px-3 py-2.5 text-gray-500 font-medium">状态</th>
              <th className="px-3 py-2.5 text-gray-500 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {data.map((s) => {
              const active = s.isActive === true || s.isActive === 1;
              const catInfo = getCatInfo(s.category);
              const stockLevel = Number(s.stock) || 0;
              const stockColor = stockLevel === 0 ? 'text-red-600' : stockLevel < 50 ? 'text-amber-600' : 'text-green-600';
              return (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(s.id)}
                      onChange={() => toggleSelect(s.id)}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    {s.image ? (
                      <img src={s.image} alt={s.name} className="w-9 h-9 object-cover rounded" />
                    ) : (
                      <div className="w-9 h-9 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-base">
                        {s.icon || catInfo.icon}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-medium text-gray-900">
                    <span className="flex items-center gap-1">
                      <span>{s.icon || catInfo.icon}</span>
                      <span>{s.name}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded border ${catInfo.color}`}>
                      {catInfo.icon} {catInfo.label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-bold text-amber-700">¥{Number(s.price || 0).toFixed(2)}</td>
                  <td className={`px-3 py-2.5 font-medium ${stockColor}`}>
                    {stockLevel === 0 ? '已售罄' : stockLevel}
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 max-w-[180px] truncate" title={s.description || ''}>
                    {s.description || '-'}
                  </td>
                  <td className="px-3 py-2.5 text-gray-600">{s.sortOrder ?? 0}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {active ? '上架中' : '已下架'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => openEdit(s)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => toggleActive(s)}
                      className="text-xs text-orange-600 hover:text-orange-800"
                    >
                      {active ? '下架' : '上架'}
                    </button>
                    <button
                      onClick={() => remove(s.id)}
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
                  暂无供品数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3 text-sm">
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

      {loading && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-40 pointer-events-none">
          <div className="bg-white px-4 py-2 rounded-lg shadow text-sm text-gray-600">加载中...</div>
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl p-5 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-gray-900 mb-4">
              {editingId ? '编辑供品' : '添加供品'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">名称 *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-lg text-sm"
                  placeholder="如：鲜花"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">图标 (emoji)</label>
                  <input
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg text-sm"
                    placeholder="🌸"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">分类</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg text-sm"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">图片 URL</label>
                <input
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-lg text-sm"
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">价格 (¥)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">库存</label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 border rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">描述</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-1.5 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">排序</label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 border rounded-lg text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="supplyActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                <label htmlFor="supplyActive" className="text-sm text-gray-700">
                  上架该供品
                </label>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-3 py-1.5 border rounded-lg text-sm"
                >
                  取消
                </button>
                <button
                  onClick={submit}
                  disabled={saving}
                  className="flex-1 px-3 py-1.5 bg-red-700 text-white rounded-lg text-sm disabled:opacity-50"
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