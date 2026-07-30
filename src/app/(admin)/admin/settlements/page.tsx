'use client';

import { useState, useEffect } from 'react';
interface Settlement {
  id: string;
  agentId: string;
  periodStart: string;
  periodEnd: string;
  orderCount: number;
  totalOrderAmount: number;
  totalCommission: number;
  netCommission: number;
  status: string;
  agentBrand?: string;
  companyName?: string;
  createdAt: string;
  paidAt?: string | null;
  paidMethod?: string | null;
  paidAccount?: string | null;
  auditRemark?: string | null;
}

interface Agent {
  id: string;
  brandName?: string;
  companyName?: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待审核', color: 'bg-amber-100 text-amber-800' },
  approved: { label: '已批准', color: 'bg-blue-100 text-blue-800' },
  paid: { label: '已打款', color: 'bg-green-100 text-green-800' },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-800' },
};

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pendingSettlementCount: 0, pendingAmount: 0, approvedAmount: 0, paidAmount: 0 });
  const [agents, setAgents] = useState<Agent[]>([]);

  const [agentFilter, setAgentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateForm, setGenerateForm] = useState({ weekStart: '', weekEnd: '' });

  const [detailItem, setDetailItem] = useState<Settlement | null>(null);
  const [detailRecords, setDetailRecords] = useState<any[]>([]);

  const [approveModal, setApproveModal] = useState<{ item: Settlement | null; action: 'approve' | 'reject'; remark: string }>({ item: null, action: 'approve', remark: '' });
  const [paidModal, setPaidModal] = useState<{ item: Settlement | null; paidMethod: string; paidAccount: string }>({ item: null, paidMethod: 'alipay', paidAccount: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (agentFilter) params.set('agentId', agentFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/settlements?${params}`);
      if (res.ok) {
        const d = await res.json();
        setSettlements(d.settlements || []);
        setTotal(d.total || 0);
        if (d.stats) setStats(d.stats);
      }
    } catch {} finally { setLoading(false); }
  };

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/admin/agents');
      if (res.ok) {
        const d = await res.json();
        setAgents((d.agents || []).map((a: any) => ({
          id: a.id, brandName: a.brandName, companyName: a.companyName,
        })));
      }
    } catch {}
  };

  useEffect(() => { fetchData(); }, [page]);
  useEffect(() => { fetchAgents(); }, []);

  const onSearch = () => { setPage(1); fetchData(); };

  const openDetail = async (s: Settlement) => {
    setDetailItem(s);
    try {
      const res = await fetch(`/api/admin/commission-records?agentId=${s.agentId}&startDate=${s.periodStart}&endDate=${s.periodEnd}&pageSize=100`);
      if (res.ok) {
        const d = await res.json();
        setDetailRecords((d.records || []).filter((r: any) => r.status === 'settled' && r.settlementId === s.id));
      }
    } catch { setDetailRecords([]); }
  };

  const openApprove = (s: Settlement) => {
    setApproveModal({ item: s, action: 'approve', remark: '' });
  };

  const openReject = (s: Settlement) => {
    setApproveModal({ item: s, action: 'reject', remark: '' });
  };

  const handleApproveSubmit = async () => {
    if (!approveModal.item) return;
    const action = approveModal.action;
    const res = await fetch('/api/admin/settlements', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, settlementId: approveModal.item.id, remark: approveModal.remark }),
    });
    if (res.ok) {
      setApproveModal({ item: null, action: 'approve', remark: '' });
      fetchData();
    } else {
      const e = await res.json();
      alert(e.error || '操作失败');
    }
  };

  const openPaid = (s: Settlement) => {
    setPaidModal({ item: s, paidMethod: 'alipay', paidAccount: '' });
  };

  const handlePaidSubmit = async () => {
    if (!paidModal.item) return;
    if (!paidModal.paidAccount) { alert('请填写支付账号'); return; }
    const res = await fetch('/api/admin/settlements', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark-paid', settlementId: paidModal.item.id, paidMethod: paidModal.paidMethod, paidAccount: paidModal.paidAccount }),
    });
    if (res.ok) {
      setPaidModal({ item: null, paidMethod: 'alipay', paidAccount: '' });
      fetchData();
    } else {
      const e = await res.json();
      alert(e.error || '操作失败');
    }
  };

  const handleGenerate = async () => {
    if (!generateForm.weekStart || !generateForm.weekEnd) { alert('请选择结算周期'); return; }
    const res = await fetch('/api/admin/settlements', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'generate', weekStart: generateForm.weekStart, weekEnd: generateForm.weekEnd }),
    });
    if (res.ok) {
      const d = await res.json();
      alert(`成功生成 ${d.generatedCount} 个结算单`);
      setShowGenerateModal(false);
      setGenerateForm({ weekStart: '', weekEnd: '' });
      fetchData();
    } else {
      const e = await res.json();
      alert(e.error || '生成失败');
    }
  };

  const fmtMoney = (n: number) => '¥' + (n || 0).toFixed(2);
  const fmtDate = (s: string | null | undefined) => s ? new Date(s).toLocaleString('zh-CN') : '-';
  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-slate-900">结算审核</h1>
        <p className="text-sm text-slate-500 mt-1">管理代理商分润结算的审核与打款</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { label: '待审核单数', value: stats.pendingSettlementCount, color: 'text-amber-600' },
          { label: '待审核金额', value: fmtMoney(stats.pendingAmount), color: 'text-amber-600' },
          { label: '已批准金额', value: fmtMoney(stats.approvedAmount), color: 'text-blue-600' },
          { label: '已打款金额', value: fmtMoney(stats.paidAmount), color: 'text-green-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border p-4">
            <div className="text-sm text-slate-500">{s.label}</div>
            <div className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="flex items-center gap-2 p-4 border-b flex-wrap">
          <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">全部代理商</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.brandName || a.companyName || a.id}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">全部状态</option>
            {Object.entries(STATUS_MAP).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
          </select>
          <button onClick={onSearch} className="px-3 py-1.5 bg-slate-100 rounded-lg text-sm hover:bg-slate-200">搜索</button>
          <div className="flex-1" />
          <button onClick={() => setShowGenerateModal(true)} className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">生成周结算</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left">
                <th className="px-4 py-3 text-gray-500 font-medium">代理商</th>
                <th className="px-4 py-3 text-gray-500 font-medium">周期</th>
                <th className="px-4 py-3 text-gray-500 font-medium">订单数</th>
                <th className="px-4 py-3 text-gray-500 font-medium">总金额</th>
                <th className="px-4 py-3 text-gray-500 font-medium">佣金金额</th>
                <th className="px-4 py-3 text-gray-500 font-medium">状态</th>
                <th className="px-4 py-3 text-gray-500 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
              ) : settlements.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
              ) : settlements.map((s) => {
                const st = STATUS_MAP[s.status] || { label: s.status, color: 'bg-gray-100 text-gray-600' };
                return (
                  <tr key={s.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{s.agentBrand || s.companyName || s.agentId}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{s.periodStart} ~ {s.periodEnd}</td>
                    <td className="px-4 py-3 text-gray-600">{s.orderCount}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtMoney(s.totalOrderAmount)}</td>
                    <td className="px-4 py-3 font-medium text-green-600">{fmtMoney(s.netCommission)}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded ${st.color}`}>{st.label}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => openDetail(s)} className="text-blue-600 hover:text-blue-800 text-xs">详情</button>
                        {s.status === 'pending' && (
                          <>
                            <button onClick={() => openApprove(s)} className="text-green-600 hover:text-green-800 text-xs">批准</button>
                            <button onClick={() => openReject(s)} className="text-red-500 hover:text-red-700 text-xs">拒绝</button>
                          </>
                        )}
                        {s.status === 'approved' && (
                          <button onClick={() => openPaid(s)} className="text-purple-600 hover:text-purple-800 text-xs">标记已打款</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-4 border-t">
          <span className="text-sm text-gray-500">共 {total} 条</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 border rounded text-sm disabled:opacity-50">上一页</button>
            <span className="px-3 py-1 text-sm">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 border rounded text-sm disabled:opacity-50">下一页</button>
          </div>
        </div>
      </div>

      {/* 生成周结算 */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">生成周结算</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                  <input type="date" value={generateForm.weekStart} onChange={(e) => setGenerateForm({ ...generateForm, weekStart: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
                  <input type="date" value={generateForm.weekEnd} onChange={(e) => setGenerateForm({ ...generateForm, weekEnd: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
                系统将为所有活跃代理商生成所选周期的结算单（已有结算的周期将跳过）。
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowGenerateModal(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">取消</button>
              <button onClick={handleGenerate} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">生成</button>
            </div>
          </div>
        </div>
      )}

      {/* 详情 */}
      {detailItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">结算详情</h3>
            <div className="space-y-3 text-sm mb-4">
              <div className="flex justify-between"><span className="text-gray-500">代理商</span><span className="font-medium">{detailItem.agentBrand || detailItem.companyName || detailItem.agentId}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">结算周期</span><span>{detailItem.periodStart} ~ {detailItem.periodEnd}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">订单数</span><span>{detailItem.orderCount}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">订单总金额</span><span>{fmtMoney(detailItem.totalOrderAmount)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">佣金金额</span><span className="font-medium text-green-600">{fmtMoney(detailItem.netCommission)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">状态</span>
                <span className={`text-xs px-2 py-1 rounded ${(STATUS_MAP[detailItem.status] || { color: 'bg-gray-100 text-gray-600' }).color}`}>{(STATUS_MAP[detailItem.status] || { label: detailItem.status }).label}</span>
              </div>
              {detailItem.auditRemark && (
                <div className="flex justify-between"><span className="text-gray-500">审核备注</span><span>{detailItem.auditRemark}</span></div>
              )}
              {detailItem.paidAt && (
                <div className="flex justify-between"><span className="text-gray-500">打款时间</span><span>{fmtDate(detailItem.paidAt)}</span></div>
              )}
              {detailItem.paidMethod && (
                <div className="flex justify-between"><span className="text-gray-500">支付方式</span><span>{detailItem.paidMethod}</span></div>
              )}
              {detailItem.paidAccount && (
                <div className="flex justify-between"><span className="text-gray-500">支付账号</span><span>{detailItem.paidAccount}</span></div>
              )}
            </div>

            {detailRecords.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">分润明细</h4>
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b text-left">
                        <th className="px-2 py-2 text-gray-500">订单号</th>
                        <th className="px-2 py-2 text-gray-500">产品</th>
                        <th className="px-2 py-2 text-gray-500">金额</th>
                        <th className="px-2 py-2 text-gray-500">分润</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailRecords.map((r: any) => (
                        <tr key={r.id} className="border-b">
                          <td className="px-2 py-1 font-mono">{r.orderId}</td>
                          <td className="px-2 py-1">{r.productType}</td>
                          <td className="px-2 py-1">{fmtMoney(r.orderAmount)}</td>
                          <td className="px-2 py-1 text-green-600">{fmtMoney(r.totalCommission)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              {detailItem.status === 'pending' && (
                <>
                  <button onClick={() => { setDetailItem(null); openReject(detailItem); }} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600">拒绝</button>
                  <button onClick={() => { setDetailItem(null); openApprove(detailItem); }} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">批准</button>
                </>
              )}
              {detailItem.status === 'approved' && (
                <button onClick={() => { setDetailItem(null); openPaid(detailItem); }} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">标记已打款</button>
              )}
              <button onClick={() => setDetailItem(null)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">关闭</button>
            </div>
          </div>
        </div>
      )}

      {/* 批准/拒绝 */}
      {approveModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{approveModal.action === 'approve' ? '批准结算' : '拒绝结算'}</h3>
            <div className="space-y-4">
              <div className="text-sm">
                <div>代理商: {approveModal.item.agentBrand || approveModal.item.companyName || approveModal.item.agentId}</div>
                <div>佣金金额: <span className="font-medium text-green-600">{fmtMoney(approveModal.item.netCommission)}</span></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea value={approveModal.remark} onChange={(e) => setApproveModal({ ...approveModal, remark: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" rows={3} placeholder="审核备注（可选）" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setApproveModal({ item: null, action: 'approve', remark: '' })} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">取消</button>
              <button onClick={handleApproveSubmit} className={`px-4 py-2 text-white rounded-lg text-sm ${approveModal.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'}`}>
                确认{approveModal.action === 'approve' ? '批准' : '拒绝'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 标记已打款 */}
      {paidModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">标记已打款</h3>
            <div className="space-y-4">
              <div className="text-sm">
                <div>代理商: {paidModal.item.agentBrand || paidModal.item.companyName || paidModal.item.agentId}</div>
                <div>佣金金额: <span className="font-medium text-green-600">{fmtMoney(paidModal.item.netCommission)}</span></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">支付方式 *</label>
                <select value={paidModal.paidMethod} onChange={(e) => setPaidModal({ ...paidModal, paidMethod: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="alipay">支付宝</option>
                  <option value="wechat">微信</option>
                  <option value="bank">银行转账</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">支付账号 *</label>
                <input type="text" value={paidModal.paidAccount} onChange={(e) => setPaidModal({ ...paidModal, paidAccount: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="请输入支付账号" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setPaidModal({ item: null, paidMethod: 'alipay', paidAccount: '' })} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">取消</button>
              <button onClick={handlePaidSubmit} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">确认打款</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}