'use client';

import { useState, useEffect } from 'react';

export default function AdminConfigPage() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editKey, setEditKey] = useState('');
  const [editValue, setEditValue] = useState('');

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/config');
      if (res.ok) { const d = await res.json(); setConfigs(d.configs || d || []); }
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { fetchConfig(); }, []);

  const updateConfig = async (key: string, value: string) => {
    await fetch('/api/admin/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });
    fetchConfig();
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-6">系统设置</h2>
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-5">
          {loading ? (
            <div className="text-center py-8 text-gray-400">加载中...</div>
          ) : (
            <div className="space-y-3">
              {Array.isArray(configs) && configs.map((c: any) => (
                <div key={c.key || Math.random()} className="flex items-center justify-between py-3 border-b">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">{c.key}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{c.category || 'general'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {editKey === c.key ? (
                      <>
                        <input value={editValue} onChange={e => setEditValue(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm w-48" autoFocus />
                        <button onClick={() => { updateConfig(c.key, editValue); setEditKey(''); }} className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs">保存</button>
                        <button onClick={() => setEditKey('')} className="px-3 py-1.5 border rounded-lg text-xs">取消</button>
                      </>
                    ) : (
                      <>
                        <span className="text-sm text-gray-700 max-w-xs truncate">{c.value}</span>
                        <button onClick={() => { setEditKey(c.key); setEditValue(c.value); }} className="text-xs text-red-600 hover:text-red-800 ml-2">编辑</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
