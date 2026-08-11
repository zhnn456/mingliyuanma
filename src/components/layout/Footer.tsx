'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBrand } from '@/lib/use-brand';

export function Footer() {
  const pathname = usePathname();
  const { brand } = useBrand();

  // 管理后台不显示前台 Footer
  if (pathname.startsWith('/admin') || pathname.startsWith('/agent')) {
    return null;
  }

  return (
    <footer className="relative bg-gradient-to-b from-gray-900 to-gray-950 text-gray-300 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      <div className="absolute inset-0 bg-hero-pattern opacity-[0.03]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              {brand.logo ? (
                <img src={brand.logo} alt={brand.brandName} className="w-9 h-9 rounded-lg object-cover shadow-md" />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm font-kai">{brand.brandName.charAt(0)}</span>
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-lg font-bold chinese-gold leading-none font-kai">{brand.brandName}</span>
                <span className="text-[10px] text-gold/60 tracking-[0.2em] leading-none mt-1">ZHIWEI</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-md">传承千年智慧，融合现代科技。</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wide">命理服务</h4>
            <ul className="space-y-3">
              {[{ href: '/bazi', label: '四柱八字' }, { href: '/ziwei', label: '紫微斗数' }, { href: '/qimen', label: '奇门遁甲' }, { href: '/meihua', label: '梅花易数' }].map(item => (
                <li key={item.href}><Link href={item.href} className="text-gray-400 hover:text-gold text-sm transition-colors">{item.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wide">关于我们</h4>
            <ul className="space-y-3">
              {[{ href: '/about', label: `关于${brand.brandName}` }, { href: '/membership', label: '会员中心' }, { href: '/offering', label: '在线祈福' }, { href: '/contact', label: '联系我们' }].map(item => (
                <li key={item.href}><Link href={item.href} className="text-gray-400 hover:text-gold text-sm transition-colors">{item.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wide">法律信息</h4>
            <ul className="space-y-3">
              {[{ href: '/terms', label: '服务条款' }, { href: '/privacy', label: '隐私政策' }, { href: '/copyright', label: '版权声明' }].map(item => (
                <li key={item.href}><Link href={item.href} className="text-gray-400 hover:text-gold text-sm transition-colors">{item.label}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-12 pt-10 text-center space-y-3">
          <p className="text-gray-500 text-sm">© 2026 {brand.brandName} · 传承经典，启迪智慧</p>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
            <Link href="/about" className="hover:text-gray-400 transition-colors">关于我们</Link>
            <span>|</span>
            <Link href="/terms" className="hover:text-gray-400 transition-colors">服务条款</Link>
            <span>|</span>
            <Link href="/privacy" className="hover:text-gray-400 transition-colors">隐私政策</Link>
            <span>|</span>
            <Link href="/copyright" className="hover:text-gray-400 transition-colors">版权声明</Link>
          </div>
          <p className="text-xs text-gray-700 pt-2">本站部分算法逻辑参考 GitHub 开源项目 · 内容仅供传统文化研究与娱乐参考，不构成任何现实建议</p>
        </div>
      </div>
    </footer>
  );
}
