'use client';

import { useState, useEffect } from 'react';

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/agent-stats');
      if (res.ok) { const d = await res.json(); setAgents(d.agents || []); }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchAgents(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-lg font-bold text-gray-900">代理商数据监管</h2><p className="text-sm text-gray-500">共 {agents.length} 个代理商，监控其经营数据</p></div>
      </div>

      {/* 汇总卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="text-xs text-gray-500">代理商总数</div>
          <div className="text-xl font-bold text-gray-900">{agents.length}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="text-xs text-gray-500">总客户数</div>
          <div className="text-xl font-bold text-gray-900">
            {agents.reduce((s: number, a: any) => s + (a.stats?.customerCount || 0), 0)}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="text-xs text-gray-500">总交易额</div>
          <div className="text-xl font-bold text-green-600">
            ¥{agents.reduce((s: number, a: any) => s + (a.stats?.totalRevenue || 0), 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* 代理商列表 */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b text-left">
            <th className="px-4 py-3 text-gray-500 font-medium">品牌</th>
            <th className="px-4 py-3 text-gray-500 font-medium">联系人</th>
            <th className="px-4 py-3 text-gray-500 font-medium">邮箱</th>
            <th className="px-4 py-3 text-gray-500 font-medium">客户数</th>
            <th className="px-4 py-3 text-gray-500 font-medium">订单数</th>
            <th className="px-4 py-3 text-gray-500 font-medium">交易额</th>
            <th className="px-4 py-3 text-gray-500 font-medium">状态</th>
            <th className="px-4 py-3 text-gray-500 font-medium">操作</th>
          </tr></thead>
          <tbody>
            {agents.map((a: any) => (
              <tr key={a.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{a.brandName}</td>
                <td className="px-4 py-3 text-gray-600">{a.contactName || '-'}</td>
                <td className="px-4 py-3 text-xs">{a.userEmail || '-'}</td>
                <td className="px-4 py-3 font-bold">{a.stats?.customerCount || 0}</td>
                <td className="px-4 py-3">{a.stats?.totalOrders || 0}</td>
                <td className="px-4 py-3 font-bold text-green-600">¥{(a.stats?.totalRevenue || 0).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${a.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {a.isActive ? '启用' : '禁用'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => setDetail(a)} className="text-xs text-blue-600 hover:text-blue-800">详情</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detail && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-4">{detail.brandName} - 经营数据</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{detail.stats?.customerCount || 0}</div>
                <div className="text-xs text-gray-500">客户数</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{detail.stats?.totalOrders || 0}</div>
                <div className="text-xs text-gray-500">订单数</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">¥{(detail.stats?.totalRevenue || 0).toFixed(2)}</div>
                <div className="text-xs text-gray-500">交易额</div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {[
                ['公司', detail.brandName], ['联系人', detail.contactName], ['邮箱', detail.userEmail],
                ['授权码', detail.licenseKey], ['到期时间', detail.licenseExpiry ? new Date(detail.licenseExpiry).toLocaleDateString('zh-CN') : '-'],
                ['状态', detail.isActive ? '启用' : '禁用'], ['创建时间', detail.createdAt ? new Date(detail.createdAt).toLocaleString('zh-CN') : '-'],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-900">{value || '-'}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setDetail(null)} className="w-full mt-4 px-4 py-2 border rounded-lg text-sm">关闭</button>
          </div>
        </div>
      )}
    </div>
  );
}
