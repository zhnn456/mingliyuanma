import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { queryFirst, queryAll, execute, batch } from '@/lib/d1';

function generateId() {
  return `oitem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.max(1, parseInt(searchParams.get('pageSize') || '20'));
    const keyword = (searchParams.get('keyword') || '').trim();
    const categoryId = searchParams.get('categoryId') || '';
    const offset = (page - 1) * pageSize;

    const where: string[] = [];
    const params: any[] = [];
    if (keyword) {
      where.push('(oi.name LIKE ? OR oi.description LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (categoryId) {
      where.push('oi.categoryId = ?');
      params.push(categoryId);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const rows = await queryAll(
      `SELECT oi.*, oc.name as categoryName, oc.icon as categoryIcon
       FROM OfferingItem oi
       LEFT JOIN OfferingCategory oc ON oi.categoryId = oc.id
       ${whereSql}
       ORDER BY oi.sortOrder ASC, oi.id DESC
       LIMIT ? OFFSET ?`,
      ...params, pageSize, offset
    );

    const countRow = await queryFirst(
      `SELECT COUNT(*) as total FROM OfferingItem oi ${whereSql}`,
      ...params
    ) as any;

    const total = countRow?.total || 0;

    // 统计卡片数据
    const [totalRow, activeRow, inactiveRow, categoryRow] = await Promise.all([
      queryFirst('SELECT COUNT(*) as cnt FROM OfferingItem') as any,
      queryFirst('SELECT COUNT(*) as cnt FROM OfferingItem WHERE isActive = 1') as any,
      queryFirst('SELECT COUNT(*) as cnt FROM OfferingItem WHERE isActive = 0') as any,
      queryFirst('SELECT COUNT(*) as cnt FROM OfferingCategory') as any,
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
        categories: categoryRow?.cnt || 0,
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

    const body = await req.json();
    const {
      categoryId, name, image, description,
      priceSingle, priceMonth, priceYear, sortOrder, isActive,
    } = body;

    if (!categoryId || !name) {
      return NextResponse.json({ error: '分类和名称为必填项' }, { status: 400 });
    }

    const id = generateId();
    await execute(
      `INSERT INTO OfferingItem (id, categoryId, name, image, description, priceSingle, priceMonth, priceYear, isActive, sortOrder)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id, categoryId, name, image || null, description || null,
      Number(priceSingle) || 0, Number(priceMonth) || 0, Number(priceYear) || 0,
      isActive === false ? 0 : 1, Number(sortOrder) || 0
    );

    return NextResponse.json({
      item: {
        id, categoryId, name, image, description,
        priceSingle: Number(priceSingle) || 0,
        priceMonth: Number(priceMonth) || 0,
        priceYear: Number(priceYear) || 0,
        isActive: isActive === false ? 0 : 1,
        sortOrder: Number(sortOrder) || 0,
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

    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: '缺少项目 ID' }, { status: 400 });

    const existing = await queryFirst('SELECT * FROM OfferingItem WHERE id = ?', id);
    if (!existing) return NextResponse.json({ error: '项目不存在' }, { status: 404 });

    const fields: string[] = [];
    const params: any[] = [];
    const fieldMap: Record<string, string> = {
      categoryId: 'categoryId',
      name: 'name',
      image: 'image',
      description: 'description',
      priceSingle: 'priceSingle',
      priceMonth: 'priceMonth',
      priceYear: 'priceYear',
      sortOrder: 'sortOrder',
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
    await execute(`UPDATE OfferingItem SET ${fields.join(', ')} WHERE id = ?`, ...params);

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
      await execute('DELETE FROM OfferingItem WHERE id = ?', ids[0]);
    } else {
      const statements = ids.map((id) => ({
        sql: 'DELETE FROM OfferingItem WHERE id = ?',
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
