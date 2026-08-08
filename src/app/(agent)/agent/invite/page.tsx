'use client';

import { useState, useEffect } from 'react';

interface Customer {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  totalRecords: number;
  lastUsageDate: string | null;
}

export default function AgentInvitePage() {
  const [agentId, setAgentId] = useState<string>('');
  const [origin, setOrigin] = useState<string>('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [agentLevel, setAgentLevel] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [settingsRes, customersRes] = await Promise.all([
          fetch('/api/agent/settings'),
          fetch('/api/agent/customers?limit=500'),
        ]);
        if (settingsRes.ok) {
          const s = await settingsRes.json();
          setAgentId(s.agent?.id || '');
        }
        if (customersRes.ok) {
          const c = await customersRes.json();
          setCustomers(c.customers || []);
          setTotal(c.total || 0);
        }
      } catch {}
      setLoading(false);
    };
    setOrigin(window.location.origin);
    load();
  }, []);

  useEffect(() => {
    fetch('/api/agent/settings')
      .then((r) => r.json())
      .then((d) => {
        setAgentLevel(d.agent?.level || 'saas');
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, []);

  const inviteLink = agentId && origin ? `${origin}/register?ref=${agentId}` : '';

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const monthCount = customers.filter(
    (c) => c.createdAt && new Date(c.createdAt).getTime() >= monthStart
  ).length;
  const activeCount = customers.filter((c) => (c.totalRecords || 0) > 0).length;

  const handleCopy = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 回退：选中输入框
    }
  };

  if (checking) {
    return <div className="p-6 text-center text-gray-400">加载中...</div>;
  }
  if (agentLevel === 'source') {
    return (
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-8 text-center">
        <div className="text-4xl mb-3">🔒</div>
        <p className="text-blue-700 font-medium">邀请管理功能仅 SaaS 代理可用，源码部署代理请使用自有注册系统</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-400">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">邀请管理</h1>
        <p className="text-sm text-gray-500 mt-1">通过专属邀请链接发展您的客户</p>
      </div>

      {/* 邀请链接 */}
      <div className="bg-white rounded-2xl border shadow-sm p-5">
        <div className="text-sm font-medium text-gray-700 mb-3">我的专属邀请链接</div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            readOnly
            value={inviteLink}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            className="flex-1 px-4 py-2.5 bg-gray-50 border rounded-xl text-sm text-gray-600 font-mono outline-none"
            placeholder="加载中..."
          />
          <button
            onClick={handleCopy}
            disabled={!inviteLink}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
              copied ? 'bg-green-600 text-white' : 'bg-teal-600 text-white hover:bg-teal-700'
            }`}
          >
            {copied ? '✓ 已复制' : '复制链接'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          客户通过此链接注册后将自动归属到您的名下
        </p>
      </div>

      {/* 邀请统计 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="text-xs text-gray-500 mb-2">总邀请人数</div>
          <div className="text-2xl font-bold text-gray-900">{total}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="text-xs text-gray-500 mb-2">本月邀请</div>
          <div className="text-2xl font-bold text-teal-600">{monthCount}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="text-xs text-gray-500 mb-2">活跃客户数</div>
          <div className="text-2xl font-bold text-blue-600">{activeCount}</div>
        </div>
      </div>

      {/* 最近客户列表 */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h3 className="font-bold text-gray-800">最近邀请的客户</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left">
                <th className="px-5 py-3 text-gray-500 font-medium">客户邮箱</th>
                <th className="px-5 py-3 text-gray-500 font-medium">注册时间</th>
                <th className="px-5 py-3 text-gray-500 font-medium">排盘记录</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-gray-400">
                    暂无邀请客户
                  </td>
                </tr>
              ) : (
                customers.slice(0, 20).map((c) => (
                  <tr key={c.id} className="border-b hover:bg-gray-50 last:border-0">
                    <td className="px-5 py-3 text-gray-900">{c.email}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString('zh-CN') : '-'}
                    </td>
                    <td className="px-5 py-3 text-gray-900 font-medium">{c.totalRecords || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
