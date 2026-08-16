import { requireAdmin } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll, execute } from '@/lib/d1';
import { auditLog } from '@/lib/audit';

/** 确保命理师表存在 */
async function ensureTable() {
  await execute(
    `CREATE TABLE IF NOT EXISTS "FortuneTeller" (
      "id" VARCHAR(255) NOT NULL PRIMARY KEY,
      "userId" VARCHAR(255),
      "name" VARCHAR(255),
      "avatar" VARCHAR(500),
      "bio" TEXT,
      "specialties" TEXT,
      "rating" REAL NOT NULL DEFAULT 5,
      "isActive" INTEGER NOT NULL DEFAULT 1,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  );
  // 生产环境的 FortuneTeller 表可能由旧版迁移创建，缺少 userId 列，需要补齐
  try {
    await execute(`ALTER TABLE "FortuneTeller" ADD COLUMN "userId" VARCHAR(255)`);
  } catch (e: any) {
    // 列已存在则忽略（MySQL 报 error 1060 Duplicate column name）
    if (!/1060|Duplicate column/i.test(e?.message || '')) {
      // 其他错误也忽略（如索引已存在），不阻塞主流程
    }
  }
  try {
    await execute(`ALTER TABLE "FortuneTeller" ADD UNIQUE INDEX "FortuneTeller_userId_key" ("userId")`);
  } catch (e: any) {
    // 索引已存在则忽略
  }
}

function generateId() {
  return `ft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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
    const activeOnly = searchParams.get('active');

    const where: string[] = [];
    const params: any[] = [];
    if (keyword) {
      where.push('(ft.name LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR ft.specialties LIKE ?)');
      const like = `%${keyword}%`;
      params.push(like, like, like, like, like);
    }
    if (activeOnly === '1' || activeOnly === 'true') {
      where.push('ft.isActive = 1');
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const offset = (page - 1) * pageSize;
    const records = await queryAll(
      `SELECT ft.id, ft.userId, ft.name, ft.avatar, ft.bio, ft.specialties, ft.rating, ft.isActive, ft.createdAt, ft.updatedAt,
              u.email as userEmail, u.phone as userPhone, u.name as userUserName, u.role as userRole
       FROM FortuneTeller ft LEFT JOIN User u ON ft.userId = u.id
       ${whereSql} ORDER BY ft.createdAt DESC LIMIT ${pageSize} OFFSET ${offset}`,
      ...params
    );

    const countRow = await queryFirst(
      `SELECT COUNT(*) as total FROM FortuneTeller ft LEFT JOIN User u ON ft.userId = u.id ${whereSql}`,
      ...params
    ) as any;

    // 统计：总数、启用数、平均评分
    const totalRow = await queryFirst('SELECT COUNT(*) as total FROM FortuneTeller') as any;
    const activeRow = await queryFirst('SELECT COUNT(*) as total FROM FortuneTeller WHERE isActive = 1') as any;
    const ratingRow = await queryFirst('SELECT COALESCE(AVG(rating), 0) as avgRating FROM FortuneTeller WHERE isActive = 1') as any;

    // 解析 specialties JSON
    const data = records.map((r: any) => {
      let specialties: string[] = [];
      try {
        const parsed = r.specialties ? JSON.parse(r.specialties) : [];
        specialties = Array.isArray(parsed) ? parsed : [];
      } catch {}
      return { ...r, specialties };
    });

    return NextResponse.json({
      data,
      total: countRow?.total || 0,
      page,
      pageSize,
      stats: {
        total: totalRow?.total || 0,
        active: activeRow?.total || 0,
        avgRating: Math.round((ratingRow?.avgRating || 0) * 10) / 10,
      },
    });
  } catch (error) {
    console.error('获取命理师列表失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();
    const body = await req.json();
    const { userId, name, avatar, bio, specialties, rating, isActive } = body;

    if (!userId) return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });

    const user = await queryFirst('SELECT id, name, email, role FROM User WHERE id = ?', userId) as any;
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

    const existing = await queryFirst('SELECT id FROM FortuneTeller WHERE userId = ?', userId);
    if (existing) return NextResponse.json({ error: '该用户已是命理师' }, { status: 400 });

    const id = generateId();
    const now = new Date().toISOString();
    const specialtiesStr = JSON.stringify(Array.isArray(specialties) ? specialties : []);
    const ratingVal = typeof rating === 'number' ? rating : 5;
    const activeVal = isActive === false ? 0 : 1;

    await execute(
      `INSERT INTO FortuneTeller (id, userId, name, avatar, bio, specialties, rating, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id, userId, name || user.name || null, avatar || null, bio || null,
      specialtiesStr, ratingVal, activeVal, now, now
    );

    // 将用户角色提升为 fortune_teller
    await execute('UPDATE User SET role = ?, updatedAt = ? WHERE id = ?', 'fortune_teller', now, userId);

    await auditLog({
      userId: session?.sub,
      action: 'admin_update_config',
      details: { target: 'fortune_teller', name: name || user.name },
      status: 'success',
    });

    return NextResponse.json({
      id, userId, name: name || user.name, avatar, bio,
      specialties: Array.isArray(specialties) ? specialties : [],
      rating: ratingVal, isActive: !!activeVal,
    });
  } catch (error) {
    console.error('创建命理师失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();
    const body = await req.json();
    const { id, name, avatar, bio, specialties, rating, isActive } = body;

    if (!id) return NextResponse.json({ error: '缺少命理师ID' }, { status: 400 });

    const existing = await queryFirst('SELECT id, userId FROM FortuneTeller WHERE id = ?', id) as any;
    if (!existing) return NextResponse.json({ error: '命理师不存在' }, { status: 404 });

    const updates: string[] = [];
    const params: any[] = [];
    if (name !== undefined) { updates.push('name = ?'); params.push(name || null); }
    if (avatar !== undefined) { updates.push('avatar = ?'); params.push(avatar || null); }
    if (bio !== undefined) { updates.push('bio = ?'); params.push(bio || null); }
    if (specialties !== undefined) {
      updates.push('specialties = ?');
      params.push(JSON.stringify(Array.isArray(specialties) ? specialties : []));
    }
    if (rating !== undefined) { updates.push('rating = ?'); params.push(Number(rating) || 5); }
    if (isActive !== undefined) { updates.push('isActive = ?'); params.push(isActive ? 1 : 0); }

    if (updates.length === 0) return NextResponse.json({ error: '没有要更新的字段' }, { status: 400 });

    updates.push('updatedAt = ?');
    params.push(new Date().toISOString());
    params.push(id);

    await execute(`UPDATE FortuneTeller SET ${updates.join(', ')} WHERE id = ?`, ...params);

    await auditLog({
      userId: session?.sub,
      action: 'admin_update_config',
      details: { target: 'fortune_teller', id },
      status: 'success',
    });

    const row = await queryFirst(
      `SELECT ft.*, u.email as userEmail, u.phone as userPhone, u.name as userUserName
       FROM FortuneTeller ft LEFT JOIN User u ON ft.userId = u.id WHERE ft.id = ?`,
      id
    ) as any;

    let sp: string[] = [];
    try {
      const parsed = row?.specialties ? JSON.parse(row.specialties) : [];
      sp = Array.isArray(parsed) ? parsed : [];
    } catch {}

    return NextResponse.json({ data: { ...row, specialties: sp } });
  } catch (error) {
    console.error('更新命理师失败:', error);
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
      const row = await queryFirst('SELECT userId FROM FortuneTeller WHERE id = ?', id) as any;
      await execute('DELETE FROM FortuneTeller WHERE id = ?', id);
      if (row?.userId) {
        await execute('UPDATE User SET role = ?, updatedAt = ? WHERE id = ?', 'user', new Date().toISOString(), row.userId);
      }
      await auditLog({
        userId: session?.sub,
        action: 'admin_update_config',
        details: { target: 'fortune_teller', id },
        status: 'success',
      });
      return NextResponse.json({ success: true });
    }

    const body = await req.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
    if (!ids.length) return NextResponse.json({ error: '缺少命理师ID' }, { status: 400 });

    for (const rid of ids) {
      const row = await queryFirst('SELECT userId FROM FortuneTeller WHERE id = ?', rid) as any;
      await execute('DELETE FROM FortuneTeller WHERE id = ?', rid);
      if (row?.userId) {
        await execute('UPDATE User SET role = ?, updatedAt = ? WHERE id = ?', 'user', new Date().toISOString(), row.userId);
      }
    }
    await auditLog({
      userId: session?.sub,
      action: 'admin_update_config',
      details: { target: 'fortune_teller', count: ids.length, ids },
      status: 'success',
    });
    return NextResponse.json({ success: true, count: ids.length });
  } catch (error) {
    console.error('删除命理师失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
