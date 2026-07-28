'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type Tab = 'overview' | 'customers' | 'settings';

interface AgentStats {
  agent: any;
  license: any;
  stats: {
    customerCount: number;
    totalOrders: number;
    todayOrders: number;
    totalRevenue: number;
    records: { bazi: number; ziwei: number; qimen: number; meihua: number; total: number };
    todayRecords: { bazi: number; ziwei: number; qimen: number; meihua: number; total: number };
  };
}

export default function AgentDashboardPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerTotal, setCustomerTotal] = useState(0);
  const [agentSettings, setAgentSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const isAgent = ['admin', 'agent'].includes((session as any)?.user?.role || '');

  useEffect(() => {
    if (isAgent) loadOverview();
  }, [isAgent]);

  useEffect(() => {
    if (activeTab === 'customers' && isAgent) loadCustomers();
    if (activeTab === 'settings' && isAgent) loadSettings();
  }, [activeTab, isAgent]);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agent/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {}
    setLoading(false);
  };

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agent/customers?limit=50');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
        setCustomerTotal(data.total || 0);
      }
    } catch {}
    setLoading(false);
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agent/settings');
      if (res.ok) {
        const data = await res.json();
        setAgentSettings(data.agent);
      }
    } catch {}
    setLoading(false);
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h1>
          <Link href="/login" className="btn-primary px-6 py-2">去登录</Link>
        </div>
      </div>
    );
  }

  if (!isAgent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">无权限访问</h1>
          <Link href="/" className="btn-primary px-6 py-2">返回首页</Link>
        </div>
      </div>
    );
  }

  const memberLevelName: Record<string, string> = { free: '免费', monthly: '月卡', yearly: '年卡', lifetime: '终身' };

  return (
    <div className="min-h-screen bg-parchment-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 标题 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">代理商后台</h1>
            {stats?.agent && (
              <p className="text-sm text-gray-500 mt-1">
                {stats.agent.brandName || stats.agent.companyName}
                {stats.agent.domain && ` · ${stats.agent.domain}`}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Link href="/admin" className="px-4 py-2 text-sm bg-white border rounded-lg text-gray-600 hover:bg-gray-50">
              平台管理
            </Link>
          </div>
        </div>

        {/* 授权状态 */}
        {stats?.agent && (
          <div className={`mb-6 p-4 rounded-xl border ${stats.agent.isActive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${stats.agent.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm font-medium text-gray-700">
                  授权状态：{stats.agent.isActive ? '正常' : '已禁用'}
                </span>
                {stats.agent.licenseExpiry && (
                  <span className="text-xs text-gray-500">
                    到期：{new Date(stats.agent.licenseExpiry).toLocaleDateString('zh-CN')}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400 font-mono">
                授权Key: {stats.agent.licenseKey}
              </div>
            </div>
          </div>
        )}

        {/* Tab 导航 */}
        <div className="flex flex-wrap gap-2 mb-6">
          {([
            { key: 'overview' as Tab, label: '数据概览', icon: '📊' },
            { key: 'customers' as Tab, label: '客户管理', icon: '👥' },
            { key: 'settings' as Tab, label: '代理设置', icon: '⚙️' },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeTab === t.key ? 'bg-red-700 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'
              }`}
            >
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
                { label: '客户总数', value: stats.stats.customerCount, color: 'text-blue-600', icon: '👥' },
                { label: '总订单', value: stats.stats.totalOrders, color: 'text-purple-600', icon: '📦' },
                { label: '今日订单', value: stats.stats.todayOrders, color: 'text-orange-600', icon: '📈' },
                { label: '总收入', value: `¥${stats.stats.totalRevenue.toFixed(0)}`, color: 'text-red-600', icon: '💰' },
              ].map(s => (
                <div key={s.label} className="card p-4 text-center">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card p-5">
                <h3 className="font-bold text-gray-800 mb-3">排盘统计</h3>
                <div className="space-y-3">
                  {[
                    { name: '四柱八字', total: stats.stats.records.bazi, today: stats.stats.todayRecords.bazi, color: 'bg-red-500' },
                    { name: '紫微斗数', total: stats.stats.records.ziwei, today: stats.stats.todayRecords.ziwei, color: 'bg-purple-500' },
                    { name: '奇门遁甲', total: stats.stats.records.qimen, today: stats.stats.todayRecords.qimen, color: 'bg-blue-500' },
                    { name: '梅花易数', total: stats.stats.records.meihua, today: stats.stats.todayRecords.meihua, color: 'bg-pink-500' },
                  ].map(r => {
                    const max = Math.max(stats.stats.records.bazi, stats.stats.records.ziwei, stats.stats.records.qimen, stats.stats.records.meihua, 1);
                    return (
                      <div key={r.name}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">{r.name}</span>
                          <span className="font-medium">{r.total} <span className="text-xs text-gray-400">(今日{r.today})</span></span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${r.color} rounded-full transition-all`} style={{ width: `${(r.total / max) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card p-5">
                <h3 className="font-bold text-gray-800 mb-3">授权信息</h3>
                {stats.license ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">授权密钥</span>
                      <span className="font-mono text-xs">{stats.license.licenseKey}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">最大用户数</span>
                      <span className="font-medium">{stats.license.maxUsers || '无限'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">到期时间</span>
                      <span className="font-medium">{stats.license.expiryAt ? new Date(stats.license.expiryAt).toLocaleDateString('zh-CN') : '永久'}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">已开通功能</span>
                      <span className="font-medium">
                        {Array.isArray(stats.license.features) ? stats.license.features.join('、') : '全部'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">暂无有效授权</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 客户管理 */}
        {!loading && activeTab === 'customers' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">共 {customerTotal} 位客户</p>
              <button onClick={() => setShowCreateModal(true)} className="btn-primary text-sm !py-2">
                + 添加客户
              </button>
            </div>
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-500">邮箱</th>
                    <th className="px-3 py-2 text-left text-gray-500">姓名</th>
                    <th className="px-3 py-2 text-left text-gray-500">会员</th>
                    <th className="px-3 py-2 text-left text-gray-500">排盘数</th>
                    <th className="px-3 py-2 text-left text-gray-500">今日使用</th>
                    <th className="px-3 py-2 text-left text-gray-500">注册时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {customers.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无客户</td></tr>
                  ) : customers.map((c: any) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">{c.email}</td>
                      <td className="px-3 py-2">{c.name || '-'}</td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                          {memberLevelName[c.memberLevel] || c.memberLevel}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-500">{c.totalRecords}</td>
                      <td className="px-3 py-2 text-gray-500">{c.dailyUsage}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">{new Date(c.createdAt).toLocaleDateString('zh-CN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 代理设置 */}
        {!loading && activeTab === 'settings' && agentSettings && (
          <AgentSettingsForm agent={agentSettings} onSave={loadSettings} />
        )}
      </div>

      {/* 创建客户弹窗 */}
      {showCreateModal && (
        <CreateCustomerModal onClose={() => setShowCreateModal(false)} onSuccess={loadCustomers} />
      )}
    </div>
  );
}

// ============ 代理商设置表单 ============

function AgentSettingsForm({ agent, onSave }: { agent: any; onSave: () => void }) {
  const [brandName, setBrandName] = useState(agent.brandName || '');
  const [companyName, setCompanyName] = useState(agent.companyName || '');
  const [contactName, setContactName] = useState(agent.contactName || '');
  const [contactPhone, setContactPhone] = useState(agent.contactPhone || '');
  const [logo, setLogo] = useState(agent.logo || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const siteConfig: any = agent.siteConfig || {};
  const revenueShare = siteConfig.revenueShare ?? 0;
  const customPricing = siteConfig.customPricing ?? false;
  const whiteLabel = siteConfig.whiteLabel ?? false;
  const maxUsers = siteConfig.maxUsers ?? 1000;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/agent/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandName, companyName, contactName, contactPhone, logo }),
      });
      if (res.ok) {
        setMessage('保存成功');
        onSave();
        setTimeout(() => setMessage(''), 2000);
      }
    } catch {
      setMessage('保存失败');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* 品牌信息设置 */}
      <div className="card p-6">
        <h3 className="font-bold text-gray-800 mb-4">品牌信息</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">品牌名称</label>
            <input type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              placeholder="客户看到的品牌名称" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">公司名称</label>
            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">联系人</label>
              <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
              <input type="text" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
            <input type="text" value={logo} onChange={(e) => setLogo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              placeholder="https://..." />
          </div>
          <div className="pt-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary px-6 py-2 disabled:opacity-50">
              {saving ? '保存中...' : '保存设置'}
            </button>
            {message && <span className="ml-3 text-sm text-green-600">{message}</span>}
          </div>
        </div>
      </div>

      {/* 授权与商业信息（只读） */}
      <div className="card p-6">
        <h3 className="font-bold text-gray-800 mb-4">授权与商业信息</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">授权状态</div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${agent.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-medium text-sm">{agent.isActive ? '正常' : '已禁用'}</span>
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">授权到期</div>
            <div className="font-medium text-sm">{agent.licenseExpiry ? new Date(agent.licenseExpiry).toLocaleDateString('zh-CN') : '永久'}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">最大客户数</div>
            <div className="font-medium text-sm">{maxUsers}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">平台抽成比例</div>
            <div className="font-medium text-sm">{revenueShare}%</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">自定义定价</div>
            <div className={`text-sm font-medium ${customPricing ? 'text-green-600' : 'text-gray-400'}`}>{customPricing ? '已开启' : '未开启'}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">白标模式</div>
            <div className={`text-sm font-medium ${whiteLabel ? 'text-green-600' : 'text-gray-400'}`}>{whiteLabel ? '已开启' : '未开启'}</div>
          </div>
        </div>
        <div className="mt-3 p-3 bg-blue-50 rounded-lg text-xs text-blue-600">
          ℹ️ 以上信息由平台管理员设置，如需修改请联系平台管理员
        </div>
      </div>

      {/* 授权密钥 */}
      <div className="card p-6">
        <h3 className="font-bold text-gray-800 mb-4">授权密钥</h3>
        <div className="p-3 bg-gray-50 rounded-lg font-mono text-xs text-gray-700 break-all">{agent.licenseKey}</div>
        <p className="text-xs text-gray-400 mt-2">此密钥用于源码部署时验证授权，请妥善保管</p>
      </div>
    </div>
  );
}

// ============ 创建客户弹窗 ============

function CreateCustomerModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [memberLevel, setMemberLevel] = useState('free');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/agent/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, phone, password, memberLevel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      onSuccess();
    } catch (e: any) {
      setError(e.message || '创建失败');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
        {result ? (
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-2">客户创建成功</h3>
            <p className="text-sm text-gray-500 mb-2">登录邮箱：{result.credentials.email}</p>
            <p className="text-sm text-gray-500 mb-4">初始密码：{result.credentials.password}</p>
            <button onClick={onClose} className="btn-primary px-6 py-2">完成</button>
          </div>
        ) : (
          <>
            <h3 className="font-bold text-gray-900 mb-4">添加客户</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
              <div>
                <label className="block text-sm text-gray-600 mb-1">邮箱 *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">姓名</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">手机号</label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">初始密码</label>
                <input type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder="留空则默认12345678"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">会员等级</label>
                <select value={memberLevel} onChange={e => setMemberLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500">
                  <option value="free">免费</option>
                  <option value="monthly">月卡</option>
                  <option value="yearly">年卡</option>
                  <option value="lifetime">终身</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  取消
                </button>
                <button type="submit" disabled={loading} className="flex-1 btn-primary text-sm disabled:opacity-50">
                  {loading ? '创建中...' : '创建'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
