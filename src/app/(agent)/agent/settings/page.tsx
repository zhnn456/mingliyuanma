'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-client';

interface AgentInfo {
  id: string;
  companyName: string;
  brandName: string;
  domain: string | null;
  logo: string | null;
  contactName: string;
  contactPhone: string;
  licenseKey: string;
  licenseExpiry: string | null;
  isActive: boolean;
  siteConfig: any;
  level?: string;
  siteName?: string;
  themeColor?: string;
  customerServiceQR?: string;
  contactEmail?: string;
  contactWechat?: string;
  footerText?: string;
  announcement?: string;
}

export default function AgentSettingsPage() {
  const { user } = useAuth();
  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showLicense, setShowLicense] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    brandName: '',
    companyName: '',
    contactName: '',
    contactPhone: '',
    logo: '',
    siteName: '',
    themeColor: '#D4916A',
    customerServiceQR: '',
    contactEmail: '',
    contactWechat: '',
    footerText: '',
    announcement: '',
  });

  // 授权密钥脱敏：显示前 12 位 + **** + 后 4 位
  const maskLicenseKey = (key: string | undefined) => {
    if (!key) return '未分配';
    if (key.length <= 20) return key.slice(0, 8) + '****';
    return key.slice(0, 12) + '****' + key.slice(-4);
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/agent/settings');
        if (res.ok) {
          const d = await res.json();
          setAgent(d.agent);
          setForm({
            brandName: d.agent.brandName || '',
            companyName: d.agent.companyName || '',
            contactName: d.agent.contactName || '',
            contactPhone: d.agent.contactPhone || '',
            logo: d.agent.logo || '',
            siteName: d.agent.siteName || '',
            themeColor: d.agent.themeColor || '#D4916A',
            customerServiceQR: d.agent.customerServiceQR || '',
            contactEmail: d.agent.contactEmail || '',
            contactWechat: d.agent.contactWechat || '',
            footerText: d.agent.footerText || '',
            announcement: d.agent.announcement || '',
          });
        }
      } catch {}
      setLoading(false);
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/agent/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const d = await res.json();
        setAgent(d.agent);
        setMessage('保存成功');
        setTimeout(() => setMessage(''), 2000);
      } else {
        const e = await res.json();
        setMessage(e.error || '保存失败');
      }
    } catch {
      setMessage('网络错误');
    }
    setSaving(false);
  };

  if (loading) return <div className="text-center py-20 text-gray-400">加载中...</div>;

  const fmtDate = (s: string | null) =>
    s ? new Date(s).toLocaleDateString('zh-CN') : '永久';

  const siteConfig = agent?.siteConfig || {};
  const maxUsers = siteConfig.maxUsers ?? 1000;
  const customPricing = siteConfig.customPricing ?? false;
  const whiteLabel = siteConfig.whiteLabel ?? false;
  const level = siteConfig.level || 'basic';
  const monthlyFee = siteConfig.monthlyFee ?? 99;

  const levelMap: Record<string, string> = {
    basic: '基础版',
    standard: '标准版',
    premium: '高级版',
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">代理设置</h1>

      {/* ============ 品牌信息（可编辑） ============ */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-bold text-gray-800 mb-4">品牌信息</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">网站名称 <span className="text-red-500">*</span></label>
            <input
              value={form.brandName}
              onChange={(e) => setForm({ ...form, brandName: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="如：玄机阁、天机阁等，将显示在网站各处"
            />
            <p className="text-xs text-gray-400 mt-1">此名称将自动显示在法律声明、关于我们等页面中</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">公司名称</label>
            <input
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="公司全称"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">联系人</label>
              <input
                value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="联系人姓名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
              <input
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="联系电话"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
            <input
              value={form.logo}
              onChange={(e) => setForm({ ...form, logo: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="https://..."
            />
          </div>
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
            {message && (
              <span className={`text-sm ${message === '保存成功' ? 'text-green-600' : 'text-red-500'}`}>{message}</span>
            )}
          </div>
        </div>
      </div>

      {/* ============ 品牌定制（可编辑） ============ */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-bold text-gray-800 mb-4">品牌定制</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">站点名称</label>
            <input
              value={form.siteName}
              onChange={(e) => setForm({ ...form, siteName: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="如：玄机阁·专业命理平台"
            />
            <p className="text-xs text-gray-400 mt-1">显示在浏览器标题栏与站点头部</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">主题色</label>
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="color"
                value={form.themeColor || '#D4916A'}
                onChange={(e) => setForm({ ...form, themeColor: e.target.value })}
                className="w-10 h-10 rounded-lg border cursor-pointer p-1 bg-white"
              />
              <input
                value={form.themeColor}
                onChange={(e) => setForm({ ...form, themeColor: e.target.value })}
                className="w-32 px-3 py-2 border rounded-lg text-sm font-mono"
                placeholder="#D4916A"
              />
              <div className="flex items-center gap-2">
                {[
                  { c: '#D4916A', n: '暖橙' },
                  { c: '#1a3a2e', n: '墨绿' },
                  { c: '#6366f1', n: '靛蓝' },
                  { c: '#dc2626', n: '朱红' },
                  { c: '#0ea5e9', n: '天蓝' },
                ].map((p) => (
                  <button
                    key={p.c}
                    type="button"
                    onClick={() => setForm({ ...form, themeColor: p.c })}
                    title={`${p.n} ${p.c}`}
                    className={`w-7 h-7 rounded-full border-2 transition-colors ${form.themeColor === p.c ? 'border-gray-800' : 'border-gray-200 hover:border-gray-400'}`}
                    style={{ backgroundColor: p.c }}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">默认 #D4916A（暖橙），影响站点主要按钮与强调色</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">客服二维码</label>
            <div className="flex items-start gap-3">
              <input
                value={form.customerServiceQR}
                onChange={(e) => setForm({ ...form, customerServiceQR: e.target.value })}
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
                placeholder="二维码图片URL，https://..."
              />
              {form.customerServiceQR && (
                <img
                  src={form.customerServiceQR}
                  alt="客服二维码预览"
                  className="w-16 h-16 rounded-lg border object-cover bg-gray-50"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">客服微信二维码图片地址，将在客服联系处展示</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">联系邮箱</label>
              <input
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="support@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">微信号</label>
              <input
                value={form.contactWechat}
                onChange={(e) => setForm({ ...form, contactWechat: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="微信号"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">页脚文字</label>
            <input
              value={form.footerText}
              onChange={(e) => setForm({ ...form, footerText: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="如：© 2026 玄机阁 版权所有"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">站点公告</label>
            <textarea
              value={form.announcement}
              onChange={(e) => setForm({ ...form, announcement: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm min-h-[80px] resize-y"
              placeholder="向用户展示的站点公告，如促销、维护通知等"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
            {message && (
              <span className={`text-sm ${message === '保存成功' ? 'text-green-600' : 'text-red-500'}`}>{message}</span>
            )}
          </div>
        </div>
      </div>

      {/* ============ 授权与商业信息（只读） ============ */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-bold text-gray-800 mb-4">授权与商业信息</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">授权状态</div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${agent?.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-medium text-sm">{agent?.isActive ? '正常' : '已禁用'}</span>
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">代理等级</div>
            <div className="font-medium text-sm">{levelMap[level] || level}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">授权到期</div>
            <div className="font-medium text-sm">{fmtDate(agent?.licenseExpiry || null)}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">绑定域名</div>
            <div className="font-medium text-sm">{agent?.domain || '未绑定'}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">最大客户数</div>
            <div className="font-medium text-sm">{maxUsers} 人</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">月费标准</div>
            <div className="font-medium text-sm">¥{monthlyFee}/月</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">自定义定价</div>
            <div className={`text-sm font-medium ${customPricing ? 'text-green-600' : 'text-gray-400'}`}>
              {customPricing ? '已开启' : '未开启'}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">白标模式</div>
            <div className={`text-sm font-medium ${whiteLabel ? 'text-green-600' : 'text-gray-400'}`}>
              {whiteLabel ? '已开启' : '未开启'}
            </div>
          </div>
        </div>
        <div className="mt-3 p-3 bg-blue-50 rounded-lg text-xs text-blue-600">
          以上信息由平台管理员设置，如需修改请联系平台管理员
        </div>
      </div>

      {/* ============ 授权密钥（仅源码部署代理可见） ============ */}
      {agent?.level === 'source' && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-bold text-gray-800 mb-4">授权密钥</h3>
          <div className="p-3 bg-gray-50 rounded-lg font-mono text-xs text-gray-700 break-all flex items-center justify-between gap-3">
            <span>
              {showLicense ? (agent?.licenseKey || '未分配') : maskLicenseKey(agent?.licenseKey)}
            </span>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setShowLicense(!showLicense)}
                className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded text-gray-700 transition-colors"
              >
                {showLicense ? '隐藏' : '显示'}
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(agent?.licenseKey || '');
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                {copied ? '已复制' : '复制'}
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            此密钥用于源码部署时验证授权身份，请妥善保管。如需重新生成，请联系平台管理员。
          </p>
        </div>
      )}

      {/* SaaS 代理显示提示 */}
      {agent?.level === 'saas' && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
          <h3 className="font-bold text-blue-900 mb-2">授权信息</h3>
          <p className="text-sm text-blue-700">
            您当前为 SaaS 托管模式，由平台统一管理部署和运维，无需使用授权密钥。
            如需升级为源码部署模式（独立部署、100% 收入归己），请联系平台管理员。
          </p>
        </div>
      )}

      {/* ============ 账号信息 ============ */}
      {user && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-bold text-gray-800 mb-3">账号信息</h3>
          <div className="text-sm space-y-2">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">登录邮箱</span>
              <span className="text-gray-900">{user.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">代理商ID</span>
              <span className="text-gray-900 font-mono text-xs">{agent?.id}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">账号角色</span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">代理商</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
