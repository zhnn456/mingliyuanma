'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-client';

interface CommissionRecord {
  id: string;
  orderId: string;
  userName: string;
  userEmail: string;
  productType: string;
  productTypeName: string;
  orderAmount: number;
  totalCommission: number;
  status: string;
  createdAt: string;
}

interface CommissionStats {
  pendingCommission: number;
  settledCommission: number;
  monthCommission: number;
  totalCommission: number;
}

export default function AgentCommissionsPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<CommissionRecord[]>([]);
  const [stats, setStats] = useState<CommissionStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [filters, setFilters] = useState({ status: '', productType: '', startDate: '', endDate: '' });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.productType) params.set('productType', filters.productType);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));

      const res = await fetch(`/api/agent/commissions?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setRecords(json.records || []);
        setTotal(json.total || 0);
        setStats(json.stats || null);
      }
    } catch {}
    setLoading(false);
  }, [filters, page, pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const statusMap: Record<string, string> = {
    pending: '待结算', settled: '已结算', clawed_back: '已冲销',
  };
  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    settled: 'bg-green-100 text-green-800',
    clawed_back: 'bg-gray-100 text-gray-600',
  };

  const productTypeMap: Record<string, string> = {
    membership: '会员', offering: '服务', pdf_report: 'PDF报告',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">分润记录</h1>
        <p className="text-sm text-gray-500 mt-1">查看您的所有分润明细</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="text-xs text-gray-500 mb-1">待结算</div>
            <div className="text-xl font-bold text-orange-600">¥{stats.pendingCommission.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="text-xs text-gray-500 mb-1">本月佣金</div>
            <div className="text-xl font-bold text-blue-600">¥{stats.monthCommission.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="text-xs text-gray-500 mb-1">已结算</div>
            <div className="text-xl font-bold text-green-600">¥{stats.settledCommission.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="text-xs text-gray-500 mb-1">累计</div>
            <div className="text-xl font-bold text-red-600">¥{stats.totalCommission.toFixed(2)}</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">状态</label>
            <select value={filters.status} onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">全部</option>
              <option value="pending">待结算</option>
              <option value="settled">已结算</option>
              <option value="clawed_back">已冲销</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">产品类型</label>
            <select value={filters.productType} onChange={e => { setFilters(f => ({ ...f, productType: e.target.value })); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">全部</option>
              <option value="membership">会员</option>
              <option value="offering">服务</option>
              <option value="pdf_report">PDF报告</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">开始日期</label>
            <input type="date" value={filters.startDate} onChange={e => { setFilters(f => ({ ...f, startDate: e.target.value })); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">结束日期</label>
            <input type="date" value={filters.endDate} onChange={e => { setFilters(f => ({ ...f, endDate: e.target.value })); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="flex items-end">
            <button onClick={() => { setFilters({ status: '', productType: '', startDate: '', endDate: '' }); setPage(1); }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              重置
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        {loading ? (
          <div className="text-center py-10 text-gray-400">加载中...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">订单号</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">客户</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">产品类型</th>
                <th className="px-4 py-3 text-right text-gray-500 font-medium">订单金额</th>
                <th className="px-4 py-3 text-right text-gray-500 font-medium">佣金金额</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">状态</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">创建时间</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {records.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">暂无分润记录</td></tr>
              ) : records.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{r.orderId}</td>
                  <td className="px-4 py-3">{r.userEmail || r.userName || '-'}</td>
                  <td className="px-4 py-3">{productTypeMap[r.productType] || r.productType}</td>
                  <td className="px-4 py-3 text-right">¥{(r.orderAmount || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-bold text-green-600">¥{(r.totalCommission || 0).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${statusColor[r.status] || ''}`}>
                      {statusMap[r.status] || r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{r.createdAt ? new Date(r.createdAt).toLocaleString('zh-CN') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {total > pageSize && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">共 {total} 条记录</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50 hover:bg-gray-50">
              上一页
            </button>
            <span className="text-sm text-gray-600">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50 hover:bg-gray-50">
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}