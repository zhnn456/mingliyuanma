import { requireAdmin } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll, execute } from '@/lib/d1';

async function ensureTable() {
  await execute(`CREATE TABLE IF NOT EXISTS Notification (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    type TEXT NOT NULL,
    target TEXT NOT NULL,
    targetUsers TEXT,
    sentAt TEXT,
    readCount INTEGER DEFAULT 0,
    totalCount INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    createdBy TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT
  )`);
}

function generateId() {
  return `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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

    let sql = 'SELECT * FROM Notification WHERE 1=1';
    let countSql = 'SELECT COUNT(*) as total FROM Notification WHERE 1=1';
    const params: any[] = [];

    if (keyword) {
      sql += ' AND (title LIKE ? OR content LIKE ?)';
      countSql += ' AND (title LIKE ? OR content LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (type) {
      sql += ' AND type = ?';
      countSql += ' AND type = ?';
      params.push(type);
    }

    sql += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    params.push(pageSize, (page - 1) * pageSize);

    const data = await queryAll(sql, ...params);

    const countParams: any[] = [];
    if (keyword) countParams.push(`%${keyword}%`, `%${keyword}%`);
    if (type) countParams.push(type);
    const totalRow = await queryFirst(countSql, ...countParams) as any;

    return NextResponse.json({ data, total: totalRow?.total || 0, page, pageSize });
  } catch (error) {
    console.error('获取通知列表失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();

    const body = await req.json();
    const { title, content, type, target, targetUsers } = body;

    if (!title || !type || !target) {
      return NextResponse.json({ error: '标题、类型和目标为必填项' }, { status: 400 });
    }

    const VALID_TYPES = ['system', 'activity', 'order', 'custom'];
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: '无效的通知类型' }, { status: 400 });
    }

    const VALID_TARGETS = ['all', 'member', 'free', 'specific'];
    if (!VALID_TARGETS.includes(target)) {
      return NextResponse.json({ error: '无效的目标范围' }, { status: 400 });
    }

    const id = generateId();
    const now = new Date().toISOString();

    let totalCount = 0;
    if (target === 'all') {
      const row = await queryFirst('SELECT COUNT(*) as cnt FROM User') as any;
      totalCount = row?.cnt || 0;
    } else if (target === 'member') {
      const row = await queryFirst("SELECT COUNT(*) as cnt FROM User WHERE memberLevel != 'free'") as any;
      totalCount = row?.cnt || 0;
    } else if (target === 'free') {
      const row = await queryFirst("SELECT COUNT(*) as cnt FROM User WHERE memberLevel = 'free'") as any;
      totalCount = row?.cnt || 0;
    } else if (target === 'specific') {
      const users = targetUsers ? String(targetUsers).split(',').filter(Boolean) : [];
      totalCount = users.length;
    }

    await execute(
      `INSERT INTO Notification (id, title, content, type, target, targetUsers, sentAt, readCount, totalCount, status, createdBy, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 'sent', ?, ?, ?)`,
      id, title, content || null, type, target,
      targetUsers || null, now, totalCount,
      session?.id || null, now, now
    );

    const row = await queryFirst('SELECT * FROM Notification WHERE id = ?', id);
    return NextResponse.json({ data: row });
  } catch (error) {
    console.error('创建通知失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) return NextResponse.json({ error: '缺少通知ID' }, { status: 400 });

    const existing = await queryFirst('SELECT * FROM Notification WHERE id = ?', id);
    if (!existing) return NextResponse.json({ error: '通知不存在' }, { status: 404 });

    const fields: string[] = [];
    const params: any[] = [];
    for (const [key, value] of Object.entries(updateData)) {
      if (['title', 'content', 'type', 'target', 'targetUsers', 'status', 'readCount', 'totalCount'].includes(key)) {
        fields.push(`${key} = ?`);
        params.push(value);
      }
    }

    if (fields.length === 0) return NextResponse.json({ error: '没有要更新的字段' }, { status: 400 });

    fields.push('updatedAt = ?');
    params.push(new Date().toISOString());
    params.push(id);

    await execute(`UPDATE Notification SET ${fields.join(', ')} WHERE id = ?`, ...params);
    const row = await queryFirst('SELECT * FROM Notification WHERE id = ?', id);
    return NextResponse.json({ data: row });
  } catch (error) {
    console.error('更新通知失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();

    const { searchParams } = new URL(req.url);
    const ids = searchParams.get('ids');

    if (!ids) return NextResponse.json({ error: '缺少ID' }, { status: 400 });

    const idList = ids.split(',').filter(Boolean);
    for (const id of idList) {
      await execute('DELETE FROM Notification WHERE id = ?', id);
    }

    return NextResponse.json({ success: true, count: idList.length });
  } catch (error) {
    console.error('删除通知失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
