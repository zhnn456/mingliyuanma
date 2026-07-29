'use client';

import { useState, useEffect } from 'react';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', type: 'fixed', value: 0, minAmount: 0, maxUses: 0, validFrom: '', validTo: '' });

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/coupons');
      if (res.ok) { const d = await res.json(); setCoupons(d.rows || []); }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const createCoupon = async () => {
    if (!form.code || !form.name) return alert('请填写完整');
    const res = await fetch('/api/admin/coupons', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    if (res.ok) { setShowCreate(false); setForm({ code: '', name: '', type: 'fixed', value: 0, minAmount: 0, maxUses: 0, validFrom: '', validTo: '' }); fetchCoupons(); }
    else { const d = await res.json(); alert(d.error); }
  };

  const toggleCoupon = async (id: string, isActive: boolean) => {
    await fetch('/api/admin/coupons', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, isActive: !isActive }) });
    fetchCoupons();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-lg font-bold text-gray-900">优惠券管理</h2><p className="text-sm text-gray-500">共 {coupons.length} 个优惠券</p></div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-red-700 text-white rounded-lg text-sm">+ 创建优惠券</button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-4">创建优惠券</h3>
            <div className="space-y-3">
              <input value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="优惠码（如 FENGLIAN10）" className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="名称" className="w-full px-3 py-2 border rounded-lg text-sm" />
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="fixed">固定金额</option>
                <option value="percentage">百分比</option>
              </select>
              <input type="number" value={form.value} onChange={e => setForm({...form, value: parseFloat(e.target.value) || 0})} placeholder={form.type === 'percentage' ? '折扣百分比（如 10 = 9折）' : '减免金额'} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input type="number" value={form.minAmount} onChange={e => setForm({...form, minAmount: parseFloat(e.target.value) || 0})} placeholder="最低消费金额" className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input type="number" value={form.maxUses} onChange={e => setForm({...form, maxUses: parseInt(e.target.value) || 0})} placeholder="最大使用次数（0=不限）" className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input type="date" value={form.validFrom} onChange={e => setForm({...form, validFrom: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input type="date" value={form.validTo} onChange={e => setForm({...form, validTo: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 border rounded-lg text-sm">取消</button>
                <button onClick={createCoupon} className="flex-1 px-4 py-2 bg-red-700 text-white rounded-lg text-sm">创建</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b text-left">
            <th className="px-4 py-3 text-gray-500 font-medium">优惠码</th>
            <th className="px-4 py-3 text-gray-500 font-medium">名称</th>
            <th className="px-4 py-3 text-gray-500 font-medium">类型</th>
            <th className="px-4 py-3 text-gray-500 font-medium">优惠</th>
            <th className="px-4 py-3 text-gray-500 font-medium">使用</th>
            <th className="px-4 py-3 text-gray-500 font-medium">有效</th>
            <th className="px-4 py-3 text-gray-500 font-medium">操作</th>
          </tr></thead>
          <tbody>
            {coupons.map((c: any) => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-bold text-gray-900">{c.code}</td>
                <td className="px-4 py-3">{c.name}</td>
                <td className="px-4 py-3">{c.type === 'percentage' ? '百分比' : '固定'}</td>
                <td className="px-4 py-3">{c.type === 'percentage' ? `${c.value}%` : `¥${c.value}`}</td>
                <td className="px-4 py-3">{c.usedCount || 0}{c.maxUses ? `/${c.maxUses}` : ''}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${c.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {c.isActive ? '有效' : '已停用'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleCoupon(c.id, c.isActive)} className="text-xs text-orange-600 hover:text-orange-800">
                    {c.isActive ? '停用' : '启用'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
