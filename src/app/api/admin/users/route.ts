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

    // 校验字段合法值
    const VALID_MEMBER_LEVELS = ['free', 'monthly', 'yearly', 'lifetime'];
    const VALID_ROLES = ['user', 'admin', 'agent'];

    const updateData: any = {};
    if (memberLevel !== undefined) {
      if (!VALID_MEMBER_LEVELS.includes(memberLevel)) {
        return NextResponse.json({ error: '无效的会员等级' }, { status: 400 });
      }
      updateData.memberLevel = memberLevel;
    }
    if (role !== undefined) {
      if (!VALID_ROLES.includes(role)) {
        return NextResponse.json({ error: '无效的角色' }, { status: 400 });
      }
      updateData.role = role;
    }
    if (memberExpiry !== undefined) {
      updateData.memberExpiry = memberExpiry ? new Date(memberExpiry) : null;
    }

    // 先检查用户是否存在
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

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
