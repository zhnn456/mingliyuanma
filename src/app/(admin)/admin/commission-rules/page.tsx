'use client';

import { useState, useEffect } from 'react';

interface CommissionRule {
  id: string;
  agentId: string | null;
  productType: string;
  productId: string | null;
  baseRate: number;
  tierBonus: number;
  newCustomerBonus: number;
  maxMarkupRate: number;
  isActive: number;
  agentBrand?: string;
  companyName?: string;
  createdAt: string;
  updatedAt: string | null;
}

interface Agent {
  id: string;
  brandName?: string;
  companyName?: string;
  contactName?: string;
}

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  membership: '会员',
  offering: '咨询',
  pdf_report: 'PDF报告',
  all: '全部产品',
};

const DEFAULT_RULES_TEXT = [
  { type: 'membership', label: '会员', rate: '50%', desc: '会员产品参与分润，基础分润比例为 50%' },
  { type: 'offering', label: '咨询', rate: '50%', desc: '咨询服务参与分润，基础分润比例为 50%' },
  { type: 'pdf_report', label: 'PDF报告', rate: '60%', desc: 'PDF报告参与分润，基础分润比例为 60%' },
];

const EXCLUDED_PRODUCTS = ['排盘服务不参与分润'];

const TIER_INFO = [
  { range: '月GMV 0 ~ 5,000', bonus: '0%' },
  { range: '月GMV 5,001 ~ 20,000', bonus: '3%' },
  { range: '月GMV 20,001 ~ 50,000', bonus: '5%' },
  { range: '月GMV 50,000+', bonus: '8%' },
];

export default function CommissionRulesPage() {
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ activeCount: 0, disabledCount: 0, globalCount: 0, agentCount: 0, byProductType: [] as any[] });
  const [agents, setAgents] = useState<Agent[]>([]);

  const [agentFilter, setAgentFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);
  const [form, setForm] = useState({
    agentId: '', productType: 'membership', productId: '',
    baseRate: 0, tierBonus: 0, newCustomerBonus: 0, maxMarkupRate: 0, isActive: true,
  });

  const [applyingDefaults, setApplyingDefaults] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (agentFilter) params.set('agentId', agentFilter);
      const res = await fetch(`/api/admin/commission-rules?${params}`);
      if (res.ok) {
        const d = await res.json();
        setRules(d.rules || []);
        setTotal(d.total || 0);
      }
    } catch {} finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/commission-rules?stats=true');
      if (res.ok) {
        const d = await res.json();
        setStats(d);
      }
    } catch {}
  };

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/admin/agents');
      if (res.ok) {
        const d = await res.json();
        setAgents((d.agents || []).map((a: any) => ({
          id: a.id, brandName: a.brandName, companyName: a.companyName, contactName: a.contactName,
        })));
      }
    } catch {}
  };

  useEffect(() => { fetchData(); fetchStats(); fetchAgents(); }, []);

  const onSearch = () => { fetchData(); };

  const openAdd = () => {
    setEditingRule(null);
    setForm({
      agentId: '', productType: 'membership', productId: '',
      baseRate: 0, tierBonus: 0, newCustomerBonus: 0, maxMarkupRate: 0, isActive: true,
    });
    setShowModal(true);
  };

  const openEdit = (rule: CommissionRule) => {
    setEditingRule(rule);
    setForm({
      agentId: rule.agentId || '', productType: rule.productType, productId: rule.productId || '',
      baseRate: rule.baseRate * 100, tierBonus: rule.tierBonus * 100,
      newCustomerBonus: rule.newCustomerBonus * 100, maxMarkupRate: rule.maxMarkupRate * 100,
      isActive: rule.isActive === 1,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.productType) { alert('请选择产品类型'); return; }

    const payload = {
      agentId: form.agentId || null,
      productType: form.productType,
      productId: form.productId || null,
      baseRate: form.baseRate / 100,
      tierBonus: form.tierBonus / 100,
      newCustomerBonus: form.newCustomerBonus / 100,
      maxMarkupRate: form.maxMarkupRate / 100,
      isActive: form.isActive,
    };

    if (editingRule) {
      const res = await fetch('/api/admin/commission-rules', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingRule.id, ...payload }),
      });
      if (!res.ok) { const e = await res.json(); alert(e.error || '更新失败'); return; }
    } else {
      const res = await fetch('/api/admin/commission-rules', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const e = await res.json(); alert(e.error || '创建失败'); return; }
    }
    setShowModal(false);
    fetchData(); fetchStats();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此分润规则？')) return;
    const res = await fetch(`/api/admin/commission-rules?id=${id}`, { method: 'DELETE' });
    if (res.ok) { fetchData(); fetchStats(); }
    else { const e = await res.json(); alert(e.error || '删除失败'); }
  };

  const handleApplyDefaults = async () => {
    if (!confirm('将应用默认分润规则（会员50%、咨询50%、PDF报告60%），是否继续？')) return;
    setApplyingDefaults(true);
    try {
      const res = await fetch('/api/admin/commission-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply-defaults' }),
      });
      if (res.ok) {
        alert('默认规则已成功应用！');
        fetchData(); fetchStats();
      } else {
        const e = await res.json();
        alert(e.error || '应用失败');
      }
    } catch {
      alert('网络错误，请重试');
    } finally {
      setApplyingDefaults(false);
    }
  };

  const filteredRules = rules.filter(r => {
    if (productFilter && r.productType !== productFilter) return false;
    if (statusFilter === 'active' && r.isActive !== 1) return false;
    if (statusFilter === 'inactive' && r.isActive !== 0) return false;
    return true;
  });

  const fmtPct = (n: number) => (n * 100).toFixed(1) + '%';

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-900">分润规则管理</h1>
        <p className="text-sm text-slate-500 mt-0.5">管理代理商分润规则和比例配置</p>
      </div>

      {/* 默认分润规则说明卡片 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <span className="inline-block w-1 h-4 bg-blue-500 rounded" />
            默认分润规则说明
          </h2>
          <button
            onClick={handleApplyDefaults}
            disabled={applyingDefaults}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {applyingDefaults ? '应用中...' : '应用默认规则'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 参与分润的产品 */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">参与分润的产品类型</h3>
            <ul className="space-y-1.5">
              {DEFAULT_RULES_TEXT.map((item) => (
                <li key={item.type} className="flex items-start gap-2 text-sm">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs font-bold flex-shrink-0 mt-0.5">✓</span>
                  <div>
                    <span className="font-medium text-slate-800">{item.label}</span>
                    <span className="text-slate-500 ml-1">{item.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* 不参与分润 + 阶梯 + 奖励 */}
          <div className="space-y-3">
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">不参与分润</h3>
              <div className="flex items-center gap-2 text-sm">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-600 text-xs font-bold flex-shrink-0">✕</span>
                <span className="text-slate-700">{EXCLUDED_PRODUCTS.join('、')}</span>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">新客户首次订单奖励</h3>
              <div className="text-sm text-slate-700">
                新客户首次下单，额外获得 <span className="font-semibold text-amber-600">5%</span> 奖励（上限500元）
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">结算周期</h3>
              <div className="text-sm text-slate-700">周结算：每周一统计上一周的分润金额，审核通过后打款</div>
            </div>
          </div>
        </div>

        {/* GMV阶梯加成 */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">GMV阶梯加成（月累计GMV）</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {TIER_INFO.map((tier) => (
              <div key={tier.range} className="bg-slate-50 rounded-md px-2.5 py-2">
                <div className="text-xs text-slate-500">{tier.range}</div>
                <div className="text-sm font-semibold text-slate-800 mt-0.5">+{tier.bonus}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 p-2.5 bg-blue-50 border border-blue-100 rounded-md">
          <p className="text-xs text-blue-700 leading-relaxed">
            💡 点击「应用默认规则」将在数据库中创建三条全局默认规则（适用于所有代理商）。已有规则不会被删除，但可能被覆盖。
          </p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: '总规则数', value: total, color: 'text-blue-600' },
          { label: '启用中', value: stats.activeCount, color: 'text-green-600' },
          { label: '全局规则', value: stats.globalCount, color: 'text-purple-600' },
          { label: '代理商专属', value: stats.agentCount, color: 'text-amber-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg shadow-sm border p-3">
            <div className="text-xs text-slate-500">{s.label}</div>
            <div className={`text-lg font-bold mt-0.5 ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* 主表格区域 */}
      <div className="bg-white rounded-xl shadow-sm border">
        {/* 紧凑筛选栏 */}
        <div className="flex items-center gap-2 p-3 border-b flex-wrap">
          <span className="text-xs text-slate-500 mr-1">筛选：</span>
          <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} className="px-2 py-1.5 border rounded-md text-xs bg-white">
            <option value="">全部代理商</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.brandName || a.companyName || a.id}</option>
            ))}
          </select>
          <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className="px-2 py-1.5 border rounded-md text-xs bg-white">
            <option value="">全部产品</option>
            {Object.entries(PRODUCT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-2 py-1.5 border rounded-md text-xs bg-white">
            <option value="">全部状态</option>
            <option value="active">启用</option>
            <option value="inactive">已禁用</option>
          </select>
          <button onClick={onSearch} className="px-3 py-1.5 bg-slate-100 rounded-md text-xs hover:bg-slate-200 transition-colors">搜索</button>
          <div className="flex-1" />
          <button onClick={openAdd} className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700 transition-colors font-medium">+ 新增规则</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b text-left">
                <th className="px-3 py-2.5 text-slate-500 font-medium text-xs">代理商</th>
                <th className="px-3 py-2.5 text-slate-500 font-medium text-xs">产品类型</th>
                <th className="px-3 py-2.5 text-slate-500 font-medium text-xs">基础比例</th>
                <th className="px-3 py-2.5 text-slate-500 font-medium text-xs">阶梯加成</th>
                <th className="px-3 py-2.5 text-slate-500 font-medium text-xs">新客户奖励</th>
                <th className="px-3 py-2.5 text-slate-500 font-medium text-xs">状态</th>
                <th className="px-3 py-2.5 text-slate-500 font-medium text-xs">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-400">加载中...</td></tr>
              ) : filteredRules.length === 0 ? (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-400">暂无数据</td></tr>
              ) : filteredRules.map((rule) => (
                <tr key={rule.id} className="border-b hover:bg-slate-50">
                  <td className="px-3 py-2.5 text-sm font-medium text-slate-700">
                    {rule.agentBrand || rule.companyName || <span className="text-slate-400">全局规则</span>}
                  </td>
                  <td className="px-3 py-2.5 text-sm text-slate-600">{PRODUCT_TYPE_LABELS[rule.productType] || rule.productType}</td>
                  <td className="px-3 py-2.5 text-sm text-slate-600">{fmtPct(rule.baseRate)}</td>
                  <td className="px-3 py-2.5 text-sm text-slate-600">{fmtPct(rule.tierBonus)}</td>
                  <td className="px-3 py-2.5 text-sm text-slate-600">{fmtPct(rule.newCustomerBonus)}</td>
                  <td className="px-3 py-2.5">
                    {rule.isActive === 1 ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">启用</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-500">已禁用</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-3">
                      <button onClick={() => openEdit(rule)} className="text-blue-600 hover:text-blue-800 text-xs">编辑</button>
                      <button onClick={() => handleDelete(rule.id)} className="text-red-500 hover:text-red-700 text-xs">删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-3 py-2.5 border-t">
          <span className="text-xs text-slate-500">共 {filteredRules.length} 条</span>
        </div>
      </div>

      {/* 规则说明 */}
      <div className="bg-white rounded-xl shadow-sm border mt-4 p-4">
        <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <span className="inline-block w-1 h-4 bg-indigo-500 rounded" />
          分润系统规则说明
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-500 uppercase">分润计算方式</h4>
            <p className="text-slate-600 leading-relaxed">
              可分润金额 = 订单实付金额 - 支付手续费(1%) - 优惠券金额<br/>
              实际分润 = 可分润金额 × (基础比例 + 阶梯加成)
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-500 uppercase">规则优先级</h4>
            <p className="text-slate-600 leading-relaxed">
              代理商专属规则 {'>'} 全局规则<br/>
              当同一产品类型存在代理商专属规则和全局规则时，优先使用代理商专属规则。
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-500 uppercase">注意事项</h4>
            <p className="text-slate-600 leading-relaxed">
              分润规则变更后立即生效，已生成的分润记录不受影响。<br/>
              排盘服务类产品不参与任何分润。
            </p>
          </div>
        </div>
      </div>

      {/* 新增/编辑模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{editingRule ? '编辑分润规则' : '新增分润规则'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">代理商（留空为全局规则）</label>
                <select value={form.agentId} onChange={(e) => setForm({ ...form, agentId: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">全局规则</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>{a.brandName || a.companyName || a.id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">产品类型 *</label>
                <select value={form.productType} onChange={(e) => setForm({ ...form, productType: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                  {Object.entries(PRODUCT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">基础比例 (%) *</label>
                  <input type="number" step="0.1" min="0" max="100" value={form.baseRate} onChange={(e) => setForm({ ...form, baseRate: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">阶梯加成 (%)</label>
                  <input type="number" step="0.1" min="0" max="100" value={form.tierBonus} onChange={(e) => setForm({ ...form, tierBonus: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">新客户奖励 (%)</label>
                  <input type="number" step="0.1" min="0" max="100" value={form.newCustomerBonus} onChange={(e) => setForm({ ...form, newCustomerBonus: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最大加价率 (%)</label>
                  <input type="number" step="0.1" min="0" max="100" value={form.maxMarkupRate} onChange={(e) => setForm({ ...form, maxMarkupRate: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4" />
                <label htmlFor="isActive" className="text-sm text-gray-700">启用此规则</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">取消</button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">{editingRule ? '保存' : '创建'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}