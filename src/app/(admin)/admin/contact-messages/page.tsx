'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-client';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  content: string;
  status: string;
  reply?: string;
  repliedBy?: string;
  repliedAt?: string;
  clientIP?: string;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  pending: number;
  replied: number;
  closed: number;
  todayNew: number;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'bg-amber-100 text-amber-700' },
  read: { label: '已读', color: 'bg-blue-100 text-blue-700' },
  replied: { label: '已回复', color: 'bg-green-100 text-green-700' },
  closed: { label: '已关闭', color: 'bg-gray-100 text-gray-600' },
};

export default function ContactMessagesPage() {
  const { user } = useAuth();
  const isDemo = user?.role === 'demo';

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, replied: 0, closed: 0, todayNew: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (statusFilter) params.set('status', statusFilter);
    if (q) params.set('q', q);
    const res = await fetch(`/api/admin/contact-messages?${params}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages || []);
      setTotal(data.total || 0);
      setStats(data.stats || stats);
    }
    setLoading(false);
  }, [page, pageSize, statusFilter, q]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleReply = async () => {
    if (!selected || !replyText.trim()) return;
    setSubmitting(true);
    const res = await fetch('/api/admin/contact-messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id, action: 'reply', reply: replyText.trim() }),
    });
    if (res.ok) {
      setReplyText('');
      setSelected(null);
      fetchData();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || '回复失败');
    }
    setSubmitting(false);
  };

  const handleStatus = async (id: string, status: string) => {
    const res = await fetch('/api/admin/contact-messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'status', status }),
    });
    if (res.ok) {
      fetchData();
      if (selected?.id === id) setSelected(null);
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  const statCards = [
    { label: '全部消息', value: stats.total, color: 'bg-slate-50 text-slate-700', key: '' },
    { label: '待处理', value: stats.pending, color: 'bg-amber-50 text-amber-700', key: 'pending' },
    { label: '已回复', value: stats.replied, color: 'bg-green-50 text-green-700', key: 'replied' },
    { label: '今日新增', value: stats.todayNew, color: 'bg-blue-50 text-blue-700', key: '' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">联系消息</h1>
          <p className="text-sm text-slate-500 mt-1">访客通过「联系我们」页面提交的咨询消息</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <button
            key={i}
            onClick={() => { setStatusFilter(s.key); setPage(1); }}
            className={`text-left p-4 rounded-xl border border-slate-200 ${s.color} hover:shadow-md transition-shadow`}
          >
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs mt-1 opacity-80">{s.label}</div>
          </button>
        ))}
      </div>

      {/* 筛选 */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
        >
          <option value="">全部状态</option>
          <option value="pending">待处理</option>
          <option value="read">已读</option>
          <option value="replied">已回复</option>
          <option value="closed">已关闭</option>
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
          placeholder="搜索姓名/邮箱/内容..."
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg w-64"
        />
        <button onClick={() => { setPage(1); fetchData(); }} className="px-4 py-2 text-sm bg-slate-800 text-white rounded-lg">
          搜索
        </button>
      </div>

      {/* 列表 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">加载中...</div>
        ) : messages.length === 0 ? (
          <div className="p-12 text-center text-slate-400">暂无消息</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium">姓名</th>
                <th className="text-left px-4 py-3 font-medium">主题</th>
                <th className="text-left px-4 py-3 font-medium">内容预览</th>
                <th className="text-left px-4 py-3 font-medium">状态</th>
                <th className="text-left px-4 py-3 font-medium">提交时间</th>
                <th className="text-right px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {messages.map((m) => {
                const st = STATUS_MAP[m.status] || STATUS_MAP.pending;
                return (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{m.name}</div>
                      <div className="text-xs text-slate-400">{m.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{m.subject}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{m.content}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleString('zh-CN', { hour12: false })}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => { setSelected(m); setReplyText(m.reply || ''); }}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium mr-3"
                      >
                        查看/回复
                      </button>
                      {m.status !== 'closed' && (
                        <button
                          onClick={() => handleStatus(m.id, 'closed')}
                          className="text-slate-400 hover:text-slate-600 text-xs"
                        >
                          关闭
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* 分页 */}
        {total > pageSize && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 text-sm">
            <span className="text-slate-500">共 {total} 条，第 {page}/{totalPages} 页</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 border border-slate-300 rounded-lg disabled:opacity-40"
              >
                上一页
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 border border-slate-300 rounded-lg disabled:opacity-40"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 详情/回复 弹窗 */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selected.subject}</h2>
                  <div className="text-sm text-slate-500 mt-1">
                    {selected.name} · {selected.email}
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${(STATUS_MAP[selected.status] || STATUS_MAP.pending).color}`}>
                  {(STATUS_MAP[selected.status] || STATUS_MAP.pending).label}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* 原始消息 */}
              <div>
                <div className="text-xs font-medium text-slate-400 mb-2">消息内容</div>
                <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {selected.content}
                </div>
                <div className="text-xs text-slate-400 mt-2 flex gap-4">
                  <span>提交时间：{new Date(selected.createdAt).toLocaleString('zh-CN', { hour12: false })}</span>
                  {selected.clientIP && <span>IP：{selected.clientIP}</span>}
                </div>
              </div>

              {/* 已有回复 */}
              {selected.reply && (
                <div>
                  <div className="text-xs font-medium text-green-600 mb-2">已回复</div>
                  <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {selected.reply}
                  </div>
                  {selected.repliedAt && (
                    <div className="text-xs text-slate-400 mt-2">
                      回复时间：{new Date(selected.repliedAt).toLocaleString('zh-CN', { hour12: false })}
                    </div>
                  )}
                </div>
              )}

              {/* 回复框 */}
              {!isDemo && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {selected.reply ? '追加回复（覆盖原回复）' : '回复消息'}
                  </label>
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    rows={4}
                    placeholder="输入回复内容..."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-mingli-400 focus:border-transparent"
                  />
                  <div className="flex justify-end gap-2 mt-3">
                    <button onClick={() => setSelected(null)} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg">
                      取消
                    </button>
                    <button
                      onClick={handleReply}
                      disabled={!replyText.trim() || submitting}
                      className="px-4 py-2 text-sm bg-mingli-600 text-white rounded-lg disabled:opacity-50"
                    >
                      {submitting ? '提交中...' : '提交回复'}
                    </button>
                  </div>
                </div>
              )}

              {isDemo && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 text-center">
                  🔒 演示账号仅可查看，无回复权限
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
