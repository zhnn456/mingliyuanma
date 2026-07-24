import type { Metadata } from 'next';
import { Noto_Serif_SC, ZCOOL_XiaoWei } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Providers } from '@/components/Providers';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// 中文字体：标题使用思源宋体
const notoSerif = Noto_Serif_SC({
  subsets: ['latin'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-serif',
  display: 'swap',
});

// 装饰性书法字体
const zcoolXiaowei = ZCOOL_XiaoWei({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-xiaowei',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: '命理网 - 专业命理测算平台',
    template: '%s - 命理网',
  },
  description: '提供四柱八字、紫微斗数、奇门遁甲、梅花易数等专业命理测算服务，传承千年智慧，融合现代科技。',
  keywords: ['八字', '紫微斗数', '奇门遁甲', '梅花易数', '命理', '排盘', '算命', '占卜'],
  openGraph: {
    title: '命理网 - 专业命理测算平台',
    description: '提供四柱八字、紫微斗数、奇门遁甲、梅花易数等专业命理测算服务',
    type: 'website',
    locale: 'zh_CN',
    siteName: '命理网',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={`${notoSerif.variable} ${zcoolXiaowei.variable}`}>
      <body className="min-h-screen flex flex-col bg-[#f5f0e8] font-sans">
        <Providers>
          <Header />
          <main className="flex-1">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
