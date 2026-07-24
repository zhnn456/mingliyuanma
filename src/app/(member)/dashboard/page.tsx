'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!session) return null;

  const memberLevelMap: Record<string, string> = {
    free: '免费用户',
    monthly: '月卡会员',
    yearly: '年卡会员',
    lifetime: '终身会员',
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 用户信息 */}
        <div className="card mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                你好，{session.user?.name || '用户'}
              </h1>
              <p className="text-gray-600 mt-1">
                会员等级：
                <span className={`font-medium ${
                  (session.user as any)?.memberLevel === 'free' ? 'text-gray-500' : 'chinese-gold'
                }`}>
                  {memberLevelMap[(session.user as any)?.memberLevel || 'free']}
                </span>
              </p>
            </div>
            <Link href="/membership" className="btn-secondary">
              升级会员
            </Link>
          </div>
        </div>

        {/* 功能入口 */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">命理服务</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/bazi" className="card hover:shadow-xl transition-shadow group">
            <div className="text-3xl mb-3">🏛️</div>
            <h3 className="font-bold text-gray-900 group-hover:text-red-700">四柱八字</h3>
            <p className="text-sm text-gray-500 mt-1">排盘分析</p>
          </Link>
          <Link href="/ziwei" className="card hover:shadow-xl transition-shadow group">
            <div className="text-3xl mb-3">⭐</div>
            <h3 className="font-bold text-gray-900 group-hover:text-red-700">紫微斗数</h3>
            <p className="text-sm text-gray-500 mt-1">命盘排列</p>
          </Link>
          <Link href="/qimen" className="card hover:shadow-xl transition-shadow group">
            <div className="text-3xl mb-3">🔮</div>
            <h3 className="font-bold text-gray-900 group-hover:text-red-700">奇门遁甲</h3>
            <p className="text-sm text-gray-500 mt-1">起局预测</p>
          </Link>
          <Link href="/meihua" className="card hover:shadow-xl transition-shadow group">
            <div className="text-3xl mb-3">🌸</div>
            <h3 className="font-bold text-gray-900 group-hover:text-red-700">梅花易数</h3>
            <p className="text-sm text-gray-500 mt-1">数字起卦</p>
          </Link>
        </div>

        {/* 供奉入口 */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">供奉祈福</h2>
        <Link href="/offering" className="card hover:shadow-xl transition-shadow block">
          <div className="flex items-center">
            <div className="text-4xl mr-4">🙏</div>
            <div>
              <h3 className="font-bold text-gray-900">在线供奉</h3>
              <p className="text-sm text-gray-500 mt-1">供奉祈福，积累功德</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
