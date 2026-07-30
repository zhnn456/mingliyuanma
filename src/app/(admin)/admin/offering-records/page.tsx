'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';

type OfferingRecord = {
  id: string;
  userId: string;
  itemId: string;
  supplyIds?: string | any;
  amount: number;
  type: string;
  startDate?: string;
  endDate?: string | null;
  status: string;
  createdAt?: string;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  itemName?: string;
  categoryId?: string;
};

const typeLabels: Record<string, string> = {
  single: '单次',
  monthly: '包月',
  yearly: '包年',
};

const statusLabels: Record<string, { label: string; cls: string }> = {
  active: { label: '活跃', cls: 'bg-green-100 text-green-800' },
  ended: { label: '已结束', cls: 'bg-gray-100 text-gray-700' },
  pending: { label: '进行中', cls: 'bg-yellow-100 text-yellow-800' },
  completed: { label: '已完成', cls: 'bg-green-100 text-green-800' },
  failed: { label: '失败', cls: 'bg-red-100 text-red-800' },
};

function parseSupplyIds(raw: any): any {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return raw;
}

function formatDate(s?: string | null) {
  if (!s) return '-';
  try {
    return new Date(s).toLocaleString('zh-CN');
  } catch {
    return String(s);
  }
}

function formatDateOnly(s?: string | null) {
  if (!s) return '-';
  try {
    return new Date(s).toLocaleDateString('zh-CN');
  } catch {
    return String(s);
  }
}

export default function OfferingRecordsPage() {
  const [data, setData] = useState<OfferingRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stats, setStats] = useState({ total: 0, active: 0, ended: 0, totalAmount: 0 });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (keyword) params.set('keyword', keyword);
      if (status) params.set('status', status);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/admin/offering-records?${params}`);
      if (res.ok) {
        const d = await res.json();
        setData(d.data || []);
        setTotal(d.total || 0);
        if (d.stats) setStats(d.stats);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, status, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const onSearch = () => {
    setPage(1);
    fetchData();
  };

  const onReset = () => {
    setKeyword('');
    setStatus('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const statCards = [
    { label: '总记录数', value: stats.total, color: 'text-slate-900' },
    { label: '活跃供奉', value: stats.active, color: 'text-green-700' },
    { label: '已结束', value: stats.ended, color: 'text-gray-700' },
    { label: '总金额', value: `¥${Number(stats.totalAmount || 0).toFixed(2)}`, color: 'text-amber-700' },
  ];

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-slate-900">供奉记录</h1>
        <p className="text-[13px] text-slate-500 mt-1">查看所有用户的供奉记录，支持按用户、状态、日期筛选</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="text-xs text-gray-500">{s.label}</div>
            <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4 flex flex-wrap items-center gap-3">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          placeholder="搜索用户邮箱/姓名或项目名称"
          className="px-3 py-2 border rounded-lg text-sm flex-1 min-w-[220px]"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="">全部状态</option>
          <option value="active">活跃</option>
          <option value="ended">已结束</option>
          <option value="pending">进行中</option>
          <option value="completed">已完成</option>
          <option value="failed">失败</option>
        </select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          />
          <span>至</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          />
        </div>
        <button
          onClick={onSearch}
          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200"
        >
          搜索
        </button>
        <button
          onClick={onReset}
          className="px-4 py-2 text-slate-500 text-sm hover:text-slate-700"
        >
          重置
        </button>
      </div>

      {/* 表格 */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-4 py-3 text-gray-500 font-medium">用户</th>
              <th className="px-4 py-3 text-gray-500 font-medium">供奉项目</th>
              <th className="px-4 py-3 text-gray-500 font-medium">类型</th>
              <th className="px-4 py-3 text-gray-500 font-medium">金额</th>
              <th className="px-4 py-3 text-gray-500 font-medium">开始日期</th>
              <th className="px-4 py-3 text-gray-500 font-medium">结束日期</th>
              <th className="px-4 py-3 text-gray-500 font-medium">状态</th>
              <th className="px-4 py-3 text-gray-500 font-medium">创建时间</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => {
              const expanded = expandedId === r.id;
              const supplies = parseSupplyIds(r.supplyIds);
              const st = statusLabels[r.status] || { label: r.status || '-', cls: 'bg-gray-100 text-gray-700' };
              return (
                <Fragment key={r.id}>
                  <tr
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedId(expanded ? null : r.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{r.userName || r.userEmail || r.userId}</div>
                      {r.userEmail && (
                        <div className="text-xs text-gray-400">{r.userEmail}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-900">{r.itemName || r.itemId || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{typeLabels[r.type] || r.type || '-'}</td>
                    <td className="px-4 py-3 font-bold text-amber-700">¥{Number(r.amount || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDateOnly(r.startDate)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDateOnly(r.endDate)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(r.createdAt)}</td>
                  </tr>
                  {expanded && (
                    <tr className="bg-amber-50/40">
                      <td colSpan={8} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-500 text-xs mb-1">记录编号</div>
                            <div className="font-mono text-xs text-gray-700 break-all">{r.id}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-xs mb-1">用户 ID</div>
                            <div className="font-mono text-xs text-gray-700 break-all">{r.userId}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-xs mb-1">项目 ID</div>
                            <div className="font-mono text-xs text-gray-700 break-all">{r.itemId}</div>
                          </div>
                          {r.userPhone && (
                            <div>
                              <div className="text-gray-500 text-xs mb-1">手机号</div>
                              <div className="text-gray-700">{r.userPhone}</div>
                            </div>
                          )}
                          <div className="md:col-span-2">
                            <div className="text-gray-500 text-xs mb-1">供品 / 祈愿信息</div>
                            <pre className="bg-white border rounded p-2 text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap">
                              {supplies ? JSON.stringify(supplies, null, 2) : '无'}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {data.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  暂无供奉记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      <div className="flex items-center justify-between mt-4 text-sm">
        <div className="text-gray-500">共 {total} 条，第 {page}/{totalPages} 页</div>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            上一页
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            下一页
          </button>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-40 pointer-events-none">
          <div className="bg-white px-4 py-2 rounded-lg shadow text-sm text-gray-600">加载中...</div>
        </div>
      )}
    </div>
  );
}
