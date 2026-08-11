import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Providers } from '@/components/Providers';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import AnnouncementBar from '@/components/AnnouncementBar';

export const metadata: Metadata = {
  title: {
    default: '知微阁 - 专业命理测算平台',
    template: '%s - 知微阁',
  },
  description: '提供四柱八字、紫微斗数、奇门遁甲、梅花易数等专业命理测算服务，传承千年智慧，融合现代科技。',
  keywords: ['八字', '紫微斗数', '奇门遁甲', '梅花易数', '命理', '排盘', '传统文化', '国学'],
  openGraph: {
    title: '知微阁 - 专业命理测算平台',
    description: '提供四柱八字、紫微斗数、奇门遁甲、梅花易数等专业命理测算服务',
    type: 'website',
    locale: 'zh_CN',
    siteName: '知微阁',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex flex-col bg-parchment-100">
        <Providers>
          <AnnouncementBar />
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
