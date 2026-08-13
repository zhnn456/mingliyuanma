'use client';

import { useState, useEffect } from 'react';

type MockConfig = {
  baseDate: string;
  baseOfferings: number;
  baseUsers: number;
  baseLingzhu: number;
  dailyOfferingsInc: number;
  dailyUsersInc: number;
  dailyLingzhuInc: number;
  isActive: boolean;
};

type MockStats = {
  totalOfferings: number;
  totalUsers: number;
  totalLingzhu: number;
  daysDiff: number;
};

type RealStats = {
  totalOfferings: number;
  totalUsers: number;
  totalLingzhu: number;
};

function fmt(n: number) {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  return n.toLocaleString('zh-CN');
}

export default function AdminOfferingMockPage() {
  const [tab, setTab] = useState<'real' | 'mock'>('real');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<MockConfig | null>(null);
  const [mockStats, setMockStats] = useState<MockStats | null>(null);
  const [realStats, setRealStats] = useState<RealStats | null>(null);
  const [form, setForm] = useState({
    baseDate: '2026-01-01',
    baseOfferings: 12800,
    baseUsers: 3200,
    baseLingzhu: 256000,
    dailyOfferingsInc: 80,
    dailyUsersInc: 15,
    dailyLingzhuInc: 12000,
    isActive: true,
  });
  const [message, setMessage] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/offering-mock');
      if (res.ok) {
        const d = await res.json();
        setConfig(d.config);
        setMockStats(d.mockStats);
        setRealStats(d.realStats);
        if (d.config) {
          setForm({
            baseDate: d.config.baseDate,
            baseOfferings: d.config.baseOfferings,
            baseUsers: d.config.baseUsers,
            baseLingzhu: d.config.baseLingzhu,
            dailyOfferingsInc: d.config.dailyOfferingsInc,
            dailyUsersInc: d.config.dailyUsersInc,
            dailyLingzhuInc: d.config.dailyLingzhuInc,
            isActive: d.config.isActive,
          });
        }
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    setSaving(true); setMessage('');
    try {
      const res = await fetch('/api/admin/offering-mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (res.ok) {
        setMessage('✅ 保存成功');
        fetchData();
      } else {
        setMessage('❌ ' + (d.error || '保存失败'));
      }
    } catch { setMessage('❌ 网络错误'); } finally { setSaving(false); }
  };

  const handleReset = async () => {
    if (!confirm('确定重置模拟数据为默认值？')) return;
    setSaving(true); setMessage('');
    try {
      const res = await fetch('/api/admin/offering-mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      const d = await res.json();
      if (res.ok) {
        setMessage('✅ 已重置为默认值');
        fetchData();
      } else {
        setMessage('❌ ' + (d.error || '重置失败'));
      }
    } catch { setMessage('❌ 网络错误'); } finally { setSaving(false); }
  };

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">祈福数据管理</h2>
        <p className="text-sm text-gray-500">管理祈福广场的真实数据与模拟数据</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('real')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'real' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}>
          📊 真实数据
        </button>
        <button
          onClick={() => setTab('mock')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'mock' ? 'bg-amber-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}>
          ⚠️ 模拟数据
        </button>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${message.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : (
        <>
          {/* ===== 真实数据 Tab ===== */}
          {tab === 'real' && (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
                  <div className="text-3xl font-bold text-green-700">{fmt(realStats?.totalOfferings || 0)}</div>
                  <div className="text-sm text-gray-500 mt-1">祈福次数</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
                  <div className="text-3xl font-bold text-green-700">{fmt(realStats?.totalUsers || 0)}</div>
                  <div className="text-sm text-gray-500 mt-1">参与人数</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
                  <div className="text-3xl font-bold text-green-700">{fmt(realStats?.totalLingzhu || 0)}</div>
                  <div className="text-sm text-gray-500 mt-1">灵珠总额 (💎)</div>
                </div>
              </div>
              <div className="bg-green-50 rounded-xl border border-green-200 p-4">
                <p className="text-sm text-green-800">
                  📋 以上数据来自 <strong>OfferingRecord</strong> 表，为真实用户祈福记录。
                </p>
              </div>
            </div>
          )}

          {/* ===== 模拟数据 Tab ===== */}
          {tab === 'mock' && (
            <div>
              {/* 当前模拟数值 */}
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-5 mb-6">
                <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                  <span>📊</span> 当前模拟数值
                  <span className="text-xs font-normal text-amber-600 ml-auto">
                    距起始日 {mockStats?.daysDiff || 0} 天
                  </span>
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 text-center border border-amber-100">
                    <div className="text-2xl font-bold text-amber-700">{fmt(mockStats?.totalOfferings || 0)}</div>
                    <div className="text-xs text-gray-500 mt-0.5">祈福次数</div>
                    <div className="text-xs text-amber-500 mt-1">+{form.dailyOfferingsInc}/天</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center border border-amber-100">
                    <div className="text-2xl font-bold text-amber-700">{fmt(mockStats?.totalUsers || 0)}</div>
                    <div className="text-xs text-gray-500 mt-0.5">参与人数</div>
                    <div className="text-xs text-amber-500 mt-1">+{form.dailyUsersInc}/天</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center border border-amber-100">
                    <div className="text-2xl font-bold text-amber-700">{fmt(mockStats?.totalLingzhu || 0)}</div>
                    <div className="text-xs text-gray-500 mt-0.5">灵珠总额 (💎)</div>
                    <div className="text-xs text-amber-500 mt-1">+{fmt(form.dailyLingzhuInc)}/天</div>
                  </div>
                </div>
              </div>

              {/* 参数配置 */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <span>⚙️</span> 模拟参数配置
                  </h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm text-gray-600">启用模拟数据</span>
                    <button
                      onClick={() => setForm({ ...form, isActive: !form.isActive })}
                      className={`relative w-10 h-5 rounded-full transition-colors ${form.isActive ? 'bg-amber-500' : 'bg-gray-300'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className={labelCls}>起始日期</label>
                    <input type="date" value={form.baseDate} onChange={e => setForm({ ...form, baseDate: e.target.value })} className={inputCls} />
                  </div>
                  <div className="flex items-end pb-0.5">
                    <span className="text-xs text-gray-400">数字 = 起始值 + 距起始天数 × 每日增量</span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">起始值</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className={labelCls}>起始祈福次数</label>
                      <input type="number" value={form.baseOfferings} onChange={e => setForm({ ...form, baseOfferings: parseInt(e.target.value) || 0 })} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>起始参与人数</label>
                      <input type="number" value={form.baseUsers} onChange={e => setForm({ ...form, baseUsers: parseInt(e.target.value) || 0 })} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>起始灵珠总额</label>
                      <input type="number" value={form.baseLingzhu} onChange={e => setForm({ ...form, baseLingzhu: parseInt(e.target.value) || 0 })} className={inputCls} />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">每日增量</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className={labelCls}>每日祈福增量</label>
                      <input type="number" value={form.dailyOfferingsInc} onChange={e => setForm({ ...form, dailyOfferingsInc: parseInt(e.target.value) || 0 })} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>每日用户增量</label>
                      <input type="number" value={form.dailyUsersInc} onChange={e => setForm({ ...form, dailyUsersInc: parseInt(e.target.value) || 0 })} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>每日灵珠增量</label>
                      <input type="number" value={form.dailyLingzhuInc} onChange={e => setForm({ ...form, dailyLingzhuInc: parseInt(e.target.value) || 0 })} className={inputCls} />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={handleSave} disabled={saving}
                    className="px-6 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors">
                    {saving ? '保存中...' : '保存设置'}
                  </button>
                  <button onClick={handleReset} disabled={saving}
                    className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors">
                    重置为默认值
                  </button>
                </div>

                <div className="mt-4 bg-amber-50 rounded-lg border border-amber-200 p-3">
                  <p className="text-xs text-amber-800">
                    ⚠️ <strong>模拟数据</strong>：用于营造祈福广场人气氛围，数字每天自动增长。关闭后广场只显示真实数据。
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}