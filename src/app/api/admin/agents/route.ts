import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const agents = await prisma.agent.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ agents });
  } catch (error) {
    console.error('获取代理商列表失败:', error);
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

    if (action === 'create') {
      const { userId, companyName, contactName, contactPhone, domain, brandName, logo, licenseExpiry } = body;
      const licenseKey = `AGT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const agent = await prisma.agent.create({
        data: {
          userId, companyName, contactName, contactPhone, domain, brandName, logo,
          licenseKey, licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
        },
      });
      return NextResponse.json({ agent });
    }

    if (action === 'toggle') {
      const { agentId, isActive } = body;
      const agent = await prisma.agent.update({ where: { id: agentId }, data: { isActive } });
      return NextResponse.json({ agent });
    }

    return NextResponse.json({ error: '无效操作' }, { status: 400 });
  } catch (error) {
    console.error('代理商管理操作失败:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}
