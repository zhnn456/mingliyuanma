import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { queryFirst, queryAll, execute } from '@/lib/d1';

async function ensureTable() {
  await execute(`CREATE TABLE IF NOT EXISTS QuickReply (
    id TEXT PRIMARY KEY,
    title TEXT,
    content TEXT,
    category TEXT,
    shortcut TEXT,
    sortOrder INTEGER DEFAULT 0,
    isActive INTEGER DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT
  )`);
  await execute('CREATE INDEX IF NOT EXISTS idx_qr_category ON QuickReply(category)');
  await execute('CREATE INDEX IF NOT EXISTS idx_qr_active ON QuickReply(isActive)');
}

function genId() {
  return `qr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();
    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get('keyword') || '';
    const category = searchParams.get('category') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const offset = (page - 1) * pageSize;

    let sql = 'SELECT * FROM QuickReply WHERE 1=1';
    const params: any[] = [];
    if (category) { sql += ' AND category = ?'; params.push(category); }
    if (keyword) {
      sql += ' AND (title LIKE ? OR content LIKE ? OR shortcut LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    sql += ` ORDER BY sortOrder ASC, updatedAt DESC LIMIT ${pageSize} OFFSET ${offset}`;
    const rows = await queryAll(sql, ...params);

    let countSql = 'SELECT COUNT(*) as total FROM QuickReply WHERE 1=1';
    const countParams: any[] = [];
    if (category) { countSql += ' AND category = ?'; countParams.push(category); }
    if (keyword) {
      countSql += ' AND (title LIKE ? OR content LIKE ? OR shortcut LIKE ?)';
      countParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    const countRow = await queryFirst(countSql, ...countParams) as any;

    // 统计
    const totalRow = await queryFirst('SELECT COUNT(*) as c FROM QuickReply') as any;
    const activeRow = await queryFirst('SELECT COUNT(*) as c FROM QuickReply WHERE isActive = 1') as any;
    const disabledRow = await queryFirst('SELECT COUNT(*) as c FROM QuickReply WHERE isActive = 0') as any;
    const categoryRow = await queryFirst('SELECT COUNT(DISTINCT category) as c FROM QuickReply WHERE category IS NOT NULL AND category != ""') as any;

    return NextResponse.json({
      data: rows,
      total: countRow?.total || 0,
      stats: {
        total: totalRow?.c || 0,
        active: activeRow?.c || 0,
        disabled: disabledRow?.c || 0,
        categoryCount: categoryRow?.c || 0,
      },
    });
  } catch (error) {
    console.error('获取快捷回复列表失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();
    const body = await req.json();
    const { title, content, category, shortcut, sortOrder, isActive } = body;
    if (!title || !content) return NextResponse.json({ error: '标题和内容为必填项' }, { status: 400 });

    const id = genId();
    const now = new Date().toISOString();
    await execute(
      `INSERT INTO QuickReply (id, title, content, category, shortcut, sortOrder, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id, title, content, category || '其他', shortcut || '', sortOrder || 0, isActive !== undefined ? (isActive ? 1 : 0) : 1, now, now
    );

    return NextResponse.json({ id });
  } catch (error) {
    console.error('创建快捷回复失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();
    const body = await req.json();
    const { id, title, content, category, shortcut, sortOrder, isActive } = body;
    if (!id) return NextResponse.json({ error: '缺少ID' }, { status: 400 });

    const now = new Date().toISOString();
    await execute(
      `UPDATE QuickReply SET title = ?, content = ?, category = ?, shortcut = ?, sortOrder = ?, isActive = ?, updatedAt = ? WHERE id = ?`,
      title || null, content || '', category || '其他', shortcut || '', sortOrder ?? 0, isActive !== undefined ? (isActive ? 1 : 0) : 1, now, id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新快捷回复失败:', error);
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
    const id = searchParams.get('id');

    if (ids) {
      const idList = ids.split(',').map(s => s.trim()).filter(Boolean);
      if (idList.length === 0) return NextResponse.json({ error: '缺少ID' }, { status: 400 });
      const placeholders = idList.map(() => '?').join(',');
      await execute(`DELETE FROM QuickReply WHERE id IN (${placeholders})`, ...idList);
      return NextResponse.json({ success: true, count: idList.length });
    }

    if (!id) return NextResponse.json({ error: '缺少ID' }, { status: 400 });
    await execute('DELETE FROM QuickReply WHERE id = ?', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除快捷回复失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
