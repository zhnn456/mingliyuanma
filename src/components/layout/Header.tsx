'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

export function Header() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-parchment-50/95 backdrop-blur-md border-b border-parchment-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - 使用书法字体 */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl font-bold chinese-red" style={{ fontFamily: 'var(--font-xiaowei), cursive' }}>
              命理网
            </span>
            <span className="seal-tag-gold hidden sm:inline-block">传承</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {[
              { href: '/', label: '首页' },
              { href: '/bazi', label: '八字' },
              { href: '/ziwei', label: '紫微' },
              { href: '/qimen', label: '奇门' },
              { href: '/meihua', label: '梅花' },
              { href: '/offering', label: '供奉' },
              { href: '/knowledge', label: '知识' },
              { href: '/membership', label: '会员' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-sm text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-medium"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-3">
            {session ? (
              <div className="flex items-center space-x-3">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <span className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-xs font-bold text-red-700">
                    {(session.user?.name || '?')[0]}
                  </span>
                  <span>{session.user?.name || '个人中心'}</span>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-gray-500 hover:text-red-700 px-2 py-1 transition-colors"
                >
                  退出
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login" className="px-4 py-2 text-sm text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                  登录
                </Link>
                <Link href="/register" className="btn-primary text-sm !py-2 !px-5">
                  注册
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-parchment-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
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
          <div className="md:hidden py-4 border-t border-parchment-200">
            <nav className="flex flex-col space-y-1">
              {[
                { href: '/', label: '首页' },
                { href: '/bazi', label: '四柱八字' },
                { href: '/ziwei', label: '紫微斗数' },
                { href: '/qimen', label: '奇门遁甲' },
                { href: '/meihua', label: '梅花易数' },
                { href: '/offering', label: '在线供奉' },
                { href: '/knowledge', label: '命理知识' },
                { href: '/membership', label: '会员中心' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-4 py-2.5 text-sm text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="divider-gold my-2" />
              {session ? (
                <>
                  <Link
                    href="/profile"
                    className="px-4 py-2.5 text-sm text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    个人中心
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="px-4 py-2.5 text-sm text-left text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    退出登录
                  </button>
                </>
              ) : (
                <div className="flex gap-2 px-4 pt-2">
                  <Link
                    href="/login"
                    className="flex-1 text-center px-4 py-2.5 text-sm border border-parchment-300 text-gray-700 rounded-lg hover:bg-parchment-100 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    登录
                  </Link>
                  <Link
                    href="/register"
                    className="flex-1 text-center px-4 py-2.5 text-sm btn-primary !py-2.5"
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
