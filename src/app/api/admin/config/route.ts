import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { queryAll, queryFirst, execute } from '@/lib/d1';

async function ensureDescriptionColumn() {
  try {
    const col = await queryFirst("PRAGMA table_info('SiteConfig')") as any[];
    const hasDesc = col?.some((c: any) => c.name === 'description');
    if (!hasDesc) {
      await execute('ALTER TABLE SiteConfig ADD COLUMN description TEXT');
    }
  } catch {}
}

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

    const { key, value, category, description } = await req.json();
    if (!key || value === undefined) return NextResponse.json({ error: '参数不完整' }, { status: 400 });

    await ensureDescriptionColumn();

    const existing = await queryFirst('SELECT id FROM SiteConfig WHERE key = ?', key) as any;
    if (existing) {
      await execute(
        'UPDATE SiteConfig SET value = ?, category = ?, description = ?, updatedAt = ? WHERE key = ?',
        value, category || 'general', description || '', new Date().toISOString(), key
      );
    } else {
      const id = `cfg_${Date.now()}`;
      await execute(
        'INSERT INTO SiteConfig (id, key, value, category, description, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
        id, key, value, category || 'general', description || '', new Date().toISOString()
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新配置失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { key, value, category, description } = await req.json();
    if (!key || value === undefined) return NextResponse.json({ error: '参数不完整' }, { status: 400 });

    await ensureDescriptionColumn();

    const existing = await queryFirst('SELECT id FROM SiteConfig WHERE key = ?', key) as any;
    if (existing) {
      return NextResponse.json({ error: '配置键已存在' }, { status: 409 });
    }

    const id = `cfg_${Date.now()}`;
    await execute(
      'INSERT INTO SiteConfig (id, key, value, category, description, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
      id, key, value, category || 'general', description || '', new Date().toISOString()
    );

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('创建配置失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { key } = await req.json();
    if (!key) return NextResponse.json({ error: '缺少key参数' }, { status: 400 });

    await execute('DELETE FROM SiteConfig WHERE key = ?', key);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除配置失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}