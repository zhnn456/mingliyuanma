import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin, sanitizeString } from '@/lib/security';
import { auditLog } from '@/lib/audit';

export async function GET() {
  try {
    const { allowed } = await requireAdmin();
    if (!allowed) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const agents = await prisma.agent.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // 统计每个代理商的客户数和收入
    const agentsWithStats = await Promise.all(
      agents.map(async (agent) => {
        // 查询代理商关联的用户信息
        const user = await prisma.user.findUnique({
          where: { id: agent.userId },
          select: { id: true, email: true, name: true, memberLevel: true, createdAt: true },
        });

        // 统计该代理商名下的用户数
        // 暂时通过 siteConfig 记录的 agent-customer 关系来统计
        const customerCount = await prisma.siteConfig.count({
          where: {
            category: 'agent_customer',
            value: agent.id,
          },
        });

        return {
          ...agent,
          user,
          _count: { customers: customerCount },
        };
      })
    );

    return NextResponse.json({ agents: agentsWithStats });
  } catch (error) {
    console.error('获取代理商列表失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin();
    if (!allowed) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const body = await req.json();
    const action = body.action;
    const adminId = (session as any)?.user?.id;

    if (action === 'create') {
      const { companyName, contactName, contactPhone, domain, brandName, licenseExpiry, maxUsers } = body;

      // 验证必填字段
      if (!contactName || !contactPhone) {
        return NextResponse.json({ error: '联系人姓名和电话为必填' }, { status: 400 });
      }

      // 检查域名是否已存在
      if (domain) {
        const existing = await prisma.agent.findUnique({ where: { domain } });
        if (existing) {
          return NextResponse.json({ error: '该域名已被注册' }, { status: 400 });
        }
      }

      // 创建代理商关联的用户账号
      const email = sanitizeString(body.email || '').toLowerCase();
      const password = body.password || 'agent123456';

      if (!email) {
        return NextResponse.json({ error: '请提供代理商登录邮箱' }, { status: 400 });
      }

      // 检查邮箱是否已存在
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return NextResponse.json({ error: '该邮箱已注册' }, { status: 400 });
      }

      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.default.hash(password, 12);

      // 创建用户账号（角色为 agent）
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: contactName,
          phone: contactPhone,
          role: 'agent',
          memberLevel: 'lifetime', // 代理商默认终身会员
        },
      });

      // 生成授权密钥
      const licenseKey = `AGT-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      // 创建代理商记录
      const agent = await prisma.agent.create({
        data: {
          userId: user.id,
          companyName: sanitizeString(companyName || ''),
          contactName: sanitizeString(contactName),
          contactPhone: sanitizeString(contactPhone),
          domain: domain || null,
          brandName: sanitizeString(brandName || companyName || ''),
          licenseKey,
          licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
          siteConfig: JSON.stringify({
            maxUsers: maxUsers || 1000,
            customPricing: false,
            whiteLabel: false,
          }),
        },
      });

      // 创建授权记录
      await prisma.agentLicense.create({
        data: {
          agentId: agent.id,
          licenseKey,
          domain: domain || null,
          maxUsers: maxUsers || 1000,
          expiryAt: licenseExpiry ? new Date(licenseExpiry) : null,
          features: JSON.stringify(['bazi', 'ziwei', 'qimen', 'meihua']),
          status: 'active',
        },
      });

      await auditLog({
        userId: adminId,
        action: 'admin_create_agent',
        details: { agentId: agent.id, email, companyName, domain },
        status: 'success',
      });

      return NextResponse.json({
        agent,
        credentials: { email, password }, // 返回初始密码（仅此一次）
      });
    }

    if (action === 'toggle') {
      const { agentId, isActive } = body;
      const agent = await prisma.agent.update({
        where: { id: agentId },
        data: { isActive },
      });

      // 同步更新授权状态
      await prisma.agentLicense.updateMany({
        where: { agentId },
        data: { status: isActive ? 'active' : 'revoked' },
      });

      await auditLog({
        userId: adminId,
        action: 'admin_toggle_agent',
        details: { agentId, isActive },
        status: 'success',
      });

      return NextResponse.json({ agent });
    }

    if (action === 'regenerate_license') {
      const { agentId } = body;
      const newLicenseKey = `AGT-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      const agent = await prisma.agent.update({
        where: { id: agentId },
        data: { licenseKey: newLicenseKey },
      });

      // 创建新授权
      await prisma.agentLicense.create({
        data: {
          agentId,
          licenseKey: newLicenseKey,
          domain: agent.domain,
          maxUsers: 1000,
          features: JSON.stringify(['bazi', 'ziwei', 'qimen', 'meihua']),
          status: 'active',
        },
      });

      return NextResponse.json({ agent, licenseKey: newLicenseKey });
    }

    return NextResponse.json({ error: '无效操作' }, { status: 400 });
  } catch (error) {
    console.error('代理商管理操作失败:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}

/**
 * 更新代理商信息
 */
export async function PUT(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin();
    if (!allowed) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const body = await req.json();
    const { agentId, companyName, contactName, contactPhone, domain, brandName, logo, licenseExpiry, siteConfig } = body;

    const updateData: any = {};
    if (companyName !== undefined) updateData.companyName = sanitizeString(companyName);
    if (contactName !== undefined) updateData.contactName = sanitizeString(contactName);
    if (contactPhone !== undefined) updateData.contactPhone = sanitizeString(contactPhone);
    if (domain !== undefined) updateData.domain = domain;
    if (brandName !== undefined) updateData.brandName = sanitizeString(brandName);
    if (logo !== undefined) updateData.logo = logo;
    if (licenseExpiry !== undefined) updateData.licenseExpiry = licenseExpiry ? new Date(licenseExpiry) : null;
    if (siteConfig !== undefined) updateData.siteConfig = JSON.stringify(siteConfig);

    const agent = await prisma.agent.update({
      where: { id: agentId },
      data: updateData,
    });

    await auditLog({
      userId: (session as any)?.user?.id,
      action: 'admin_toggle_agent',
      details: { agentId, updated: Object.keys(updateData) },
      status: 'success',
    });

    return NextResponse.json({ agent });
  } catch (error) {
    console.error('更新代理商失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}
