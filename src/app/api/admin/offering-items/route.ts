import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { queryFirst, queryAll, execute, batch, ensureOfferingSupplyTable, seedDefaultSupplies } from '@/lib/d1';

// 与前台 /api/offerings 保持一致的分类元数据
const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  wish: { label: '心愿祈福', icon: '🏮' },
  culture: { label: '文化纪念', icon: '🎐' },
  offering: { label: '鲜花供品', icon: '🌸' },
  ritual: { label: '香烛用品', icon: '🕯️' },
};

function generateId() {
  return `oitem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function ensureReady() {
  await ensureOfferingSupplyTable();
  await seedDefaultSupplies(false);
}

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureReady();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.max(1, parseInt(searchParams.get('pageSize') || '20'));
    const keyword = (searchParams.get('keyword') || '').trim();
    const categoryId = searchParams.get('categoryId') || '';
    const offset = (page - 1) * pageSize;

    const where: string[] = [];
    const params: any[] = [];
    if (keyword) {
      where.push('(name LIKE ? OR description LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (categoryId) {
      where.push('category = ?');
      params.push(categoryId);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const rows = await queryAll(
      `SELECT * FROM OfferingSupply ${whereSql} ORDER BY sortOrder ASC, id DESC LIMIT ? OFFSET ?`,
      ...params, pageSize, offset
    );

    const countRow = await queryFirst(
      `SELECT COUNT(*) as total FROM OfferingSupply ${whereSql}`,
      ...params
    ) as any;

    const total = countRow?.total || 0;

    // 统计卡片数据
    const [totalRow, activeRow, inactiveRow] = await Promise.all([
      queryFirst('SELECT COUNT(*) as cnt FROM OfferingSupply') as any,
      queryFirst('SELECT COUNT(*) as cnt FROM OfferingSupply WHERE isActive = 1') as any,
      queryFirst('SELECT COUNT(*) as cnt FROM OfferingSupply WHERE isActive = 0') as any,
    ]);

    return NextResponse.json({
      data: rows,
      total,
      page,
      pageSize,
      stats: {
        total: totalRow?.cnt || 0,
        active: activeRow?.cnt || 0,
        inactive: inactiveRow?.cnt || 0,
        categories: Object.keys(CATEGORY_META).length,
      },
    });
  } catch (error) {
    console.error('获取供奉项目失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureReady();

    const body = await req.json();
    const {
      category, name, image, description,
      price, priceMonth, priceYear, sortOrder, isActive,
      icon, stock,
    } = body;

    if (!category || !name) {
      return NextResponse.json({ error: '分类和名称为必填项' }, { status: 400 });
    }

    const id = generateId();
    const now = new Date().toISOString();
    await execute(
      `INSERT INTO OfferingSupply (id, name, icon, image, price, priceMonth, priceYear, description, category, sortOrder, isActive, createdAt, stock)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id, name, icon || null, image || null,
      Number(price) || 0, Number(priceMonth) || 0, Number(priceYear) || 0,
      description || null, category,
      Number(sortOrder) || 0, isActive === false ? 0 : 1, now, Number(stock) || 0
    );

    return NextResponse.json({
      item: {
        id, category, name, image, description, icon,
        price: Number(price) || 0,
        priceMonth: Number(priceMonth) || 0,
        priceYear: Number(priceYear) || 0,
        isActive: isActive === false ? 0 : 1,
        sortOrder: Number(sortOrder) || 0,
        stock: Number(stock) || 0,
      },
    });
  } catch (error) {
    console.error('创建供奉项目失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureReady();

    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: '缺少项目 ID' }, { status: 400 });

    const existing = await queryFirst('SELECT * FROM OfferingSupply WHERE id = ?', id);
    if (!existing) return NextResponse.json({ error: '项目不存在' }, { status: 404 });

    const fields: string[] = [];
    const params: any[] = [];
    const fieldMap: Record<string, string> = {
      category: 'category',
      name: 'name',
      icon: 'icon',
      image: 'image',
      description: 'description',
      price: 'price',
      priceMonth: 'priceMonth',
      priceYear: 'priceYear',
      sortOrder: 'sortOrder',
      stock: 'stock',
    };
    for (const [k, col] of Object.entries(fieldMap)) {
      if (updates[k] !== undefined) {
        fields.push(`${col} = ?`);
        params.push(updates[k]);
      }
    }
    if (updates.isActive !== undefined) {
      fields.push('isActive = ?');
      params.push(updates.isActive ? 1 : 0);
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: '没有需要更新的字段' }, { status: 400 });
    }

    params.push(id);
    await execute(`UPDATE OfferingSupply SET ${fields.join(', ')} WHERE id = ?`, ...params);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新供奉项目失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureReady();

    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get('ids') || '';
    const singleId = searchParams.get('id');

    const ids = idsParam
      ? idsParam.split(',').map((s) => s.trim()).filter(Boolean)
      : singleId
        ? [singleId]
        : [];

    if (ids.length === 0) {
      return NextResponse.json({ error: '缺少项目 ID' }, { status: 400 });
    }

    if (ids.length === 1) {
      await execute('DELETE FROM OfferingSupply WHERE id = ?', ids[0]);
    } else {
      const statements = ids.map((id) => ({
        sql: 'DELETE FROM OfferingSupply WHERE id = ?',
        params: [id],
      }));
      await batch(statements);
    }

    return NextResponse.json({ success: true, count: ids.length });
  } catch (error) {
    console.error('删除供奉项目失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
