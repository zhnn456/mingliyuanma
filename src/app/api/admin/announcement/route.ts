import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, execute } from '@/lib/d1';
import { requireAdmin } from '@/lib/auth-server';

const DEFAULT_ANNOUNCEMENT = {
  enabled: true,
  icon: '🎁',
  badge: '新用户福利',
  title: '注册即送 100 灵珠',
  content: '灵珠可用于八字排盘、奇门遁甲、紫微斗数等全部功能，免费体验专业命理测算。',
  link: '/register',
  linkText: '立即注册',
  dismissHours: 24,
};

/** 获取当前公告配置 */
export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const row = await queryFirst(
      "SELECT value FROM SiteConfig WHERE key = 'announcement_floating'"
    ) as any;

    const config = row?.value ? JSON.parse(row.value) : DEFAULT_ANNOUNCEMENT;
    return NextResponse.json({ announcement: config });
  } catch (error) {
    console.error('获取公告配置失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

/** 更新公告配置 */
export async function PUT(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const body = await req.json();
    const config = {
      enabled: !!body.enabled,
      icon: body.icon || '🎁',
      badge: body.badge || '公告',
      title: body.title || '',
      content: body.content || '',
      link: body.link || '',
      linkText: body.linkText || '查看详情',
      dismissHours: body.dismissHours || 24,
    };

    const value = JSON.stringify(config);
    const now = new Date().toISOString();

    const existing = await queryFirst(
      "SELECT id FROM SiteConfig WHERE key = 'announcement_floating'"
    ) as any;

    if (existing) {
      await execute(
        "UPDATE SiteConfig SET value = ?, updatedAt = ? WHERE key = 'announcement_floating'",
        value, now
      );
    } else {
      await execute(
        "INSERT INTO SiteConfig (id, key, value, category, description, updatedAt) VALUES (?, ?, ?, 'notification', '右下角公告浮层', ?)",
        `cfg_announcement_${Date.now()}`, 'announcement_floating', value, now
      );
    }

    return NextResponse.json({ success: true, announcement: config });
  } catch (error) {
    console.error('更新公告配置失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}
