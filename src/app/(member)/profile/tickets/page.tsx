'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UserTicketsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'technical', content: '' });
  const [detail, setDetail] = useState<any>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetch('/api/user/tickets').then(r => r.json()).then(d => { setTickets(d.tickets || []); setLoading(false); }).catch(() => setLoading(false));
  }, [user, router]);

  const createTicket = async () => {
    if (!form.title || !form.content) return alert('请填写完整');
    const res = await fetch('/api/user/tickets', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    if (res.ok) { setShowCreate(false); setForm({ title: '', category: 'technical', content: '' }); fetchTickets(); }
    else alert('创建失败');
  };

  const fetchTickets = () => fetch('/api/user/tickets').then(r => r.json()).then(d => setTickets(d.tickets || []));

  const openDetail = async (id: string) => {
    const res = await fetch(`/api/ticket/${id}`);
    if (res.ok) setDetail(await res.json());
  };

  const sendReply = async () => {
    if (!replyText) return;
    await fetch(`/api/ticket/${detail.ticket.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: replyText }) });
    setReplyText(''); openDetail(detail.ticket.id);
  };

  const categoryMap: Record<string, string> = { billing: '账单', technical: '技术', account: '账号', other: '其他' };
  const statusMap: Record<string, string> = { open: '进行中', closed: '已关闭' };
  const statusColor: Record<string, string> = { open: 'bg-green-100 text-green-800', closed: 'bg-gray-100 text-gray-600' };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-6">
        <div><Link href="/profile" className="text-sm text-gray-500 hover:text-red-700">← 返回</Link><h1 className="text-2xl font-bold text-gray-900 mt-1">我的工单</h1></div>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm px-5 py-2">创建工单</button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-4">创建工单</h3>
            <div className="space-y-3">
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="标题" className="w-full px-3 py-2 border rounded-lg text-sm" />
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="technical">技术问题</option><option value="billing">账单问题</option><option value="account">账号问题</option><option value="other">其他</option>
              </select>
              <textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="请详细描述您的问题..." rows={5} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 border rounded-lg text-sm">取消</button>
                <button onClick={createTicket} className="flex-1 px-4 py-2 bg-red-700 text-white rounded-lg text-sm">提交</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {tickets.length === 0 && !loading ? (
          <div className="card text-center py-12">
            <div className="text-4xl mb-3">🎫</div>
            <p className="text-gray-500">暂无工单</p>
          </div>
        ) : tickets.map((t: any) => (
          <div key={t.id} className="card p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => openDetail(t.id)}>
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-gray-900">{t.title}</div>
              <span className={`text-xs px-2 py-0.5 rounded ${statusColor[t.status] || ''}`}>{statusMap[t.status] || t.status}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>{categoryMap[t.category] || t.category}</span>
              <span>{new Date(t.createdAt).toLocaleString('zh-CN')}</span>
              {t.lastMessage && <span className="text-gray-400">最新回复: {t.lastMessage.createdAt ? new Date(t.lastMessage.createdAt).toLocaleString('zh-CN') : ''}</span>}
            </div>
          </div>
        ))}
      </div>

      {detail && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">{detail.ticket?.title}</h3>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-4 mb-4">
              {(detail.messages || []).map((m: any) => (
                <div key={m.id} className={`p-4 rounded-xl ${m.isStaff ? 'bg-blue-50 ml-8' : 'bg-gray-50 mr-8'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-700">{m.isStaff ? '客服' : '我'}</span>
                    <span className="text-xs text-gray-400">{new Date(m.createdAt).toLocaleString('zh-CN')}</span>
                  </div>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap">{m.content}</div>
                </div>
              ))}
            </div>
            {detail.ticket?.status === 'open' && (
              <div className="flex gap-2">
                <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="输入回复..." rows={2} className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                <button onClick={sendReply} className="px-4 py-2 bg-red-700 text-white rounded-lg text-sm self-end">发送</button>
              </div>
            )}
            {detail.ticket?.status === 'closed' && <p className="text-sm text-gray-500 text-center py-2">此工单已关闭</p>}
          </div>
        </div>
      )}
    </div>
  );
}
