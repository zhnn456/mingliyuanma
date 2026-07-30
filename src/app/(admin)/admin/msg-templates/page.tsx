'use client';

import { useState, useEffect } from 'react';

const typeMap: Record<string, string> = {
  email: '邮件',
  sms: '短信',
  push: '推送',
  wechat: '微信',
};

const variableHints = ['{{userName}}', '{{orderNo}}', '{{amount}}', '{{date}}', '{{content}}', '{{code}}', '{{expiryDate}}', '{{appName}}'];

interface Template {
  id: string;
  name: string;
  type: string;
  subject: string | null;
  content: string | null;
  variables: string | null;
  isActive: number;
  createdAt: string;
}

export default function MsgTemplatesPage() {
  const [data, setData] = useState<Template[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [stats, setStats] = useState({ total: 0, active: 0, email: 0, sms: 0, push: 0, wechat: 0 });

  const [form, setForm] = useState({
    name: '', type: 'email', subject: '', content: '', variables: '', isActive: true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (searchKeyword) params.set('keyword', searchKeyword);
      if (typeFilter) params.set('type', typeFilter);
      const res = await fetch(`/api/admin/msg-templates?${params}`);
      if (res.ok) {
        const d = await res.json();
        setData(d.data || []);
        setTotal(d.total || 0);
      }
    } catch {} finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/msg-templates?pageSize=10000');
      if (res.ok) {
        const d = await res.json();
        const all = d.data || [];
        setStats({
          total: all.length,
          active: all.filter((t: Template) => t.isActive === 1).length,
          email: all.filter((t: Template) => t.type === 'email').length,
          sms: all.filter((t: Template) => t.type === 'sms').length,
          push: all.filter((t: Template) => t.type === 'push').length,
          wechat: all.filter((t: Template) => t.type === 'wechat').length,
        });
      }
    } catch {}
  };

  useEffect(() => { fetchData(); }, [page]);
  useEffect(() => { fetchStats(); }, []);

  const onSearch = () => { setPage(1); fetchData(); fetchStats(); };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', type: 'email', subject: '', content: '', variables: '', isActive: true });
    setShowModal(true);
  };

  const openEdit = (t: Template) => {
    setEditing(t);
    setForm({
      name: t.name, type: t.type, subject: t.subject || '', content: t.content || '',
      variables: t.variables || '', isActive: t.isActive === 1,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.type) { alert('请填写必填项'); return; }
    if (editing) {
      const res = await fetch('/api/admin/msg-templates', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, ...form }),
      });
      if (res.ok) { setShowModal(false); fetchData(); fetchStats(); }
      else { const e = await res.json(); alert(e.error || '更新失败'); }
    } else {
      const res = await fetch('/api/admin/msg-templates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) { setShowModal(false); fetchData(); fetchStats(); }
      else { const e = await res.json(); alert(e.error || '创建失败'); }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此模板？')) return;
    const res = await fetch(`/api/admin/msg-templates?ids=${id}`, { method: 'DELETE' });
    if (res.ok) { fetchData(); fetchStats(); }
  };

  const insertVariable = (v: string) => {
    setForm({ ...form, content: (form.content || '') + v });
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-slate-900">消息模板</h1>
        <p className="text-sm text-slate-500 mt-1">管理邮件、短信、推送和微信消息模板</p>
      </div>

      <div className="grid grid-cols-6 gap-3 mb-5">
        {[
          { label: '总模板', value: stats.total, color: 'text-blue-600' },
          { label: '启用中', value: stats.active, color: 'text-green-600' },
          { label: '邮件', value: stats.email, color: 'text-purple-600' },
          { label: '短信', value: stats.sms, color: 'text-amber-600' },
          { label: '推送', value: stats.push, color: 'text-red-600' },
          { label: '微信', value: stats.wechat, color: 'text-emerald-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border p-3">
            <div className="text-xs text-slate-500">{s.label}</div>
            <div className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="flex items-center gap-3 p-4 border-b">
          <input
            value={keyword} onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder="搜索名称/主题/内容"
            className="px-3 py-2 border rounded-lg text-sm flex-1"
          />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">全部类型</option>
            {Object.entries(typeMap).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button onClick={onSearch} className="px-4 py-2 bg-slate-100 rounded-lg text-sm hover:bg-slate-200">搜索</button>
          <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">+ 新增模板</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left">
                <th className="px-4 py-3 text-gray-500 font-medium">名称</th>
                <th className="px-4 py-3 text-gray-500 font-medium">类型</th>
                <th className="px-4 py-3 text-gray-500 font-medium">主题</th>
                <th className="px-4 py-3 text-gray-500 font-medium">内容预览</th>
                <th className="px-4 py-3 text-gray-500 font-medium">变量</th>
                <th className="px-4 py-3 text-gray-500 font-medium">状态</th>
                <th className="px-4 py-3 text-gray-500 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
              ) : data.map((t) => (
                <tr key={t.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">{typeMap[t.type] || t.type}</span></td>
                  <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate" title={t.subject || ''}>{t.subject || '-'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate" title={t.content || ''}>{t.content || '-'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{t.variables || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded ${t.isActive === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                      {t.isActive === 1 ? '启用' : '停用'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(t)} className="text-blue-600 hover:text-blue-800 text-xs">编辑</button>
                      <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-700 text-xs">删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-4 border-t">
          <span className="text-sm text-gray-500">共 {total} 条</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 border rounded text-sm disabled:opacity-50">上一页</button>
            <span className="px-3 py-1 text-sm">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 border rounded text-sm disabled:opacity-50">下一页</button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{editing ? '编辑模板' : '新增模板'}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">模板名称 *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="请输入模板名称" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">模板类型 *</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                    {Object.entries(typeMap).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">主题（邮件标题/推送标题）</label>
                <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="消息主题" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">模板内容</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" rows={5} placeholder="支持变量替换，如：尊敬的{{userName}}，您的订单{{orderNo}}已确认。" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">变量提示（点击插入）</label>
                <div className="flex flex-wrap gap-2">
                  {variableHints.map((v) => (
                    <button key={v} type="button" onClick={() => insertVariable(v)} className="text-xs px-2 py-1 bg-slate-100 rounded hover:bg-slate-200 text-slate-600">
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">变量说明</label>
                <input value={form.variables} onChange={(e) => setForm({ ...form, variables: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="如：userName=用户名, orderNo=订单号" />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4" />
                <span className="text-sm font-medium text-gray-700">启用模板</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">取消</button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">{editing ? '保存' : '创建'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
