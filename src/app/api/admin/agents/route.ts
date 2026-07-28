import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin, sanitizeString } from '@/lib/security';
import { hashPassword } from '@/lib/password';
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

    const userIds = agents.map(a => a.userId);
    const agentIds = agents.map(a => a.id);

    // 批量查询用户信息（优化 N+1）
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, name: true, memberLevel: true, createdAt: true },
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    // 批量统计客户数
    const customerCounts = await prisma.siteConfig.groupBy({
      by: ['value'],
      where: { category: 'agent_customer', value: { in: agentIds } },
      _count: true,
    });
    const customerCountMap = new Map(customerCounts.map(c => [c.value, c._count]));

    const agentsWithStats = agents.map((agent) => {
      const user = userMap.get(agent.userId);
      const customerCount = customerCountMap.get(agent.id) || 0;
      return { ...agent, user, _count: { customers: customerCount } };
    });

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
      const password = body.password || (() => {
        // 生成随机 12 位密码
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        const buf = new Uint8Array(12);
        globalThis.crypto.getRandomValues(buf);
        return Array.from(buf).map(b => chars[b % chars.length]).join('');
      })();

      if (!email) {
        return NextResponse.json({ error: '请提供代理商登录邮箱' }, { status: 400 });
      }

      // 检查邮箱是否已存在
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return NextResponse.json({ error: '该邮箱已注册' }, { status: 400 });
      }

      const passwordHash = await hashPassword(password);

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
      const randomPart = Array.from(new Uint8Array(4), x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
      const licenseKey = `AGT-${Date.now()}-${randomPart}`;

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
      const randomPart = Array.from(new Uint8Array(4), x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
      const newLicenseKey = `AGT-${Date.now()}-${randomPart}`;

      // 吊销旧授权
      await prisma.agentLicense.updateMany({
        where: { agentId, status: 'active' },
        data: { status: 'revoked' },
      });

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
      action: 'admin_update_user',
      details: { agentId, updated: Object.keys(updateData) },
      status: 'success',
    });

    return NextResponse.json({ agent });
  } catch (error) {
    console.error('更新代理商失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}
