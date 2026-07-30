'use client';

import { useState, useEffect } from 'react';

const typeMap: Record<string, string> = {
  users: '用户数据',
  orders: '订单数据',
  records: '测算记录',
  transactions: '交易流水',
  members: '会员数据',
  agents: '代理商数据',
  coupons: '优惠券数据',
};

interface ExportLog {
  id: string;
  type: string;
  format: string;
  status: string;
  fileUrl: string | null;
  params: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export default function ExportLogsPage() {
  const [data, setData] = useState<ExportLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stats, setStats] = useState({ total: 0, monthCount: 0, todayCount: 0 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (searchKeyword) params.set('keyword', searchKeyword);
      if (startDate) params.set('startDate', new Date(startDate).toISOString());
      if (endDate) params.set('endDate', new Date(endDate + 'T23:59:59').toISOString());
      const res = await fetch(`/api/admin/export-logs?${params}`);
      if (res.ok) {
        const d = await res.json();
        setData(d.data || []);
        setTotal(d.total || 0);
        if (d.stats) setStats(d.stats);
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page]);

  const onSearch = () => { setPage(1); fetchData(); };

  const handleCleanup = async () => {
    if (!confirm('确定清理30天前的导出记录？此操作不可撤销。')) return;
    const res = await fetch('/api/admin/export-logs?action=cleanup', { method: 'DELETE' });
    if (res.ok) {
      const d = await res.json();
      alert(d.message || '清理完成');
      fetchData();
    } else {
      alert('清理失败');
    }
  };

  const handleDownload = (url: string | null) => {
    if (!url) { alert('文件链接不存在'); return; }
    window.open(url, '_blank');
  };

  const getFileName = (url: string | null) => {
    if (!url) return '-';
    try {
      const u = new URL(url);
      return u.pathname.split('/').pop() || url;
    } catch {
      return url.split('/').pop() || url;
    }
  };

  const fmtDate = (s: string | null) => s ? new Date(s).toLocaleString('zh-CN') : '-';
  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-slate-900">导出记录</h1>
        <p className="text-sm text-slate-500 mt-1">查看已完成的导出记录与文件下载</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { label: '总导出数', value: stats.total, color: 'text-blue-600' },
          { label: '本月导出', value: stats.monthCount, color: 'text-green-600' },
          { label: '今日导出', value: stats.todayCount, color: 'text-amber-600' },
          { label: '当前页', value: total, color: 'text-purple-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border p-4">
            <div className="text-sm text-slate-500">{s.label}</div>
            <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="flex items-center gap-3 p-4 border-b flex-wrap">
          <input
            value={keyword} onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder="搜索类型/文件"
            className="px-3 py-2 border rounded-lg text-sm flex-1 min-w-[200px]"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">从</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
            <span className="text-sm text-gray-500">至</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
          </div>
          <button onClick={onSearch} className="px-4 py-2 bg-slate-100 rounded-lg text-sm hover:bg-slate-200">搜索</button>
          <button onClick={handleCleanup} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100">清理旧记录</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left">
                <th className="px-4 py-3 text-gray-500 font-medium">类型</th>
                <th className="px-4 py-3 text-gray-500 font-medium">格式</th>
                <th className="px-4 py-3 text-gray-500 font-medium">文件名</th>
                <th className="px-4 py-3 text-gray-500 font-medium">创建者</th>
                <th className="px-4 py-3 text-gray-500 font-medium">完成时间</th>
                <th className="px-4 py-3 text-gray-500 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无数据</td></tr>
              ) : data.map((t) => (
                <tr key={t.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{typeMap[t.type] || t.type}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded uppercase">{t.format}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-[200px] truncate" title={t.fileUrl || ''}>{getFileName(t.fileUrl)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{t.createdBy || '-'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(t.updatedAt || t.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDownload(t.fileUrl)} className="text-green-600 hover:text-green-800 text-xs">下载</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-4 border-t">
          <span className="text-sm text-gray-500">共 {total} 条</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 border rounded text-sm disabled:opacity-50">上一页</button>
            <span className="px-3 py-1 text-sm">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 border rounded text-sm disabled:opacity-50">下一页</button>
          </div>
        </div>
      </div>
    </div>
  );
}
