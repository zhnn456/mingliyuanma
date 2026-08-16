import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll, execute } from '@/lib/d1';
import { requireAgent } from '@/lib/auth-server'
import { sanitizeString } from '@/lib/security';
import { hashPassword } from '@/lib/password';
import { auditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAgent(req);
    if (!allowed || !session) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const userId = session.sub;
    const agent = await queryFirst('SELECT * FROM Agent WHERE userId = ?', userId);
    if (!agent) {
      return NextResponse.json({ error: '代理商信息不存在' }, { status: 404 });
    }

    const customerLinks = await queryAll(
      'SELECT * FROM SiteConfig WHERE category = ? AND value = ?',
      'agent_customer', (agent as any).id
    );
    const customerIds = customerLinks.map((c: any) => c.key.replace('agent_customer:', ''));

    if (customerIds.length === 0) {
      return NextResponse.json({ customers: [], total: 0 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const placeholders = customerIds.map(() => '?').join(',');

    const customers = await queryAll(
      `SELECT id, email, name, phone, memberLevel, memberExpiry, dailyUsage, lastUsageDate, createdAt,
       (SELECT COUNT(*) FROM BaziRecord WHERE userId = u.id) as baziCount,
       (SELECT COUNT(*) FROM ZiweiRecord WHERE userId = u.id) as ziweiCount,
       (SELECT COUNT(*) FROM QimenRecord WHERE userId = u.id) as qimenCount,
       (SELECT COUNT(*) FROM MeihuaRecord WHERE userId = u.id) as meihuaCount
       FROM User u WHERE u.id IN (${placeholders}) ORDER BY u.createdAt DESC LIMIT ${limit} OFFSET ${offset}`,
      ...customerIds
    );

    const totalResult = await queryFirst(
      `SELECT COUNT(*) as total FROM User WHERE id IN (${placeholders})`,
      ...customerIds
    );

    return NextResponse.json({
      customers: (customers as any[]).map((c: any) => ({
        ...c,
        totalRecords: (c.baziCount || 0) + (c.ziweiCount || 0) + (c.qimenCount || 0) + (c.meihuaCount || 0),
      })),
      total: (totalResult as any)?.total || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('获取客户列表失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAgent(req);
    if (!allowed || !session) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const agentUserId = session.sub;
    const agent = await queryFirst('SELECT * FROM Agent WHERE userId = ?', agentUserId);
    if (!agent) {
      return NextResponse.json({ error: '代理商信息不存在' }, { status: 404 });
    }

    const license = await queryFirst(
      'SELECT * FROM AgentLicense WHERE agentId = ? AND status = ? ORDER BY createdAt DESC',
      (agent as any).id, 'active'
    );

    if (!license) {
      return NextResponse.json({ error: '授权已过期或无效' }, { status: 403 });
    }

    if ((license as any).expiryAt && new Date((license as any).expiryAt) < new Date()) {
      return NextResponse.json({ error: '授权已过期' }, { status: 403 });
    }

    const customerCountResult = await queryFirst(
      'SELECT COUNT(*) as count FROM SiteConfig WHERE category = ? AND value = ?',
      'agent_customer', (agent as any).id
    );
    const customerCount = (customerCountResult as any)?.count || 0;

    if ((license as any).maxUsers && customerCount >= (license as any).maxUsers) {
      return NextResponse.json({ error: `已达最大用户数限制（${(license as any).maxUsers}人）` }, { status: 403 });
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

    const existing = await queryFirst('SELECT * FROM User WHERE email = ?', email);
    if (existing) {
      return NextResponse.json({ error: '该邮箱已注册' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    const memberExpiry = memberLevel !== 'free' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null;

    await execute(
      `INSERT INTO User (id, email, passwordHash, name, phone, role, memberLevel, memberExpiry, createdAt)
       VALUES (?, ?, ?, ?, ?, 'user', ?, ?, ?)`,
      userId, email, passwordHash, name, phone || null, memberLevel, memberExpiry, now
    );

    await execute(
      `INSERT INTO SiteConfig ("key", value, category, updatedAt) VALUES (?, ?, ?, ?)`,
      `agent_customer:${userId}`, (agent as any).id, 'agent_customer', now
    );

    await auditLog({
      userId: agentUserId,
      action: 'agent_update_customer',
      details: { customerId: userId, email, name, action: 'create' },
      status: 'success',
    });

    return NextResponse.json({
      message: '客户创建成功',
      customer: {
        id: userId,
        email,
        name,
        memberLevel,
      },
      credentials: { email, password },
    });
  } catch (error) {
    console.error('创建客户失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}