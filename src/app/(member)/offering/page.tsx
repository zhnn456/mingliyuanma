'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const defaultCategories = [
  { id: 'buddha', name: '佛像', icon: '🙏', description: '供奉诸佛，祈求平安' },
  { id: 'bodhisattva', name: '菩萨', icon: '🪷', description: '供奉菩萨，广结善缘' },
  { id: 'caishen', name: '财神', icon: '💰', description: '供奉财神，招财进宝' },
  { id: 'ancestor', name: '祖先', icon: '🏛️', description: '供奉祖先，慎终追远' },
  { id: 'deity', name: '神灵', icon: '✨', description: '供奉神灵，护佑平安' },
];

const offeringItems = [
  { name: '清香', price: 10, icon: '🕯️' },
  { name: '鲜花', price: 20, icon: '🌸' },
  { name: '水果', price: 30, icon: '🍎' },
  { name: '素食', price: 50, icon: '🥬' },
  { name: '供灯', price: 100, icon: '🏮' },
  { name: '宝鼎', price: 200, icon: '🏺' },
];

type TabType = 'offer' | 'records' | 'leaderboard';

interface OfferingRecordItem {
  id: string;
  amount: number;
  type: string;
  status: string;
  endDate: string | null;
  createdAt: string;
  item?: { name: string; image?: string | null };
}

interface LeaderboardItem {
  rank: number;
  userId: string;
  name: string;
  avatar?: string | null;
  totalAmount: number;
  count: number;
}

export default function OfferingPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>('offer');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [dedication, setDedication] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [meritCount, setMeritCount] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  // records & leaderboard
  const [records, setRecords] = useState<OfferingRecordItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [expiringRecords, setExpiringRecords] = useState<OfferingRecordItem[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (session) {
      fetchMeritCount();
      fetchExpiring();
    }
  }, [session]);

  useEffect(() => {
    if (activeTab === 'records' && session) fetchRecords();
    if (activeTab === 'leaderboard') fetchLeaderboard();
  }, [activeTab, session]);

  const fetchMeritCount = async () => {
    try {
      const res = await fetch('/api/offering?type=records');
      if (res.ok) {
        const data = await res.json();
        const recs = data.records || [];
        setMeritCount(recs.length);
        setTotalSpent(recs.reduce((s: number, r: OfferingRecordItem) => s + r.amount, 0));
      }
    } catch {}
  };

  const fetchRecords = async () => {
    setDataLoading(true);
    try {
      const res = await fetch('/api/offering?type=records');
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
      }
    } catch {} finally { setDataLoading(false); }
  };

  const fetchLeaderboard = async () => {
    setDataLoading(true);
    try {
      const res = await fetch('/api/offering?type=leaderboard');
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch {} finally { setDataLoading(false); }
  };

  const fetchExpiring = async () => {
    try {
      const res = await fetch('/api/offering?type=expiring');
      if (res.ok) {
        const data = await res.json();
        setExpiringRecords(data.records || []);
      }
    } catch {}
  };

  const handleOffering = async () => {
    if (!session) { alert('请先登录'); return; }
    if (!selectedItem) { alert('请选择供品'); return; }

    setLoading(true);
    setSuccess(false);
    try {
      // 走支付流程：创建支付订单
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'offering',
          targetId: selectedItem,
          method: 'mock',
          quantity,
          dedication,
          offerType: 'single',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.order?.orderNo) {
          // 跳转到支付页
          window.location.href = `/pay/${data.order.orderNo}`;
        }
      } else {
        const data = await res.json();
        alert(data.error || '创建订单失败');
      }
    } catch { alert('创建订单失败，请重试'); } finally { setLoading(false); }
  };

  const statusText: Record<string, string> = { active: '供奉中', expired: '已到期', cancelled: '已取消', completed: '已完成' };
  const statusColor: Record<string, string> = { active: 'bg-green-100 text-green-800', expired: 'bg-gray-100 text-gray-600', cancelled: 'bg-red-100 text-red-600', completed: 'bg-blue-100 text-blue-700' };

  const rankIcon = (r: number) => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : `${r}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment-50 via-paper to-white py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">在线供奉</h1>
          <p className="text-gray-600">虔诚供奉，积累功德，祈福平安</p>
        </div>

        {/* 到期提醒 */}
        {session && expiringRecords.length > 0 && (
          <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⏰</span>
              <span className="font-bold text-orange-800">供奉到期提醒</span>
            </div>
            {expiringRecords.map(r => (
              <div key={r.id} className="flex justify-between items-center py-1.5 text-sm">
                <span className="text-orange-700">{r.item?.name || '供奉'} - {r.type === 'monthly' ? '包月' : r.type === 'yearly' ? '包年' : '单次'}</span>
                <span className="text-orange-600 font-medium">
                  {r.endDate ? `${new Date(r.endDate).toLocaleDateString('zh-CN')} 到期` : ''}
                </span>
              </div>
            ))}
            <p className="text-xs text-orange-500 mt-2">请及时续供，保持虔诚之心</p>
          </div>
        )}

        {/* 统计 */}
        {session && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="card text-center">
              <div className="text-xs text-gray-500">累计供奉</div>
              <div className="text-xl font-bold chinese-red">{meritCount} 次</div>
            </div>
            <div className="card text-center">
              <div className="text-xs text-gray-500">累计功德</div>
              <div className="text-xl font-bold chinese-gold">¥{totalSpent}</div>
            </div>
            <div className="card text-center">
              <div className="text-xs text-gray-500">进行中</div>
              <div className="text-xl font-bold text-green-600">{expiringRecords.length} 项</div>
            </div>
          </div>
        )}

        {/* Tab 切换 */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'offer' as TabType, label: '供奉', icon: '🙏' },
            { key: 'records' as TabType, label: '我的记录', icon: '📋' },
            { key: 'leaderboard' as TabType, label: '功德榜', icon: '🏆' },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-5 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === t.key ? 'bg-red-700 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ====== 供奉 Tab ====== */}
        {activeTab === 'offer' && (
          <>
            {/* 供奉分类 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              {defaultCategories.map((category) => (
                <button key={category.id} onClick={() => setSelectedCategory(category.id)}
                  className={`card text-center hover:shadow-xl transition-all cursor-pointer ${selectedCategory === category.id ? 'ring-2 ring-red-600 shadow-lg' : ''}`}>
                  <div className="text-4xl mb-2">{category.icon}</div>
                  <h3 className="text-sm font-bold text-gray-900">{category.name}</h3>
                  <p className="text-xs text-gray-600 mt-1">{category.description}</p>
                </button>
              ))}
            </div>

            {/* 供品选择 */}
            {selectedCategory && (
              <div className="card mb-6">
                <h2 className="card-title">选择供品</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {offeringItems.map((item) => (
                    <button key={item.name} onClick={() => setSelectedItem(item.name)}
                      className={`p-4 border-2 rounded-lg text-center transition-all ${selectedItem === item.name ? 'border-red-600 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="text-3xl mb-2">{item.icon}</div>
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm chinese-gold font-bold mt-1">¥{item.price}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 供奉信息 */}
            {selectedItem && (
              <div className="card mb-6">
                <h2 className="card-title">供奉信息</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">数量</label>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold">-</button>
                      <span className="text-xl font-bold text-gray-900 w-12 text-center">{quantity}</span>
                      <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold">+</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">回向/祈愿</label>
                    <textarea value={dedication} onChange={(e) => setDedication(e.target.value)} placeholder="输入您的祈愿或回向文..." rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">供奉费用</span>
                      <span className="text-2xl font-bold chinese-red">¥{(offeringItems.find(i => i.name === selectedItem)?.price || 0) * quantity}</span>
                    </div>
                  </div>
                  <button onClick={handleOffering} disabled={loading || !session}
                    className="w-full btn-primary py-3 text-lg disabled:opacity-50">
                    {loading ? '供奉中...' : success ? '供奉成功！功德无量 🙏' : '开始供奉'}
                  </button>
                  {!session && (
                    <p className="text-center text-sm text-gray-500">请先 <Link href="/login" className="text-red-700 hover:underline">登录</Link> 后供奉</p>
                  )}
                </div>
              </div>
            )}

            {/* 供奉说明 */}
            <div className="card">
              <h2 className="card-title">供奉说明</h2>
              <div className="space-y-4 text-gray-600">
                <p>供奉是一种表达虔诚和敬意的行为，通过供奉可以积累功德、祈福平安。</p>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">供品选择</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>香烛：表达虔诚之心</li>
                    <li>鲜花：象征美好与清净</li>
                    <li>水果：代表丰收与感恩</li>
                    <li>素食：体现慈悲之心</li>
                    <li>供灯：照亮智慧之路</li>
                    <li>宝鼎：镇宅保平安</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ====== 记录 Tab ====== */}
        {activeTab === 'records' && (
          <div className="space-y-4">
            {!session ? (
              <div className="card text-center py-12">
                <p className="text-gray-500 mb-4">请先登录查看供奉记录</p>
                <Link href="/login" className="btn-primary px-6 py-2">去登录</Link>
              </div>
            ) : dataLoading ? (
              <div className="text-center py-12 text-gray-400">加载中...</div>
            ) : records.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-4xl mb-3">🙏</div>
                <p className="text-gray-500">暂无供奉记录</p>
                <button onClick={() => setActiveTab('offer')} className="btn-primary px-6 py-2 mt-4">去供奉</button>
              </div>
            ) : (
              records.map(r => (
                <div key={r.id} className="card flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    {offeringItems.find(i => i.name === r.item?.name)?.icon || '🙏'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{r.item?.name || '供奉'}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${statusColor[r.status] || ''}`}>{statusText[r.status] || r.status}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {r.type === 'monthly' ? '包月供奉' : r.type === 'yearly' ? '包年供奉' : '单次供奉'}
                      {r.endDate && ` · 至 ${new Date(r.endDate).toLocaleDateString('zh-CN')}`}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold chinese-red">¥{r.amount}</div>
                    <div className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('zh-CN')}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ====== 排行榜 Tab ====== */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            {dataLoading ? (
              <div className="text-center py-12 text-gray-400">加载中...</div>
            ) : leaderboard.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-4xl mb-3">🏆</div>
                <p className="text-gray-500">暂无排行数据</p>
              </div>
            ) : (
              <>
                {/* Top 3 */}
                {leaderboard.length >= 3 && (
                  <div className="card bg-gradient-to-br from-red-50 to-yellow-50">
                    <div className="flex justify-center items-end gap-6 py-4">
                      {[leaderboard[1], leaderboard[0], leaderboard[2]].map((item, idx) => {
                        const heights = ['h-16', 'h-24', 'h-12'];
                        const sizes = ['text-3xl', 'text-5xl', 'text-3xl'];
                        const actualRank = [2, 1, 3][idx];
                        return (
                          <div key={item.userId} className="flex flex-col items-center">
                            <div className={`${sizes[idx]} mb-1`}>{rankIcon(actualRank)}</div>
                            <div className="font-bold text-gray-900 text-sm">{item.name}</div>
                            <div className="text-xs chinese-gold font-bold">¥{item.totalAmount}</div>
                            <div className={`${heights[idx]} w-16 bg-red-600/10 rounded-t-lg mt-2 flex items-center justify-center`}>
                              <span className="text-xs text-gray-500">{item.count}次</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 完整列表 */}
                <div className="card">
                  <h3 className="font-bold text-gray-800 mb-3">功德排行榜</h3>
                  <div className="divide-y">
                    {leaderboard.map(item => (
                      <div key={item.userId} className="flex items-center gap-3 py-3">
                        <div className="w-8 text-center font-bold text-gray-500">{rankIcon(item.rank)}</div>
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-sm">
                          {item.name[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-xs text-gray-500">供奉 {item.count} 次</div>
                        </div>
                        <div className="font-bold chinese-gold">¥{item.totalAmount}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
