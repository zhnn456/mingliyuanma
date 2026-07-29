'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export default function AgentOrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetch('/api/agent/orders').then(r => r.json()).then(d => { setOrders(d.orders || []); setLoading(false); }).catch(() => setLoading(false));
  }, [user, router]);

  const statusMap: Record<string, string> = { pending: '待支付', paid: '已支付', failed: '失败', refunded: '已退款' };
  const statusColor: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-800', paid: 'bg-green-100 text-green-800', failed: 'bg-red-100 text-red-800', refunded: 'bg-gray-100 text-gray-600' };

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-6">客户订单</h2>
      {loading ? <div className="text-center py-20 text-gray-400">加载中...</div> : (
        <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b text-left">
              <th className="px-4 py-3 text-gray-500 font-medium">订单号</th><th className="px-4 py-3 text-gray-500 font-medium">客户</th>
              <th className="px-4 py-3 text-gray-500 font-medium">金额</th><th className="px-4 py-3 text-gray-500 font-medium">状态</th>
              <th className="px-4 py-3 text-gray-500 font-medium">时间</th>
            </tr></thead>
            <tbody>
              {orders.map((o: any) => (
                <tr key={o.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{o.orderNo}</td>
                  <td className="px-4 py-3">{o.userEmail || o.userName || '-'}</td>
                  <td className="px-4 py-3 font-bold">¥{(o.amount || 0).toFixed(2)}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded ${statusColor[o.status] || ''}`}>{statusMap[o.status] || o.status}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{o.createdAt ? new Date(o.createdAt).toLocaleString('zh-CN') : '-'}</td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-gray-400">暂无订单</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
