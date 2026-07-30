'use client';

import { useState, useEffect, useMemo } from 'react';

interface TrendPoint {
  date: string;
  amount: number;
  orders: number;
}

interface AgentStat {
  id: string;
  userId: string;
  companyName: string;
  contactName: string;
  contactPhone: string;
  domain: string;
  brandName: string;
  isActive: boolean;
  licenseExpiry: string | null;
  createdAt: string;
  userEmail: string;
  userName: string;
  orderCount: number;
  totalAmount: number;
  userCount: number;
  paipanCount: number;
  activePaipanCount: number;
  revenueTrend: TrendPoint[];
}

interface ApiResponse {
  summary: {
    totalAgents: number;
    activeAgents: number;
    totalUsers: number;
    totalRevenue: number;
  };
  agents: AgentStat[];
  total: number;
  page: number;
  pageSize: number;
}

interface StatCard {
  key: string;
  label: string;
  icon: string;
  color: string;
  isMoney?: boolean;
}

const STAT_CARDS: StatCard[] = [
  { key: 'totalAgents', label: '代理商总数', icon: '🏢', color: 'bg-blue-500' },
  { key: 'activeAgents', label: '活跃代理商', icon: '✅', color: 'bg-green-500' },
  { key: 'totalUsers', label: '代理商用户数', icon: '👥', color: 'bg-purple-500' },
  { key: 'totalRevenue', label: '代理商订单总额', icon: '💰', color: 'bg-yellow-500', isMoney: true },
];

const TIME_RANGES = [
  { key: 'all', label: '全部' },
  { key: 'month', label: '本月' },
  { key: 'quarter', label: '本季度' },
  { key: 'year', label: '本年' },
];

const SORT_OPTIONS = [
  { key: 'revenue', label: '按订单金额' },
  { key: 'orders', label: '按订单数' },
  { key: 'users', label: '按用户数' },
  { key: 'paipan', label: '按排盘数' },
];

const STATUS_OPTIONS = [
  { key: '', label: '全部状态' },
  { key: 'active', label: '活跃' },
  { key: 'inactive', label: '已停用' },
];

const ACTIVITY_LEVELS = [
  { min: 100, color: 'bg-red-100 text-red-700', label: '🔥 超活跃' },
  { min: 50, color: 'bg-orange-100 text-orange-700', label: '🔥 活跃' },
  { min: 10, color: 'bg-yellow-100 text-yellow-700', label: '⚡ 一般' },
  { min: 1, color: 'bg-blue-100 text-blue-700', label: '🌱 低活' },
  { min: 0, color: 'bg-gray-100 text-gray-600', label: '💤 沉寂' },
];

function getActivityLevel(count: number) {
  return ACTIVITY_LEVELS.find((l) => count >= l.min) || ACTIVITY_LEVELS[ACTIVITY_LEVELS.length - 1];
}

export default function AgentStatsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('all');
  const [sortBy, setSortBy] = useState('revenue');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedAgent, setSelectedAgent] = useState<AgentStat | null>(null);

  const pageSize = 20;

  const loadData = async (options?: {
    timeRange?: string;
    sortBy?: string;
    status?: string;
    page?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (options?.timeRange || timeRange) params.set('timeRange', options?.timeRange || timeRange);
      if (options?.sortBy || sortBy) params.set('sortBy', options?.sortBy || sortBy);
      if (options?.status !== undefined ? options.status : status) {
        params.set('status', options?.status !== undefined ? options.status : status);
      }
      const p = options?.page || page;
      params.set('page', String(p));
      params.set('pageSize', String(pageSize));

      const res = await fetch(`/api/admin/agent-stats?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result: ApiResponse = await res.json();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData({ timeRange, sortBy, status, page: 1 });
    setPage(1);
  }, [timeRange, sortBy, status]);

  const maxRevenue = useMemo(() => {
    if (!data?.agents?.length) return 0;
    return Math.max(...data.agents.map((a) => a.totalAmount), 1);
  }, [data]);

  const maxPaipan = useMemo(() => {
    if (!data?.agents?.length) return 0;
    return Math.max(...data.agents.map((a) => a.paipanCount), 1);
  }, [data]);

  const totalPages = data ? Math.ceil(data.total / pageSize) : 1;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadData({ page: newPage });
  };

  const handleRefresh = () => {
    loadData({ page });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mr-3" />
        加载中...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <div className="text-red-500 mb-4">加载失败：{error || '未知错误'}</div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">代理商经营数据</h1>
          <p className="text-sm text-gray-500 mt-1">
            查看所有代理商的经营状况与数据排行
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <span>🔄</span>
          <span>刷新</span>
        </button>
      </div>

      {/* 汇总卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.map((card) => {
          const raw = (data.summary as unknown as Record<string, number>)[card.key];
          const value = card.isMoney
            ? `¥${(raw || 0).toFixed(2)}`
            : raw ?? 0;
          return (
            <div
              key={card.key}
              className="bg-white rounded-xl p-5 shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center text-white text-lg shrink-0`}
                >
                  {card.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-gray-500 truncate">{card.label}</div>
                  <div className="text-xl font-bold text-gray-900 truncate">{value}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 筛选器 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">时间范围：</span>
            <div className="flex rounded-lg border overflow-hidden">
              {TIME_RANGES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTimeRange(t.key)}
                  className={`px-3 py-1.5 text-sm transition-colors ${
                    timeRange === t.key
                      ? 'bg-red-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">状态：</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-1.5 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">排序：</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 代理商排行榜表格 */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-5 py-4 border-b bg-gray-50">
          <h2 className="font-bold text-gray-900">代理商排行榜</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider bg-gray-50">
                <th className="px-5 py-3">排名</th>
                <th className="px-5 py-3">代理商</th>
                <th className="px-5 py-3 text-right">用户数</th>
                <th className="px-5 py-3 text-right">订单数</th>
                <th className="px-5 py-3 text-right">订单金额</th>
                <th className="px-5 py-3 text-right">排盘数</th>
                <th className="px-5 py-3">活跃度</th>
                <th className="px-5 py-3">状态</th>
                <th className="px-5 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.agents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-gray-400">
                    暂无代理商数据
                  </td>
                </tr>
              ) : (
                data.agents.map((agent: AgentStat, index: number) => {
                  const activity = getActivityLevel(agent.activePaipanCount);
                  const revenueWidth = maxRevenue > 0 ? (agent.totalAmount / maxRevenue) * 100 : 0;
                  const paipanWidth = maxPaipan > 0 ? (agent.paipanCount / maxPaipan) * 100 : 0;

                  return (
                    <tr
                      key={agent.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedAgent(agent)}
                    >
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
                          index < 3
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {index + 1 + (page - 1) * pageSize}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900">{agent.companyName}</div>
                        <div className="text-xs text-gray-500">{agent.brandName} · {agent.domain}</div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="text-sm font-semibold text-gray-900">{agent.userCount}</div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="text-sm font-semibold text-gray-900">{agent.orderCount}</div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="text-sm font-bold text-green-600">
                          ¥{agent.totalAmount.toFixed(2)}
                        </div>
                        <div className="w-20 bg-gray-100 rounded-full h-1.5 mt-1 ml-auto overflow-hidden">
                          <div
                            className="bg-green-400 h-full rounded-full transition-all"
                            style={{ width: `${revenueWidth}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="text-sm font-semibold text-gray-900">{agent.paipanCount}</div>
                        <div className="w-20 bg-gray-100 rounded-full h-1.5 mt-1 ml-auto overflow-hidden">
                          <div
                            className="bg-purple-400 h-full rounded-full transition-all"
                            style={{ width: `${paipanWidth}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${activity.color}`}>
                          {activity.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {agent.isActive ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            活跃
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            已停用
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAgent(agent);
                          }}
                          className="text-xs text-red-500 hover:underline"
                        >
                          详情 →
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t flex items-center justify-between">
            <div className="text-sm text-gray-500">
              共 {data.total} 条，第 {page}/{totalPages} 页
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                上一页
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 详情弹窗 */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-gray-900">{selectedAgent.companyName}</h3>
              <button
                onClick={() => setSelectedAgent(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-4 space-y-6">
              {/* 基础信息 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-3">基础信息</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">联系人：</span>
                    <span className="text-gray-900">{selectedAgent.contactName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">联系电话：</span>
                    <span className="text-gray-900">{selectedAgent.contactPhone}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">域名：</span>
                    <span className="text-gray-900">{selectedAgent.domain}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">品牌：</span>
                    <span className="text-gray-900">{selectedAgent.brandName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">授权到期：</span>
                    <span className="text-gray-900">
                      {selectedAgent.licenseExpiry
                        ? new Date(selectedAgent.licenseExpiry).toLocaleDateString('zh-CN')
                        : '永久'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">入驻时间：</span>
                    <span className="text-gray-900">
                      {new Date(selectedAgent.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* 经营数据 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-3">经营数据</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-xs text-blue-600">用户数</div>
                    <div className="text-lg font-bold text-blue-900">{selectedAgent.userCount}</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="text-xs text-purple-600">订单数</div>
                    <div className="text-lg font-bold text-purple-900">{selectedAgent.orderCount}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-xs text-green-600">订单金额</div>
                    <div className="text-lg font-bold text-green-900">
                      ¥{selectedAgent.totalAmount.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="text-xs text-orange-600">排盘总数</div>
                    <div className="text-lg font-bold text-orange-900">{selectedAgent.paipanCount}</div>
                  </div>
                </div>
              </div>

              {/* 趋势图 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-3">订单趋势</h4>
                {selectedAgent.revenueTrend && selectedAgent.revenueTrend.length > 0 ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-end gap-1 h-32">
                      {selectedAgent.revenueTrend.slice(-14).map((point, idx) => {
                        const max = Math.max(
                          ...selectedAgent.revenueTrend.map((p) => p.amount),
                          1
                        );
                        const h = max > 0 ? (point.amount / max) * 100 : 0;
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                            <div className="text-xs text-gray-600 font-semibold">
                              {point.amount > 0 ? `¥${point.amount.toFixed(0)}` : ''}
                            </div>
                            <div
                              className="w-full bg-gradient-to-t from-red-400 to-red-300 rounded-t transition-all"
                              style={{ height: `${h}%`, minHeight: point.amount > 0 ? '4px' : '0' }}
                              title={`${point.date}: ¥${point.amount.toFixed(2)}`}
                            />
                            <div className="text-xs text-gray-400 truncate w-full text-center">
                              {point.date.slice(5)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8 text-sm">暂无订单数据</div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedAgent(null)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-white transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}