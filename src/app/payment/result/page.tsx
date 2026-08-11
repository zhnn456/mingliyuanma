'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentResultPage() {
  const searchParams = useSearchParams();
  const orderNo = searchParams.get('orderNo');
  const status = searchParams.get('status');

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderNo) {
      setError('缺少订单号');
      setLoading(false);
      return;
    }

    fetch(`/api/payment/status?orderNo=${orderNo}`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        setOrder(data.order);
        setLoading(false);
      })
      .catch(() => {
        setError('查询订单失败');
        setLoading(false);
      });
  }, [orderNo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">查询支付结果...</p>
        </div>
      </div>
    );
  }

  const isSuccess = order?.status === 'paid' || status === 'success';

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment-50 via-paper to-white flex items-center justify-center py-10">
      <div className="max-w-md mx-auto px-4 w-full">
        <div className="card p-8 text-center">
          {/* 图标 */}
          <div className={`text-7xl mb-6 ${isSuccess ? 'animate-bounce' : ''}`}>
            {isSuccess ? '🎉' : '😅'}
          </div>

          {/* 标题 */}
          <h1 className={`text-2xl font-bold mb-2 ${isSuccess ? 'text-gray-900' : 'text-gray-900'}`}>
            {isSuccess ? '支付成功！' : '支付未完成'}
          </h1>

          <p className="text-gray-500 mb-6">
            {isSuccess
              ? order?.type === 'membership'
                ? '您的会员权益已开通，开始探索命理世界'
                : order?.type === 'offering'
                  ? '您的祈福已登记，心愿已送达 🙏'
                  : '支付已完成'
              : '您的支付尚未完成，请返回重试或联系客服'}
          </p>

          {/* 订单信息 */}
          {order && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">订单号</span>
                <span className="font-mono text-gray-700">{order.orderNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">金额</span>
                <span className="font-bold chinese-red">{`¥${order.amount?.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">状态</span>
                <span className={isSuccess ? 'text-green-600 font-medium' : 'text-yellow-600 font-medium'}>
                  {isSuccess ? '已支付' : order?.status === 'pending' ? '待支付' : order?.status}
                </span>
              </div>
            </div>
          )}

          {/* 按钮 */}
          <div className="flex flex-col gap-3">
            {isSuccess ? (
              <>
                <Link
                  href={order?.type === 'membership' ? '/dashboard' : '/offering'}
                  className="btn-primary py-3 text-center"
                >
                  {order?.type === 'membership' ? '开始使用' : '返回供奉'}
                </Link>
                <Link href="/profile" className="text-sm text-gray-500 hover:text-gray-700">
                  查看我的订单
                </Link>
              </>
            ) : (
              <>
                {order && (
                  <Link
                    href={`/pay/${order.orderNo}`}
                    className="btn-primary py-3 text-center"
                  >
                    重新支付
                  </Link>
                )}
                <Link href="/membership" className="btn-outline py-3 text-center">
                  返回会员中心
                </Link>
              </>
            )}
          </div>
        </div>

        {/* 客服信息 */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">
            如有疑问请联系客服 · 微信: Xcbot2026
          </p>
        </div>
      </div>
    </div>
  );
}
