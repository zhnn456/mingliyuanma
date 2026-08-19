'use client';

import { useState, useEffect } from 'react';

interface UpdateContent {
  title: string;
  items: string[];
}

interface UpdateVersion {
  id: string;
  version: string;
  title: string;
  category: string;
  content: string;
  isCurrent: boolean;
  isLatest: boolean;
  createdAt?: string;
}

interface UpdateFormData {
  version: string;
  title: string;
  category: string;
  isCurrent: boolean;
  isLatest: boolean;
  sections: UpdateContent[];
}

const CATEGORY_OPTIONS = [
  { value: '新增', label: '新增', icon: '📌' },
  { value: '改进', label: '改进', icon: '🔧' },
  { value: '修复', label: '修复', icon: '⚠️' },
];

const CATEGORY_META: Record<string, { icon: string; label: string }> = {
  '新增': { icon: '📌', label: '新增' },
  '改进': { icon: '🔧', label: '改进' },
  '修复': { icon: '⚠️', label: '修复' },
  '新增功能': { icon: '📌', label: '新增功能' },
  '功能改进': { icon: '🔧', label: '功能改进' },
};

const emptyForm: UpdateFormData = {
  version: '',
  title: '',
  category: '新增',
  isCurrent: false,
  isLatest: false,
  sections: [
    { title: '新增', items: [] },
    { title: '改进', items: [] },
    { title: '修复', items: [] },
  ],
};

function parseContent(contentStr: string): UpdateContent[] {
  try {
    const arr = JSON.parse(contentStr);
    if (Array.isArray(arr)) return arr as UpdateContent[];
    return [];
  } catch {
    return [];
  }
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return dateStr;
  }
}

interface UpgradeInfo {
  isCenter: boolean;
  currentVersion: string;
  hasUpdate?: boolean;
  latestVersion?: string;
  reason?: string;
  changelog?: string;
  downloadUrl?: string;
  upgradePlan?: string;
  upgradeExpiryAt?: string;
  error?: string;
  message?: string;
}

export default function AdminUpdatesPage() {
  const [versions, setVersions] = useState<UpdateVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeInfo, setUpgradeInfo] = useState<UpgradeInfo | null>(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeStatus, setUpgradeStatus] = useState('');
  const [upgradeResult, setUpgradeResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showRollback, setShowRollback] = useState(false);
  const [rollbackLoading, setRollbackLoading] = useState(false);
  const [rollbackList, setRollbackList] = useState<Array<{ path: string; name: string; ts: string; size: string; mtime: string }>>([]);
  const [rolling, setRolling] = useState(false);
  const [rollbackResult, setRollbackResult] = useState<{ success: boolean; message: string } | null>(null);

  const applyUpgrade = async () => {
    if (!confirm('确定要执行一键升级吗？升级过程中服务会短暂重启。')) return;

    setUpgrading(true);
    setUpgradeResult(null);
    setUpgradeStatus('正在下载升级包...');

    try {
      const res = await fetch('/api/admin/apply-upgrade', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        setUpgradeStatus('升级完成，正在重启...');
        setUpgradeResult({
          success: true,
          message: `${data.oldVersion} → ${data.newVersion}，服务正在重启`,
        });
        // 10 秒后刷新页面检查新版本
        setTimeout(() => {
          setUpgradeStatus('');
          setUpgrading(false);
          fetchUpgradeInfo();
        }, 10000);
      } else {
        setUpgradeResult({
          success: false,
          message: data.reason || data.error || '升级失败',
        });
        setUpgrading(false);
        setUpgradeStatus('');
      }
    } catch (e) {
      setUpgradeResult({
        success: false,
        message: e instanceof Error ? e.message : '网络错误',
      });
      setUpgrading(false);
      setUpgradeStatus('');
    }
  };

  const loadBackups = async () => {
    setRollbackLoading(true);
    try {
      const res = await fetch('/api/admin/rollback');
      const data = await res.json();
      setRollbackList(data.backups || []);
    } catch {
      setRollbackList([]);
    } finally {
      setRollbackLoading(false);
    }
  };

  const toggleRollback = () => {
    const next = !showRollback;
    setShowRollback(next);
    if (next && rollbackList.length === 0) loadBackups();
  };

  const applyRollback = async (backupPath: string, backupName: string) => {
    if (!confirm(`确定要回滚到此备份吗？\n${backupName}\n\n回滚后服务会短暂重启，当前版本将自动备份。`)) return;
    setRolling(true);
    setRollbackResult(null);
    try {
      const res = await fetch('/api/admin/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupPath }),
      });
      const data = await res.json();
      if (data.success) {
        setRollbackResult({ success: true, message: '已从备份恢复，服务正在重启' });
        setTimeout(() => {
          setShowRollback(false);
          setRolling(false);
          fetchUpgradeInfo();
        }, 10000);
      } else {
        setRollbackResult({ success: false, message: data.reason || data.error || '回滚失败' });
        setRolling(false);
      }
    } catch (e) {
      setRollbackResult({ success: false, message: e instanceof Error ? e.message : '网络错误' });
      setRolling(false);
    }
  };

  const fetchUpgradeInfo = async () => {
    setUpgradeLoading(true);
    try {
      const res = await fetch('/api/admin/upgrade-check');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setUpgradeInfo(data);
    } catch (e) {
      setUpgradeInfo({
        isCenter: false,
        currentVersion: 'v4.0.0',
        error: e instanceof Error ? e.message : '检查失败',
      });
    } finally {
      setUpgradeLoading(false);
    }
  };

  const fetchVersions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/updates?pageSize=100');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: UpdateVersion[] = data.logs || [];
      list.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
      setVersions(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
    fetchUpgradeInfo();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      ...emptyForm,
      sections: [
        { title: '新增', items: [] },
        { title: '改进', items: [] },
        { title: '修复', items: [] },
      ],
    });
    setModalOpen(true);
  };

  const openEditModal = (ver: UpdateVersion) => {
    setEditingId(ver.id);
    const sections = parseContent(ver.content);
    setFormData({
      version: ver.version,
      title: ver.title || '',
      category: ver.category || '新增',
      isCurrent: !!ver.isCurrent,
      isLatest: !!ver.isLatest,
      sections:
        sections.length > 0
          ? sections
          : [
              { title: '新增', items: [] },
              { title: '改进', items: [] },
              { title: '修复', items: [] },
            ],
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleSubmit = async () => {
    if (!formData.version.trim()) {
      setError('请填写版本号');
      return;
    }
    if (!formData.title.trim()) {
      setError('请填写版本标题');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const contentStr = JSON.stringify(
        formData.sections
          .map((s) => ({
            title: s.title,
            items: s.items.filter((i) => i.trim()),
          }))
          .filter((s) => s.items.length > 0)
      );

      if (editingId) {
        const res = await fetch('/api/admin/updates', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            version: formData.version,
            title: formData.title,
            category: formData.category,
            content: contentStr,
            isCurrent: formData.isCurrent,
            isLatest: formData.isLatest,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } else {
        const res = await fetch('/api/admin/updates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            version: formData.version,
            title: formData.title,
            category: formData.category,
            content: contentStr,
            isCurrent: formData.isCurrent,
            isLatest: formData.isLatest,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }
      closeModal();
      fetchVersions();
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定删除此版本更新日志？此操作不可恢复。')) return;
    try {
      const res = await fetch(`/api/admin/updates?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      fetchVersions();
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败');
    }
  };

  const toggleCurrent = async (ver: UpdateVersion) => {
    try {
      const res = await fetch('/api/admin/updates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: ver.id,
          isCurrent: !ver.isCurrent,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      fetchVersions();
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作失败');
    }
  };

  const updateSectionTitle = (idx: number, title: string) => {
    setFormData((prev) => {
      const sections = [...prev.sections];
      sections[idx] = { ...sections[idx], title };
      return { ...prev, sections };
    });
  };

  const updateSectionItem = (sIdx: number, iIdx: number, value: string) => {
    setFormData((prev) => {
      const sections = [...prev.sections];
      const items = [...sections[sIdx].items];
      items[iIdx] = value;
      sections[sIdx] = { ...sections[sIdx], items };
      return { ...prev, sections };
    });
  };

  const addSectionItem = (sIdx: number) => {
    setFormData((prev) => {
      const sections = [...prev.sections];
      sections[sIdx] = {
        ...sections[sIdx],
        items: [...sections[sIdx].items, ''],
      };
      return { ...prev, sections };
    });
  };

  const removeSectionItem = (sIdx: number, iIdx: number) => {
    setFormData((prev) => {
      const sections = [...prev.sections];
      const items = sections[sIdx].items.filter((_, i) => i !== iIdx);
      sections[sIdx] = { ...sections[sIdx], items };
      return { ...prev, sections };
    });
  };

  const addSection = () => {
    setFormData((prev) => ({
      ...prev,
      sections: [...prev.sections, { title: '自定义', items: [] }],
    }));
  };

  const removeSection = (idx: number) => {
    setFormData((prev) => {
      const sections = prev.sections.filter((_, i) => i !== idx);
      return { ...prev, sections };
    });
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
      {/* 系统升级检查卡片 */}
      <div className="mb-6 bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl">
                🔄
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">系统升级</h3>
                <p className="text-xs text-gray-500">检查并安装系统最新版本</p>
              </div>
            </div>
            <button
              onClick={fetchUpgradeInfo}
              disabled={upgradeLoading}
              className="px-4 py-2 text-sm border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 disabled:opacity-50 flex items-center gap-2"
            >
              {upgradeLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                  检查中...
                </>
              ) : (
                <>🔄 重新检查</>
              )}
            </button>
          </div>

          {upgradeInfo && !upgradeInfo.isCenter && (
            <div className="space-y-3">
              {/* 版本信息 */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">当前版本:</span>
                  <span className="px-2 py-0.5 bg-gray-900 text-white rounded text-xs font-mono font-semibold">
                    {upgradeInfo.currentVersion}
                  </span>
                </div>
                {upgradeInfo.latestVersion && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">最新版本:</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-mono font-semibold ${upgradeInfo.hasUpdate ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                      {upgradeInfo.latestVersion}
                    </span>
                  </div>
                )}
                {upgradeInfo.upgradePlan && upgradeInfo.upgradePlan !== 'none' && upgradeInfo.upgradeExpiryAt && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">升级服务:</span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs border border-blue-200">
                      {upgradeInfo.upgradePlan} · 至 {new Date(upgradeInfo.upgradeExpiryAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                )}
              </div>

              {/* 状态提示 */}
              {upgradeInfo.hasUpdate ? (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="text-orange-500 text-lg">⚠️</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-orange-900">
                        发现新版本 {upgradeInfo.latestVersion}
                      </p>
                      {upgradeInfo.changelog && (
                        <div className="mt-2 text-xs text-orange-700 whitespace-pre-wrap max-h-32 overflow-y-auto">
                          {upgradeInfo.changelog}
                        </div>
                      )}
                      <div className="mt-3 flex items-center gap-3">
                        <button
                          onClick={applyUpgrade}
                          disabled={upgrading}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2"
                        >
                          {upgrading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                              {upgradeStatus}
                            </>
                          ) : (
                            <>🚀 一键升级</>
                          )}
                        </button>
                        {upgradeResult && (
                          <span className={`text-xs ${upgradeResult.success ? 'text-green-600' : 'text-red-600'}`}>
                            {upgradeResult.success ? '✓ ' : '✗ '}{upgradeResult.message}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-gray-400">
                        点击"一键升级"将自动下载并安装更新，升级后服务会自动重启
                      </div>
                      {/* 回滚区域 */}
                      <div className="mt-3 pt-3 border-t border-orange-200">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={toggleRollback}
                            disabled={rolling}
                            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 border border-gray-300 inline-flex items-center gap-1.5"
                          >
                            {showRollback ? '收起备份列表' : '↩ 回滚到旧版本'}
                          </button>
                          {showRollback && (
                            <button
                              onClick={loadBackups}
                              disabled={rollbackLoading}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              {rollbackLoading ? '刷新中...' : '刷新列表'}
                            </button>
                          )}
                          {rollbackResult && (
                            <span className={`text-xs ${rollbackResult.success ? 'text-green-600' : 'text-red-600'}`}>
                              {rollbackResult.success ? '✓ ' : '✗ '}{rollbackResult.message}
                            </span>
                          )}
                        </div>
                        {showRollback && (
                          <div className="mt-2">
                            {rollbackLoading && rollbackList.length === 0 ? (
                              <div className="text-xs text-gray-400 py-2">加载备份列表中...</div>
                            ) : rollbackList.length === 0 ? (
                              <div className="text-xs text-gray-400 py-2">暂无可用备份</div>
                            ) : (
                              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                {rollbackList.map((b) => (
                                  <div key={b.path} className="flex items-center justify-between bg-white border border-gray-200 rounded-md px-3 py-1.5 text-xs">
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-gray-700 truncate">{b.name}</div>
                                      <div className="text-[10px] text-gray-400">
                                        {b.mtime && <span>时间: {b.mtime}</span>}
                                        {b.size && <span className="ml-2">大小: {b.size}</span>}
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => applyRollback(b.path, b.name)}
                                      disabled={rolling}
                                      className="ml-2 px-2 py-1 bg-red-50 text-red-600 border border-red-200 rounded text-[10px] font-medium hover:bg-red-100 disabled:opacity-50 whitespace-nowrap"
                                    >
                                      {rolling ? '回滚中...' : '回滚'}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="mt-1.5 text-[10px] text-gray-400">
                              回滚会将 .next 恢复到备份时的状态，当前版本会自动备份
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : upgradeInfo.error ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  ❌ {upgradeInfo.error}
                </div>
              ) : (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  ✅ {upgradeInfo.reason || '系统已是最新版本'}
                </div>
              )}
            </div>
          )}

          {upgradeInfo?.isCenter && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              🏢 {upgradeInfo.message || '中央平台模式，版本管理请通过 Git 部署流程进行'}
            </div>
          )}

          {!upgradeInfo && upgradeLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
              正在检查系统更新...
            </div>
          )}
        </div>
      </div>

      {/* 更新公告管理 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">更新公告</h2>
          <p className="text-sm text-gray-500 mt-1">
            维护展示给代理商和用户的产品更新公告（在代理商端展示，可新增/编辑/删除）
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
        >
          <span>+</span>
          <span>创建新版本</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {versions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-gray-500 mb-4">暂无更新日志，点击右上角创建第一个版本</p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            + 创建新版本
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {versions.map((ver) => {
            const sections = parseContent(ver.content);
            const isCurrent = !!ver.isCurrent;
            const isLatest = !!ver.isLatest;
            const catMeta = CATEGORY_META[ver.category] || {
              icon: '📋',
              label: ver.category,
            };

            return (
              <div
                key={ver.id}
                className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="inline-flex items-center px-3 py-1 bg-gray-900 text-white rounded-full text-xs font-mono font-semibold">
                        v{ver.version}
                      </span>
                      {isLatest && (
                        <span className="inline-flex items-center px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium border border-green-200">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5" />
                          最新版本
                        </span>
                      )}
                      {isCurrent && (
                        <span className="inline-flex items-center px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium border border-green-200">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5" />
                          当前版本
                        </span>
                      )}
                      <span className="text-sm text-gray-500">
                        {formatDate(ver.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isCurrent && (
                        <button
                          onClick={() => toggleCurrent(ver)}
                          className="text-xs px-3 py-1.5 border border-green-300 text-green-700 rounded-md hover:bg-green-50"
                        >
                          标记当前
                        </button>
                      )}
                      <button
                        onClick={() => openEditModal(ver)}
                        className="text-xs px-3 py-1.5 border rounded-md hover:bg-gray-50 text-gray-600"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(ver.id)}
                        className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-md hover:bg-red-50"
                      >
                        删除
                      </button>
                    </div>
                  </div>

                  {ver.title && (
                    <p className="mt-3 text-sm text-gray-700 leading-relaxed">
                      {ver.title}
                    </p>
                  )}

                  {sections.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                      {sections.map((section, sIdx) => {
                        const meta = CATEGORY_META[section.title] || {
                          icon: '📋',
                          label: section.title,
                        };
                        return (
                          <div key={sIdx}>
                            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5 mb-2">
                              <span>{meta.icon}</span>
                              <span className="text-blue-600">
                                {section.title}
                              </span>
                            </h4>
                            {section.items.length > 0 ? (
                              <ul className="space-y-1.5 pl-5">
                                {section.items.map((item, iIdx) => (
                                  <li
                                    key={iIdx}
                                    className="text-sm text-gray-600 leading-relaxed relative"
                                  >
                                    <span className="absolute -left-3 top-2 w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-gray-400 pl-5">
                                暂无条目
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {sections.length === 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-400 text-center py-3">
                      暂无详细内容
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-900">
                {editingId ? '编辑版本' : '创建新版本'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    版本号 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) =>
                      setFormData({ ...formData, version: e.target.value })
                    }
                    placeholder="v2.1.20260729"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    分类
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.icon} {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  标题 / 摘要 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="如：全平台管理后台重构"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isLatest"
                    checked={formData.isLatest}
                    onChange={(e) =>
                      setFormData({ ...formData, isLatest: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="isLatest"
                    className="text-sm text-gray-700 cursor-pointer"
                  >
                    标记为最新版本
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isCurrent"
                    checked={formData.isCurrent}
                    onChange={(e) =>
                      setFormData({ ...formData, isCurrent: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="isCurrent"
                    className="text-sm text-gray-700 cursor-pointer"
                  >
                    标记为当前版本
                  </label>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    更新内容
                  </label>
                  <button
                    onClick={addSection}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + 添加分类
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.sections.map((section, sIdx) => {
                    const meta = CATEGORY_META[section.title];
                    return (
                      <div
                        key={sIdx}
                        className="border rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-base">
                              {meta?.icon || '📋'}
                            </span>
                            <input
                              type="text"
                              value={section.title}
                              onChange={(e) =>
                                updateSectionTitle(sIdx, e.target.value)
                              }
                              className="px-2 py-1 border rounded text-sm font-medium text-gray-900 w-36 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <button
                            onClick={() => removeSection(sIdx)}
                            className="text-xs text-gray-400 hover:text-red-500"
                          >
                            删除分类
                          </button>
                        </div>

                        <div className="space-y-2">
                          {section.items.map((item, iIdx) => (
                            <div key={iIdx} className="flex items-center gap-2">
                              <span className="w-4 h-4 bg-gray-300 rounded-full shrink-0" />
                              <input
                                type="text"
                                value={item}
                                onChange={(e) =>
                                  updateSectionItem(sIdx, iIdx, e.target.value)
                                }
                                placeholder={`条目 ${iIdx + 1}`}
                                className="flex-1 px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <button
                                onClick={() => removeSectionItem(sIdx, iIdx)}
                                className="text-gray-400 hover:text-red-500 text-sm px-1"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => addSectionItem(sIdx)}
                          className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                          <span>+</span>
                          <span>添加条目</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100 text-gray-700"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting
                  ? '保存中...'
                  : editingId
                    ? '保存修改'
                    : '创建版本'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}