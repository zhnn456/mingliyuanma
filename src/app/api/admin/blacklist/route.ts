/**
 * 用户黑名单管理API
 * 功能：封禁/解禁用户、设置封禁原因和有效期、支持永久封禁
 * 用途：违规用户管控、风控拦截、账号安全管理
 */
import { requireAdmin } from '@/lib/auth-server';
import { auditLog } from '@/lib/audit';
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll, execute } from '@/lib/d1';

function parseBlacklistRow(row: any) {
  if (!row) return null;
  let data: any = {};
  try { data = JSON.parse(row.value || '{}'); } catch { data = {}; }
  return {
    id: row.id,
    userId: data.userId || row.key.replace(/^bl_/, ''),
    reason: data.reason || '',
    operator: data.operator || '',
    createdAt: data.createdAt || row.updatedAt,
    expiryAt: data.expiryAt || null,
    permanent: !data.expiryAt,
    userEmail: data.userEmail || '',
    userName: data.userName || '',
  };
}

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get('userId');

    if (userIdParam) {
      const row = await queryFirst(
        'SELECT * FROM SiteConfig WHERE category = ? AND "key" = ?',
        'blacklist', `bl_${userIdParam}`
      );
      if (!row) return NextResponse.json({ banned: false });
      const parsed = parseBlacklistRow(row);
      if (parsed?.expiryAt && new Date(parsed.expiryAt) < new Date()) {
        return NextResponse.json({ banned: false, expired: true });
      }
      return NextResponse.json({ banned: true, item: parsed });
    }

    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const keyword = searchParams.get('keyword') || '';
    const filterType = searchParams.get('type') || '';

    const rows = await queryAll(
      "SELECT * FROM SiteConfig WHERE category = 'blacklist' ORDER BY updatedAt DESC"
    );

    let items = rows.map(parseBlacklistRow).filter(Boolean) as any[];

    if (keyword) {
      const kw = keyword.toLowerCase();
      items = items.filter(it =>
        it.userId.toLowerCase().includes(kw) ||
        (it.userEmail && it.userEmail.toLowerCase().includes(kw)) ||
        (it.userName && it.userName.toLowerCase().includes(kw)) ||
        (it.reason && it.reason.toLowerCase().includes(kw))
      );
    }

    if (filterType === 'permanent') items = items.filter(it => it.permanent);
    else if (filterType === 'temporary') items = items.filter(it => !it.permanent);

    const total = items.length;
    const start = (page - 1) * pageSize;
    const paged = items.slice(start, start + pageSize);

    return NextResponse.json({ items: paged, total, page, pageSize });
  } catch (error) {
    console.error('获取黑名单失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { userId, reason, expiryAt } = await req.json();
    if (!userId) return NextResponse.json({ error: '缺少 userId' }, { status: 400 });

    const now = new Date().toISOString();
    const operator = session?.email || session?.name || session?.id || 'admin';

    let userEmail = '';
    let userName = '';
    try {
      const u = await queryFirst('SELECT id, email, name FROM User WHERE id = ? OR email = ?', userId, userId);
      if (u) {
        userEmail = u.email || '';
        userName = u.name || '';
      }
    } catch {}

    const data = {
      userId,
      reason: reason || '',
      operator,
      createdAt: now,
      expiryAt: expiryAt || null,
      userEmail,
      userName,
    };

    const row = await queryFirst(
      'SELECT id FROM SiteConfig WHERE category = ? AND "key" = ?',
      'blacklist', `bl_${userId}`
    );

    if (row) {
      await execute(
        'UPDATE SiteConfig SET value = ?, updatedAt = ? WHERE id = ?',
        JSON.stringify(data), now, row.id
      );
    } else {
      const id = `bl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await execute(
        'INSERT INTO SiteConfig (id, key, value, category, updatedAt) VALUES (?, ?, ?, ?, ?)',
        id, `bl_${userId}`, JSON.stringify(data), 'blacklist', now
      );
    }

    await auditLog({
      userId: session?.sub,
      action: 'admin_update_config',
      details: { target: 'blacklist', email: userEmail || userId },
      status: 'success',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('添加黑名单失败:', error);
    return NextResponse.json({ error: '添加失败' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!id && !userId) return NextResponse.json({ error: '缺少 id 或 userId' }, { status: 400 });

    if (id) {
      await execute('DELETE FROM SiteConfig WHERE id = ?', id);
    } else {
      await execute('DELETE FROM SiteConfig WHERE category = ? AND "key" = ?', 'blacklist', `bl_${userId}`);
    }

    await auditLog({
      userId: session?.sub,
      action: 'admin_update_config',
      details: { target: 'blacklist', id: id || userId },
      status: 'success',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('移除黑名单失败:', error);
    return NextResponse.json({ error: '移除失败' }, { status: 500 });
  }
}
