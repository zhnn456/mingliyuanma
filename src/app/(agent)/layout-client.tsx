'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, getPendingUser } from '@/lib/auth-client';
import UpdateNotification from '@/components/UpdateNotification';

const menuItems = [
  { href: '/agent', label: '数据概览', icon: '📊', exact: true },
  { href: '/agent/dashboard', label: '收益看板', icon: '💰' },
  { href: '/agent/agent-orders', label: '我的订单', icon: '🧾' },
  { href: '/agent/commissions', label: '分润明细', icon: '📈' },
  { href: '/agent/agent-settlements', label: '结算中心', icon: '🏦' },
  { href: '/agent/customers', label: '客户管理', icon: '👥' },
  { href: '/agent/settings', label: '代理设置', icon: '⚙️' },
  { href: '/agent/updates', label: '系统更新', icon: '🔄' },
];

export default function AgentLayoutClient({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasNewVersion, setHasNewVersion] = useState(false);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const res = await fetch('/api/agent/updates');
        if (!res.ok) return;
        const data = await res.json();
        if (data.latestVersion && data.currentVersion) {
          setHasNewVersion(data.latestVersion !== data.currentVersion);
        }
      } catch {}
    };
    checkVersion();
  }, []);

  useEffect(() => {
    if (!loading) {
      const effectiveUser = user || getPendingUser();
      if (!effectiveUser) {
        router.replace('/login');
      } else if (effectiveUser.role === 'admin') {
        router.replace('/admin');
      } else if (effectiveUser.role !== 'agent') {
        router.replace('/');
      }
    }
  }, [loading, user, router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full" /></div>;

  const effectiveUser = user || getPendingUser();
  if (!effectiveUser || effectiveUser.role !== 'agent') return null;

  const currentMenu = menuItems.find(m => m.exact ? pathname === m.href : pathname.startsWith(m.href));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="p-5 border-b border-gray-800">
          <Link href="/agent" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-700 flex items-center justify-center text-white font-bold">代</div>
            <div><div className="font-bold text-white">代理商后台</div><div className="text-xs text-gray-400">命理网</div></div>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map(item => (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                (item.exact ? pathname === item.href : pathname.startsWith(item.href))
                  ? 'bg-blue-700/20 text-blue-300 font-medium' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}>
              <span className="relative">
                {item.icon}
                {item.href === '/agent/updates' && hasNewVersion && (
                  <span className="absolute -top-1 -right-2 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <Link href="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300"><span>←</span><span>返回前台</span></Link>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-h-screen">
        <UpdateNotification />
        <header className="bg-white border-b px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h1 className="text-lg font-bold text-gray-900">{currentMenu?.label || '代理商后台'}</h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Link href="/agent/updates" className="relative p-2 hover:bg-gray-100 rounded-full transition-colors" title="系统更新">
              <span className="text-lg">🔔</span>
              {hasNewVersion && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </Link>
            <span>{effectiveUser.email}</span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">代理商</span>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
