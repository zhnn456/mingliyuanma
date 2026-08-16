'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, getPendingUser } from '@/lib/auth-client';
import UpdateNotification from '@/components/UpdateNotification';

interface MenuItem {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
  mode?: 'saas' | 'source' | 'both';
}

const allMenuItems: MenuItem[] = [
  { href: '/agent', label: '数据概览', icon: '📊', exact: true, mode: 'both' },
  { href: '/agent/dashboard', label: '收益看板', icon: '💰', mode: 'both' },
  { href: '/agent/agent-orders', label: '我的订单', icon: '🧾', mode: 'both' },
  { href: '/agent/commissions', label: '分润明细', icon: '📈', mode: 'saas' },
  { href: '/agent/agent-settlements', label: '结算中心', icon: '🏦', mode: 'saas' },
  { href: '/agent/customers', label: '客户管理', icon: '👥', mode: 'both' },
  { href: '/agent/sub-agents', label: '分站管理', icon: '🏢', mode: 'source' },
  { href: '/agent/records', label: '排盘记录', icon: '📜', mode: 'both' },
  { href: '/agent/invite', label: '邀请管理', icon: '🔗', mode: 'saas' },
  { href: '/agent/billing', label: '套餐管理', icon: '📦', mode: 'saas' },
  { href: '/agent/domain', label: '域名设置', icon: '🌐', mode: 'saas' },
  // 源码部署代理专属菜单
  { href: '/agent/license', label: '授权管理', icon: '🔑', mode: 'source' },
  { href: '/agent/renew', label: '续费管理', icon: '💳', mode: 'source' },
  { href: '/agent/tickets', label: '技术工单', icon: '🎫', mode: 'source' },
  { href: '/agent/settings', label: '代理设置', icon: '⚙️', mode: 'both' },
  { href: '/agent/updates', label: '系统更新', icon: '🔄', mode: 'both' },
];

// 源码部署代理不能访问的页面（SaaS 专属）
const saasOnlyPaths = ['/agent/commissions', '/agent/agent-settlements', '/agent/invite', '/agent/billing', '/agent/domain'];
// SaaS 代理不能访问的页面（源码部署专属）
const sourceOnlyPaths = ['/agent/license', '/agent/renew', '/agent/tickets'];

export default function AgentLayoutClient({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasNewVersion, setHasNewVersion] = useState(false);
  const [agentLevel, setAgentLevel] = useState<'saas' | 'source' | null>(null);

  // 获取代理商等级
  useEffect(() => {
    const fetchAgentLevel = async () => {
      try {
        const res = await fetch('/api/agent/settings');
        if (res.ok) {
          const data = await res.json();
          setAgentLevel(data.agent?.level === 'source' ? 'source' : 'saas');
        }
      } catch {}
    };
    if (user?.role === 'agent') {
      fetchAgentLevel();
    }
  }, [user]);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const res = await fetch('/api/agent/updates');
        if (!res.ok) return;
        const data = await res.json();
        if (data.latestVersion && data.currentVersion) {
          setHasNewVersion(data.latestVersion !== data.currentVersion);
        }
      } catch {}
    };
    checkVersion();
  }, []);

  // 权限守卫：根据代理类型重定向
  useEffect(() => {
    if (!loading && agentLevel) {
      // SaaS 代理不能访问源码部署专属页面
      if (agentLevel === 'saas' && sourceOnlyPaths.some(p => pathname.startsWith(p))) {
        router.replace('/agent');
      }
      // 源码部署代理不能访问 SaaS 专属页面
      if (agentLevel === 'source' && saasOnlyPaths.some(p => pathname.startsWith(p))) {
        router.replace('/agent');
      }
    }
  }, [loading, agentLevel, pathname, router]);

  useEffect(() => {
    if (!loading) {
      const effectiveUser = user || getPendingUser();
      if (!effectiveUser) {
        router.replace('/login');
      } else if (effectiveUser.role === 'admin') {
        router.replace('/admin');
      } else if (effectiveUser.role !== 'agent') {
        router.replace('/');
      }
    }
  }, [loading, user, router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full" /></div>;

  const effectiveUser = user || getPendingUser();
  if (!effectiveUser || effectiveUser.role !== 'agent') return null;

  // 根据代理类型过滤菜单
  const menuItems = allMenuItems.filter(item => {
    if (item.mode === 'both') return true;
    if (!agentLevel) return true; // 加载中时显示全部
    if (item.mode === 'saas') return agentLevel === 'saas';
    if (item.mode === 'source') return agentLevel === 'source';
    return true;
  });

  const currentMenu = menuItems.find(m => m.exact ? pathname === m.href : pathname.startsWith(m.href));

  // 源码部署代理商不开放主站 /agent（独立站点自带 admin 后台），显示引导页
  if (agentLevel === 'source') {
    return <SourceAgentNotice />;
  }

  // 源码部署代理商已在上方拦截返回，此处仅剩 SaaS 模式
  const levelLabel = agentLevel === 'saas' ? 'SaaS代理' : '';
  const levelColor = agentLevel === 'saas' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="p-5 border-b border-gray-800">
          <Link href="/agent" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-700 flex items-center justify-center text-white font-bold">代</div>
            <div><div className="font-bold text-white">代理商后台</div><div className="text-xs text-gray-400">知微阁</div></div>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map(item => (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                (item.exact ? pathname === item.href : pathname.startsWith(item.href))
                  ? 'bg-blue-700/20 text-blue-300 font-medium' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}>
              <span className="relative">
                {item.icon}
                {item.href === '/agent/updates' && hasNewVersion && (
                  <span className="absolute -top-1 -right-2 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <Link href="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300"><span>←</span><span>返回前台</span></Link>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-h-screen">
        <UpdateNotification />
        <header className="bg-white border-b px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h1 className="text-lg font-bold text-gray-900">{currentMenu?.label || '代理商后台'}</h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Link href="/agent/updates" className="relative p-2 hover:bg-gray-100 rounded-full transition-colors" title="系统更新">
              <span className="text-lg">🔔</span>
              {hasNewVersion && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </Link>
            <span>{effectiveUser.email}</span>
            {levelLabel && <span className={`px-2 py-0.5 rounded text-xs font-medium ${levelColor}`}>{levelLabel}</span>}
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

/** 源码部署代理商引导页：主站 /agent 不提供服务，引导去自己的站点后台 */
function SourceAgentNotice() {
  const router = useRouter();
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.replace('/login');
  };
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border max-w-md w-full p-8 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-purple-100 flex items-center justify-center text-2xl mb-4">🏪</div>
        <h1 className="text-lg font-bold text-gray-900 mb-2">您已独立部署站点</h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          您的站点已独立部署，日常运营请直接登录
          <br />
          <span className="font-mono text-purple-700">您的域名/admin</span>
          <br />
          管理用户、订单与内容。主站代理商后台仅面向 SaaS 代理。
        </p>
        <button
          onClick={handleLogout}
          className="px-6 py-2.5 bg-purple-700 text-white rounded-lg text-sm font-medium hover:bg-purple-800 transition-colors"
        >
          退出登录
        </button>
      </div>
    </div>
  );
}
