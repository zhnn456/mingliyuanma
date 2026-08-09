'use client';

import { useState, useEffect } from 'react';

interface AnnouncementConfig {
  enabled: boolean;
  icon: string;
  badge: string;
  title: string;
  content: string;
  link: string;
  linkText: string;
  dismissHours: number;
}

const DEFAULT: AnnouncementConfig = {
  enabled: true,
  icon: '🎁',
  badge: '新用户福利',
  title: '注册即送 100 灵珠',
  content: '灵珠可用于八字排盘、奇门遁甲、紫微斗数等全部功能，免费体验专业命理测算。',
  link: '/register',
  linkText: '立即注册',
  dismissHours: 24,
};

const ICONS = ['🎁', '📢', '🎉', '✨', '🔥', '💎', '🙏', '⭐', '🧧', '📜'];

export default function AdminAnnouncementPage() {
  const [config, setConfig] = useState<AnnouncementConfig>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/announcement');
      if (res.ok) {
        const d = await res.json();
        if (d.announcement) setConfig({ ...DEFAULT, ...d.announcement });
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/announcement', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {} finally {
      setSaving(false);
    }
  };

  const update = (key: keyof AnnouncementConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">公告管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理网站右下角弹出的公告浮层，修改后即时生效</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition"
        >
          {saving ? '保存中...' : saved ? '✓ 已保存' : '保存修改'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：编辑表单 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          {/* 启用开关 */}
          <div className="flex items-center justify-between">
            <label className="font-medium text-gray-700">启用公告</label>
            <button
              onClick={() => update('enabled', !config.enabled)}
              className={`relative w-12 h-6 rounded-full transition ${config.enabled ? 'bg-amber-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition ${config.enabled ? 'translate-x-6' : ''}`} />
            </button>
          </div>

          {/* 图标选择 */}
          <div>
            <label className="block font-medium text-gray-700 mb-2">图标</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map(ic => (
                <button
                  key={ic}
                  onClick={() => update('icon', ic)}
                  className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center border-2 transition ${
                    config.icon === ic ? 'border-amber-400 bg-amber-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* 标签文字 */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">标签文字</label>
            <input
              type="text"
              value={config.badge}
              onChange={e => update('badge', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400"
              placeholder="如：新用户福利"
            />
          </div>

          {/* 标题 */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">标题</label>
            <input
              type="text"
              value={config.title}
              onChange={e => update('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400"
              placeholder="如：注册即送 100 灵珠"
            />
          </div>

          {/* 内容 */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">内容描述</label>
            <textarea
              value={config.content}
              onChange={e => update('content', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 resize-none"
              placeholder="公告详细内容"
            />
          </div>

          {/* 链接 + 按钮文字 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 mb-1">跳转链接</label>
              <input
                type="text"
                value={config.link}
                onChange={e => update('link', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400"
                placeholder="/register"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">按钮文字</label>
              <input
                type="text"
                value={config.linkText}
                onChange={e => update('linkText', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400"
                placeholder="立即注册"
              />
            </div>
          </div>

          {/* 关闭记忆时长 */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              关闭后 {config.dismissHours} 小时内不再弹出
            </label>
            <input
              type="range"
              min="1"
              max="168"
              value={config.dismissHours}
              onChange={e => update('dismissHours', parseInt(e.target.value))}
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1小时</span>
              <span>24小时</span>
              <span>7天</span>
            </div>
          </div>
        </div>

        {/* 右侧：实时预览 */}
        <div>
          <div className="text-sm font-medium text-gray-500 mb-3">实时预览</div>
          <div className="bg-gray-100 rounded-xl p-6 min-h-[400px] relative">
            <div className="text-xs text-gray-400 mb-4">用户访问网站 2 秒后看到的效果：</div>

            {/* 预览浮层 */}
            {config.enabled ? (
              <div className="w-80 bg-white rounded-xl shadow-2xl border border-amber-200 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white">
                    <span className="text-base">{config.icon}</span>
                    <span className="font-semibold text-sm">{config.badge}</span>
                  </div>
                  <span className="text-white/70 text-lg leading-none">×</span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm">{config.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{config.content}</p>
                  <div className="flex gap-2">
                    <span className="flex-1 bg-amber-500 text-white text-center py-2 rounded-lg text-sm font-medium">
                      {config.linkText}
                    </span>
                    <span className="px-4 py-2 text-gray-500 text-sm">稍后</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-20">
                <div className="text-3xl mb-2">🔕</div>
                <div className="text-sm">公告已关闭，用户不会看到弹窗</div>
              </div>
            )}

            {/* 说明 */}
            <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
              <div className="text-xs text-gray-500 space-y-1">
                <div>• 修改后点击"保存修改"即时生效，无需重新部署</div>
                <div>• 用户关闭公告后 {config.dismissHours} 小时内不再弹出</div>
                <div>• 公告在所有页面都会显示（右下角）</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
