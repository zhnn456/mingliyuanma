import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { queryAll, execute } from '@/lib/d1';

export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const [categories, items, records] = await Promise.all([
      queryAll('SELECT * FROM OfferingCategory ORDER BY sortOrder ASC'),
      queryAll(
        `SELECT oi.*, oc.name as categoryName FROM OfferingItem oi
         LEFT JOIN OfferingCategory oc ON oi.categoryId = oc.id
         ORDER BY oi.sortOrder ASC`
      ),
      queryAll(
        `SELECT or.*, u.email as userEmail, u.name as userName, oi.name as itemName
         FROM OfferingRecord or
         LEFT JOIN User u ON or.userId = u.id
         LEFT JOIN OfferingItem oi ON or.itemId = oi.id
         ORDER BY or.createdAt DESC LIMIT 50`
      ),
    ]);

    return NextResponse.json({ categories, items, records });
  } catch (error) {
    console.error('获取供奉数据失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'addCategory') {
      const { name, icon, sortOrder } = body;
      const id = `ocat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await execute(
        'INSERT INTO OfferingCategory (id, name, icon, sortOrder, createdAt) VALUES (?, ?, ?, ?, ?)',
        id, name, icon, sortOrder || 0, new Date().toISOString()
      );
      return NextResponse.json({ category: { id, name, icon, sortOrder: sortOrder || 0 } });
    }

    if (action === 'addItem') {
      const { categoryId, name, description, priceSingle, priceMonth, priceYear, image, sortOrder } = body;
      const id = `oitem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await execute(
        `INSERT INTO OfferingItem (id, categoryId, name, description, priceSingle, priceMonth, priceYear, image, sortOrder, isActive, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        id, categoryId, name, description, priceSingle, priceMonth, priceYear, image, sortOrder || 0, new Date().toISOString()
      );
      return NextResponse.json({ item: { id, categoryId, name, description, priceSingle, priceMonth, priceYear, image, sortOrder: sortOrder || 0, isActive: 1 } });
    }

    if (action === 'toggleItem') {
      const { itemId, isActive } = body;
      await execute('UPDATE OfferingItem SET isActive = ? WHERE id = ?', isActive ? 1 : 0, itemId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: '无效操作' }, { status: 400 });
  } catch (error) {
    console.error('供奉管理操作失败:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}