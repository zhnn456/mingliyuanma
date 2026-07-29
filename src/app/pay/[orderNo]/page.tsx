'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-client';
import Link from 'next/link';

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

const TYPE_LABELS: Record<string, string> = {
  membership: '会员套餐',
  offering: '供奉',
  pdf_report: 'PDF报告',
};

const PAYMENT_METHODS = [
  { id: 'mock', name: '模拟支付', icon: '🧪', desc: '开发测试用' },
  { id: 'wechat', name: '微信支付', icon: '💚', desc: '微信扫码支付' },
  { id: 'alipay', name: '支付宝', icon: '💙', desc: '支付宝支付' },
];

export default function PayPage({ params }: { params: Promise<{ orderNo: string }> }) {
  const { orderNo } = use(params);
  const router = useRouter();
  const { user: session } = useAuth();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('mock');
  const [error, setError] = useState('');
  const [paid, setPaid] = useState(false);

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

  // 轮询订单状态（支付后）
  useEffect(() => {
    if (!paying && !paid) return;
    if (paid) return;

    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/status?orderNo=${orderNo}`);
        if (res.ok) {
          const data = await res.json();
          if (data.order?.status === 'paid') {
            setPaid(true);
            setPaying(false);
            // 跳转到成功页
            setTimeout(() => {
              router.push(`/payment/result?orderNo=${orderNo}&status=success`);
            }, 800);
            clearInterval(timer);
          }
        }
      } catch {}
    }, 2000);

    return () => clearInterval(timer);
  }, [orderNo, paying, paid, router]);

  // 确认支付
  const handlePay = async () => {
    if (!order) return;

    if (selectedMethod === 'mock') {
      setPaying(true);
      setError('');

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
            router.push(`/payment/result?orderNo=${orderNo}&status=success`);
          }, 800);
        } else {
          setError(data.error || '支付失败');
          setPaying(false);
        }
      } catch {
        setError('网络错误，请重试');
        setPaying(false);
      }
    } else {
      // 微信/支付宝：跳转到支付链接（接入真实网关后实现）
      setError(`'${selectedMethod === 'wechat' ? '微信' : '支付宝'}'支付尚未接入，请选择模拟支付`);
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
            {order.type === 'membership' ? '您的会员已开通，开始享受尊贵服务' : '您的供奉已登记，功德无量'}
          </p>
          <div className="flex gap-3 justify-center">
            <Link href={order.type === 'membership' ? '/dashboard' : '/offering'} className="btn-primary px-6 py-2">
              {order.type === 'membership' ? '开始使用' : '返回供奉'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment-50 via-paper to-white py-10">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
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

        {/* 支付方式 */}
        <div className="card mb-6">
          <h2 className="card-title">选择支付方式</h2>
          <div className="space-y-3 mt-3">
            {PAYMENT_METHODS.map((method) => (
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
                  <div className="font-medium text-gray-900">{method.name}</div>
                  <div className="text-xs text-gray-500">{method.desc}</div>
                </div>
              </label>
            ))}
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
    </div>
  );
}
