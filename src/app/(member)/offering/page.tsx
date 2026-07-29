'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-client';
import Link from 'next/link';

const CATEGORIES = [
  { id: 'cat_buddha', name: '佛像', icon: '🙏', desc: '供奉诸佛，祈求平安' },
  { id: 'cat_bodhi', name: '菩萨', icon: '🪷', desc: '供奉菩萨，广结善缘' },
  { id: 'cat_caishen', name: '财神', icon: '💰', desc: '供奉财神，招财进宝' },
  { id: 'cat_ancestor', name: '祖先', icon: '🏛️', desc: '供奉祖先，慎终追远' },
  { id: 'cat_deity', name: '神灵', icon: '✨', desc: '供奉神灵，护佑平安' },
];

const ITEMS = [
  { name: '清香', price: 100, icon: '🕯️' },
  { name: '鲜花', price: 200, icon: '🌸' },
  { name: '水果', price: 300, icon: '🍎' },
  { name: '素食', price: 500, icon: '🥬' },
  { name: '供灯', price: 1000, icon: '🏮' },
  { name: '宝鼎', price: 2000, icon: '🏺' },
];

export default function OfferingPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'offer' | 'records' | 'leaderboard'>('offer');
  const [selected, setSelected] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [qty, setQty] = useState(1);
  const [dedication, setDedication] = useState('');
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [records, setRecords] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // 加载灵珠余额
  useEffect(() => {
    if (!user) return;
    fetch('/api/user/lingzhu').then(r => r.json()).then(d => setBalance(d.balance || 0)).catch(() => {});
  }, [user]);

  // 切换tab时加载数据
  useEffect(() => {
    if (!user) return;
    if (tab === 'records') loadRecords();
    if (tab === 'leaderboard') loadLeaderboard();
  }, [tab, user]);

  const loadRecords = async () => {
    setDataLoading(true);
    try { const r = await fetch('/api/offering?type=records'); if (r.ok) setRecords((await r.json()).records || []); } catch {} finally { setDataLoading(false); }
  };
  const loadLeaderboard = async () => {
    setDataLoading(true);
    try { const r = await fetch('/api/offering?type=leaderboard'); if (r.ok) setLeaderboard((await r.json()).leaderboard || []); } catch {} finally { setDataLoading(false); }
  };

  const handleSubmit = async () => {
    if (!selected) { alert('请选择供品'); return; }
    const item = ITEMS.find(i => i.name === selected);
    if (!item) return;
    const cost = item.price * qty;
    if (balance < cost) { alert(`灵珠不足！需要${cost}灵珠，当前${balance}灵珠`); window.location.href = '/profile/recharge'; return; }

    setLoading(true); setMsg(''); setSuccess('');
    try {
      const res = await fetch('/api/offering/pay', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemName: selected, quantity: qty, dedication }),
      });
      const d = await res.json();
      if (res.ok) {
        setBalance(d.balance);
        setSuccess(`✅ 供奉成功！功德无量 🙏`);
        setSelected(''); setQty(1); setDedication('');
        loadRecords();
      } else {
        setMsg(d.error || '供奉失败');
      }
    } catch { setMsg('网络错误，请重试'); } finally { setLoading(false); }
  };

  const rankIcon = (r: number) => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : `${r}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment-50 via-paper to-white py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
        <div className="page-header">
          <div className="section-label justify-center">OFFERING</div>
          <h1 className="page-header-title">
            <span>在线供奉</span>
          </h1>
          <p className="page-header-subtitle">虔诚供奉，积累功德，祈福平安</p>
        </div>
        </div>

        {/* 灵珠余额 */}
        {user && (
          <div className="flex items-center justify-end gap-3 mb-4">
            <span className="text-sm text-gray-500">💎 灵珠余额：<strong className="text-purple-700">{balance}</strong></span>
            <Link href="/profile/recharge" className="text-xs px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700">充值</Link>
          </div>
        )}

        {/* 反馈消息 */}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-center text-sm">{success}</div>}
        {msg && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{msg}</div>}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'offer' as const, label: '供奉', icon: '🙏' },
            { key: 'records' as const, label: '我的记录', icon: '📋' },
            { key: 'leaderboard' as const, label: '功德榜', icon: '🏆' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-5 py-2 rounded-lg font-medium text-sm transition-colors ${tab === t.key ? 'bg-red-700 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ======== 供奉 Tab ======== */}
        {tab === 'offer' && (
          <>
            {/* 供奉分类 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCat(cat.id)}
                  className={`card text-center p-4 hover:shadow-xl transition-all cursor-pointer ${selectedCat === cat.id ? 'ring-2 ring-red-600 shadow-lg' : ''}`}>
                  <div className="text-4xl mb-2">{cat.icon}</div>
                  <h3 className="text-sm font-bold text-gray-900">{cat.name}</h3>
                  <p className="text-xs text-gray-600 mt-1">{cat.desc}</p>
                </button>
              ))}
            </div>

            {/* 供品选择 — 选择分类后显示 */}
            {selectedCat && (<>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                {ITEMS.map(item => (
                  <button key={item.name} onClick={() => setSelected(item.name)}
                    className={`p-4 border-2 rounded-xl text-center transition-all ${selected === item.name ? 'border-red-600 bg-red-50 shadow-md' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                    <div className="text-3xl mb-2">{item.icon}</div>
                    <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                    <div className="text-sm text-purple-700 font-bold mt-1">{item.price} 💎</div>
                  </button>
                ))}
              </div>

              {/* 供奉表单 */}
              {selected && (
                <div className="bg-white rounded-xl border p-6 mb-6">
                  <h2 className="font-bold text-gray-900 mb-4">供奉信息</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">数量</label>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold">-</button>
                        <span className="text-xl font-bold text-gray-900 w-12 text-center">{qty}</span>
                        <button onClick={() => setQty(qty + 1)} className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold">+</button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">回向/祈愿</label>
                      <textarea value={dedication} onChange={e => setDedication(e.target.value)} placeholder="输入您的祈愿或回向文..." rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm" />
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">供奉费用</span>
                        <span className="text-xl font-bold text-purple-700">{((ITEMS.find(i => i.name === selected)?.price || 0) * qty)} 💎</span>
                      </div>
                      <div className="flex justify-between items-center text-sm mt-1">
                        <span className="text-gray-500">当前灵珠</span>
                        <span className="font-medium">{balance} 💎</span>
                      </div>
                    </div>
                    <button onClick={handleSubmit} disabled={loading || !user}
                      className="w-full bg-red-700 text-white py-3 rounded-xl text-lg font-medium disabled:opacity-50 hover:bg-red-800">
                      {loading ? '供奉中...' : '开始供奉'}
                    </button>
                    {!user && <p className="text-center text-sm text-gray-500">请先 <Link href="/login" className="text-red-700 hover:underline">登录</Link> 后供奉</p>}
                  </div>
                </div>
              )}
            </>)}
            
            {/* 供奉说明 */}
            {selectedCat && (
              <div className="bg-gradient-to-r from-red-50 via-parchment-50 to-red-50 rounded-xl p-6 border border-red-100">
                <h3 className="font-bold text-gray-900 text-sm mb-2">🙏 关于供奉</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  供奉是一种表达虔诚与敬意的方式，通过供奉可以积累功德、祈福平安。 
                  心诚则灵，每一份供奉都是善念的传递。
                </p>
                <p className="text-xs text-gray-400 mt-3">
                  ⚠️ 免责声明：供奉行为仅为传统文化表达，不代表真实生活事件。 
                  所有供奉均为虚拟功德，请理性看待，勿过度依赖。
                </p>
              </div>
            )}
          </>)}

        {/* ======== 记录 Tab ======== */}
        {tab === 'records' && (
          <div className="bg-white rounded-xl border">
            {!user ? (
              <div className="p-12 text-center"><p className="text-gray-500 mb-4">请先登录</p><Link href="/login" className="btn-primary px-6 py-2">去登录</Link></div>
            ) : dataLoading ? (
              <div className="p-12 text-center text-gray-400">加载中...</div>
            ) : records.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-5xl mb-3">🙏</div>
                <p className="text-gray-500">暂无供奉记录</p>
                <button onClick={() => setTab('offer')} className="btn-primary px-6 py-2 mt-4">去供奉</button>
              </div>
            ) : (
              <div className="divide-y">
                {records.map((r: any) => (
                  <div key={r.id} className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">{'🙏'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm">{r.itemId || '供奉'}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {r.type === 'monthly' ? '包月' : r.type === 'yearly' ? '包年' : '单次'}
                        {r.endDate && ` · 至 ${new Date(r.endDate).toLocaleDateString('zh-CN')}`}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-purple-700">{r.amount} 💎</div>
                      <div className="text-xs text-gray-400">{r.createdAt ? new Date(r.createdAt).toLocaleDateString('zh-CN') : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======== 排行榜 Tab ======== */}
        {tab === 'leaderboard' && (
          <div className="bg-white rounded-xl border">
            {dataLoading ? (
              <div className="p-12 text-center text-gray-400">加载中...</div>
            ) : leaderboard.length === 0 ? (
              <div className="p-12 text-center"><div className="text-5xl mb-3">🏆</div><p className="text-gray-500">暂无排行数据</p></div>
            ) : (
              <div className="divide-y">
                {leaderboard.map((item: any) => (
                  <div key={item.userId} className="flex items-center gap-3 p-4">
                    <div className="w-8 text-center font-bold text-gray-500 text-lg">{rankIcon(item.rank)}</div>
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-sm font-medium">
                      {item.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                      <div className="text-xs text-gray-500">供奉 {item.count} 次</div>
                    </div>
                    <div className="font-bold text-purple-700">{item.totalAmount} 💎</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
