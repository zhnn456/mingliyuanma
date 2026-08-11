'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Ticket {
  id: string;
  title: string;
  content: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string | null;
  replies?: Array<{
    id: string;
    content: string;
    createdAt: string;
    isAdmin: boolean;
  }>;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  open: { label: '待处理', color: 'bg-amber-100 text-amber-700' },
  pending: { label: '处理中', color: 'bg-blue-100 text-blue-700' },
  resolved: { label: '已解决', color: 'bg-green-100 text-green-700' },
  closed: { label: '已关闭', color: 'bg-gray-100 text-gray-700' },
};

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  low: { label: '低', color: 'bg-gray-100 text-gray-600' },
  normal: { label: '普通', color: 'bg-blue-100 text-blue-600' },
  high: { label: '高', color: 'bg-orange-100 text-orange-600' },
  urgent: { label: '紧急', color: 'bg-red-100 text-red-600' },
};

export default function AgentTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [detailTicket, setDetailTicket] = useState<Ticket | null>(null);
  const [form, setForm] = useState({ title: '', content: '', priority: 'normal' });
  const [submitting, setSubmitting] = useState(false);
  const [reply, setReply] = useState('');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const res = await fetch('/api/agent/tickets');
      if (res.ok) {
        const d = await res.json();
        setTickets(d.tickets || []);
      }
    } catch {}
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.content) {
      alert('请填写标题和内容');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/agent/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (res.ok) {
        alert('工单已提交，平台客服会尽快处理');
        setForm({ title: '', content: '', priority: 'normal' });
        setShowModal(false);
        loadTickets();
      } else {
        alert(d.error || '提交失败');
      }
    } catch {
      alert('网络错误');
    }
    setSubmitting(false);
  };

  const handleReply = async () => {
    if (!reply || !detailTicket) return;
    try {
      const res = await fetch('/api/agent/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: detailTicket.id,
          content: reply,
          isReply: true,
        }),
      });
      if (res.ok) {
        setReply('');
        loadTickets();
        // 重新加载详情
        const r = await fetch(`/api/agent/tickets?id=${detailTicket.id}`);
        if (r.ok) {
          const d = await r.json();
          setDetailTicket(d.ticket);
        }
      }
    } catch {
      alert('回复失败');
    }
  };

  const openDetail = async (t: Ticket) => {
    try {
      const res = await fetch(`/api/agent/tickets?id=${t.id}`);
      if (res.ok) {
        const d = await res.json();
        setDetailTicket(d.ticket || t);
      } else {
        setDetailTicket(t);
      }
    } catch {
      setDetailTicket(t);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-400">加载中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">技术工单</h1>
          <p className="text-sm text-gray-500 mt-1">提交技术问题、部署协助、bug反馈等</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          + 提交工单
        </button>
      </div>

      {/* 工单列表 */}
      <div className="bg-white rounded-xl shadow-sm border">
        {tickets.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">🎫</div>
            <p>暂无工单</p>
            <button onClick={() => setShowModal(true)} className="mt-3 text-blue-600 hover:underline text-sm">
              提交第一个工单
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {tickets.map((t) => {
              const status = STATUS_LABELS[t.status] || { label: t.status, color: 'bg-gray-100' };
              const priority = PRIORITY_LABELS[t.priority] || { label: t.priority, color: 'bg-gray-100' };
              return (
                <div
                  key={t.id}
                  onClick={() => openDetail(t)}
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${status.color}`}>{status.label}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${priority.color}`}>{priority.label}</span>
                      </div>
                      <div className="font-medium text-gray-900">{t.title}</div>
                      <div className="text-sm text-gray-500 mt-1 line-clamp-2">{t.content}</div>
                      <div className="text-xs text-gray-400 mt-2">
                        {new Date(t.createdAt).toLocaleString('zh-CN')}
                      </div>
                    </div>
                    <span className="text-gray-400">→</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 提交工单弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">提交技术工单</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="简要描述问题"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="low">低 - 一般咨询</option>
                  <option value="normal">普通 - 功能问题</option>
                  <option value="high">高 - 影响使用</option>
                  <option value="urgent">紧急 - 系统宕机</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">详细描述 *</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="请详细描述问题现象、复现步骤、错误信息等"
                  rows={5}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-300"
              >
                {submitting ? '提交中...' : '提交'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 工单详情弹窗 */}
      {detailTicket && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setDetailTicket(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{detailTicket.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded ${(STATUS_LABELS[detailTicket.status] || {}).color}`}>
                    {(STATUS_LABELS[detailTicket.status] || {}).label}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${(PRIORITY_LABELS[detailTicket.priority] || {}).color}`}>
                    {(PRIORITY_LABELS[detailTicket.priority] || {}).label}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(detailTicket.createdAt).toLocaleString('zh-CN')}
                  </span>
                </div>
              </div>
              <button onClick={() => setDetailTicket(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-700 whitespace-pre-wrap">{detailTicket.content}</div>
            </div>

            {/* 回复列表 */}
            {detailTicket.replies && detailTicket.replies.length > 0 && (
              <div className="space-y-3 mb-4">
                <h4 className="font-medium text-gray-700 text-sm">回复记录</h4>
                {detailTicket.replies.map((r) => (
                  <div key={r.id} className={`p-3 rounded-lg ${r.isAdmin ? 'bg-blue-50' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600">
                        {r.isAdmin ? '平台客服' : '我'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(r.createdAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">{r.content}</div>
                  </div>
                ))}
              </div>
            )}

            {/* 回复输入 */}
            {detailTicket.status !== 'closed' && (
              <div>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="补充信息或回复..."
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <button
                  onClick={handleReply}
                  disabled={!reply}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-300"
                >
                  回复
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 客服联系方式 */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
        <h3 className="font-bold text-gray-800 mb-2">其他联系方式</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p>📞 紧急问题可直接联系平台客服</p>
          <p>💬 工单回复时间：工作日 24 小时内</p>
          <p>🔄 系统更新问题请同时查看 <Link href="/agent/updates" className="text-blue-600 hover:underline">系统更新</Link></p>
        </div>
      </div>
    </div>
  );
}
