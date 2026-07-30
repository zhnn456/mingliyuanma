'use client';

import { useState, useEffect } from 'react';

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [auditModal, setAuditModal] = useState<any>(null);
  const [auditAction, setAuditAction] = useState<'approve' | 'reject'>('approve');
  const [auditRemark, setAuditRemark] = useState('');
  const pageSize = 20;

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (statusFilter) params.set('status', statusFilter);
      if (keyword) params.set('keyword', keyword);
      if (minAmount) params.set('minAmount', minAmount);
      if (maxAmount) params.set('maxAmount', maxAmount);
      const res = await fetch(`/api/admin/withdrawals?${params}`);
      if (res.ok) {
        const d = await res.json();
        setWithdrawals(d.withdrawals || []);
        setTotal(d.total || 0);
        setStats(d.stats || null);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWithdrawals(); }, [page, statusFilter]);

  const handleSearch = () => { setPage(1); fetchWithdrawals(); };

  const openAudit = (w: any, action: 'approve' | 'reject') => {
    setAuditModal(w);
    setAuditAction(action);
    setAuditRemark('');
  };

  const submitAudit = async () => {
    if (!auditModal) return;
    const res = await fetch('/api/admin/withdrawals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: auditModal.id, action: auditAction, auditRemark }),
    });
    if (res.ok) {
      setAuditModal(null);
      fetchWithdrawals();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || '审核失败');
    }
  };

  const statusMap: Record<string, string> = { pending: '待审核', approved: '已通过', rejected: '已拒绝', completed: '已完成' };
  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800',
  };
  const methodMap: Record<string, string> = { alipay: '支付宝', wechat: '微信', bank: '银行卡' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">提现管理</h2>
          <p className="text-sm text-gray-500">共 {total} 条提现申请</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="text-sm text-gray-500 mb-1">待审核金额</div>
            <div className="text-2xl font-bold text-yellow-600">¥{(stats.pendingAmount || 0).toFixed(2)}</div>
            <div className="text-xs text-gray-400 mt-1">共 {stats.pendingCount} 笔待审核</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="text-sm text-gray-500 mb-1">本月提现总额</div>
            <div className="text-2xl font-bold text-blue-600">¥{(stats.monthAmount || 0).toFixed(2)}</div>
            <div className="text-xs text-gray-400 mt-1">共 {stats.monthCount} 笔本月申请</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">状态</label>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">全部状态</option>
            <option value="pending">待审核</option>
            <option value="approved">已通过</option>
            <option value="rejected">已拒绝</option>
            <option value="completed">已完成</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">搜索</label>
          <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="用户/账户" className="px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">最低金额</label>
          <input value={minAmount} onChange={e => setMinAmount(e.target.value)} type="number" placeholder="0" className="px-3 py-2 border rounded-lg text-sm w-28" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">最高金额</label>
          <input value={maxAmount} onChange={e => setMaxAmount(e.target.value)} type="number" placeholder="∞" className="px-3 py-2 border rounded-lg text-sm w-28" />
        </div>
        <button onClick={handleSearch} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">搜索</button>
        <button onClick={() => { setKeyword(''); setMinAmount(''); setMaxAmount(''); setStatusFilter(''); setPage(1); setTimeout(fetchWithdrawals, 0); }} className="px-4 py-2 border rounded-lg text-sm">重置</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-4 py-3 text-gray-500 font-medium">用户</th>
              <th className="px-4 py-3 text-gray-500 font-medium">金额</th>
              <th className="px-4 py-3 text-gray-500 font-medium">方式</th>
              <th className="px-4 py-3 text-gray-500 font-medium">账户</th>
              <th className="px-4 py-3 text-gray-500 font-medium">账户名</th>
              <th className="px-4 py-3 text-gray-500 font-medium">状态</th>
              <th className="px-4 py-3 text-gray-500 font-medium">申请时间</th>
              <th className="px-4 py-3 text-gray-500 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
            ) : withdrawals.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">暂无提现记录</td></tr>
            ) : withdrawals.map((w: any) => (
              <tr key={w.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{w.userEmail || w.userName || w.userPhone || w.userId}</td>
                <td className="px-4 py-3 font-bold">¥{(w.amount || 0).toFixed(2)}</td>
                <td className="px-4 py-3">{methodMap[w.method] || w.method}</td>
                <td className="px-4 py-3 font-mono text-xs">{w.account}</td>
                <td className="px-4 py-3">{w.accountName}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${statusColor[w.status] || ''}`}>
                    {statusMap[w.status] || w.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{w.createdAt ? new Date(w.createdAt).toLocaleString('zh-CN') : '-'}</td>
                <td className="px-4 py-3">
                  {w.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button onClick={() => openAudit(w, 'approve')} className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600">通过</button>
                      <button onClick={() => openAudit(w, 'reject')} className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">拒绝</button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">
                      {w.auditRemark ? `备注: ${w.auditRemark}` : '已处理'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-500">第 {page} / {Math.max(1, Math.ceil(total / pageSize))} 页</span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50">上一页</button>
          <button disabled={page >= Math.ceil(total / pageSize)} onClick={() => setPage(p => p + 1)} className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50">下一页</button>
        </div>
      </div>

      {auditModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">
              {auditAction === 'approve' ? '通过审核' : '拒绝审核'}
            </h3>
            <div className="text-sm text-gray-600 space-y-1 mb-4 bg-gray-50 p-3 rounded-lg">
              <div>用户：{auditModal.userEmail || auditModal.userName || auditModal.userId}</div>
              <div>金额：¥{(auditModal.amount || 0).toFixed(2)}</div>
              <div>方式：{methodMap[auditModal.method] || auditModal.method}</div>
              <div>账户：{auditModal.account}</div>
              <div>账户名：{auditModal.accountName}</div>
            </div>
            <label className="block text-sm text-gray-700 mb-1">审核备注</label>
            <textarea
              value={auditRemark}
              onChange={e => setAuditRemark(e.target.value)}
              rows={3}
              placeholder={auditAction === 'reject' ? '请输入拒绝原因' : '可选，审核说明'}
              className="w-full px-3 py-2 border rounded-lg text-sm mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAuditModal(null)} className="px-4 py-2 text-sm border rounded-lg">取消</button>
              <button
                onClick={submitAudit}
                className={`px-4 py-2 text-sm rounded-lg text-white ${auditAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                确认{auditAction === 'approve' ? '通过' : '拒绝'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
