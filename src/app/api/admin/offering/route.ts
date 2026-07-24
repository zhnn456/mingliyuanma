import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const [categories, items, records] = await Promise.all([
      prisma.offeringCategory.findMany({ orderBy: { sortOrder: 'asc' } }),
      prisma.offeringItem.findMany({ orderBy: { sortOrder: 'asc' }, include: { category: true } }),
      prisma.offeringRecord.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { user: { select: { email: true, name: true } }, item: true },
      }),
    ]);

    return NextResponse.json({ categories, items, records });
  } catch (error) {
    console.error('获取供奉数据失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'addCategory') {
      const { name, icon, sortOrder } = body;
      const category = await prisma.offeringCategory.create({ data: { name, icon, sortOrder: sortOrder || 0 } });
      return NextResponse.json({ category });
    }

    if (action === 'addItem') {
      const { categoryId, name, description, priceSingle, priceMonth, priceYear, image, sortOrder } = body;
      const item = await prisma.offeringItem.create({
        data: { categoryId, name, description, priceSingle, priceMonth, priceYear, image, sortOrder: sortOrder || 0 },
      });
      return NextResponse.json({ item });
    }

    if (action === 'toggleItem') {
      const { itemId, isActive } = body;
      const item = await prisma.offeringItem.update({ where: { id: itemId }, data: { isActive } });
      return NextResponse.json({ item });
    }

    return NextResponse.json({ error: '无效操作' }, { status: 400 });
  } catch (error) {
    console.error('供奉管理操作失败:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}
