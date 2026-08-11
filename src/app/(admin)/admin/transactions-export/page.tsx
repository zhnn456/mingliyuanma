'use client';

import { useState, useEffect } from 'react';

export default function AdminTransactionsExportPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [exportTasks, setExportTasks] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', status: '', type: '' });
  const [exporting, setExporting] = useState(false);
  const pageSize = 20;

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      if (filters.status) params.set('status', filters.status);
      if (filters.type) params.set('type', filters.type);
      const res = await fetch(`/api/admin/transactions-export?${params}`);
      if (res.ok) {
        const d = await res.json();
        setTransactions(d.transactions || []);
        setTotal(d.total || 0);
        setExportTasks(d.exportTasks || []);
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page, filters]);

  const handleExport = async (format: string) => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      if (filters.status) params.set('status', filters.status);
      if (filters.type) params.set('type', filters.type);
      params.set('format', format);

      await fetch('/api/admin/transactions-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'transactions', format, params: filters }),
      });

      const url = `/api/admin/transactions-export/download?${params}`;
      const res = await fetch(url);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions-${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        fetchData();
      }
    } catch (err) {
      console.error('导出失败:', err);
      alert('导出失败，请重试');
    } finally { setExporting(false); }
  };

  const resetFilters = () => {
    setFilters({ startDate: '', endDate: '', status: '', type: '' });
    setPage(1);
  };

  const typeMap: Record<string, string> = { membership: '会员', offering: '供奉', pdf_report: 'PDF', divination: '占卜' };
  const methodMap: Record<string, string> = { wechat: '微信', alipay: '支付宝', points: '灵珠', stripe: 'Stripe', paypal: 'PayPal', cardkey: '卡密' };
  const statusMap: Record<string, string> = { pending: '待支付', paid: '已支付', failed: '失败', refunded: '已退款' };
  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-600',
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">交易流水</h2>
          <p className="text-sm text-gray-500">共 {total} 条记录</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {exporting ? '导出中...' : '导出 CSV'}
          </button>
          <button
            onClick={() => handleExport('excel')}
            disabled={exporting}
            className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            导出 Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">开始日期</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={e => { setFilters(f => ({ ...f, startDate: e.target.value })); setPage(1); }}
              className="px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">结束日期</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={e => { setFilters(f => ({ ...f, endDate: e.target.value })); setPage(1); }}
              className="px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">交易类型</label>
            <select
              value={filters.type}
              onChange={e => { setFilters(f => ({ ...f, type: e.target.value })); setPage(1); }}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">全部类型</option>
              <option value="membership">会员</option>
              <option value="offering">供奉</option>
              <option value="pdf_report">PDF</option>
              <option value="divination">占卜</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">状态</label>
            <select
              value={filters.status}
              onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">全部状态</option>
              <option value="pending">待支付</option>
              <option value="paid">已支付</option>
              <option value="failed">失败</option>
              <option value="refunded">已退款</option>
            </select>
          </div>
          <button
            onClick={resetFilters}
            className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
          >
            重置
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-4 py-3 text-gray-500 font-medium">订单号</th>
              <th className="px-4 py-3 text-gray-500 font-medium">用户</th>
              <th className="px-4 py-3 text-gray-500 font-medium">类型</th>
              <th className="px-4 py-3 text-gray-500 font-medium">金额</th>
              <th className="px-4 py-3 text-gray-500 font-medium">支付方式</th>
              <th className="px-4 py-3 text-gray-500 font-medium">状态</th>
              <th className="px-4 py-3 text-gray-500 font-medium">时间</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">加载中...</td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">暂无数据</td></tr>
            ) : (
              transactions.map((t: any) => (
                <tr key={t.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{t.orderNo || '-'}</td>
                  <td className="px-4 py-3">{t.userEmail || t.userName || '-'}</td>
                  <td className="px-4 py-3">{typeMap[t.orderType] || t.orderType || '-'}</td>
                  <td className="px-4 py-3 font-bold">¥{(t.amount || 0).toFixed(2)}</td>
                  <td className="px-4 py-3">{methodMap[t.method] || t.method || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${statusColor[t.status] || ''}`}>
                      {statusMap[t.status] || t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {t.createdAt ? new Date(t.createdAt).toLocaleString('zh-CN') : '-'}
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
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50"
          >
            上一页
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      </div>

      {exportTasks.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-bold text-gray-900 mb-3">导出历史</h3>
          <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b text-left">
                  <th className="px-4 py-3 text-gray-500 font-medium">类型</th>
                  <th className="px-4 py-3 text-gray-500 font-medium">格式</th>
                  <th className="px-4 py-3 text-gray-500 font-medium">状态</th>
                  <th className="px-4 py-3 text-gray-500 font-medium">创建时间</th>
                </tr>
              </thead>
              <tbody>
                {exportTasks.map((task: any) => (
                  <tr key={task.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{task.type}</td>
                    <td className="px-4 py-3 uppercase">{task.format}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        task.status === 'completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {task.status === 'pending' ? '进行中' :
                         task.status === 'completed' ? '已完成' :
                         task.status === 'failed' ? '失败' : task.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {task.createdAt ? new Date(task.createdAt).toLocaleString('zh-CN') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}