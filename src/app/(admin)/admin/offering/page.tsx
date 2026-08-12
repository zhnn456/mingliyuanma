'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Category = {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
  itemCount?: number;
};

export default function AdminOfferingPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [catModal, setCatModal] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catForm, setCatForm] = useState({ name: '', icon: '', description: '', sortOrder: 0, isActive: true });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/offering');
      if (res.ok) {
        const d = await res.json();
        setCategories(d.categories || []);
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openAddCategory = () => {
    setCatForm({ name: '', icon: '', description: '', sortOrder: 0, isActive: true });
    setEditingCatId(null);
    setCatModal(true);
  };

  const openEditCategory = (c: Category) => {
    setEditingCatId(c.id);
    setCatForm({ name: c.name || '', icon: c.icon || '', description: c.description || '', sortOrder: c.sortOrder ?? 0, isActive: c.isActive !== false });
    setCatModal(true);
  };

  const submitCategory = async () => {
    if (!catForm.name) return alert('请填写分类名称');
    const res = await fetch('/api/admin/offering', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'addCategory', id: editingCatId || undefined, ...catForm }),
    });
    if (res.ok) { setCatModal(false); fetchCategories(); }
    else { const d = await res.json(); alert(d.error || '操作失败'); }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('确定删除该分类？关联的项目可能受影响。')) return;
    const res = await fetch('/api/admin/offering', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deleteCategory', id }),
    });
    if (res.ok) fetchCategories();
    else { const d = await res.json(); alert(d.error || '删除失败'); }
  };

  const filtered = keyword ? categories.filter(c => c.name?.includes(keyword) || c.description?.includes(keyword)) : categories;
  const activeCount = categories.filter(c => c.isActive !== false).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">供奉分类管理</h2>
          <p className="text-sm text-gray-500">管理供奉项目的分类体系</p>
        </div>
        <button onClick={openAddCategory} className="px-4 py-2 bg-red-700 text-white rounded-lg text-sm">+ 添加分类</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="text-xs text-gray-500">全部分类</div>
          <div className="text-lg font-bold text-gray-900">{categories.length}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="text-xs text-gray-500">启用中</div>
          <div className="text-lg font-bold text-green-600">{activeCount}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="text-xs text-gray-500">已禁用</div>
          <div className="text-lg font-bold text-red-600">{categories.length - activeCount}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="text-xs text-gray-500">关联项目</div>
          <div className="text-lg font-bold text-amber-600">{categories.reduce((s: number, c: Category) => s + (c.itemCount || 0), 0)}</div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="text-sm font-medium text-blue-800 mb-2">📋 供奉管理导航</div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/offering-items" className="text-xs px-3 py-1.5 bg-white rounded-lg text-blue-700 hover:bg-blue-100 transition-colors">🧧 供奉项目</Link>
          <Link href="/admin/offering-records" className="text-xs px-3 py-1.5 bg-white rounded-lg text-blue-700 hover:bg-blue-100 transition-colors">📜 供奉记录</Link>
          <Link href="/admin/supplies" className="text-xs px-3 py-1.5 bg-white rounded-lg text-blue-700 hover:bg-blue-100 transition-colors">💎 供品管理</Link>
          <Link href="/admin/offering-calendar" className="text-xs px-3 py-1.5 bg-white rounded-lg text-blue-700 hover:bg-blue-100 transition-colors">📅 排期日历</Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b flex items-center gap-2">
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="搜索分类名称或描述..."
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
          />
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-4 py-3 text-gray-500 font-medium">图标</th>
              <th className="px-4 py-3 text-gray-500 font-medium">分类名称</th>
              <th className="px-4 py-3 text-gray-500 font-medium">描述</th>
              <th className="px-4 py-3 text-gray-500 font-medium">关联项目</th>
              <th className="px-4 py-3 text-gray-500 font-medium">排序</th>
              <th className="px-4 py-3 text-gray-500 font-medium">状态</th>
              <th className="px-4 py-3 text-gray-500 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">加载中...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">暂无分类数据</td></tr>
            ) : filtered.map((c: Category) => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-xl">{c.icon || '📦'}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{c.description || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{c.itemCount || 0} 项</td>
                <td className="px-4 py-3 text-gray-600">{c.sortOrder ?? 0}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${c.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {c.isActive !== false ? '已启用' : '已禁用'}
                  </span>
                </td>
                <td className="px-4 py-3 space-x-2">
                  <button onClick={() => openEditCategory(c)} className="text-xs text-blue-600 hover:text-blue-800">编辑</button>
                  <button onClick={() => deleteCategory(c.id)} className="text-xs text-red-600 hover:text-red-800">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {catModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setCatModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-4">{editingCatId ? '编辑分类' : '添加分类'}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">分类名称</label>
                <input value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} placeholder="如：心愿祈福" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">图标 (emoji)</label>
                <input value={catForm.icon} onChange={e => setCatForm({ ...catForm, icon: e.target.value })} placeholder="如：🙏" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">描述</label>
                <textarea value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">排序</label>
                <input type="number" value={catForm.sortOrder} onChange={e => setCatForm({ ...catForm, sortOrder: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="catActive" checked={catForm.isActive} onChange={e => setCatForm({ ...catForm, isActive: e.target.checked })} />
                <label htmlFor="catActive" className="text-sm text-gray-700">启用该分类</label>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setCatModal(false)} className="flex-1 px-4 py-2 border rounded-lg text-sm">取消</button>
                <button onClick={submitCategory} className="flex-1 px-4 py-2 bg-red-700 text-white rounded-lg text-sm">{editingCatId ? '保存' : '创建'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
