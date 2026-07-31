'use client';

import { useState, useEffect, useCallback } from 'react';

// ==================== 版本管理规则（静态配置，不变） ====================
const VERSION_RULES = {
  format: 'v<主版本>.<次版本>.<修订版本>',
  examples: ['v1.0.0', 'v2.1.5', 'v3.0.0'],
  rules: [
    {
      level: '主版本号',
      symbol: 'X',
      trigger: '不兼容的API修改 / 重大架构调整 / 全新产品线',
      examples: ['v1.0.0 → v2.0.0'],
      color: 'red',
    },
    {
      level: '次版本号',
      symbol: 'Y',
      trigger: '新增功能 / 新模块 / 新业务能力',
      examples: ['v1.0.0 → v1.1.0'],
      color: 'blue',
    },
    {
      level: '修订版本号',
      symbol: 'Z',
      trigger: 'Bug修复 / 性能优化 / UI微调',
      examples: ['v1.0.0 → v1.0.1'],
      color: 'green',
    },
  ],
};

// ==================== 模块影响范围（静态配置，不变） ====================
const MODULE_IMPACT = {
  '排盘引擎': '核心算法',
  '梅花易数': '核心算法',
  '奇门遁甲': '核心算法',
  '紫微斗数': '核心算法',
  '八字排盘': '核心算法',
  '支付系统': '交易',
  '会员系统': '用户',
  '管理后台': '后台',
  '前端UI': '界面',
  '数据导出': '功能',
  '通知系统': '功能',
};

// ==================== 版本数据类型 ====================
interface VersionData {
  id: string;
  version: string;
  title: string;
  category: string;
  type: string;
  typeColor: string;
  date: string;
  isCurrent: boolean;
  isLatest: boolean;
  isDeprecated: boolean;
  changes: Record<string, string[]>;
  changelog: Array<{ title: string; items: string[] }>;
  downloadUrl?: string;
}

// ==================== 默认版本历史（API 不可用时作为 fallback） ====================
const FALLBACK_HISTORY: VersionData[] = [
  {
    id: 'ver_v4',
    version: 'v4.0.0',
    title: '商源：代理商 SaaS 分发体系',
    category: '主版本更新',
    type: '主版本更新',
    typeColor: 'bg-red-100 text-red-700 border-red-200',
    date: '2026-07-31',
    isCurrent: true,
    isLatest: true,
    isDeprecated: false,
    changes: {},
    changelog: [
      { title: '新增', items: ['HMAC-SHA256签名授权码体系', '代理商双重验证机制（本地+远程）', '中心化版本控制服务器', '自动分润计算引擎', '中央支付代理接口', '系统完整性校验', '离线宽限期容错机制', '源码水印防篡改'] },
      { title: '改进', items: ['中间件增加代理商License验证', '版本号构建时自动注入', '结算流程优化'] },
    ],
  },
  {
    id: 'ver_v1_2',
    version: 'v1.2.0',
    title: '梅花易数全面升级',
    category: '次版本更新',
    type: '次版本更新',
    typeColor: 'bg-blue-100 text-blue-700 border-blue-200',
    date: '2026-07-31',
    isCurrent: false,
    isLatest: false,
    isDeprecated: false,
    changes: {
      新增: [
        '梅花易数新增5种起卦方式（报数/方位/颜色/声音/姓名）',
        '64卦速查改为上下卦组合矩阵布局',
        '64卦矩阵增加八卦五行颜色区分',
        '起卦页面新增"测什么事"精致卡片式选择',
      ],
      改进: [
        '64卦矩阵清晰展示上卦+下卦组合关系',
        '每个卦单元格增加组合标记（如"乾+乾"）',
        '上卦列头、下卦行头增加箭头指向',
        '矩阵添加图例说明',
      ],
      修复: [
        '修复hexInfo类型未定义问题',
        '修复六爻详解显示错误',
      ],
    },
    changelog: [],
  },
  {
    id: 'ver_v1_1',
    version: 'v1.1.0',
    title: '性能优化与稳定性提升',
    category: '次版本更新',
    type: '次版本更新',
    typeColor: 'bg-blue-100 text-blue-700 border-blue-200',
    date: '2026-07-28',
    isCurrent: false,
    isLatest: false,
    isDeprecated: false,
    changes: {
      新增: ['数据导出报表功能', '系统版本管理页面'],
      改进: ['优化排盘引擎计算速度', '优化管理后台交互体验'],
      修复: ['修复并发支付回调异常'],
    },
    changelog: [],
  },
  {
    id: 'ver_v1_0_3',
    version: 'v1.0.3',
    title: '支付与通知系统',
    category: '修订版本更新',
    type: '修订版本更新',
    typeColor: 'bg-green-100 text-green-700 border-green-200',
    date: '2026-07-20',
    isCurrent: false,
    isLatest: false,
    isDeprecated: false,
    changes: {
      新增: ['接入微信/支付宝支付', '新增消息通知系统'],
      改进: ['优化订单管理流程'],
      修复: [],
    },
    changelog: [],
  },
  {
    id: 'ver_v1_0_0',
    version: 'v1.0.0',
    title: '系统初始版本发布',
    category: '初始版本',
    type: '初始版本',
    typeColor: 'bg-gray-100 text-gray-700 border-gray-200',
    date: '2026-06-15',
    isCurrent: false,
    isLatest: false,
    isDeprecated: false,
    changes: {
      新增: ['排盘引擎上线（八字/紫微/奇门/梅花）', '积分与签到系统', '管理后台基础功能', '用户端基础功能'],
      改进: [],
      修复: [],
    },
    changelog: [],
  },
];

// 统一获取 changes 数据（兼容 changelog 和 changes 两种格式）
function getChanges(version: VersionData): Record<string, string[]> {
  if (version.changes && Object.keys(version.changes).length > 0) {
    return version.changes;
  }
  if (version.changelog && version.changelog.length > 0) {
    const result: Record<string, string[]> = {};
    version.changelog.forEach((section) => {
      result[section.title] = section.items;
    });
    return result;
  }
  return {};
}

export default function AdminVersionsPage() {
  const [activeTab, setActiveTab] = useState<'rules' | 'history' | 'current'>('current');
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  const [versionHistory, setVersionHistory] = useState<VersionData[]>(FALLBACK_HISTORY);
  const [loading, setLoading] = useState(true);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  // 加载版本列表
  const loadVersions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/version/release');
      if (res.ok) {
        const data = await res.json();
        if (data.versions && data.versions.length > 0) {
          const mapped: VersionData[] = data.versions.map((v: any) => {
            const type = getVersionType(v.version);
            const changes: Record<string, string[]> = {};
            if (v.changelog) {
              try {
                const parsed = typeof v.changelog === 'string' ? JSON.parse(v.changelog) : v.changelog;
                if (Array.isArray(parsed)) {
                  parsed.forEach((s: any) => {
                    if (s.title && s.items) changes[s.title] = s.items;
                  });
                }
              } catch {}
            }
            return {
              id: v.id,
              version: v.version,
              title: v.title || '',
              category: v.category || type,
              type,
              typeColor: getVersionTypeColor(type),
              date: v.releaseAt ? new Date(v.releaseAt).toISOString().split('T')[0] : '',
              isCurrent: !!v.isLatest,
              isLatest: !!v.isLatest,
              isDeprecated: !!v.isDeprecated,
              changes,
              changelog: [],
              downloadUrl: v.downloadUrl,
            };
          });
          setVersionHistory(mapped);
          if (mapped.length > 0 && !expandedVersion) {
            setExpandedVersion(mapped[0].version);
          }
        }
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  const currentVersion = versionHistory.find(v => v.isCurrent) || versionHistory[0];
  const totalUpdates = versionHistory.length;

  // 发布新版本
  const handlePublish = async (data: PublishFormData) => {
    setPublishing(true);
    setPublishMsg('');
    try {
      const changelog = [
        { title: '新增', items: data.newFeatures.filter(Boolean) },
        { title: '改进', items: data.improvements.filter(Boolean) },
        { title: '修复', items: data.fixes.filter(Boolean) },
      ].filter(s => s.items.length > 0);

      const res = await fetch('/api/version/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: data.version,
          title: data.title,
          category: getVersionType(data.version),
          changelog,
          downloadUrl: data.downloadUrl,
          checksum: data.checksum,
          makeLatest: data.makeLatest,
        }),
      });

      const result = await res.json();
      if (res.ok) {
        setPublishMsg(`版本 ${data.version} 发布成功`);
        setShowPublishModal(false);
        loadVersions();
      } else {
        setPublishMsg(result.error || '发布失败');
      }
    } catch {
      setPublishMsg('网络错误，请重试');
    }
    setPublishing(false);
  };

  // 版本操作
  const handleVersionAction = async (id: string, action: string) => {
    setActionMsg('');
    try {
      const res = await fetch('/api/version/release', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const result = await res.json();
      if (res.ok) {
        setActionMsg(result.message || '操作成功');
        loadVersions();
      } else {
        setActionMsg(result.error || '操作失败');
      }
    } catch {
      setActionMsg('网络错误，请重试');
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">版本管理</h2>
          <p className="text-sm text-gray-500 mt-1">
            系统版本信息、升级规则与更新历史
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPublishModal(true)}
            className="px-4 py-2 bg-mingli-600 text-white rounded-lg text-sm font-medium hover:bg-mingli-700 transition-colors flex items-center gap-2"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M12 5v14M5 12h14"/></svg>
            发布新版本
          </button>
          <div className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg">
            <span className="text-xs opacity-80">当前版本</span>
            <div className="text-lg font-bold font-mono">{currentVersion?.version || '—'}</div>
          </div>
          <div className="px-4 py-2 bg-gray-100 rounded-lg text-center">
            <span className="text-xs text-gray-500">累计版本</span>
            <div className="text-lg font-bold text-gray-900">{totalUpdates}</div>
          </div>
        </div>
      </div>

      {/* 操作提示消息 */}
      {actionMsg && (
        <div className="px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 flex items-center justify-between">
          <span>{actionMsg}</span>
          <button onClick={() => setActionMsg('')} className="text-blue-400 hover:text-blue-600">✕</button>
        </div>
      )}

      {/* Tab 切换 */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {[
          { key: 'current', label: '📋 当前版本', desc: '最新版本详情' },
          { key: 'rules', label: '📐 版本规则', desc: '命名与升级规范' },
          { key: 'history', label: '📚 更新历史', desc: '全部版本记录' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'current' | 'rules' | 'history')}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 当前版本 Tab */}
      {activeTab === 'current' && currentVersion && (
        <div className="space-y-4">
          {/* 当前版本大卡片 */}
          <div className="bg-gradient-to-br from-red-500 via-orange-500 to-amber-500 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs opacity-80 mb-1">当前运行版本</div>
                <div className="text-4xl font-bold font-mono mb-2">{currentVersion.version}</div>
                <div className="text-lg font-medium opacity-95">{currentVersion.title}</div>
                <div className="text-sm opacity-80 mt-1">发布日期：{currentVersion.date}</div>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm">
                  {currentVersion.type}
                </span>
              </div>
            </div>
          </div>

          {/* 版本详情 */}
          <VersionDetail version={currentVersion} />

          {/* 上次版本对比 */}
          {versionHistory[1] && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-blue-500">⇆</span>
                与上一版本对比
              </h3>
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">上一版本</div>
                  <div className="text-xl font-bold text-gray-600 font-mono">
                    {versionHistory[1].version}
                  </div>
                  <div className="text-xs text-gray-400">{versionHistory[1].date}</div>
                </div>
                <div className="text-2xl text-gray-300">→</div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">当前版本</div>
                  <div className="text-xl font-bold text-red-600 font-mono">
                    {currentVersion.version}
                  </div>
                  <div className="text-xs text-gray-400">{currentVersion.date}</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {getChanges(currentVersion)['新增']?.length || getChanges(currentVersion)['新增功能']?.length || 0}
                  </div>
                  <div className="text-xs text-gray-500">新增功能</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {getChanges(currentVersion)['改进']?.length || getChanges(currentVersion)['功能改进']?.length || 0}
                  </div>
                  <div className="text-xs text-gray-500">改进优化</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {getChanges(currentVersion)['修复']?.length || 0}
                  </div>
                  <div className="text-xs text-gray-500">问题修复</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 版本规则 Tab（保持不变） */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          {/* 版本号格式说明 */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📐</span>
              版本号命名规则
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="text-center font-mono text-2xl font-bold text-gray-900 mb-2">
                <span className="text-red-500">v</span>
                <span className="text-red-500">{VERSION_RULES.examples[0].split('.')[0].replace('v', '')}</span>
                <span className="text-gray-400">.</span>
                <span className="text-blue-500">{VERSION_RULES.examples[0].split('.')[1]}</span>
                <span className="text-gray-400">.</span>
                <span className="text-green-500">{VERSION_RULES.examples[0].split('.')[2]}</span>
              </div>
              <div className="text-center text-xs text-gray-500">
                <span className="text-red-500">主版本号</span>
                <span className="mx-2">·</span>
                <span className="text-blue-500">次版本号</span>
                <span className="mx-2">·</span>
                <span className="text-green-500">修订版本号</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {VERSION_RULES.rules.map((rule) => (
                <div
                  key={rule.level}
                  className={`border rounded-xl p-4 ${
                    rule.color === 'red'
                      ? 'border-red-200 bg-red-50'
                      : rule.color === 'blue'
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-green-200 bg-green-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold font-mono ${
                        rule.color === 'red'
                          ? 'bg-red-500'
                          : rule.color === 'blue'
                            ? 'bg-blue-500'
                            : 'bg-green-500'
                      }`}
                    >
                      {rule.symbol}
                    </span>
                    <span className="font-bold text-gray-900">{rule.level}</span>
                  </div>
                  <div className="text-xs text-gray-600 mb-3">{rule.trigger}</div>
                  <div className="bg-white rounded p-2 text-xs font-mono text-gray-500">
                    {rule.examples.map((ex, i) => (
                      <div key={i}>{ex}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 升级流程 */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>🔄</span>
              版本升级流程
            </h3>

            <div className="space-y-3">
              {[
                {
                  step: '1',
                  title: '确定升级类型',
                  desc: '根据变更内容判断升级类型（主版本/次版本/修订版本）',
                  color: 'bg-red-500',
                },
                {
                  step: '2',
                  title: '更新版本号',
                  desc: '按照命名规则生成新版本号，在系统设置中更新配置',
                  color: 'bg-blue-500',
                },
                {
                  step: '3',
                  title: '记录更新日志',
                  desc: '在"更新日志"页面创建新版本记录，详细记录变更内容',
                  color: 'bg-purple-500',
                },
                {
                  step: '4',
                  title: '标记版本状态',
                  desc: '将新版本标记为"当前版本"，旧版本自动失效',
                  color: 'bg-green-500',
                },
                {
                  step: '5',
                  title: '通知与发布',
                  desc: '在"消息通知"页面发布版本更新公告',
                  color: 'bg-orange-500',
                },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div
                    className={`w-8 h-8 rounded-full ${item.color} text-white flex items-center justify-center font-bold text-sm shrink-0`}
                  >
                    {item.step}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="font-medium text-gray-900">{item.title}</div>
                    <div className="text-sm text-gray-500">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 变更范围参考 */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📊</span>
              变更范围参考
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(MODULE_IMPACT).map(([module, category]) => (
                <div
                  key={module}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="text-sm font-medium text-gray-900">{module}</div>
                  <div className="text-xs text-gray-500">{category}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 更新历史 Tab */}
      {activeTab === 'history' && (
        <div className="space-y-0">
          {loading && (
            <div className="text-center py-8 text-gray-400 text-sm">
              <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full mx-auto mb-2" />
              加载中...
            </div>
          )}
          {!loading && versionHistory.map((version, idx) => {
            const changes = getChanges(version);
            return (
            <div
              key={version.id || version.version}
              className={`relative ${
                idx < versionHistory.length - 1
                  ? 'pb-4 border-l-2 border-gray-200 ml-4'
                  : 'ml-4'
              }`}
            >
              <span
                className={`absolute -left-[9px] top-2 w-4 h-4 rounded-full border-2 border-white ${
                  idx === 0 ? 'bg-red-500' : 'bg-gray-400'
                }`}
              />

              <div className="ml-4">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 bg-gray-900 text-white rounded text-xs font-mono font-semibold">
                    {version.version}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${version.typeColor}`}>
                    {version.type}
                  </span>
                  {version.isCurrent && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs border border-green-200">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1" />
                      当前版本
                    </span>
                  )}
                  {version.isDeprecated && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs border border-gray-200">
                      已弃用
                    </span>
                  )}
                  <span className="text-xs text-gray-500">{version.date}</span>

                  {/* 版本操作按钮 */}
                  {!version.isCurrent && !version.isDeprecated && (
                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        onClick={() => handleVersionAction(version.id, 'make_latest')}
                        className="text-xs text-blue-600 hover:text-blue-700 px-2 py-0.5 hover:bg-blue-50 rounded"
                        title="设为最新版本"
                      >
                        设为最新
                      </button>
                      <button
                        onClick={() => handleVersionAction(version.id, 'deprecate')}
                        className="text-xs text-orange-600 hover:text-orange-700 px-2 py-0.5 hover:bg-orange-50 rounded"
                        title="弃用此版本"
                      >
                        弃用
                      </button>
                    </div>
                  )}
                  {version.isDeprecated && (
                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        onClick={() => handleVersionAction(version.id, 'undeprecate')}
                        className="text-xs text-green-600 hover:text-green-700 px-2 py-0.5 hover:bg-green-50 rounded"
                      >
                        恢复
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`确认删除版本 ${version.version}？此操作不可逆。`)) {
                            handleVersionAction(version.id, 'delete');
                          }
                        }}
                        className="text-xs text-red-600 hover:text-red-700 px-2 py-0.5 hover:bg-red-50 rounded"
                      >
                        删除
                      </button>
                    </div>
                  )}
                </div>

                <h4 className="font-bold text-gray-900 mb-2">{version.title}</h4>

                <button
                  onClick={() =>
                    setExpandedVersion(
                      expandedVersion === version.version ? null : version.version
                    )
                  }
                  className="text-xs text-blue-600 hover:text-blue-700 mb-2"
                >
                  {expandedVersion === version.version ? '收起 ▲' : '展开详情 ▼'}
                </button>

                {expandedVersion === version.version && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(['新增', '改进', '修复'] as const).map((cat) => {
                        const items = changes[cat];
                        if (!items || items.length === 0) return null;
                        const colorMap: Record<string, string> = {
                          新增: 'text-green-700 bg-green-50',
                          改进: 'text-blue-700 bg-blue-50',
                          修复: 'text-orange-700 bg-orange-50',
                        };
                        return (
                          <div>
                            <div className={`text-xs font-bold px-2 py-1 rounded inline-block mb-2 ${colorMap[cat]}`}>
                              {cat} ({items.length})
                            </div>
                            <ul className="space-y-1">
                              {items.map((item, i) => (
                                <li key={i} className="text-xs text-gray-600 pl-3 relative">
                                  <span className="absolute -left-2 top-1 w-1 h-1 bg-gray-400 rounded-full" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* 发布新版本弹窗 */}
      {showPublishModal && (
        <PublishModal
          onClose={() => { setShowPublishModal(false); setPublishMsg(''); }}
          onSubmit={handlePublish}
          publishing={publishing}
          message={publishMsg}
        />
      )}
    </div>
  );
}

// ==================== 版本详情组件（保持不变） ====================
function VersionDetail({ version }: { version: VersionData }) {
  const changes = getChanges(version);
  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs border ${version.typeColor}`}>
          {version.type}
        </span>
        <span className="text-sm text-gray-500">{version.date}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['新增', '改进', '修复'] as const).map((cat) => {
          const items = changes[cat];
          if (!items || items.length === 0) return null;
          const config = {
            新增: { color: 'green', icon: '📌', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
            改进: { color: 'blue', icon: '🔧', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
            修复: { color: 'orange', icon: '⚠️', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
          }[cat];
          
          return (
            <div className={`${config.bg} rounded-lg p-4 border ${config.border}`}>
              <div className="flex items-center gap-2 mb-3">
                <span>{config.icon}</span>
                <span className={`font-bold text-sm ${config.text}`}>
                  {cat} <span className="text-xs opacity-70">({items.length})</span>
                </span>
              </div>
              <ul className="space-y-2">
                {items.map((item, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${config.text.replace('text-', 'bg-')} mt-1.5 shrink-0`} />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==================== 发布新版本弹窗 ====================
interface PublishFormData {
  version: string;
  title: string;
  downloadUrl: string;
  checksum: string;
  makeLatest: boolean;
  newFeatures: string[];
  improvements: string[];
  fixes: string[];
}

function PublishModal({ onClose, onSubmit, publishing, message }: {
  onClose: () => void;
  onSubmit: (data: PublishFormData) => void;
  publishing: boolean;
  message: string;
}) {
  const [version, setVersion] = useState('');
  const [title, setTitle] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [checksum, setChecksum] = useState('');
  const [makeLatest, setMakeLatest] = useState(true);
  const [newFeatures, setNewFeatures] = useState<string[]>(['']);
  const [improvements, setImprovements] = useState<string[]>(['']);
  const [fixes, setFixes] = useState<string[]>(['']);

  const handleSubmit = () => {
    if (!version || !title) return;
    onSubmit({
      version, title, downloadUrl, checksum, makeLatest,
      newFeatures: newFeatures.filter(Boolean),
      improvements: improvements.filter(Boolean),
      fixes: fixes.filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-bold text-gray-900">发布新版本</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">版本号 *</label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="v4.1.0"
                className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
              />
              <p className="text-xs text-gray-400 mt-1">格式：vX.Y.Z</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">版本标题 *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="简短描述本次更新"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          {/* 下载信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">源码下载地址</label>
              <input
                type="text"
                value={downloadUrl}
                onChange={(e) => setDownloadUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">校验码（SHA256）</label>
              <input
                type="text"
                value={checksum}
                onChange={(e) => setChecksum(e.target.value)}
                placeholder="可选"
                className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
              />
            </div>
          </div>

          {/* 更新内容 */}
          <ChangelogEditor
            label="新增功能"
            items={newFeatures}
            onChange={setNewFeatures}
            placeholder="新增的功能描述"
          />
          <ChangelogEditor
            label="改进优化"
            items={improvements}
            onChange={setImprovements}
            placeholder="改进的内容描述"
          />
          <ChangelogEditor
            label="问题修复"
            items={fixes}
            onChange={setFixes}
            placeholder="修复的问题描述"
          />

          {/* 设为最新 */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <input
              type="checkbox"
              checked={makeLatest}
              onChange={(e) => setMakeLatest(e.target.checked)}
              className="w-4 h-4"
              id="makeLatest"
            />
            <label htmlFor="makeLatest" className="text-sm text-gray-700 cursor-pointer">
              设为最新版本（代理商将收到更新推送）
            </label>
          </div>

          {message && (
            <div className={`text-sm ${message.includes('成功') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100 text-gray-700">
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={publishing || !version || !title}
            className="px-4 py-2 text-sm bg-mingli-600 text-white rounded-lg hover:bg-mingli-700 disabled:opacity-50 font-medium"
          >
            {publishing ? '发布中...' : '确认发布'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== 更新日志编辑器 ====================
function ChangelogEditor({ label, items, onChange, placeholder }: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <button
          onClick={() => onChange([...items, ''])}
          className="text-xs text-blue-600 hover:text-blue-700"
        >
          + 添加
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => {
                const next = [...items];
                next[idx] = e.target.value;
                onChange(next);
              }}
              placeholder={placeholder}
              className="flex-1 px-3 py-1.5 border rounded-lg text-sm"
            />
            {items.length > 1 && (
              <button
                onClick={() => onChange(items.filter((_, i) => i !== idx))}
                className="text-gray-400 hover:text-red-500 w-6 h-6 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== 辅助函数 ====================
function getVersionType(version: string): string {
  const parts = version.replace(/^v/i, '').split('.');
  if (parts.length < 3) return '修订版本更新';
  const [major, minor, patch] = parts;
  if (patch === '0' && minor === '0') return '主版本更新';
  if (patch === '0') return '次版本更新';
  return '修订版本更新';
}

function getVersionTypeColor(type: string): string {
  if (type === '主版本更新') return 'bg-red-100 text-red-700 border-red-200';
  if (type === '次版本更新') return 'bg-blue-100 text-blue-700 border-blue-200';
  if (type === '修订版本更新') return 'bg-green-100 text-green-700 border-green-200';
  return 'bg-gray-100 text-gray-700 border-gray-200';
}
