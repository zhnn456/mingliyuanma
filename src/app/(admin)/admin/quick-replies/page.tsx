'use client';

import { useState, useEffect } from 'react';

const CATEGORIES = ['问候语', '账户问题', '会员相关', '排盘使用', '供奉说明', '支付问题', '投诉处理', '其他'];

const emptyForm = {
  id: '',
  title: '',
  content: '',
  category: CATEGORIES[0],
  shortcut: '',
  sortOrder: 0,
  isActive: true,
};

export default function QuickRepliesPage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [stats, setStats] = useState({ total: 0, active: 0, disabled: 0, categoryCount: 0 });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [selected, setSelected] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (keyword) params.set('keyword', keyword);
      if (category) params.set('category', category);
      const res = await fetch(`/api/admin/quick-replies?${params}`);
      if (res.ok) {
        const d = await res.json();
        setData(d.data || []);
        setTotal(d.total || 0);
        if (d.stats) setStats(d.stats);
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page, category]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const openAdd = () => { setForm(emptyForm); setShowModal(true); };
  const openEdit = (item: any) => {
    setForm({
      id: item.id,
      title: item.title || '',
      content: item.content || '',
      category: item.category || CATEGORIES[0],
      shortcut: item.shortcut || '',
      sortOrder: item.sortOrder || 0,
      isActive: item.isActive === 1 || item.isActive === true,
    });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.title || !form.content) { alert('请填写标题和内容'); return; }
    const method = form.id ? 'PUT' : 'POST';
    const res = await fetch('/api/admin/quick-replies', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { setShowModal(false); fetchData(); }
    else { const d = await res.json(); alert(d.error || '保存失败'); }
  };

  const remove = async (id: string) => {
    if (!confirm('确认删除该回复？')) return;
    const res = await fetch(`/api/admin/quick-replies?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchData();
  };

  const batchDelete = async () => {
    if (selected.length === 0) return alert('请先选择要删除的回复');
    if (!confirm(`确认删除选中的 ${selected.length} 条回复？`)) return;
    const res = await fetch(`/api/admin/quick-replies?ids=${selected.join(',')}`, { method: 'DELETE' });
    if (res.ok) { setSelected([]); fetchData(); }
  };

  const copyContent = async (item: any) => {
    try {
      await navigator.clipboard.writeText(item.content || '');
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      alert('复制失败');
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selected.length === data.length) setSelected([]);
    else setSelected(data.map((d: any) => d.id));
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">快捷回复管理</h2>
          <p className="text-sm text-gray-500">共 {total} 条回复</p>
        </div>
        <div className="flex gap-2">
          {selected.length > 0 && (
            <button onClick={batchDelete} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200">批量删除 ({selected.length})</button>
          )}
          <button onClick={openAdd} className="px-4 py-2 bg-red-700 text-white rounded-lg text-sm">+ 新建回复</button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-xs text-gray-500">总条数</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-xs text-gray-500">启用中</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.active}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-xs text-gray-500">已禁用</div>
          <div className="text-2xl font-bold text-gray-500 mt-1">{stats.disabled}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-xs text-gray-500">分类数</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{stats.categoryCount}</div>
        </div>
      </div>

      {/* 分类筛选 + 搜索 */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
        <div className="flex flex-wrap gap-2 mb-3">
          <button onClick={() => { setCategory(''); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-sm ${category === '' ? 'bg-red-700 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>全部分类</button>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => { setCategory(c); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-sm ${category === c ? 'bg-red-700 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{c}</button>
          ))}
        </div>
        <form onSubmit={onSearch} className="flex gap-3">
          <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="搜索标题/内容/快捷键" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
          <button type="submit" className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm">搜索</button>
        </form>
      </div>

      {/* 表格 */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-4 py-3 text-gray-500 font-medium w-8">
                <input type="checkbox" checked={selected.length > 0 && selected.length === data.length} onChange={toggleAll} />
              </th>
              <th className="px-4 py-3 text-gray-500 font-medium">标题</th>
              <th className="px-4 py-3 text-gray-500 font-medium">分类</th>
              <th className="px-4 py-3 text-gray-500 font-medium">快捷键</th>
              <th className="px-4 py-3 text-gray-500 font-medium">内容预览</th>
              <th className="px-4 py-3 text-gray-500 font-medium">排序</th>
              <th className="px-4 py-3 text-gray-500 font-medium">状态</th>
              <th className="px-4 py-3 text-gray-500 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">加载中...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">暂无回复</td></tr>
            ) : data.map((item: any) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleSelect(item.id)} />
                </td>
                <td className="px-4 py-3 font-medium text-gray-900 max-w-[160px] truncate">{item.title}</td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700">{item.category}</span></td>
                <td className="px-4 py-3">
                  {item.shortcut ? <code className="text-xs px-2 py-0.5 bg-gray-100 rounded text-orange-700">{item.shortcut}</code> : <span className="text-gray-400">-</span>}
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-[280px] truncate">{item.content}</td>
                <td className="px-4 py-3 text-gray-600">{item.sortOrder || 0}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${item.isActive === 1 || item.isActive === true ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {item.isActive === 1 || item.isActive === true ? '启用' : '禁用'}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => copyContent(item)} className="text-xs text-green-600 hover:text-green-800">
                    {copiedId === item.id ? '已复制' : '复制'}
                  </button>
                  <button onClick={() => openEdit(item)} className="text-xs text-blue-600 hover:text-blue-800">编辑</button>
                  <button onClick={() => remove(item.id)} className="text-xs text-red-600 hover:text-red-800">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      <div className="flex items-center justify-between mt-4 text-sm">
        <span className="text-gray-500">共 {total} 条 · 第 {page}/{totalPages} 页</span>
        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 border rounded disabled:opacity-40">上一页</button>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 border rounded disabled:opacity-40">下一页</button>
        </div>
      </div>

      {/* 添加/编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-xl shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-4">{form.id ? '编辑回复' : '新建回复'}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">标题 *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm mt-1" placeholder="便于查找的简短描述" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">分类</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm mt-1">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">快捷键</label>
                  <input value={form.shortcut} onChange={e => setForm({ ...form, shortcut: e.target.value })} placeholder="例如 /hi" className="w-full px-3 py-2 border rounded-lg text-sm mt-1" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">内容 *</label>
                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={6} className="w-full px-3 py-2 border rounded-lg text-sm mt-1" placeholder="回复内容（支持换行）" />
              </div>
              <div>
                <label className="text-xs text-gray-500">排序</label>
                <input type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg text-sm mt-1" />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                启用
              </label>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-lg text-sm">取消</button>
                <button onClick={save} className="flex-1 px-4 py-2 bg-red-700 text-white rounded-lg text-sm">保存</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
