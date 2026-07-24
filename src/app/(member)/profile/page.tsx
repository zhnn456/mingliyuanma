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
      bazi: 'bg-red-100 text-red-800',
      ziwei: 'bg-purple-100 text-purple-800',
      qimen: 'bg-blue-100 text-blue-800',
      meihua: 'bg-green-100 text-green-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h1>
          <Link href="/login" className="btn-primary px-6 py-2">
            去登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">个人中心</h1>
          <p className="text-gray-600">查看您的账户信息和历史记录</p>
        </div>

        {/* 用户信息卡片 */}
        <div className="card mb-6">
          <h2 className="card-title">账户信息</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-500">邮箱</span>
              <span className="font-medium text-gray-900">{session.user?.email}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-500">会员等级</span>
              <span className="font-medium chinese-gold">
                {(session as any)?.user?.memberLevel === 'lifetime' ? '终身会员' :
                 (session as any)?.user?.memberLevel === 'yearly' ? '年卡会员' :
                 (session as any)?.user?.memberLevel === 'monthly' ? '月卡会员' : '免费用户'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-500">注册时间</span>
              <span className="font-medium text-gray-900">
                {new Date((session as any)?.user?.createdAt || Date.now()).toLocaleDateString('zh-CN')}
              </span>
            </div>
          </div>
        </div>

        {/* 快捷操作 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Link href="/bazi" className="card text-center hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-2">🔮</div>
            <div className="text-sm font-medium text-gray-700">八字排盘</div>
          </Link>
          <Link href="/ziwei" className="card text-center hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-2">⭐</div>
            <div className="text-sm font-medium text-gray-700">紫微斗数</div>
          </Link>
          <Link href="/qimen" className="card text-center hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-2">🧭</div>
            <div className="text-sm font-medium text-gray-700">奇门遁甲</div>
          </Link>
          <Link href="/meihua" className="card text-center hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-2">🌸</div>
            <div className="text-sm font-medium text-gray-700">梅花易数</div>
          </Link>
        </div>

        {/* 历史记录 */}
        <div className="card">
          <h2 className="card-title">历史记录</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📝</div>
              <p>暂无历史记录</p>
              <p className="text-sm mt-2">开始排盘后，记录会自动保存</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(record.type)}`}>
                      {getTypeName(record.type)}
                    </span>
                    <span className="text-sm text-gray-600">
                      {new Date(record.createdAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <button className="text-sm text-red-700 hover:text-red-900 font-medium">
                    查看详情
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
