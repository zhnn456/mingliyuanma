'use client';

import { useState, useEffect } from 'react';

interface UpdateLogEntry {
  id: string;
  version: string;
  title: string;
  content: string;
  type: 'update' | 'feature' | 'fix' | 'security' | 'hotfix';
  isMajor: boolean;
  changes?: { type: string; title: string; description?: string; breaking?: boolean }[];
  operatorId?: string;
  operatorName?: string;
  tag?: string;
  status: 'success' | 'failed' | 'rolled_back';
  rollbackVersion?: string;
  createdAt: string;
}

const TYPE_OPTIONS = [
  { value: '', label: '全部类型' },
  { value: 'feature', label: '新功能' },
  { value: 'update', label: '更新' },
  { value: 'fix', label: '修复' },
  { value: 'security', label: '安全' },
  { value: 'hotfix', label: '热修复' },
];

const TYPE_META: Record<string, { icon: string; label: string; color: string }> = {
  feature: { icon: '✨', label: '新功能', color: 'bg-blue-100 text-blue-700' },
  update: { icon: '🔄', label: '更新', color: 'bg-gray-100 text-gray-700' },
  fix: { icon: '🐛', label: '修复', color: 'bg-orange-100 text-orange-700' },
  security: { icon: '🔒', label: '安全', color: 'bg-red-100 text-red-700' },
  hotfix: { icon: '⚡', label: '热修复', color: 'bg-yellow-100 text-yellow-700' },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  success: { label: '成功', color: 'bg-green-100 text-green-700' },
  failed: { label: '失败', color: 'bg-red-100 text-red-700' },
  rolled_back: { label: '已回滚', color: 'bg-gray-100 text-gray-600' },
};

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return dateStr;
  }
}

export default function AdminUpdateLogsPage() {
  const [logs, setLogs] = useState<UpdateLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [keyword, setKeyword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [detailLog, setDetailLog] = useState<UpdateLogEntry | null>(null);
  const [rollbackModalOpen, setRollbackModalOpen] = useState(false);
  const [rollbackTarget, setRollbackTarget] = useState('');
  const [rollbackReason, setRollbackReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (filterType) params.set('type', filterType);
      if (filterStatus) params.set('status', filterStatus);
      if (keyword) params.set('keyword', keyword);

      const res = await fetch(`/api/admin/update-logs?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, filterType, filterStatus]);

  const handleSearch = () => {
    setPage(1);
    fetchLogs();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定删除此日志？此操作不可恢复。')) return;
    try {
      const res = await fetch(`/api/admin/update-logs?ids=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      fetchLogs();
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败');
    }
  };

  const handleRollback = async () => {
    if (!rollbackTarget) {
      setError('请输入目标版本号');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/update-logs/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetVersion: rollbackTarget,
          reason: rollbackReason,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setRollbackModalOpen(false);
      setRollbackTarget('');
      setRollbackReason('');
      fetchLogs();
    } catch (e) {
      setError(e instanceof Error ? e.message : '回滚失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mr-3" />
        加载中...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">系统更新日志</h2>
          <p className="text-sm text-gray-500 mt-1">
            记录系统版本更新、变更内容、操作人及回滚操作
          </p>
        </div>
        <button
          onClick={() => setRollbackModalOpen(true)}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 flex items-center gap-2"
        >
          <span>↩</span>
          <span>版本回滚</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700">
            ✕
          </button>
        </div>
      )}

      {/* 筛选器 */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">类型：</label>
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
              className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">状态：</label>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">全部状态</option>
              <option value="success">成功</option>
              <option value="failed">失败</option>
              <option value="rolled_back">已回滚</option>
            </select>
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索版本、标题、内容..."
              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              搜索
            </button>
          </div>
        </div>
      </div>

      {/* 日志列表 */}
      {logs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-500">暂无更新日志记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const typeMeta = TYPE_META[log.type] || { icon: '📋', label: log.type, color: 'bg-gray-100 text-gray-700' };
            const statusMeta = STATUS_META[log.status] || { label: log.status, color: 'bg-gray-100 text-gray-600' };
            
            return (
              <div
                key={log.id}
                className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setDetailLog(log)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${typeMeta.color}`}>
                        <span className="mr-1">{typeMeta.icon}</span>
                        {typeMeta.label}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 bg-gray-900 text-white rounded-full text-xs font-mono font-semibold">
                        v{log.version}
                      </span>
                      {log.isMajor && (
                        <span className="inline-flex items-center px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          重大更新
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusMeta.color}`}>
                        {statusMeta.label}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setDetailLog(log)}
                        className="text-xs px-3 py-1.5 border rounded-md hover:bg-gray-50 text-gray-600"
                      >
                        详情
                      </button>
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-md hover:bg-red-50"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <h3 className="text-sm font-semibold text-gray-900">{log.title}</h3>
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">{log.content}</p>
                  </div>
                  
                  {log.operatorName && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
                      <span>操作人：{log.operatorName}</span>
                      {log.tag && <span>标签：{log.tag}</span>}
                      {log.rollbackVersion && <span>回滚自：v{log.rollbackVersion}</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <span className="text-sm text-gray-600">
            第 {page} / {totalPages} 页
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      )}

      {/* 详情弹窗 */}
      {detailLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${(TYPE_META[detailLog.type]?.color) || 'bg-gray-100 text-gray-700'}`}>
                  {(TYPE_META[detailLog.type]?.icon) || '📋'} {(TYPE_META[detailLog.type]?.label) || detailLog.type}
                </span>
                <h3 className="text-lg font-bold text-gray-900">{detailLog.title}</h3>
              </div>
              <button
                onClick={() => setDetailLog(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">版本号：</span>
                  <span className="font-mono font-semibold">v{detailLog.version}</span>
                </div>
                <div>
                  <span className="text-gray-500">状态：</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_META[detailLog.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_META[detailLog.status]?.label || detailLog.status}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">创建时间：</span>
                  <span>{formatDateTime(detailLog.createdAt)}</span>
                </div>
                <div>
                  <span className="text-gray-500">操作人：</span>
                  <span>{detailLog.operatorName || '系统'}</span>
                </div>
                {detailLog.tag && (
                  <div className="col-span-2">
                    <span className="text-gray-500">标签：</span>
                    <span className="font-mono">{detailLog.tag}</span>
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">更新内容</h4>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                  {detailLog.content}
                </div>
              </div>
              
              {detailLog.changes && detailLog.changes.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">变更详情</h4>
                  <div className="space-y-2">
                    {detailLog.changes.map((change, i) => (
                      <div key={i} className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_META[change.type]?.color || 'bg-gray-100 text-gray-700'}`}>
                            {TYPE_META[change.type]?.label || change.type}
                          </span>
                          {change.breaking && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                              破坏性变更
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-medium text-gray-900">{change.title}</div>
                        {change.description && (
                          <div className="text-xs text-gray-500 mt-1">{change.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end p-5 border-t bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setDetailLog(null)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100 text-gray-700"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 回滚弹窗 */}
      {rollbackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-900">版本回滚</h3>
              <button
                onClick={() => setRollbackModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                ⚠️ 回滚操作会将系统版本切换到指定版本，并记录回滚日志。请谨慎操作。
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  目标版本号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={rollbackTarget}
                  onChange={(e) => setRollbackTarget(e.target.value)}
                  placeholder="如 v4.0.0"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  回滚原因
                </label>
                <textarea
                  value={rollbackReason}
                  onChange={(e) => setRollbackReason(e.target.value)}
                  placeholder="请说明回滚原因"
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setRollbackModalOpen(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100 text-gray-700"
              >
                取消
              </button>
              <button
                onClick={handleRollback}
                disabled={submitting}
                className="px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {submitting ? '执行中...' : '确认回滚'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
