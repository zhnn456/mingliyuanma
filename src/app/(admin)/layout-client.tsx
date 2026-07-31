'use client';

import { useState, useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, getPendingUser } from '@/lib/auth-client';

const APP_VERSION = 'v4.0.0';

// === SVG Icon Components ===
const icons: Record<string, ReactNode> = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-[18px] h-[18px]"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>,
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-[18px] h-[18px]"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  orders: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-[18px] h-[18px]"><path d="M4 7V4a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v3"/><path d="M4 7h16v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7z"/><path d="M9 12h6"/></svg>,
  records: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-[18px] h-[18px]"><circle cx="12" cy="12" r="9"/><path d="m12 3v18"/><path d="m3 12h18"/></svg>,
  offering: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-[18px] h-[18px]"><path d="M12 2v6"/><path d="m12 8-4 4h8z"/><path d="M8 12v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-8"/><path d="M10 17h4"/></svg>,
  agents: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-[18px] h-[18px]"><path d="M12 2a3 3 0 0 1 3 3"/><path d="M12 2a3 3 0 0 0-3 3"/><path d="M2 12s3-2 5-2 3 2 5 2 3-2 5-2 5 2 5 2"/><path d="M2 16s3-2 5-2 3 2 5 2 3-2 5-2 5 2 5 2"/></svg>,
  marketing: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-[18px] h-[18px]"><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/></svg>,
  support: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-[18px] h-[18px]"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  content: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-[18px] h-[18px]"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6"/><path d="M9 17h4"/></svg>,
  finance: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-[18px] h-[18px]"><circle cx="12" cy="12" r="9"/><path d="M12 7v10"/><path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 2.5-5 2.5-5 5a2.5 2.5 0 0 0 5 0"/></svg>,
  system: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-[18px] h-[18px]"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  export: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-[18px] h-[18px]"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg>,
};

// === Menu Structure (12 groups, 47 items) ===
interface MenuItem {
  href: string;
  label: string;
  icon?: string;
  badge?: string;
  exact?: boolean;
  isNew?: boolean;
}

interface MenuGroup {
  group: string;
  icon: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    group: '数据总览',
    icon: 'dashboard',
    items: [
      { href: '/admin', label: '控制台', exact: true },
    ],
  },
  {
    group: '用户中心',
    icon: 'users',
    items: [
      { href: '/admin/users', label: '用户列表' },
      { href: '/admin/user-profiles', label: '用户画像', isNew: true },
      { href: '/admin/membership', label: '会员等级', isNew: true },
      { href: '/admin/tags', label: '用户标签', isNew: true },
      { href: '/admin/blacklist', label: '黑名单管理', isNew: true },
    ],
  },
  {
    group: '订单交易',
    icon: 'orders',
    items: [
      { href: '/admin/orders', label: '订单管理', badge: '12' },
      { href: '/admin/payments', label: '支付记录' },
      { href: '/admin/revenue', label: '收入统计' },
      { href: '/admin/refunds', label: '退款管理', isNew: true },
      { href: '/admin/transactions-export', label: '流水导出', isNew: true },
    ],
  },
  {
    group: '排盘内容',
    icon: 'records',
    items: [
      { href: '/admin/records', label: '八字排盘' },
      { href: '/admin/ziwei', label: '紫微斗数', isNew: true },
      { href: '/admin/qimen', label: '奇门遁甲', isNew: true },
      { href: '/admin/meihua', label: '梅花易数', isNew: true },
      { href: '/admin/rules', label: '排盘规则库' },
      { href: '/admin/fortune-tellers', label: '命理师管理', isNew: true },
    ],
  },
  {
    group: '供奉管理',
    icon: 'offering',
    items: [
      { href: '/admin/offering', label: '供奉分类' },
      { href: '/admin/offering-items', label: '供奉项目', isNew: true },
      { href: '/admin/offering-records', label: '供奉记录', isNew: true },
      { href: '/admin/supplies', label: '供品管理', isNew: true },
      { href: '/admin/offering-calendar', label: '排期日历', isNew: true },
    ],
  },
  {
    group: '代理商',
    icon: 'agents',
    items: [
      { href: '/admin/agents', label: '代理商列表' },
      { href: '/admin/agent-stats', label: '经营数据', isNew: true },
      { href: '/admin/agent-review', label: '资质审核', isNew: true },
      { href: '/admin/licenses', label: '授权码管理', isNew: true },
      { href: '/admin/commission-rules', label: '分润规则', isNew: true },
      { href: '/admin/commission-records', label: '分润记录', isNew: true },
    ],
  },
  {
    group: '营销工具',
    icon: 'marketing',
    items: [
      { href: '/admin/plans', label: '会员套餐' },
      { href: '/admin/coupons', label: '优惠券' },
      { href: '/admin/points', label: '积分管理' },
      { href: '/admin/campaigns', label: '活动管理', isNew: true },
      { href: '/admin/channels', label: '推广渠道', isNew: true },
    ],
  },
  {
    group: '客服',
    icon: 'support',
    items: [
      { href: '/admin/tickets', label: '工单管理', badge: '5' },
      { href: '/admin/chat', label: '在线会话', isNew: true },
      { href: '/admin/kb', label: '知识库', isNew: true },
      { href: '/admin/quick-replies', label: '快捷回复', isNew: true },
    ],
  },
  {
    group: '内容运营',
    icon: 'content',
    items: [
      { href: '/admin/articles', label: '文章资讯', isNew: true },
      { href: '/admin/encyclopedia', label: '命理百科', isNew: true },
      { href: '/admin/banners', label: 'Banner管理', isNew: true },
      { href: '/admin/notifications', label: '推送通知', isNew: true },
    ],
  },
  {
    group: '财务结算',
    icon: 'finance',
    items: [
      { href: '/admin/finance', label: '收入总览', isNew: true },
      { href: '/admin/finance-agents', label: '代理商分润', isNew: true },
      { href: '/admin/settlements', label: '结算审核', isNew: true },
      { href: '/admin/withdrawals', label: '提现管理', isNew: true },
      { href: '/admin/finance-reports', label: '财务报表', isNew: true },
    ],
  },
  {
    group: '系统',
    icon: 'system',
    items: [
      { href: '/admin/audit', label: '审计日志' },
      { href: '/admin/config', label: '系统设置' },
      { href: '/admin/admins', label: '管理员权限', isNew: true },
      { href: '/admin/msg-templates', label: '消息模板', isNew: true },
      { href: '/admin/versions', label: '版本管理' },
      { href: '/admin/updates', label: '更新日志' },
      { href: '/admin/update-logs', label: '系统更新日志', isNew: true },
    ],
  },
  {
    group: '数据导出',
    icon: 'export',
    items: [
      { href: '/admin/exports', label: '导出任务', isNew: true },
      { href: '/admin/export-logs', label: '导出记录', isNew: true },
    ],
  },
];

// Flatten for lookup
const allItems = menuGroups.flatMap(g => g.items);

const roleLabels: Record<string, { label: string; className: string }> = {
  admin: { label: '超级管理员', className: 'bg-mingli-100 text-mingli-700 ring-1 ring-mingli-200' },
  editor: { label: '运营管理', className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
  user: { label: '用户', className: 'bg-gray-50 text-gray-700 ring-1 ring-gray-200' },
};

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // 只有在 loading 完成后才检查权限
    if (!loading) {
      const effectiveUser = user || getPendingUser();
      if (!effectiveUser) {
        // 用户未登录，跳转到登录页
        router.replace('/login');
      } else if (effectiveUser.role !== 'admin') {
        // 用户角色不是管理员，跳转到首页
        router.replace('/');
      }
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-8 h-8 border-4 border-mingli-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  // 使用 pendingUser 作为 fallback 防止时序问题
  const effectiveUser = user || getPendingUser();
  if (!effectiveUser || effectiveUser.role !== 'admin') {
    return null;
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + '/');
  };

  // Find current page info for breadcrumb
  const currentItem = allItems.find(m => isActive(m.href, m.exact));
  const currentGroup = menuGroups.find(g => g.items.some(i => i.href === currentItem?.href));
  const currentPageTitle = currentItem?.label || '管理后台';
  const currentGroupName = currentGroup?.group || '';

  const role = roleLabels[effectiveUser.role] || roleLabels.user;
  const avatarText = (effectiveUser.name || effectiveUser.email || 'A').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* === Sidebar === */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform md:translate-x-0 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-slate-100 shrink-0">
          <Link href="/admin" className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-mingli-400 to-mingli-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              命
            </div>
            <div>
              <div className="font-semibold text-slate-900 text-[15px] leading-tight">命理网</div>
              <div className="text-[11px] text-slate-500">管理后台 {APP_VERSION}</div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          {menuGroups.map((g) => (
            <div key={g.group} className="border-b border-slate-50 last:border-b-0">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-5 pt-3 pb-1.5">
                {g.group}
              </div>
              <div className="pb-1">
                {g.items.map((item) => {
                  const active = isActive(item.href, item.exact);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`group flex items-center gap-2.5 px-5 py-1.5 text-[13px] transition-all border-l-2 ${
                        active
                          ? 'bg-mingli-50 text-mingli-600 font-medium border-mingli-400'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent'
                      }`}
                    >
                      {active ? (
                        <span className="text-mingli-400">{icons[g.icon]}</span>
                      ) : (
                        <span className="text-slate-400 group-hover:text-slate-600">{icons[g.icon]}</span>
                      )}
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">
                          {item.badge}
                        </span>
                      )}
                      {item.isNew && !item.badge && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-mingli-100 text-mingli-600 font-medium">NEW</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 shrink-0 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-2 text-[13px] text-slate-500 hover:text-slate-900 transition-colors px-2"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-[16px] h-[16px]"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            <span>返回前台</span>
          </Link>
        </div>
      </aside>

      {/* === Main Area === */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
          {/* Left: mobile menu + breadcrumb */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-slate-500 hover:text-slate-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2 text-[13px]">
              <span className="text-slate-400">{currentGroupName}</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-900 font-medium">{currentPageTitle}</span>
            </div>
          </div>

          {/* Right: search + notifications + avatar */}
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="搜索用户、订单、排盘记录..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-60 pl-9 pr-3 py-1.5 text-[13px] border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:border-mingli-400 outline-none transition-colors"
              />
            </div>

            <Link
              href="/admin/tickets"
              className="relative w-9 h-9 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="客服工单"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500 ring-2 ring-white" />
            </Link>

            <div className="h-6 w-px bg-slate-200" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-mingli-400 to-mingli-600 flex items-center justify-center text-white text-[13px] font-semibold">
                {avatarText}
              </div>
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="text-[13px] font-medium text-slate-900">{effectiveUser.name || effectiveUser.email}</span>
                <span className={`inline-flex items-center self-start text-[10px] font-medium px-1.5 py-0.5 rounded mt-0.5 ${role.className}`}>
                  {role.label}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
