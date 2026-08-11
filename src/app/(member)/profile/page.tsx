'use client';

import { useAuth } from '@/lib/auth-client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type TabKey = 'overview' | 'records' | 'orders' | 'offerings' | 'fortune' | 'points' | 'tickets' | 'ticket-detail' | 'security' | 'settings';

const NAV_ITEMS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'overview', label: '个人资料', icon: '👤' },
  { key: 'records', label: '排盘记录', icon: '📋' },
  { key: 'orders', label: '订单记录', icon: '🧾' },
  { key: 'offerings', label: '供奉记录', icon: '🙏' },
  { key: 'fortune', label: '每日运势', icon: '🔮' },
  { key: 'points', label: '积分明细', icon: '⭐' },
  { key: 'tickets', label: '我的工单', icon: '🎫' },
  { key: 'security', label: '安全设置', icon: '🔒' },
  { key: 'settings', label: '偏好设置', icon: '⚙️' },
];

const NAV_LINKS: { label: string; icon: string; href: string }[] = [
  { label: '积分充值', icon: '💎', href: '/profile/recharge' },
];

const TYPE_NAMES: Record<string, string> = { bazi: '八字', ziwei: '紫微', qimen: '奇门', meihua: '梅花' };
const TYPE_COLORS: Record<string, string> = { bazi: 'bg-red-100 text-red-800', ziwei: 'bg-purple-100 text-purple-800', qimen: 'bg-blue-100 text-blue-800', meihua: 'bg-pink-100 text-pink-800' };
const ORDER_STATUS_MAP: Record<string, string> = { pending: '待支付', paid: '已支付', failed: '失败', refunded: '已退款' };
const ORDER_STATUS_COLOR: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-800', paid: 'bg-green-100 text-green-800', failed: 'bg-red-100 text-red-800', refunded: 'bg-gray-100 text-gray-600' };
const CATEGORY_MAP: Record<string, string> = { billing: '账单', technical: '技术', account: '账号', other: '其他' };
const TICKET_STATUS_MAP: Record<string, string> = { open: '进行中', closed: '已关闭' };
const TICKET_STATUS_COLOR: Record<string, string> = { open: 'bg-green-100 text-green-800', closed: 'bg-gray-100 text-gray-600' };

function fmt(d: string) {
  try { return new Date(d).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch { return d; }
}

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 各模块数据
  const [records, setRecords] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [offerings, setOfferings] = useState<any[]>([]);
  const [fortune, setFortune] = useState<any>(null);
  const [fortuneLoading, setFortuneLoading] = useState(false);
  const [fortuneNeedBazi, setFortuneNeedBazi] = useState(false);
  const [points, setPoints] = useState(0);
  const [pointsLedger, setPointsLedger] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketDetail, setTicketDetail] = useState<any>(null);
  const [ticketReply, setTicketReply] = useState('');
  const [securityMsg, setSecurityMsg] = useState('');
  const [secOldPwd, setSecOldPwd] = useState('');
  const [secNewPwd, setSecNewPwd] = useState('');
  const [secConfirmPwd, setSecConfirmPwd] = useState('');
  const [secLoading, setSecLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // 初始化加载
  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetch('/api/user/history?limit=100').then(r => r.json()).then(d => setRecords(d.records || [])).catch(() => {}),
      fetch('/api/user/orders').then(r => r.json()).then(d => setOrders(d.orders || [])).catch(() => {}),
      fetch('/api/offering?type=records').then(r => r.json()).then(d => setOfferings(d.records || [])).catch(() => {}),
      fetch('/api/user/lingzhu').then(r => r.json()).then(d => { setPoints(d.balance || 0); setPointsLedger(d.rows || []); }).catch(() => {}),
      fetch('/api/user/tickets').then(r => r.json()).then(d => setTickets(d.tickets || [])).catch(() => {}),
    ]).then(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user) { router.push('/login'); }
  }, [user, router]);

  if (!user) return null;

  // ===== 各种操作函数 =====
  const loadFortune = async () => {
    setFortuneLoading(true); setFortuneNeedBazi(false);
    try {
      const res = await fetch('/api/user/fortune');
      if (res.status === 400) { const d = await res.json(); setFortuneNeedBazi(d.needBazi); }
      else { const d = await res.json(); setFortune(d.fortune); }
    } catch {} finally { setFortuneLoading(false); }
  };

  const sendTicketReply = async () => {
    if (!ticketReply || !ticketDetail) return;
    await fetch(`/api/ticket/${ticketDetail.ticket.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: ticketReply }) });
    setTicketReply('');
    const res = await fetch(`/api/ticket/${ticketDetail.ticket.id}`);
    if (res.ok) setTicketDetail(await res.json());
  };

  const changePassword = async () => {
    if (secNewPwd !== secConfirmPwd) { setSecurityMsg('两次密码不一致'); return; }
    if (secNewPwd.length < 6) { setSecurityMsg('密码至少6位'); return; }
    setSecLoading(true); setSecurityMsg('');
    try {
      const res = await fetch('/api/user/password', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ oldPassword: secOldPwd, newPassword: secNewPwd }) });
      const d = await res.json();
      if (res.ok) { setSecurityMsg('✅ 密码修改成功'); setSecOldPwd(''); setSecNewPwd(''); setSecConfirmPwd(''); }
      else setSecurityMsg(d.error || '修改失败');
    } catch { setSecurityMsg('网络错误'); } finally { setSecLoading(false); }
  };

  // ===== 侧边栏项目点击 =====
  const onNavClick = (key: TabKey) => {
    setTab(key);
    setSidebarOpen(false);
    if (key === 'fortune') loadFortune();
    if (key === 'tickets') {
      fetch('/api/user/tickets').then(r => r.json()).then(d => setTickets(d.tickets || []));
    }
    if (key === 'points') {
      fetch('/api/user/points').then(r => r.json()).then(d => { setPoints(d.balance || 0); setPointsLedger(d.rows || []); });
    }
  };

  const renderSection = () => {
    switch (tab) {
      // ======== 个人资料 ========
      case 'overview':
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">个人资料</h2>
            <div className="bg-white rounded-xl border p-6 space-y-4">
              <div className="flex items-center gap-5 pb-5 border-b">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center text-2xl font-bold text-red-700 border border-red-200 shadow-sm">
                  {(user?.name || '?')[0]}
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg">{user?.name || '用户'}</div>
                  <div className="text-sm text-gray-500">{user?.email}</div>
                </div>
                <div className="ml-auto">
                  <span className={`text-xs font-medium px-3 py-1 rounded-full border ${user?.memberLevel === 'lifetime' ? 'bg-gradient-to-r from-gold/20 to-gold/10 text-gold-dark border-gold/30' : user?.memberLevel === 'yearly' ? 'bg-red-50 text-red-700 border-red-200' : user?.memberLevel === 'monthly' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-600'}`}>
                    {user?.memberLevel === 'lifetime' ? '终身会员' : user?.memberLevel === 'yearly' ? '年卡会员' : user?.memberLevel === 'monthly' ? '月卡会员' : '免费用户'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: '排盘记录', value: records.length, icon: '📋' },
                  { label: '订单', value: orders.length, icon: '🧾' },
                  { label: '积分', value: points, icon: '⭐' },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">{item.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{item.icon} {item.label}</div>
                  </div>
                ))}
              </div>
              {user?.memberLevel === 'free' && (
                <Link href="/membership" className="block w-full text-center py-3 bg-red-700 text-white rounded-xl text-sm font-medium hover:bg-red-800">升级会员，解锁无限排盘</Link>
              )}
            </div>
          </div>
        );

      // ======== 排盘记录 ========
      case 'records':
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">排盘记录</h2>
            {records.length === 0 ? (
              <div className="bg-white rounded-xl border p-12 text-center">
                <div className="text-5xl mb-3">📝</div>
                <p className="text-gray-500 mb-4">暂无排盘记录</p>
                <div className="flex gap-3 justify-center">
                  {['/bazi','/ziwei','/qimen','/meihua'].map(h => (
                    <Link key={h} href={h} className="btn-outline text-sm px-4 py-2">{h.replace('/','').toUpperCase()}</Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border divide-y">
                {records.map((r: any) => (
                  <Link key={r.id} href={`/${r.type}?id=${r.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${TYPE_COLORS[r.type] || 'bg-gray-100'}`}>
                        {r.type === 'bazi' ? '☰' : r.type === 'ziwei' ? '★' : r.type === 'qimen' ? '◈' : '✿'}
                      </span>
                      <div><span className="font-medium text-gray-900 text-sm">{TYPE_NAMES[r.type] || r.type}</span><span className="text-xs text-gray-400 ml-2">{fmt(r.createdAt)}</span></div>
                    </div>
                    <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </Link>
                ))}
              </div>
            )}
          </div>
        );

      // ======== 订单记录 ========
      case 'orders':
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">订单记录</h2>
            {orders.length === 0 ? (
              <div className="bg-white rounded-xl border p-12 text-center">
                <div className="text-5xl mb-3">🧾</div>
                <p className="text-gray-500 mb-3">暂无订单</p>
                <Link href="/membership" className="btn-primary px-6 py-2 text-sm">开通会员</Link>
              </div>
            ) : (
              <div className="bg-white rounded-xl border divide-y">
                {orders.map((o: any) => (
                  <div key={o.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-mono text-gray-400">{o.orderNo}</span>
                      <span className="font-bold text-gray-900">¥{o.amount.toFixed(2)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${ORDER_STATUS_COLOR[o.status] || ''}`}>{ORDER_STATUS_MAP[o.status] || o.status}</span>
                    </div>
                    <span className="text-xs text-gray-400">{fmt(o.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      // ======== 供奉记录 ========
      case 'offerings':
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">供奉记录</h2>
            {offerings.length === 0 ? (
              <div className="bg-white rounded-xl border p-12 text-center">
                <div className="text-5xl mb-3">🙏</div>
                <p className="text-gray-500 mb-3">暂无供奉记录</p>
                <Link href="/offering" className="btn-primary px-6 py-2 text-sm">去供奉</Link>
              </div>
            ) : (
              <div className="bg-white rounded-xl border divide-y">
                {offerings.map((o: any) => (
                  <div key={o.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🙏</span>
                      <div><span className="font-medium text-gray-900 text-sm">{o.item?.name || '供奉'}</span><span className="text-xs text-gray-400 ml-2">{o.type === 'monthly' ? '包月' : o.type === 'yearly' ? '包年' : '单次'}</span></div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-700">¥{o.amount.toFixed(2)}</div>
                      <div className="text-xs text-gray-400">{fmt(o.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      // ======== 每日运势 ========
      case 'fortune':
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">每日运势</h2>
            {fortuneLoading ? <div className="text-center py-16 text-gray-400">生成中...</div> : fortuneNeedBazi ? (
              <div className="bg-white rounded-xl border p-12 text-center">
                <div className="text-5xl mb-3">🔮</div>
                <p className="text-gray-500 mb-4">需要先进行一次八字排盘</p>
                <Link href="/bazi" className="btn-primary px-6 py-2 text-sm">去排盘</Link>
              </div>
            ) : fortune ? (
              <div className="bg-white rounded-xl border p-6">
                <div className="flex items-center justify-between mb-6">
                  <div><div className="text-xs text-gray-500">{fortune.date}</div><div className="text-lg font-bold text-gray-900">今日运势</div></div>
                  <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-yellow-50 rounded-full flex items-center justify-center text-2xl">☯</div>
                </div>
                {fortune.content?.overall && <div className="bg-red-50 rounded-xl p-4 mb-4"><div className="font-bold text-sm text-gray-900 mb-1">综合运势</div><div className="text-gray-700">{fortune.content.overall}</div></div>}
                <div className="grid grid-cols-2 gap-3">
                  {[{ key: 'career', label: '事业', icon: '💼', color: 'bg-blue-50' },{ key: 'wealth', label: '财运', icon: '💰', color: 'bg-green-50' },{ key: 'health', label: '健康', icon: '🏥', color: 'bg-yellow-50' },{ key: 'love', label: '感情', icon: '❤️', color: 'bg-pink-50' }].map(item => (
                    <div key={item.key} className={`${item.color} rounded-xl p-4`}>
                      <div className="text-xs text-gray-500 mb-1">{item.icon} {item.label}</div>
                      <div className="text-sm font-medium text-gray-900">{fortune.content?.[item.key] || '平平'}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border p-12 text-center">
                <button onClick={loadFortune} className="btn-primary px-6 py-2 text-sm">生成今日运势</button>
              </div>
            )}
          </div>
        );

      // ======== 积分明细 ========
      case 'points':
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">积分明细</h2>
            <div className="bg-white rounded-xl border p-6 mb-4">
              <div className="text-center"><div className="text-xs text-gray-500">当前积分</div><div className="text-3xl font-bold text-red-700 mt-1">{points}</div></div>
            </div>
            <div className="bg-white rounded-xl border divide-y max-h-[500px] overflow-y-auto">
              {pointsLedger.length === 0 ? <div className="p-8 text-center text-gray-400">暂无记录</div> : pointsLedger.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between p-4">
                  <div><div className="text-sm text-gray-900">{r.type === 'daily_signin' ? '每日签到' : r.type === 'register' ? '注册赠送' : r.type === 'admin_adjust' ? '管理员调整' : r.type}</div>
                  {r.remark && <div className="text-xs text-gray-400">{r.remark}</div>}</div>
                  <div className={`text-sm font-bold ${r.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>{r.amount > 0 ? `+${r.amount}` : r.amount}</div>
                </div>
              ))}
            </div>
          </div>
        );

      // ======== 工单 ========
      case 'tickets':
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">我的工单</h2>
              <button onClick={async () => {
                const title = prompt('请输入标题');
                if (!title) return;
                const content = prompt('请描述您的问题');
                if (!content) return;
                const res = await fetch('/api/user/tickets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, category: 'technical', content }) });
                if (res.ok) { alert('工单已创建'); fetch('/api/user/tickets').then(r => r.json()).then(d => setTickets(d.tickets || [])); }
              }} className="px-4 py-2 bg-red-700 text-white rounded-lg text-sm">创建工单</button>
            </div>
            {tickets.length === 0 ? (
              <div className="bg-white rounded-xl border p-12 text-center"><div className="text-5xl mb-3">🎫</div><p className="text-gray-500">暂无工单</p></div>
            ) : (
              <div className="bg-white rounded-xl border divide-y">
                {tickets.map((t: any) => (
                  <div key={t.id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={async () => {
                    const res = await fetch(`/api/ticket/${t.id}`);
                    if (res.ok) setTicketDetail(await res.json());
                  }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 text-sm">{t.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${TICKET_STATUS_COLOR[t.status] || ''}`}>{TICKET_STATUS_MAP[t.status] || t.status}</span>
                    </div>
                    <div className="text-xs text-gray-400">{CATEGORY_MAP[t.category] || t.category} · {fmt(t.createdAt)}</div>
                  </div>
                ))}
              </div>
            )}

            {ticketDetail && (
              <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setTicketDetail(null)}>
                <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4"><h3 className="font-bold">{ticketDetail.ticket?.title}</h3><button onClick={() => setTicketDetail(null)} className="text-gray-400">✕</button></div>
                  <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
                    {(ticketDetail.messages || []).map((m: any) => (
                      <div key={m.id} className={`p-3 rounded-xl text-sm ${m.isStaff ? 'bg-blue-50 ml-6' : 'bg-gray-50 mr-6'}`}>
                        <div className="flex items-center gap-2 mb-1"><span className="text-xs font-medium">{m.isStaff ? '客服' : '我'}</span><span className="text-xs text-gray-400">{fmt(m.createdAt)}</span></div>
                        <div className="text-gray-800 whitespace-pre-wrap">{m.content}</div>
                      </div>
                    ))}
                  </div>
                  {ticketDetail.ticket?.status === 'open' && (
                    <div className="flex gap-2"><textarea value={ticketReply} onChange={e => setTicketReply(e.target.value)} placeholder="输入回复..." rows={2} className="flex-1 px-3 py-2 border rounded-lg text-sm" /><button onClick={sendTicketReply} className="px-4 py-2 bg-red-700 text-white rounded-lg text-sm self-end">发送</button></div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      // ======== 安全设置 ========
      case 'security':
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">安全设置</h2>
            <div className="bg-white rounded-xl border p-6 max-w-md">
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">当前密码</label><input type="password" value={secOldPwd} onChange={e => setSecOldPwd(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">新密码</label><input type="password" value={secNewPwd} onChange={e => setSecNewPwd(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">确认新密码</label><input type="password" value={secConfirmPwd} onChange={e => setSecConfirmPwd(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                {securityMsg && <div className={`text-sm px-3 py-2 rounded-lg ${securityMsg.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{securityMsg}</div>}
                <button onClick={changePassword} disabled={secLoading} className="w-full py-2.5 bg-red-700 text-white rounded-lg text-sm disabled:opacity-50">{secLoading ? '修改中...' : '修改密码'}</button>
              </div>
            </div>
          </div>
        );

      // ======== 偏好设置 ========
      case 'settings':
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">偏好设置</h2>
            <div className="bg-white rounded-xl border p-6 max-w-md space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div><div className="font-medium text-gray-900 text-sm">邮件通知</div><div className="text-xs text-gray-500">接收订单和供奉通知</div></div>
                <div className="w-12 h-6 bg-red-600 rounded-full relative cursor-pointer"><div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow" /></div>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div><div className="font-medium text-gray-900 text-sm">每日运势推送</div><div className="text-xs text-gray-500">每天早上推送运势</div></div>
                <div className="w-12 h-6 bg-gray-300 rounded-full relative cursor-pointer"><div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5 shadow" /></div>
              </div>
              <button onClick={() => { signOut(); router.push('/'); }} className="w-full py-2.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">退出登录</button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-60 bg-white border-r transform transition-transform md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        {/* 用户信息 */}
        <div className="p-5 border-b text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center text-xl font-bold text-red-700 border-2 border-red-200 shadow-sm mb-2">
            {(user?.name || '?')[0]}
          </div>
          <div className="font-bold text-gray-900 text-sm">{user?.name || '用户'}</div>
          <div className="text-xs text-gray-400 mt-0.5">{user?.email}</div>
          <div className="mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full border ${user?.memberLevel === 'lifetime' ? 'bg-gradient-to-r from-gold/20 to-gold/10 text-gold-dark border-gold/30' : user?.memberLevel === 'yearly' ? 'bg-red-50 text-red-700 border-red-200' : user?.memberLevel === 'monthly' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-600'}`}>
              {user?.memberLevel === 'lifetime' ? '终身会员' : user?.memberLevel === 'yearly' ? '年卡会员' : user?.memberLevel === 'monthly' ? '月卡会员' : '免费用户'}
            </span>
          </div>
        </div>

        {/* 导航 */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV_ITEMS.map(item => (
            <button key={item.key} onClick={() => onNavClick(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${tab === item.key ? 'bg-red-50 text-red-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
	        </nav>

	        {/* 积分充值入口 */}
	        <div className="px-3 pb-2">
	          <Link href="/profile/recharge"
	            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 font-medium hover:from-purple-100 hover:to-purple-200 transition-colors border border-purple-200">
	            <span>💎</span>
	            <span>积分充值</span>
	          </Link>
	        </div>

	        {/* 卡密兑换入口 */}
	        <div className="px-3 pb-2">
	          <Link href="/profile/redeem"
	            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 font-medium hover:from-amber-100 hover:to-amber-200 transition-colors border border-amber-200">
	            <span>🎟️</span>
	            <span>卡密兑换</span>
	          </Link>
	        </div>

	        {/* 底部 */}
        <div className="p-3 border-t">
          <Link href="/" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
            <span>←</span><span>返回首页</span>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-30 md:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></button>
          <h1 className="font-bold text-gray-900">个人中心</h1>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {loading ? <div className="text-center py-20 text-gray-400">加载中...</div> : renderSection()}
        </main>
      </div>
    </div>
  );
}
