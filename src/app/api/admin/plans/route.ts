/**
 * 会员套餐管理API
 * 功能：套餐列表查询、创建/更新套餐（定价/时长/功能描述）、排序管理
 * 用途：管理销售套餐配置，控制各会员等级的权益和价格
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { queryAll, queryFirst, execute } from '@/lib/d1';
import { auditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const { allowed } = await requireAdmin(req);
  if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  const offset = (page - 1) * pageSize;

  const rows = await queryAll(
    `SELECT * FROM MembershipPlan ORDER BY sortOrder ASC, createdAt DESC LIMIT ${pageSize} OFFSET ${offset}`,
  );
  const countRow = await queryFirst('SELECT COUNT(*) as total FROM MembershipPlan') as any;

  return NextResponse.json({ rows, total: countRow?.total || 0, page, pageSize });
}

export async function POST(req: NextRequest) {
  const { allowed, session } = await requireAdmin(req);
  if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

  const body = await req.json();
  const { id, name, level, price, duration, description, features, sortOrder, isActive } = body;

  if (!name || !level) {
    return NextResponse.json({ error: '缺少必填字段（name, level）' }, { status: 400 });
  }

  const now = new Date().toISOString();

  if (id) {
    await execute(
      `UPDATE MembershipPlan
       SET name = ?, level = ?, price = ?, duration = ?, description = ?, features = ?,
           sortOrder = ?, isActive = ?
       WHERE id = ?`,
      name, level, price ?? 0, duration ?? null, description ?? null,
      features ?? null, sortOrder ?? 0, isActive !== undefined ? (isActive ? 1 : 0) : 1,
      id
    );
    await auditLog({
      userId: session?.sub,
      action: 'admin_update_config',
      details: { target: 'plan', name },
      status: 'success',
    });
    return NextResponse.json({ success: true, id });
  } else {
    const existing = await queryFirst('SELECT id FROM MembershipPlan WHERE level = ?', level);
    if (existing) {
      return NextResponse.json({ error: '该等级套餐已存在' }, { status: 400 });
    }
    const newId = `mp_${Date.now()}`;
    await execute(
      `INSERT INTO MembershipPlan
       (id, name, level, price, duration, description, features, isActive, sortOrder, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      newId, name, level, price ?? 0, duration ?? null, description ?? null,
      features ?? null, isActive !== undefined ? (isActive ? 1 : 0) : 1, sortOrder ?? 0, now
    );
    await auditLog({
      userId: session?.sub,
      action: 'admin_update_config',
      details: { target: 'plan', name },
      status: 'success',
    });
    return NextResponse.json({ success: true, id: newId });
  }
}

export async function PUT(req: NextRequest) {
  const { allowed, session } = await requireAdmin(req);
  if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

  const { id, isActive } = await req.json();
  if (!id) return NextResponse.json({ error: '缺少套餐ID' }, { status: 400 });

  await execute(
    'UPDATE MembershipPlan SET isActive = ? WHERE id = ?',
    isActive ? 1 : 0, id
  );

  await auditLog({
    userId: session?.sub,
    action: 'admin_update_config',
    details: { target: 'plan', id },
    status: 'success',
  });
  return NextResponse.json({ success: true });
}