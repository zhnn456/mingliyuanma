'use client';

import { useState, useEffect } from 'react';

const CATEGORIES = ['命理知识', '行业动态', '使用教程', '案例分享', '活动公告', '其他'];

const emptyForm = {
  id: '',
  title: '',
  slug: '',
  category: CATEGORIES[0],
  summary: '',
  content: '',
  coverImage: '',
  author: '',
  tags: '',
  sortOrder: 0,
  isPublished: false,
};

export default function ArticlesPage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, totalViews: 0 });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [selected, setSelected] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (keyword) params.set('keyword', keyword);
      if (category) params.set('category', category);
      if (status) params.set('status', status);
      const res = await fetch(`/api/admin/articles?${params}`);
      if (res.ok) {
        const d = await res.json();
        setData(d.data || []);
        setTotal(d.total || 0);
        if (d.stats) setStats(d.stats);
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page, category, status]);

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
      slug: item.slug || '',
      category: item.category || CATEGORIES[0],
      summary: item.summary || '',
      content: item.content || '',
      coverImage: item.coverImage || '',
      author: item.author || '',
      tags: item.tags || '',
      sortOrder: item.sortOrder || 0,
      isPublished: item.isPublished === 1 || item.isPublished === true,
    });
    setShowModal(true);
  };

  const onTitleChange = (v: string) => {
    setForm((prev: any) => ({ ...prev, title: v, slug: prev.slug ? prev.slug : slugify(v) }));
  };

  const slugify = (text: string) => {
    return text.toLowerCase().replace(/[^\w\u4e00-\u9fa5\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 100);
  };

  const save = async () => {
    if (!form.title || !form.category) { alert('请填写标题和分类'); return; }
    const method = form.id ? 'PUT' : 'POST';
    const res = await fetch('/api/admin/articles', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { setShowModal(false); fetchData(); }
    else { const d = await res.json(); alert(d.error || '保存失败'); }
  };

  const togglePublish = async (item: any) => {
    const newPublished = !(item.isPublished === 1 || item.isPublished === true);
    const res = await fetch('/api/admin/articles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, action: 'togglePublish', isPublished: newPublished }),
    });
    if (res.ok) fetchData();
  };

  const remove = async (id: string) => {
    if (!confirm('确认删除该文章？')) return;
    const res = await fetch(`/api/admin/articles?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchData();
  };

  const batchDelete = async () => {
    if (selected.length === 0) return alert('请先选择要删除的文章');
    if (!confirm(`确认删除选中的 ${selected.length} 篇文章？`)) return;
    const res = await fetch(`/api/admin/articles?ids=${selected.join(',')}`, { method: 'DELETE' });
    if (res.ok) { setSelected([]); fetchData(); }
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
          <h2 className="text-lg font-bold text-gray-900">文章资讯</h2>
          <p className="text-sm text-gray-500">共 {total} 篇文章</p>
        </div>
        <div className="flex gap-2">
          {selected.length > 0 && (
            <button onClick={batchDelete} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200">批量删除 ({selected.length})</button>
          )}
          <button onClick={openAdd} className="px-4 py-2 bg-red-700 text-white rounded-lg text-sm">+ 新建文章</button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-xs text-gray-500">总文章数</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-xs text-gray-500">已发布</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.published}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-xs text-gray-500">草稿</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">{stats.draft}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-xs text-gray-500">总浏览</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{stats.totalViews}</div>
        </div>
      </div>

      {/* 筛选 + 搜索 */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
        <div className="flex flex-wrap gap-2 mb-3">
          <button onClick={() => { setCategory(''); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-sm ${category === '' ? 'bg-red-700 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>全部分类</button>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => { setCategory(c); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-sm ${category === c ? 'bg-red-700 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{c}</button>
          ))}
        </div>
        <form onSubmit={onSearch} className="flex flex-wrap gap-3">
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">全部状态</option>
            <option value="published">已发布</option>
            <option value="draft">草稿</option>
          </select>
          <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="搜索标题/摘要/作者/标签" className="flex-1 min-w-[200px] px-3 py-2 border rounded-lg text-sm" />
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
              <th className="px-4 py-3 text-gray-500 font-medium">封面图</th>
              <th className="px-4 py-3 text-gray-500 font-medium">标题</th>
              <th className="px-4 py-3 text-gray-500 font-medium">分类</th>
              <th className="px-4 py-3 text-gray-500 font-medium">作者</th>
              <th className="px-4 py-3 text-gray-500 font-medium">浏览数</th>
              <th className="px-4 py-3 text-gray-500 font-medium">状态</th>
              <th className="px-4 py-3 text-gray-500 font-medium">发布时间</th>
              <th className="px-4 py-3 text-gray-500 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="text-center py-8 text-gray-400">加载中...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-8 text-gray-400">暂无文章</td></tr>
            ) : data.map((item: any) => {
              const published = item.isPublished === 1 || item.isPublished === true;
              return (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleSelect(item.id)} />
                  </td>
                  <td className="px-4 py-3">
                    {item.coverImage ? (
                      <img src={item.coverImage} alt={item.title} className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-300 text-xs">无图</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">
                    {item.title}
                    {item.slug && <div className="text-xs text-gray-400 font-normal">/{item.slug}</div>}
                  </td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700">{item.category}</span></td>
                  <td className="px-4 py-3 text-gray-600">{item.author || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{item.viewCount || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${published ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                      {published ? '已发布' : '草稿'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{item.publishedAt ? new Date(item.publishedAt).toLocaleString('zh-CN') : '-'}</td>
                  <td className="px-4 py-3 flex gap-2 whitespace-nowrap">
                    <button onClick={() => togglePublish(item)} className="text-xs text-green-600 hover:text-green-800">
                      {published ? '撤回' : '发布'}
                    </button>
                    <button onClick={() => openEdit(item)} className="text-xs text-blue-600 hover:text-blue-800">编辑</button>
                    <button onClick={() => remove(item.id)} className="text-xs text-red-600 hover:text-red-800">删除</button>
                  </td>
                </tr>
              );
            })}
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
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-4">{form.id ? '编辑文章' : '新建文章'}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">标题 *</label>
                <input value={form.title} onChange={e => onTitleChange(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm mt-1" placeholder="文章标题" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">URL 别名 (slug)</label>
                  <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="留空则自动生成" className="w-full px-3 py-2 border rounded-lg text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">分类 *</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm mt-1">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">作者</label>
                  <input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} placeholder="作者名" className="w-full px-3 py-2 border rounded-lg text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">封面图 URL</label>
                  <input value={form.coverImage} onChange={e => setForm({ ...form, coverImage: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 border rounded-lg text-sm mt-1" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">标签 (逗号分隔)</label>
                <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="例如: 八字,新手,教程" className="w-full px-3 py-2 border rounded-lg text-sm mt-1" />
              </div>
              <div>
                <label className="text-xs text-gray-500">摘要</label>
                <textarea value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm mt-1" placeholder="文章摘要（用于列表展示）" />
              </div>
              <div>
                <label className="text-xs text-gray-500">内容 (支持 Markdown)</label>
                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={10} className="w-full px-3 py-2 border rounded-lg text-sm mt-1 font-mono" placeholder="请输入文章内容..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">排序</label>
                  <input type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg text-sm mt-1" />
                </div>
                <label className="flex items-end gap-2 text-sm text-gray-700 pb-2">
                  <input type="checkbox" checked={form.isPublished} onChange={e => setForm({ ...form, isPublished: e.target.checked })} />
                  立即发布
                </label>
              </div>
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
