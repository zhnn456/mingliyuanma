'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-client';

interface ChangelogEntry {
  version: string;
  title: string;
  category: string;
  content: string;
  createdAt: string;
}

interface UpdateInfo {
  currentVersion: string | null;
  latestVersion: string | null;
  changelog: ChangelogEntry[];
}

function parseContent(contentStr: string) {
  try {
    const arr = JSON.parse(contentStr);
    if (Array.isArray(arr)) return arr as { title: string; items: string[] }[];
    return [];
  } catch {
    return [];
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return dateStr;
  }
}

function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/i, '').split(/[.\-]/);
  const pb = b.replace(/^v/i, '').split(/[.\-]/);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = parseInt(pa[i] || '0', 10);
    const nb = parseInt(pb[i] || '0', 10);
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  '新增': { icon: '📌', color: 'bg-blue-100 text-blue-700' },
  '改进': { icon: '🔧', color: 'bg-purple-100 text-purple-700' },
  '修复': { icon: '⚠️', color: 'bg-orange-100 text-orange-700' },
  '新增功能': { icon: '📌', color: 'bg-blue-100 text-blue-700' },
  '功能改进': { icon: '🔧', color: 'bg-purple-100 text-purple-700' },
};

export default function AgentUpdatesPage() {
  const { user } = useAuth();
  const [info, setInfo] = useState<UpdateInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState<{ success: boolean; message: string } | null>(null);

  const loadInfo = async () => {
    setLoading(true);
    setUpdateResult(null);
    try {
      const res = await fetch('/api/agent/updates');
      if (res.ok) {
        const data: UpdateInfo = await res.json();
        setInfo(data);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadInfo();
  }, []);

  const handleUpdate = async () => {
    if (!info?.latestVersion) return;
    setUpdating(true);
    setUpdateResult(null);
    try {
      const res = await fetch('/api/agent/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setUpdateResult({
        success: res.ok,
        message: data.message || data.error || (res.ok ? '更新请求已提交' : '更新失败'),
      });
    } catch {
      setUpdateResult({ success: false, message: '网络错误，请重试' });
    }
    setUpdating(false);
  };

  if (!user || user.role !== 'agent') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">无权限访问</h1>
          <p className="text-gray-500">请使用代理商账号登录</p>
        </div>
      </div>
    );
  }

  const hasNewVersion = info?.latestVersion && info?.currentVersion
    ? compareVersions(info.latestVersion, info.currentVersion) > 0
    : false;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">系统更新</h1>
        <p className="text-sm text-gray-500 mt-1">查看系统版本更新日志，申请系统更新</p>
      </div>

      {updateResult && (
        <div className={`mb-4 p-4 rounded-lg border ${updateResult.success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <div className="flex items-center gap-2">
            <span>{updateResult.success ? '✅' : '❌'}</span>
            <span className="font-medium">{updateResult.message}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-5">
          <div className="text-xs text-gray-500 mb-2">当前版本</div>
          <div className="text-2xl font-bold text-gray-900">
            {info?.currentVersion ? `v${info.currentVersion}` : '—'}
          </div>
          <div className="text-xs text-gray-400 mt-1">正在运行的版本</div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="text-xs text-gray-500 mb-2">最新版本</div>
          <div className="text-2xl font-bold text-blue-600">
            {info?.latestVersion ? `v${info.latestVersion}` : '—'}
          </div>
          <div className="text-xs text-gray-400 mt-1">最新发布的版本</div>
        </div>

        <div className={`rounded-xl border p-5 ${hasNewVersion ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
          <div className="text-xs text-gray-500 mb-2">更新状态</div>
          {loading ? (
            <div className="text-lg font-bold text-gray-400">加载中...</div>
          ) : hasNewVersion ? (
            <>
              <div className="text-lg font-bold text-blue-600 mb-1">有新版本可用</div>
              <div className="text-xs text-gray-500">建议尽快更新以获得最新功能和修复</div>
            </>
          ) : (
            <>
              <div className="text-lg font-bold text-green-600 mb-1">已是最新版本</div>
              <div className="text-xs text-gray-500">您的系统已保持最新</div>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">更新操作</h2>
          <span className="text-xs text-gray-400">提交更新请求后，系统将自动处理</span>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={handleUpdate}
            disabled={updating || !hasNewVersion}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              updating || !hasNewVersion
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {updating ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                更新中...
              </span>
            ) : hasNewVersion ? (
              '立即更新'
            ) : (
              '已是最新版本'
            )}
          </button>
          {hasNewVersion && !updating && (
            <span className="text-xs text-gray-500">
              将系统从 v{info?.currentVersion} 更新到 v{info?.latestVersion}
            </span>
          )}
        </div>

        {updating && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />
              <div className="flex-1">
                <div className="text-sm font-medium text-blue-700">正在提交更新请求...</div>
                <div className="h-1.5 bg-blue-200 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border">
        <div className="p-5 border-b">
          <h2 className="text-lg font-bold text-gray-900">完整更新日志</h2>
          <p className="text-xs text-gray-500 mt-1">所有历史版本更新记录</p>
        </div>

        <div className="p-5 space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">加载中...</div>
          ) : info?.changelog.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">暂无更新日志</div>
          ) : (
            info?.changelog.map((log, idx) => {
              const sections = parseContent(log.content);
              return (
                <div key={idx} className="border border-gray-200 rounded-xl p-4 hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 bg-gray-900 text-white rounded-full text-xs font-mono font-semibold">
                      v{log.version}
                    </span>
                    {log.category && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${CATEGORY_META[log.category]?.color || 'bg-gray-100 text-gray-600'}`}>
                        {CATEGORY_META[log.category]?.icon || '📋'} {log.category}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{formatDate(log.createdAt)}</span>
                  </div>

                  {log.title && (
                    <p className="text-sm font-medium text-gray-800 mb-3">{log.title}</p>
                  )}

                  {sections.length > 0 ? (
                    <div className="space-y-3">
                      {sections.map((section, sIdx) => (
                        <div key={sIdx}>
                          <h4 className="text-xs font-semibold text-blue-600 mb-1.5 flex items-center gap-1">
                            <span>{CATEGORY_META[section.title]?.icon || '📋'}</span>
                            {section.title}
                          </h4>
                          {section.items.length > 0 && (
                            <ul className="space-y-1 pl-5">
                              {section.items.map((item, iIdx) => (
                                <li key={iIdx} className="text-sm text-gray-600 list-disc leading-relaxed">
                                  {item}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">暂无详细内容</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}