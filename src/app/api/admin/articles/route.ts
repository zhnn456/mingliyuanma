import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { queryFirst, queryAll, execute } from '@/lib/d1';

async function ensureTable() {
  await execute(`CREATE TABLE IF NOT EXISTS Article (
    id TEXT PRIMARY KEY,
    title TEXT,
    slug TEXT,
    category TEXT,
    summary TEXT,
    content TEXT,
    coverImage TEXT,
    author TEXT,
    tags TEXT,
    viewCount INTEGER DEFAULT 0,
    sortOrder INTEGER DEFAULT 0,
    isPublished INTEGER DEFAULT 0,
    publishedAt TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT
  )`);
  await execute('CREATE INDEX IF NOT EXISTS idx_article_category ON Article(category)');
  await execute('CREATE INDEX IF NOT EXISTS idx_article_published ON Article(isPublished)');
  await execute('CREATE INDEX IF NOT EXISTS idx_article_slug ON Article(slug)');
}

function genId() {
  return `art_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100);
}

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();
    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get('keyword') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const offset = (page - 1) * pageSize;

    let sql = 'SELECT * FROM Article WHERE 1=1';
    const params: any[] = [];
    if (category) { sql += ' AND category = ?'; params.push(category); }
    if (status === 'published') { sql += ' AND isPublished = 1'; }
    if (status === 'draft') { sql += ' AND isPublished = 0'; }
    if (keyword) {
      sql += ' AND (title LIKE ? OR summary LIKE ? OR content LIKE ? OR tags LIKE ? OR author LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    sql += ' ORDER BY sortOrder ASC, updatedAt DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);
    const rows = await queryAll(sql, ...params);

    let countSql = 'SELECT COUNT(*) as total FROM Article WHERE 1=1';
    const countParams: any[] = [];
    if (category) { countSql += ' AND category = ?'; countParams.push(category); }
    if (status === 'published') { countSql += ' AND isPublished = 1'; }
    if (status === 'draft') { countSql += ' AND isPublished = 0'; }
    if (keyword) {
      countSql += ' AND (title LIKE ? OR summary LIKE ? OR content LIKE ? OR tags LIKE ? OR author LIKE ?)';
      countParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    const countRow = await queryFirst(countSql, ...countParams) as any;

    // 统计
    const totalRow = await queryFirst('SELECT COUNT(*) as c FROM Article') as any;
    const publishedRow = await queryFirst('SELECT COUNT(*) as c FROM Article WHERE isPublished = 1') as any;
    const draftRow = await queryFirst('SELECT COUNT(*) as c FROM Article WHERE isPublished = 0') as any;
    const viewsRow = await queryFirst('SELECT COALESCE(SUM(viewCount), 0) as c FROM Article') as any;

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
    console.error('获取文章列表失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();
    const body = await req.json();
    const { title, slug, category, summary, content, coverImage, author, tags, sortOrder, isPublished } = body;
    if (!title || !category) return NextResponse.json({ error: '标题和分类为必填项' }, { status: 400 });

    const id = genId();
    const now = new Date().toISOString();
    const finalSlug = slug || slugify(title);
    const published = isPublished ? 1 : 0;
    const publishedAt = isPublished ? now : null;

    await execute(
      `INSERT INTO Article (id, title, slug, category, summary, content, coverImage, author, tags, viewCount, sortOrder, isPublished, publishedAt, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`,
      id, title, finalSlug, category, summary || '', content || '', coverImage || '', author || '', tags || '', sortOrder || 0, published, publishedAt, now, now
    );

    return NextResponse.json({ id });
  } catch (error) {
    console.error('创建文章失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();
    const body = await req.json();
    const { id, title, slug, category, summary, content, coverImage, author, tags, sortOrder, isPublished, action } = body;
    if (!id) return NextResponse.json({ error: '缺少文章ID' }, { status: 400 });

    const now = new Date().toISOString();
    const existing = await queryFirst('SELECT * FROM Article WHERE id = ?', id) as any;
    if (!existing) return NextResponse.json({ error: '文章不存在' }, { status: 404 });

    // 仅切换发布状态
    if (action === 'togglePublish') {
      const newPublished = isPublished ? 1 : 0;
      const publishedAt = newPublished && !existing.publishedAt ? now : existing.publishedAt;
      await execute(
        'UPDATE Article SET isPublished = ?, publishedAt = ?, updatedAt = ? WHERE id = ?',
        newPublished, publishedAt, now, id
      );
      return NextResponse.json({ success: true });
    }

    const finalSlug = slug || (title ? slugify(title) : existing.slug);
    const published = isPublished ? 1 : 0;
    const publishedAt = published && !existing.publishedAt ? now : existing.publishedAt;

    await execute(
      `UPDATE Article SET title = ?, slug = ?, category = ?, summary = ?, content = ?, coverImage = ?, author = ?, tags = ?, sortOrder = ?, isPublished = ?, publishedAt = ?, updatedAt = ? WHERE id = ?`,
      title ?? existing.title,
      finalSlug,
      category ?? existing.category,
      summary ?? existing.summary,
      content ?? existing.content,
      coverImage ?? existing.coverImage,
      author ?? existing.author,
      tags ?? existing.tags,
      sortOrder ?? existing.sortOrder ?? 0,
      published,
      publishedAt,
      now,
      id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新文章失败:', error);
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
      await execute(`DELETE FROM Article WHERE id IN (${placeholders})`, ...idList);
      return NextResponse.json({ success: true, count: idList.length });
    }

    if (!id) return NextResponse.json({ error: '缺少ID' }, { status: 400 });
    await execute('DELETE FROM Article WHERE id = ?', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除文章失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
