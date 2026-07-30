'use client';

import { useState, useEffect, useMemo } from 'react';

interface ConfigItem {
  id: string;
  key: string;
  value: string;
  category: string;
  description?: string;
  updatedAt: string;
}

const CATEGORY_MAP: Record<string, { label: string; color: string; bg: string }> = {
  system: { label: '系统基础设置', color: 'text-blue-700', bg: 'bg-blue-100' },
  payment: { label: '支付配置', color: 'text-green-700', bg: 'bg-green-100' },
  notification: { label: '通知配置', color: 'text-purple-700', bg: 'bg-purple-100' },
  email: { label: '邮件配置', color: 'text-orange-700', bg: 'bg-orange-100' },
  version: { label: '版本信息', color: 'text-cyan-700', bg: 'bg-cyan-100' },
  agent: { label: '代理商配置', color: 'text-pink-700', bg: 'bg-pink-100' },
  other: { label: '其他', color: 'text-gray-700', bg: 'bg-gray-100' },
};

const CATEGORY_ORDER = ['system', 'payment', 'notification', 'email', 'version', 'agent', 'other'];

type EditState = {
  key: string;
  value: string;
  description: string;
  category: string;
} | null;

export default function AdminConfigPage() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ key: '', value: '', category: 'system', description: '' });
  const [saving, setSaving] = useState(false);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/config');
      if (res.ok) {
        const d = await res.json();
        setConfigs(d.configs || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: configs.length };
    for (const c of configs) {
      const cat = c.category || 'other';
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [configs]);

  const filteredConfigs = useMemo(() => {
    let list = configs;
    if (activeCategory !== 'all') {
      list = list.filter((c) => (c.category || 'other') === activeCategory);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.key.toLowerCase().includes(q) ||
          (c.value || '').toLowerCase().includes(q) ||
          (c.description || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [configs, activeCategory, search]);

  const startEdit = (c: ConfigItem) => {
    setEditingKey(c.key);
    setEditState({
      key: c.key,
      value: c.value,
      description: c.description || '',
      category: c.category || 'other',
    });
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditState(null);
  };

  const saveEdit = async () => {
    if (!editState) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: editState.key,
          value: editState.value,
          category: editState.category,
          description: editState.description,
        }),
      });
      if (res.ok) {
        setEditingKey(null);
        setEditState(null);
        fetchConfig();
      } else {
        const d = await res.json();
        alert(d.error || '保存失败');
      }
    } catch {
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`确定删除配置项 "${key}"？此操作不可恢复。`)) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      if (res.ok) {
        fetchConfig();
      } else {
        const d = await res.json();
        alert(d.error || '删除失败');
      }
    } catch {
      alert('删除失败');
    } finally {
      setSaving(false);
    }
  };

  const openCreateModal = () => {
    setCreateForm({ key: '', value: '', category: activeCategory === 'all' ? 'system' : activeCategory, description: '' });
    setShowCreateModal(true);
  };

  const handleCreate = async () => {
    if (!createForm.key.trim()) {
      alert('请输入配置键名');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: createForm.key.trim(),
          value: createForm.value,
          category: createForm.category,
          description: createForm.description,
        }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        fetchConfig();
      } else {
        const d = await res.json();
        alert(d.error || '创建失败');
      }
    } catch {
      alert('创建失败');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getCategoryInfo = (cat: string) => {
    return CATEGORY_MAP[cat] || { label: cat || '其他', color: 'text-gray-700', bg: 'bg-gray-100' };
  };

  const isLongValue = (v: string) => v && v.length > 80;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">系统设置</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            共 {configs.length} 项配置 · 当前显示 {filteredConfigs.length} 项
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新增配置
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索配置键、值或描述..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex">
          <div className="w-48 border-r bg-gray-50/50 p-3">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider px-2 mb-2">分类</div>
            <div className="space-y-0.5">
              <button
                onClick={() => setActiveCategory('all')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                  activeCategory === 'all'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>全部</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeCategory === 'all' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {categoryCounts.all || 0}
                </span>
              </button>
              {CATEGORY_ORDER.map((cat) => {
                const info = CATEGORY_MAP[cat];
                const count = categoryCounts[cat] || 0;
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                      isActive
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="truncate">{info.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                      isActive ? 'bg-white/20 text-white' : count > 0 ? `${info.bg} ${info.color}` : 'bg-gray-200 text-gray-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 p-4">
            {loading ? (
              <div className="text-center py-12 text-gray-400 text-sm">加载中...</div>
            ) : filteredConfigs.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                {configs.length === 0 ? '暂无配置数据，点击右上角"新增配置"添加' : '未找到匹配的配置项'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredConfigs.map((c) => {
                  const info = getCategoryInfo(c.category);
                  const isEditing = editingKey === c.key;
                  const isLong = isLongValue(c.value);

                  return (
                    <div
                      key={c.id}
                      className={`border rounded-lg p-4 transition-colors ${
                        isEditing ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <code className="text-sm font-mono font-semibold text-gray-900 break-all">
                              {c.key}
                            </code>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${info.bg} ${info.color} font-medium`}>
                              {info.label}
                            </span>
                          </div>

                          {c.description && !isEditing && (
                            <p className="text-xs text-gray-500 mb-2">{c.description}</p>
                          )}

                          {!isEditing ? (
                            <div
                              className={`text-sm text-gray-700 bg-gray-50 rounded-md px-3 py-2 font-mono break-all ${
                                isLong ? 'whitespace-pre-wrap' : ''
                              }`}
                              title={c.value}
                            >
                              {c.value || <span className="text-gray-400 italic">（空）</span>}
                            </div>
                          ) : (
                            <div className="space-y-3 mt-2">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">值</label>
                                <textarea
                                  value={editState?.value ?? ''}
                                  onChange={(e) =>
                                    setEditState((prev) => (prev ? { ...prev, value: e.target.value } : prev))
                                  }
                                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  rows={isLong ? 4 : 2}
                                  autoFocus
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">分类</label>
                                  <select
                                    value={editState?.category || 'other'}
                                    onChange={(e) =>
                                      setEditState((prev) => (prev ? { ...prev, category: e.target.value } : prev))
                                    }
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    {CATEGORY_ORDER.map((cat) => (
                                      <option key={cat} value={cat}>
                                        {CATEGORY_MAP[cat].label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">描述</label>
                                  <input
                                    value={editState?.description ?? ''}
                                    onChange={(e) =>
                                      setEditState((prev) => (prev ? { ...prev, description: e.target.value } : prev))
                                    }
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="配置说明（可选）"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {!isEditing && c.updatedAt && (
                            <div className="text-xs text-gray-400 mt-2">
                              更新于 {formatDate(c.updatedAt)}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isEditing ? (
                            <>
                              <button
                                onClick={saveEdit}
                                disabled={saving}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
                              >
                                {saving ? '保存中...' : '保存'}
                              </button>
                              <button
                                onClick={cancelEdit}
                                disabled={saving}
                                className="px-3 py-1.5 border rounded-lg text-xs hover:bg-gray-50 transition-colors disabled:opacity-50"
                              >
                                取消
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(c)}
                                className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                              >
                                编辑
                              </button>
                              <button
                                onClick={() => handleDelete(c.key)}
                                disabled={saving}
                                className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                              >
                                删除
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">新增配置项</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  配置键 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.key}
                  onChange={(e) => setCreateForm({ ...createForm, key: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如：site_name"
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">键名唯一，创建后不可修改</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  配置值 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={createForm.value}
                  onChange={(e) => setCreateForm({ ...createForm, value: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="配置值，支持文本或 JSON"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORY_ORDER.map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_MAP[cat].label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                  <input
                    type="text"
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="配置说明（可选）"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}