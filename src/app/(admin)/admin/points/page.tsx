'use client';

import { useState, useEffect } from 'react';

export default function AdminPointsPage() {
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [showAdjust, setShowAdjust] = useState(false);
  const [form, setForm] = useState({ userId: '', amount: 0, remark: '' });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/points?page=${page}`);
      if (res.ok) setData(await res.json());
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page]);

  const adjustPoints = async () => {
    if (!form.userId || !form.amount) return alert('请填写完整');
    await fetch('/api/admin/points', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setShowAdjust(false); setForm({ userId: '', amount: 0, remark: '' }); fetchData();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-lg font-bold text-gray-900">积分管理</h2><p className="text-sm text-gray-500">积分流水 {data?.total || 0} 条</p></div>
        <button onClick={() => setShowAdjust(true)} className="px-4 py-2 bg-red-700 text-white rounded-lg text-sm">积分调整</button>
      </div>

      {showAdjust && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowAdjust(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-4">积分调整</h3>
            <div className="space-y-3">
              <input value={form.userId} onChange={e => setForm({...form, userId: e.target.value})} placeholder="用户ID" className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input type="number" value={form.amount} onChange={e => setForm({...form, amount: parseInt(e.target.value) || 0})} placeholder="金额（正=增加，负=减少）" className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input value={form.remark} onChange={e => setForm({...form, remark: e.target.value})} placeholder="备注" className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div className="flex gap-2">
                <button onClick={() => setShowAdjust(false)} className="flex-1 px-4 py-2 border rounded-lg text-sm">取消</button>
                <button onClick={adjustPoints} className="flex-1 px-4 py-2 bg-red-700 text-white rounded-lg text-sm">确认</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b text-left">
            <th className="px-4 py-3 text-gray-500 font-medium">用户</th>
            <th className="px-4 py-3 text-gray-500 font-medium">类型</th>
            <th className="px-4 py-3 text-gray-500 font-medium">变动</th>
            <th className="px-4 py-3 text-gray-500 font-medium">余额</th>
            <th className="px-4 py-3 text-gray-500 font-medium">备注</th>
            <th className="px-4 py-3 text-gray-500 font-medium">时间</th>
          </tr></thead>
          <tbody>
            {(data?.rows || []).map((r: any) => (
              <tr key={r.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-xs">{r.userEmail || r.userId}</td>
                <td className="px-4 py-3">{r.type}</td>
                <td className={`px-4 py-3 font-bold ${r.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {r.amount > 0 ? `+${r.amount}` : r.amount}
                </td>
                <td className="px-4 py-3">{r.balance}</td>
                <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{r.remark || '-'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{r.createdAt ? new Date(r.createdAt).toLocaleString('zh-CN') : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-500">第 {page} 页</span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 text-sm border rounded-lg">上一页</button>
          <button onClick={() => setPage(p => p + 1)} className="px-4 py-2 text-sm border rounded-lg">下一页</button>
        </div>
      </div>
    </div>
  );
}
