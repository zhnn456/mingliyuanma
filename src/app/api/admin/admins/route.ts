import { requireAdmin } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll, execute } from '@/lib/d1';
import { hashPassword } from '@/lib/password';

function generateId() {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const keyword = searchParams.get('keyword') || '';

    let sql = "SELECT id, email, phone, name, role, createdAt, updatedAt FROM User WHERE role IN ('admin', 'editor')";
    let countSql = "SELECT COUNT(*) as total FROM User WHERE role IN ('admin', 'editor')";
    const params: any[] = [];

    if (keyword) {
      sql += ' AND (email LIKE ? OR name LIKE ? OR phone LIKE ?)';
      countSql += ' AND (email LIKE ? OR name LIKE ? OR phone LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    sql += ` ORDER BY createdAt DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;

    const data = await queryAll(sql, ...params);

    const countParams: any[] = [];
    if (keyword) countParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    const totalRow = await queryFirst(countSql, ...countParams) as any;

    return NextResponse.json({ data, total: totalRow?.total || 0, page, pageSize });
  } catch (error) {
    console.error('获取管理员列表失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const body = await req.json();
    const { email, name, phone, role, password } = body;

    if (!email || !password || !role) {
      return NextResponse.json({ error: '邮箱、密码和角色为必填项' }, { status: 400 });
    }

    if (!['admin', 'editor'].includes(role)) {
      return NextResponse.json({ error: '无效的角色，仅支持 admin 或 editor' }, { status: 400 });
    }

    const existing = await queryFirst('SELECT id FROM User WHERE email = ?', email);
    if (existing) return NextResponse.json({ error: '该邮箱已被注册' }, { status: 400 });

    const id = generateId();
    const now = new Date().toISOString();
    const passwordHash = await hashPassword(password);

    await execute(
      `INSERT INTO User (id, email, phone, name, passwordHash, role, memberLevel, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 'free', ?, ?)`,
      id, email, phone || null, name || null, passwordHash, role, now, now
    );

    const row = await queryFirst('SELECT id, email, phone, name, role, createdAt FROM User WHERE id = ?', id);
    return NextResponse.json({ data: row });
  } catch (error) {
    console.error('创建管理员失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const body = await req.json();
    const { id, name, phone, role } = body;

    if (!id) return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });

    const existing = await queryFirst('SELECT id, role FROM User WHERE id = ?', id);
    if (!existing) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
    if (role !== undefined) {
      if (!['admin', 'editor'].includes(role)) {
        return NextResponse.json({ error: '无效的角色' }, { status: 400 });
      }
      // 如果要把当前唯一的 admin 降级，阻止
      if (existing.role === 'admin' && role !== 'admin') {
        const countRow = await queryFirst("SELECT COUNT(*) as cnt FROM User WHERE role = 'admin'") as any;
        if ((countRow?.cnt || 0) <= 1) {
          return NextResponse.json({ error: '不能降级最后一个管理员' }, { status: 400 });
        }
      }
      updates.push('role = ?');
      params.push(role);
    }

    if (updates.length === 0) return NextResponse.json({ error: '没有要更新的字段' }, { status: 400 });

    updates.push('updatedAt = ?');
    params.push(new Date().toISOString());
    params.push(id);

    await execute(`UPDATE User SET ${updates.join(', ')} WHERE id = ?`, ...params);
    const row = await queryFirst('SELECT id, email, phone, name, role, createdAt FROM User WHERE id = ?', id);
    return NextResponse.json({ data: row });
  } catch (error) {
    console.error('更新管理员失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });

    const existing = await queryFirst('SELECT id, role FROM User WHERE id = ?', id);
    if (!existing) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

    if (existing.role === 'admin') {
      const countRow = await queryFirst("SELECT COUNT(*) as cnt FROM User WHERE role = 'admin'") as any;
      if ((countRow?.cnt || 0) <= 1) {
        return NextResponse.json({ error: '不能移除最后一个管理员权限' }, { status: 400 });
      }
    }

    // 不删除用户，仅将角色降级为普通用户
    const now = new Date().toISOString();
    await execute('UPDATE User SET role = ?, updatedAt = ? WHERE id = ?', 'user', now, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('移除管理员权限失败:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}
