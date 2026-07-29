'use client';

import { useState, useEffect } from 'react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const pageSize = 20;

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/orders?${params}`);
      if (res.ok) { const d = await res.json(); setOrders(d.orders || []); setTotal(d.total || 0); }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [page, statusFilter]);

  const updateStatus = async (orderId: string, status: string) => {
    await fetch('/api/admin/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status }),
    });
    fetchOrders();
  };

  const statusMap: Record<string, string> = { pending: '待支付', paid: '已支付', failed: '失败', refunded: '已退款' };
  const statusColor: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-800', paid: 'bg-green-100 text-green-800', failed: 'bg-red-100 text-red-800', refunded: 'bg-gray-100 text-gray-600' };
  const typeMap: Record<string, string> = { membership: '会员', offering: '供奉', pdf_report: 'PDF' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-lg font-bold text-gray-900">订单管理</h2><p className="text-sm text-gray-500">共 {total} 个订单</p></div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">全部状态</option>
          <option value="pending">待支付</option>
          <option value="paid">已支付</option>
          <option value="failed">失败</option>
          <option value="refunded">已退款</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b text-left">
            <th className="px-4 py-3 text-gray-500 font-medium">订单号</th>
            <th className="px-4 py-3 text-gray-500 font-medium">用户</th>
            <th className="px-4 py-3 text-gray-500 font-medium">类型</th>
            <th className="px-4 py-3 text-gray-500 font-medium">金额</th>
            <th className="px-4 py-3 text-gray-500 font-medium">状态</th>
            <th className="px-4 py-3 text-gray-500 font-medium">时间</th>
            <th className="px-4 py-3 text-gray-500 font-medium">操作</th>
          </tr></thead>
          <tbody>
            {orders.map((o: any) => (
              <tr key={o.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{o.orderNo}</td>
                <td className="px-4 py-3">{o.userEmail || o.userName || '-'}</td>
                <td className="px-4 py-3">{typeMap[o.type] || o.type}</td>
                <td className="px-4 py-3 font-bold">¥{(o.amount || 0).toFixed(2)}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded ${statusColor[o.status] || ''}`}>{statusMap[o.status] || o.status}</span></td>
                <td className="px-4 py-3 text-xs text-gray-500">{o.createdAt ? new Date(o.createdAt).toLocaleString('zh-CN') : '-'}</td>
                <td className="px-4 py-3">
                  <select onChange={e => { if (e.target.value) updateStatus(o.id, e.target.value); }} defaultValue="" className="text-xs border rounded px-2 py-1">
                    <option value="" disabled>修改状态</option>
                    <option value="paid">标记已支付</option>
                    <option value="refunded">标记已退款</option>
                    <option value="failed">标记失败</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-500">第 {page} / {Math.ceil(total / pageSize)} 页</span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50">上一页</button>
          <button disabled={page >= Math.ceil(total / pageSize)} onClick={() => setPage(p => p + 1)} className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50">下一页</button>
        </div>
      </div>
    </div>
  );
}
