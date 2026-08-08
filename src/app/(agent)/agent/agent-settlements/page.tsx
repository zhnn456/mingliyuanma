'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-client';

interface Settlement {
  id: string;
  periodStart: string;
  periodEnd: string;
  orderCount: number;
  totalCommission: number;
  netCommission: number;
  status: string;
  paidMethod: string;
  paidAccount: string;
  createdAt: string;
  paidAt: string;
  agentBrand: string;
}

interface SettlementStats {
  pendingAmount: number;
  approvedAmount: number;
  paidAmount: number;
}

export default function AgentSettlementsPage() {
  const { user } = useAuth();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [stats, setStats] = useState<SettlementStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('bank');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [agentLevel, setAgentLevel] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agent/agent-settlements?page=${page}&pageSize=${pageSize}`);
      if (res.ok) {
        const json = await res.json();
        setSettlements(json.settlements || []);
        setTotal(json.total || 0);
        setStats(json.stats || null);
      }
    } catch {}
    setLoading(false);
  }, [page, pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    fetch('/api/agent/settings')
      .then((r) => r.json())
      .then((d) => {
        setAgentLevel(d.agent?.level || 'saas');
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) { setMessage('请填写有效金额'); return; }
    if (!withdrawAccount) { setMessage('请填写收款账户'); return; }

    setWithdrawing(true);
    setMessage('');
    try {
      const res = await fetch('/api/agent/agent-settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply-withdrawal', amount, method: withdrawMethod, account: withdrawAccount }),
      });
      const json = await res.json();
      if (res.ok) {
        setMessage('提现申请已提交');
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        setWithdrawAccount('');
        loadData();
      } else {
        setMessage(json.error || '提交失败');
      }
    } catch {
      setMessage('提交失败');
    }
    setWithdrawing(false);
  };

  const statusMap: Record<string, string> = {
    pending: '待审核', approved: '已批准', paid: '已打款', rejected: '已拒绝',
  };
  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };
  const methodMap: Record<string, string> = {
    bank: '银行卡', alipay: '支付宝', wechat: '微信',
  };

  if (checking) {
    return <div className="p-6 text-center text-gray-400">加载中...</div>;
  }
  if (agentLevel === 'source') {
    return (
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-8 text-center">
        <div className="text-4xl mb-3">🔒</div>
        <p className="text-blue-700 font-medium">结算中心仅 SaaS 代理可用，源码部署代理收入直接进入自己的账户，无需结算</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">结算中心</h1>
          <p className="text-sm text-gray-500 mt-1">管理您的分润结算和提现</p>
        </div>
        <button onClick={() => setShowWithdrawModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          申请提现
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="text-xs text-gray-500 mb-2">待审核</div>
            <div className="text-2xl font-bold text-orange-600">¥{stats.pendingAmount.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="text-xs text-gray-500 mb-2">已批准</div>
            <div className="text-2xl font-bold text-blue-600">¥{stats.approvedAmount.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="text-xs text-gray-500 mb-2">已打款</div>
            <div className="text-2xl font-bold text-green-600">¥{stats.paidAmount.toFixed(2)}</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <div className="px-4 py-3 border-b">
          <h3 className="font-bold text-gray-800">结算记录</h3>
        </div>
        {loading ? (
          <div className="text-center py-10 text-gray-400">加载中...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">结算单号</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">周期</th>
                <th className="px-4 py-3 text-right text-gray-500 font-medium">订单数</th>
                <th className="px-4 py-3 text-right text-gray-500 font-medium">金额</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">打款方式</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">状态</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">创建时间</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {settlements.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">暂无结算记录</td></tr>
              ) : settlements.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{s.id}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {s.periodStart && s.periodEnd ? `${s.periodStart} ~ ${s.periodEnd}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">{s.orderCount}</td>
                  <td className="px-4 py-3 text-right font-bold text-green-600">¥{(s.netCommission || 0).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    {s.paidMethod ? `${methodMap[s.paidMethod] || s.paidMethod} ${s.paidAccount ? `(${s.paidAccount})` : ''}` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${statusColor[s.status] || ''}`}>
                      {statusMap[s.status] || s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{s.createdAt ? new Date(s.createdAt).toLocaleDateString('zh-CN') : '-'}</td>
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

      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowWithdrawModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-4">申请提现</h3>
            {message && <div className={`p-3 rounded-lg text-sm mb-3 ${message.includes('成功') || message.includes('已提交') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{message}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">提现金额 (元)</label>
                <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入提现金额" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">收款方式</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['bank', 'alipay', 'wechat'] as const).map(m => (
                    <button key={m} type="button" onClick={() => setWithdrawMethod(m)}
                      className={`px-3 py-2 border rounded-lg text-sm transition-colors ${withdrawMethod === m ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                      {methodMap[m]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">收款账户</label>
                <input type="text" value={withdrawAccount} onChange={e => setWithdrawAccount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder={withdrawMethod === 'bank' ? '银行卡号' : withdrawMethod === 'alipay' ? '支付宝账号' : '微信号'} />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <button onClick={() => setShowWithdrawModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                取消
              </button>
              <button onClick={handleWithdraw} disabled={withdrawing}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {withdrawing ? '提交中...' : '提交申请'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}