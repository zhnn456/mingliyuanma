import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

    const type = req.nextUrl.searchParams.get('type');

    // 排行榜 - 所有用户的供奉金额排名
    if (type === 'leaderboard') {
      const topUsers = await prisma.offeringRecord.groupBy({
        by: ['userId'],
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } },
        take: 20,
      });

      const userIds = topUsers.map(u => u.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true, avatar: true },
      });
      const userMap = new Map(users.map(u => [u.id, u]));

      const leaderboard = topUsers.map((u, index) => {
        const userInfo = userMap.get(u.userId);
        return {
          rank: index + 1,
          userId: u.userId,
          name: userInfo?.name || userInfo?.email?.split('@')[0] || '善信',
          avatar: userInfo?.avatar,
          totalAmount: u._sum.amount || 0,
          count: u._count,
        };
      });

      return NextResponse.json({ leaderboard });
    }

    // 我的供奉记录
    if (type === 'records') {
      const records = await prisma.offeringRecord.findMany({
        where: { userId: user.id },
        include: { item: { select: { name: true, image: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return NextResponse.json({ records });
    }

    // 到期提醒
    if (type === 'expiring') {
      const now = new Date();
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const expiringRecords = await prisma.offeringRecord.findMany({
        where: {
          userId: user.id,
          status: 'active',
          endDate: { not: null, lte: sevenDaysLater },
        },
        include: { item: { select: { name: true } } },
        orderBy: { endDate: 'asc' },
      });
      return NextResponse.json({ records: expiringRecords });
    }

    // 默认 - 供奉分类和物品
    const categories = await prisma.offeringCategory.findMany({
      where: { isActive: true },
      include: {
        items: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('获取供奉数据失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

    const body = await req.json();
    const { itemId, quantity, dedication, type: supplyType } = body;

    if (!itemId) {
      return NextResponse.json({ error: '请选择供奉物品' }, { status: 400 });
    }

    const item = await prisma.offeringItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return NextResponse.json({ error: '供奉物品不存在' }, { status: 404 });
    }

    const sType = supplyType || 'single';
    const price = item.priceSingle || 10;
    const amount = price * (quantity || 1);

    let endDate: Date | null = null;
    const now = new Date();
    if (sType === 'monthly') {
      endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else if (sType === 'yearly') {
      endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    }

    const record = await prisma.offeringRecord.create({
      data: {
        userId: user.id,
        itemId,
        amount,
        type: sType,
        supplyIds: dedication ? JSON.stringify({ dedication }) : null,
        endDate,
        status: endDate ? 'active' : 'completed',
      },
    });

    return NextResponse.json({ record, message: '供奉成功，功德无量' });
  } catch (error) {
    console.error('供奉失败:', error);
    return NextResponse.json({ error: '供奉失败，请重试' }, { status: 500 });
  }
}
