'use client';

import { useState, useEffect, useMemo } from 'react';

type HealthItem = {
  id: string;
  companyName: string;
  domain: string | null;
  userEmail: string | null;
  userName: string | null;
  online: boolean;
  version: string | null;
  lastSyncAt: string | null;
  licenseExpiry: string | null;
  daysLeft: number | null;
  expiringSoon: boolean;
  expired: boolean;
  isActive: boolean;
  systemStatus: string;
};

type HealthData = {
  total: number;
  online: number;
  offline: number;
  expired: number;
  expiringSoon: number;
  agents: HealthItem[];
};

export default function AgentHealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/agent-health');
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    // 每 60 秒自动刷新（心跳 5 分钟一次）
    const timer = setInterval(fetchHealth, 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => {
    if (!data) return [];
    return [
      { label: '独立站总数', value: data.total, color: 'text-gray-900' },
      { label: '在线', value: data.online, color: 'text-green-600' },
      { label: '离线', value: data.offline, color: 'text-gray-500' },
      { label: '授权已过期', value: data.expired, color: 'text-red-600' },
      { label: '30天内到期', value: data.expiringSoon, color: 'text-amber-600' },
    ];
  }, [data]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">独立站健康看板</h2>
          <p className="text-sm text-gray-500">源码部署代理商站点状态（每 60 秒自动刷新）</p>
        </div>
        <button
          onClick={fetchHealth}
          className="px-4 py-2 text-sm border rounded-lg bg-white hover:bg-gray-50"
        >
          刷新
        </button>
      </div>

      {/* 统计卡 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border p-5">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 站点列表 */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-4 py-3 text-gray-500 font-medium">站点</th>
              <th className="px-4 py-3 text-gray-500 font-medium">登录账号</th>
              <th className="px-4 py-3 text-gray-500 font-medium">域名</th>
              <th className="px-4 py-3 text-gray-500 font-medium">状态</th>
              <th className="px-4 py-3 text-gray-500 font-medium">版本</th>
              <th className="px-4 py-3 text-gray-500 font-medium">最后同步</th>
              <th className="px-4 py-3 text-gray-500 font-medium">授权到期</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">加载中...</td>
              </tr>
            ) : !data || data.agents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无源码部署代理商</td>
              </tr>
            ) : (
              data.agents.map((a) => (
                <tr key={a.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{a.companyName}</div>
                    <div className="text-xs text-gray-400">{a.id}</div>
                  </td>
                  <td className="px-4 py-3">
                    {a.userEmail ? (
                      <>
                        <div className="text-sm text-gray-700">{a.userEmail}</div>
                        {a.userName && <div className="text-xs text-gray-400">{a.userName}</div>}
                      </>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {a.domain ? (
                      <a href={`https://${a.domain}`} target="_blank" rel="noreferrer"
                        className="text-blue-600 hover:underline font-mono text-xs">
                        {a.domain}
                      </a>
                    ) : (
                      <span className="text-gray-300">未绑定</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      a.expired
                        ? 'bg-red-100 text-red-700'
                        : a.online
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                    }`}>
                      {a.expired ? '授权过期' : a.online ? '在线' : '离线'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{a.version || '-'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {a.lastSyncAt ? new Date(a.lastSyncAt).toLocaleString('zh-CN') : '从未同步'}
                  </td>
                  <td className="px-4 py-3">
                    {a.daysLeft === null ? (
                      <span className="text-gray-300">-</span>
                    ) : (
                      <span className={`text-xs font-medium ${
                        a.expired ? 'text-red-600' : a.expiringSoon ? 'text-amber-600' : 'text-gray-600'
                      }`}>
                        {a.licenseExpiry ? new Date(a.licenseExpiry).toLocaleDateString('zh-CN') : '-'}
                        <span className="ml-1">（剩 {a.daysLeft} 天）</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
