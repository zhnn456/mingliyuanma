import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { requireAgent, sanitizeString } from '@/lib/security';
import { hashPassword } from '@/lib/password';
import { auditLog } from '@/lib/audit';

/**
 * 代理商客户管理
 * GET: 获取客户列表
 * POST: 添加客户（创建用户并关联到代理商）
 */
export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAgent();
    if (!allowed || !session) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const agent = await prisma.agent.findUnique({ where: { userId } });
    if (!agent) {
      return NextResponse.json({ error: '代理商信息不存在' }, { status: 404 });
    }

    // 获取关联的客户ID
    const customerLinks = await prisma.siteConfig.findMany({
      where: { category: 'agent_customer', value: agent.id },
    });
    const customerIds = customerLinks.map(c => c.key.replace('agent_customer:', ''));

    if (customerIds.length === 0) {
      return NextResponse.json({ customers: [], total: 0 });
    }

    // 分页
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // 查询客户
    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: customerIds } },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          memberLevel: true,
          memberExpiry: true,
          dailyUsage: true,
          lastUsageDate: true,
          createdAt: true,
          _count: {
            select: {
              baziRecords: true,
              ziweiRecords: true,
              qimenRecords: true,
              meihuaRecords: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where: { id: { in: customerIds } } }),
    ]);

    return NextResponse.json({
      customers: customers.map((c: any) => ({
        ...c,
        totalRecords: c._count.baziRecords + c._count.ziweiRecords + c._count.qimenRecords + c._count.meihuaRecords,
      })),
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error('获取客户列表失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

/**
 * 代理商为客户创建账号
 */
export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAgent();
    if (!allowed || !session) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const agentUserId = (session.user as any).id;
    const agent = await prisma.agent.findUnique({ where: { userId: agentUserId } });
    if (!agent) {
      return NextResponse.json({ error: '代理商信息不存在' }, { status: 404 });
    }

    // 检查授权和用户数限制
    const license = await prisma.agentLicense.findFirst({
      where: { agentId: agent.id, status: 'active' },
    });

    if (!license) {
      return NextResponse.json({ error: '授权已过期或无效' }, { status: 403 });
    }

    if (license.expiryAt && license.expiryAt < new Date()) {
      return NextResponse.json({ error: '授权已过期' }, { status: 403 });
    }

    // 统计当前客户数
    const customerCount = await prisma.siteConfig.count({
      where: { category: 'agent_customer', value: agent.id },
    });

    if (license.maxUsers && customerCount >= license.maxUsers) {
      return NextResponse.json({ error: `已达最大用户数限制（${license.maxUsers}人）` }, { status: 403 });
    }

    const body = await req.json();
    const email = sanitizeString(body.email || '').toLowerCase();
    const name = sanitizeString(body.name || '');
    const phone = sanitizeString(body.phone || '');
    const password = body.password || '12345678';
    const memberLevel = body.memberLevel || 'free';

    if (!email) {
      return NextResponse.json({ error: '请输入邮箱' }, { status: 400 });
    }

    // 检查邮箱是否已存在
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: '该邮箱已注册' }, { status: 400 });
    }

    // 创建用户
      const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        phone: phone || null,
        role: 'user',
        memberLevel,
        memberExpiry: memberLevel !== 'free' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null,
      },
    });

    // 关联到代理商
    await prisma.siteConfig.create({
      data: {
        key: `agent_customer:${user.id}`,
        value: agent.id,
        category: 'agent_customer',
      },
    });

    await auditLog({
      userId: agentUserId,
      action: 'agent_update_customer',
      details: { customerId: user.id, email, name, action: 'create' },
      status: 'success',
    });

    return NextResponse.json({
      message: '客户创建成功',
      customer: {
        id: user.id,
        email: user.email,
        name: user.name,
        memberLevel: user.memberLevel,
      },
      credentials: { email, password },
    });
  } catch (error) {
    console.error('创建客户失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}
