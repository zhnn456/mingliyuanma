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
      default: `${siteName} - 免费八字排盘·紫微斗数·奇门遁甲·梅花易数`,
      template: `%s - ${siteName}`,
    },
    description: '知微阁提供免费八字排盘、紫微斗数排盘、奇门遁甲排盘、梅花易数起卦等在线命理工具，融合四柱八字、紫微斗数、奇门遁甲、梅花易数四大传统命理体系，并收录传统文化知识文章。',
    keywords: ['八字排盘', '紫微斗数', '奇门遁甲', '梅花易数', '免费排盘', '算命', '命理', '在线占卜', '传统文化', '知微阁'],
    metadataBase: new URL('https://ming8.online'),
    verification: {
      other: {
        'baidu-site-verification': 'codeva-hyw462vt6N',
      },
    },
    icons: {
      icon: '/favicon.svg',
      shortcut: '/favicon.svg',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title: `${siteName} - 免费八字排盘·紫微斗数·奇门遁甲·梅花易数在线工具`,
      description: '免费八字排盘、紫微斗数、奇门遁甲、梅花易数在线工具与传统文化知识库。',
      type: 'website',
      locale: 'zh_CN',
      siteName,
      images: [
        {
          url: 'https://ming8.online/og-image.jpg',
          width: 1200,
          height: 630,
          alt: siteName,
        },
      ],
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
