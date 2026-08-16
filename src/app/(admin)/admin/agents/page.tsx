'use client';

import { useState, useEffect, useMemo } from 'react';

interface Agent {
  id: string;
  userId: string;
  companyName: string;
  contactName: string;
  contactPhone: string;
  domain: string | null;
  brandName: string;
  logo: string | null;
  siteConfig: string | null;
  licenseKey: string;
  licenseExpiry: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  plan?: string;
  planExpiry?: string | null;
  balance?: number;
  maxCustomers?: number;
  level?: string;
  user?: {
    email: string;
    name: string | null;
    memberLevel: string;
    createdAt: string;
  };
  _count?: {
    customers: number;
  };
}

const PLAN_LABELS: Record<string, { name: string; color: string }> = {
  trial: { name: '试用版', color: 'bg-gray-100 text-gray-700' },
  monthly: { name: '月费版', color: 'bg-blue-100 text-blue-700' },
  yearly: { name: '年费版', color: 'bg-purple-100 text-purple-700' },
  lifetime: { name: '终身版', color: 'bg-amber-100 text-amber-700' },
};

const STATUS_OPTIONS = [
  { key: '', label: '全部状态' },
  { key: 'active', label: '启用中' },
  { key: 'inactive', label: '已禁用' },
];

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Agent | null>(null);
  const [detailAgent, setDetailAgent] = useState<Agent | null>(null);
  const [showCreds, setShowCreds] = useState<{ email: string; password: string; licenseKey?: string; brandName?: string } | null>(null);
  const [rechargeAgent, setRechargeAgent] = useState<Agent | null>(null);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeReason, setRechargeReason] = useState('');
  const [rechargeLoading, setRechargeLoading] = useState(false);

  const [form, setForm] = useState({
    brandName: '',
    contactName: '',
    contactPhone: '',
    email: '',
    domain: '',
    isActive: true,
    licenseExpiry: '',
    level: 'saas' as 'saas' | 'source',
    planType: 'monthly' as string,
  });

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/agents');
      if (res.ok) {
        const d = await res.json();
        setAgents(d.agents || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAgents(); }, []);

  const filtered = useMemo(() => {
    let list = agents;
    if (statusFilter === 'active') list = list.filter((a) => a.isActive);
    if (statusFilter === 'inactive') list = list.filter((a) => !a.isActive);
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      list = list.filter(
        (a) =>
          (a.brandName || '').toLowerCase().includes(kw) ||
          (a.contactName || '').toLowerCase().includes(kw) ||
          (a.user?.email || '').toLowerCase().includes(kw) ||
          (a.domain || '').toLowerCase().includes(kw)
      );
    }
    return list;
  }, [agents, searchKeyword, statusFilter]);

  const stats = useMemo(() => ({
    total: agents.length,
    active: agents.filter((a) => a.isActive).length,
    inactive: agents.filter((a) => !a.isActive).length,
    customers: agents.reduce((s, a) => s + (a._count?.customers || 0), 0),
    totalBalance: agents.reduce((s, a) => s + (Number(a.balance) || 0), 0),
  }), [agents]);

  const onSearch = () => { setSearchKeyword(keyword); };

  const openCreate = () => {
    setEditing(null);
    setForm({ brandName: '', contactName: '', contactPhone: '', email: '', domain: '', isActive: true, licenseExpiry: '', level: 'saas', planType: 'monthly' });
    setShowModal(true);
  };

  const openEdit = (a: Agent) => {
    setEditing(a);
    setForm({
      brandName: a.brandName || '',
      contactName: a.contactName || '',
      contactPhone: a.contactPhone || '',
      email: a.user?.email || '',
      domain: a.domain || '',
      isActive: a.isActive,
      licenseExpiry: a.licenseExpiry ? a.licenseExpiry.slice(0, 10) : '',
      level: (a.level === 'source' ? 'source' : 'saas') as 'saas' | 'source',
      planType: a.plan || 'monthly',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (editing) {
      const res = await fetch('/api/admin/agents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: editing.id,
          brandName: form.brandName,
          contactName: form.contactName,
          contactPhone: form.contactPhone,
          domain: form.domain || null,
          licenseExpiry: form.licenseExpiry || null,
        }),
      });
      if (res.ok) { setShowModal(false); fetchAgents(); }
      else { const e = await res.json(); alert(e.error || '更新失败'); }
    } else {
      if (!form.contactName || !form.contactPhone) { alert('联系人姓名和电话为必填'); return; }
      if (!form.email) { alert('请提供代理商登录邮箱'); return; }
      if (form.level === 'source' && !form.domain) { alert('源码部署代理必须填写绑定域名'); return; }
      const res = await fetch('/api/admin/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          brandName: form.brandName,
          companyName: form.brandName,
          contactName: form.contactName,
          contactPhone: form.contactPhone,
          domain: form.domain || null,
          email: form.email,
          licenseExpiry: form.licenseExpiry || null,
          level: form.level,
          planType: form.planType,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setShowCreds({
          email: d.credentials?.email || '',
          password: d.credentials?.password || '',
          licenseKey: d.agent?.licenseKey || '',
          brandName: d.agent?.brandName || '',
        });
        setShowModal(false);
        fetchAgents();
      } else { const e = await res.json(); alert(e.error || '创建失败'); }
    }
  };

  const handleToggle = async (a: Agent) => {
    const action = a.isActive ? '禁用' : '启用';
    if (!confirm(`确定要${action}代理商「${a.brandName}」？`)) return;
    const res = await fetch('/api/admin/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle', agentId: a.id, isActive: !a.isActive }),
    });
    if (res.ok) fetchAgents();
    else { const e = await res.json(); alert(e.error || '操作失败'); }
  };

  const openAgreement = (a: Agent) => {
    const params = new URLSearchParams({
      no: `LIC-DEPLOY-${a.id}`,
      name: a.companyName || a.brandName || '',
      domain: a.domain || '',
      contact: a.contactName || '',
      email: a.user?.email || '',
    });
    window.open(`/source-deploy-agreement.html?${params.toString()}`, '_blank');
  };

  const handleDelete = async (a: Agent) => {
    if (!confirm(`确定要删除代理商「${a.brandName}」？此操作不可恢复！`)) return;
    try {
      const res = await fetch(`/api/admin/agents?id=${a.id}`, { method: 'DELETE' });
      if (res.ok) fetchAgents();
      else {
        const e = await res.json();
        alert(e.error || '删除失败');
      }
    } catch {
      alert('删除失败，请确认后端接口是否支持');
    }
  };

  const handleRecharge = async () => {
    if (!rechargeAgent) return;
    const amount = parseFloat(rechargeAmount);
    if (!amount || amount === 0) { alert('请输入有效金额'); return; }
    setRechargeLoading(true);
    try {
      const res = await fetch('/api/admin/agent-recharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: rechargeAgent.id,
          amount,
          reason: rechargeReason || '管理员充值',
        }),
      });
      const d = await res.json();
      if (res.ok) {
        alert(d.message || '充值成功');
        setRechargeAgent(null);
        setRechargeAmount('');
        setRechargeReason('');
        fetchAgents();
      } else {
        alert(d.error || '充值失败');
      }
    } catch {
      alert('网络错误');
    }
    setRechargeLoading(false);
  };

  const handleRegenerateLicense = async (a: Agent) => {
    if (!confirm(`确定要为代理商「${a.brandName}」重新生成授权码？\n\n旧授权码将立即失效，新授权码有效期为1年。`)) return;
    try {
      const res = await fetch('/api/admin/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'regenerate_license', agentId: a.id }),
      });
      const d = await res.json();
      if (res.ok) {
        alert(`授权码已重新生成！\n\n新授权码：\n${d.licenseKey}\n\n请复制并妥善保存。`);
        // 更新详情页数据
        setDetailAgent({ ...a, licenseKey: d.licenseKey, licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() });
        fetchAgents();
      } else {
        alert(d.error || '生成失败');
      }
    } catch {
      alert('网络错误');
    }
  };

  const fmtDate = (s: string | null | undefined) =>
    s ? new Date(s).toLocaleDateString('zh-CN') : '-';
  const fmtDateTime = (s: string | null | undefined) =>
    s ? new Date(s).toLocaleString('zh-CN') : '-';

  const parseSiteConfig = (sc: string | null): Record<string, any> | null => {
    if (!sc) return null;
    try { return JSON.parse(sc); } catch { return null; }
  };

  const getPlanLabel = (plan: string | undefined) => {
    if (!plan) return { name: '未设置', color: 'bg-gray-100 text-gray-500' };
    return PLAN_LABELS[plan] || { name: plan, color: 'bg-gray-100 text-gray-700' };
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">代理商管理</h1>
          <p className="text-sm text-slate-500 mt-1">管理代理商账号、套餐、余额与授权</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          + 创建代理商
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-5">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-sm text-slate-500">总代理商数</div>
          <div className="text-2xl font-bold mt-1 text-slate-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-sm text-slate-500">启用中</div>
          <div className="text-2xl font-bold mt-1 text-green-600">{stats.active}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-sm text-slate-500">已禁用</div>
          <div className="text-2xl font-bold mt-1 text-red-500">{stats.inactive}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-sm text-slate-500">总客户数</div>
          <div className="text-2xl font-bold mt-1 text-purple-600">{stats.customers}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-sm text-slate-500">代理商总余额</div>
          <div className="text-2xl font-bold mt-1 text-amber-600">¥{stats.totalBalance.toFixed(2)}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder="搜索品牌/联系人/邮箱/域名"
            className="px-3 py-2 border rounded-lg text-sm flex-1 min-w-[200px]"
          />
          <button onClick={onSearch} className="px-4 py-2 bg-slate-100 rounded-lg text-sm hover:bg-slate-200">搜索</button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left">
                <th className="px-4 py-3 text-gray-500 font-medium">品牌名称</th>
                <th className="px-4 py-3 text-gray-500 font-medium">联系人</th>
                <th className="px-4 py-3 text-gray-500 font-medium">邮箱</th>
                <th className="px-4 py-3 text-gray-500 font-medium">套餐</th>
                <th className="px-4 py-3 text-gray-500 font-medium">余额</th>
                <th className="px-4 py-3 text-gray-500 font-medium">客户数</th>
                <th className="px-4 py-3 text-gray-500 font-medium">状态</th>
                <th className="px-4 py-3 text-gray-500 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
              ) : filtered.map((a) => {
                const planInfo = getPlanLabel(a.plan);
                const balance = Number(a.balance) || 0;
                const expiry = a.planExpiry ? new Date(a.planExpiry) : null;
                const expired = expiry ? expiry.getTime() < Date.now() : false;
                return (
                  <tr key={a.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        {a.logo ? (
                          <img src={a.logo} alt="" className="w-6 h-6 rounded object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded bg-slate-200 flex items-center justify-center text-xs text-slate-500">
                            {(a.brandName || '?').charAt(0)}
                          </div>
                        )}
                        {a.brandName || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div>{a.contactName || '-'}</div>
                      <div className="text-xs text-gray-400">{a.contactPhone || ''}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{a.user?.email || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${planInfo.color}`}>{planInfo.name}</span>
                      {a.planExpiry && (
                        <div className={`text-xs mt-1 ${expired ? 'text-red-500' : 'text-gray-400'}`}>
                          {expired ? '已过期' : `剩 ${Math.max(0, Math.ceil((expiry!.getTime() - Date.now()) / 86400000))} 天`}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${balance > 0 ? 'text-green-600' : 'text-gray-400'}`}>¥{balance.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{a._count?.customers || 0}</td>
                    <td className="px-4 py-3">
                      {a.isActive ? (
                        <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">启用</span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">已禁用</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2 text-xs">
                        <button onClick={() => setDetailAgent(a)} className="text-slate-600 hover:text-slate-900">详情</button>
                        <button onClick={() => setRechargeAgent(a)} className="text-amber-600 hover:text-amber-800">充值</button>
                        <button onClick={() => openEdit(a)} className="text-blue-600 hover:text-blue-800">编辑</button>
                        <button onClick={() => openAgreement(a)} className="text-purple-600 hover:text-purple-800">授权协议</button>
                        <button onClick={() => handleToggle(a)} className={a.isActive ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}>
                          {a.isActive ? '禁用' : '启用'}
                        </button>
                        <button onClick={() => handleDelete(a)} className="text-red-500 hover:text-red-700">删除</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-4 border-t">
          <span className="text-sm text-gray-500">共 {filtered.length} 条记录</span>
          <button onClick={fetchAgents} className="text-sm text-slate-500 hover:text-slate-700">🔄 刷新</button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{editing ? '编辑代理商' : '创建代理商'}</h3>
            <div className="space-y-4">
              {/* 代理类型选择（仅创建时） */}
              {!editing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">代理类型 *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, level: 'saas', planType: 'monthly' })}
                      className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                        form.level === 'saas'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-base font-bold">SaaS代理</div>
                      <div className="text-xs mt-1 text-gray-500">平台托管 · 分润30%</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, level: 'source', planType: 'annual' })}
                      className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                        form.level === 'source'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-base font-bold">源码部署代理</div>
                      <div className="text-xs mt-1 text-gray-500">独立部署 · 收入全归</div>
                    </button>
                  </div>
                </div>
              )}

              {/* SaaS套餐选择（仅创建时） */}
              {!editing && form.level === 'saas' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">套餐选择 *</label>
                  <select
                    value={form.planType}
                    onChange={(e) => setForm({ ...form, planType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="trial">试用版（免费，7天，10人上限）</option>
                    <option value="monthly">月费版（99元/月，500人上限）</option>
                    <option value="yearly">年费版（980元/年，500人上限）</option>
                    <option value="flagship">旗舰版（2980元/年，不限人数，35%分润）</option>
                  </select>
                </div>
              )}

              {/* 源码授权选择（仅创建时） */}
              {!editing && form.level === 'source' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">授权类型 *</label>
                  <select
                    value={form.planType}
                    onChange={(e) => setForm({ ...form, planType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="annual">年度授权（2980元/年，含更新）</option>
                    <option value="lifetime">永久买断（6800元，含1年更新）</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">品牌名称 / 公司名</label>
                <input value={form.brandName} onChange={(e) => setForm({ ...form, brandName: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="请输入品牌或公司名称" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">联系人姓名 *</label>
                  <input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="必填" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">联系电话 *</label>
                  <input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="必填" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  登录邮箱 {!editing && '*'}
                </label>
                <input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="代理商登录账号"
                  disabled={!!editing}
                />
                {editing && <p className="text-xs text-gray-400 mt-1">编辑模式下不可修改邮箱</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  绑定域名 {form.level === 'source' && !editing && '*'}
                </label>
                <input value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder={form.level === 'source' ? '源码部署必填，如 agent.example.com' : '如 agent.example.com'} />
                {form.level === 'source' && !editing && <p className="text-xs text-orange-500 mt-1">源码部署代理必须绑定自有域名</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">授权到期时间</label>
                <input type="date" value={form.licenseExpiry} onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">取消</button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                {editing ? '保存' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 代理商详情弹窗 */}
      {detailAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-bold text-gray-900 text-lg">{detailAgent.brandName || '代理商详情'}</h3>
              <button onClick={() => setDetailAgent(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <div className="px-6 py-4 space-y-5">
              {/* 基础信息 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-3">基础信息</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">联系人：</span><span className="text-gray-900">{detailAgent.contactName || '-'}</span></div>
                  <div><span className="text-gray-500">联系电话：</span><span className="text-gray-900">{detailAgent.contactPhone || '-'}</span></div>
                  <div><span className="text-gray-500">邮箱：</span><span className="text-gray-900">{detailAgent.user?.email || '-'}</span></div>
                  <div><span className="text-gray-500">会员等级：</span><span className="text-gray-900">{detailAgent.user?.memberLevel || '-'}</span></div>
                  <div><span className="text-gray-500">域名：</span><span className="text-gray-900">{detailAgent.domain || '-'}</span></div>
                  <div><span className="text-gray-500">状态：</span>
                    {detailAgent.isActive ? (
                      <span className="text-green-600 font-medium">启用</span>
                    ) : (
                      <span className="text-red-500 font-medium">已禁用</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 套餐信息 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-3">套餐信息</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">当前套餐：</span>
                    {(() => {
                      const p = getPlanLabel(detailAgent.plan);
                      return <span className={`text-xs px-2 py-0.5 rounded ${p.color}`}>{p.name}</span>;
                    })()}
                  </div>
                  <div><span className="text-gray-500">套餐到期：</span><span className="text-gray-900">{fmtDate(detailAgent.planExpiry)}</span></div>
                  <div><span className="text-gray-500">最大客户数：</span><span className="text-gray-900">{detailAgent.maxCustomers || '-'}</span></div>
                  <div><span className="text-gray-500">代理类型：</span><span className="text-gray-900">{detailAgent.level === 'source' ? '源码部署' : 'SaaS代理'}</span></div>
                </div>
              </div>

              {/* 余额信息 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-3">余额信息</h4>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-amber-600">当前余额</div>
                    <div className="text-2xl font-bold text-amber-700">¥{(Number(detailAgent.balance) || 0).toFixed(2)}</div>
                  </div>
                  <button
                    onClick={() => { setRechargeAgent(detailAgent); setDetailAgent(null); }}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700"
                  >
                    充值
                  </button>
                </div>
              </div>

              {/* 授权信息 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-500">授权信息</h4>
                  <button
                    onClick={() => handleRegenerateLicense(detailAgent)}
                    className="px-3 py-1 bg-purple-600 text-white rounded-lg text-xs hover:bg-purple-700"
                  >
                    🔄 重新生成授权码
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">授权码：</span>
                    <div className="mt-1 bg-gray-50 rounded p-2 border border-gray-200">
                      <code className="text-gray-900 font-mono text-xs break-all">{detailAgent.licenseKey || '-'}</code>
                    </div>
                    {detailAgent.licenseKey && (
                      <button
                        onClick={() => { navigator.clipboard.writeText(detailAgent.licenseKey || ''); alert('授权码已复制'); }}
                        className="mt-1 text-xs text-blue-600 hover:underline"
                      >
                        📋 复制
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">到期时间：</span>
                    <span className="text-gray-900">{fmtDate(detailAgent.licenseExpiry)}</span>
                  </div>
                </div>
              </div>

              {/* 配置信息 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-3">配置信息</h4>
                {(() => {
                  const cfg = parseSiteConfig(detailAgent.siteConfig);
                  if (!cfg) return <div className="text-gray-400 text-sm">无配置信息</div>;
                  return (
                    <pre className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 overflow-x-auto">{JSON.stringify(cfg, null, 2)}</pre>
                  );
                })()}
              </div>

              {/* 账号信息 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-3">账号信息</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">代理商ID：</span><span className="text-gray-900 font-mono text-xs">{detailAgent.id}</span></div>
                  <div><span className="text-gray-500">用户ID：</span><span className="text-gray-900 font-mono text-xs">{detailAgent.userId}</span></div>
                  <div><span className="text-gray-500">客户数：</span><span className="text-gray-900 font-medium">{detailAgent._count?.customers || 0}</span></div>
                  <div><span className="text-gray-500">创建时间：</span><span className="text-gray-900">{fmtDateTime(detailAgent.createdAt)}</span></div>
                  <div><span className="text-gray-500">最后更新：</span><span className="text-gray-900">{fmtDateTime(detailAgent.updatedAt)}</span></div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
              <button onClick={() => { openEdit(detailAgent); setDetailAgent(null); }} className="px-4 py-2 border rounded-lg text-sm hover:bg-white">编辑</button>
              <button onClick={() => handleToggle(detailAgent)} className={`px-4 py-2 rounded-lg text-sm text-white ${detailAgent.isActive ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'}`}>
                {detailAgent.isActive ? '禁用' : '启用'}
              </button>
              <button onClick={() => { handleDelete(detailAgent); setDetailAgent(null); }} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600">删除</button>
            </div>
          </div>
        </div>
      )}

      {/* 充值弹窗 */}
      {rechargeAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-bold text-gray-900 text-lg mb-1">代理商充值</h3>
            <p className="text-sm text-gray-500 mb-4">为「{rechargeAgent.brandName}」充值余额</p>
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                <div className="text-xs text-amber-600">当前余额</div>
                <div className="text-xl font-bold text-amber-700">¥{(Number(rechargeAgent.balance) || 0).toFixed(2)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">充值金额（元）</label>
                <input
                  type="number"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="如 100、200、500"
                />
                <div className="flex gap-2 mt-2">
                  {[100, 200, 500, 1000].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setRechargeAmount(String(amt))}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                    >
                      ¥{amt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">充值原因（可选）</label>
                <input
                  value={rechargeReason}
                  onChange={(e) => setRechargeReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="如：代理商预充值、测试充值等"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                充值后代理商可在套餐管理页面使用余额升级套餐。支持输入负数进行扣减。
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setRechargeAgent(null); setRechargeAmount(''); setRechargeReason(''); }} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">取消</button>
              <button
                onClick={handleRecharge}
                disabled={rechargeLoading}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 disabled:opacity-50"
              >
                {rechargeLoading ? '处理中...' : '确认充值'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreds && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <h3 className="font-bold text-gray-900 text-lg mb-4">代理商创建成功</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-800 font-medium mb-3">请将以下信息提供给代理商{showCreds.brandName ? `「${showCreds.brandName}」` : ''}：</p>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">登录邮箱：</span>
                  <span className="font-mono text-gray-900">{showCreds.email}</span>
                </div>
                <div>
                  <span className="text-gray-500">初始密码：</span>
                  <span className="font-mono text-gray-900">{showCreds.password}</span>
                </div>
                {showCreds.licenseKey && (
                  <div className="pt-2 border-t border-green-200">
                    <div className="text-gray-500 mb-1">授权码：</div>
                    <div className="bg-white rounded p-2 border border-gray-200">
                      <code className="font-mono text-xs text-gray-900 break-all">{showCreds.licenseKey}</code>
                    </div>
                    <button
                      onClick={() => { navigator.clipboard.writeText(showCreds.licenseKey || ''); alert('授权码已复制'); }}
                      className="mt-2 text-xs text-blue-600 hover:underline"
                    >
                      📋 复制授权码
                    </button>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-4">密码和授权码仅在此次显示，请妥善保存。</p>
            <button onClick={() => setShowCreds(null)} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              我已保存
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
