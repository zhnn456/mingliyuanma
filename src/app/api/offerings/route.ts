import { NextRequest, NextResponse } from 'next/server';
import { queryAll } from '@/lib/d1';

const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  buddha: { label: '佛像类', icon: '🪷', color: 'bg-amber-50 text-amber-700' },
  deity: { label: '神像类', icon: '⚡', color: 'bg-blue-50 text-blue-700' },
  ritual: { label: '法器类', icon: '🔔', color: 'bg-purple-50 text-purple-700' },
  offering: { label: '供品类', icon: '🌸', color: 'bg-pink-50 text-pink-700' },
  deliverance: { label: '追思祈福类', icon: '🪷', color: 'bg-indigo-50 text-indigo-700' },
};

function formatSupply(s: any) {
  return {
    id: s.id,
    name: s.name,
    icon: s.icon,
    image: s.image,
    price: s.price,
    description: s.description,
    category: s.category,
    sortOrder: s.sortOrder,
    stock: s.stock,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    let rows: any[];
    if (category) {
      rows = await queryAll(
        'SELECT * FROM OfferingSupply WHERE isActive = 1 AND category = ? ORDER BY sortOrder ASC',
        category
      );
    } else {
      rows = await queryAll(
        'SELECT * FROM OfferingSupply WHERE isActive = 1 ORDER BY category ASC, sortOrder ASC'
      );
    }

    const supplyMap = new Map<string, any[]>();
    for (const row of rows) {
      const cat = row.category;
      if (!supplyMap.has(cat)) supplyMap.set(cat, []);
      supplyMap.get(cat)!.push(row);
    }

    const categories: any[] = [];
    const activeKeys = category ? [category] : Object.keys(CATEGORY_META);

    for (const key of activeKeys) {
      const meta = CATEGORY_META[key];
      if (!meta) continue;
      const items = supplyMap.get(key) || [];
      categories.push({
        value: key,
        label: meta.label,
        icon: meta.icon,
        color: meta.color,
        count: items.length,
        supplies: items.map(formatSupply),
      });
    }

    const supplies = rows.map(formatSupply);

    return NextResponse.json({ categories, supplies });
  } catch (error) {
    console.error('获取供奉供品数据失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}