/**
 * 命理百科管理API
 * 功能：百科词条CRUD，支持分类管理和内容编辑
 * 用途：SEO内容建设、用户教育、知识库运营
 */
import { requireAdmin } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll, execute } from '@/lib/d1';
import { auditLog } from '@/lib/audit';

const CATEGORIES = [
  '八字命理',
  '紫微斗数',
  '奇门遁甲',
  '梅花易数',
  '风水堪舆',
  '姓名学',
  '其他',
];

/** 确保百科表存在 */
async function ensureTable() {
  await execute(
    `CREATE TABLE IF NOT EXISTS "Encyclopedia" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "content" TEXT,
      "tags" TEXT,
      "viewCount" INTEGER NOT NULL DEFAULT 0,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "isActive" INTEGER NOT NULL DEFAULT 1,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  );
  await execute('CREATE INDEX IF NOT EXISTS "Encyclopedia_category_idx" ON "Encyclopedia"("category")');
  await execute('CREATE INDEX IF NOT EXISTS "Encyclopedia_isActive_idx" ON "Encyclopedia"("isActive")');
}

function generateId() {
  return `enc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function parseTags(tags: any): string[] {
  if (!tags) return [];
  try {
    const parsed = typeof tags === 'string' ? JSON.parse(tags) : tags;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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
    const category = searchParams.get('category') || '';

    const where: string[] = [];
    const params: any[] = [];
    if (keyword) {
      where.push('(title LIKE ? OR content LIKE ? OR tags LIKE ?)');
      const like = `%${keyword}%`;
      params.push(like, like, like);
    }
    if (category) {
      where.push('category = ?');
      params.push(category);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const offset = (page - 1) * pageSize;
    const records = await queryAll(
      `SELECT id, title, category, content, tags, viewCount, sortOrder, isActive, createdAt, updatedAt
       FROM Encyclopedia ${whereSql} ORDER BY sortOrder ASC, updatedAt DESC LIMIT ${pageSize} OFFSET ${offset}`,
      ...params
    );

    const countRow = await queryFirst(
      `SELECT COUNT(*) as total FROM Encyclopedia ${whereSql}`,
      ...params
    ) as any;

    const totalRow = await queryFirst('SELECT COUNT(*) as total FROM Encyclopedia') as any;
    const activeRow = await queryFirst('SELECT COUNT(*) as total FROM Encyclopedia WHERE isActive = 1') as any;
    const viewRow = await queryFirst('SELECT COALESCE(SUM(viewCount), 0) as total FROM Encyclopedia') as any;

    const data = records.map((r: any) => ({ ...r, tags: parseTags(r.tags) }));

    return NextResponse.json({
      data,
      total: countRow?.total || 0,
      page,
      pageSize,
      stats: {
        total: totalRow?.total || 0,
        active: activeRow?.total || 0,
        totalViews: viewRow?.total || 0,
      },
    });
  } catch (error) {
    console.error('获取百科列表失败:', error);
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

    if (!title) return NextResponse.json({ error: '标题为必填项' }, { status: 400 });
    if (category && !CATEGORIES.includes(category)) {
      return NextResponse.json({ error: '无效的分类' }, { status: 400 });
    }

    const id = generateId();
    const now = new Date().toISOString();
    const tagsStr = JSON.stringify(Array.isArray(tags) ? tags : []);
    const sortVal = typeof sortOrder === 'number' ? sortOrder : 0;
    const activeVal = isActive === false ? 0 : 1;

    await execute(
      `INSERT INTO Encyclopedia (id, title, category, content, tags, viewCount, sortOrder, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
      id, title, category || '其他', content || '', tagsStr, sortVal, activeVal, now, now
    );

    await auditLog({
      userId: session?.sub,
      action: 'admin_update_config',
      details: { target: 'encyclopedia', title },
      status: 'success',
    });

    return NextResponse.json({
      data: {
        id, title, category: category || '其他', content: content || '',
        tags: Array.isArray(tags) ? tags : [], viewCount: 0,
        sortOrder: sortVal, isActive: !!activeVal, createdAt: now, updatedAt: now,
      },
    });
  } catch (error) {
    console.error('创建百科失败:', error);
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

    if (!id) return NextResponse.json({ error: '缺少百科ID' }, { status: 400 });
    if (category && !CATEGORIES.includes(category)) {
      return NextResponse.json({ error: '无效的分类' }, { status: 400 });
    }

    const existing = await queryFirst('SELECT id FROM Encyclopedia WHERE id = ?', id);
    if (!existing) return NextResponse.json({ error: '百科条目不存在' }, { status: 404 });

    const updates: string[] = [];
    const params: any[] = [];
    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (category !== undefined) { updates.push('category = ?'); params.push(category); }
    if (content !== undefined) { updates.push('content = ?'); params.push(content || ''); }
    if (tags !== undefined) {
      updates.push('tags = ?');
      params.push(JSON.stringify(Array.isArray(tags) ? tags : []));
    }
    if (sortOrder !== undefined) { updates.push('sortOrder = ?'); params.push(Number(sortOrder) || 0); }
    if (isActive !== undefined) { updates.push('isActive = ?'); params.push(isActive ? 1 : 0); }

    if (updates.length === 0) return NextResponse.json({ error: '没有要更新的字段' }, { status: 400 });

    updates.push('updatedAt = ?');
    params.push(new Date().toISOString());
    params.push(id);

    await execute(`UPDATE Encyclopedia SET ${updates.join(', ')} WHERE id = ?`, ...params);

    await auditLog({
      userId: session?.sub,
      action: 'admin_update_config',
      details: { target: 'encyclopedia', id },
      status: 'success',
    });

    const row = await queryFirst('SELECT * FROM Encyclopedia WHERE id = ?', id) as any;
    return NextResponse.json({ data: { ...row, tags: parseTags(row?.tags) } });
  } catch (error) {
    console.error('更新百科失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      await execute('DELETE FROM Encyclopedia WHERE id = ?', id);
      await auditLog({
        userId: session?.sub,
        action: 'admin_update_config',
        details: { target: 'encyclopedia', id },
        status: 'success',
      });
      return NextResponse.json({ success: true });
    }

    const body = await req.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
    if (!ids.length) return NextResponse.json({ error: '缺少百科ID' }, { status: 400 });

    for (const rid of ids) {
      await execute('DELETE FROM Encyclopedia WHERE id = ?', rid);
    }
    await auditLog({
      userId: session?.sub,
      action: 'admin_update_config',
      details: { target: 'encyclopedia', id: ids.join(',') },
      status: 'success',
    });
    return NextResponse.json({ success: true, count: ids.length });
  } catch (error) {
    console.error('删除百科失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
