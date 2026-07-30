'use client';

import { useState, useEffect, useMemo } from 'react';

type MeihuaRecord = {
  id: string;
  userId: string;
  method: string;
  input: string;
  upperGua: string;
  lowerGua: string;
  dongYao: number;
  benGua: string | null;
  huGua: string | null;
  bianGua: string | null;
  tiYong: string | null;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
  userPhone: string | null;
};

const METHOD_LABEL: Record<string, string> = {
  number: '数字起卦',
  text: '文字起卦',
  coin: '铜钱起卦',
  duangua: '断卦',
};

export default function AdminMeihuaPage() {
  const [records, setRecords] = useState<MeihuaRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stats, setStats] = useState({ total: 0, today: 0 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (keyword) params.set('keyword', keyword);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const res = await fetch(`/api/admin/meihua?${params}`);
      if (res.ok) {
        const d = await res.json();
        setRecords(d.data || []);
        setTotal(d.total || 0);
        if (d.stats) setStats(d.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, startDate, endDate]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const handleReset = () => {
    setKeyword('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此梅花易数记录？')) return;
    const res = await fetch(`/api/admin/meihua?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchData();
  };

  const formatDate = (s: string | null) => (s ? new Date(s).toLocaleString('zh-CN') : '-');

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="text-sm text-gray-500">总记录数</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="text-sm text-gray-500">今日新增</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{stats.today}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">梅花易数记录</h2>
          <p className="text-sm text-gray-500">共 {total} 条记录</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="搜索方法 / 输入 / 用户"
            className="px-3 py-2 border rounded-lg text-sm bg-white w-52"
          />
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          />
          <span className="text-gray-400 text-sm">至</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          />
          <button onClick={handleSearch} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">搜索</button>
          <button onClick={handleReset} className="px-4 py-2 text-sm border rounded-lg bg-white hover:bg-gray-50">重置</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-4 py-3 text-gray-500 font-medium">排盘人</th>
              <th className="px-4 py-3 text-gray-500 font-medium">起卦方法</th>
              <th className="px-4 py-3 text-gray-500 font-medium">输入</th>
              <th className="px-4 py-3 text-gray-500 font-medium">上卦</th>
              <th className="px-4 py-3 text-gray-500 font-medium">下卦</th>
              <th className="px-4 py-3 text-gray-500 font-medium">动爻</th>
              <th className="px-4 py-3 text-gray-500 font-medium">本卦</th>
              <th className="px-4 py-3 text-gray-500 font-medium">变卦</th>
              <th className="px-4 py-3 text-gray-500 font-medium">创建时间</th>
              <th className="px-4 py-3 text-gray-500 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="px-4 py-10 text-center text-gray-400">加载中...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-10 text-center text-gray-400">暂无记录</td></tr>
            ) : (
              records.map((r) => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{r.userName || '-'}</div>
                    <div className="text-xs text-gray-500">{r.userEmail || r.userPhone || r.userId}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">
                      {METHOD_LABEL[r.method] || r.method || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate" title={r.input}>{r.input || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{r.upperGua || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{r.lowerGua || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{r.dongYao ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{r.benGua || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{r.bianGua || '-'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(r.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-700 text-xs">删除</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-500">第 {page} / {totalPages} 页</span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 text-sm border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >上一页</button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 text-sm border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >下一页</button>
        </div>
      </div>
    </div>
  );
}
