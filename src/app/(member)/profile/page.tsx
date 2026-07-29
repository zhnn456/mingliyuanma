'use client';

import { useAuth } from '@/lib/auth-client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface HistoryItem {
  id: string;
  type: string;
  createdAt: string;
  title?: string;
}

interface OrderItem {
  id: string;
  orderNo: string;
  amount: number;
  status: string;
  type: string;
  createdAt: string;
}

interface OfferingItem {
  id: string;
  amount: number;
  type: string;
  status: string;
  createdAt: string;
  item?: { name: string; image?: string | null };
}

const TYPE_NAMES: Record<string, string> = {
  bazi: '八字排盘', ziwei: '紫微斗数', qimen: '奇门遁甲', meihua: '梅花易数',
};
const TYPE_COLORS: Record<string, string> = {
  bazi: 'bg-red-100 text-red-800', ziwei: 'bg-purple-100 text-purple-800',
  qimen: 'bg-blue-100 text-blue-800', meihua: 'bg-pink-100 text-pink-800',
};
const TYPE_ICONS: Record<string, string> = {
  bazi: '☰', ziwei: '★', qimen: '◈', meihua: '✿',
};

export default function ProfilePage() {
  const { user: session } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'records' | 'orders' | 'offerings'>('records');
  const [records, setRecords] = useState<HistoryItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [offerings, setOfferings] = useState<OfferingItem[]>([]);
  const [stats, setStats] = useState({ records: 0, orders: 0, offerings: 0, points: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    Promise.all([
      fetch('/api/user/history?limit=100').then(r => r.json()).then(d => {
        const list = (d.records || []).map((r: any) => ({ id: r.id, type: r.type, createdAt: r.createdAt }));
        setRecords(list.slice(0, 20));
        setStats(s => ({ ...s, records: list.length }));
      }).catch(() => {}),
      fetch('/api/user/orders').then(r => r.json()).then(d => {
        const list = d.orders || [];
        setOrders(list);
        setStats(s => ({ ...s, orders: list.length }));
      }).catch(() => {}),
      fetch('/api/offering?type=records').then(r => r.json()).then(d => {
        const list = d.records || [];
        setOfferings(list);
        setStats(s => ({ ...s, offerings: list.length }));
      }).catch(() => {}),
      fetch('/api/user/points').then(r => r.json()).then(d => {
        setStats(s => ({ ...s, points: d.balance || 0 }));
      }).catch(() => {}),
    ]).then(() => setLoading(false));
  }, [session]);

  if (!session) return <div className="min-h-screen flex items-center justify-center">
    <div className="text-center"><div className="text-5xl mb-4">🔐</div><p className="text-gray-500 mb-4">请先登录</p><Link href="/login" className="btn-primary px-6 py-2">去登录</Link></div>
  </div>;

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch { return d; }
  };

  const statusBadge = (status: string, map: Record<string, string>, color: Record<string, string>) => (
    <span className={`text-xs px-2 py-0.5 rounded ${color[status] || 'bg-gray-100 text-gray-600'}`}>{map[status] || status}</span>
  );

  const orderStatusMap: Record<string, string> = { pending: '待支付', paid: '已支付', failed: '失败', refunded: '已退款' };
  const orderStatusColor: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-800', paid: 'bg-green-100 text-green-800', failed: 'bg-red-100 text-red-800', refunded: 'bg-gray-100 text-gray-600' };

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment-50 via-paper to-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ===== 用户信息卡片 ===== */}
        <div className="card p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-gold/5 to-transparent rounded-full blur-2xl" />
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center text-2xl font-bold text-red-700 border border-red-200 shadow-sm">
              {(session?.name || '?')[0]}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{session?.name || '用户'}</h1>
              <div className="text-sm text-gray-500">{session?.email}</div>
              <div className="flex items-center gap-3 mt-2">
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                  session?.memberLevel === 'lifetime' ? 'bg-gradient-to-r from-gold/20 to-gold/10 text-gold-dark border-gold/30' :
                  session?.memberLevel === 'yearly' ? 'bg-red-50 text-red-700 border-red-200' :
                  session?.memberLevel === 'monthly' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  'bg-gray-100 text-gray-600 border-gray-200'
                }`}>
                  {session?.memberLevel === 'lifetime' ? '终身会员' : session?.memberLevel === 'yearly' ? '年卡会员' : session?.memberLevel === 'monthly' ? '月卡会员' : '免费用户'}
                </span>
                <span className="text-xs text-gray-400">积分 {stats.points}</span>
              </div>
            </div>
            <Link href="/membership" className="btn-outline text-sm px-4 py-2 hidden sm:inline-block">升级</Link>
          </div>
        </div>

        {/* ===== 统计卡片 ===== */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: '排盘记录', value: stats.records, icon: '📋', color: 'text-blue-600' },
            { label: '订单', value: stats.orders, icon: '🧾', color: 'text-green-600' },
            { label: '供奉', value: stats.offerings, icon: '🙏', color: 'text-red-600' },
            { label: '积分', value: stats.points, icon: '⭐', color: 'text-yellow-600' },
          ].map(item => (
            <div key={item.label} className="card p-3 text-center">
              <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{item.icon} {item.label}</div>
            </div>
          ))}
        </div>

        {/* ===== 快捷导航 ===== */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          {[
            { href: '/profile/security', icon: '🔒', label: '安全' },
            { href: '/profile/points', icon: '⭐', label: '积分' },
            { href: '/profile/fortune', icon: '🔮', label: '运势' },
            { href: '/profile/tickets', icon: '🎫', label: '工单' },
            { href: '/profile/settings', icon: '⚙️', label: '设置' },
          ].map(item => (
            <Link key={item.href} href={item.href} className="card p-3 flex flex-col items-center gap-1 hover:shadow-md transition-all hover:border-red-200">
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs text-gray-600">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* ===== 标签切换 ===== */}
        <div className="flex gap-2 mb-4">
          {[
            { key: 'records' as const, label: '排盘记录', icon: '📋' },
            { key: 'orders' as const, label: '订单记录', icon: '🧾' },
            { key: 'offerings' as const, label: '供奉记录', icon: '🙏' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-red-700 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ===== 排盘记录 ===== */}
        {tab === 'records' && (
          <div className="card p-5">
            {loading ? <div className="text-center py-10 text-gray-400">加载中...</div> : records.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">📝</div>
                <p className="text-gray-500 mb-2">暂无排盘记录</p>
                <p className="text-sm text-gray-400 mb-4">开始排盘后，记录会自动保存</p>
                <div className="flex gap-3 justify-center">
                  {['/bazi', '/ziwei', '/qimen', '/meihua'].map(href => (
                    <Link key={href} href={href} className="btn-outline text-sm px-4 py-2">
                      {TYPE_ICONS[href.replace('/', '')]} {TYPE_NAMES[href.replace('/', '')]}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {records.map((r) => (
                  <Link key={r.id} href={`/${r.type}?id=${r.id}`} className="flex items-center justify-between p-3.5 bg-gray-50/60 rounded-xl border border-gray-100 hover:bg-gray-100/60 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${TYPE_COLORS[r.type] || 'bg-gray-100 text-gray-600'}`}>
                        {TYPE_ICONS[r.type] || '📄'}
                      </span>
                      <div>
                        <span className="text-sm font-medium text-gray-900">{TYPE_NAMES[r.type] || r.type}</span>
                        <span className="text-xs text-gray-400 ml-2">{formatDate(r.createdAt)}</span>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== 订单记录 ===== */}
        {tab === 'orders' && (
          <div className="card p-5">
            {loading ? <div className="text-center py-10 text-gray-400">加载中...</div> : orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">🧾</div>
                <p className="text-gray-500 mb-4">暂无订单</p>
                <Link href="/membership" className="btn-primary px-6 py-2 text-sm">开通会员</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {orders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between p-3.5 bg-gray-50/60 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="text-xs font-mono text-gray-400 w-28 truncate">{o.orderNo}</div>
                      <div className="text-sm font-medium text-gray-900">¥{o.amount.toFixed(2)}</div>
                      {statusBadge(o.status, orderStatusMap, orderStatusColor)}
                    </div>
                    <div className="text-xs text-gray-400">{formatDate(o.createdAt)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== 供奉记录 ===== */}
        {tab === 'offerings' && (
          <div className="card p-5">
            {loading ? <div className="text-center py-10 text-gray-400">加载中...</div> : offerings.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">🙏</div>
                <p className="text-gray-500 mb-4">暂无供奉记录</p>
                <Link href="/offering" className="btn-primary px-6 py-2 text-sm">去供奉</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {offerings.map((o) => (
                  <div key={o.id} className="flex items-center justify-between p-3.5 bg-gray-50/60 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{o.item?.name ? '🙏' : '📿'}</span>
                      <div>
                        <span className="text-sm font-medium text-gray-900">{o.item?.name || '供奉'}</span>
                        <span className="text-xs text-gray-400 ml-2">{o.type === 'monthly' ? '包月' : o.type === 'yearly' ? '包年' : '单次'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-red-700">¥{o.amount.toFixed(2)}</div>
                      <div className="text-xs text-gray-400">{formatDate(o.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
