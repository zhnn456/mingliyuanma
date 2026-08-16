'use client';

import { useState, useEffect, useCallback } from 'react';

interface SubAgent {
  id: string;
  userId: string;
  companyName: string;
  domain: string;
  isActive: boolean;
  createdAt: string;
  currentMonthGMV: number;
  totalCommission: number;
  commissionRate: number;
  maxCustomers: number;
  plan: string;
  level: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
}

interface Stats {
  total: number;
  activeCount: number;
  monthGMV: number;
  totalCommission: number;
}

interface SubAgentDetail extends SubAgent {
  planExpiry: string | null;
  subAgentCommissionRate: number;
  maxSubAgents: number;
  subAgentMonthlyFee: number;
  customerCount: number;
  user: {
    id: string;
    email: string;
    name: string;
    phone: string;
    createdAt: string;
  } | null;
}

export default function AgentSubAgentsPage() {
  const [subAgents, setSubAgents] = useState<SubAgent[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [detail, setDetail] = useState<SubAgentDetail | null>(null);
  const [editTarget, setEditTarget] = useState<SubAgent | null>(null);
  const [showCreds, setShowCreds] = useState<{ email: string; password: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [agentLevel, setAgentLevel] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  const [form, setForm] = useState({
    companyName: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    domain: '',
    commissionRate: 0.3,
    maxCustomers: 100,
    password: '',
  });

  const [editForm, setEditForm] = useState({
    isActive: true,
    commissionRate: 0.3,
    maxCustomers: 100,
    domain: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agent/sub-agents');
      if (res.ok) {
        const d = await res.json();
        setSubAgents(d.subAgents || []);
        setStats(d.stats || null);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetch('/api/agent/settings')
      .then((r) => r.json())
      .then((d) => {
        setAgentLevel(d.agent?.level || 'saas');
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, []);

  const handleCreate = async () => {
    if (!form.companyName) { alert('请输入公司名'); return; }
    if (!form.contactEmail) { alert('请输入联系人邮箱'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/agent/sub-agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (res.ok) {
        setShowCreds(d.credentials || null);
        setShowModal(false);
        setForm({
          companyName: '',
          contactName: '',
          contactPhone: '',
          contactEmail: '',
          domain: '',
          commissionRate: 0.3,
          maxCustomers: 100,
          password: '',
        });
        fetchData();
      } else {
        alert(d.error || '创建失败');
      }
    } catch {
      alert('网络错误');
    }
    setSubmitting(false);
  };

  const handleViewDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/agent/sub-agents/${id}`);
      if (res.ok) {
        const d = await res.json();
        setDetail(d.subAgent);
      } else {
        const e = await res.json();
        alert(e.error || '获取详情失败');
      }
    } catch {
      alert('网络错误');
    }
  };

  const handleToggleActive = async (s: SubAgent) => {
    const action = s.isActive ? '停用' : '启用';
    if (!confirm(`确定要${action}分站「${s.companyName}」吗？`)) return;
    try {
      const res = await fetch(`/api/agent/sub-agents/${s.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !s.isActive }),
      });
      const d = await res.json();
      if (res.ok) {
        fetchData();
      } else {
        alert(d.error || `${action}失败`);
      }
    } catch {
      alert('网络错误');
    }
  };

  const handleEdit = (s: SubAgent) => {
    setEditTarget(s);
    setEditForm({
      isActive: s.isActive,
      commissionRate: s.commissionRate,
      maxCustomers: s.maxCustomers,
      domain: s.domain,
    });
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/agent/sub-agents/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const d = await res.json();
      if (res.ok) {
        setEditTarget(null);
        fetchData();
      } else {
        alert(d.error || '保存失败');
      }
    } catch {
      alert('网络错误');
    }
    setSubmitting(false);
  };

  const handleDelete = async (s: SubAgent) => {
    if (!confirm(`确定要删除分站「${s.companyName}」吗？删除后将停用并解除归属关系，相关数据保留但不再计入您的下级。`)) return;
    try {
      const res = await fetch(`/api/agent/sub-agents/${s.id}`, { method: 'DELETE' });
      const d = await res.json();
      if (res.ok) {
        fetchData();
      } else {
        alert(d.error || '删除失败');
      }
    } catch {
      alert('网络错误');
    }
  };

  if (checking) {
    return <div className="p-6 text-center text-gray-400">加载中...</div>;
  }

  if (agentLevel !== 'source') {
    return (
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-8 text-center">
        <div className="text-4xl mb-3">🔒</div>
        <p className="text-blue-700 font-medium">
          分站管理功能当前仅源码部署代理可见。SaaS 代理如需创建下级分站，请联系平台开通。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">分站管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理您名下的 SaaS 下级分站</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          + 创建分站
        </button>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="text-xs text-gray-500 mb-1">下级分站数</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
              <span className="text-xs text-gray-400">活跃 {stats.activeCount}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="text-xs text-gray-500 mb-1">本月总 GMV</div>
            <div className="text-2xl font-bold text-blue-600">¥{Number(stats.monthGMV).toFixed(2)}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="text-xs text-gray-500 mb-1">累计分润</div>
            <div className="text-2xl font-bold text-green-600">¥{Number(stats.totalCommission).toFixed(2)}</div>
          </div>
        </div>
      )}

      {/* 分站列表表格 */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left">
                <th className="px-4 py-3 text-gray-500 font-medium">公司名</th>
                <th className="px-4 py-3 text-gray-500 font-medium">域名</th>
                <th className="px-4 py-3 text-gray-500 font-medium">状态</th>
                <th className="px-4 py-3 text-right text-gray-500 font-medium">本月 GMV</th>
                <th className="px-4 py-3 text-right text-gray-500 font-medium">累计佣金</th>
                <th className="px-4 py-3 text-gray-500 font-medium">创建时间</th>
                <th className="px-4 py-3 text-gray-500 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">加载中...</td></tr>
              ) : subAgents.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">暂无下级分站，点击右上角「创建分站」开始</td></tr>
              ) : subAgents.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{s.companyName}</div>
                    <div className="text-xs text-gray-400">{s.contactEmail || s.contactName || '-'}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.domain || <span className="text-gray-400">未绑定</span>}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {s.isActive ? '运行中' : '已停用'}
                    </span>
                    <div className="text-xs text-gray-400 mt-1">
                      分润 {(s.commissionRate * 100).toFixed(0)}% · {s.maxCustomers}客户
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900">¥{Number(s.currentMonthGMV).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-bold text-green-600">¥{Number(s.totalCommission).toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {s.createdAt ? new Date(s.createdAt).toLocaleDateString('zh-CN') : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2 text-xs">
                      <button onClick={() => handleViewDetail(s.id)} className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded">详情</button>
                      <button onClick={() => handleEdit(s)} className="px-2 py-1 text-gray-700 hover:bg-gray-100 rounded">编辑</button>
                      <button onClick={() => handleToggleActive(s)} className={`px-2 py-1 rounded ${s.isActive ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}>
                        {s.isActive ? '停用' : '启用'}
                      </button>
                      <button onClick={() => handleDelete(s)} className="px-2 py-1 text-red-600 hover:bg-red-50 rounded">删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 创建分站模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">创建下级分站</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">公司名 *</label>
                <input
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="下级分站公司名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系人</label>
                <input
                  value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="联系人姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
                <input
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="联系电话"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系邮箱 *</label>
                <input
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="将作为登录账号"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">绑定域名（可选）</label>
                <input
                  value={form.domain}
                  onChange={(e) => setForm({ ...form, domain: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="例如 sub.example.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">分润比例</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={form.commissionRate}
                    onChange={(e) => setForm({ ...form, commissionRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="0.3 表示 30%"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最大客户数</label>
                  <input
                    type="number"
                    min="0"
                    value={form.maxCustomers}
                    onChange={(e) => setForm({ ...form, maxCustomers: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">初始密码</label>
                <input
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="留空则默认为 12345678"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">取消</button>
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 凭证展示 */}
      {showCreds && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-bold text-gray-900 text-lg mb-4">分站创建成功</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-800 font-medium mb-2">请将以下登录信息提供给下级分站：</p>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-500">登录邮箱：</span><span className="font-mono">{showCreds.email}</span></div>
                <div><span className="text-gray-500">初始密码：</span><span className="font-mono">{showCreds.password}</span></div>
              </div>
            </div>
            <button onClick={() => setShowCreds(null)} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">我已保存</button>
          </div>
        </div>
      )}

      {/* 编辑分站模态框 */}
      {editTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-1">编辑分站</h3>
            <p className="text-xs text-gray-500 mb-4">{editTarget.companyName}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                <select
                  value={editForm.isActive ? '1' : '0'}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === '1' })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="1">运行中</option>
                  <option value="0">已停用</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分润比例（0~1）</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={editForm.commissionRate}
                  onChange={(e) => setEditForm({ ...editForm, commissionRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">不能超过您的分润比例</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">最大客户数</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.maxCustomers}
                  onChange={(e) => setEditForm({ ...editForm, maxCustomers: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">绑定域名</label>
                <input
                  value={editForm.domain}
                  onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="留空表示未绑定"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setEditTarget(null)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">取消</button>
              <button
                onClick={handleSaveEdit}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 分站详情模态框 */}
      {detail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">分站详情</h3>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">公司名</div>
                  <div className="font-medium text-gray-900">{detail.companyName}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">状态</div>
                  <div className="font-medium">
                    <span className={`text-xs px-2 py-0.5 rounded ${detail.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {detail.isActive ? '运行中' : '已停用'}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">登录邮箱</div>
                  <div className="font-medium text-gray-900 break-all">{detail.user?.email || detail.contactEmail || '-'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">联系人</div>
                  <div className="font-medium text-gray-900">{detail.contactName || '-'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">联系电话</div>
                  <div className="font-medium text-gray-900">{detail.contactPhone || '-'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">绑定域名</div>
                  <div className="font-medium text-gray-900 break-all">{detail.domain || '未绑定'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">套餐 / 到期</div>
                  <div className="font-medium text-gray-900">
                    {detail.plan}
                    {detail.planExpiry ? ` · ${new Date(detail.planExpiry).toLocaleDateString('zh-CN')}` : ''}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">客户数 / 上限</div>
                  <div className="font-medium text-gray-900">{detail.customerCount} / {detail.maxCustomers}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">分润比例</div>
                  <div className="font-medium text-gray-900">{(detail.commissionRate * 100).toFixed(0)}%</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">下级分站设置</div>
                  <div className="font-medium text-gray-900">
                    上限 {detail.maxSubAgents} · 月费 ¥{detail.subAgentMonthlyFee}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">本月 GMV</div>
                  <div className="font-medium text-blue-600">¥{Number(detail.currentMonthGMV).toFixed(2)}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">累计佣金</div>
                  <div className="font-medium text-green-600">¥{Number(detail.totalCommission).toFixed(2)}</div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500">创建时间</div>
                <div className="font-medium text-gray-900">
                  {detail.createdAt ? new Date(detail.createdAt).toLocaleString('zh-CN') : '-'}
                </div>
              </div>
            </div>
            <button onClick={() => setDetail(null)} className="mt-5 w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">关闭</button>
          </div>
        </div>
      )}
    </div>
  );
}
