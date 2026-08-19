/**
 * 知识库管理API
 * 功能：知识库文章CRUD，支持分类管理和搜索
 * 用途：运营维护帮助中心内容，提升用户体验
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { queryFirst, queryAll, execute } from '@/lib/d1';
import { auditLog } from '@/lib/audit';

async function ensureTable() {
  await execute(`CREATE TABLE IF NOT EXISTS KnowledgeArticle (
    id VARCHAR(255) PRIMARY KEY,
    title TEXT,
    category TEXT,
    content TEXT,
    tags TEXT,
    viewCount INTEGER DEFAULT 0,
    helpfulCount INTEGER DEFAULT 0,
    sortOrder INTEGER DEFAULT 0,
    isActive INTEGER DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT
  )`);
  await execute('CREATE INDEX IF NOT EXISTS idx_kb_category ON KnowledgeArticle(category)');
  await execute('CREATE INDEX IF NOT EXISTS idx_kb_active ON KnowledgeArticle(isActive)');
}

function genId() {
  return `kb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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

    let sql = 'SELECT * FROM KnowledgeArticle WHERE 1=1';
    const params: any[] = [];
    if (category) { sql += ' AND category = ?'; params.push(category); }
    if (keyword) {
      sql += ' AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    sql += ` ORDER BY sortOrder ASC, updatedAt DESC LIMIT ${pageSize} OFFSET ${offset}`;
    const rows = await queryAll(sql, ...params);

    let countSql = 'SELECT COUNT(*) as total FROM KnowledgeArticle WHERE 1=1';
    const countParams: any[] = [];
    if (category) { countSql += ' AND category = ?'; countParams.push(category); }
    if (keyword) {
      countSql += ' AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)';
      countParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    const countRow = await queryFirst(countSql, ...countParams) as any;

    // 统计
    const totalRow = await queryFirst('SELECT COUNT(*) as c FROM KnowledgeArticle') as any;
    const publishedRow = await queryFirst('SELECT COUNT(*) as c FROM KnowledgeArticle WHERE isActive = 1') as any;
    const draftRow = await queryFirst('SELECT COUNT(*) as c FROM KnowledgeArticle WHERE isActive = 0') as any;
    const viewsRow = await queryFirst('SELECT COALESCE(SUM(viewCount), 0) as c FROM KnowledgeArticle') as any;

    return NextResponse.json({
      data: rows,
      total: countRow?.total || 0,
      stats: {
        total: totalRow?.c || 0,
        published: publishedRow?.c || 0,
        draft: draftRow?.c || 0,
        totalViews: viewsRow?.c || 0,
      },
    });
  } catch (error) {
    console.error('获取知识库列表失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();
    const body = await req.json();
    const { title, category, content, tags, sortOrder, isActive } = body;
    if (!title || !category) return NextResponse.json({ error: '标题和分类为必填项' }, { status: 400 });

    const id = genId();
    const now = new Date().toISOString();
    await execute(
      `INSERT INTO KnowledgeArticle (id, title, category, content, tags, viewCount, helpfulCount, sortOrder, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?)`,
      id, title, category, content || '', tags || '', sortOrder || 0, isActive !== undefined ? (isActive ? 1 : 0) : 1, now, now
    );

    await auditLog({
      userId: session?.sub,
      action: 'admin_update_config',
      details: { target: 'kb', title },
      status: 'success',
    });

    return NextResponse.json({ id });
  } catch (error) {
    console.error('创建文章失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();
    const body = await req.json();
    const { id, title, category, content, tags, sortOrder, isActive } = body;
    if (!id) return NextResponse.json({ error: '缺少文章ID' }, { status: 400 });

    const now = new Date().toISOString();
    await execute(
      `UPDATE KnowledgeArticle SET title = ?, category = ?, content = ?, tags = ?, sortOrder = ?, isActive = ?, updatedAt = ? WHERE id = ?`,
      title || null, category || null, content || '', tags || '', sortOrder ?? 0, isActive !== undefined ? (isActive ? 1 : 0) : 1, now, id
    );

    await auditLog({
      userId: session?.sub,
      action: 'admin_update_config',
      details: { target: 'kb', id },
      status: 'success',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新文章失败:', error);
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
    const id = searchParams.get('id');

    if (ids) {
      const idList = ids.split(',').map(s => s.trim()).filter(Boolean);
      if (idList.length === 0) return NextResponse.json({ error: '缺少ID' }, { status: 400 });
      const placeholders = idList.map(() => '?').join(',');
      await execute(`DELETE FROM KnowledgeArticle WHERE id IN (${placeholders})`, ...idList);
      await auditLog({
        userId: session?.sub,
        action: 'admin_update_config',
        details: { target: 'kb', id: ids },
        status: 'success',
      });
      return NextResponse.json({ success: true, count: idList.length });
    }

    if (!id) return NextResponse.json({ error: '缺少ID' }, { status: 400 });
    await execute('DELETE FROM KnowledgeArticle WHERE id = ?', id);
    await auditLog({
      userId: session?.sub,
      action: 'admin_update_config',
      details: { target: 'kb', id },
      status: 'success',
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除文章失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
