'use client';

import { useState, useEffect, useRef } from 'react';

export default function ChatPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [stats, setStats] = useState({ total: 0, open: 0, closed: 0, todayNew: 0 });

  const [activeSession, setActiveSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState('');
  const [loadingMsg, setLoadingMsg] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), status });
      if (keyword) params.set('keyword', keyword);
      const res = await fetch(`/api/admin/chat?${params}`);
      if (res.ok) {
        const d = await res.json();
        setSessions(d.data || []);
        setTotal(d.total || 0);
        if (d.stats) setStats(d.stats);
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchSessions(); }, [page, status]);

  useEffect(() => {
    if (activeSession) loadMessages(activeSession.id);
  }, [activeSession?.id]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async (sessionId: string) => {
    setLoadingMsg(true);
    try {
      const res = await fetch(`/api/admin/chat?sessionId=${sessionId}`);
      if (res.ok) {
        const d = await res.json();
        setActiveSession(d.session);
        setMessages(d.messages || []);
      }
    } catch {} finally { setLoadingMsg(false); }
  };

  const sendReply = async () => {
    if (!reply.trim() || !activeSession) return;
    const content = reply.trim();
    setReply('');
    try {
      const res = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', sessionId: activeSession.id, content }),
      });
      if (res.ok) {
        setMessages(prev => [...prev, { id: Date.now().toString(), sessionId: activeSession.id, sender: 'staff', content, createdAt: new Date().toISOString() }]);
        fetchSessions();
      }
    } catch {}
  };

  const toggleStatus = async (sessionId: string, current: string) => {
    const next = current === 'open' ? 'closed' : 'open';
    await fetch('/api/admin/chat', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, status: next }),
    });
    fetchSessions();
    if (activeSession?.id === sessionId) setActiveSession({ ...activeSession, status: next });
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSessions();
  };

  const totalPages = Math.ceil(total / pageSize) || 1;
  const statusBadge: Record<string, string> = {
    open: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-600',
  };
  const statusLabel: Record<string, string> = { open: '进行中', closed: '已关闭' };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">在线会话</h2>
        <p className="text-sm text-gray-500">客服会话管理</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-xs text-gray-500">总会话数</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-xs text-gray-500">进行中</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.open}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-xs text-gray-500">已关闭</div>
          <div className="text-2xl font-bold text-gray-600 mt-1">{stats.closed}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-xs text-gray-500">今日新增</div>
          <div className="text-2xl font-bold text-red-700 mt-1">{stats.todayNew}</div>
        </div>
      </div>

      {/* 搜索筛选 */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
        <form onSubmit={onSearch} className="flex flex-wrap gap-3 items-center">
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-lg text-sm">
            <option value="all">全部状态</option>
            <option value="open">进行中</option>
            <option value="closed">已关闭</option>
          </select>
          <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="搜索主题/用户/消息" className="flex-1 min-w-[200px] px-3 py-2 border rounded-lg text-sm" />
          <button type="submit" className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm">搜索</button>
        </form>
      </div>

      {/* 双栏布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 左侧会话列表 */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden lg:col-span-1">
          <div className="px-4 py-3 border-b bg-gray-50 text-sm font-medium text-gray-700">会话列表 ({total})</div>
          <div className="max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-gray-400">加载中...</div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">暂无会话</div>
            ) : (
              sessions.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSession(s)}
                  className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition ${activeSession?.id === s.id ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {(s.userName || s.userEmail || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-gray-900 text-sm truncate">{s.subject || '未命名会话'}</div>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${statusBadge[s.status] || ''}`}>{statusLabel[s.status] || s.status}</span>
                      </div>
                      <div className="text-xs text-gray-500 truncate mt-0.5">{s.lastMessage || '暂无消息'}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {s.userName || s.userEmail || '匿名用户'} · {s.lastMessageAt ? new Date(s.lastMessageAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
          {/* 分页 */}
          <div className="px-4 py-2 border-t bg-gray-50 flex items-center justify-between text-xs">
            <span className="text-gray-500">第 {page}/{totalPages} 页</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-2 py-1 border rounded disabled:opacity-40">上一页</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-2 py-1 border rounded disabled:opacity-40">下一页</button>
            </div>
          </div>
        </div>

        {/* 右侧消息区 */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden lg:col-span-2 flex flex-col" style={{ minHeight: '600px' }}>
          {activeSession ? (
            <>
              <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 text-sm">{activeSession.subject || '未命名会话'}</div>
                  <div className="text-xs text-gray-500">{activeSession.userName || activeSession.userEmail || '匿名用户'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${statusBadge[activeSession.status] || ''}`}>{statusLabel[activeSession.status] || activeSession.status}</span>
                  <button onClick={() => toggleStatus(activeSession.id, activeSession.status)} className="text-xs px-2 py-1 border rounded hover:bg-white">
                    {activeSession.status === 'open' ? '关闭会话' : '重新开启'}
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '480px' }}>
                {loadingMsg ? (
                  <div className="text-center py-8 text-gray-400">加载中...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">暂无消息</div>
                ) : (
                  messages.map((m: any) => (
                    <div key={m.id} className={`flex ${m.sender === 'staff' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] p-3 rounded-xl ${m.sender === 'staff' ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-800'}`}>
                        <div className="text-xs opacity-75 mb-1">{m.sender === 'staff' ? '客服' : '用户'}</div>
                        <div className="text-sm whitespace-pre-wrap break-words">{m.content}</div>
                        <div className={`text-xs mt-1 ${m.sender === 'staff' ? 'text-white/70' : 'text-gray-400'}`}>
                          {m.createdAt ? new Date(m.createdAt).toLocaleString('zh-CN') : ''}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={msgEndRef} />
              </div>
              <div className="border-t p-3 flex gap-2 bg-white">
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  placeholder="输入回复内容... (Enter 发送，Shift+Enter 换行)"
                  rows={2}
                  className="flex-1 px-3 py-2 border rounded-lg text-sm resize-none"
                />
                <button onClick={sendReply} className="px-4 py-2 bg-red-700 text-white rounded-lg text-sm self-end">发送</button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">请从左侧选择一个会话</div>
          )}
        </div>
      </div>
    </div>
  );
}
