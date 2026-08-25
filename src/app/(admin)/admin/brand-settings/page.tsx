'use client';

import { useState, useEffect } from 'react';

export default function BrandSettingsPage() {
  const [brandName, setBrandName] = useState('');
  const [logo, setLogo] = useState('');
  const [tagline, setTagline] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/brand-settings');
      if (res.ok) {
        const d = await res.json();
        setBrandName(d.brandName || '');
        setLogo(d.logo || '');
        setTagline(d.tagline || '');
        setSupportEmail(d.supportEmail || '');
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleSave = async () => {
    if (!brandName.trim()) {
      showToast('网站名称不能为空');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/brand-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandName: brandName.trim(), logo: logo.trim(), tagline: tagline.trim(), supportEmail: supportEmail.trim() }),
      });
      if (res.ok) {
        showToast('保存成功，前台已生效');
      } else {
        const d = await res.json().catch(() => null);
        showToast(d?.error || '保存失败');
      }
    } catch {
      showToast('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setBrandName('');
    setLogo('');
    setTagline('');
    setSupportEmail('');
  };

  return (
    <div className="max-w-2xl">
      {toast && (
        <div className="fixed top-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm">
          {toast}
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">品牌设置</h2>
        <p className="text-sm text-gray-500">设置您网站的独立品牌，保存后前台导航、页脚、页面标题立即生效</p>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border p-10 text-center text-gray-400">加载中...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
          {/* 网站名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              网站名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={brandName}
              onChange={e => setBrandName(e.target.value)}
              placeholder="例如：知微阁、我的命理平台"
              className="w-full px-3 py-2 border rounded-lg text-sm"
              maxLength={30}
            />
            <p className="text-xs text-gray-400 mt-1">显示在导航栏、页脚和浏览器标题</p>
          </div>

          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo 图片地址</label>
            <input
              type="text"
              value={logo}
              onChange={e => setLogo(e.target.value)}
              placeholder="https://你的域名.com/logo.png（可留空）"
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
            {logo && (
              <div className="mt-3 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logo} alt="Logo 预览" className="max-w-full max-h-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <span className="text-xs text-gray-400">预览（若图片无法显示请检查地址是否可访问）</span>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1">建议使用正方形图片（如 128x128），可先上传到 public 目录或用图床地址</p>
          </div>

          {/* 标语 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">网站标语</label>
            <input
              type="text"
              value={tagline}
              onChange={e => setTagline(e.target.value)}
              placeholder="例如：传承千年智慧，融合现代科技（可留空）"
              className="w-full px-3 py-2 border rounded-lg text-sm"
              maxLength={60}
            />
            <p className="text-xs text-gray-400 mt-1">显示在页脚等位置</p>
          </div>

          {/* 联系邮箱 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">官方联系邮箱</label>
            <input
              type="email"
              value={supportEmail}
              onChange={e => setSupportEmail(e.target.value)}
              placeholder="例如：support@example.com"
              className="w-full px-3 py-2 border rounded-lg text-sm"
              maxLength={100}
            />
            <p className="text-xs text-gray-400 mt-1">用于服务条款、隐私政策、版权声明中展示的联系方式；留空则使用默认邮箱</p>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-2 border-t">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-2.5 border rounded-lg text-sm hover:bg-gray-50"
            >
              清空
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
