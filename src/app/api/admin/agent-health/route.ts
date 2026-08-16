import { NextRequest, NextResponse } from 'next/server';
import { queryAll } from '@/lib/d1';
import { requirePrimaryAdmin } from '@/lib/auth-server';

/**
 * 独立站健康看板 API（主站专用）
 * 返回源码部署代理商（独立站）的在线状态、版本、最后同步、授权到期等信息
 * GET /api/admin/agent-health
 */

const ONLINE_WINDOW_MS = 10 * 60 * 1000; // 心跳每 5 分钟一次，10 分钟内同步视为在线
const EXPIRING_SOON_DAYS = 30;

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requirePrimaryAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const agents = await queryAll(
      `SELECT a.id, a.companyName, a.brandName, a.contactName, a.domain, a.customDomain, a.level, a.siteConfig,
              a.systemStatus, a.lastSyncAt, a.lastVersion, a.licenseExpiry, a.isActive,
              u.email as userEmail, u.name as userName
       FROM Agent a LEFT JOIN User u ON a.userId = u.id ORDER BY a.createdAt DESC`
    ) as any[];

    const now = Date.now();
    const items = agents
      .map((a) => {
        // 判断是否源码部署（独立站）
        let deployMode = '';
        try {
          const sc = typeof a.siteConfig === 'string' ? JSON.parse(a.siteConfig) : (a.siteConfig || {});
          deployMode = sc.deployMode || sc.level || '';
        } catch { /* 忽略 */ }
        const isSource = a.level === 'source' || deployMode === 'source';
        if (!isSource) return null;

        const lastSync = a.lastSyncAt ? new Date(a.lastSyncAt).getTime() : 0;
        const online = !!lastSync && (now - lastSync) < ONLINE_WINDOW_MS;
        const expiry = a.licenseExpiry ? new Date(a.licenseExpiry).getTime() : 0;
        const daysLeft = expiry ? Math.ceil((expiry - now) / (24 * 60 * 60 * 1000)) : null;

        return {
          id: a.id,
          companyName: a.companyName || a.brandName || a.contactName || a.id,
          domain: a.customDomain || a.domain || null,
          userEmail: a.userEmail || null,
          userName: a.userName || null,
          online,
          version: a.lastVersion || null,
          lastSyncAt: a.lastSyncAt || null,
          licenseExpiry: a.licenseExpiry || null,
          daysLeft,
          expiringSoon: daysLeft !== null && daysLeft <= EXPIRING_SOON_DAYS,
          expired: daysLeft !== null && daysLeft <= 0,
          isActive: !!a.isActive,
          systemStatus: a.systemStatus || 'offline',
        };
      })
      .filter(Boolean);

    const online = items.filter(i => i.online).length;
    const expired = items.filter(i => i.expired).length;
    const expiringSoon = items.filter(i => i.expiringSoon && !i.expired).length;

    return NextResponse.json({
      total: items.length,
      online,
      offline: items.length - online,
      expired,
      expiringSoon,
      agents: items,
    });
  } catch (error) {
    console.error('获取独立站健康状态失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
