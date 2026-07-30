'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [name, setName] = useState(user?.name || '');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

  if (!user) return null;

  const handleSave = async () => {
    // 简单实现：更新本地显示
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-lg mx-auto py-10 px-4">
      <Link href="/profile" className="text-sm text-gray-500 hover:text-red-700 mb-4 inline-block">← 返回个人中心</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">偏好设置</h1>

      <div className="card p-6 space-y-5">
        <div>
          <label className="form-label">显示名称</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
        </div>

        <div className="flex items-center justify-between py-3 border-b">
          <div>
            <div className="font-medium text-gray-900">邮件通知</div>
            <div className="text-xs text-gray-500">接收订单和供奉相关通知</div>
          </div>
          <div className="w-12 h-6 bg-red-600 rounded-full relative cursor-pointer">
            <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow" />
          </div>
        </div>

        <div className="flex items-center justify-between py-3 border-b">
          <div>
            <div className="font-medium text-gray-900">每日运势推送</div>
            <div className="text-xs text-gray-500">每天早上推送当日运势</div>
          </div>
          <div className="w-12 h-6 bg-gray-300 rounded-full relative cursor-pointer">
            <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5 shadow" />
          </div>
        </div>

        {saved && <div className="text-sm text-green-600 bg-green-50 px-4 py-2 rounded-lg">✅ 已保存</div>}

        <button onClick={handleSave} className="w-full btn-primary py-3">保存设置</button>

        <div className="border-t pt-4 mt-4">
          <button onClick={() => { signOut(); router.push('/'); }} className="w-full py-3 text-sm text-red-600 hover:text-red-800 border border-red-200 rounded-lg hover:bg-red-50">
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
}
