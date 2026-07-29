import { requireAdmin, requireAgent, requireAuth } from '@/lib/security';
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll, execute, getUserStats } from '@/lib/d1';

export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin();
    if (!session || session?.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const keyword = searchParams.get('keyword') || '';

    let sql = "SELECT id, email, name, phone, role, memberLevel, memberExpiry, dailyUsage, lastUsageDate, createdAt FROM User";
    let countSql = "SELECT COUNT(*) as total FROM User";
    const params: any[] = [];

    if (keyword) {
      const like = `%${keyword}%`;
      sql += ` WHERE email LIKE ? OR name LIKE ? OR phone LIKE ?`;
      countSql += ` WHERE email LIKE ? OR name LIKE ? OR phone LIKE ?`;
      params.push(like, like, like);
    }

    sql += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    params.push(pageSize, (page - 1) * pageSize);

    const users = await queryAll(sql, ...params) as any[];
    const totalRow = await queryFirst(countSql, ...(keyword ? [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`] : [])) as any;

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
    const { allowed, session } = await requireAdmin();
    if (!session || session?.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, memberLevel, role, memberExpiry } = body;
    if (!userId) return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });

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
      updates.push('memberExpiry = ?');
      params.push(memberExpiry ? new Date(memberExpiry).toISOString() : null);
    }

    if (updates.length === 0) return NextResponse.json({ error: '没有要更新的字段' }, { status: 400 });

    updates.push('updatedAt = ?');
    params.push(new Date().toISOString());
    params.push(userId);

    const existing = await queryFirst('SELECT id FROM User WHERE id = ?', userId);
    if (!existing) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

    await execute(`UPDATE User SET ${updates.join(', ')} WHERE id = ?`, ...params);
    const user = await queryFirst('SELECT id, email, name, role, memberLevel, memberExpiry FROM User WHERE id = ?', userId);

    return NextResponse.json({ user });
  } catch (error) {
    console.error('更新用户失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}
