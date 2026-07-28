import Link from 'next/link';

export function Footer() {
  return (
    <footer className="relative bg-gradient-to-b from-gray-900 to-gray-950 text-gray-300 overflow-hidden">
      {/* 顶部金色装饰线 */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      {/* 背景纹理 */}
      <div className="absolute inset-0 bg-hero-pattern opacity-[0.03]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* 品牌介绍 */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm font-kai">命</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold chinese-gold leading-none font-kai">命理网</span>
                <span className="text-[10px] text-gold/60 tracking-[0.2em] leading-none mt-1">MINGLI</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-md">
              传承千年智慧，融合现代科技。我们致力于为您提供专业、精准的传统命理测算服务，
              包括四柱八字、紫微斗数、奇门遁甲、梅花易数等。
            </p>
            <div className="flex gap-2 mt-5">
              <span className="seal-tag-gold !text-gold/70 !border-gold/30">千年传承</span>
              <span className="seal-tag-gold !text-gold/70 !border-gold/30">专业精准</span>
              <span className="seal-tag-gold !text-gold/70 !border-gold/30">隐私保护</span>
            </div>
          </div>

          {/* 命理服务 */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wide">命理服务</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/bazi" className="text-gray-400 hover:text-gold text-sm transition-colors flex items-center gap-1.5 group">
                  <span className="w-1 h-1 rounded-full bg-gold/40 group-hover:bg-gold transition-colors" />
                  四柱八字
                </Link>
              </li>
              <li>
                <Link href="/ziwei" className="text-gray-400 hover:text-gold text-sm transition-colors flex items-center gap-1.5 group">
                  <span className="w-1 h-1 rounded-full bg-gold/40 group-hover:bg-gold transition-colors" />
                  紫微斗数
                </Link>
              </li>
              <li>
                <Link href="/qimen" className="text-gray-400 hover:text-gold text-sm transition-colors flex items-center gap-1.5 group">
                  <span className="w-1 h-1 rounded-full bg-gold/40 group-hover:bg-gold transition-colors" />
                  奇门遁甲
                </Link>
              </li>
              <li>
                <Link href="/meihua" className="text-gray-400 hover:text-gold text-sm transition-colors flex items-center gap-1.5 group">
                  <span className="w-1 h-1 rounded-full bg-gold/40 group-hover:bg-gold transition-colors" />
                  梅花易数
                </Link>
              </li>
            </ul>
          </div>

          {/* 关于我们 */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wide">关于我们</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-gold text-sm transition-colors flex items-center gap-1.5 group">
                  <span className="w-1 h-1 rounded-full bg-gold/40 group-hover:bg-gold transition-colors" />
                  关于命理网
                </Link>
              </li>
              <li>
                <Link href="/membership" className="text-gray-400 hover:text-gold text-sm transition-colors flex items-center gap-1.5 group">
                  <span className="w-1 h-1 rounded-full bg-gold/40 group-hover:bg-gold transition-colors" />
                  会员中心
                </Link>
              </li>
              <li>
                <Link href="/offering" className="text-gray-400 hover:text-gold text-sm transition-colors flex items-center gap-1.5 group">
                  <span className="w-1 h-1 rounded-full bg-gold/40 group-hover:bg-gold transition-colors" />
                  在线供奉
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-gold text-sm transition-colors flex items-center gap-1.5 group">
                  <span className="w-1 h-1 rounded-full bg-gold/40 group-hover:bg-gold transition-colors" />
                  联系我们
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 底部版权 */}
        <div className="border-t border-gray-800 mt-12 pt-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-gold/30" />
            <span className="text-gold/40 text-xs">☯</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-gold/30" />
          </div>
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} 命理网 · 传承经典，启迪智慧
          </p>
          <p className="text-gray-600 text-xs mt-2">
            本站内容仅供参考娱乐，请理性看待
          </p>
        </div>
      </div>
    </footer>
  );
}
