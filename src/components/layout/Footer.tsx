import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 品牌介绍 */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-xl font-bold chinese-gold mb-4">命理网</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              传承千年智慧，融合现代科技。我们致力于为您提供专业、精准的传统命理测算服务，
              包括四柱八字、紫微斗数、奇门遁甲、梅花易数等。
            </p>
          </div>

          {/* 快速链接 */}
          <div>
            <h4 className="text-white font-semibold mb-4">命理服务</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/bazi" className="text-gray-400 hover:text-gold-400 text-sm">
                  四柱八字
                </Link>
              </li>
              <li>
                <Link href="/ziwei" className="text-gray-400 hover:text-gold-400 text-sm">
                  紫微斗数
                </Link>
              </li>
              <li>
                <Link href="/qimen" className="text-gray-400 hover:text-gold-400 text-sm">
                  奇门遁甲
                </Link>
              </li>
              <li>
                <Link href="/meihua" className="text-gray-400 hover:text-gold-400 text-sm">
                  梅花易数
                </Link>
              </li>
            </ul>
          </div>

          {/* 其他链接 */}
          <div>
            <h4 className="text-white font-semibold mb-4">关于我们</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-gold-400 text-sm">
                  关于命理网
                </Link>
              </li>
              <li>
                <Link href="/membership" className="text-gray-400 hover:text-gold-400 text-sm">
                  会员中心
                </Link>
              </li>
              <li>
                <Link href="/offering" className="text-gray-400 hover:text-gold-400 text-sm">
                  在线供奉
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-gold-400 text-sm">
                  联系我们
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 底部版权 */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} 命理网. 传承经典，启迪智慧.
          </p>
          <p className="text-gray-600 text-xs mt-2">
            本站内容仅供参考娱乐，请理性看待
          </p>
        </div>
      </div>
    </footer>
  );
}
