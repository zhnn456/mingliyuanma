'use client';

import { useState, useEffect } from 'react';

interface PaymentItem {
  id: string;
  orderId: string;
  userId: string;
  method: string;
  amount: number;
  status: string;
  transactionId: string | null;
  paidAt: string | null;
  refundAt: string | null;
  refundAmount: number | null;
  remark: string | null;
  createdAt: string;
  userEmail?: string;
  userName?: string;
  orderNo?: string;
  orderType?: string;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const pageSize = 20;

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (statusFilter) params.set('status', statusFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const res = await fetch(`/api/admin/payments?${params}`);
      if (res.ok) {
        const d = await res.json();
        setPayments(d.payments || []);
        setTotal(d.total || 0);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, statusFilter, startDate, endDate]);

  const statusMap: Record<string, string> = {
    pending: '待支付',
    paid: '已支付',
    success: '已支付',
    failed: '失败',
    refunded: '已退款',
  };
  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    success: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-600',
  };
  const methodMap: Record<string, string> = {
    wechat: '微信',
    alipay: '支付宝',
  };
  const typeMap: Record<string, string> = {
    membership: '会员',
    offering: '供奉',
    pdf_report: 'PDF报告',
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">支付记录管理</h2>
          <p className="text-sm text-gray-500">共 {total} 条支付记录</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border rounded-lg text-sm"
            placeholder="开始日期"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border rounded-lg text-sm"
            placeholder="结束日期"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">全部状态</option>
            <option value="pending">待支付</option>
            <option value="paid">已支付</option>
            <option value="refunded">已退款</option>
            <option value="failed">失败</option>
          </select>
          <button
            onClick={() => {
              setStatusFilter('');
              setStartDate('');
              setEndDate('');
              setPage(1);
            }}
            className="px-3 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            重置
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-4 py-3 text-gray-500 font-medium">支付单号</th>
              <th className="px-4 py-3 text-gray-500 font-medium">用户</th>
              <th className="px-4 py-3 text-gray-500 font-medium">订单号</th>
              <th className="px-4 py-3 text-gray-500 font-medium">类型</th>
              <th className="px-4 py-3 text-gray-500 font-medium">金额</th>
              <th className="px-4 py-3 text-gray-500 font-medium">支付方式</th>
              <th className="px-4 py-3 text-gray-500 font-medium">状态</th>
              <th className="px-4 py-3 text-gray-500 font-medium">支付时间</th>
              <th className="px-4 py-3 text-gray-500 font-medium">创建时间</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                  加载中...
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                  暂无支付记录
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{p.id}</td>
                  <td className="px-4 py-3">
                    {p.userName || p.userEmail || '-'}
                    {p.userEmail && p.userName && (
                      <div className="text-xs text-gray-400">{p.userEmail}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{p.orderNo || p.orderId}</td>
                  <td className="px-4 py-3">{typeMap[p.orderType || ''] || p.orderType || '-'}</td>
                  <td className="px-4 py-3 font-bold">¥{(p.amount || 0).toFixed(2)}</td>
                  <td className="px-4 py-3">{methodMap[p.method] || p.method || '-'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${statusColor[p.status] || ''}`}
                    >
                      {statusMap[p.status] || p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {p.paidAt ? new Date(p.paidAt).toLocaleString('zh-CN') : '-'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {p.createdAt ? new Date(p.createdAt).toLocaleString('zh-CN') : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-500">
          第 {page} / {totalPages || 1} 页
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            上一页
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
}
