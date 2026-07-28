'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

export function Header() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: '首页' },
    { href: '/bazi', label: '八字' },
    { href: '/ziwei', label: '紫微' },
    { href: '/qimen', label: '奇门' },
    { href: '/meihua', label: '梅花' },
    { href: '/offering', label: '供奉' },
    { href: '/knowledge', label: '知识' },
    { href: '/membership', label: '会员' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 glass border-b border-parchment-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-red-700 via-red-800 to-red-900 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all">
              <span className="text-white font-bold text-lg font-kai">命</span>
              <div className="absolute inset-0 rounded-xl border border-gold/30" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900 leading-none font-kai">命理网</span>
              <span className="text-[11px] text-gold tracking-[0.2em] leading-none mt-1">MINGLI</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2.5 text-sm rounded-lg transition-all font-medium relative ${
                  isActive(item.href)
                    ? 'text-red-700 bg-red-50/80'
                    : 'text-gray-600 hover:text-red-700 hover:bg-red-50/40'
                }`}
              >
                {item.label}
                {isActive(item.href) && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-red-600 to-gold rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-3">
            {session ? (
              <div className="flex items-center space-x-3">
                {['admin', 'agent'].includes((session.user as any)?.role) && (
                  <Link
                    href="/agent"
                    className="px-4 py-2 text-sm text-gold-dark hover:text-gold rounded-lg transition-colors border border-gold/30 hover:border-gold/50 hover:bg-gold/5"
                  >
                    代理商
                  </Link>
                )}
                {(session.user as any)?.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="px-4 py-2 text-sm text-gray-600 hover:text-red-700 rounded-lg transition-colors hover:bg-red-50/50"
                  >
                    管理
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:text-red-700 hover:bg-red-50/50 rounded-lg transition-colors"
                >
                  <span className="w-9 h-9 bg-gradient-to-br from-red-100 to-red-50 rounded-full flex items-center justify-center text-sm font-bold text-red-700 border border-red-200 shadow-sm">
                    {(session.user?.name || '?')[0]}
                  </span>
                  <span className="font-medium">{session.user?.name || '个人中心'}</span>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-gray-400 hover:text-red-700 px-3 py-2 transition-colors rounded-lg hover:bg-red-50/30"
                >
                  退出
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login" className="px-5 py-2.5 text-sm text-gray-600 hover:text-red-700 hover:bg-red-50/40 rounded-lg transition-colors font-medium">
                  登录
                </Link>
                <Link href="/register" className="btn-primary !py-2.5 !px-6">
                  注册
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-parchment-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="菜单"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-5 border-t border-parchment-200 animate-fade-in-up">
            <nav className="flex flex-col space-y-1.5">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-3 text-sm rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'text-red-700 bg-red-50 font-medium'
                      : 'text-gray-700 hover:text-red-700 hover:bg-red-50/50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="divider-gold my-3" />
              {session ? (
                <>
                  <Link
                    href="/profile"
                    className="px-4 py-3 text-sm text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    个人中心
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="px-4 py-3 text-sm text-left text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    退出登录
                  </button>
                </>
              ) : (
                <div className="flex gap-3 px-4 pt-3">
                  <Link
                    href="/login"
                    className="flex-1 text-center px-4 py-3 text-sm border border-parchment-300 text-gray-700 rounded-lg hover:bg-parchment-100 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    登录
                  </Link>
                  <Link
                    href="/register"
                    className="flex-1 text-center px-4 py-3 text-sm btn-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    注册
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
