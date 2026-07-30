'use client';

import { useState, useEffect, useMemo } from 'react';

type ZiweiRecord = {
  id: string;
  userId: string;
  name: string | null;
  gender: string;
  birthDate: string;
  birthTime: string;
  isLunar: number | boolean;
  mingGong: string | null;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
  userPhone: string | null;
};

const GENDER_LABEL: Record<string, string> = { male: '男', female: '女' };

export default function AdminZiweiPage() {
  const [records, setRecords] = useState<ZiweiRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stats, setStats] = useState({ total: 0, today: 0 });
  const [detail, setDetail] = useState<ZiweiRecord | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (keyword) params.set('keyword', keyword);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const res = await fetch(`/api/admin/ziwei?${params}`);
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
    if (!confirm('确定删除此紫微斗数记录？')) return;
    const res = await fetch(`/api/admin/ziwei?id=${id}`, { method: 'DELETE' });
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
          <h2 className="text-lg font-bold text-gray-900">紫微斗数记录</h2>
          <p className="text-sm text-gray-500">共 {total} 条记录</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="搜索姓名 / 用户"
            className="px-3 py-2 border rounded-lg text-sm bg-white w-44"
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
              <th className="px-4 py-3 text-gray-500 font-medium">姓名</th>
              <th className="px-4 py-3 text-gray-500 font-medium">性别</th>
              <th className="px-4 py-3 text-gray-500 font-medium">出生时间</th>
              <th className="px-4 py-3 text-gray-500 font-medium">命宫</th>
              <th className="px-4 py-3 text-gray-500 font-medium">创建时间</th>
              <th className="px-4 py-3 text-gray-500 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">加载中...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">暂无记录</td></tr>
            ) : (
              records.map((r) => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{r.userName || '-'}</div>
                    <div className="text-xs text-gray-500">{r.userEmail || r.userPhone || r.userId}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{r.name || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{GENDER_LABEL[r.gender] || r.gender || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    <div>{r.birthDate || '-'}</div>
                    <div className="text-xs text-gray-400">
                      {r.birthTime || '-'}{r.isLunar ? ' · 农历' : ' · 公历'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.mingGong || '-'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(r.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setDetail(r)} className="text-blue-600 hover:text-blue-800 text-xs">查看详情</button>
                      <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-700 text-xs">删除</button>
                    </div>
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

      {detail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">紫微斗数详情</h3>
            <div className="space-y-2 text-sm">
              <div className="flex"><span className="w-24 text-gray-500">排盘人</span><span>{detail.userName || '-'}（{detail.userEmail || detail.userPhone || '-'}）</span></div>
              <div className="flex"><span className="w-24 text-gray-500">姓名</span><span>{detail.name || '-'}</span></div>
              <div className="flex"><span className="w-24 text-gray-500">性别</span><span>{GENDER_LABEL[detail.gender] || detail.gender || '-'}</span></div>
              <div className="flex"><span className="w-24 text-gray-500">出生日期</span><span>{detail.birthDate || '-'}</span></div>
              <div className="flex"><span className="w-24 text-gray-500">出生时辰</span><span>{detail.birthTime || '-'}</span></div>
              <div className="flex"><span className="w-24 text-gray-500">历法</span><span>{detail.isLunar ? '农历' : '公历'}</span></div>
              <div className="flex"><span className="w-24 text-gray-500">命宫</span><span>{detail.mingGong || '-'}</span></div>
              <div className="flex"><span className="w-24 text-gray-500">创建时间</span><span>{formatDate(detail.createdAt)}</span></div>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setDetail(null)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
