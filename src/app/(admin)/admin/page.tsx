'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  totalUsers: number; totalOrders: number; totalRevenue: number;
  todayOrders: number; todayUsers: number;
  totalBaziRecords: number; totalZiweiRecords: number;
  totalQimenRecords: number; totalMeihuaRecords: number;
  totalOfferingRecords: number;
  memberStats: { level: string; count: number }[];
  dailyOrders: { date: string; count: number }[];
}

type Tab = 'overview' | 'users' | 'orders' | 'offering' | 'agents' | 'rules' | 'revenue' | 'audit' | 'config';

export default function AdminPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [offeringData, setOfferingData] = useState<any>({ categories: [], items: [], records: [] });
  const [agents, setAgents] = useState<any[]>([]);
  const [configs, setConfigs] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [ruleStats, setRuleStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateAgent, setShowCreateAgent] = useState(false);
  const [createAgentForm, setCreateAgentForm] = useState({ email: '', password: '', companyName: '', contactName: '', contactPhone: '', domain: '', brandName: '', maxUsers: 1000 });
  const [createAgentResult, setCreateAgentResult] = useState<any>(null);
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [editResult, setEditResult] = useState<any>(null);
  const [regenAgent, setRegenAgent] = useState<any>(null);
  const [regenResult, setRegenResult] = useState<any>(null);
  const [viewingAgent, setViewingAgent] = useState<any>(null);
  const [agentDetail, setAgentDetail] = useState<any>(null);

  const isAdmin = (session as any)?.user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) loadTabData(activeTab);
  }, [activeTab, isAdmin]);

  const loadTabData = async (tab: Tab) => {
    setLoading(true);
    try {
      if (tab === 'overview') {
        const res = await fetch('/api/admin/stats');
        if (res.ok) { const d = await res.json(); setStats(d.stats); }
      } else if (tab === 'users') {
        const res = await fetch('/api/admin/users');
        if (res.ok) { const d = await res.json(); setUsers(d.users || []); }
      } else if (tab === 'orders') {
        const res = await fetch('/api/admin/orders');
        if (res.ok) { const d = await res.json(); setOrders(d.orders || []); }
      } else if (tab === 'offering') {
        const res = await fetch('/api/admin/offering');
        if (res.ok) { const d = await res.json(); setOfferingData(d); }
      } else if (tab === 'agents') {
        const res = await fetch('/api/admin/agents');
        if (res.ok) { const d = await res.json(); setAgents(d.agents || []); }
      } else if (tab === 'rules') {
        const res = await fetch('/api/admin/rules?stats=true');
        if (res.ok) { const d = await res.json(); setRuleStats(d); }
      } else if (tab === 'revenue') {
        const res = await fetch('/api/admin/revenue?range=30');
        if (res.ok) { const d = await res.json(); setRevenue(d); }
      } else if (tab === 'audit') {
        const res = await fetch('/api/admin/audit?limit=100');
        if (res.ok) { const d = await res.json(); setAuditLogs(d.logs || []); }
      } else if (tab === 'config') {
        const res = await fetch('/api/admin/config');
        if (res.ok) { const d = await res.json(); setConfigs(d.configs || []); }
      }
    } catch {} finally { setLoading(false); }
  };

  const updateUser = async (userId: string, field: string, value: string) => {
    await fetch('/api/admin/users', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, [field]: value }),
    });
    loadTabData('users');
  };

  const updateOrder = async (orderId: string, status: string) => {
    await fetch('/api/admin/orders', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status }),
    });
    loadTabData('orders');
  };

  const updateConfig = async (key: string, value: string, category: string) => {
    await fetch('/api/admin/config', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value, category }),
    });
    loadTabData('config');
  };

  const toggleAgent = async (agentId: string, isActive: boolean) => {
    await fetch('/api/admin/agents', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle', agentId, isActive: !isActive }),
    });
    loadTabData('agents');
  };

  const createAgent = async () => {
    setCreateAgentResult(null);
    const res = await fetch('/api/admin/agents', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ...createAgentForm }),
    });
    const d = await res.json();
    if (res.ok) {
      setCreateAgentResult(d);
      loadTabData('agents');
      setCreateAgentForm({ email: '', password: '', companyName: '', contactName: '', contactPhone: '', domain: '', brandName: '', maxUsers: 1000 });
    } else {
      setCreateAgentResult({ error: d.error || '创建失败' });
    }
  };

  const openEditAgent = (agent: any) => {
    let siteConfigData: any = { maxUsers: 1000, customPricing: false, whiteLabel: false, revenueShare: 0 };
    try { siteConfigData = { ...siteConfigData, ...JSON.parse(agent.siteConfig || '{}') }; } catch {}
    setEditingAgent(agent);
    setEditForm({
      companyName: agent.companyName || '',
      brandName: agent.brandName || '',
      contactName: agent.contactName || '',
      contactPhone: agent.contactPhone || '',
      domain: agent.domain || '',
      licenseExpiry: agent.licenseExpiry ? agent.licenseExpiry.slice(0, 10) : '',
      maxUsers: siteConfigData.maxUsers || 1000,
      revenueShare: siteConfigData.revenueShare ?? 0,
      customPricing: siteConfigData.customPricing ?? false,
      whiteLabel: siteConfigData.whiteLabel ?? false,
    });
    setEditResult(null);
  };

  const saveEditAgent = async () => {
    const siteConfig = {
      maxUsers: parseInt(editForm.maxUsers) || 1000,
      revenueShare: parseFloat(editForm.revenueShare) || 0,
      customPricing: editForm.customPricing,
      whiteLabel: editForm.whiteLabel,
    };
    const res = await fetch('/api/admin/agents', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId: editingAgent.id,
        companyName: editForm.companyName,
        brandName: editForm.brandName,
        contactName: editForm.contactName,
        contactPhone: editForm.contactPhone,
        domain: editForm.domain,
        licenseExpiry: editForm.licenseExpiry || null,
        siteConfig,
      }),
    });
    const d = await res.json();
    if (res.ok) {
      setEditResult({ success: true });
      loadTabData('agents');
      setTimeout(() => { setEditingAgent(null); setEditResult(null); }, 1500);
    } else {
      setEditResult({ error: d.error || '更新失败' });
    }
  };

  const regenerateLicense = async () => {
    const res = await fetch('/api/admin/agents', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'regenerate_license', agentId: regenAgent.id }),
    });
    const d = await res.json();
    if (res.ok) {
      setRegenResult({ licenseKey: d.licenseKey });
      loadTabData('agents');
    } else {
      setRegenResult({ error: d.error || '重新生成失败' });
    }
  };

  const viewAgentDetail = async (agent: any) => {
    setViewingAgent(agent);
    setAgentDetail(null);
    try {
      const [statsRes, customersRes] = await Promise.all([
        fetch('/api/admin/agents').then(r => r.json()),
        fetch('/api/agent/stats?agentId=' + agent.id).then(r => r.json().catch(() => null)),
      ]);
      let siteConfigData: any = {};
      try { siteConfigData = JSON.parse(agent.siteConfig || '{}'); } catch {}
      setAgentDetail({ siteConfig: siteConfigData });
    } catch {
      setAgentDetail({});
    }
  };

  if (!session) {
    return (<div className="min-h-screen bg-parchment-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h1><Link href="/login" className="btn-primary px-6 py-2">去登录</Link></div></div>);
  }
  if (!isAdmin) {
    return (<div className="min-h-screen bg-parchment-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">无权限访问</h1><Link href="/" className="btn-primary px-6 py-2">返回首页</Link></div></div>);
  }

  const navItems: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview', label: '数据概览', icon: '📊' },
    { key: 'users', label: '用户管理', icon: '👥' },
    { key: 'orders', label: '订单管理', icon: '📦' },
    { key: 'revenue', label: '收入分析', icon: '💰' },
    { key: 'agents', label: '代理商管理', icon: '🏢' },
    { key: 'rules', label: '排盘规则库', icon: '📖' },
    { key: 'offering', label: '供奉管理', icon: '🙏' },
    { key: 'audit', label: '审计日志', icon: '📋' },
    { key: 'config', label: '系统设置', icon: '⚙️' },
  ];

  const memberLevelName: Record<string, string> = { free: '免费', monthly: '月卡', yearly: '年卡', lifetime: '终身' };
  const orderStatusName: Record<string, string> = { pending: '待支付', paid: '已支付', failed: '失败', refunded: '已退款' };
  const orderStatusColor: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-800', paid: 'bg-green-100 text-green-800', failed: 'bg-red-100 text-red-800', refunded: 'bg-gray-100 text-gray-800' };
  const auditActionName: Record<string, string> = {
    user_register: '用户注册', user_login: '用户登录', admin_create_agent: '创建代理商',
    admin_toggle_agent: '切换代理商状态', payment_create: '创建订单', payment_callback: '支付回调',
    report_generate: '生成报告', rule_migrate: '规则迁移', rule_create: '创建规则', rule_update: '更新规则',
  };

  return (
    <div className="min-h-screen bg-parchment-50 flex">
      {/* 侧边栏 */}
      <aside className="w-60 bg-gradient-to-b from-gray-900 to-gray-950 text-gray-300 fixed h-full overflow-y-auto z-20 hidden md:block">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm font-kai">命</span>
            </div>
            <div>
              <div className="text-white font-bold text-sm font-kai">命理网后台</div>
              <div className="text-[10px] text-gold tracking-widest">ADMIN PANEL</div>
            </div>
          </div>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map(item => (
            <button key={item.key} onClick={() => setActiveTab(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === item.key
                  ? 'bg-red-800 text-white shadow-lg shadow-red-900/30'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}>
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 mt-auto border-t border-gray-800">
          <Link href="/" className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-white transition-colors">
            ← 返回前台
          </Link>
        </div>
      </aside>

      {/* 移动端Tab栏 */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-gray-900 z-30 overflow-x-auto">
        <div className="flex gap-1 p-2 min-w-max">
          {navItems.map(item => (
            <button key={item.key} onClick={() => setActiveTab(item.key)}
              className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap ${activeTab === item.key ? 'bg-red-700 text-white' : 'text-gray-400'}`}>
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 主内容区 */}
      <main className="flex-1 md:ml-60 p-4 md:p-6 pt-16 md:pt-6 max-w-full overflow-x-hidden">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900 mb-5">
            {navItems.find(n => n.key === activeTab)?.label}
          </h1>

          {loading && <div className="text-center py-12 text-gray-400">加载中...</div>}

          {/* ===== 数据概览 ===== */}
          {!loading && activeTab === 'overview' && stats && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: '总用户数', value: stats.totalUsers, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: '今日新增', value: stats.todayUsers, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: '总订单数', value: stats.totalOrders, color: 'text-purple-600', bg: 'bg-purple-50' },
                  { label: '今日订单', value: stats.todayOrders, color: 'text-orange-600', bg: 'bg-orange-50' },
                  { label: '总收入(¥)', value: stats.totalRevenue.toFixed(0), color: 'text-red-600', bg: 'bg-red-50' },
                  { label: '八字排盘', value: stats.totalBaziRecords, color: 'text-red-600', bg: 'bg-red-50' },
                  { label: '紫微排盘', value: stats.totalZiweiRecords, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: '供奉次数', value: stats.totalOfferingRecords, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-gray-100`}>
                    <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                    <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="card">
                  <h3 className="font-bold text-gray-800 mb-3">会员分布</h3>
                  {stats.memberStats.map(m => {
                    const max = Math.max(...stats.memberStats.map(x => x.count), 1);
                    return (
                      <div key={m.level} className="mb-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">{memberLevelName[m.level] || m.level}</span>
                          <span className="font-bold">{m.count}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-red-600 rounded-full transition-all" style={{ width: `${(m.count / max) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="card">
                  <h3 className="font-bold text-gray-800 mb-3">近7日订单趋势</h3>
                  <div className="flex items-end gap-2 h-32">
                    {stats.dailyOrders.map((d, i) => {
                      const max = Math.max(...stats.dailyOrders.map(x => x.count), 1);
                      const h = (d.count / max) * 100;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center">
                          <div className="text-xs text-gray-500 mb-1">{d.count}</div>
                          <div className="w-full bg-red-600 rounded-t transition-all" style={{ height: `${Math.max(h, 4)}%` }} />
                          <div className="text-[10px] text-gray-400 mt-1">{d.date.slice(5)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== 用户管理 ===== */}
          {!loading && activeTab === 'users' && (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-500">邮箱</th>
                    <th className="px-3 py-2 text-left text-gray-500">会员</th>
                    <th className="px-3 py-2 text-left text-gray-500">角色</th>
                    <th className="px-3 py-2 text-left text-gray-500">使用量</th>
                    <th className="px-3 py-2 text-left text-gray-500">注册时间</th>
                    <th className="px-3 py-2 text-left text-gray-500">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无用户</td></tr>
                  ) : users.map((u: any) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">{u.email || u.name || '-'}</td>
                      <td className="px-3 py-2"><span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">{memberLevelName[u.memberLevel] || u.memberLevel}</span></td>
                      <td className="px-3 py-2">{u.role === 'admin' ? '管理员' : u.role === 'agent' ? '代理商' : '用户'}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">八字{u._count?.baziRecords || 0} 紫微{u._count?.ziweiRecords || 0}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">{new Date(u.createdAt).toLocaleDateString('zh-CN')}</td>
                      <td className="px-3 py-2">
                        <select value={u.memberLevel} onChange={(e) => updateUser(u.id, 'memberLevel', e.target.value)}
                          className="text-xs border rounded px-1 py-0.5">
                          <option value="free">免费</option><option value="monthly">月卡</option>
                          <option value="yearly">年卡</option><option value="lifetime">终身</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ===== 订单管理 ===== */}
          {!loading && activeTab === 'orders' && (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-500">订单号</th>
                    <th className="px-3 py-2 text-left text-gray-500">用户</th>
                    <th className="px-3 py-2 text-left text-gray-500">类型</th>
                    <th className="px-3 py-2 text-left text-gray-500">金额</th>
                    <th className="px-3 py-2 text-left text-gray-500">状态</th>
                    <th className="px-3 py-2 text-left text-gray-500">时间</th>
                    <th className="px-3 py-2 text-left text-gray-500">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无订单</td></tr>
                  ) : orders.map((o: any) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-xs font-mono">{o.orderNo}</td>
                      <td className="px-3 py-2">{o.user?.email || '-'}</td>
                      <td className="px-3 py-2">{o.type === 'membership' ? '会员' : o.type === 'offering' ? '供奉' : o.type === 'pdf_report' ? 'PDF报告' : o.type}</td>
                      <td className="px-3 py-2 font-bold text-red-600">¥{o.amount}</td>
                      <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded text-xs ${orderStatusColor[o.status] || ''}`}>{orderStatusName[o.status] || o.status}</span></td>
                      <td className="px-3 py-2 text-xs">{new Date(o.createdAt).toLocaleString('zh-CN')}</td>
                      <td className="px-3 py-2">
                        <select value={o.status} onChange={(e) => updateOrder(o.id, e.target.value)}
                          className="text-xs border rounded px-1 py-0.5">
                          <option value="pending">待支付</option><option value="paid">已支付</option>
                          <option value="refunded">已退款</option><option value="failed">失败</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ===== 收入分析 ===== */}
          {!loading && activeTab === 'revenue' && revenue && (
            <div className="space-y-5">
              {/* 汇总卡片 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-gradient-to-br from-red-50 to-white rounded-xl p-4 border border-red-100">
                  <div className="text-xs text-gray-500 mb-1">总收入</div>
                  <div className="text-2xl font-bold text-red-600">¥{revenue.summary.totalRevenue.toFixed(0)}</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-4 border border-green-100">
                  <div className="text-xs text-gray-500 mb-1">净收入</div>
                  <div className="text-2xl font-bold text-green-600">¥{revenue.summary.netRevenue.toFixed(0)}</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-4 border border-blue-100">
                  <div className="text-xs text-gray-500 mb-1">已支付订单</div>
                  <div className="text-2xl font-bold text-blue-600">{revenue.summary.totalOrders}</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-4 border border-purple-100">
                  <div className="text-xs text-gray-500 mb-1">客单价</div>
                  <div className="text-2xl font-bold text-purple-600">¥{revenue.summary.avgOrderValue.toFixed(1)}</div>
                </div>
              </div>

              {/* 日收入趋势 */}
              <div className="card">
                <h3 className="font-bold text-gray-800 mb-3">近30日收入趋势</h3>
                <div className="flex items-end gap-1 h-40">
                  {revenue.dailyRevenue.map((d: any, i: number) => {
                    const max = Math.max(...revenue.dailyRevenue.map((x: any) => x.amount), 1);
                    const h = (d.amount / max) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center group relative">
                        <div className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5 whitespace-nowrap">¥{d.amount}</div>
                        <div className="w-full bg-red-500 rounded-t hover:bg-red-700 transition-colors" style={{ height: `${Math.max(h, 2)}%` }} />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>{revenue.dailyRevenue[0]?.date?.slice(5)}</span>
                  <span>{revenue.dailyRevenue[revenue.dailyRevenue.length - 1]?.date?.slice(5)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 按类型分类 */}
                <div className="card">
                  <h3 className="font-bold text-gray-800 mb-3">收入分类（按类型）</h3>
                  {revenue.revenueByType.length === 0 ? (
                    <div className="text-center py-4 text-gray-400 text-sm">暂无数据</div>
                  ) : revenue.revenueByType.map((r: any) => (
                    <div key={r.type} className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-gray-700 text-sm">{r.typeName}</span>
                      <div className="text-right">
                        <div className="font-bold text-red-600">¥{r.amount.toFixed(0)}</div>
                        <div className="text-xs text-gray-400">{r.count} 单</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 按会员等级 */}
                <div className="card">
                  <h3 className="font-bold text-gray-800 mb-3">会员收入分布</h3>
                  {revenue.membershipRevenue.length === 0 ? (
                    <div className="text-center py-4 text-gray-400 text-sm">暂无数据</div>
                  ) : revenue.membershipRevenue.map((r: any) => (
                    <div key={r.level} className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-gray-700 text-sm">{r.levelName}</span>
                      <div className="text-right">
                        <div className="font-bold text-red-600">¥{r.amount.toFixed(0)}</div>
                        <div className="text-xs text-gray-400">{r.count} 单</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 退款统计 */}
              {revenue.summary.refundCount > 0 && (
                <div className="card border-red-200 bg-red-50">
                  <h3 className="font-bold text-red-800 mb-2">退款统计</h3>
                  <div className="flex gap-6">
                    <div><span className="text-gray-500 text-sm">退款金额：</span><span className="font-bold text-red-600">¥{revenue.summary.refundTotal.toFixed(0)}</span></div>
                    <div><span className="text-gray-500 text-sm">退款笔数：</span><span className="font-bold">{revenue.summary.refundCount}</span></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== 代理商管理 ===== */}
          {!loading && activeTab === 'agents' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">管理二级代理商，创建代理商账号并分配授权</p>
                <button onClick={() => { setShowCreateAgent(!showCreateAgent); setCreateAgentResult(null); }}
                  className="px-4 py-2 bg-red-700 text-white rounded-lg text-sm font-medium hover:bg-red-800 transition-colors">
                  + 创建代理商
                </button>
              </div>

              {/* 创建代理商表单 */}
              {showCreateAgent && (
                <div className="card border-red-200">
                  <h3 className="font-bold text-gray-800 mb-4">创建新代理商</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">登录邮箱 *</label>
                      <input type="email" value={createAgentForm.email} onChange={e => setCreateAgentForm({...createAgentForm, email: e.target.value})}
                        className="w-full px-3 py-2 border rounded text-sm" placeholder="agent@example.com" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">初始密码</label>
                      <input type="text" value={createAgentForm.password} onChange={e => setCreateAgentForm({...createAgentForm, password: e.target.value})}
                        className="w-full px-3 py-2 border rounded text-sm" placeholder="留空默认 agent123456" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">公司名称</label>
                      <input type="text" value={createAgentForm.companyName} onChange={e => setCreateAgentForm({...createAgentForm, companyName: e.target.value})}
                        className="w-full px-3 py-2 border rounded text-sm" placeholder="XX命理咨询" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">品牌名称</label>
                      <input type="text" value={createAgentForm.brandName} onChange={e => setCreateAgentForm({...createAgentForm, brandName: e.target.value})}
                        className="w-full px-3 py-2 border rounded text-sm" placeholder="显示在前台的品牌名" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">联系人 *</label>
                      <input type="text" value={createAgentForm.contactName} onChange={e => setCreateAgentForm({...createAgentForm, contactName: e.target.value})}
                        className="w-full px-3 py-2 border rounded text-sm" placeholder="张三" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">联系电话 *</label>
                      <input type="text" value={createAgentForm.contactPhone} onChange={e => setCreateAgentForm({...createAgentForm, contactPhone: e.target.value})}
                        className="w-full px-3 py-2 border rounded text-sm" placeholder="13800138000" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">独立域名</label>
                      <input type="text" value={createAgentForm.domain} onChange={e => setCreateAgentForm({...createAgentForm, domain: e.target.value})}
                        className="w-full px-3 py-2 border rounded text-sm" placeholder="agent.example.com" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">最大客户数</label>
                      <input type="number" value={createAgentForm.maxUsers} onChange={e => setCreateAgentForm({...createAgentForm, maxUsers: parseInt(e.target.value) || 1000})}
                        className="w-full px-3 py-2 border rounded text-sm" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={createAgent} className="px-5 py-2 bg-red-700 text-white rounded-lg text-sm font-medium hover:bg-red-800">确认创建</button>
                    <button onClick={() => setShowCreateAgent(false)} className="px-5 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">取消</button>
                  </div>
                  {createAgentResult && (
                    <div className={`mt-4 p-3 rounded-lg text-sm ${createAgentResult.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                      {createAgentResult.error ? createAgentResult.error : (
                        <div>
                          ✅ 代理商创建成功！<br />
                          登录邮箱：<strong>{createAgentResult.credentials?.email}</strong><br />
                          初始密码：<strong>{createAgentResult.credentials?.password}</strong><br />
                          授权密钥：<strong className="font-mono text-xs">{createAgentResult.agent?.licenseKey}</strong>
                          <div className="mt-1 text-xs text-gray-500">请将以上信息安全发送给代理商</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 代理商列表 */}
              <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-500">品牌/公司</th>
                      <th className="px-3 py-2 text-left text-gray-500">联系人</th>
                      <th className="px-3 py-2 text-left text-gray-500">登录邮箱</th>
                      <th className="px-3 py-2 text-left text-gray-500">客户数</th>
                      <th className="px-3 py-2 text-left text-gray-500">授权密钥</th>
                      <th className="px-3 py-2 text-left text-gray-500">状态</th>
                      <th className="px-3 py-2 text-left text-gray-500">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {agents.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无代理商，点击"创建代理商"添加</td></tr>
                    ) : agents.map((a: any) => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <div className="font-medium">{a.brandName || a.companyName || '-'}</div>
                          {a.companyName && a.brandName && <div className="text-xs text-gray-400">{a.companyName}</div>}
                        </td>
                        <td className="px-3 py-2">{a.contactName}<br/><span className="text-xs text-gray-400">{a.contactPhone}</span></td>
                        <td className="px-3 py-2 text-xs">{a.user?.email || '-'}</td>
                        <td className="px-3 py-2">{a._count?.customers || 0}</td>
                        <td className="px-3 py-2 text-xs font-mono text-gray-500">{a.licenseKey?.slice(0, 20)}...</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${a.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {a.isActive ? '启用' : '禁用'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2 text-xs">
                            <button onClick={() => viewAgentDetail(a)} className="text-blue-600 hover:text-blue-800">详情</button>
                            <span className="text-gray-300">|</span>
                            <button onClick={() => openEditAgent(a)} className="text-green-600 hover:text-green-800">编辑</button>
                            <span className="text-gray-300">|</span>
                            <button onClick={() => { setRegenAgent(a); setRegenResult(null); }} className="text-amber-600 hover:text-amber-800">重置密钥</button>
                            <span className="text-gray-300">|</span>
                            <button onClick={() => toggleAgent(a.id, a.isActive)} className={a.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}>{a.isActive ? '禁用' : '启用'}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===== 排盘规则库 ===== */}
          {!loading && activeTab === 'rules' && ruleStats && (
            <div className="space-y-5">
              <div className="card bg-gradient-to-br from-amber-50 via-white to-orange-50 border-amber-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">排盘规则库管理系统</h3>
                    <p className="text-sm text-gray-500">所有命理解读规则存储在数据库中，可通过后台动态管理。后期添加古籍资料无需修改代码。</p>
                  </div>
                  <Link href="/admin/rules" className="px-5 py-2.5 bg-red-700 text-white rounded-lg text-sm font-medium hover:bg-red-800 transition-colors whitespace-nowrap">
                    进入规则管理 →
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { cat: 'bazi', label: '八字规则', color: 'text-red-600', bg: 'bg-red-50' },
                  { cat: 'ziwei', label: '紫微规则', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { cat: 'qimen', label: '奇门规则', color: 'text-purple-600', bg: 'bg-purple-50' },
                  { cat: 'meihua', label: '梅花规则', color: 'text-green-600', bg: 'bg-green-50' },
                ].map(item => (
                  <div key={item.cat} className={`${item.bg} rounded-xl p-4 border border-gray-100`}>
                    <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                    <div className={`text-2xl font-bold ${item.color}`}>{ruleStats.stats?.[item.cat] || 0}</div>
                    <div className="text-xs text-gray-400 mt-1">条规则</div>
                  </div>
                ))}
              </div>

              <div className="card">
                <h3 className="font-bold text-gray-800 mb-3">规则类型一览</h3>
                <div className="flex flex-wrap gap-2">
                  {ruleStats.ruleTypes?.map((type: string) => (
                    <span key={type} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">{type}</span>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="font-bold text-gray-800 mb-2">使用说明</h3>
                <ul className="text-sm text-gray-600 space-y-1.5">
                  <li>• 点击"进入规则管理"可查看、新增、编辑、删除所有规则</li>
                  <li>• 每条规则可填写<strong>古籍出处</strong>（如《滴天髓》）和<strong>古籍原文</strong></li>
                  <li>• 支持<strong>关键词搜索</strong>（跨规则名、古籍出处、内容）</li>
                  <li>• 支持<strong>多租户</strong>：代理商可添加自定义规则覆盖默认规则</li>
                  <li>• 规则引擎带<strong>5分钟内存缓存</strong>，修改后自动更新</li>
                </ul>
              </div>
            </div>
          )}

          {/* ===== 供奉管理 ===== */}
          {!loading && activeTab === 'offering' && (
            <div className="space-y-4">
              <div className="card">
                <h3 className="card-title">供奉分类</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {(offeringData.categories || []).map((c: any) => (
                    <div key={c.id} className="p-3 bg-gray-50 rounded-lg text-center">
                      <div className="text-2xl mb-1">{c.icon || '🙏'}</div>
                      <div className="font-medium text-sm">{c.name}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card overflow-x-auto">
                <h3 className="card-title">供奉对象</h3>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-500">名称</th>
                      <th className="px-3 py-2 text-left text-gray-500">分类</th>
                      <th className="px-3 py-2 text-left text-gray-500">单次</th>
                      <th className="px-3 py-2 text-left text-gray-500">包月</th>
                      <th className="px-3 py-2 text-left text-gray-500">包年</th>
                      <th className="px-3 py-2 text-left text-gray-500">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(offeringData.items || []).map((item: any) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium">{item.name}</td>
                        <td className="px-3 py-2 text-xs">{item.category?.name}</td>
                        <td className="px-3 py-2">¥{item.priceSingle || '-'}</td>
                        <td className="px-3 py-2">¥{item.priceMonth || '-'}</td>
                        <td className="px-3 py-2">¥{item.priceYear || '-'}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {item.isActive ? '启用' : '禁用'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===== 审计日志 ===== */}
          {!loading && activeTab === 'audit' && (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-500">时间</th>
                    <th className="px-3 py-2 text-left text-gray-500">操作</th>
                    <th className="px-3 py-2 text-left text-gray-500">状态</th>
                    <th className="px-3 py-2 text-left text-gray-500">详情</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {auditLogs.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">暂无日志</td></tr>
                  ) : auditLogs.map((log: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-xs text-gray-500">{log.timestamp || '-'}</td>
                      <td className="px-3 py-2">{auditActionName[log.action] || log.action}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {log.status === 'success' ? '成功' : '失败'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-500 max-w-xs truncate">
                        {typeof log.details === 'string' ? log.details : JSON.stringify(log.details || {})}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ===== 系统设置 ===== */}
          {!loading && activeTab === 'config' && (
            <div className="card">
              <h3 className="card-title">系统配置</h3>
              <div className="space-y-4">
                {[
                  { key: 'site_name', label: '站点名称', category: 'general', defaultVal: '命理网' },
                  { key: 'site_description', label: '站点描述', category: 'general', defaultVal: '专业命理排盘网站' },
                  { key: 'free_daily_limit', label: '免费每日次数', category: 'price', defaultVal: '3' },
                  { key: 'monthly_price', label: '月卡价格', category: 'price', defaultVal: '29.9' },
                  { key: 'yearly_price', label: '年卡价格', category: 'price', defaultVal: '199' },
                  { key: 'lifetime_price', label: '终身价格', category: 'price', defaultVal: '399' },
                  { key: 'enable_bazi', label: '启用八字', category: 'feature', defaultVal: 'true' },
                  { key: 'enable_ziwei', label: '启用紫微', category: 'feature', defaultVal: 'true' },
                  { key: 'enable_qimen', label: '启用奇门', category: 'feature', defaultVal: 'true' },
                  { key: 'enable_meihua', label: '启用梅花', category: 'feature', defaultVal: 'true' },
                ].map(item => {
                  const cfg = configs.find((c: any) => c.key === item.key);
                  return (
                    <div key={item.key} className="flex items-center gap-4">
                      <label className="w-28 text-sm text-gray-600 shrink-0">{item.label}</label>
                      <input type="text" defaultValue={cfg?.value || item.defaultVal}
                        onBlur={(e) => updateConfig(item.key, e.target.value, item.category)}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500" />
                      <span className="text-xs text-gray-400 w-16">{item.category}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ===== 编辑代理商弹窗 ===== */}
        {editingAgent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditingAgent(null)}>
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-gray-900 mb-4">编辑代理商 · {editingAgent.brandName || editingAgent.companyName}</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">品牌名称</label>
                  <input type="text" value={editForm.brandName || ''} onChange={e => setEditForm({...editForm, brandName: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">公司名称</label>
                  <input type="text" value={editForm.companyName || ''} onChange={e => setEditForm({...editForm, companyName: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">联系人</label>
                  <input type="text" value={editForm.contactName || ''} onChange={e => setEditForm({...editForm, contactName: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">联系电话</label>
                  <input type="text" value={editForm.contactPhone || ''} onChange={e => setEditForm({...editForm, contactPhone: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">独立域名</label>
                  <input type="text" value={editForm.domain || ''} onChange={e => setEditForm({...editForm, domain: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">授权到期时间</label>
                  <input type="date" value={editForm.licenseExpiry || ''} onChange={e => setEditForm({...editForm, licenseExpiry: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">最大客户数</label>
                  <input type="number" value={editForm.maxUsers || 0} onChange={e => setEditForm({...editForm, maxUsers: parseInt(e.target.value) || 1000})}
                    className="w-full px-3 py-2 border rounded text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">平台抽成比例 (%)</label>
                  <input type="number" step="0.1" value={editForm.revenueShare ?? 0} onChange={e => setEditForm({...editForm, revenueShare: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border rounded text-sm" placeholder="0-100，0表示不抽成" />
                </div>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <label className="flex items-center cursor-pointer">
                  <input type="checkbox" checked={editForm.customPricing ?? false} onChange={e => setEditForm({...editForm, customPricing: e.target.checked})}
                    className="w-4 h-4 text-red-600 rounded" />
                  <span className="ml-2 text-sm text-gray-700">允许自定义定价</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input type="checkbox" checked={editForm.whiteLabel ?? false} onChange={e => setEditForm({...editForm, whiteLabel: e.target.checked})}
                    className="w-4 h-4 text-red-600 rounded" />
                  <span className="ml-2 text-sm text-gray-700">白标模式</span>
                </label>
              </div>
              {editResult?.error && <div className="mb-3 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{editResult.error}</div>}
              {editResult?.success && <div className="mb-3 p-3 bg-green-50 text-green-600 rounded-lg text-sm">✅ 保存成功</div>}
              <div className="flex gap-3">
                <button onClick={saveEditAgent} className="px-5 py-2 bg-red-700 text-white rounded-lg text-sm font-medium hover:bg-red-800">保存修改</button>
                <button onClick={() => setEditingAgent(null)} className="px-5 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">取消</button>
              </div>
            </div>
          </div>
        )}

        {/* ===== 重新生成密钥确认弹窗 ===== */}
        {regenAgent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setRegenAgent(null)}>
            <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
              {regenResult?.licenseKey ? (
                <div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 text-center">密钥重新生成成功</h3>
                  <p className="text-sm text-gray-500 mb-2 text-center">请将新密钥安全发送给代理商</p>
                  <div className="p-3 bg-gray-50 rounded-lg font-mono text-xs text-gray-700 break-all mb-4">{regenResult.licenseKey}</div>
                  <button onClick={() => setRegenAgent(null)} className="w-full btn-primary py-2">完成</button>
                </div>
              ) : regenResult?.error ? (
                <div>
                  <h3 className="font-bold text-red-700 mb-2 text-center">操作失败</h3>
                  <p className="text-sm text-red-500 mb-4 text-center">{regenResult.error}</p>
                  <button onClick={() => setRegenAgent(null)} className="w-full btn-primary py-2">关闭</button>
                </div>
              ) : (
                <div>
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 text-center">确认重新生成授权密钥？</h3>
                  <p className="text-sm text-gray-500 mb-1 text-center">代理商：<strong>{regenAgent.brandName || regenAgent.companyName}</strong></p>
                  <p className="text-sm text-red-500 mb-4 text-center">⚠️ 旧密钥将立即失效，代理商需要使用新密钥重新部署</p>
                  <div className="flex gap-3">
                    <button onClick={() => setRegenAgent(null)} className="flex-1 px-5 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">取消</button>
                    <button onClick={regenerateLicense} className="flex-1 px-5 py-2 bg-red-700 text-white rounded-lg text-sm font-medium hover:bg-red-800">确认重置</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== 代理商详情弹窗 ===== */}
        {viewingAgent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setViewingAgent(null)}>
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">代理商详情</h3>
                <button onClick={() => setViewingAgent(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">品牌名称</span>
                  <span className="text-sm font-medium">{viewingAgent.brandName || '-'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">公司名称</span>
                  <span className="text-sm font-medium">{viewingAgent.companyName || '-'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">登录邮箱</span>
                  <span className="text-sm font-medium">{viewingAgent.user?.email || '-'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">联系人</span>
                  <span className="text-sm font-medium">{viewingAgent.contactName || '-'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">联系电话</span>
                  <span className="text-sm font-medium">{viewingAgent.contactPhone || '-'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">独立域名</span>
                  <span className="text-sm font-medium">{viewingAgent.domain || '未设置'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">客户数</span>
                  <span className="text-sm font-bold text-blue-600">{viewingAgent._count?.customers || 0}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">授权密钥</span>
                  <span className="text-xs font-mono text-gray-600 break-all max-w-[280px]">{viewingAgent.licenseKey}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">授权到期</span>
                  <span className="text-sm font-medium">{viewingAgent.licenseExpiry ? new Date(viewingAgent.licenseExpiry).toLocaleDateString('zh-CN') : '永久'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">状态</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${viewingAgent.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {viewingAgent.isActive ? '启用' : '禁用'}
                  </span>
                </div>
                {agentDetail?.siteConfig && (
                  <>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">最大客户数</span>
                      <span className="text-sm font-medium">{agentDetail.siteConfig.maxUsers || 1000}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">平台抽成比例</span>
                      <span className="text-sm font-medium">{agentDetail.siteConfig.revenueShare ?? 0}%</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">自定义定价</span>
                      <span className={`text-xs ${agentDetail.siteConfig.customPricing ? 'text-green-600' : 'text-gray-400'}`}>{agentDetail.siteConfig.customPricing ? '已开启' : '未开启'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">白标模式</span>
                      <span className={`text-xs ${agentDetail.siteConfig.whiteLabel ? 'text-green-600' : 'text-gray-400'}`}>{agentDetail.siteConfig.whiteLabel ? '已开启' : '未开启'}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">创建时间</span>
                  <span className="text-sm text-gray-600">{new Date(viewingAgent.createdAt).toLocaleString('zh-CN')}</span>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => { setViewingAgent(null); openEditAgent(viewingAgent); }} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">编辑</button>
                <button onClick={() => setViewingAgent(null)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">关闭</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
