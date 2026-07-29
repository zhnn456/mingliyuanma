'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SecurityPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) { router.push('/login'); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) { setMsg('两次密码不一致'); return; }
    if (newPwd.length < 6) { setMsg('密码至少6位'); return; }
    setLoading(true); setMsg('');
    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword: oldPwd, newPassword: newPwd }),
      });
      const data = await res.json();
      if (res.ok) { setMsg('✅ 密码修改成功'); setOldPwd(''); setNewPwd(''); setConfirmPwd(''); }
      else { setMsg(data.error || '修改失败'); }
    } catch { setMsg('网络错误'); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-lg mx-auto py-10 px-4">
      <Link href="/profile" className="text-sm text-gray-500 hover:text-red-700 mb-4 inline-block">← 返回个人中心</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">安全设置</h1>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="form-label">当前密码</label>
          <input type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} required className="w-full px-4 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="form-label">新密码</label>
          <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} required minLength={6} className="w-full px-4 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="form-label">确认新密码</label>
          <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} required className="w-full px-4 py-2 border rounded-lg" />
        </div>

        {msg && <div className={`text-sm px-4 py-3 rounded-xl ${msg.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg}</div>}

        <button type="submit" disabled={loading} className="w-full btn-primary py-3 disabled:opacity-50">
          {loading ? '修改中...' : '修改密码'}
        </button>
      </form>
    </div>
  );
}
