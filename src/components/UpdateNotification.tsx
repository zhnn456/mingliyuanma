'use client';

import { useState, useEffect, useCallback } from 'react';

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

interface UpdateNotificationProps {
  apiPath?: string;
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
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

const CATEGORY_META: Record<string, { icon: string; label: string }> = {
  '新增': { icon: '📌', label: '新增' },
  '改进': { icon: '🔧', label: '改进' },
  '修复': { icon: '⚠️', label: '修复' },
  '新增功能': { icon: '📌', label: '新增功能' },
  '功能改进': { icon: '🔧', label: '功能改进' },
};

export default function UpdateNotification({ apiPath = '/api/agent/updates' }: UpdateNotificationProps) {
  const [info, setInfo] = useState<UpdateInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');

  const checkUpdates = useCallback(async () => {
    try {
      const res = await fetch(apiPath);
      if (!res.ok) return;
      const data: UpdateInfo = await res.json();
      setInfo(data);

      if (data.latestVersion && data.currentVersion) {
        const isNewer = compareVersions(data.latestVersion, data.currentVersion) > 0;
        const dismissed = localStorage.getItem(`dismissed_update_${data.latestVersion}`);
        if (isNewer && !dismissed) {
          setShowBanner(true);
        }
      } else if (data.latestVersion && !data.currentVersion) {
        const dismissed = localStorage.getItem(`dismissed_update_${data.latestVersion}`);
        if (!dismissed) setShowBanner(true);
      }
    } catch {}
    setLoading(false);
  }, [apiPath]);

  useEffect(() => {
    checkUpdates();
  }, [checkUpdates]);

  const dismissNotification = () => {
    if (info?.latestVersion) {
      localStorage.setItem(`dismissed_update_${info.latestVersion}`, '1');
    }
    setShowBanner(false);
  };

  const handleUpdate = async () => {
    setUpdating(true);
    setUpdateMessage('');
    try {
      const updatePath = apiPath.replace('/updates', '/update');
      const res = await fetch(updatePath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok) {
        setUpdateMessage(data.message || '更新请求已提交');
        if (info?.latestVersion) {
          localStorage.setItem(`dismissed_update_${info.latestVersion}`, '1');
        }
        setShowBanner(false);
      } else {
        setUpdateMessage(data.error || '更新失败');
      }
    } catch {
      setUpdateMessage('网络错误，请重试');
    }
    setUpdating(false);
  };

  if (loading || !info) return null;

  const hasNewVersion = info.latestVersion && info.currentVersion
    ? compareVersions(info.latestVersion, info.currentVersion) > 0
    : !!info.latestVersion;

  return (
    <>
      {showBanner && hasNewVersion && (
        <div className="bg-white border-b border-blue-100 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-lg">
              🔄
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                有新版本 <span className="text-blue-600 font-bold">v{info.latestVersion}</span> 可用
              </p>
              <p className="text-xs text-gray-500">
                当前版本：v{info.currentVersion || '未知'} · 点击查看更新详情
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 font-medium"
            >
              查看更新
            </button>
            <button
              onClick={handleUpdate}
              disabled={updating}
              className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {updating ? '更新中...' : '立即更新'}
            </button>
            <button
              onClick={dismissNotification}
              className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
              aria-label="关闭"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {showModal && info && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="text-lg font-bold text-gray-900">更新日志</h3>
                {info.latestVersion && (
                  <p className="text-sm text-blue-600 mt-0.5">
                    最新版本：v{info.latestVersion}
                  </p>
                )}
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {info.changelog.length === 0 ? (
                <p className="text-center text-gray-400 py-8">暂无更新日志</p>
              ) : (
                info.changelog.map((log, idx) => {
                  const sections = parseContent(log.content);
                  return (
                    <div key={idx} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 bg-blue-600 text-white rounded-full text-xs font-mono font-semibold">
                          v{log.version}
                        </span>
                        <span className="text-xs text-gray-500">{formatDate(log.createdAt)}</span>
                        {log.category && (
                          <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                            {CATEGORY_META[log.category]?.icon || '📋'} {log.category}
                          </span>
                        )}
                      </div>
                      {log.title && (
                        <p className="text-sm font-medium text-gray-800 mb-2">{log.title}</p>
                      )}
                      {sections.length > 0 ? (
                        <div className="space-y-2">
                          {sections.map((section, sIdx) => (
                            <div key={sIdx}>
                              <h4 className="text-xs font-semibold text-blue-600 mb-1 flex items-center gap-1">
                                <span>{CATEGORY_META[section.title]?.icon || '📋'}</span>
                                {section.title}
                              </h4>
                              {section.items.length > 0 && (
                                <ul className="space-y-0.5 pl-4">
                                  {section.items.map((item, iIdx) => (
                                    <li key={iIdx} className="text-xs text-gray-600 list-disc">
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

            <div className="flex items-center justify-end gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
              {updateMessage && (
                <span className={`text-sm ${updateMessage.includes('失败') || updateMessage.includes('错误') ? 'text-red-600' : 'text-green-600'}`}>
                  {updateMessage}
                </span>
              )}
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100 text-gray-700"
              >
                关闭
              </button>
              <button
                onClick={handleUpdate}
                disabled={updating}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {updating ? '更新中...' : '立即更新'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}