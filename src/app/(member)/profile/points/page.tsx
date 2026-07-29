'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PointsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetch(`/api/user/points?page=${page}`).then(r => r.json()).then(d => setData(d));
  }, [user, page, router]);

  if (!user) return null;

  const typeMap: Record<string, string> = {
    register: '注册赠送', daily_signin: '每日签到', recharge: '积分充值',
    bazi_paipan: '八字排盘', ziwei_paipan: '紫微排盘',
    admin_adjust: '管理员调整',
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <Link href="/profile" className="text-sm text-gray-500 hover:text-red-700 mb-4 inline-block">← 返回个人中心</Link>

      <div className="card p-6 mb-6">
        <div className="text-center">
          <div className="text-xs text-gray-500">当前积分</div>
          <div className="text-4xl font-bold text-red-700 mt-2">{data?.balance || 0}</div>
          <Link href="/dashboard" className="inline-block mt-3 text-sm text-red-600 hover:text-red-800">去签到赚积分 →</Link>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="card-title">积分明细</h2>
        <div className="space-y-2 mt-4">
          {(data?.rows || []).length === 0 ? (
            <div className="text-center py-8 text-gray-400">暂无记录</div>
          ) : (
            (data?.rows || []).map((r: any) => (
              <div key={r.id} className="flex items-center justify-between py-3 border-b">
                <div>
                  <div className="text-sm font-medium text-gray-900">{typeMap[r.type] || r.type}</div>
                  <div className="text-xs text-gray-500">{r.remark}{r.remark ? ' · ' : ''}{r.createdAt ? new Date(r.createdAt).toLocaleString('zh-CN') : ''}</div>
                </div>
                <div className={`text-sm font-bold ${r.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {r.amount > 0 ? `+${r.amount}` : r.amount}
                </div>
              </div>
            ))
          )}
        </div>
        {(data?.total || 0) > 20 && (
          <div className="flex justify-center gap-2 mt-4">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 text-sm border rounded-lg">上一页</button>
            <button onClick={() => setPage(p => p + 1)} className="px-4 py-2 text-sm border rounded-lg">下一页</button>
          </div>
        )}
      </div>
    </div>
  );
}
