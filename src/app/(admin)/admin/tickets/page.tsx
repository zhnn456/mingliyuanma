'use client';

import { useState, useEffect } from 'react';

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [detail, setDetail] = useState<any>(null);
  const [replyText, setReplyText] = useState('');

  const fetchTickets = async () => {
    const params = filter ? `?status=${filter}` : '';
    const res = await fetch(`/api/admin/tickets${params}`);
    if (res.ok) setTickets((await res.json()).tickets || []);
  };

  useEffect(() => { fetchTickets(); }, [filter]);

  const openDetail = async (id: string) => {
    const res = await fetch(`/api/ticket/${id}`);
    if (res.ok) setDetail(await res.json());
  };

  const sendReply = async () => {
    if (!replyText || !detail) return;
    await fetch(`/api/ticket/${detail.ticket.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: replyText }) });
    setReplyText(''); openDetail(detail.ticket.id);
  };

  const closeTicket = async (id: string) => {
    await fetch('/api/admin/tickets', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticketId: id, status: 'closed' }) });
    fetchTickets(); if (detail?.ticket?.id === id) setDetail(null);
  };

  const statusMap: Record<string, string> = { open: '进行中', closed: '已关闭' };
  const statusColor: Record<string, string> = { open: 'bg-green-100 text-green-800', closed: 'bg-gray-100 text-gray-600' };
  const categoryMap: Record<string, string> = { billing: '账单', technical: '技术', account: '账号', other: '其他' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-lg font-bold text-gray-900">客服工单</h2><p className="text-sm text-gray-500">共 {tickets.length} 个工单</p></div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">全部</option><option value="open">进行中</option><option value="closed">已关闭</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {tickets.length === 0 ? (
          <div className="text-center py-16 text-gray-400">暂无工单</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b text-left">
              <th className="px-4 py-3 text-gray-500 font-medium">标题</th><th className="px-4 py-3 text-gray-500 font-medium">用户</th>
              <th className="px-4 py-3 text-gray-500 font-medium">分类</th><th className="px-4 py-3 text-gray-500 font-medium">状态</th>
              <th className="px-4 py-3 text-gray-500 font-medium">时间</th><th className="px-4 py-3 text-gray-500 font-medium">操作</th>
            </tr></thead>
            <tbody>
              {tickets.map((t: any) => (
                <tr key={t.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">{t.title}</td>
                  <td className="px-4 py-3 text-gray-600">{t.userEmail || t.userName || '-'}</td>
                  <td className="px-4 py-3">{categoryMap[t.category] || t.category}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded ${statusColor[t.status] || ''}`}>{statusMap[t.status] || t.status}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(t.createdAt).toLocaleString('zh-CN')}</td>
                  <td className="px-4 py-3"><button onClick={() => openDetail(t.id)} className="text-xs text-blue-600 hover:text-blue-800">处理</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {detail && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">{detail.ticket?.title}</h3>
              <div className="flex gap-2">
                {detail.ticket?.status === 'open' && (
                  <button onClick={() => closeTicket(detail.ticket.id)} className="px-3 py-1.5 text-xs border rounded-lg text-gray-600 hover:bg-gray-50">关闭工单</button>
                )}
                <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
            </div>
            <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto">
              {(detail.messages || []).map((m: any) => (
                <div key={m.id} className={`p-4 rounded-xl ${m.isStaff ? 'bg-blue-50 mr-8' : 'bg-gray-50 ml-8'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-700">{m.isStaff ? '客服(我)' : '用户'}</span>
                    <span className="text-xs text-gray-400">{new Date(m.createdAt).toLocaleString('zh-CN')}</span>
                  </div>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap">{m.content}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="输入回复..." rows={2} className="flex-1 px-3 py-2 border rounded-lg text-sm" />
              <button onClick={sendReply} className="px-4 py-2 bg-red-700 text-white rounded-lg text-sm self-end">回复</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
