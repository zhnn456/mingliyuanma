'use client';

import { useState, useEffect } from 'react';

interface Customer {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  memberLevel: string;
  memberExpiryAt: string | null;
  dailyUsage: number;
  lastUsageDate: string | null;
  createdAt: string;
  totalRecords: number;
}

export default function AgentCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showCreds, setShowCreds] = useState<{ email: string; password: string } | null>(null);
  const [form, setForm] = useState({ email: '', name: '', phone: '', password: '', memberLevel: 'free' });

  const fetchCustomers = async (p = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agent/customers?page=${p}&limit=20`);
      if (res.ok) {
        const d = await res.json();
        setCustomers(d.customers || []);
        setTotal(d.total || 0);
        setPage(p);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchCustomers(1); }, []);

  const handleCreate = async () => {
    if (!form.email) { alert('请输入客户邮箱'); return; }
    try {
      const res = await fetch('/api/agent/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const d = await res.json();
        setShowCreds(d.credentials || null);
        setShowModal(false);
        setForm({ email: '', name: '', phone: '', password: '', memberLevel: 'free' });
        fetchCustomers(1);
      } else {
        const e = await res.json();
        alert(e.error || '创建失败');
      }
    } catch {
      alert('网络错误');
    }
  };

  const totalPages = Math.ceil(total / 20);

  const memberLevelMap: Record<string, { label: string; className: string }> = {
    free: { label: '免费用户', className: 'bg-gray-100 text-gray-600' },
    basic: { label: '基础会员', className: 'bg-blue-100 text-blue-700' },
    premium: { label: '高级会员', className: 'bg-purple-100 text-purple-700' },
    lifetime: { label: '终身会员', className: 'bg-gold-100 text-gold-700' },
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">客户管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理您名下的客户账号</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          + 添加客户
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
        <span className="text-sm text-gray-500">客户总数：</span>
        <span className="text-lg font-bold text-gray-900">{total}</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left">
                <th className="px-4 py-3 text-gray-500 font-medium">客户邮箱</th>
                <th className="px-4 py-3 text-gray-500 font-medium">姓名</th>
                <th className="px-4 py-3 text-gray-500 font-medium">手机</th>
                <th className="px-4 py-3 text-gray-500 font-medium">会员等级</th>
                <th className="px-4 py-3 text-gray-500 font-medium">排盘记录</th>
                <th className="px-4 py-3 text-gray-500 font-medium">注册时间</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无客户</td></tr>
              ) : customers.map((c) => {
                const level = memberLevelMap[c.memberLevel] || memberLevelMap.free;
                return (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{c.email}</td>
                    <td className="px-4 py-3 text-gray-600">{c.name || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{c.phone || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${level.className}`}>{level.label}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{c.totalRecords || 0}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString('zh-CN') : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <span className="text-sm text-gray-500">共 {total} 条，第 {page}/{totalPages} 页</span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchCustomers(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                上一页
              </button>
              <button
                onClick={() => fetchCustomers(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">添加客户</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱 *</label>
                <input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="客户邮箱"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="客户姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">手机</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="手机号"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">初始密码</label>
                <input
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="留空则默认为 12345678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">会员等级</label>
                <select
                  value={form.memberLevel}
                  onChange={(e) => setForm({ ...form, memberLevel: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="free">免费用户</option>
                  <option value="basic">基础会员</option>
                  <option value="premium">高级会员</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">取消</button>
              <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">创建</button>
            </div>
          </div>
        </div>
      )}

      {showCreds && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-bold text-gray-900 text-lg mb-4">客户创建成功</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-800 font-medium mb-2">请将以下信息提供给客户：</p>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-500">邮箱：</span><span className="font-mono">{showCreds.email}</span></div>
                <div><span className="text-gray-500">密码：</span><span className="font-mono">{showCreds.password}</span></div>
              </div>
            </div>
            <button onClick={() => setShowCreds(null)} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">我已保存</button>
          </div>
        </div>
      )}
    </div>
  );
}
