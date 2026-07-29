'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-client';

const menuItems = [
  { href: '/admin', label: '控制台', icon: '📊', exact: true },
  { href: '/admin/users', label: '用户管理', icon: '👥' },
  { href: '/admin/orders', label: '订单管理', icon: '🧾' },
  { href: '/admin/revenue', label: '收入统计', icon: '💰' },
  { href: '/admin/coupons', label: '优惠券', icon: '🎫' },
  { href: '/admin/tickets', label: '客服工单', icon: '🎫' },
  { href: '/admin/agents', label: '代理商', icon: '🤝' },
  { href: '/admin/rules', label: '排盘规则', icon: '📖' },
  { href: '/admin/versions', label: '版本管理', icon: '🔖' },
  { href: '/admin/points', label: '积分管理', icon: '⭐' },
  { href: '/admin/config', label: '系统设置', icon: '⚙️' },
];

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full" />
    </div>;
  }

  if (!user || user.role !== 'admin') {
    router.push('/login');
    return null;
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="p-5 border-b border-gray-800">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-700 flex items-center justify-center text-white font-bold">管</div>
            <div>
              <div className="font-bold text-white">管理后台</div>
              <div className="text-xs text-gray-400">命理网</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive(item.href, item.exact)
                  ? 'bg-red-700/20 text-red-300 font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <Link href="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300">
            <span>←</span>
            <span>返回前台</span>
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white border-b px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-gray-900">
              {menuItems.find(m => isActive(m.href, m.exact))?.label || '管理后台'}
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>{user.email}</span>
            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">管理员</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
