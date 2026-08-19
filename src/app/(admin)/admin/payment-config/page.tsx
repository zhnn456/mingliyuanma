'use client';

import { useEffect, useState, useCallback } from 'react';

// ==================== 类型定义 ====================

interface PaymentConfigForm {
  // 微信
  wechatAppId: string;
  wechatMchId: string;
  wechatApiV3Key: string;
  wechatCertSerial: string;
  wechatNotifyUrl: string;
  // 支付宝
  alipayAppId: string;
  alipayNotifyUrl: string;
  alipayReturnUrl: string;
  alipayGateway: string;
  // ZPay
  zpayPid: string;
  zpayApiUrl: string;
  zpayNotifyUrl: string;
  zpayReturnUrl: string;
  // PayPal
  paypalClientId: string;
  paypalMode: string;
  paypalNotifyUrl: string;
  // Stripe
  stripePublishableKey: string;
  stripeWebhookSecret: string;
  stripeNotifyUrl: string;
  // 个人收款码
  personalQrUrl: string;
  personalQrType: 'wechat' | 'alipay' | 'unionpay';
}

interface SensitiveInputs {
  wechatPrivateKey: string;
  alipayPrivateKey: string;
  alipayPublicKey: string;
  zpayKey: string;
  paypalClientSecret: string;
  stripeSecretKey: string;
}

interface ConfiguredState {
  wechatPrivateKey: boolean;
  alipayPrivateKey: boolean;
  alipayPublicKey: boolean;
  zpayKey: boolean;
  paypalClientSecret: boolean;
  stripeSecretKey: boolean;
}

interface TestResult {
  ok: boolean;
  message: string;
}

const DEFAULT_FORM: PaymentConfigForm = {
  wechatAppId: '', wechatMchId: '', wechatApiV3Key: '', wechatCertSerial: '', wechatNotifyUrl: '',
  alipayAppId: '', alipayNotifyUrl: '', alipayReturnUrl: '', alipayGateway: 'https://openapi.alipay.com/gateway.do',
  zpayPid: '', zpayApiUrl: '', zpayNotifyUrl: '', zpayReturnUrl: '',
  paypalClientId: '', paypalMode: 'sandbox', paypalNotifyUrl: '',
  stripePublishableKey: '', stripeWebhookSecret: '', stripeNotifyUrl: '',
  personalQrUrl: '', personalQrType: 'wechat',
};

const INPUT_CLASS = 'w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent';
const LABEL_CLASS = 'block text-xs font-medium text-gray-600 mb-0.5';

// ==================== 支付方式元数据 ====================

const PAYMENT_METHODS = [
  {
    key: 'zpay',
    title: 'ZPay 易支付',
    icon: '⚡',
    color: 'blue',
    badge: '推荐',
    badgeColor: 'bg-green-100 text-green-700 border-green-200',
    prerequisite: '无需公司资质，个人即可接入。支持微信/支付宝/QQ钱包等多种支付方式。',
    recommend: '推荐使用。聚合支付平台，接入简单，费率低（1%-2%），无需ICP备案（部分平台）。',
    docs: '注册易支付平台 → 获取商户ID和密钥 → 配置API地址和回调URL',
  },
  {
    key: 'personal-qr',
    title: '个人收款码',
    icon: '📱',
    color: 'rose',
    badge: '零费率',
    badgeColor: 'bg-rose-100 text-rose-700 border-rose-200',
    prerequisite: '无需任何资质，只需个人微信/支付宝收款码图片。用户扫码付款后联系客服核销订单。',
    recommend: '零费率，接入最简单。适合个人站、早期小单量场景。无自动回调，需人工核销。',
    docs: '保存个人微信/支付宝收款码图片到服务器或图床 → 填入图片URL → 选择收款码类型',
  },
  {
    key: 'wechat',
    title: '微信支付（直连）',
    icon: '💬',
    color: 'green',
    badge: '需资质',
    badgeColor: 'bg-orange-100 text-orange-700 border-orange-200',
    prerequisite: '需要：①国内公司或个体户 ②国内ICP备案域名 ③微信商户平台认证 ④对公账户或法人微信',
    recommend: '费率0.6%，但接入门槛高。如无公司资质，建议使用 ZPay 易支付替代。',
    docs: '微信商户平台 → 申请JSAPI/扫码支付 → 获取AppID/商户号/密钥/证书',
  },
  {
    key: 'alipay',
    title: '支付宝（直连）',
    icon: '🔵',
    color: 'amber',
    badge: '需资质',
    badgeColor: 'bg-orange-100 text-orange-700 border-orange-200',
    prerequisite: '需要：①国内公司或个体户 ②国内ICP备案域名 ③支付宝商户账号 ④RSA2密钥对',
    recommend: '费率0.6%，但接入门槛高。如无公司资质，建议使用 ZPay 易支付替代。',
    docs: '支付宝开放平台 → 创建应用 → 配置密钥 → 获取AppID/私钥/公钥',
  },
  {
    key: 'paypal',
    title: 'PayPal',
    icon: '🅿️',
    color: 'indigo',
    badge: '国际',
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
    prerequisite: '需要：①PayPal商家账号 ②国际信用卡或银行账户 ③HTTPS域名（无需国内备案）',
    recommend: '面向海外用户收费时使用。费率4.4%+固定费用，支持多币种。',
    docs: 'PayPal Developer → 创建REST App → 获取Client ID/Secret → 配置Webhook',
  },
  {
    key: 'stripe',
    title: 'Stripe',
    icon: '💳',
    color: 'purple',
    badge: '国际',
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
    prerequisite: '需要：①国外公司实体（如美国LLC/新加坡公司）②国外银行账户 ③HTTPS域名',
    recommend: '面向海外用户的高级支付方案。费率2.9%+0.30美元，支持信用卡/Apple Pay/Google Pay。',
    docs: 'Stripe Dashboard → 获取API Keys → 配置Webhook → 集成Payment Intent',
  },
  {
    key: 'card-key',
    title: '卡密兑换',
    icon: '🎫',
    color: 'teal',
    badge: '内置',
    badgeColor: 'bg-teal-100 text-teal-700 border-teal-200',
    prerequisite: '无需外部配置，系统内置功能。在「卡密管理」页面批量生成卡密，用户输入卡密兑换会员。',
    recommend: '适合线下销售或代理分销。无需支付通道，零费率。',
    docs: '卡密管理 → 批量生成 → 设置面值和有效期 → 分发给用户',
  },
] as const;

const COLOR_MAP: Record<string, { border: string; header: string; headerText: string }> = {
  blue: { border: 'border-blue-200', header: 'bg-blue-50', headerText: 'text-blue-700' },
  green: { border: 'border-green-200', header: 'bg-green-50', headerText: 'text-green-700' },
  amber: { border: 'border-amber-200', header: 'bg-amber-50', headerText: 'text-amber-700' },
  indigo: { border: 'border-indigo-200', header: 'bg-indigo-50', headerText: 'text-indigo-700' },
  purple: { border: 'border-purple-200', header: 'bg-purple-50', headerText: 'text-purple-700' },
  teal: { border: 'border-teal-200', header: 'bg-teal-50', headerText: 'text-teal-700' },
};

// ==================== 主组件 ====================

export default function AdminPaymentConfigPage() {
  const [form, setForm] = useState<PaymentConfigForm>(DEFAULT_FORM);
  const [sensitive, setSensitive] = useState<SensitiveInputs>({
    wechatPrivateKey: '', alipayPrivateKey: '', alipayPublicKey: '',
    zpayKey: '', paypalClientSecret: '', stripeSecretKey: '',
  });
  const [configured, setConfigured] = useState<ConfiguredState>({
    wechatPrivateKey: false, alipayPrivateKey: false, alipayPublicKey: false,
    zpayKey: false, paypalClientSecret: false, stripeSecretKey: false,
  });
  const [enabledMethods, setEnabledMethods] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, TestResult | null>>({});
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [updatedAt, setUpdatedAt] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set(['zpay']));

  useEffect(() => { loadConfig(); }, []);

  async function loadConfig() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payment-config');
      if (res.ok) {
        const d = await res.json();
        const c = d.config || {};
        setForm({
          wechatAppId: c.wechatAppId || '', wechatMchId: c.wechatMchId || '',
          wechatApiV3Key: c.wechatApiV3Key || '', wechatCertSerial: c.wechatCertSerial || '',
          wechatNotifyUrl: c.wechatNotifyUrl || '',
          alipayAppId: c.alipayAppId || '', alipayNotifyUrl: c.alipayNotifyUrl || '',
          alipayReturnUrl: c.alipayReturnUrl || '',
          alipayGateway: c.alipayGateway || 'https://openapi.alipay.com/gateway.do',
          zpayPid: c.zpayPid || '', zpayApiUrl: c.zpayApiUrl || '',
          zpayNotifyUrl: c.zpayNotifyUrl || '', zpayReturnUrl: c.zpayReturnUrl || '',
          paypalClientId: c.paypalClientId || '', paypalMode: c.paypalMode || 'sandbox',
          paypalNotifyUrl: c.paypalNotifyUrl || '',
          stripePublishableKey: c.stripePublishableKey || '',
          stripeWebhookSecret: c.stripeWebhookSecret || '',
          stripeNotifyUrl: c.stripeNotifyUrl || '',
          personalQrUrl: c.personalQrUrl || '',
          personalQrType: c.personalQrType || 'wechat',
        });
        setConfigured({
          wechatPrivateKey: !!c.wechatPrivateKeyConfigured,
          alipayPrivateKey: !!c.alipayPrivateKeyConfigured,
          alipayPublicKey: !!c.alipayPublicKeyConfigured,
          zpayKey: !!c.zpayKeyConfigured,
          paypalClientSecret: !!c.paypalClientSecretConfigured,
          stripeSecretKey: !!c.stripeSecretKeyConfigured,
        });
        setEnabledMethods(c.enabledMethods || []);
        setUpdatedAt(c.updatedAt || '');
      }
    } catch {
      setMsg({ type: 'error', text: '加载配置失败，请刷新重试' });
    } finally {
      setLoading(false);
    }
  }

  const toggleCard = useCallback((key: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleMethod = useCallback((key: string) => {
    setEnabledMethods(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }, []);

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/payment-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ...sensitive, enabledMethods }),
      });
      if (res.ok) {
        setSensitive({ wechatPrivateKey: '', alipayPrivateKey: '', alipayPublicKey: '', zpayKey: '', paypalClientSecret: '', stripeSecretKey: '' });
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

  async function handleTest(target: string) {
    setTesting(prev => ({ ...prev, [target]: true }));
    setTestResults(prev => ({ ...prev, [target]: null }));
    try {
      const res = await fetch('/api/admin/payment-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', target }),
      });
      const d = await res.json().catch(() => ({ ok: false, message: '响应解析失败' }));
      setTestResults(prev => ({
        ...prev,
        [target]: { ok: !!d.ok, message: d.message || (d.ok ? '连接成功' : '连接失败') },
      }));
    } catch {
      setTestResults(prev => ({ ...prev, [target]: { ok: false, message: '网络错误' } }));
    } finally {
      setTesting(prev => ({ ...prev, [target]: false }));
    }
  }

  const setField = (field: keyof PaymentConfigForm, value: string) =>
    setForm(f => ({ ...f, [field]: value }));
  const setSensitiveField = (field: keyof SensitiveInputs, value: string) =>
    setSensitive(s => ({ ...s, [field]: value }));

  const formatDate = (s: string) => {
    if (!s) return '';
    try {
      return new Date(s).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch { return s; }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full mx-auto mb-2" />
        加载中...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">支付配置</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            支持多种支付方式 · 敏感信息加密存储
            {updatedAt && <span className="ml-2 text-gray-400">· 更新于 {formatDate(updatedAt)}</span>}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存配置'}
        </button>
      </div>

      {/* 操作提示 */}
      {msg && (
        <div className={`px-3 py-2 rounded-lg text-xs flex items-center justify-between ${msg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* 先决条件说明区域 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-1.5">
          <span>📋</span> 接入指南与先决条件
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-white rounded-md p-3 border border-blue-100">
            <div className="font-medium text-gray-800 mb-1">🇨🇳 国内支付（微信/支付宝直连）</div>
            <ul className="text-gray-600 space-y-0.5 list-disc list-inside">
              <li>需要国内公司或个体户营业执照</li>
              <li>需要国内ICP备案域名</li>
              <li>需要对应平台的商户账号</li>
              <li>费率约0.6%</li>
            </ul>
          </div>
          <div className="bg-white rounded-md p-3 border border-blue-100">
            <div className="font-medium text-gray-800 mb-1">⚡ 第三方聚合支付（ZPay 易支付）</div>
            <ul className="text-gray-600 space-y-0.5 list-disc list-inside">
              <li>无需公司资质，个人即可接入</li>
              <li>支持微信/支付宝/QQ钱包等多种方式</li>
              <li>部分平台无需ICP备案</li>
              <li>费率约1%-2%，接入简单</li>
            </ul>
          </div>
          <div className="bg-white rounded-md p-3 border border-rose-100">
            <div className="font-medium text-gray-800 mb-1">📱 个人收款码（零费率）</div>
            <ul className="text-gray-600 space-y-0.5 list-disc list-inside">
              <li>无需任何资质，个人即可使用</li>
              <li>直接展示微信/支付宝个人收款码</li>
              <li>用户扫码付款后联系客服核销</li>
              <li>零费率，但无自动回调</li>
            </ul>
          </div>
          <div className="bg-white rounded-md p-3 border border-blue-100">
            <div className="font-medium text-gray-800 mb-1">🌍 国际支付（PayPal）</div>
            <ul className="text-gray-600 space-y-0.5 list-disc list-inside">
              <li>需要PayPal商家账号</li>
              <li>需要国际信用卡或银行账户</li>
              <li>HTTPS域名，无需国内备案</li>
              <li>费率约4.4%，支持多币种</li>
            </ul>
          </div>
          <div className="bg-white rounded-md p-3 border border-blue-100">
            <div className="font-medium text-gray-800 mb-1">💳 国际支付（Stripe）</div>
            <ul className="text-gray-600 space-y-0.5 list-disc list-inside">
              <li>需要国外公司实体（如美国LLC）</li>
              <li>需要国外银行账户</li>
              <li>HTTPS域名</li>
              <li>费率约2.9%+$0.30，支持信用卡</li>
            </ul>
          </div>
        </div>
        <div className="mt-2 text-xs text-blue-700 bg-blue-100 rounded-md px-3 py-1.5">
          💡 <b>推荐</b>：如无国内公司资质，建议使用 <b>ZPay 易支付</b> 接入微信/支付宝；面向海外用户时使用 <b>PayPal</b>。
        </div>
      </div>

      {/* ==================== 2列网格布局 ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {PAYMENT_METHODS.map((method) => {
          const colors = COLOR_MAP[method.color] || COLOR_MAP.blue;
          const isExpanded = expandedCards.has(method.key);
          const isEnabled = enabledMethods.includes(method.key);
          const testResult = testResults[method.key];
          const isTesting = testing[method.key];

          return (
            <div key={method.key} className={`bg-white rounded-lg border ${colors.border} overflow-hidden flex flex-col`}>
              {/* 卡片头部 */}
              <div className={`${colors.header} px-4 py-2.5 flex items-center justify-between`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center text-base shadow-sm">
                    {method.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-semibold ${colors.headerText}`}>{method.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${method.badgeColor}`}>
                        {method.badge}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {isEnabled ? '✓ 已启用' : '○ 未启用'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {method.key !== 'card-key' && (
                    <button
                      onClick={() => handleTest(method.key)}
                      disabled={isTesting}
                      className="px-2 py-1 bg-white border border-gray-300 rounded text-[10px] font-medium hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1"
                    >
                      {isTesting ? <span className="animate-spin inline-block w-2.5 h-2.5 border-2 border-gray-400 border-t-transparent rounded-full" /> : null}
                      {isTesting ? '测试...' : '测试'}
                    </button>
                  )}
                  {/* 启用开关 */}
                  <button
                    onClick={() => toggleMethod(method.key)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-4' : 'translate-x-1'}`} />
                  </button>
                  {/* 展开/折叠 */}
                  <button onClick={() => toggleCard(method.key)} className="text-gray-400 hover:text-gray-600 px-1">
                    <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* 测试结果 */}
              {testResult && (
                <div className={`px-3 py-1.5 text-[11px] flex items-start gap-1.5 ${testResult.ok ? 'bg-green-50 border-b border-green-200 text-green-700' : 'bg-red-50 border-b border-red-200 text-red-700'}`}>
                  <span className="font-medium">{testResult.ok ? '✓' : '✕'}</span>
                  <span className="flex-1">{testResult.message}</span>
                  <button onClick={() => setTestResults(p => ({ ...p, [method.key]: null }))} className="opacity-60 hover:opacity-100">✕</button>
                </div>
              )}

              {/* 先决条件提示（始终显示） */}
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                <div className="text-[11px] text-gray-600">
                  <span className="font-medium text-gray-700">先决条件：</span>{method.prerequisite}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  <span className="font-medium text-gray-600">建议：</span>{method.recommend}
                </div>
              </div>

              {/* 展开后的配置表单 */}
              {isExpanded && (
                <div className="p-3 space-y-2 flex-1">
                  {method.key === 'zpay' && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <Field label="商户ID (PID)" value={form.zpayPid} onChange={v => setField('zpayPid', v)} placeholder="10000" />
                        <Field label="API地址" value={form.zpayApiUrl} onChange={v => setField('zpayApiUrl', v)} placeholder="https://pay.example.com/submit.php" mono />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Field label="异步通知URL" value={form.zpayNotifyUrl} onChange={v => setField('zpayNotifyUrl', v)} placeholder="https://domain/api/payment/zpay/notify" mono />
                        <Field label="同步跳转URL" value={form.zpayReturnUrl} onChange={v => setField('zpayReturnUrl', v)} placeholder="https://domain/pay/return" mono />
                      </div>
                      <SensitiveField label="商户密钥 (KEY)" configured={configured.zpayKey} value={sensitive.zpayKey} onChange={v => setSensitiveField('zpayKey', v)} />
                    </>
                  )}

                  {method.key === 'wechat' && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <Field label="App ID" value={form.wechatAppId} onChange={v => setField('wechatAppId', v)} placeholder="wx1234..." />
                        <Field label="商户号" value={form.wechatMchId} onChange={v => setField('wechatMchId', v)} placeholder="1234567890" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Field label="API V3 密钥" value={form.wechatApiV3Key} onChange={v => setField('wechatApiV3Key', v)} placeholder="32位密钥" mono />
                        <Field label="证书序列号" value={form.wechatCertSerial} onChange={v => setField('wechatCertSerial', v)} placeholder="证书序列号" mono />
                      </div>
                      <Field label="回调通知URL" value={form.wechatNotifyUrl} onChange={v => setField('wechatNotifyUrl', v)} placeholder="https://domain/api/payment/wechat/notify" mono />
                      <SensitiveField label="商户私钥 (PEM)" configured={configured.wechatPrivateKey} value={sensitive.wechatPrivateKey} onChange={v => setSensitiveField('wechatPrivateKey', v)} />
                    </>
                  )}

                  {method.key === 'alipay' && (
                    <>
                      <Field label="App ID" value={form.alipayAppId} onChange={v => setField('alipayAppId', v)} placeholder="2016..." />
                      <div className="grid grid-cols-2 gap-2">
                        <Field label="异步通知URL" value={form.alipayNotifyUrl} onChange={v => setField('alipayNotifyUrl', v)} placeholder="https://domain/api/payment/alipay/notify" mono />
                        <Field label="同步返回URL" value={form.alipayReturnUrl} onChange={v => setField('alipayReturnUrl', v)} placeholder="https://domain/pay/return" mono />
                      </div>
                      <Field label="网关地址" value={form.alipayGateway} onChange={v => setField('alipayGateway', v)} placeholder="https://openapi.alipay.com/gateway.do" mono />
                      <SensitiveField label="商户私钥 (PEM)" configured={configured.alipayPrivateKey} value={sensitive.alipayPrivateKey} onChange={v => setSensitiveField('alipayPrivateKey', v)} />
                      <SensitiveField label="支付宝公钥 (PEM)" configured={configured.alipayPublicKey} value={sensitive.alipayPublicKey} onChange={v => setSensitiveField('alipayPublicKey', v)} />
                    </>
                  )}

                  {method.key === 'paypal' && (
                    <>
                      <Field label="Client ID" value={form.paypalClientId} onChange={v => setField('paypalClientId', v)} placeholder="AY..." mono />
                      <SensitiveField label="Client Secret" configured={configured.paypalClientSecret} value={sensitive.paypalClientSecret} onChange={v => setSensitiveField('paypalClientSecret', v)} />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className={LABEL_CLASS}>模式</label>
                          <select
                            value={form.paypalMode}
                            onChange={e => setField('paypalMode', e.target.value)}
                            className={INPUT_CLASS}
                          >
                            <option value="sandbox">Sandbox（测试）</option>
                            <option value="live">Live（生产）</option>
                          </select>
                        </div>
                        <Field label="Webhook URL" value={form.paypalNotifyUrl} onChange={v => setField('paypalNotifyUrl', v)} placeholder="https://domain/api/payment/paypal/webhook" mono />
                      </div>
                    </>
                  )}

                  {method.key === 'stripe' && (
                    <>
                      <Field label="Publishable Key" value={form.stripePublishableKey} onChange={v => setField('stripePublishableKey', v)} placeholder="pk_live_..." mono />
                      <SensitiveField label="Secret Key" configured={configured.stripeSecretKey} value={sensitive.stripeSecretKey} onChange={v => setSensitiveField('stripeSecretKey', v)} mono />
                      <Field label="Webhook Secret" value={form.stripeWebhookSecret} onChange={v => setField('stripeWebhookSecret', v)} placeholder="whsec_..." mono />
                      <Field label="Webhook URL" value={form.stripeNotifyUrl} onChange={v => setField('stripeNotifyUrl', v)} placeholder="https://domain/api/payment/stripe/webhook" mono />
                    </>
                  )}

                  {method.key === 'personal-qr' && (
                    <>
                      <div>
                        <label className={LABEL_CLASS}>收款码类型</label>
                        <select
                          value={form.personalQrType}
                          onChange={e => setField('personalQrType', e.target.value as any)}
                          className={INPUT_CLASS + ' bg-white'}
                        >
                          <option value="wechat">微信收款码</option>
                          <option value="alipay">支付宝收款码</option>
                          <option value="unionpay">银联收款码</option>
                        </select>
                      </div>
                      <Field
                        label="收款码图片 URL"
                        value={form.personalQrUrl}
                        onChange={v => setField('personalQrUrl', v)}
                        placeholder="https://domain/images/personal-qr.jpg 或 /images/personal-qr.jpg"
                      />
                      {form.personalQrUrl && (
                        <div className="mt-2 inline-flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                          <div className="w-16 h-16 rounded overflow-hidden bg-white relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={form.personalQrUrl} alt="预览" className="absolute inset-0 w-full h-full object-contain" />
                          </div>
                          <div className="text-xs text-gray-500">预览</div>
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        提示：将个人收款码图片上传到服务器 <code className="text-[10px]">/public/images/</code> 目录，或使用图床URL。
                        用户付款后需联系客服核销订单（无自动回调）。
                      </p>
                    </>
                  )}

                  {method.key === 'card-key' && (
                    <div className="text-xs text-gray-500 py-2">
                      <p className="mb-1">卡密兑换为系统内置功能，无需额外配置。</p>
                      <p>前往 <a href="/admin/card-keys" className="text-blue-600 hover:underline">卡密管理</a> 页面批量生成卡密，用户在充值页面输入卡密即可兑换会员。</p>
                    </div>
                  )}

                  {/* 接入文档提示 */}
                  {method.docs && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="text-[10px] text-gray-400">
                        <span className="font-medium">接入步骤：</span>{method.docs}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 底部保存按钮 */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <span className="text-xs text-gray-400">
          敏感字段已配置项将加密存储，留空保存表示不修改
        </span>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存配置'}
        </button>
      </div>
    </div>
  );
}

// ==================== 普通输入字段 ====================

function Field({ label, value, onChange, placeholder, mono }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean;
}) {
  return (
    <div>
      <label className={LABEL_CLASS}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${INPUT_CLASS} ${mono ? 'font-mono' : ''}`}
      />
    </div>
  );
}

// ==================== 敏感字段 ====================

function SensitiveField({ label, configured, value, onChange, mono }: {
  label: string; configured: boolean; value: string; onChange: (v: string) => void; mono?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <label className={LABEL_CLASS}>{label}</label>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${configured ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
          {configured ? '● 已配置' : '○ 未配置'}
        </span>
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={3}
        placeholder={configured ? '已配置，留空不修改；粘贴新内容可更新' : '请粘贴内容'}
        className={`w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-[11px] ${mono ? 'font-mono' : ''} focus:outline-none focus:ring-1 focus:ring-blue-500 ${value ? 'bg-blue-50/40 border-blue-300' : ''}`}
      />
    </div>
  );
}
