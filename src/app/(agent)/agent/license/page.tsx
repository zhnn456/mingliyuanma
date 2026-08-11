'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface LicenseInfo {
  agent: {
    id: string;
    brandName: string;
    companyName: string;
    domain: string | null;
    authorizedDomain: string | null;
    contactName: string;
    contactPhone: string;
    isActive: boolean;
    level: string;
    planType: string;
    licenseKey: string;
    licenseExpiry: string | null;
    createdAt: string;
  };
  license: {
    licenseKey: string;
    authorizedDomain: string | null;
    expiryAt: string | null;
    remainingDays: number | null;
    isExpired: boolean;
    isExpiringSoon: boolean;
    status: string;
    planType: string;
    features: string[];
    maxUsers: number;
    updateServiceExpiry: string | null;
    updateServiceRemainingDays: number | null;
    updateServiceExpired: boolean;
  };
}

const FEATURE_LABELS: Record<string, string> = {
  bazi: '四柱八字',
  ziwei: '紫微斗数',
  qimen: '奇门遁甲',
  meihua: '梅花易数',
};

export default function AgentLicensePage() {
  const [data, setData] = useState<LicenseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadLicense();
  }, []);

  const loadLicense = async () => {
    try {
      const res = await fetch('/api/agent/license');
      if (res.ok) {
        const d = await res.json();
        setData(d);
      } else {
        const e = await res.json();
        setError(e.error || '加载失败');
      }
    } catch {
      setError('网络错误');
    }
    setLoading(false);
  };

  const copyLicenseKey = () => {
    if (!data?.license?.licenseKey) return;
    navigator.clipboard.writeText(data.license.licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="text-center py-20 text-gray-400">加载中...</div>;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!data) return <div className="text-center py-20 text-gray-400">暂无数据</div>;

  const { agent, license } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">授权管理</h1>
        <p className="text-sm text-gray-500 mt-1">查看您的授权码、域名绑定和授权状态</p>
      </div>

      {/* 授权状态卡片 */}
      <div className={`p-5 rounded-xl border ${
        license.isExpired ? 'bg-red-50 border-red-200' :
        license.isExpiringSoon ? 'bg-amber-50 border-amber-200' :
        'bg-green-50 border-green-200'
      }`}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${
              license.isExpired ? 'bg-red-500' :
              license.isExpiringSoon ? 'bg-amber-500' :
              'bg-green-500'
            }`} />
            <div>
              <div className="font-bold text-gray-900">
                授权状态：{license.status === 'expired' ? '已到期' : license.isExpiringSoon ? '即将到期' : '正常'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {license.expiryAt ? (
                  <>到期时间：{new Date(license.expiryAt).toLocaleDateString('zh-CN')}
                    {license.remainingDays !== null && !license.isExpired && `（剩余 ${license.remainingDays} 天）`}
                  </>
                ) : '永久授权'}
              </div>
            </div>
          </div>
          {license.isExpiringSoon && !license.isExpired && (
            <Link href="/agent/renew" className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700">
              立即续费
            </Link>
          )}
        </div>
      </div>

      {/* 授权码 */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h3 className="font-bold text-gray-800 mb-3">授权码</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between gap-3">
            <code className="text-sm text-gray-700 break-all flex-1 font-mono">
              {license.licenseKey}
            </code>
            <button
              onClick={copyLicenseKey}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 whitespace-nowrap"
            >
              {copied ? '已复制' : '复制'}
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          授权码已绑定域名，请妥善保管。更换域名需联系平台重新生成授权码。
        </p>
      </div>

      {/* 授权详情 */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h3 className="font-bold text-gray-800 mb-3">授权详情</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">授权类型</span>
            <span className="font-medium">
              {license.planType === 'lifetime' ? '永久买断' :
               license.planType === 'annual' ? '年度授权' : license.planType}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">绑定域名</span>
            <span className="font-medium">{license.authorizedDomain || '未绑定'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">客户上限</span>
            <span className="font-medium">{license.maxUsers === -1 ? '不限' : license.maxUsers}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">授权到期</span>
            <span className="font-medium">
              {license.expiryAt ? new Date(license.expiryAt).toLocaleDateString('zh-CN') : '永久'}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">已开通功能</span>
            <span className="font-medium text-right">
              {license.features.length > 0
                ? license.features.map(f => FEATURE_LABELS[f] || f).join('、')
                : '全部功能'}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">系统版本</span>
            <span className="font-medium">v4.0.0</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">授权开通日期</span>
            <span className="font-medium">{new Date(agent.createdAt).toLocaleDateString('zh-CN')}</span>
          </div>
        </div>
      </div>

      {/* 更新服务状态 */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h3 className="font-bold text-gray-800 mb-3">更新服务</h3>
        <div className={`p-4 rounded-lg border ${
          license.updateServiceExpired ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="font-medium text-gray-900">
                {license.updateServiceExpired ? '更新服务已到期' : '更新服务正常'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {license.updateServiceExpiry ? (
                  <>到期：{new Date(license.updateServiceExpiry).toLocaleDateString('zh-CN')}
                    {license.updateServiceRemainingDays !== null && !license.updateServiceExpired &&
                      `（剩余 ${license.updateServiceRemainingDays} 天）`}
                  </>
                ) : '永久更新服务'}
              </div>
            </div>
            {(license.updateServiceExpired || (license.updateServiceRemainingDays !== null && license.updateServiceRemainingDays <= 30)) && (
              <Link href="/agent/renew" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                续费更新服务
              </Link>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          更新服务期内可拉取最新版本。到期后可继续使用当前版本，但无法获取新版本更新。
        </p>
      </div>

      {/* 快捷操作 */}
      <div className="grid grid-cols-3 gap-4">
        <Link href="/agent/renew" className="bg-white rounded-xl shadow-sm border p-4 text-center hover:border-blue-300 transition-colors">
          <div className="text-3xl mb-2">💳</div>
          <div className="text-sm font-medium text-gray-700">续费管理</div>
        </Link>
        <Link href="/agent/updates" className="bg-white rounded-xl shadow-sm border p-4 text-center hover:border-blue-300 transition-colors">
          <div className="text-3xl mb-2">🔄</div>
          <div className="text-sm font-medium text-gray-700">检查更新</div>
        </Link>
        <Link href="/agent/tickets" className="bg-white rounded-xl shadow-sm border p-4 text-center hover:border-blue-300 transition-colors">
          <div className="text-3xl mb-2">🎫</div>
          <div className="text-sm font-medium text-gray-700">技术工单</div>
        </Link>
      </div>
    </div>
  );
}
