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

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const keyword = searchParams.get('keyword') || '';

    const where = keyword
      ? { OR: [{ email: { contains: keyword } }, { name: { contains: keyword } }, { phone: { contains: keyword } }] }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true, email: true, name: true, phone: true, role: true,
          memberLevel: true, memberExpiry: true, dailyUsage: true,
          lastUsageDate: true, createdAt: true,
          _count: { select: { baziRecords: true, ziweiRecords: true, orders: true, offerings: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ users, total, page, pageSize });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, memberLevel, role, memberExpiry } = body;

    if (!userId) return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });

    const updateData: any = {};
    if (memberLevel) updateData.memberLevel = memberLevel;
    if (role) updateData.role = role;
    if (memberExpiry) updateData.memberExpiry = new Date(memberExpiry);

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('更新用户失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}
