import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { queryAll, execute } from '@/lib/d1';

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const configs = await queryAll('SELECT * FROM SiteConfig ORDER BY category, key');
    return NextResponse.json({ configs });
  } catch (error) {
    console.error('获取配置失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { key, value, category } = await req.json();
    if (!key || value === undefined) return NextResponse.json({ error: '参数不完整' }, { status: 400 });

    await execute('INSERT OR REPLACE INTO SiteConfig (key, value, category, updatedAt) VALUES (?, ?, ?, ?)',
      key, value, category || 'general', new Date().toISOString());

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新配置失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}
