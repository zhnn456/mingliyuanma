'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => { setStats(d.stats); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-gray-400">加载中...</div>;
  }

  const cards = [
    { label: '总用户', value: stats?.totalUsers || 0, icon: '👥', color: 'bg-blue-500' },
    { label: '今日新增', value: stats?.todayUsers || 0, icon: '📅', color: 'bg-green-500' },
    { label: '总收入', value: `¥${(stats?.totalRevenue || 0).toFixed(2)}`, icon: '💰', color: 'bg-yellow-500' },
    { label: '总订单', value: stats?.totalOrders || 0, icon: '🧾', color: 'bg-purple-500' },
    { label: '今日订单', value: stats?.todayOrders || 0, icon: '📊', color: 'bg-red-500' },
    { label: '八字排盘', value: stats?.totalBaziRecords || 0, icon: '☰', color: 'bg-indigo-500' },
    { label: '紫微斗数', value: stats?.totalZiweiRecords || 0, icon: '★', color: 'bg-pink-500' },
    { label: '供奉记录', value: stats?.totalOfferingRecords || 0, icon: '🙏', color: 'bg-amber-500' },
  ];

  return (
    <div>
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center text-white text-lg`}>
                {card.icon}
              </div>
              <div>
                <div className="text-xs text-gray-500">{card.label}</div>
                <div className="text-xl font-bold text-gray-900">{card.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 快捷入口 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: '/admin/users', label: '用户管理', icon: '👥', desc: '查看和管理所有用户' },
          { href: '/admin/orders', label: '订单管理', icon: '🧾', desc: '处理订单和退款' },
          { href: '/admin/revenue', label: '收入统计', icon: '💰', desc: '查看收入和分析' },
          { href: '/admin/agents', label: '代理商', icon: '🤝', desc: '管理二级代理商' },
          { href: '/admin/rules', label: '排盘规则', icon: '📖', desc: '管理命理规则库' },
          { href: '/admin/config', label: '系统设置', icon: '⚙️', desc: '配置系统参数' },
        ].map(item => (
          <Link key={item.href} href={item.href} className="bg-white rounded-xl p-5 shadow-sm border hover:shadow-md transition-all hover:border-red-200">
            <div className="text-2xl mb-2">{item.icon}</div>
            <div className="font-bold text-gray-900 text-sm">{item.label}</div>
            <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
          </Link>
        ))}
      </div>

      {/* 会员等级分布 */}
      {stats?.memberStats && stats.memberStats.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border mt-6">
          <h2 className="font-bold text-gray-900 mb-4">会员等级分布</h2>
          <div className="space-y-3">
            {stats.memberStats.map((m: any) => (
              <div key={m.level} className="flex items-center gap-3">
                <span className="w-20 text-sm text-gray-600">{m.level}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                  <div className="bg-red-600 h-full rounded-full" style={{ width: `${Math.min(100, (m.count / Math.max(...stats.memberStats.map((x: any) => x.count)) * 100))}%` }} />
                </div>
                <span className="text-sm font-bold text-gray-700 w-12 text-right">{m.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
