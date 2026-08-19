/**
 * 供奉用品供应API
 * 功能：供奉用品（福灯/鲜花/香烛等）库存管理和配置
 * 用途：供品库存管理、商品配置
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { queryFirst, queryAll, execute, batch } from '@/lib/d1';
import { auditLog } from '@/lib/audit';

function generateId() {
  return `sup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const SEED_SUPPLIES: Array<{
  name: string; icon: string; category: string; price: number;
  description: string; sortOrder: number; stock: number;
}> = [
  // 心愿祈福类（民俗祈福文化，无宗教属性）
  { name: '心愿福灯', icon: '🏮', category: 'wish', price: 28, description: '点亮一盏福灯，寄托美好心愿', sortOrder: 1, stock: 1000 },
  { name: '祈福带', icon: '🎀', category: 'wish', price: 9.9, description: '一条祈福带，系住一份祝愿', sortOrder: 2, stock: 2000 },
  { name: '平安香囊', icon: '🧧', category: 'wish', price: 18, description: '传统香囊，寄托平安祝愿', sortOrder: 3, stock: 1500 },
  { name: '心愿牌', icon: '🏷️', category: 'wish', price: 15, description: '写下心愿，挂在祈福墙上', sortOrder: 4, stock: 1500 },
  { name: '祈福莲花灯', icon: '🪷', category: 'wish', price: 38, description: '莲花灯，象征美好祝愿', sortOrder: 5, stock: 800 },
  { name: '千里福灯', icon: '🏮', category: 'wish', price: 36, description: '遥寄思念，福佑远方', sortOrder: 6, stock: 800 },
  // 文化纪念类（妈祖/关公/文昌等民俗文化，非遗保护范畴）
  { name: '妈祖文化纪念徽章', icon: '🌊', category: 'culture', price: 168, description: '妈祖信俗文化纪念，护佑平安顺遂', sortOrder: 1, stock: 500 },
  { name: '关公文化纪念卡', icon: '🎭', category: 'culture', price: 168, description: '弘扬关公忠义精神', sortOrder: 2, stock: 500 },
  { name: '文昌智慧书签', icon: '📚', category: 'culture', price: 128, description: '文昌文化纪念，祝愿学业进步', sortOrder: 3, stock: 500 },
  { name: '土地公民俗纪念', icon: '🏠', category: 'culture', price: 88, description: '传统民俗文化纪念', sortOrder: 4, stock: 800 },
  { name: '生肖守护纪念牌', icon: '🐲', category: 'culture', price: 66, description: '生肖民俗文化纪念', sortOrder: 5, stock: 800 },
  { name: '五福临门挂饰', icon: '🧧', category: 'culture', price: 58, description: '传统五福民俗挂饰', sortOrder: 6, stock: 800 },
  // 鲜花供品类
  { name: '鲜花', icon: '💐', category: 'offering', price: 9.9, description: '新鲜花束，清香雅致', sortOrder: 1, stock: 1000 },
  { name: '水果', icon: '🍎', category: 'offering', price: 15, description: '时令水果，新鲜可口', sortOrder: 2, stock: 800 },
  { name: '糕点', icon: '🍰', category: 'offering', price: 12, description: '传统糕点，精致可口', sortOrder: 3, stock: 600 },
  { name: '茶水', icon: '🍵', category: 'offering', price: 6, description: '清香好茶', sortOrder: 4, stock: 1000 },
  { name: '香烛', icon: '🕯️', category: 'offering', price: 8, description: '天然香烛，传统祭祀用品', sortOrder: 5, stock: 1000 },
  // 香烛用品类
  { name: '铜香炉', icon: '🏺', category: 'ritual', price: 28, description: '传统铜香炉', sortOrder: 1, stock: 500 },
  { name: '烛台', icon: '🕯️', category: 'ritual', price: 18, description: '传统烛台', sortOrder: 2, stock: 500 },
  { name: '供盘', icon: '🍽️', category: 'ritual', price: 15, description: '传统供盘', sortOrder: 3, stock: 500 },
];

const DEFAULT_CATEGORIES = [
  { value: 'wish', label: '心愿祈福', icon: '🏮', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'culture', label: '文化纪念', icon: '🎐', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'offering', label: '鲜花供品', icon: '🌸', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  { value: 'ritual', label: '香烛用品', icon: '🕯️', color: 'bg-purple-50 text-purple-700 border-purple-200' },
];

async function ensureOfferingSupplyTable() {
  // Drop old table if schema is wrong (first-time fix)
  try {
    const check = await queryAll("PRAGMA table_info('OfferingSupply')") as any[];
    const colNames = check.map(c => c.name);
    // If isActive exists as BOOLEAN type, drop and recreate
    if (colNames.includes('isActive') && colNames.length > 0) {
      const isActiveCol = check.find(c => c.name === 'isActive');
      if (isActiveCol && isActiveCol.type && isActiveCol.type.toUpperCase().includes('BOOL')) {
        await execute('DROP TABLE IF EXISTS OfferingSupply');
      }
    }
  } catch {}

  await execute(`CREATE TABLE IF NOT EXISTS "OfferingSupply" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "image" TEXT,
    "price" REAL NOT NULL,
    "description" TEXT,
    "category" VARCHAR(50) NOT NULL DEFAULT 'general',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stock" INTEGER NOT NULL DEFAULT 0
  )`);

  const cols = await queryAll("PRAGMA table_info('OfferingSupply')") as any[];
  const colNames = cols.map(c => c.name);
  const alters: Array<[string, string]> = [
    ['stock', 'INTEGER NOT NULL DEFAULT 0'],
  ];
  for (const [col, def] of alters) {
    if (!colNames.includes(col)) {
      try { await execute(`ALTER TABLE "OfferingSupply" ADD COLUMN "${col}" ${def}`); } catch {}
    }
  }
}

async function seedDefaultSupplies(force = false) {
  await ensureOfferingSupplyTable();

  if (!force) {
    const countRow = await queryFirst('SELECT COUNT(*) as cnt FROM OfferingSupply') as any;
    if (countRow?.cnt && countRow.cnt > 0) return;
  }

  const now = new Date().toISOString();
  let inserted = 0;
  let errors: string[] = [];

  for (let i = 0; i < SEED_SUPPLIES.length; i++) {
    const s = SEED_SUPPLIES[i];
    try {
      await execute(
        `INSERT INTO OfferingSupply (id, name, icon, image, price, description, category, sortOrder, isActive, createdAt, stock)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        `sup_seed_${Date.now()}_${i}`,
        s.name,
        s.icon || null,
        null,
        s.price,
        s.description,
        s.category,
        s.sortOrder,
        1,
        now,
        s.stock
      );
      inserted++;
    } catch (err: any) {
      errors.push(`${s.name}: ${err?.message || String(err)}`);
      console.error(`Seed supply error (${s.name}):`, err?.message || err);
    }
  }
  console.log(`Seed supplies done: ${inserted} inserted, ${errors.length} errors`);
  if (errors.length > 0) console.error('Seed errors:', errors);
}

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await seedDefaultSupplies();

    const { searchParams } = new URL(req.url);
    const forceSeed = searchParams.get('forceSeed') === '1';
    if (forceSeed) {
      await seedDefaultSupplies(true);
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.max(1, parseInt(searchParams.get('pageSize') || '20'));
    const keyword = (searchParams.get('keyword') || '').trim();
    const category = searchParams.get('category') || '';
    const offset = (page - 1) * pageSize;

    const where: string[] = [];
    const params: any[] = [];
    if (keyword) {
      where.push('(name LIKE ? OR description LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (category) {
      where.push('category = ?');
      params.push(category);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const rows = await queryAll(
      `SELECT * FROM OfferingSupply ${whereSql} ORDER BY sortOrder ASC, createdAt DESC LIMIT ${pageSize} OFFSET ${offset}`,
      ...params
    );

    const countRow = await queryFirst(
      `SELECT COUNT(*) as total FROM OfferingSupply ${whereSql}`,
      ...params
    ) as any;

    const total = countRow?.total || 0;

    const [totalRow, activeRow, inactiveRow, categoryRow, categoryStats] = await Promise.all([
      queryFirst('SELECT COUNT(*) as cnt FROM OfferingSupply') as any,
      queryFirst('SELECT COUNT(*) as cnt FROM OfferingSupply WHERE isActive = 1') as any,
      queryFirst('SELECT COUNT(*) as cnt FROM OfferingSupply WHERE isActive = 0') as any,
      queryFirst('SELECT COUNT(DISTINCT category) as cnt FROM OfferingSupply') as any,
      (queryAll('SELECT category, COUNT(*) as cnt, SUM(stock) as totalStock FROM OfferingSupply GROUP BY category ORDER BY cnt DESC') as unknown) as any[],
    ]);

    const categoryMap: Record<string, { label: string; icon: string; color: string; count: number; totalStock: number }> = {};
    for (const cat of DEFAULT_CATEGORIES) {
      const found = categoryStats.find((c: any) => c.category === cat.value);
      categoryMap[cat.value] = {
        label: cat.label,
        icon: cat.icon,
        color: cat.color,
        count: found?.cnt || 0,
        totalStock: found?.totalStock || 0,
      };
    }

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
      categoryGroups: categoryMap,
      categoryOptions: DEFAULT_CATEGORIES,
    });
  } catch (error) {
    console.error('获取供品列表失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const body = await req.json();

    if (body.action === 'seed') {
      // Force reseed with detailed result
      await seedDefaultSupplies(true);
      const countRow = await queryFirst('SELECT COUNT(*) as cnt FROM OfferingSupply') as any;
      return NextResponse.json({
        success: true,
        totalCount: countRow?.cnt || 0,
        message: '供品数据已重新播种',
      });
    }

    await ensureOfferingSupplyTable();
    const { name, icon, image, price, description, category, sortOrder, isActive, stock } = body;

    if (!name) {
      return NextResponse.json({ error: '名称为必填项' }, { status: 400 });
    }

    const id = generateId();
    const now = new Date().toISOString();
    await execute(
      `INSERT INTO OfferingSupply (id, name, icon, image, price, description, category, sortOrder, isActive, createdAt, stock)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id, name, icon || null, image || null,
      Number(price) || 0, description || null,
      category || 'general', Number(sortOrder) || 0,
      isActive === false ? 0 : 1, now,
      Number(stock) || 0
    );

    await auditLog({
      userId: session?.sub,
      action: 'admin_update_config',
      details: { target: 'supply', name },
      status: 'success',
    });

    return NextResponse.json({
      supply: {
        id, name, icon, image,
        price: Number(price) || 0,
        description,
        category: category || 'general',
        sortOrder: Number(sortOrder) || 0,
        isActive: isActive === false ? 0 : 1,
        stock: Number(stock) || 0,
        createdAt: now,
      },
    });
  } catch (error) {
    console.error('创建供品失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureOfferingSupplyTable();

    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: '缺少供品 ID' }, { status: 400 });

    const existing = await queryFirst('SELECT * FROM OfferingSupply WHERE id = ?', id);
    if (!existing) return NextResponse.json({ error: '供品不存在' }, { status: 404 });

    const fields: string[] = [];
    const params: any[] = [];
    const fieldMap: Record<string, string> = {
      name: 'name',
      icon: 'icon',
      image: 'image',
      price: 'price',
      description: 'description',
      category: 'category',
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

    await auditLog({
      userId: session?.sub,
      action: 'admin_update_config',
      details: { target: 'supply', id },
      status: 'success',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新供品失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
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
      return NextResponse.json({ error: '缺少供品 ID' }, { status: 400 });
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

    await auditLog({
      userId: session?.sub,
      action: 'admin_update_config',
      details: { target: 'supply', id: ids.join(',') },
      status: 'success',
    });

    return NextResponse.json({ success: true, count: ids.length });
  } catch (error) {
    console.error('删除供品失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}