'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-client';
import Link from 'next/link';

type Supply = {
  id: string;
  name: string;
  icon: string;
  price: number;
  description: string;
  stock: number;
};

type Category = {
  value: string;
  label: string;
  icon: string;
  color: string;
  supplies: Supply[];
};

export default function OfferingPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'offer' | 'records' | 'leaderboard'>('offer');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedSupplyId, setSelectedSupplyId] = useState('');
  const [qty, setQty] = useState(1);
  const [dedication, setDedication] = useState('');
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [msg, setMsg] = useState('');
  const [records, setRecords] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [square, setSquare] = useState<any[]>([]);
  const [squareStats, setSquareStats] = useState({ totalOfferings: 0, totalUsers: 0, totalLingzhu: 0 });

  // 加载供品分类数据
  useEffect(() => {
    fetch('/api/offerings').then(r => r.json()).then(d => {
      if (d.categories && Array.isArray(d.categories)) {
        setCategories(d.categories);
        if (d.categories.length > 0) {
          setSelectedCat(d.categories[0].value);
        }
      }
    }).catch(() => {});
  }, []);

  // 加载祈福广场
  useEffect(() => {
    fetch('/api/offering/square').then(r => r.json()).then(d => {
      setSquare(d.items || []);
      setSquareStats(d.stats || { totalOfferings: 0, totalUsers: 0, totalLingzhu: 0 });
    }).catch(() => {});
  }, []);

  // 加载积分余额
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

  const currentCategory = categories.find(c => c.value === selectedCat);
  const supplies = currentCategory?.supplies || [];
  const selectedSupply = supplies.find(s => s.id === selectedSupplyId);

  const handleSubmit = async () => {
    if (!selectedSupply) { alert('请选择供品'); return; }
    const cost = selectedSupply.price * qty;
    if (balance < cost) { alert(`积分不足！需要${cost}积分，当前${balance}积分`); window.location.href = '/profile/recharge'; return; }

    setLoading(true); setMsg(''); setSuccess('');
    try {
      const res = await fetch('/api/offering/pay', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplyId: selectedSupply.id, supplyName: selectedSupply.name, quantity: qty, dedication }),
      });
      const d = await res.json();
      if (res.ok) {
        setBalance(d.balance);
        setSuccess(`✅ 祈福成功！心愿已送达 🙏`);
        setSelectedSupplyId(''); setQty(1); setDedication('');
        loadRecords();
      } else {
        setMsg(d.error || '祈福失败');
      }
    } catch { setMsg('网络错误，请重试'); } finally { setLoading(false); }
  };

  const handleSubscribe = async (offerType: 'monthly' | 'yearly') => {
    if (!user) { alert('请先登录'); return; }
    const cost = offerType === 'monthly' ? 3000 : 30000;
    if (balance < cost) { alert(`积分不足！需要${cost}积分，当前${balance}积分`); window.location.href = '/profile/recharge'; return; }

    setLoading(true); setMsg(''); setSuccess('');
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'offering', method: 'paypal', offerType }),
      });
      const d = await res.json();
      if (res.ok && d.success) {
        setBalance(d.balance);
        setSuccess(`✅ ${offerType === 'monthly' ? '月供' : '年供'}祈福成功！心愿已送达 🙏`);
        loadRecords();
      } else {
        setMsg(d.error || '祈福失败');
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
            <span>在线祈福</span>
          </h1>
          <p className="page-header-subtitle">民俗祈福，寄托美好心愿</p>
        </div>
        </div>

        {/* 积分余额 */}
        {user && (
          <div className="flex items-center justify-end gap-3 mb-4">
            <span className="text-sm text-gray-500">💎 积分余额：<strong className="text-purple-700">{balance}</strong></span>
            <Link href="/profile/recharge" className="text-xs px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700">充值</Link>
          </div>
        )}

        {/* 反馈消息 */}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-center text-sm">{success}</div>}
        {msg && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{msg}</div>}

        {/* ======== 祈福广场 ======== */}
        <div className="bg-gradient-to-br from-amber-50 via-stone-50 to-white rounded-xl p-6 mb-6 border border-stone-200 shadow-sm relative overflow-hidden">
          {/* 装饰 - 淡雅水墨 */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-100/40 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-stone-200/50 rounded-full blur-2xl" />

          {/* 标题 */}
          <div className="flex items-center gap-2 mb-4 relative z-10">
            <span className="text-lg">🏮</span>
            <span className="font-bold text-lg text-stone-800" style={{ fontFamily: 'serif' }}>祈福广场</span>
            <span className="text-xs text-stone-400 ml-auto">心之所愿 · 皆有所成</span>
          </div>

          {/* 数字统计 - 素雅风格 */}
          <div className="grid grid-cols-3 gap-3 mb-4 relative z-10">
            <div className="bg-white/60 rounded-lg p-3 text-center border border-stone-100">
              <div className="text-2xl md:text-3xl font-bold text-amber-700">{squareStats.totalOfferings || 0}</div>
              <div className="text-xs text-stone-500 mt-0.5">累计祈福(次)</div>
            </div>
            <div className="bg-white/60 rounded-lg p-3 text-center border border-stone-100">
              <div className="text-2xl md:text-3xl font-bold text-amber-700">{squareStats.totalUsers || 0}</div>
              <div className="text-xs text-stone-500 mt-0.5">参与人数</div>
            </div>
            <div className="bg-white/60 rounded-lg p-3 text-center border border-stone-100">
              <div className="text-2xl md:text-3xl font-bold text-amber-700">{squareStats.totalLingzhu || 0}</div>
              <div className="text-xs text-stone-500 mt-0.5">累计积分(💎)</div>
            </div>
          </div>

          {/* 滚动祈福动态 */}
          <div className="relative overflow-hidden rounded-lg bg-white/40 border border-stone-100" style={{ height: '140px' }}>
            <div className="absolute inset-0 flex flex-col gap-2 p-3 animate-scroll-up">
              {[...square, ...square, ...square].map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-stone-600 bg-white/70 rounded-lg px-3 py-1.5 border border-stone-50">
                  <span className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700 flex-shrink-0">
                    {(item.userName || '?')[0]}
                  </span>
                  <span className="font-medium text-stone-700 truncate max-w-[70px]">{item.userName}</span>
                  <span className="text-stone-400">祈福了</span>
                  <span className="font-bold text-amber-700">{item.itemName}</span>
                  <span className="text-amber-600 text-xs">{item.amount}💎</span>
                  {item.dedication && <span className="text-stone-400 truncate max-w-[100px] text-xs">「{item.dedication}」</span>}
                  <span className="ml-auto text-stone-300 text-xs flex-shrink-0">{item.timeAgo}</span>
                </div>
              ))}
            </div>
            {/* 渐变遮罩 - 素雅 */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/80 to-transparent pointer-events-none" />
          </div>

          {/* 引导文案 */}
          <div className="text-center mt-3 text-sm text-stone-500 relative z-10">
            已有 <strong className="text-amber-700">{squareStats.totalUsers || 0}</strong> 位用户参与祈福 · 心意所至，皆是美好
          </div>
          <p className="text-center text-xs text-stone-400 mt-2 relative z-10">以上数值仅为测试使用，不代表真实情况</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'offer' as const, label: '祈福', icon: '🙏' },
            { key: 'records' as const, label: '我的记录', icon: '📋' },
            { key: 'leaderboard' as const, label: '祈福榜', icon: '🏆' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-5 py-2 rounded-lg font-medium text-sm transition-colors ${tab === t.key ? 'bg-amber-700 text-white' : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ======== 祈福 Tab ======== */}
        {tab === 'offer' && (
          <>
            {/* 祈福分类 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              {categories.map(cat => (
                <button key={cat.value} onClick={() => { setSelectedCat(cat.value); setSelectedSupplyId(''); }}
                  className={`card text-center p-4 hover:shadow-md transition-all cursor-pointer border-2 ${selectedCat === cat.value ? 'border-teal-500 ring-1 ring-teal-400 shadow-md bg-teal-50' : 'border-stone-200 bg-white hover:border-stone-300'}`}>
                  <div className="text-4xl mb-2">{cat.icon}</div>
                  <h3 className="text-sm font-bold text-stone-800">{cat.label}</h3>
                  <p className="text-xs text-stone-500 mt-1">{cat.supplies.length} 种供品</p>
                </button>
              ))}
            </div>

            {/* 供品选择 — 选择分类后显示 */}
            {selectedCat && supplies.length > 0 && (<>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                {supplies.map(item => (
                  <button key={item.id} onClick={() => setSelectedSupplyId(item.id)}
                    className={`p-4 border-2 rounded-xl text-center transition-all ${selectedSupplyId === item.id ? 'border-teal-500 bg-teal-50 shadow-md ring-1 ring-teal-400' : 'border-stone-200 hover:border-stone-300 bg-white'}`}>
                    <div className="text-3xl mb-2">{item.icon}</div>
                    <div className="font-medium text-stone-800 text-sm">{item.name}</div>
                    <div className="text-sm text-amber-700 font-bold mt-1">{item.price} 💎</div>
                    {item.description && <div className="text-xs text-stone-400 mt-1 line-clamp-2">{item.description}</div>}
                  </button>
                ))}
              </div>

              {/* 祈福表单 */}
              {selectedSupply && (
                <div className="bg-white rounded-xl border border-stone-200 p-6 mb-6 shadow-sm">
                  <h2 className="font-bold text-stone-800 mb-4">祈福信息</h2>
                  <div className="space-y-4">
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-100 flex items-center gap-3">
                      <span className="text-3xl">{selectedSupply.icon}</span>
                      <div>
                        <div className="font-bold text-stone-800">{selectedSupply.name}</div>
                        <div className="text-xs text-stone-500">{selectedSupply.description}</div>
                      </div>
                      <div className="ml-auto text-lg font-bold text-amber-700">{selectedSupply.price} 💎</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">数量</label>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold">-</button>
                        <span className="text-xl font-bold text-stone-800 w-12 text-center">{qty}</span>
                        <button onClick={() => setQty(qty + 1)} className="w-10 h-10 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold">+</button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">回向/祈愿</label>
                      <textarea value={dedication} onChange={e => setDedication(e.target.value)} placeholder="输入您的祈愿或回向文..." rows={3}
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm text-stone-700" />
                    </div>
                    <div className="bg-stone-50 rounded-lg p-4 border border-stone-100">
                      <div className="flex justify-between items-center">
                        <span className="text-stone-600">祈福费用</span>
                        <span className="text-xl font-bold text-amber-700">{selectedSupply.price * qty} 💎</span>
                      </div>
                      <div className="flex justify-between items-center text-sm mt-1">
                        <span className="text-stone-500">当前积分</span>
                        <span className="font-medium text-stone-700">{balance} 💎</span>
                      </div>
                    </div>
                    <button onClick={handleSubmit} disabled={loading || !user}
                      className="w-full bg-amber-700 text-white py-3 rounded-xl text-lg font-medium disabled:opacity-50 hover:bg-amber-800 transition-colors">
                      {loading ? '祈福中...' : '开始祈福'}
                    </button>
                    {!user && <p className="text-center text-sm text-stone-500">请先 <Link href="/login" className="text-amber-700 hover:underline">登录</Link> 后祈福</p>}
                  </div>
                </div>
              )}
            </>)}

            {/* 加载中提示 */}
            {categories.length === 0 && (
              <div className="text-center py-12 text-stone-400 text-sm">加载供品数据中...</div>
            )}

            {/* 祈福说明 */}
            {selectedCat && supplies.length > 0 && (
              <div className="bg-gradient-to-r from-amber-50 via-stone-50 to-amber-50 rounded-xl p-6 border border-stone-200">
                <h3 className="font-bold text-stone-800 text-sm mb-2">🙏 关于祈福</h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  祈福是一种表达心意与祝愿的方式，寄托对美好生活的向往。
                  心意所在，每一份祝愿都是美好的期许。
                </p>
                <p className="text-xs text-stone-400 mt-3">
                  ⚠️ 免责声明：祈福行为仅为传统文化表达，不构成任何现实承诺。
                  所有祈福均为虚拟仪式，请理性看待，仅供文化体验。以上数值仅为测试使用，不代表真实情况。
                </p>
              </div>
            )}

            {/* 长期祈福（月祈福/年祈福）- 积分支付 */}
            <div className="bg-gradient-to-r from-purple-50 via-amber-50 to-purple-50 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">📿</span>
                <span className="font-bold text-lg text-stone-800" style={{ fontFamily: 'serif' }}>长期祈福</span>
                <span className="text-xs text-stone-400 ml-auto">积分订阅 · 心愿常在</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-stone-200 text-center">
                  <div className="text-sm text-stone-500 mb-1">月供</div>
                  <div className="text-2xl font-bold text-purple-700 mb-1">3000<span className="text-sm font-normal text-stone-500"> 积分/月</span></div>
                  <div className="text-xs text-stone-400 mb-3">每月祈福，祝福不断</div>
                  <button onClick={() => handleSubscribe('monthly')} disabled={loading || !user}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-purple-700 transition-colors">
                    {loading ? '祈福中...' : '订阅月祈福'}
                  </button>
                </div>
                <div className="bg-white rounded-lg p-4 border border-stone-200 text-center">
                  <div className="text-sm text-stone-500 mb-1">年供</div>
                  <div className="text-2xl font-bold text-purple-700 mb-1">30000<span className="text-sm font-normal text-stone-500"> 积分/年</span></div>
                  <div className="text-xs text-stone-400 mb-3">全年祈福，祝福常在</div>
                  <button onClick={() => handleSubscribe('yearly')} disabled={loading || !user}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-purple-700 transition-colors">
                    {loading ? '祈福中...' : '订阅年祈福'}
                  </button>
                </div>
              </div>
              {!user && <p className="text-center text-sm text-stone-500 mt-3">请先 <Link href="/login" className="text-purple-700 hover:underline">登录</Link> 后订阅</p>}
            </div>
          </>)}

        {/* ======== 记录 Tab ======== */}
        {tab === 'records' && (
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm">
            {!user ? (
              <div className="p-12 text-center"><p className="text-stone-500 mb-4">请先登录</p><Link href="/login" className="btn-primary px-6 py-2">去登录</Link></div>
            ) : dataLoading ? (
              <div className="p-12 text-center text-stone-400">加载中...</div>
            ) : records.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-5xl mb-3">🙏</div>
                <p className="text-stone-500">暂无祈福记录</p>
                <button onClick={() => setTab('offer')} className="btn-primary px-6 py-2 mt-4">去祈福</button>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {records.map((r: any) => (
                  <div key={r.id} className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">{'🙏'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-stone-800 text-sm">{r.itemId || '祈福'}</div>
                      <div className="text-xs text-stone-500 mt-0.5">
                        {r.type === 'monthly' ? '包月' : r.type === 'yearly' ? '包年' : '单次'}
                        {r.endDate && ` · 至 ${new Date(r.endDate).toLocaleDateString('zh-CN')}`}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-amber-700">{r.amount} 💎</div>
                      <div className="text-xs text-stone-400">{r.createdAt ? new Date(r.createdAt).toLocaleDateString('zh-CN') : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======== 排行榜 Tab ======== */}
        {tab === 'leaderboard' && (
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm">
            {dataLoading ? (
              <div className="p-12 text-center text-stone-400">加载中...</div>
            ) : leaderboard.length === 0 ? (
              <div className="p-12 text-center"><div className="text-5xl mb-3">🏆</div><p className="text-stone-500">暂无排行数据</p></div>
            ) : (
              <div className="divide-y divide-stone-100">
                {leaderboard.map((item: any) => (
                  <div key={item.userId} className="flex items-center gap-3 p-4">
                    <div className="w-8 text-center font-bold text-stone-500 text-lg">{rankIcon(item.rank)}</div>
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-sm font-medium text-amber-700">
                      {item.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-stone-800 text-sm">{item.name}</div>
                      <div className="text-xs text-stone-500">祈福 {item.count} 次</div>
                    </div>
                    <div className="font-bold text-amber-700">{item.totalAmount} 💎</div>
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