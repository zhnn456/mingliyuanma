'use client';

import { useState, useEffect } from 'react';

type SignRecord = {
  no: string;
  name: string;
  domain: string;
  contact: string;
  email: string;
  signTime: string;
  ip: string;
  updatedAt: string | null;
};

export default function AgreementSignsPage() {
  const [signs, setSigns] = useState<SignRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSigns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agreement/signs');
      if (res.ok) {
        const d = await res.json();
        setSigns(d.signs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSigns(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">授权协议签署记录</h2>
          <p className="text-sm text-gray-500">共 {signs.length} 份协议已签署</p>
        </div>
        <button
          onClick={fetchSigns}
          className="px-4 py-2 text-sm border rounded-lg bg-white hover:bg-gray-50"
        >
          刷新
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-4 py-3 text-gray-500 font-medium">协议编号</th>
              <th className="px-4 py-3 text-gray-500 font-medium">乙方名称</th>
              <th className="px-4 py-3 text-gray-500 font-medium">域名</th>
              <th className="px-4 py-3 text-gray-500 font-medium">联系人</th>
              <th className="px-4 py-3 text-gray-500 font-medium">联系邮箱</th>
              <th className="px-4 py-3 text-gray-500 font-medium">签署时间</th>
              <th className="px-4 py-3 text-gray-500 font-medium">IP</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">加载中...</td>
              </tr>
            ) : signs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无签署记录</td>
              </tr>
            ) : (
              signs.map((s, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{s.no || '-'}</td>
                  <td className="px-4 py-3 text-gray-900">{s.name || '-'}</td>
                  <td className="px-4 py-3 text-blue-600 font-mono text-xs">{s.domain || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{s.contact || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{s.email || '-'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{s.signTime || (s.updatedAt ? new Date(s.updatedAt).toLocaleString('zh-CN') : '-')}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{s.ip || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
