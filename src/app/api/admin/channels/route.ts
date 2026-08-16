import { requireAdmin } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll, execute } from '@/lib/d1';
import { auditLog } from '@/lib/audit';

async function ensureTable() {
  await execute(`CREATE TABLE IF NOT EXISTS Channel (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT,
    description TEXT,
    clickCount INTEGER DEFAULT 0,
    registerCount INTEGER DEFAULT 0,
    orderCount INTEGER DEFAULT 0,
    commission TEXT,
    isActive INTEGER DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT
  )`);
}

function generateId() {
  return `chl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const keyword = searchParams.get('keyword') || '';
    const type = searchParams.get('type') || '';

    let sql = 'SELECT * FROM Channel WHERE 1=1';
    let countSql = 'SELECT COUNT(*) as total FROM Channel WHERE 1=1';
    const params: any[] = [];

    if (keyword) {
      sql += ' AND (name LIKE ? OR code LIKE ? OR description LIKE ?)';
      countSql += ' AND (name LIKE ? OR code LIKE ? OR description LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (type) {
      sql += ' AND type = ?';
      countSql += ' AND type = ?';
      params.push(type);
    }

    sql += ` ORDER BY createdAt DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;

    const data = await queryAll(sql, ...params);

    const countParams: any[] = [];
    if (keyword) countParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    if (type) countParams.push(type);
    const totalRow = await queryFirst(countSql, ...countParams) as any;

    return NextResponse.json({ data, total: totalRow?.total || 0, page, pageSize });
  } catch (error) {
    console.error('获取渠道列表失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();

    const body = await req.json();
    const { name, code, type, url, description, commission, isActive } = body;

    if (!name || !code || !type) {
      return NextResponse.json({ error: '名称、编码和类型为必填项' }, { status: 400 });
    }

    const VALID_TYPES = ['wechat', 'douyin', 'xiaohongshu', 'website', 'offline', 'other'];
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: '无效的渠道类型' }, { status: 400 });
    }

    const existing = await queryFirst('SELECT id FROM Channel WHERE code = ?', code);
    if (existing) return NextResponse.json({ error: '渠道编码已存在' }, { status: 400 });

    const id = generateId();
    const now = new Date().toISOString();
    await execute(
      `INSERT INTO Channel (id, name, code, type, url, description, clickCount, registerCount, orderCount, commission, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?, ?, ?)`,
      id, name, code, type, url || null, description || null,
      commission || null, isActive !== undefined ? (isActive ? 1 : 0) : 1, now, now
    );

    await auditLog({
      userId: session?.sub,
      action: 'admin_update_config',
      details: { target: 'channel', name },
      status: 'success',
    });

    const row = await queryFirst('SELECT * FROM Channel WHERE id = ?', id);
    return NextResponse.json({ data: row });
  } catch (error) {
    console.error('创建渠道失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) return NextResponse.json({ error: '缺少渠道ID' }, { status: 400 });

    const existing = await queryFirst('SELECT * FROM Channel WHERE id = ?', id);
    if (!existing) return NextResponse.json({ error: '渠道不存在' }, { status: 404 });

    const fields: string[] = [];
    const params: any[] = [];
    for (const [key, value] of Object.entries(updateData)) {
      if (key === 'isActive') {
        fields.push('isActive = ?');
        params.push(value ? 1 : 0);
      } else if (['name', 'code', 'type', 'url', 'description', 'commission', 'clickCount', 'registerCount', 'orderCount'].includes(key)) {
        fields.push(`${key} = ?`);
        params.push(value);
      }
    }

    if (fields.length === 0) return NextResponse.json({ error: '没有要更新的字段' }, { status: 400 });

    fields.push('updatedAt = ?');
    params.push(new Date().toISOString());
    params.push(id);

    await execute(`UPDATE Channel SET ${fields.join(', ')} WHERE id = ?`, ...params);
    const row = await queryFirst('SELECT * FROM Channel WHERE id = ?', id);

    await auditLog({
      userId: session?.sub,
      action: 'admin_update_config',
      details: { target: 'channel', id },
      status: 'success',
    });

    return NextResponse.json({ data: row });
  } catch (error) {
    console.error('更新渠道失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();

    const { searchParams } = new URL(req.url);
    const ids = searchParams.get('ids');

    if (!ids) return NextResponse.json({ error: '缺少ID' }, { status: 400 });

    const idList = ids.split(',').filter(Boolean);
    for (const id of idList) {
      await execute('DELETE FROM Channel WHERE id = ?', id);
    }

    await auditLog({
      userId: session?.sub,
      action: 'admin_update_config',
      details: { target: 'channel', id: ids },
      status: 'success',
    });

    return NextResponse.json({ success: true, count: idList.length });
  } catch (error) {
    console.error('删除渠道失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
