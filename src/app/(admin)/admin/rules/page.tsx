'use client';

import { useState, useEffect, useCallback } from 'react';

type RuleCategory = 'bazi' | 'ziwei' | 'qimen' | 'meihua';

interface Rule {
  id: string;
  category: RuleCategory;
  ruleType: string;
  ruleKey: string;
  subKey: string | null;
  content: Record<string, any> | null;
  classicSource: string | null;
  classicQuote: string | null;
  priority: number;
  isActive: boolean;
  agentId: string | null;
  createdAt: string;
  updatedAt: string;
}

const CATEGORY_LABELS: Record<RuleCategory, string> = {
  bazi: '八字',
  ziwei: '紫微斗数',
  qimen: '奇门遁甲',
  meihua: '梅花易数',
};

const CATEGORY_COLORS: Record<RuleCategory, string> = {
  bazi: 'bg-blue-50 text-blue-700 border-blue-200',
  ziwei: 'bg-purple-50 text-purple-700 border-purple-200',
  qimen: 'bg-green-50 text-green-700 border-green-200',
  meihua: 'bg-amber-50 text-amber-700 border-amber-200',
};

interface RuleFormData {
  category: RuleCategory;
  ruleType: string;
  ruleKey: string;
  subKey: string;
  content: string;
  classicSource: string;
  classicQuote: string;
  priority: number;
  isActive: boolean;
}

const emptyForm: RuleFormData = {
  category: 'bazi',
  ruleType: '',
  ruleKey: '',
  subKey: '',
  content: '{\n  \n}',
  classicSource: '',
  classicQuote: '',
  priority: 0,
  isActive: true,
};

export default function AdminRulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<string>('');
  const [ruleType, setRuleType] = useState<string>('');
  const [keyword, setKeyword] = useState('');
  const [stats, setStats] = useState<Record<string, number>>({});
  const [ruleTypes, setRuleTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailRule, setDetailRule] = useState<Rule | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [formData, setFormData] = useState<RuleFormData>(emptyForm);
  const [formError, setFormError] = useState('');

  const pageSize = 20;

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/rules?stats=true');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || {});
        setRuleTypes(data.ruleTypes || []);
      }
    } catch {}
  }, []);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (category) params.set('category', category);
      if (ruleType) params.set('ruleType', ruleType);
      if (keyword) params.set('keyword', keyword);

      const res = await fetch(`/api/admin/rules?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules || []);
        setTotal(data.total || 0);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [page, category, ruleType, keyword]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchRules(); }, [fetchRules]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleReset = () => {
    setCategory('');
    setRuleType('');
    setKeyword('');
    setPage(1);
  };

  const openCreateForm = () => {
    setEditingRule(null);
    setFormData(emptyForm);
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (rule: Rule) => {
    setEditingRule(rule);
    setFormData({
      category: rule.category,
      ruleType: rule.ruleType,
      ruleKey: rule.ruleKey,
      subKey: rule.subKey || '',
      content: rule.content ? JSON.stringify(rule.content, null, 2) : '{\n  \n}',
      classicSource: rule.classicSource || '',
      classicQuote: rule.classicQuote || '',
      priority: rule.priority,
      isActive: rule.isActive,
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async () => {
    setFormError('');

    if (!formData.ruleType.trim()) { setFormError('规则类型不能为空'); return; }
    if (!formData.ruleKey.trim()) { setFormError('规则键不能为空'); return; }

    let parsedContent: any;
    try {
      parsedContent = JSON.parse(formData.content);
    } catch {
      setFormError('内容必须是有效的 JSON 格式');
      return;
    }

    try {
      if (editingRule) {
        const res = await fetch(`/api/admin/rules/${editingRule.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: parsedContent,
            classicSource: formData.classicSource || null,
            classicQuote: formData.classicQuote || null,
            priority: formData.priority,
            isActive: formData.isActive,
          }),
        });
        if (res.ok) {
          setShowForm(false);
          fetchRules();
          fetchStats();
        } else {
          const data = await res.json();
          setFormError(data.error || '更新失败');
        }
      } else {
        const res = await fetch('/api/admin/rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: formData.category,
            ruleType: formData.ruleType.trim(),
            ruleKey: formData.ruleKey.trim(),
            subKey: formData.subKey.trim() || undefined,
            content: parsedContent,
            classicSource: formData.classicSource.trim() || undefined,
            classicQuote: formData.classicQuote.trim() || undefined,
            priority: formData.priority,
            isActive: formData.isActive,
          }),
        });
        if (res.ok) {
          setShowForm(false);
          fetchRules();
          fetchStats();
        } else {
          const data = await res.json();
          setFormError(data.error || '创建失败');
        }
      }
    } catch {
      setFormError('请求失败');
    }
  };

  const handleDelete = async (rule: Rule) => {
    if (!confirm(`确认删除规则「${rule.ruleKey}」?`)) return;
    try {
      const res = await fetch(`/api/admin/rules/${rule.id}`, { method: 'DELETE' });
      if (res.ok) {
        if (detailRule?.id === rule.id) setDetailRule(null);
        fetchRules();
        fetchStats();
      }
    } catch {}
  };

  const handleToggleActive = async (rule: Rule) => {
    try {
      const res = await fetch(`/api/admin/rules/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !rule.isActive }),
      });
      if (res.ok) fetchRules();
    } catch {}
  };

  const totalPages = Math.ceil(total / pageSize);

  const statsCards: { key: RuleCategory; label: string; icon: string }[] = [
    { key: 'bazi', label: '八字规则', icon: '☰' },
    { key: 'ziwei', label: '紫微规则', icon: '★' },
    { key: 'qimen', label: '奇门规则', icon: '☯' },
    { key: 'meihua', label: '梅花规则', icon: '⚘' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">排盘规则管理</h2>
          <p className="text-sm text-gray-500">共 {total} 条规则</p>
        </div>
        <button
          onClick={openCreateForm}
          className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800"
        >
          + 创建规则
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="text-xs text-gray-500 mb-1">规则总数</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total || 0}</div>
        </div>
        {statsCards.map(card => (
          <div key={card.key} className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="text-xs text-gray-500 mb-1">
              <span className="mr-1">{card.icon}</span>{card.label}
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats[card.key] || 0}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSearch} className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">分类</label>
          <select
            value={category}
            onChange={e => { setCategory(e.target.value); setRuleType(''); }}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">全部分类</option>
            {(Object.keys(CATEGORY_LABELS) as RuleCategory[]).map(c => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">类型</label>
          <select
            value={ruleType}
            onChange={e => setRuleType(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">全部类型</option>
            {ruleTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="搜索规则键、古籍出处或内容"
            className="flex-1 px-4 py-2 border rounded-lg text-sm"
          />
        </div>
        <button type="submit" className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800">
          搜索
        </button>
        <button type="button" onClick={handleReset} className="px-5 py-2 border rounded-lg text-sm hover:bg-gray-50">
          重置
        </button>
      </form>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-4 py-3 text-gray-500 font-medium">规则键</th>
              <th className="px-4 py-3 text-gray-500 font-medium">分类</th>
              <th className="px-4 py-3 text-gray-500 font-medium">类型</th>
              <th className="px-4 py-3 text-gray-500 font-medium">子键</th>
              <th className="px-4 py-3 text-gray-500 font-medium">优先级</th>
              <th className="px-4 py-3 text-gray-500 font-medium">状态</th>
              <th className="px-4 py-3 text-gray-500 font-medium">古籍出处</th>
              <th className="px-4 py-3 text-gray-500 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-400">加载中...</td>
              </tr>
            ) : rules.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-400">暂无规则</td>
              </tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setDetailRule(rule)}
                      className="text-gray-900 font-medium hover:text-blue-600"
                    >
                      {rule.ruleKey}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${CATEGORY_COLORS[rule.category]}`}>
                      {CATEGORY_LABELS[rule.category]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{rule.ruleType}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{rule.subKey || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{rule.priority}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(rule)}
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${
                        rule.isActive
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}
                    >
                      {rule.isActive ? '启用' : '停用'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-[120px] truncate">{rule.classicSource || '-'}</td>
                  <td className="px-4 py-3 space-x-3">
                    <button
                      onClick={() => openEditForm(rule)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(rule)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-500">
          第 {page} / {totalPages || 1} 页
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            上一页
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            下一页
          </button>
        </div>
      </div>

      {detailRule && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setDetailRule(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-bold text-gray-900">规则详情</h3>
              <button onClick={() => setDetailRule(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">分类</div>
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${CATEGORY_COLORS[detailRule.category]}`}>
                    {CATEGORY_LABELS[detailRule.category]}
                  </span>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">类型</div>
                  <div className="text-sm text-gray-900">{detailRule.ruleType}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">规则键</div>
                  <div className="text-sm text-gray-900">{detailRule.ruleKey}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">子键</div>
                  <div className="text-sm text-gray-900">{detailRule.subKey || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">优先级</div>
                  <div className="text-sm text-gray-900">{detailRule.priority}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">状态</div>
                  <div className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${
                    detailRule.isActive
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}>
                    {detailRule.isActive ? '启用' : '停用'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">古籍出处</div>
                  <div className="text-sm text-gray-900">{detailRule.classicSource || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">更新时间</div>
                  <div className="text-sm text-gray-500">{detailRule.updatedAt ? new Date(detailRule.updatedAt).toLocaleString('zh-CN') : '-'}</div>
                </div>
              </div>
              {detailRule.classicQuote && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">古籍原文</div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
                    {detailRule.classicQuote}
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs text-gray-500 mb-1">规则内容</div>
                <pre className="bg-gray-50 border rounded-lg p-3 text-xs text-gray-700 overflow-auto whitespace-pre-wrap break-all">
                  {detailRule.content
                    ? (typeof detailRule.content === 'string'
                        ? detailRule.content
                        : JSON.stringify(detailRule.content, null, 2))
                    : '-'}
                </pre>
              </div>
            </div>
            <div className="px-5 py-3 border-t flex justify-end gap-2">
              <button
                onClick={() => { openEditForm(detailRule); setDetailRule(null); }}
                className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                编辑
              </button>
              <button onClick={() => setDetailRule(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-bold text-gray-900">{editingRule ? '编辑规则' : '创建规则'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              {formError && (
                <div className="px-4 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                  {formError}
                </div>
              )}
              {!editingRule && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-700 block mb-1">分类</label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value as RuleCategory })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      {(Object.keys(CATEGORY_LABELS) as RuleCategory[]).map(c => (
                        <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-700 block mb-1">类型</label>
                    <input
                      value={formData.ruleType}
                      onChange={e => setFormData({ ...formData, ruleType: e.target.value })}
                      placeholder="如: 十神、天干、地支"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>
              )}
              {editingRule && (
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">分类</div>
                    <div className="text-sm text-gray-900">{CATEGORY_LABELS[formData.category]}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">类型</div>
                    <div className="text-sm text-gray-900">{formData.ruleType}</div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-700 block mb-1">规则键</label>
                  <input
                    value={formData.ruleKey}
                    onChange={e => setFormData({ ...formData, ruleKey: e.target.value })}
                    placeholder="如: 甲、比肩"
                    disabled={!!editingRule}
                    className="w-full px-3 py-2 border rounded-lg text-sm disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-700 block mb-1">子键（可选）</label>
                  <input
                    value={formData.subKey}
                    onChange={e => setFormData({ ...formData, subKey: e.target.value })}
                    placeholder="如: 子、丑"
                    disabled={!!editingRule}
                    className="w-full px-3 py-2 border rounded-lg text-sm disabled:bg-gray-100"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-700 block mb-1">规则内容（JSON）</label>
                <textarea
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                  placeholder='{"description": "规则描述"}'
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-700 block mb-1">古籍出处</label>
                  <input
                    value={formData.classicSource}
                    onChange={e => setFormData({ ...formData, classicSource: e.target.value })}
                    placeholder="如: 《滴天髓》"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-700 block mb-1">优先级</label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-700 block mb-1">古籍原文</label>
                <textarea
                  value={formData.classicQuote}
                  onChange={e => setFormData({ ...formData, classicQuote: e.target.value })}
                  rows={3}
                  placeholder="古籍中的原文引用"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">启用此规则</label>
              </div>
            </div>
            <div className="px-5 py-3 border-t flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">
                取消
              </button>
              <button onClick={handleSubmit} className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800">
                {editingRule ? '保存修改' : '创建规则'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}