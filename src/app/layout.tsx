import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Providers } from '@/components/Providers';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import AnnouncementBar from '@/components/AnnouncementBar';
import { getBrandName } from '@/lib/brand';

export async function generateMetadata(): Promise<Metadata> {
  const siteName = await getBrandName();

  return {
    title: {
      default: `${siteName} - 传统文化智慧平台`,
      template: `%s - ${siteName}`,
    },
    description: '传承千年智慧，融合现代科技，以传统文化视角提供性格分析与文化解读服务。',
    keywords: ['八字', '紫微斗数', '奇门遁甲', '梅花易数', '命理', '排盘', '传统文化', '国学'],
    verification: {
      other: {
        'baidu-site-verification': 'codeva-hyw462vt6N',
      },
    },
    openGraph: {
      title: `${siteName} - 传统文化智慧平台`,
      description: '传承千年智慧，以传统文化视角提供性格分析与文化解读服务',
      type: 'website',
      locale: 'zh_CN',
      siteName,
    },
  };
}

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
