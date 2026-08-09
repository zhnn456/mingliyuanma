'use client';

import { useState, useEffect } from 'react';

interface Announcement {
  id: string;
  icon: string;
  badge: string;
  title: string;
  content: string;
  link: string;
  linkText: string;
  enabled: boolean;
  sortOrder: number;
  createdAt?: string;
}

const ICONS = ['🎁', '📢', '🎉', '✨', '🔥', '💎', '🚀', '🙏', '⭐', '🧧', '📜', '💸'];

const EMPTY: Partial<Announcement> = {
  icon: '📢',
  badge: '公告',
  title: '',
  content: '',
  link: '',
  linkText: '查看详情',
  enabled: true,
  sortOrder: 0,
};

export default function AdminAnnouncementPage() {
  const [list, setList] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Announcement> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/announcement');
      if (res.ok) {
        const d = await res.json();
        setList(d.announcements || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleNew = () => {
    setEditing({ ...EMPTY });
    setIsNew(true);
  };

  const handleEdit = (a: Announcement) => {
    setEditing({ ...a });
    setIsNew(false);
  };

  const handleCancel = () => {
    setEditing(null);
    setIsNew(false);
  };

  const update = (key: keyof Announcement, value: any) => {
    setEditing(prev => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/announcement', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });
      if (res.ok) {
        setSavedMsg(isNew ? '✓ 已创建' : '✓ 已保存');
        setTimeout(() => setSavedMsg(''), 2000);
        setEditing(null);
        setIsNew(false);
        fetchList();
      }
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除该公告？删除后用户将不再看到此公告。')) return;
    await fetch(`/api/admin/announcement?id=${id}`, { method: 'DELETE' });
    if (editing?.id === id) {
      setEditing(null);
      setIsNew(false);
    }
    fetchList();
  };

  const toggleEnabled = async (a: Announcement) => {
    await fetch('/api/admin/announcement', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: a.id, enabled: !a.enabled }),
    });
    fetchList();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* 顶部 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">公告管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            多公告队列 · 用户已读不再显示 · 新公告会再次弹出
          </p>
        </div>
        <div className="flex items-center gap-3">
          {savedMsg && (
            <span className="text-sm text-green-600 font-medium">{savedMsg}</span>
          )}
          {!editing && (
            <button
              onClick={handleNew}
              className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-lg font-medium transition"
            >
              + 新建公告
            </button>
          )}
        </div>
      </div>

      {/* 说明条 */}
      <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 leading-relaxed">
        💡 新旧公告并存：用户访问时，未读公告会按顺序逐条弹出（右下角）。用户看过即标记已读，刷新后不再打扰。
        管理员新增公告后，因新公告 id 不在用户已读列表，会自动再次弹出。
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：公告列表 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800 text-sm">
              公告列表（{list.length}）
            </h2>
            <button
              onClick={fetchList}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              刷新
            </button>
          </div>

          {loading ? (
            <div className="text-center text-gray-400 py-10 text-sm">加载中...</div>
          ) : list.length === 0 ? (
            <div className="text-center text-gray-400 py-10 text-sm">
              暂无公告，点击右上角"新建公告"
            </div>
          ) : (
            <div className="space-y-2">
              {list.map(a => (
                <div
                  key={a.id}
                  className={`border rounded-lg p-3 transition cursor-pointer ${
                    editing?.id === a.id
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleEdit(a)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <span className="text-xl flex-shrink-0">{a.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                            {a.badge}
                          </span>
                          {!a.enabled && (
                            <span className="text-xs text-gray-400">已停用</span>
                          )}
                          <span className="text-xs text-gray-300">#{a.sortOrder}</span>
                        </div>
                        <div className="font-medium text-gray-900 text-sm truncate">
                          {a.title}
                        </div>
                        <div className="text-xs text-gray-400 truncate mt-0.5">
                          {a.content}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          toggleEnabled(a);
                        }}
                        className={`w-9 h-5 rounded-full relative transition ${
                          a.enabled ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                        title={a.enabled ? '点击停用' : '点击启用'}
                      >
                        <span
                          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition ${
                            a.enabled ? 'left-4' : 'left-0.5'
                          }`}
                        />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleDelete(a.id);
                        }}
                        className="text-gray-400 hover:text-red-500 px-1 text-sm"
                        title="删除"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 右侧：编辑表单 / 预览 */}
        <div>
          {!editing ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <div className="text-4xl mb-3">📋</div>
              <div className="text-gray-500 text-sm mb-1">
                选择左侧公告进行编辑
              </div>
              <div className="text-gray-400 text-xs">或点击右上角"新建公告"</div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-semibold text-gray-800 text-sm">
                  {isNew ? '新建公告' : '编辑公告'}
                </h2>
                <span className="text-xs text-gray-400">
                  {isNew ? '新公告' : `ID: ${editing.id}`}
                </span>
              </div>

              {/* 图标 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  图标
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ICONS.map(ic => (
                    <button
                      key={ic}
                      onClick={() => update('icon', ic)}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border transition ${
                        editing.icon === ic
                          ? 'border-amber-400 bg-amber-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    标签
                  </label>
                  <input
                    type="text"
                    value={editing.badge || ''}
                    onChange={e => update('badge', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400"
                    placeholder="如：限时优惠"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    排序（越小越靠前）
                  </label>
                  <input
                    type="number"
                    value={editing.sortOrder ?? 0}
                    onChange={e => update('sortOrder', parseInt(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  标题
                </label>
                <input
                  type="text"
                  value={editing.title || ''}
                  onChange={e => update('title', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400"
                  placeholder="如：源码部署 · 贴牌开户"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  内容描述
                </label>
                <textarea
                  value={editing.content || ''}
                  onChange={e => update('content', e.target.value)}
                  rows={3}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 resize-none"
                  placeholder="公告详细内容"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    跳转链接
                  </label>
                  <input
                    type="text"
                    value={editing.link || ''}
                    onChange={e => update('link', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400"
                    placeholder="/register 或 /contact"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    按钮文字
                  </label>
                  <input
                    type="text"
                    value={editing.linkText || ''}
                    onChange={e => update('linkText', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400"
                    placeholder="立即咨询"
                  />
                </div>
              </div>

              {/* 启用开关 */}
              <div className="flex items-center justify-between py-1">
                <label className="text-xs font-medium text-gray-600">
                  启用此公告
                </label>
                <button
                  onClick={() => update('enabled', !editing.enabled)}
                  className={`relative w-11 h-5 rounded-full transition ${
                    editing.enabled ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition ${
                      editing.enabled ? 'left-6' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* 预览（居中弹窗样式，与用户端一致） */}
              <div className="pt-2">
                <div className="text-xs text-gray-400 mb-1.5">用户端预览（居中弹窗）</div>
                <div className="relative w-72 max-w-full mx-auto rounded-2xl border border-amber-500/30 bg-gradient-to-b from-[#14141c] to-[#0a0a0f] shadow-2xl overflow-hidden">
                  {/* banner */}
                  <div
                    className="relative h-20 flex items-center justify-center border-b border-amber-500/20"
                    style={{
                      background:
                        'radial-gradient(circle at 50% 50%, rgba(212,145,106,0.3) 0%, transparent 70%), linear-gradient(135deg, #2a1a14 0%, #14141c 100%)',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                      style={{
                        background: 'linear-gradient(135deg, #D4916A, #b8704f)',
                        boxShadow: '0 0 20px rgba(212,145,106,0.5)',
                      }}
                    >
                      {editing.icon}
                    </div>
                    <span className="absolute right-2.5 top-2.5 w-5 h-5 flex items-center justify-center rounded-full bg-black/40 text-xs text-white/60">
                      ×
                    </span>
                  </div>
                  {/* body */}
                  <div className="px-4 py-4">
                    <div className="flex justify-center mb-2">
                      <span
                        className="rounded px-2 py-0.5 text-[10px] font-medium"
                        style={{ background: 'rgba(212,145,106,0.12)', color: '#E8B589' }}
                      >
                        {editing.badge || '标签'}
                      </span>
                    </div>
                    <h3
                      className="text-center text-base font-bold mb-1"
                      style={{ fontFamily: "'KaiTi', 'STKaiti', '楷体', serif", color: '#E8B589' }}
                    >
                      {editing.title || '公告标题'}
                    </h3>
                    <p className="text-center text-xs text-gray-300 leading-relaxed mb-4">
                      {editing.content || '公告内容描述...'}
                    </p>
                    <div className="flex gap-2">
                      {editing.link && (
                        <span
                          className="flex-1 text-center py-1.5 rounded-lg text-xs font-semibold"
                          style={{
                            background: 'linear-gradient(135deg, #D4916A, #b8704f)',
                            color: '#1a0f08',
                          }}
                        >
                          {editing.linkText || '查看详情'}
                        </span>
                      )}
                      <span className="px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-300 text-xs">
                        知道了
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !editing.title}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition"
                >
                  {saving ? '保存中...' : isNew ? '创建公告' : '保存修改'}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-5 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg text-sm transition"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
