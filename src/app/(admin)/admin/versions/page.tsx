'use client';

import { useState } from 'react';

// ==================== 版本管理规则 ====================
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

// ==================== 版本历史 ====================
const VERSION_HISTORY = [
  {
    version: 'v1.2.0',
    date: '2026-07-31',
    type: '次版本更新',
    typeColor: 'bg-blue-100 text-blue-700 border-blue-200',
    title: '梅花易数全面升级',
    isCurrent: true,
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
  },
  {
    version: 'v1.1.0',
    date: '2026-07-28',
    type: '次版本更新',
    typeColor: 'bg-blue-100 text-blue-700 border-blue-200',
    title: '性能优化与稳定性提升',
    isCurrent: false,
    changes: {
      新增: [
        '数据导出报表功能',
        '系统版本管理页面',
      ],
      改进: [
        '优化排盘引擎计算速度',
        '优化管理后台交互体验',
      ],
      修复: [
        '修复并发支付回调异常',
      ],
    },
  },
  {
    version: 'v1.0.3',
    date: '2026-07-20',
    type: '修订版本更新',
    typeColor: 'bg-green-100 text-green-700 border-green-200',
    title: '支付与通知系统',
    isCurrent: false,
    changes: {
      新增: [
        '接入微信/支付宝支付',
        '新增消息通知系统',
      ],
      改进: [
        '优化订单管理流程',
      ],
      修复: [],
    },
  },
  {
    version: 'v1.0.2',
    date: '2026-07-10',
    type: '修订版本更新',
    typeColor: 'bg-green-100 text-green-700 border-green-200',
    title: '会员等级系统',
    isCurrent: false,
    changes: {
      新增: [
        '会员等级与权益体系',
        '积分消耗与自动扣减',
      ],
      改进: [
        '优惠券UI优化',
      ],
      修复: [],
    },
  },
  {
    version: 'v1.0.0',
    date: '2026-06-15',
    type: '初始版本',
    typeColor: 'bg-gray-100 text-gray-700 border-gray-200',
    title: '系统初始版本发布',
    isCurrent: false,
    changes: {
      新增: [
        '排盘引擎上线（八字/紫微/奇门/梅花）',
        '积分与签到系统',
        '管理后台基础功能',
        '用户端基础功能',
      ],
      改进: [],
      修复: [],
    },
  },
];

// ==================== 模块影响范围 ====================
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

export default function AdminVersionsPage() {
  const [activeTab, setActiveTab] = useState<'rules' | 'history' | 'current'>('current');
  const [expandedVersion, setExpandedVersion] = useState<string | null>('v1.2.0');

  const currentVersion = VERSION_HISTORY.find(v => v.isCurrent);
  const totalUpdates = VERSION_HISTORY.length;

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
          <div className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg">
            <span className="text-xs opacity-80">当前版本</span>
            <div className="text-lg font-bold font-mono">{currentVersion?.version}</div>
          </div>
          <div className="px-4 py-2 bg-gray-100 rounded-lg text-center">
            <span className="text-xs text-gray-500">累计版本</span>
            <div className="text-lg font-bold text-gray-900">{totalUpdates}</div>
          </div>
        </div>
      </div>

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
          {VERSION_HISTORY[1] && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-blue-500">⇆</span>
                与上一版本对比
              </h3>
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">上一版本</div>
                  <div className="text-xl font-bold text-gray-600 font-mono">
                    {VERSION_HISTORY[1].version}
                  </div>
                  <div className="text-xs text-gray-400">{VERSION_HISTORY[1].date}</div>
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
                    {currentVersion.changes['新增']?.length || 0}
                  </div>
                  <div className="text-xs text-gray-500">新增功能</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {currentVersion.changes['改进']?.length || 0}
                  </div>
                  <div className="text-xs text-gray-500">改进优化</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {currentVersion.changes['修复']?.length || 0}
                  </div>
                  <div className="text-xs text-gray-500">问题修复</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 版本规则 Tab */}
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
          {VERSION_HISTORY.map((version, idx) => (
            <div
              key={version.version}
              className={`relative ${
                idx < VERSION_HISTORY.length - 1
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
                  <span className="text-xs text-gray-500">{version.date}</span>
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
                        const items = version.changes[cat];
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
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== 版本详情组件 ====================
function VersionDetail({ version }: { version: typeof VERSION_HISTORY[0] }) {
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
          const items = version.changes[cat];
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
