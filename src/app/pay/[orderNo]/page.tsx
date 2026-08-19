'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-client';
import Link from 'next/link';
import CustomerServiceQR from '@/components/CustomerServiceQR';

interface OrderData {
  id: string;
  orderNo: string;
  amount: number;
  status: string;
  type: string;
  targetId: string | null;
  paymentMethod: string | null;
  createdAt: string;
}

interface PaymentInfo {
  status: string;
  method: string;
  transactionId: string | null;
}

interface MethodsConfig {
  wechat: boolean;
  alipay: boolean;
  paypal: boolean;
  zpay: boolean;
  personalqr: boolean;
  cardkey: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  membership: '会员套餐',
  offering: '供奉',
  pdf_report: 'PDF报告',
  recharge: '积分充值',
};

// 基础支付方式列表（卡密描述中的客服联系方式在组件内动态拼接）
const BASE_PAYMENT_METHODS = [
  { id: 'wechat', name: '微信支付', icon: '💚', desc: '微信扫码支付' },
  { id: 'alipay', name: '支付宝', icon: '💙', desc: '支付宝支付' },
  { id: 'zpay', name: 'Z-Pay 支付宝', icon: '💎', desc: '通过 Z-Pay 使用支付宝付款（无需备案）' },
  { id: 'personalqr', name: '个人收款码', icon: '📱', desc: '微信/支付宝个人收款码，扫码付款后联系客服核销' },
  { id: 'paypal', name: 'PayPal', icon: '🅿️', desc: '国际 PayPal.me 收款（付款后联系客服核销）' },
  { id: 'cardkey', name: '卡密兑换', icon: '🎫', desc: '' }, // desc 在组件内拼接客服联系方式
];

export default function PayPage({ params }: { params: Promise<{ orderNo: string }> }) {
  const { orderNo } = use(params);
  const router = useRouter();
  const { user: session } = useAuth();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('wechat');
  const [error, setError] = useState('');
  const [paid, setPaid] = useState(false);

  // 真实支付相关状态
  const [pollOrderNo, setPollOrderNo] = useState(orderNo);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [jsapiParams, setJsapiParams] = useState<Record<string, string> | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [methodsConfig, setMethodsConfig] = useState<MethodsConfig>({ wechat: false, alipay: false, paypal: false, zpay: false, personalqr: false, cardkey: true });
  // 个人收款码弹窗状态
  const [personalQrModal, setPersonalQrModal] = useState<{ url: string; type: string } | null>(null);

  // 客服配置（联系方式 + 联系方式类型标签），从后台动态获取，替换硬编码
  const [csContact, setCsContact] = useState('Xcbot2026');
  const [csContactLabel, setCsContactLabel] = useState('微信');

  // 获取订单信息
  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/payment/status?orderNo=${orderNo}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
        setPayment(data.payment);
        if (data.order?.status === 'paid') {
          setPaid(true);
        }
        if (data.methods) {
          setMethodsConfig(data.methods);
        }
      } else {
        setError('订单不存在');
      }
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  }, [orderNo]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // 获取客服配置（联系方式从后台动态读取）
  useEffect(() => {
    fetch('/api/config/customer-service')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setCsContact(d.contact || 'Xcbot2026');
          setCsContactLabel(d.contactLabel || '微信');
        }
      })
      .catch(() => {});
  }, []);

  // 轮询订单状态（支付后）
  useEffect(() => {
    if (!paying && !paid) return;
    if (paid) return;

    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/status?orderNo=${pollOrderNo}`);
        if (res.ok) {
          const data = await res.json();
          if (data.order?.status === 'paid') {
            setPaid(true);
            setPaying(false);
            // 跳转到成功页
            setTimeout(() => {
              router.push(`/payment/result?orderNo=${pollOrderNo}&status=success`);
            }, 800);
            clearInterval(timer);
          }
        }
      } catch {}
    }, 2000);

    return () => clearInterval(timer);
  }, [pollOrderNo, paying, paid, router]);

  // 基于现有订单信息构建创建订单请求体
  const buildCreateBody = (method: string) => {
    if (!order) return null;
    const body: Record<string, string> = {
      type: order.type,
      method,
    };
    if (typeof window !== 'undefined') {
      body.returnUrl = window.location.href;
    }
    if (order.type === 'offering' && order.targetId) {
      const parts = order.targetId.split(':::');
      body.targetId = parts[0];
      if (parts[1]) body.offerType = parts[1];
    } else if (order.targetId) {
      body.targetId = order.targetId;
    }
    return body;
  };

  // 调用微信 JSAPI 支付（微信浏览器内）
  const callWechatJsapi = (params: Record<string, string>) => {
    if (typeof window === 'undefined') return;
    const w = window as unknown as { WeixinJSBridge?: { invoke: (name: string, params: Record<string, string>, cb: (res: { err_msg?: string }) => void) => void } };
    const invoke = () => {
      if (!w.WeixinJSBridge) return;
      w.WeixinJSBridge.invoke('getBrandWCPayRequest', params, (res) => {
        if (res.err_msg && res.err_msg.indexOf('ok') >= 0) {
          // 支付成功，轮询会自动捕获
        } else {
          setError('微信支付未完成或已取消');
          setPaying(false);
        }
      });
    };
    if (w.WeixinJSBridge) {
      invoke();
    } else {
      document.addEventListener('WeixinJSBridgeReady', invoke, false);
    }
  };

  // 确认支付
  const handlePay = async () => {
    if (!order) return;
    setError('');
    setQrCode(null);
    setJsapiParams(null);

    // 模拟支付：保持原有逻辑
    if (selectedMethod === 'mock') {
      setPaying(true);
      try {
        const res = await fetch('/api/payment/mock-confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderNo: order.orderNo }),
        });

        const data = await res.json();
        if (res.ok) {
          setPaid(true);
          setTimeout(() => {
            router.push(`/payment/result?orderNo=${order.orderNo}&status=success`);
          }, 800);
        } else {
          setError(data.error || '支付失败');
          setPaying(false);
        }
      } catch {
        setError('网络错误，请重试');
        setPaying(false);
      }
      return;
    }

    // 微信支付
    if (selectedMethod === 'wechat') {
      setPaying(true);
      try {
        const body = buildCreateBody('wechat');
        if (!body) {
          setPaying(false);
          return;
        }
        const res = await fetch('/api/payment/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || '创建微信支付失败');
          setPaying(false);
          return;
        }
        // 更新本地订单为新创建的订单
        if (data.order?.orderNo) {
          setPollOrderNo(data.order.orderNo);
          setOrder((prev) =>
            prev
              ? { ...prev, orderNo: data.order.orderNo, amount: data.order.amount ?? prev.amount, paymentMethod: 'wechat' }
              : prev,
          );
        }
        const pay = data.payment || {};
        if (pay.jsapiParams) {
          // 微信浏览器内 JSAPI 支付
          setJsapiParams(pay.jsapiParams);
          callWechatJsapi(pay.jsapiParams);
        } else if (pay.qrCode) {
          // Native 扫码支付
          if (pay.qrCode.startsWith('mock://')) {
            setError('微信支付未配置，请联系管理员');
            setPaying(false);
            return;
          }
          setQrCode(pay.qrCode);
        } else {
          setError('未获取到微信支付参数');
          setPaying(false);
        }
      } catch {
        setError('网络错误，请重试');
        setPaying(false);
      }
      return;
    }

    // 支付宝支付
    if (selectedMethod === 'alipay') {
      setPaying(true);
      setRedirecting(true);
      try {
        const body = buildCreateBody('alipay');
        if (!body) {
          setPaying(false);
          setRedirecting(false);
          return;
        }
        const res = await fetch('/api/payment/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || '创建支付宝支付失败');
          setPaying(false);
          setRedirecting(false);
          return;
        }
        if (data.order?.orderNo) {
          setPollOrderNo(data.order.orderNo);
          setOrder((prev) =>
            prev
              ? { ...prev, orderNo: data.order.orderNo, amount: data.order.amount ?? prev.amount, paymentMethod: 'alipay' }
              : prev,
          );
        }
        const pay = data.payment || {};
        if (pay.paymentUrl) {
          // 检测是否为 mock 降级（未配置时 paymentUrl 为 /pay/xxx）
          if (pay.paymentUrl.startsWith('/pay/')) {
            setError('支付宝未配置，请联系管理员');
            setPaying(false);
            setRedirecting(false);
            return;
          }
          // 跳转到支付宝页面
          window.location.href = pay.paymentUrl;
        } else {
          setError('未获取到支付宝支付链接');
          setPaying(false);
          setRedirecting(false);
        }
      } catch {
        setError('网络错误，请重试');
        setPaying(false);
        setRedirecting(false);
      }
      return;
    }

    // Z-Pay 支付宝：创建订单后跳转到 Z-Pay 支付页
    if (selectedMethod === 'zpay') {
      setPaying(true);
      setRedirecting(true);
      try {
        const body = buildCreateBody('zpay');
        if (!body) {
          setPaying(false);
          setRedirecting(false);
          return;
        }
        const res = await fetch('/api/payment/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || '创建 Z-Pay 支付失败');
          setPaying(false);
          setRedirecting(false);
          return;
        }
        if (data.order?.orderNo) {
          setPollOrderNo(data.order.orderNo);
          setOrder((prev) =>
            prev
              ? { ...prev, orderNo: data.order.orderNo, amount: data.order.amount ?? prev.amount, paymentMethod: 'zpay' }
              : prev,
          );
        }
        const pay = data.payment || {};
        if (pay.paymentUrl) {
          if (pay.paymentUrl.startsWith('/pay/')) {
            setError('Z-Pay 未配置（请在 .env 中设置 ZPAY_PID 和 ZPAY_KEY），请联系管理员');
            setPaying(false);
            setRedirecting(false);
            return;
          }
          window.location.href = pay.paymentUrl;
        } else {
          setError('未获取到 Z-Pay 支付链接');
          setPaying(false);
          setRedirecting(false);
        }
      } catch {
        setError('网络错误，请重试');
        setPaying(false);
        setRedirecting(false);
      }
      return;
    }

    // PayPal：创建订单后跳转到 PayPal.me 收款页（新窗口）
    // 付款完成后由客服在后台手动核销订单
    // 个人收款码：调用 create 创建订单，前端展示收款码弹窗
    if (selectedMethod === 'personalqr') {
      setPaying(true);
      try {
        const body = buildCreateBody('personalqr');
        if (!body) {
          setPaying(false);
          return;
        }
        const res = await fetch('/api/payment/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || '创建订单失败');
          setPaying(false);
          return;
        }
        if (data.order?.orderNo) {
          setPollOrderNo(data.order.orderNo);
          setOrder((prev) =>
            prev
              ? { ...prev, orderNo: data.order.orderNo, amount: data.order.amount ?? prev.amount, paymentMethod: 'personalqr' }
              : prev,
          );
        }
        const pay = data.payment || {};
        if (pay.paymentQrUrl) {
          // 展示个人收款码弹窗
          setPersonalQrModal({ url: pay.paymentQrUrl, type: pay.paymentQrType || 'wechat' });
          setPaying(false);
        } else {
          setError('个人收款码未配置，请在后台设置收款码图片URL');
          setPaying(false);
        }
      } catch {
        setError('网络错误，请重试');
        setPaying(false);
      }
      return;
    }

    if (selectedMethod === 'paypal') {
      setPaying(true);
      setRedirecting(true);
      try {
        const body = buildCreateBody('paypal');
        if (!body) {
          setPaying(false);
          setRedirecting(false);
          return;
        }
        const res = await fetch('/api/payment/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || '创建 PayPal 支付失败');
          setPaying(false);
          setRedirecting(false);
          return;
        }
        if (data.order?.orderNo) {
          setPollOrderNo(data.order.orderNo);
          setOrder((prev) =>
            prev
              ? { ...prev, orderNo: data.order.orderNo, amount: data.order.amount ?? prev.amount, paymentMethod: 'paypal' }
              : prev,
          );
        }
        const pay = data.payment || {};
        if (pay.paymentUrl && pay.paymentUrl.startsWith('https://paypal.me/')) {
          // 新窗口打开 PayPal.me，保留当前订单页供轮询
          window.open(pay.paymentUrl, '_blank', 'noopener,noreferrer');
          setError('');
          setRedirecting(false);
          setPaying(false);
          // 提示用户付款后联系客服核销
          const cnyAmount = (data.order?.amount ?? order?.amount ?? 0);
          const usdAmount = pay.usdAmount as number | undefined;
          const rate = pay.exchangeRate as number | undefined;
          setTimeout(() => {
            alert(`已跳转到 PayPal 完成付款\n\n订单号：${data.order?.orderNo || order?.orderNo}\n应付金额：¥${cnyAmount.toFixed(2)}（约 $${usdAmount?.toFixed(2) || (cnyAmount / 7.15).toFixed(2)} USD，汇率 ${rate || 7.15}）\n\n付款完成后请联系客服${csContactLabel} ${csContact} 核销订单，或刷新本页面查看订单状态。`);
          }, 300);
        } else if (pay.paymentUrl && pay.paymentUrl.startsWith('/pay/')) {
          setError('PayPal 未配置（缺少 PAYPAL_ME_USERNAME），请联系管理员');
          setPaying(false);
          setRedirecting(false);
        } else {
          setError('未获取到 PayPal 收款链接');
          setPaying(false);
          setRedirecting(false);
        }
      } catch {
        setError('网络错误，请重试');
        setPaying(false);
        setRedirecting(false);
      }
      return;
    }

    // 卡密兑换：跳转到卡密兑换页（不创建支付订单）
    if (selectedMethod === 'cardkey') {
      router.push('/profile/redeem');
      return;
    }
  };

  // 格式化金额
  const formatAmount = (amount: number) => `¥${amount.toFixed(2)}`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">加载订单信息...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card max-w-md mx-auto p-8 text-center">
          <div className="text-5xl mb-4">😅</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">订单加载失败</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link href="/membership" className="btn-primary px-6 py-2">返回会员中心</Link>
        </div>
      </div>
    );
  }

  if (paid && order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card max-w-md mx-auto p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">支付成功！</h2>
          <p className="text-gray-500 mb-6">
            {order.type === 'membership' ? '您的会员已开通，开始享受尊贵服务'
              : order.type === 'recharge' ? '积分充值成功，已到账'
              : '您的祈福已登记，心愿已送达'}
          </p>
          <div className="flex gap-3 justify-center">
            <Link href={order.type === 'membership' ? '/dashboard' : order.type === 'recharge' ? '/profile' : '/offering'} className="btn-primary px-6 py-2">
              {order.type === 'membership' ? '开始使用' : order.type === 'recharge' ? '查看积分' : '返回供奉'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 支付宝跳转中状态
  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card max-w-md mx-auto p-8 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">正在跳转到支付宝...</h2>
          <p className="text-gray-500">请稍候，即将跳转到支付宝完成支付</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment-50 via-paper to-white py-10">
      <div className="flex justify-center gap-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl flex-1">
        {/* 订单信息 */}
        <div className="card mb-6">
          <h1 className="text-xl font-bold text-gray-900 mb-4 text-center">确认订单</h1>

          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">商品</span>
              <span className="font-medium text-gray-900">{TYPE_LABELS[order?.type || ''] || '商品'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">订单号</span>
              <span className="font-mono text-sm text-gray-600">{order?.orderNo}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">状态</span>
              <span className="text-yellow-600 font-medium">待支付</span>
            </div>
            <div className="flex justify-between py-2 text-lg">
              <span className="text-gray-700 font-bold">应付金额</span>
              <span className="text-2xl font-bold chinese-red">{formatAmount(order?.amount || 0)}</span>
            </div>
          </div>
        </div>

        {/* 微信扫码支付二维码 */}
        {qrCode && (
          <div className="card mb-6 text-center">
            <h2 className="card-title">微信扫码支付</h2>
            <p className="text-gray-500 text-sm mb-4">请用微信扫码支付</p>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrCode)}`}
              alt="微信支付二维码"
              className="mx-auto border border-gray-200 rounded-lg"
              width={240}
              height={240}
            />
            <p className="text-xs text-gray-400 mt-4 break-all">二维码内容: {qrCode}</p>
            <p className="text-sm text-gray-500 mt-2">支付完成后页面将自动跳转</p>
          </div>
        )}

        {/* 个人收款码弹窗（微信/支付宝个人收款码，扫码付款后联系客服核销） */}
        {personalQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPersonalQrModal(null)}>
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-base font-bold text-gray-900 mb-1">
                {personalQrModal.type === 'alipay' ? '支付宝' : personalQrModal.type === 'unionpay' ? '银联' : '微信'}扫码付款
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                应付金额：¥{(order?.amount ?? 0).toFixed(2)} · 订单号：{order?.orderNo}
              </p>
              <div className="w-full max-w-[260px] mx-auto mb-4 rounded-xl overflow-hidden border-2 border-stone-100 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={personalQrModal.url} alt="个人收款码" className="w-full h-auto" />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-amber-800 leading-relaxed">
                  1. 请使用{personalQrModal.type === 'alipay' ? '支付宝' : '微信'}扫一扫上方收款码<br/>
                  2. 付款时请<b>备注订单号后 6 位</b>：{(order?.orderNo || '').slice(-6)}<br/>
                  3. 付款完成后联系客服{csContactLabel} <span className="font-mono">{csContact}</span> 核销订单
                </p>
              </div>
              <button
                onClick={() => setPersonalQrModal(null)}
                className="w-full px-4 py-2 bg-stone-800 text-white rounded-lg text-sm"
              >
                关闭
              </button>
              <p className="text-xs text-gray-400 mt-3">付款后客服核销成功，本页面将自动刷新为已支付</p>
            </div>
          </div>
        )}

        {/* 支付方式 */}
        <div className="card mb-6">
          <h2 className="card-title">选择支付方式</h2>
          <div className="space-y-3 mt-3">
            {BASE_PAYMENT_METHODS
              .map((m) => ({
                ...m,
                desc: m.id === 'cardkey' ? `联系客服${csContactLabel} ${csContact} 购买卡密后兑换` : m.desc,
              }))
              .map((method) => {
              const configured =
                method.id === 'wechat' ? methodsConfig.wechat
                  : method.id === 'alipay' ? methodsConfig.alipay
                  : method.id === 'zpay' ? (methodsConfig.zpay ?? false)
                  : method.id === 'personalqr' ? (methodsConfig.personalqr ?? false)
                  : method.id === 'paypal' ? (methodsConfig.paypal ?? false)
                  : method.id === 'cardkey' ? true
                  : false;
              return (
                <label
                  key={method.id}
                  className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    selectedMethod === method.id
                      ? 'border-red-600 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={selectedMethod === method.id}
                    onChange={() => setSelectedMethod(method.id)}
                    className="w-4 h-4 text-red-600"
                  />
                  <span className="text-2xl">{method.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      {method.name}
                      {!configured && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded">未配置</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">{method.desc}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* 支付按钮 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handlePay}
          disabled={paying}
          className="w-full btn-primary py-4 text-lg font-bold disabled:opacity-50"
        >
          {paying ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              支付处理中...
            </span>
          ) : (
            `确认支付 ${formatAmount(order?.amount || 0)}`
          )}
        </button>

        <p className="text-center text-sm text-gray-400 mt-4">
          支付即表示同意 <span className="underline cursor-pointer">服务协议</span>
        </p>
      </div>
      <CustomerServiceQR />
    </div>
    </div>
  );
}
