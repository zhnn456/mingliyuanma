'use client';

import { useState, useEffect, useCallback } from 'react';

const STATUS_MAP: Record<string, string> = { open: '进行中', closed: '已关闭' };
const STATUS_COLOR: Record<string, string> = {
  open: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  closed: 'bg-gray-100 text-gray-600 border border-gray-200',
};
const CATEGORY_MAP: Record<string, string> = { billing: '账单', technical: '技术', account: '账号', other: '其他' };

const STAT_CARDS = [
  { key: 'total', label: '总会话数', color: 'from-slate-500 to-slate-600', icon: '💬' },
  { key: 'open', label: '进行中', color: 'from-emerald-500 to-emerald-600', icon: '🟢' },
  { key: 'closed', label: '已关闭', color: 'from-gray-500 to-gray-600', icon: '✅' },
  { key: 'todayNew', label: '今日新增', color: 'from-blue-500 to-blue-600', icon: '📨' },
];

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [stats, setStats] = useState<Record<string, number>>({ total: 0, open: 0, closed: 0, todayNew: 0 });
  const [detail, setDetail] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (status) params.set('status', status);
      if (q) params.set('q', q);
      const res = await fetch(`/api/admin/tickets?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
        setTotal(data.total || 0);
        setStats(data.stats || {});
      }
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, status, q]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const openDetail = async (id: string) => {
    const res = await fetch(`/api/admin/tickets?id=${id}`);
    if (res.ok) setDetail(await res.json());
  };

  const sendReply = async () => {
    if (!replyText || !detail) return;
    const res = await fetch('/api/admin/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reply', ticketId: detail.ticket.id, content: replyText }),
    });
    if (res.ok) {
      setReplyText('');
      openDetail(detail.ticket.id);
      fetchTickets();
    }
  };

  const closeTicket = async (id: string) => {
    await fetch('/api/admin/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'close', ticketId: id }),
    });
    fetchTickets();
    if (detail?.ticket?.id === id) setDetail(null);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const formatTime = (iso: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">客服工单</h2>
          <p className="text-sm text-gray-500 mt-0.5">管理用户工单会话，及时回复处理</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {STAT_CARDS.map(card => (
          <div key={card.key} className={`bg-gradient-to-br ${card.color} rounded-xl p-4 text-white shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-xs">{card.label}</p>
                <p className="text-2xl font-bold mt-1">{stats[card.key] || 0}</p>
              </div>
              <span className="text-2xl opacity-70">{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="flex items-center gap-3 p-4 border-b">
          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              value={q}
              onChange={e => { setQ(e.target.value); setPage(1); }}
              placeholder="搜索标题、用户名或邮箱..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部状态</option>
            <option value="open">进行中</option>
            <option value="closed">已关闭</option>
          </select>
          {q && (
            <button onClick={() => { setQ(''); setPage(1); }} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1">
              清除搜索
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left">
                <th className="px-4 py-3 text-gray-500 font-medium">标题</th>
                <th className="px-4 py-3 text-gray-500 font-medium">用户</th>
                <th className="px-4 py-3 text-gray-500 font-medium">分类</th>
                <th className="px-4 py-3 text-gray-500 font-medium">状态</th>
                <th className="px-4 py-3 text-gray-500 font-medium">消息数</th>
                <th className="px-4 py-3 text-gray-500 font-medium">更新时间</th>
                <th className="px-4 py-3 text-gray-500 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">加载中...</td></tr>
              ) : tickets.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">暂无工单</td></tr>
              ) : (
                tickets.map((t: any) => (
                  <tr key={t.id} className="border-b hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[240px] truncate">{t.title}</td>
                    <td className="px-4 py-3 text-gray-600">{t.userEmail || t.userName || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600">{CATEGORY_MAP[t.category] || t.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-md ${STATUS_COLOR[t.status] || ''}`}>
                        {STATUS_MAP[t.status] || t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      <span className="bg-gray-100 px-2 py-0.5 rounded">{t.messageCount ?? '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatTime(t.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => openDetail(t.id)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                        处理
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
          <span className="text-gray-500">
            共 {total} 条 · 第 {page} / {totalPages} 页
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 border rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p = i + 1;
              if (totalPages > 5) {
                if (page > 3) p = Math.min(totalPages - 4, page - 2) + i;
              }
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 rounded-lg ${p === page ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 border rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        </div>
      </div>

      {detail && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{detail.ticket?.title}</h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <span>{detail.ticket?.userEmail || detail.ticket?.userName || '-'}</span>
                  <span>·</span>
                  <span>{CATEGORY_MAP[detail.ticket?.category] || detail.ticket?.category}</span>
                  <span>·</span>
                  <span className={`px-1.5 py-0.5 rounded ${STATUS_COLOR[detail.ticket?.status] || ''}`}>
                    {STATUS_MAP[detail.ticket?.status] || detail.ticket?.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {detail.ticket?.status === 'open' && (
                  <button
                    onClick={() => closeTicket(detail.ticket.id)}
                    className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-400"
                  >
                    关闭工单
                  </button>
                )}
                <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600 text-lg px-2">✕</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 min-h-[200px] max-h-[400px]">
              {(detail.messages || []).length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">暂无消息</div>
              ) : (
                (detail.messages || []).map((m: any) => (
                  <div key={m.id} className={`flex ${m.isStaff ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] ${m.isStaff ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50 border border-gray-100'} rounded-xl px-4 py-3`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium ${m.isStaff ? 'text-blue-700' : 'text-gray-600'}`}>
                          {m.isStaff ? '客服' : '用户'}
                        </span>
                        <span className="text-xs text-gray-400">{formatTime(m.createdAt)}</span>
                      </div>
                      <div className="text-sm text-gray-800 whitespace-pre-wrap">{m.content}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-4 border-t">
              <div className="flex gap-2">
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="输入回复内容..."
                  rows={2}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendReply}
                  disabled={!replyText.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed self-end"
                >
                  发送回复
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}