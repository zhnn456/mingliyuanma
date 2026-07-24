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

type Tab = 'overview' | 'users' | 'orders' | 'offering' | 'agents' | 'config';

export default function AdminPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [offeringData, setOfferingData] = useState<any>({ categories: [], items: [], records: [] });
  const [agents, setAgents] = useState<any[]>([]);
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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

  if (!session) {
    return (<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h1><Link href="/login" className="btn-primary px-6 py-2">去登录</Link></div></div>);
  }
  if (!isAdmin) {
    return (<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">无权限访问</h1><Link href="/" className="btn-primary px-6 py-2">返回首页</Link></div></div>);
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview', label: '数据概览', icon: '📊' },
    { key: 'users', label: '用户管理', icon: '👥' },
    { key: 'orders', label: '订单管理', icon: '📦' },
    { key: 'offering', label: '供奉管理', icon: '🙏' },
    { key: 'agents', label: '代理商', icon: '🏢' },
    { key: 'config', label: '系统设置', icon: '⚙️' },
  ];

  const memberLevelName: Record<string, string> = { free: '免费', monthly: '月卡', yearly: '年卡', lifetime: '终身' };
  const orderStatusName: Record<string, string> = { pending: '待支付', paid: '已支付', failed: '失败', refunded: '已退款' };
  const orderStatusColor: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-800', paid: 'bg-green-100 text-green-800', failed: 'bg-red-100 text-red-800', refunded: 'bg-gray-100 text-gray-800' };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900">管理后台</h1></div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === t.key ? 'bg-red-700 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {loading && <div className="text-center py-8 text-gray-500">加载中...</div>}

        {/* 数据概览 */}
        {!loading && activeTab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: '总用户', value: stats.totalUsers, color: 'text-blue-600' },
                { label: '今日新增', value: stats.todayUsers, color: 'text-green-600' },
                { label: '总订单', value: stats.totalOrders, color: 'text-purple-600' },
                { label: '今日订单', value: stats.todayOrders, color: 'text-orange-600' },
                { label: '总收入', value: `¥${stats.totalRevenue.toFixed(0)}`, color: 'chinese-red' },
                { label: '八字排盘', value: stats.totalBaziRecords, color: 'text-red-600' },
                { label: '紫微斗数', value: stats.totalZiweiRecords, color: 'text-indigo-600' },
                { label: '供奉次数', value: stats.totalOfferingRecords, color: 'text-yellow-600' },
              ].map(s => (
                <div key={s.label} className="card text-center">
                  <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="font-bold text-gray-800 mb-3">会员分布</h3>
                {stats.memberStats.map(m => (
                  <div key={m.level} className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-700">{memberLevelName[m.level] || m.level}</span>
                    <span className="font-bold">{m.count}</span>
                  </div>
                ))}
              </div>
              <div className="card">
                <h3 className="font-bold text-gray-800 mb-3">近7日订单</h3>
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

        {/* 用户管理 */}
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
                    <td className="px-3 py-2">{u.role}</td>
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

        {/* 订单管理 */}
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
                    <td className="px-3 py-2">{o.type === 'membership' ? '会员' : '供奉'}</td>
                    <td className="px-3 py-2 font-bold chinese-red">¥{o.amount}</td>
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

        {/* 供奉管理 */}
        {!loading && activeTab === 'offering' && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="card-title">供奉分类</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {(offeringData.categories || []).map((c: any) => (
                  <div key={c.id} className="p-3 bg-gray-50 rounded-lg text-center">
                    <div className="text-2xl mb-1">{c.icon || '🙏'}</div>
                    <div className="font-medium text-sm">{c.name}</div>
                    <div className="text-xs text-gray-400">排序: {c.sortOrder}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="card-title">供奉对象</h3>
              <div className="overflow-x-auto">
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
            <div className="card">
              <h3 className="card-title">最近供奉记录</h3>
              <div className="space-y-2">
                {(offeringData.records || []).slice(0, 10).map((r: any) => (
                  <div key={r.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                    <span className="text-gray-700">{r.user?.email || r.user?.name || '-'}</span>
                    <span className="font-medium">{r.item?.name || '-'}</span>
                    <span className="chinese-red font-bold">¥{r.amount}</span>
                    <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString('zh-CN')}</span>
                  </div>
                ))}
                {(!offeringData.records || offeringData.records.length === 0) && (
                  <div className="text-center py-4 text-gray-400">暂无供奉记录</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 代理商管理 */}
        {!loading && activeTab === 'agents' && (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-500">公司</th>
                  <th className="px-3 py-2 text-left text-gray-500">联系人</th>
                  <th className="px-3 py-2 text-left text-gray-500">域名</th>
                  <th className="px-3 py-2 text-left text-gray-500">授权Key</th>
                  <th className="px-3 py-2 text-left text-gray-500">到期</th>
                  <th className="px-3 py-2 text-left text-gray-500">状态</th>
                  <th className="px-3 py-2 text-left text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {agents.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无代理商</td></tr>
                ) : agents.map((a: any) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium">{a.brandName || a.companyName || '-'}</td>
                    <td className="px-3 py-2">{a.contactName} {a.contactPhone}</td>
                    <td className="px-3 py-2 text-xs">{a.domain || '-'}</td>
                    <td className="px-3 py-2 text-xs font-mono">{a.licenseKey}</td>
                    <td className="px-3 py-2 text-xs">{a.licenseExpiry ? new Date(a.licenseExpiry).toLocaleDateString('zh-CN') : '永久'}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${a.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {a.isActive ? '启用' : '禁用'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => toggleAgent(a.id, a.isActive)}
                        className="text-xs text-red-700 hover:text-red-900">{a.isActive ? '禁用' : '启用'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 系统设置 */}
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
    </div>
  );
}
