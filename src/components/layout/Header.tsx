'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-client';
import { useBrand } from '@/lib/use-brand';
import { useState } from 'react';

export function Header() {
  const { user, signOut } = useAuth();
  const { brand, isAgentSite } = useBrand();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // 管理后台和代理商后台显示独立布局，不显示前台导航
  if (pathname.startsWith('/admin') || pathname.startsWith('/agent')) {
    return null;
  }

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
            {brand.logo ? (
              <img src={brand.logo} alt={brand.brandName} className="w-11 h-11 rounded-xl object-cover shadow-md" />
            ) : (
              <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-red-700 via-red-800 to-red-900 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all">
                <span className="text-white font-bold text-lg font-kai">{brand.brandName.charAt(0)}</span>
                <div className="absolute inset-0 rounded-xl border border-gold/30" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900 leading-none font-kai">{brand.brandName}</span>
              <span className="text-[11px] text-gold tracking-[0.2em] leading-none mt-1">ZHIWEI</span>
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
          <div className="hidden md:flex items-center space-x-2">
            {user ? (
              <div className="flex items-center space-x-2">
                {/* 根据角色动态跳转 */}
                <div className="relative group">
                  <Link
                    href={user.role === 'admin' ? '/admin' : user.role === 'agent' ? '/agent' : '/profile'}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-red-700 hover:bg-red-50/50 rounded-lg transition-colors"
                  >
                    <span className="w-8 h-8 bg-gradient-to-br from-red-100 to-red-50 rounded-full flex items-center justify-center text-xs font-bold text-red-700 border border-red-200 shadow-sm">
                      {(user.name || '?')[0]}
                    </span>
                    <span className="font-medium text-gray-700">
                      {user.role === 'admin' ? '管理员' : user.role === 'agent' ? '代理商' : (user.name || '我的账户')}
                    </span>
                  </Link>
                </div>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-gray-400 hover:text-red-700 px-2 py-2 transition-colors rounded-lg hover:bg-red-50/30"
                  title="退出登录"
                >
                  退出
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login" className="px-4 py-2 text-sm text-gray-600 hover:text-red-700 hover:bg-red-50/40 rounded-lg transition-colors font-medium">
                  登录
                </Link>
                <Link href="/register" className="btn-primary !py-2 !px-5 text-sm">
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
              {user ? (
                <>
                  {/* 根据角色动态跳转 */}
                  <Link
                    href={user.role === 'admin' ? '/admin' : user.role === 'agent' ? '/agent' : '/profile'}
                    className="px-4 py-3 text-sm text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {user.role === 'admin' ? '管理后台' : user.role === 'agent' ? '代理商后台' : '个人中心'}
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="px-4 py-3 text-sm text-left text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors w-full"
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
