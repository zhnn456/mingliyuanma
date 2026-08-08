'use client';

import { useState, useEffect } from 'react';

interface DomainInfo {
  subdomain: string;
  fullSubdomain: string;
  mainDomain: string;
  customDomain: string | null;
  customDomainExpiry: string | null;
  customDomainStatus: 'none' | 'active' | 'expired';
  balance: number;
  price: number;
  durationDays: number;
}

export default function AgentDomainPage() {
  const [info, setInfo] = useState<DomainInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [domainInput, setDomainInput] = useState('');
  const [confirmBind, setConfirmBind] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchDomain = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agent/domain');
      if (res.ok) {
        const d = await res.json();
        setInfo(d);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchDomain(); }, []);

  const handleCopySubdomain = () => {
    if (info?.fullSubdomain) {
      navigator.clipboard.writeText(info.fullSubdomain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBindDomain = async () => {
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/agent/domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domainInput }),
      });
      const d = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: d.message || '域名绑定成功' });
        setDomainInput('');
        setConfirmBind(false);
        fetchDomain();
      } else if (res.status === 402) {
        setMessage({
          type: 'error',
          text: `余额不足，需要 ¥${d.cost}，当前余额 ¥${d.balance}，差额 ¥${d.shortfall}。请联系平台管理员充值。`,
        });
        setConfirmBind(false);
      } else {
        setMessage({ type: 'error', text: d.error || '绑定失败' });
        setConfirmBind(false);
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误' });
      setConfirmBind(false);
    }
    setSubmitting(false);
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-400">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">域名设置</h1>
        <p className="text-sm text-gray-500 mt-1">管理代理商子域名与独立域名绑定</p>
      </div>

      {message && (
        <div
          className={`rounded-xl p-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 免费子域名卡片 */}
      {info && (
        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl">🏷️</div>
            <div>
              <h2 className="text-base font-bold text-gray-900">免费子域名</h2>
              <p className="text-xs text-gray-500">系统自动分配，无需配置 DNS</p>
            </div>
          </div>
          {info.fullSubdomain ? (
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
              <code className="text-lg font-mono text-blue-600 flex-1">{info.fullSubdomain}</code>
              <button
                onClick={handleCopySubdomain}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {copied ? '已复制' : '复制'}
              </button>
            </div>
          ) : (
            <div className="text-sm text-gray-400 bg-gray-50 rounded-xl p-4">
              暂未分配子域名，请联系平台管理员
            </div>
          )}
        </div>
      )}

      {/* 独立域名绑定 */}
      {info && (
        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-xl">🌐</div>
            <div>
              <h2 className="text-base font-bold text-gray-900">独立域名绑定</h2>
              <p className="text-xs text-gray-500">
                绑定自定义域名，年费 ¥{info.price}/{info.durationDays}天
              </p>
            </div>
          </div>

          {/* 独立域名状态 */}
          <div className="mb-4">
            {info.customDomainStatus === 'none' && (
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-500">
                当前未绑定独立域名
              </div>
            )}
            {info.customDomainStatus === 'active' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs px-2 py-0.5 bg-green-500 text-white rounded-full mr-2">已绑定</span>
                    <code className="text-sm font-mono text-green-700">{info.customDomain}</code>
                  </div>
                  <div className="text-xs text-green-600">
                    到期：{info.customDomainExpiry ? new Date(info.customDomainExpiry).toLocaleDateString('zh-CN') : '-'}
                  </div>
                </div>
              </div>
            )}
            {info.customDomainStatus === 'expired' && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs px-2 py-0.5 bg-red-500 text-white rounded-full mr-2">已过期</span>
                    <code className="text-sm font-mono text-red-700">{info.customDomain}</code>
                  </div>
                  <div className="text-xs text-red-600">
                    过期于：{info.customDomainExpiry ? new Date(info.customDomainExpiry).toLocaleDateString('zh-CN') : '-'}
                  </div>
                </div>
                <p className="text-xs text-red-600 mt-2">续费后可继续使用该域名</p>
              </div>
            )}
          </div>

          {/* 余额显示 */}
          <div className="flex items-center gap-2 text-sm mb-4">
            <span className="text-gray-500">账户余额：</span>
            <span className={`font-medium ${info.balance >= info.price ? 'text-green-600' : 'text-red-600'}`}>
              ¥{Number(info.balance || 0).toFixed(2)}
            </span>
          </div>

          {/* 绑定/续费表单 */}
          <div className="flex gap-3">
            <input
              type="text"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              placeholder="example.com"
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => {
                if (!domainInput.trim()) {
                  setMessage({ type: 'error', text: '请输入域名' });
                  return;
                }
                setMessage(null);
                setConfirmBind(true);
              }}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {info.customDomainStatus === 'active' ? '续费' : '绑定域名'}
            </button>
          </div>
        </div>
      )}

      {/* DNS 配置指引 */}
      {info && (
        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl">📖</div>
            <div>
              <h2 className="text-base font-bold text-gray-900">DNS 配置指引</h2>
              <p className="text-xs text-gray-500">绑定独立域名后，需在域名服务商处添加以下记录</p>
            </div>
          </div>
          <div className="bg-gray-900 text-gray-100 rounded-xl p-4 font-mono text-sm overflow-x-auto">
            <div className="mb-2 text-gray-400"># 添加 CNAME 记录</div>
            <div className="mb-1">
              <span className="text-green-400">类型</span>
              <span className="mx-3 text-gray-500">:</span>
              <span className="text-yellow-300">CNAME</span>
            </div>
            <div className="mb-1">
              <span className="text-green-400">主机记录</span>
              <span className="mx-3 text-gray-500">:</span>
              <span className="text-yellow-300">www</span>
              <span className="ml-3 text-gray-500">(或 @)</span>
            </div>
            <div className="mb-1">
              <span className="text-green-400">记录值</span>
              <span className="mx-3 text-gray-500">:</span>
              <span className="text-yellow-300">{info.mainDomain}</span>
            </div>
            <div className="mt-2 text-gray-400"># 生效后访问 https://你的域名 即可使用</div>
          </div>
          <div className="mt-3 text-xs text-gray-500 space-y-1">
            <p>• 主机记录填 www 表示绑定 www.你的域名，填 @ 表示绑定根域名</p>
            <p>• DNS 生效通常需要 10 分钟 ~ 24 小时</p>
            <p>• 如需配置 SSL 证书，请联系平台管理员</p>
          </div>
        </div>
      )}

      {/* 付费确认弹窗 */}
      {confirmBind && info && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setConfirmBind(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="text-4xl mb-2">💳</div>
              <h3 className="text-lg font-bold text-gray-900">
                {info.customDomainStatus === 'active' ? '域名续费确认' : '域名绑定确认'}
              </h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">绑定域名</span>
                <span className="font-medium text-gray-900">{domainInput.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '')}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">费用</span>
                <span className="font-medium text-red-600">¥{info.price} / {info.durationDays}天</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">当前余额</span>
                <span className={`font-medium ${info.balance >= info.price ? 'text-green-600' : 'text-red-600'}`}>
                  ¥{Number(info.balance).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">扣款后余额</span>
                <span className="font-medium text-gray-900">
                  ¥{Math.max(0, Number(info.balance) - info.price).toFixed(2)}
                </span>
              </div>
            </div>
            {info.balance < info.price ? (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 text-center">
                余额不足，差额 ¥{(info.price - Number(info.balance)).toFixed(2)}。请联系平台管理员充值。
              </div>
            ) : (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                确认后将立即从账户余额扣除 ¥{info.price}，请同时前往域名服务商配置 CNAME 记录指向 {info.mainDomain}。
              </div>
            )}
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmBind(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              {info.balance >= info.price ? (
                <button
                  onClick={handleBindDomain}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? '处理中...' : '确认扣款'}
                </button>
              ) : (
                <button
                  disabled
                  className="flex-1 py-2.5 rounded-xl bg-gray-300 text-gray-500 text-sm cursor-not-allowed"
                >
                  余额不足
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
