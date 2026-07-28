'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface HistoryRecord {
  id: string;
  type: 'bazi' | 'ziwei' | 'qimen' | 'meihua';
  createdAt: string;
  input: any;
  result: any;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchHistory();
    }
  }, [session]);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/user/history');
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeName = (type: string) => {
    const names: Record<string, string> = {
      bazi: '八字排盘',
      ziwei: '紫微斗数',
      qimen: '奇门遁甲',
      meihua: '梅花易数',
    };
    return names[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      bazi: 'bg-red-100 text-red-800 border-red-200',
      ziwei: 'bg-purple-100 text-purple-800 border-purple-200',
      qimen: 'bg-blue-100 text-blue-800 border-blue-200',
      meihua: 'bg-green-100 text-green-800 border-green-200',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh-gradient opacity-40" />
        <div className="text-center relative z-10">
          <div className="text-5xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4 font-kai">请先登录</h1>
          <Link href="/login" className="btn-primary px-8 py-2.5">
            去登录
          </Link>
        </div>
      </div>
    );
  }

  const shortcuts = [
    { href: '/bazi', icon: '☰', title: '八字排盘', color: 'from-red-500 to-red-700' },
    { href: '/ziwei', icon: '★', title: '紫微斗数', color: 'from-purple-500 to-indigo-700' },
    { href: '/qimen', icon: '◈', title: '奇门遁甲', color: 'from-blue-500 to-cyan-700' },
    { href: '/meihua', icon: '✿', title: '梅花易数', color: 'from-pink-500 to-rose-700' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment-50 via-paper to-white py-10">
      <div className="absolute inset-0 bg-mesh-gradient opacity-30 pointer-events-none" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* 页面标题 */}
        <div className="page-header">
          <div className="section-label justify-center">PROFILE</div>
          <h1 className="page-header-title">
            <span>个人中心</span>
          </h1>
          <p className="page-header-subtitle">查看您的账户信息和历史记录</p>
        </div>

        {/* 用户信息卡片 */}
        <div className="card p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gold/5 to-transparent rounded-full blur-2xl" />
          <h2 className="card-title relative z-10">账户信息</h2>
          <div className="space-y-1 relative z-10">
            <div className="flex justify-between items-center py-3 border-b border-parchment-100">
              <span className="text-gray-500 text-sm">邮箱</span>
              <span className="font-medium text-gray-900 text-sm">{session.user?.email}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-parchment-100">
              <span className="text-gray-500 text-sm">会员等级</span>
              <span className={`font-medium text-sm px-2.5 py-0.5 rounded ${
                (session as any)?.user?.memberLevel === 'lifetime'
                  ? 'bg-gradient-to-r from-gold/20 to-gold/10 text-gold-dark border border-gold/30'
                  : (session as any)?.user?.memberLevel === 'yearly'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : (session as any)?.user?.memberLevel === 'monthly'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {(session as any)?.user?.memberLevel === 'lifetime' ? '终身会员' :
                 (session as any)?.user?.memberLevel === 'yearly' ? '年卡会员' :
                 (session as any)?.user?.memberLevel === 'monthly' ? '月卡会员' : '免费用户'}
              </span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-500 text-sm">注册时间</span>
              <span className="font-medium text-gray-900 text-sm">
                {new Date((session as any)?.user?.createdAt || Date.now()).toLocaleDateString('zh-CN')}
              </span>
            </div>
          </div>
        </div>

        {/* 快捷操作 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {shortcuts.map((s) => (
            <Link key={s.href} href={s.href} className="group card card-hover p-4 text-center">
              <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-xl text-white shadow-md group-hover:scale-110 transition-transform mb-2`}>
                {s.icon}
              </div>
              <div className="text-sm font-medium text-gray-700 group-hover:text-red-700 transition-colors">{s.title}</div>
            </Link>
          ))}
        </div>

        {/* 历史记录 */}
        <div className="card p-6">
          <h2 className="card-title">历史记录</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500 flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              加载中...
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-5xl mb-3">📝</div>
              <p className="text-gray-500">暂无历史记录</p>
              <p className="text-sm mt-2">开始排盘后，记录会自动保存</p>
              <Link href="/bazi" className="inline-block mt-4 btn-outline px-6 py-2 text-sm">
                开始排盘
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {records.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3.5 bg-parchment-50/60 rounded-xl border border-parchment-100 hover:bg-parchment-100/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${getTypeColor(record.type)}`}>
                      {getTypeName(record.type)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(record.createdAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <button className="text-sm text-red-700 hover:text-red-900 font-medium flex items-center gap-1 group">
                    查看详情
                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
