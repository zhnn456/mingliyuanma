'use client';

import { useEffect, useState } from 'react';

// ==================== 类型定义 ====================

interface PaymentConfigForm {
  wechatAppId: string;
  wechatMchId: string;
  wechatApiV3Key: string;
  wechatCertSerial: string;
  wechatNotifyUrl: string;
  alipayAppId: string;
  alipayNotifyUrl: string;
  alipayReturnUrl: string;
  alipayGateway: string;
}

interface ConfiguredState {
  wechatPrivateKey: boolean;
  alipayPrivateKey: boolean;
  alipayPublicKey: boolean;
}

interface SensitiveInputs {
  wechatPrivateKey: string;
  alipayPrivateKey: string;
  alipayPublicKey: string;
}

interface TestResult {
  ok: boolean;
  message: string;
}

const DEFAULT_FORM: PaymentConfigForm = {
  wechatAppId: '',
  wechatMchId: '',
  wechatApiV3Key: '',
  wechatCertSerial: '',
  wechatNotifyUrl: '',
  alipayAppId: '',
  alipayNotifyUrl: '',
  alipayReturnUrl: '',
  alipayGateway: 'https://openapi.alipay.com/gateway.do',
};

const INPUT_CLASS =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent';

export default function AdminPaymentConfigPage() {
  const [form, setForm] = useState<PaymentConfigForm>(DEFAULT_FORM);
  const [sensitive, setSensitive] = useState<SensitiveInputs>({
    wechatPrivateKey: '',
    alipayPrivateKey: '',
    alipayPublicKey: '',
  });
  const [configured, setConfigured] = useState<ConfiguredState>({
    wechatPrivateKey: false,
    alipayPrivateKey: false,
    alipayPublicKey: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<{ wechat: boolean; alipay: boolean }>({
    wechat: false,
    alipay: false,
  });
  const [testResult, setTestResult] = useState<{ wechat: TestResult | null; alipay: TestResult | null }>({
    wechat: null,
    alipay: null,
  });
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [updatedAt, setUpdatedAt] = useState('');

  // 加载配置
  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payment-config');
      if (res.ok) {
        const d = await res.json();
        const c = d.config || {};
        setForm({
          wechatAppId: c.wechatAppId || '',
          wechatMchId: c.wechatMchId || '',
          wechatApiV3Key: c.wechatApiV3Key || '',
          wechatCertSerial: c.wechatCertSerial || '',
          wechatNotifyUrl: c.wechatNotifyUrl || '',
          alipayAppId: c.alipayAppId || '',
          alipayNotifyUrl: c.alipayNotifyUrl || '',
          alipayReturnUrl: c.alipayReturnUrl || '',
          alipayGateway: c.alipayGateway || 'https://openapi.alipay.com/gateway.do',
        });
        setConfigured({
          wechatPrivateKey: !!c.wechatPrivateKeyConfigured,
          alipayPrivateKey: !!c.alipayPrivateKeyConfigured,
          alipayPublicKey: !!c.alipayPublicKeyConfigured,
        });
        setUpdatedAt(c.updatedAt || '');
      }
    } catch {
      setMsg({ type: 'error', text: '加载配置失败，请刷新重试' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/payment-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ...sensitive }),
      });
      if (res.ok) {
        // 保存后清空敏感输入框，重新加载以刷新"已配置"状态
        setSensitive({ wechatPrivateKey: '', alipayPrivateKey: '', alipayPublicKey: '' });
        await loadConfig();
        setMsg({ type: 'success', text: '支付配置保存成功' });
      } else {
        const d = await res.json().catch(() => ({}));
        setMsg({ type: 'error', text: d.error || '保存失败' });
      }
    } catch {
      setMsg({ type: 'error', text: '网络错误，请重试' });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest(target: 'wechat' | 'alipay') {
    setTesting((prev) => ({ ...prev, [target]: true }));
    setTestResult((prev) => ({ ...prev, [target]: null }));
    try {
      const res = await fetch('/api/admin/payment-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', target }),
      });
      const d = await res.json().catch(() => ({ ok: false, message: '响应解析失败' }));
      setTestResult((prev) => ({
        ...prev,
        [target]: { ok: !!d.ok, message: d.message || (d.ok ? '连接成功' : '连接失败') },
      }));
    } catch {
      setTestResult((prev) => ({
        ...prev,
        [target]: { ok: false, message: '网络错误，请重试' },
      }));
    } finally {
      setTesting((prev) => ({ ...prev, [target]: false }));
    }
  }

  const formatDate = (s: string) => {
    if (!s) return '';
    try {
      return new Date(s).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return s;
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">支付配置</h2>
          <p className="text-sm text-gray-500 mt-1">
            微信支付与支付宝参数配置 · 敏感信息加密存储
            {updatedAt && <span className="ml-2 text-gray-400">· 更新于 {formatDate(updatedAt)}</span>}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:from-red-600 hover:to-orange-600 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M5 13l4 4L19 7" />
          </svg>
          {saving ? '保存中...' : '保存配置'}
        </button>
      </div>

      {/* 操作提示 */}
      {msg && (
        <div
          className={`px-4 py-2.5 rounded-lg text-sm flex items-center justify-between ${
            msg.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="text-current opacity-60 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-orange-500 rounded-full mx-auto mb-2" />
          加载中...
        </div>
      ) : (
        <>
          {/* ==================== 微信支付配置 ==================== */}
          <div className="bg-white rounded-xl border border-orange-200 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center text-lg">
                  💬
                </div>
                <div>
                  <div className="font-bold">微信支付配置</div>
                  <div className="text-xs opacity-80">V3 API · 公众号 / 小程序 / 扫码</div>
                </div>
              </div>
              <button
                onClick={() => handleTest('wechat')}
                disabled={testing.wechat}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {testing.wechat ? (
                  <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
                {testing.wechat ? '测试中...' : '测试连接'}
              </button>
            </div>

            <div className="p-5 space-y-4">
              {testResult.wechat && (
                <div
                  className={`px-3 py-2 rounded-lg text-xs flex items-start gap-2 ${
                    testResult.wechat.ok
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}
                >
                  <span className="font-medium">{testResult.wechat.ok ? '✓' : '✕'}</span>
                  <span className="flex-1">{testResult.wechat.message}</span>
                  <button
                    onClick={() => setTestResult((p) => ({ ...p, wechat: null }))}
                    className="opacity-60 hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="App ID"
                  hint="微信公众号 / 小程序 AppID"
                  value={form.wechatAppId}
                  onChange={(v) => setForm((f) => ({ ...f, wechatAppId: v }))}
                  placeholder="wx1234567890abcdef"
                />
                <Field
                  label="商户号 (Mch ID)"
                  value={form.wechatMchId}
                  onChange={(v) => setForm((f) => ({ ...f, wechatMchId: v }))}
                  placeholder="1234567890"
                />
                <Field
                  label="API V3 密钥"
                  value={form.wechatApiV3Key}
                  onChange={(v) => setForm((f) => ({ ...f, wechatApiV3Key: v }))}
                  placeholder="32 位 APIv3 密钥"
                  mono
                />
                <Field
                  label="证书序列号"
                  value={form.wechatCertSerial}
                  onChange={(v) => setForm((f) => ({ ...f, wechatCertSerial: v }))}
                  placeholder="商户证书序列号"
                  mono
                />
              </div>

              <Field
                label="回调通知 URL"
                value={form.wechatNotifyUrl}
                onChange={(v) => setForm((f) => ({ ...f, wechatNotifyUrl: v }))}
                placeholder="https://your-domain.com/api/payment/wechat/notify"
              />

              <SensitiveField
                label="商户私钥"
                hint="PEM 格式，RSA 商户私钥"
                configured={configured.wechatPrivateKey}
                value={sensitive.wechatPrivateKey}
                onChange={(v) => setSensitive((s) => ({ ...s, wechatPrivateKey: v }))}
              />
            </div>
          </div>

          {/* ==================== 支付宝配置 ==================== */}
          <div className="bg-white rounded-xl border border-amber-200 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center text-lg">
                  🔵
                </div>
                <div>
                  <div className="font-bold">支付宝配置</div>
                  <div className="text-xs opacity-80">RSA2 签名 · 当面付 / 网站支付</div>
                </div>
              </div>
              <button
                onClick={() => handleTest('alipay')}
                disabled={testing.alipay}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {testing.alipay ? (
                  <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
                {testing.alipay ? '测试中...' : '测试连接'}
              </button>
            </div>

            <div className="p-5 space-y-4">
              {testResult.alipay && (
                <div
                  className={`px-3 py-2 rounded-lg text-xs flex items-start gap-2 ${
                    testResult.alipay.ok
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}
                >
                  <span className="font-medium">{testResult.alipay.ok ? '✓' : '✕'}</span>
                  <span className="flex-1">{testResult.alipay.message}</span>
                  <button
                    onClick={() => setTestResult((p) => ({ ...p, alipay: null }))}
                    className="opacity-60 hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              )}

              <Field
                label="App ID"
                value={form.alipayAppId}
                onChange={(v) => setForm((f) => ({ ...f, alipayAppId: v }))}
                placeholder="2016...开头的应用 ID"
              />

              <SensitiveField
                label="商户私钥"
                hint="PEM 格式，RSA2 商户私钥"
                configured={configured.alipayPrivateKey}
                value={sensitive.alipayPrivateKey}
                onChange={(v) => setSensitive((s) => ({ ...s, alipayPrivateKey: v }))}
              />

              <SensitiveField
                label="支付宝公钥"
                hint="PEM 格式，支付宝公钥（用于验签）"
                configured={configured.alipayPublicKey}
                value={sensitive.alipayPublicKey}
                onChange={(v) => setSensitive((s) => ({ ...s, alipayPublicKey: v }))}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="回调通知 URL"
                  value={form.alipayNotifyUrl}
                  onChange={(v) => setForm((f) => ({ ...f, alipayNotifyUrl: v }))}
                  placeholder="https://your-domain.com/api/payment/alipay/notify"
                />
                <Field
                  label="同步返回 URL"
                  value={form.alipayReturnUrl}
                  onChange={(v) => setForm((f) => ({ ...f, alipayReturnUrl: v }))}
                  placeholder="https://your-domain.com/pay/return"
                />
              </div>

              <Field
                label="网关地址"
                value={form.alipayGateway}
                onChange={(v) => setForm((f) => ({ ...f, alipayGateway: v }))}
                placeholder="https://openapi.alipay.com/gateway.do"
                mono
              />
            </div>
          </div>

          {/* 底部保存按钮 */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <span className="text-xs text-gray-400">
              敏感字段（私钥/公钥）已配置项将加密存储，留空保存表示不修改
            </span>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:from-red-600 hover:to-orange-600 transition-all disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存配置'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ==================== 普通输入字段 ====================

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${INPUT_CLASS} ${mono ? 'font-mono' : ''}`}
      />
    </div>
  );
}

// ==================== 敏感字段（textarea + 配置状态） ====================

function SensitiveField({
  label,
  hint,
  configured,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  configured: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            configured
              ? 'bg-green-100 text-green-700 border border-green-200'
              : 'bg-gray-100 text-gray-500 border border-gray-200'
          }`}
        >
          {configured ? '● 已配置' : '○ 未配置'}
        </span>
      </div>
      {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        placeholder={
          configured
            ? '已配置，留空保存表示不修改；如需更新请粘贴新的 PEM 内容'
            : '尚未配置，请粘贴 PEM 格式内容'
        }
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
          value ? 'bg-orange-50/40 border-orange-300' : ''
        }`}
      />
    </div>
  );
}
