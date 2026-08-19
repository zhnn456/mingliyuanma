/**
 * 用户管理API
 * 功能：用户列表查询、批量更新会员等级/角色、数据隔离（代理商只看自己的用户）
 * 用法：GET ?page=1&pageSize=20&keyword=xxx - 搜索用户；PUT - 更新用户属性
 */
import { requireAdmin } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll, execute, getUserStats } from '@/lib/d1';
import { buildUserIsolationClause } from '@/lib/test-isolation';
import { auditLog } from '@/lib/audit';

/**
 * 获取当前请求的agentId（用于数据隔离）
 */
function getAgentId(req: NextRequest): string | null {
  return req.headers.get('x-agent-id') || null;
}

export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed || !session) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const keyword = searchParams.get('keyword') || '';

    // 获取当前代理商ID
    const agentId = getAgentId(req);

    // 数据隔离：非主管理员只看测试用户
    const isolation = buildUserIsolationClause(session);

    let sql = "SELECT id, email, name, phone, role, memberLevel, memberExpiryAt, dailyUsage, lastUsageDate, createdAt FROM User";
    let countSql = "SELECT COUNT(*) as total FROM User";
    const params: any[] = [];
    const countParams: any[] = [];
    const whereParts: string[] = [];

    // 代理商数据隔离：只查看属于该代理商的用户
    if (agentId) {
      whereParts.push('agentId = ?');
      params.push(agentId);
      countParams.push(agentId);
    }

    // 隔离条件 - 修复：当PRIMARY_ADMIN_EMAILS为空时不包含NOT IN子句
    if (isolation.where) {
      whereParts.push(`(${isolation.where})`);
      params.push(...isolation.params);
      countParams.push(...isolation.params);
    }

    // 关键词搜索
    if (keyword) {
      const like = `%${keyword}%`;
      whereParts.push('(email LIKE ? OR name LIKE ? OR phone LIKE ?)');
      params.push(like, like, like);
      countParams.push(like, like, like);
    }

    if (whereParts.length > 0) {
      const whereClause = ' WHERE ' + whereParts.join(' AND ');
      sql += whereClause;
      countSql += whereClause;
    }

    // mysql2 prepared statement 不支持 LIMIT ? OFFSET ?，用整数拼接（已 parseInt 安全）
    const offset = Math.max(0, (page - 1) * pageSize);
    const limit = Math.max(1, Math.min(100, pageSize));
    sql += ` ORDER BY createdAt DESC LIMIT ${limit} OFFSET ${offset}`;

    const users = await queryAll(sql, ...params) as any[];
    const totalRow = await queryFirst(countSql, ...countParams) as any;

    // 批量查统计
    const usersWithStats = await Promise.all(users.map(async (u: any) => {
      const stats = await getUserStats(u.id);
      return { ...u, _count: stats };
    }));

    return NextResponse.json({ users: usersWithStats, total: totalRow?.total || 0, page, pageSize });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const agentId = getAgentId(req);
    const body = await req.json();
    const { userId, memberLevel, role, memberExpiry } = body;
    if (!userId) return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });

    // 代理商只能修改自己的用户
    if (agentId) {
      const user = await queryFirst('SELECT id, agentId FROM User WHERE id = ?', userId);
      if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });
      if (user.agentId !== agentId) {
        return NextResponse.json({ error: '无权限修改该用户' }, { status: 403 });
      }
    }

    const VALID_MEMBER_LEVELS = ['free', 'monthly', 'yearly', 'lifetime'];
    const VALID_ROLES = ['user', 'admin', 'agent'];

    const updates: string[] = [];
    const params: any[] = [];

    if (memberLevel !== undefined) {
      if (!VALID_MEMBER_LEVELS.includes(memberLevel)) return NextResponse.json({ error: '无效的会员等级' }, { status: 400 });
      updates.push('memberLevel = ?');
      params.push(memberLevel);
    }
    if (role !== undefined) {
      if (!VALID_ROLES.includes(role)) return NextResponse.json({ error: '无效的角色' }, { status: 400 });
      updates.push('role = ?');
      params.push(role);
    }
    if (memberExpiry !== undefined) {
      updates.push('memberExpiryAt = ?');
      params.push(memberExpiry ? new Date(memberExpiry).toISOString() : null);
    }

    if (updates.length === 0) return NextResponse.json({ error: '没有要更新的字段' }, { status: 400 });

    updates.push('updatedAt = ?');
    params.push(new Date().toISOString());
    params.push(userId);

    const existing = await queryFirst('SELECT id FROM User WHERE id = ?', userId);
    if (!existing) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

    await execute(`UPDATE User SET ${updates.join(', ')} WHERE id = ?`, ...params);

    await auditLog({
      userId: session?.sub,
      action: 'admin_update_user',
      details: { userId, fields: Object.keys(body) },
      status: 'success',
    });

    const user = await queryFirst('SELECT id, email, name, role, memberLevel, memberExpiryAt FROM User WHERE id = ?', userId);

    return NextResponse.json({ user });
  } catch (error) {
    console.error('更新用户失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}
