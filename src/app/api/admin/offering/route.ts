import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { queryAll, execute, ensureOfferingSupplyTable, seedDefaultSupplies } from '@/lib/d1';

// 与前台 /api/offerings 保持一致的分类元数据
const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  wish: { label: '心愿祈福', icon: '🏮' },
  culture: { label: '文化纪念', icon: '🎐' },
  offering: { label: '鲜花供品', icon: '🌸' },
  ritual: { label: '香烛用品', icon: '🕯️' },
};

async function ensureReady() {
  await ensureOfferingSupplyTable();
  await seedDefaultSupplies(false);
}

export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    await ensureReady();

    // 返回与前台一致的硬编码分类
    const categories = Object.entries(CATEGORY_META).map(([key, meta]) => ({
      id: key,
      name: meta.label,
      icon: meta.icon,
    }));

    // 同时返回供品和记录（兼容旧调用方）
    const [items, records] = await Promise.all([
      queryAll('SELECT * FROM OfferingSupply ORDER BY sortOrder ASC'),
      queryAll(
        `SELECT r.*, u.email as userEmail, u.name as userName
         FROM OfferingRecord r
         LEFT JOIN User u ON r.userId = u.id
         ORDER BY r.createdAt DESC LIMIT 50`
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

    await ensureReady();

    const body = await req.json();
    const { action } = body;

    if (action === 'addItem') {
      const { category, name, description, price, priceMonth, priceYear, image, sortOrder, icon, stock } = body;
      const id = `oitem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await execute(
        `INSERT INTO OfferingSupply (id, name, icon, image, price, priceMonth, priceYear, description, category, sortOrder, isActive, createdAt, stock)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        id, name, icon || null, image || null,
        Number(price) || 0, Number(priceMonth) || 0, Number(priceYear) || 0,
        description || null, category,
        Number(sortOrder) || 0, new Date().toISOString(), Number(stock) || 0
      );
      return NextResponse.json({ item: { id, category, name, description, price, priceMonth, priceYear, image, sortOrder: sortOrder || 0, isActive: 1 } });
    }

    if (action === 'toggleItem') {
      const { itemId, isActive } = body;
      await execute('UPDATE OfferingSupply SET isActive = ? WHERE id = ?', isActive ? 1 : 0, itemId);
      return NextResponse.json({ success: true });
    }

    // 分类为系统预设（CATEGORY_META 硬编码），不支持增删改
    if (action === 'addCategory' || action === 'deleteCategory' || action === 'updateCategory') {
      return NextResponse.json(
        { error: '分类为系统预设，不支持增删改。如需新增分类请联系开发者。' },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: '无效操作' }, { status: 400 });
  } catch (error) {
    console.error('供奉管理操作失败:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}
