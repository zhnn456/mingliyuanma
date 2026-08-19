/**
 * 营销活动管理API
 * 功能：活动列表查询、创建/更新/删除营销活动
 * 用途：运营配置限时活动、促销活动等营销场景
 */
import { requireAdmin } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll, execute } from '@/lib/d1';
import { auditLog } from '@/lib/audit';

async function ensureTable() {
  await execute(`CREATE TABLE IF NOT EXISTS Campaign (
    id VARCHAR(255) PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    rules TEXT,
    discount TEXT,
    startAt TEXT,
    endAt TEXT,
    isActive INTEGER DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT
  )`);
}

function generateId() {
  return `camp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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
    const status = searchParams.get('status') || '';

    let sql = 'SELECT * FROM Campaign WHERE 1=1';
    let countSql = 'SELECT COUNT(*) as total FROM Campaign WHERE 1=1';
    const params: any[] = [];

    if (keyword) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      countSql += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (type) {
      sql += ' AND type = ?';
      countSql += ' AND type = ?';
      params.push(type);
    }

    const now = new Date().toISOString();
    if (status === 'ongoing') {
      sql += ' AND isActive = 1 AND startAt <= ? AND endAt >= ?';
      countSql += ' AND isActive = 1 AND startAt <= ? AND endAt >= ?';
      params.push(now, now);
    } else if (status === 'ended') {
      sql += ' AND endAt < ?';
      countSql += ' AND endAt < ?';
      params.push(now);
    } else if (status === 'upcoming') {
      sql += ' AND startAt > ?';
      countSql += ' AND startAt > ?';
      params.push(now);
    }

    sql += ` ORDER BY createdAt DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;

    const data = await queryAll(sql, ...params);

    const countParams: any[] = [];
    if (keyword) countParams.push(`%${keyword}%`, `%${keyword}%`);
    if (type) countParams.push(type);
    if (status === 'ongoing') countParams.push(now, now);
    else if (status === 'ended') countParams.push(now);
    else if (status === 'upcoming') countParams.push(now);
    const totalRow = await queryFirst(countSql, ...countParams) as any;

    return NextResponse.json({ data, total: totalRow?.total || 0, page, pageSize });
  } catch (error) {
    console.error('获取活动列表失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();

    const body = await req.json();
    const { name, type, description, rules, discount, startAt, endAt, isActive } = body;

    if (!name || !type) {
      return NextResponse.json({ error: '活动名称和类型为必填项' }, { status: 400 });
    }

    const VALID_TYPES = ['discount', 'coupon', 'points', 'free_service'];
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: '无效的活动类型' }, { status: 400 });
    }

    const id = generateId();
    const now = new Date().toISOString();
    await execute(
      `INSERT INTO Campaign (id, name, type, description, rules, discount, startAt, endAt, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id, name, type, description || null, rules || null, discount || null,
      startAt || null, endAt || null, isActive !== undefined ? (isActive ? 1 : 0) : 1, now, now
    );

    await auditLog({
      userId: session?.sub,
      action: 'admin_update_config',
      details: { target: 'campaign', name },
      status: 'success',
    });

    const row = await queryFirst('SELECT * FROM Campaign WHERE id = ?', id);
    return NextResponse.json({ data: row });
  } catch (error) {
    console.error('创建活动失败:', error);
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

    if (!id) return NextResponse.json({ error: '缺少活动ID' }, { status: 400 });

    const existing = await queryFirst('SELECT * FROM Campaign WHERE id = ?', id);
    if (!existing) return NextResponse.json({ error: '活动不存在' }, { status: 404 });

    const fields: string[] = [];
    const params: any[] = [];
    for (const [key, value] of Object.entries(updateData)) {
      if (key === 'isActive') {
        fields.push('isActive = ?');
        params.push(value ? 1 : 0);
      } else if (['name', 'type', 'description', 'rules', 'discount', 'startAt', 'endAt'].includes(key)) {
        fields.push(`${key} = ?`);
        params.push(value);
      }
    }

    if (fields.length === 0) return NextResponse.json({ error: '没有要更新的字段' }, { status: 400 });

    fields.push('updatedAt = ?');
    params.push(new Date().toISOString());
    params.push(id);

    await execute(`UPDATE Campaign SET ${fields.join(', ')} WHERE id = ?`, ...params);
    const row = await queryFirst('SELECT * FROM Campaign WHERE id = ?', id);

    await auditLog({
      userId: session?.sub,
      action: 'admin_update_config',
      details: { target: 'campaign', id },
      status: 'success',
    });

    return NextResponse.json({ data: row });
  } catch (error) {
    console.error('更新活动失败:', error);
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
      await execute('DELETE FROM Campaign WHERE id = ?', id);
    }

    await auditLog({
      userId: session?.sub,
      action: 'admin_update_config',
      details: { target: 'campaign', id: ids },
      status: 'success',
    });

    return NextResponse.json({ success: true, count: idList.length });
  } catch (error) {
    console.error('删除活动失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
