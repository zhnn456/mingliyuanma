'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface ConfigItem {
  id?: string;
  key: string;
  value: string;
  category: string;
  updatedAt?: string;
}

interface AdminStats {
  totalUsers: number;
  totalPaipanRecords: number;
  todayOrders: number;
}

const FALLBACK_VERSION_ITEMS: ConfigItem[] = [
  { key: 'system_version', value: 'v1.0.3', category: 'version' },
  { key: 'api_version', value: 'v1.0.2', category: 'version' },
  { key: 'db_version', value: 'D1', category: 'version' },
  { key: 'last_deploy', value: '2026-07-28', category: 'version' },
];

const SYSTEM_INFO_FALLBACKS: Record<string, string> = {
  system_version: 'v1.0.3',
  api_version: 'v1.0.2',
  db_version: 'D1',
  last_deploy: '2026-07-28',
};

const UPDATE_HISTORY = [
  { version: 'v1.0.3', date: '2026-07-28', title: '性能优化与稳定性提升', items: ['优化排盘引擎计算速度', '修复并发支付回调异常', '新增数据导出报表功能'] },
  { version: 'v1.0.2', date: '2026-07-15', title: '支付与通知系统', items: ['接入微信/支付宝支付', '新增消息通知系统', '优化订单管理流程'] },
  { version: 'v1.0.1', date: '2026-07-01', title: '会员等级系统', items: ['新增会员等级与权益', '积分消耗与自动扣减', '优惠券 UI 优化'] },
  { version: 'v1.0.0', date: '2026-06-15', title: '初始版本发布', items: ['排盘引擎上线（八字/紫微/奇门/梅花）', '积分与签到系统', '管理后台基础功能'] },
];

export default function AdminVersionsPage() {
  const [versionConfigs, setVersionConfigs] = useState<ConfigItem[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState('');
  const [editingValue, setEditingValue] = useState('');
  const [savingKey, setSavingKey] = useState('');
  const [dbStatus, setDbStatus] = useState<'checking' | 'normal' | 'abnormal'>('checking');
  const [systemStartTime] = useState(Date.now());

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDbStatus('checking');

    try {
      const [configRes, statsRes] = await Promise.all([
        fetch('/api/admin/config'),
        fetch('/api/admin/stats'),
      ]);

      if (!configRes.ok) throw new Error(`配置加载失败: HTTP ${configRes.status}`);
      if (!statsRes.ok) throw new Error(`统计加载失败: HTTP ${statsRes.status}`);

      const configData = await configRes.json();
      const statsData = await statsRes.json();

      const allConfigs: ConfigItem[] = configData.configs || [];
      const versionConfigs = allConfigs.filter((c: ConfigItem) => c.category === 'version');
      setVersionConfigs(versionConfigs);

      const s = statsData.stats || {};
      setStats({
        totalUsers: s.totalUsers || 0,
        totalPaipanRecords: s.totalPaipanRecords || s.totalPaipan || 0,
        todayOrders: s.todayOrders || 0,
      });

      setDbStatus('normal');
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
      setDbStatus('abnormal');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getVersionValue = (key: string): string => {
    const found = versionConfigs.find((c) => c.key === key);
    return found?.value ?? SYSTEM_INFO_FALLBACKS[key] ?? '-';
  };

  const getVersionItems = (): { key: string; value: string; desc: string }[] => {
    const descMap: Record<string, string> = {
      system_version: '系统核心版本',
      api_version: '后端 API 版本',
      db_version: '数据库版本',
      last_deploy: '上次部署时间',
    };

    if (versionConfigs.length > 0) {
      return versionConfigs.map((c) => ({
        key: c.key,
        value: c.value,
        desc: descMap[c.key] || c.key,
      }));
    }

    return FALLBACK_VERSION_ITEMS.map((c) => ({
      key: c.key,
      value: c.value,
      desc: descMap[c.key] || c.key,
    }));
  };

  const startEdit = (item: { key: string; value: string }) => {
    setEditingKey(item.key);
    setEditingValue(item.value);
  };

  const cancelEdit = () => {
    setEditingKey('');
    setEditingValue('');
  };

  const saveEdit = async () => {
    if (!editingKey) return;
    setSavingKey(editingKey);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: editingKey,
          value: editingValue,
          category: 'version',
        }),
      });
      if (!res.ok) throw new Error(`保存失败: HTTP ${res.status}`);

      setVersionConfigs((prev) => {
        const exists = prev.find((c) => c.key === editingKey);
        if (exists) {
          return prev.map((c) =>
            c.key === editingKey ? { ...c, value: editingValue } : c
          );
        }
        return [...prev, { key: editingKey, value: editingValue, category: 'version' }];
      });
      cancelEdit();
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSavingKey('');
    }
  };

  const uptime = Math.floor((Date.now() - systemStartTime) / 1000);
  const uptimeStr = `${Math.floor(uptime / 60)}分${uptime % 60}秒`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mr-3" />
        加载中...
      </div>
    );
  }

  const versionItems = getVersionItems();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">版本管理</h2>
          <p className="text-sm text-gray-500 mt-1">系统版本信息与运行状态总览</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <span>🔄</span>
            <span>刷新状态</span>
          </button>
          <Link
            href="/admin/updates"
            className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex items-center gap-2"
          >
            <span>📝</span>
            <span>更新日志</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700">
            ✕
          </button>
        </div>
      )}

      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon="🖥️"
          iconColor="bg-blue-500"
          label="系统版本"
          value={getVersionValue('system_version')}
        />
        <StatCard
          icon="🔌"
          iconColor="bg-purple-500"
          label="API版本"
          value={getVersionValue('api_version')}
        />
        <StatCard
          icon="🗄️"
          iconColor="bg-green-500"
          label="数据库版本"
          value={getVersionValue('db_version')}
        />
        <StatCard
          icon="📅"
          iconColor="bg-orange-500"
          label="上次部署"
          value={getVersionValue('last_deploy')}
        />
      </div>

      {/* 版本信息表 + 系统状态 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 可编辑版本配置 */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">版本配置项</h3>
            <span className="text-xs text-gray-400">点击编辑按钮修改版本信息</span>
          </div>

          <div className="space-y-1">
            {versionItems.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between py-3 border-b last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm">{item.desc}</div>
                  <div className="text-xs text-gray-400 font-mono mt-0.5">{item.key}</div>
                </div>

                <div className="flex items-center gap-2">
                  {editingKey === item.key ? (
                    <>
                      <input
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        className="px-3 py-1.5 border rounded-lg text-sm w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={saveEdit}
                        disabled={savingKey === item.key}
                        className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs hover:bg-gray-800 disabled:opacity-50"
                      >
                        {savingKey === item.key ? '保存中' : '保存'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1.5 border rounded-lg text-xs hover:bg-gray-50"
                      >
                        取消
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium font-mono">
                        {item.value}
                      </span>
                      <button
                        onClick={() => startEdit(item)}
                        className="text-xs text-gray-500 hover:text-gray-700 ml-2"
                      >
                        编辑
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 leading-relaxed">
              💡 版本配置项存储在 SiteConfig 表中（category = 'version'），可通过
              <Link href="/admin/config" className="text-blue-600 hover:underline mx-1">
                系统设置
              </Link>
              页面管理全部配置。
            </p>
          </div>
        </div>

        {/* 系统状态 */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-bold text-gray-900 mb-4">系统状态</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">数据库状态</span>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                  dbStatus === 'normal'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : dbStatus === 'abnormal'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    dbStatus === 'normal' ? 'bg-green-500' : dbStatus === 'abnormal' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}
                />
                {dbStatus === 'normal' ? '正常' : dbStatus === 'abnormal' ? '异常' : '检测中'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">运行时长</span>
              <span className="text-sm font-mono text-gray-900">{uptimeStr}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">总用户数</span>
              <span className="text-sm font-bold text-gray-900">{stats?.totalUsers ?? 0}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">总排盘数</span>
              <span className="text-sm font-bold text-gray-900">{stats?.totalPaipanRecords ?? 0}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">今日订单</span>
              <span className="text-sm font-bold text-gray-900">{stats?.todayOrders ?? 0}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link
              href="/admin"
              className="block text-center w-full py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              查看详细统计 →
            </Link>
          </div>
        </div>
      </div>

      {/* 更新历史 */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">更新历史</h3>
          <Link
            href="/admin/updates"
            className="text-xs text-blue-600 hover:underline"
          >
            查看全部 →
          </Link>
        </div>

        <div className="space-y-5">
          {UPDATE_HISTORY.map((release, idx) => (
            <div
              key={release.version}
              className={`relative pl-6 ${
                idx < UPDATE_HISTORY.length - 1 ? 'pb-5 border-l-2 border-gray-100 ml-1' : 'ml-1'
              }`}
            >
              <span className="absolute -left-[9px] top-0 w-4 h-4 bg-gray-900 rounded-full border-2 border-white" />

              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center px-2 py-0.5 bg-gray-900 text-white rounded text-xs font-mono font-semibold">
                  {release.version}
                </span>
                <span className="text-xs text-gray-500">{release.date}</span>
              </div>

              <h4 className="text-sm font-semibold text-gray-900 mb-2">{release.title}</h4>

              <ul className="space-y-1">
                {release.items.map((item, i) => (
                  <li key={i} className="text-sm text-gray-600 leading-relaxed flex items-start gap-2">
                    <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  iconColor,
  label,
  value,
}: {
  icon: string;
  iconColor: string;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg ${iconColor} flex items-center justify-center text-white text-lg shrink-0`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-xs text-gray-500 truncate">{label}</div>
          <div className="text-lg font-bold text-gray-900 truncate font-mono">{value}</div>
        </div>
      </div>
    </div>
  );
}