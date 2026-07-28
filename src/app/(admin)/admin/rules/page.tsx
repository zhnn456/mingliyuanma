'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Rule {
  id: string;
  category: string;
  ruleType: string;
  ruleKey: string;
  subKey: string | null;
  content: any;
  classicSource: string | null;
  classicQuote: string | null;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  bazi: number;
  ziwei: number;
  qimen: number;
  meihua: number;
  total: number;
}

const CATEGORIES = [
  { key: '', label: '全部', icon: '☰' },
  { key: 'bazi', label: '四柱八字', icon: '甲' },
  { key: 'ziwei', label: '紫微斗数', icon: '紫' },
  { key: 'qimen', label: '奇门遁甲', icon: '奇' },
  { key: 'meihua', label: '梅花易数', icon: '梅' },
];

const CATEGORY_LABELS: Record<string, string> = {
  bazi: '八字',
  ziwei: '紫微',
  qimen: '奇门',
  meihua: '梅花',
};

export default function RulesAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [rules, setRules] = useState<Rule[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [ruleTypes, setRuleTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [category, setCategory] = useState('');
  const [ruleType, setRuleType] = useState('');
  const [keyword, setKeyword] = useState('');

  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState<any>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (ruleType) params.set('ruleType', ruleType);
    if (keyword) params.set('keyword', keyword);
    params.set('page', String(page));
    params.set('pageSize', '20');
    params.set('stats', 'true');

    const res = await fetch(`/api/admin/rules?${params}`);
    const data = await res.json();
    if (res.ok) {
      setRules(data.rules || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
      if (data.stats) setStats(data.stats);
      if (data.ruleTypes) setRuleTypes(data.ruleTypes);
    }
    setLoading(false);
  }, [category, ruleType, keyword, page]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || (session.user as any)?.role !== 'admin') {
      router.push('/login');
      return;
    }
    fetchData();
  }, [session, status, router, fetchData]);

  const handleMigrate = async () => {
    if (!confirm('确认将现有 .ts 文件中的规则批量导入数据库？此操作会覆盖同键名的已有规则。')) return;
    setMigrating(true);
    setMigrateResult(null);
    try {
      const res = await fetch('/api/admin/rules/migrate', { method: 'POST' });
      const data = await res.json();
      setMigrateResult(data);
      if (data.success) {
        fetchData();
      }
    } catch (e: any) {
      setMigrateResult({ success: false, error: e.message });
    }
    setMigrating(false);
  };

  const handleSave = async (ruleData: any) => {
    const method = editingRule ? 'PUT' : 'POST';
    const url = editingRule
      ? `/api/admin/rules/${editingRule.id}`
      : '/api/admin/rules';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ruleData),
    });

    if (res.ok) {
      setShowEditor(false);
      setEditingRule(null);
      fetchData();
    } else {
      const err = await res.json();
      alert(err.error || '保存失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除此规则？')) return;
    const res = await fetch(`/api/admin/rules/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchData();
    } else {
      alert('删除失败');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-parchment-50">
        <div className="text-gray-500 text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-gray-500 hover:text-gray-700 text-sm">
              ← 管理后台
            </Link>
            <h1 className="text-xl font-bold text-gray-900">命理规则库管理</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMigrate}
              disabled={migrating}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
            >
              {migrating ? '迁移中...' : '批量导入规则'}
            </button>
            <button
              onClick={() => { setEditingRule(null); setShowEditor(true); }}
              className="px-4 py-2 bg-red-700 text-white rounded-lg text-sm font-medium hover:bg-red-800"
            >
              + 新增规则
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-5 gap-3 mb-6">
            {CATEGORIES.filter(c => c.key).map((cat) => (
              <div key={cat.key} className="bg-white rounded-xl border p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{stats[cat.key as keyof Stats]}</div>
                <div className="text-xs text-gray-500 mt-1">{cat.label}</div>
              </div>
            ))}
            <div className="bg-gradient-to-br from-red-700 to-red-900 rounded-xl p-4 text-center text-white">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs mt-1 opacity-80">总计</div>
            </div>
          </div>
        )}

        {/* 迁移结果 */}
        {migrateResult && (
          <div className={`mb-6 p-4 rounded-xl border ${migrateResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="font-medium mb-2">
              {migrateResult.success ? `✓ ${migrateResult.message}` : `✗ ${migrateResult.error}`}
            </div>
            {migrateResult.details && (
              <div className="text-xs text-gray-600 space-y-1">
                {migrateResult.details.map((d: string, i: number) => (
                  <div key={i}>{d}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 筛选区 */}
        <div className="bg-white rounded-xl border p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => { setCategory(cat.key); setRuleType(''); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    category === cat.key
                      ? 'bg-red-700 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
            <select
              value={ruleType}
              onChange={(e) => { setRuleType(e.target.value); setPage(1); }}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm bg-white"
            >
              <option value="">全部类型</option>
              {ruleTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input
              type="text"
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
              placeholder="搜索规则名/古籍/内容..."
              className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg border border-gray-300 text-sm"
            />
          </div>
        </div>

        {/* 规则列表 */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">分类</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">规则类型</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">键名</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">子键</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">古籍出处</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">状态</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rules.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      {total === 0 ? '暂无规则，点击"批量导入规则"将现有规则导入数据库' : '没有匹配的规则'}
                    </td>
                  </tr>
                ) : (
                  rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700">
                          {CATEGORY_LABELS[rule.category] || rule.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{rule.ruleType}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{rule.ruleKey}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{rule.subKey || '-'}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs max-w-[200px] truncate" title={rule.classicSource || ''}>
                        {rule.classicSource || <span className="text-gray-300">无</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block w-2 h-2 rounded-full ${rule.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => { setEditingRule(rule); setShowEditor(true); }}
                          className="text-blue-600 hover:text-blue-800 text-xs mr-3"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(rule.id)}
                          className="text-red-600 hover:text-red-800 text-xs"
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

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <div className="text-xs text-gray-500">共 {total} 条</div>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                >
                  上一页
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 编辑弹窗 */}
      {showEditor && (
        <RuleEditor
          rule={editingRule}
          onSave={handleSave}
          onClose={() => { setShowEditor(false); setEditingRule(null); }}
        />
      )}
    </div>
  );
}

// ========== 规则编辑器组件 ==========

function RuleEditor({
  rule,
  onSave,
  onClose,
}: {
  rule: Rule | null;
  onSave: (data: any) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    category: rule?.category || 'bazi',
    ruleType: rule?.ruleType || '',
    ruleKey: rule?.ruleKey || '',
    subKey: rule?.subKey || '',
    content: rule?.content ? JSON.stringify(rule.content, null, 2) : '',
    classicSource: rule?.classicSource || '',
    classicQuote: rule?.classicQuote || '',
    priority: rule?.priority || 0,
    isActive: rule?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let contentObj: any;
    try {
      contentObj = JSON.parse(formData.content);
    } catch {
      alert('规则内容必须是有效的 JSON 格式');
      return;
    }
    onSave({
      ...formData,
      content: contentObj,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">{rule ? '编辑规则' : '新增规则'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分类 *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                required
              >
                <option value="bazi">四柱八字</option>
                <option value="ziwei">紫微斗数</option>
                <option value="qimen">奇门遁甲</option>
                <option value="meihua">梅花易数</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">规则类型 *</label>
              <input
                type="text"
                value={formData.ruleType}
                onChange={(e) => setFormData({ ...formData, ruleType: e.target.value })}
                placeholder="如: day_gan_personality"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">键名 *</label>
              <input
                type="text"
                value={formData.ruleKey}
                onChange={(e) => setFormData({ ...formData, ruleKey: e.target.value })}
                placeholder="如: 甲 / 紫微 / 开门"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">子键（可选）</label>
              <input
                type="text"
                value={formData.subKey}
                onChange={(e) => setFormData({ ...formData, subKey: e.target.value })}
                placeholder="如: 命宫 / wealth"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              规则内容（JSON）*
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder='{"personality": "...", "career": "..."}'
              rows={8}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">古籍出处</label>
              <input
                type="text"
                value={formData.classicSource}
                onChange={(e) => setFormData({ ...formData, classicSource: e.target.value })}
                placeholder="如: 《渊海子平》"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">古籍原文引用</label>
            <textarea
              value={formData.classicQuote}
              onChange={(e) => setFormData({ ...formData, classicQuote: e.target.value })}
              placeholder="原文引用..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4"
              id="isActive"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">启用此规则</label>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-red-700 text-white text-sm font-medium hover:bg-red-800"
            >
              {rule ? '保存修改' : '创建规则'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
