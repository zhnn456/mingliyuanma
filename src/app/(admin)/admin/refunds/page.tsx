'use client';

import { useState, useEffect } from 'react';

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<any>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [remark, setRemark] = useState('');
  const pageSize = 20;

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (statusFilter) params.set('status', statusFilter);
      if (keyword) params.set('keyword', keyword);
      const res = await fetch(`/api/admin/refunds?${params}`);
      if (res.ok) {
        const d = await res.json();
        setRefunds(d.refunds || []);
        setTotal(d.total || 0);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRefunds(); }, [page, statusFilter, keyword]);

  const openRefundModal = (r: any) => {
    setModal(r);
    setRefundAmount(String(r.amount || ''));
    setRemark(r.remark || '');
  };

  const submitRefund = async () => {
    if (!modal) return;
    try {
      const res = await fetch('/api/admin/refunds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: modal.id,
          refundAmount: parseFloat(refundAmount),
          remark,
        }),
      });
      if (res.ok) {
        setModal(null);
        fetchRefunds();
      } else {
        alert('操作失败');
      }
    } catch {
      alert('网络错误');
    }
  };

  const handleSearch = () => {
    setKeyword(searchInput.trim());
    setPage(1);
  };

  const statusMap: Record<string, string> = {
    pending: '处理中',
    paid: '已退款',
    completed: '已退款',
    failed: '已拒绝',
    refunded: '已退款',
  };
  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-green-100 text-green-800',
  };
  const methodMap: Record<string, string> = {
    wechat: '微信',
    alipay: '支付宝',
    stripe: 'Stripe',
    points: '积分',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">退款管理</h2>
          <p className="text-sm text-gray-500">共 {total} 条退款记录</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
            placeholder="搜索订单号/邮箱/昵称"
            className="px-3 py-2 border rounded-lg text-sm w-56"
          />
          <button onClick={handleSearch} className="px-3 py-2 border rounded-lg text-sm bg-gray-50">搜索</button>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">全部状态</option>
            <option value="pending">处理中</option>
            <option value="paid">已退款</option>
            <option value="failed">已拒绝</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-4 py-3 text-gray-500 font-medium">订单号</th>
              <th className="px-4 py-3 text-gray-500 font-medium">用户</th>
              <th className="px-4 py-3 text-gray-500 font-medium">支付方式</th>
              <th className="px-4 py-3 text-gray-500 font-medium">金额</th>
              <th className="px-4 py-3 text-gray-500 font-medium">退款金额</th>
              <th className="px-4 py-3 text-gray-500 font-medium">原因</th>
              <th className="px-4 py-3 text-gray-500 font-medium">退款时间</th>
              <th className="px-4 py-3 text-gray-500 font-medium">状态</th>
              <th className="px-4 py-3 text-gray-500 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
            ) : refunds.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
            ) : refunds.map((r: any) => (
              <tr key={r.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{r.orderId ? (r.orderNo || r.orderId) : '-'}</td>
                <td className="px-4 py-3">{r.userEmail || r.userName || '-'}</td>
                <td className="px-4 py-3">{methodMap[r.method] || r.method || '-'}</td>
                <td className="px-4 py-3 font-bold">¥{(r.amount || 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-red-600 font-semibold">¥{(r.refundAmount || 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={r.remark || ''}>{r.remark || '-'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{r.refundAt ? new Date(r.refundAt).toLocaleString('zh-CN') : '-'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${statusColor[r.status] || ''}`}>
                    {statusMap[r.status] || r.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => openRefundModal(r)}
                    className="text-xs px-2 py-1 border rounded text-blue-600 hover:bg-blue-50"
                  >
                    处理退款
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-500">
          第 {page} / {Math.max(1, Math.ceil(total / pageSize))} 页
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50"
          >
            上一页
          </button>
          <button
            disabled={page >= Math.ceil(total / pageSize)}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-4">处理退款</h3>
            <div className="space-y-4">
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                <div>订单号：<span className="font-mono">{modal.orderNo || modal.orderId}</span></div>
                <div>用户：{modal.userEmail || modal.userName || '-'}</div>
                <div>原金额：¥{(modal.amount || 0).toFixed(2)}</div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">退款金额</label>
                <input
                  type="number"
                  step="0.01"
                  value={refundAmount}
                  onChange={e => setRefundAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">退款原因</label>
                <textarea
                  value={remark}
                  onChange={e => setRemark(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="请输入退款原因"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 text-sm border rounded-lg"
              >
                取消
              </button>
              <button
                onClick={submitRefund}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                确认退款
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
