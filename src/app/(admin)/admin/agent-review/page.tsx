'use client';

import { useState, useEffect, useMemo } from 'react';

interface AgentRecord {
  id: string;
  companyName?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  domain?: string | null;
  brandName?: string | null;
  logo?: string | null;
  licenseKey?: string | null;
  licenseDomain?: string | null;
  licenseStatus?: string | null;
  isActive?: boolean;
  userEmail?: string | null;
  userName?: string | null;
  userPhone?: string | null;
  licenseId?: string | null;
  rejectReason?: string;
  reviewStatus?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

const STATUS_MAP: Record<string, string> = {
  pending: '待审核',
  active: '已通过',
  rejected: '已拒绝',
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function AgentReviewPage() {
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; agentId?: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [batchRejectModal, setBatchRejectModal] = useState(false);
  const [batchRejectReason, setBatchRejectReason] = useState('');

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (statusFilter) params.set('status', statusFilter);
      if (keyword) params.set('keyword', keyword);
      const res = await fetch(`/api/admin/agent-review?${params}`);
      if (res.ok) {
        const d = await res.json();
        setAgents(d.agents || []);
        setTotal(d.total || 0);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, keyword]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const currentPageIds = useMemo(() => agents.map(a => a.id), [agents]);
  const allCheckedOnPage = currentPageIds.length > 0 && currentPageIds.every(id => selectedIds.includes(id));

  const toggleSelectAllOnPage = () => {
    if (allCheckedOnPage) {
      setSelectedIds(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...currentPageIds])));
    }
  };

  const openRejectModal = (agentId: string) => {
    setRejectReason('');
    setRejectModal({ open: true, agentId });
  };

  const handleApprove = async (agentId: string) => {
    const res = await fetch('/api/admin/agent-review', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, action: 'approve' }),
    });
    if (res.ok) fetchAgents();
  };

  const handleReject = async () => {
    if (!rejectModal?.agentId) return;
    const res = await fetch('/api/admin/agent-review', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: rejectModal.agentId, action: 'reject', rejectReason }),
    });
    if (res.ok) {
      setRejectModal(null);
      fetchAgents();
    } else {
      alert('拒绝失败');
    }
  };

  const handleBatchApprove = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`确认批量通过 ${selectedIds.length} 个代理商的审核？`)) return;
    const res = await fetch(`/api/admin/agent-review?ids=${selectedIds.join(',')}&action=approve`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      setSelectedIds([]);
      fetchAgents();
    }
  };

  const openBatchRejectModal = () => {
    if (selectedIds.length === 0) return;
    setBatchRejectReason('');
    setBatchRejectModal(true);
  };

  const handleBatchReject = async () => {
    if (selectedIds.length === 0) return;
    if (!batchRejectReason.trim()) {
      alert('请填写拒绝原因');
      return;
    }
    const res = await fetch(`/api/admin/agent-review?ids=${selectedIds.join(',')}&action=reject`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rejectReason: batchRejectReason }),
    });
    if (res.ok) {
      setBatchRejectModal(false);
      setSelectedIds([]);
      fetchAgents();
    } else {
      alert('批量拒绝失败');
    }
  };

  const handleSearch = () => {
    setKeyword(searchInput.trim());
    setPage(1);
  };

  const getReviewStatus = (a: AgentRecord): string => {
    return a.reviewStatus || a.licenseStatus || (a.isActive ? 'active' : 'pending');
  };

  const isPending = (a: AgentRecord) => getReviewStatus(a) === 'pending';

  const validateAgent = (a: AgentRecord) => {
    const errors: string[] = [];
    if (!a.companyName || !String(a.companyName).trim()) errors.push('公司名称不完整');
    if (!a.contactName || !String(a.contactName).trim()) errors.push('联系人姓名无效');
    if (!a.contactPhone || !String(a.contactPhone).trim()) errors.push('联系电话无效');
    if (!a.domain || !String(a.domain).trim()) errors.push('域名未验证');
    if (!a.licenseKey || !String(a.licenseKey).trim()) errors.push('授权码无效');
    return errors;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">资质审核</h2>
          <p className="text-sm text-gray-500">共 {total} 条记录，已选择 {selectedIds.length} 条</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
            placeholder="搜索名称/域名/品牌"
            className="px-3 py-2 border rounded-lg text-sm w-56"
          />
          <button onClick={handleSearch} className="px-3 py-2 text-sm border rounded-lg bg-gray-50 hover:bg-gray-100">搜索</button>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="pending">待审核</option>
            <option value="">全部状态</option>
            <option value="active">已通过</option>
            <option value="rejected">已拒绝</option>
          </select>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="mb-4 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm">
          <span className="text-blue-700">已选 {selectedIds.length} 条</span>
          <div className="flex-1" />
          <button
            onClick={handleBatchApprove}
            className="px-3 py-1 border border-green-500 text-green-700 rounded hover:bg-green-50"
          >
            批量通过
          </button>
          <button
            onClick={openBatchRejectModal}
            className="px-3 py-1 border border-red-500 text-red-700 rounded hover:bg-red-50"
          >
            批量拒绝
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="px-3 py-1 border rounded hover:bg-gray-100 text-gray-600"
          >
            清除选择
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allCheckedOnPage}
                  onChange={toggleSelectAllOnPage}
                />
              </th>
              <th className="px-4 py-3 text-gray-500 font-medium">代理商名称</th>
              <th className="px-4 py-3 text-gray-500 font-medium">联系人</th>
              <th className="px-4 py-3 text-gray-500 font-medium">域名</th>
              <th className="px-4 py-3 text-gray-500 font-medium">申请时间</th>
              <th className="px-4 py-3 text-gray-500 font-medium">状态</th>
              <th className="px-4 py-3 text-gray-500 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
            ) : agents.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
            ) : agents.map((a) => {
              const status = getReviewStatus(a);
              const isExpanded = !!expanded[a.id];
              const errors = validateAgent(a);
              return (
                  <>
                  <tr key={a.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(a.id)}
                        onChange={() => toggleSelect(a.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleExpand(a.id)}
                        className="text-left hover:text-blue-600"
                      >
                        <div className="font-medium text-gray-900">{a.companyName || a.brandName || '-'}</div>
                        {a.brandName && a.companyName && (
                          <div className="text-xs text-gray-500">品牌：{a.brandName}</div>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div>{a.contactName || '-'}</div>
                      {a.contactPhone && <div className="text-xs text-gray-500">{a.contactPhone}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{a.domain || '-'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {a.createdAt ? new Date(a.createdAt).toLocaleString('zh-CN') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLOR[status] || ''}`}>
                        {STATUS_MAP[status] || status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isPending(a) ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(a.id)}
                            className="text-xs px-2 py-1 border border-green-500 text-green-700 rounded hover:bg-green-50"
                          >
                            通过
                          </button>
                          <button
                            onClick={() => openRejectModal(a.id)}
                            className="text-xs px-2 py-1 border border-red-500 text-red-700 rounded hover:bg-red-50"
                          >
                            拒绝
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => toggleExpand(a.id)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          {isExpanded ? '收起' : '详情'}
                        </button>
                      )}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-gray-50 border-b">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-gray-700 text-sm mb-2">基本信息</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between"><span className="text-gray-500">公司名称</span><span>{a.companyName || '-'}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">品牌名称</span><span>{a.brandName || '-'}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Logo</span><span className="text-xs">{a.logo || '-'}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">创建时间</span><span className="text-xs">{a.createdAt ? new Date(a.createdAt).toLocaleString('zh-CN') : '-'}</span></div>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-700 text-sm mb-2">联系方式</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between"><span className="text-gray-500">联系人</span><span>{a.contactName || '-'}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">联系电话</span><span>{a.contactPhone || '-'}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">账号邮箱</span><span className="text-xs">{a.userEmail || '-'}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">账号手机</span><span>{a.userPhone || '-'}</span></div>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-700 text-sm mb-2">域名验证</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between"><span className="text-gray-500">绑定域名</span><span>{a.domain || '-'}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">授权域名</span><span>{a.licenseDomain || a.domain || '-'}</span></div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">有效性</span>
                                <span className={a.domain ? 'text-green-600' : 'text-red-600'}>
                                  {a.domain ? '✓ 已验证' : '✗ 未设置'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-700 text-sm mb-2">授权信息</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between"><span className="text-gray-500">授权码</span><span className="font-mono text-xs">{a.licenseKey || '-'}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">授权状态</span>
                                <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLOR[status] || ''}`}>
                                  {STATUS_MAP[status] || status}
                                </span>
                              </div>
                              {a.rejectReason && (
                                <div className="pt-2 border-t border-gray-200">
                                  <div className="text-xs text-red-600">拒绝原因：{a.rejectReason}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {status === 'pending' && errors.length > 0 && (
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                            <div className="text-xs font-medium text-yellow-800 mb-1">审核提示</div>
                            <ul className="text-xs text-yellow-700 list-disc pl-5 space-y-0.5">
                              {errors.map((err, i) => <li key={i}>{err}</li>)}
                            </ul>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                  </>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-500">第 {page} / {totalPages} 页</span>
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

      {rejectModal?.open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setRejectModal(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-4">拒绝审核</h3>
            <label className="block text-sm text-gray-700 mb-2">拒绝原因</label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={4}
              placeholder="请填写拒绝原因，代理商将看到此信息"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setRejectModal(null)}
                className="px-4 py-2 border rounded-lg text-sm"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-50 hover:bg-red-700"
              >
                确认拒绝
              </button>
            </div>
          </div>
        </div>
      )}

      {batchRejectModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setBatchRejectModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-4">批量拒绝审核</h3>
            <p className="text-sm text-gray-600 mb-3">将拒绝已选择的 {selectedIds.length} 个代理商的审核</p>
            <label className="block text-sm text-gray-700 mb-2">统一拒绝原因</label>
            <textarea
              value={batchRejectReason}
              onChange={e => setBatchRejectReason(e.target.value)}
              rows={4}
              placeholder="请填写拒绝原因"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setBatchRejectModal(false)}
                className="px-4 py-2 border rounded-lg text-sm"
              >
                取消
              </button>
              <button
                onClick={handleBatchReject}
                disabled={!batchRejectReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-50 hover:bg-red-700"
              >
                确认拒绝
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
