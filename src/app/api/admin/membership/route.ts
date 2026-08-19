/**
 * 会员统计分析API
 * 功能：查询各会员等级用户分布统计，用于运营决策和会员体系分析
 * 用途：了解会员结构、评估套餐吸引力、指导营销策略
 */
import { requireAdmin } from '@/lib/auth-server';
import { auditLog } from '@/lib/audit';
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll, execute } from '@/lib/d1';

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const offset = (page - 1) * pageSize;

    const plans = await queryAll(
      `SELECT * FROM MembershipPlan ORDER BY sortOrder ASC, createdAt DESC LIMIT ${pageSize} OFFSET ${offset}`,
    );
    const total = (await queryFirst('SELECT COUNT(*) as total FROM MembershipPlan') as any)?.total || 0;

    const userStats = await queryAll(
      'SELECT memberLevel, COUNT(*) as count FROM User WHERE memberLevel IS NOT NULL AND memberLevel != \'\' GROUP BY memberLevel'
    );

    return NextResponse.json({ plans, total, page, pageSize, userStats });
  } catch (error) {
    console.error('获取会员套餐失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { name, level, price, duration, description, features, isActive, sortOrder } = await req.json();

    if (!name || !level) {
      return NextResponse.json({ error: '缺少必填字段（name, level）' }, { status: 400 });
    }

    const existing = await queryFirst('SELECT id FROM MembershipPlan WHERE level = ?', level);
    if (existing) {
      return NextResponse.json({ error: '该等级已存在' }, { status: 400 });
    }

    const id = `mp_${Date.now()}`;
    const now = new Date().toISOString();

    await execute(
      `INSERT INTO MembershipPlan
       (id, name, level, price, duration, description, features, isActive, sortOrder, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id, name, level, price ?? 0, duration ?? null, description ?? null,
      features ?? null, isActive !== undefined ? (isActive ? 1 : 0) : 1, sortOrder ?? 0, now
    );

    return NextResponse.json({ plan: { id, name, level, price, duration, isActive: 1, sortOrder: sortOrder ?? 0 } });
  } catch (error) {
    console.error('创建会员套餐失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: '缺少套餐ID' }, { status: 400 });
    }

    const fields: string[] = [];
    const params: any[] = [];

    if (body.name !== undefined && body.name !== null) {
      fields.push('name = ?');
      params.push(body.name);
    }
    if (body.level !== undefined && body.level !== null) {
      fields.push('level = ?');
      params.push(body.level);
    }
    if (body.price !== undefined && body.price !== null) {
      fields.push('price = ?');
      params.push(body.price);
    }
    if (body.duration !== undefined) {
      fields.push('duration = ?');
      params.push(body.duration);
    }
    if (body.description !== undefined) {
      fields.push('description = ?');
      params.push(body.description);
    }
    if (body.features !== undefined) {
      fields.push('features = ?');
      params.push(body.features);
    }
    if (body.isActive !== undefined && body.isActive !== null) {
      fields.push('isActive = ?');
      params.push(body.isActive ? 1 : 0);
    }
    if (body.sortOrder !== undefined && body.sortOrder !== null) {
      fields.push('sortOrder = ?');
      params.push(body.sortOrder);
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: '没有需要更新的字段' }, { status: 400 });
    }

    params.push(id);
    await execute(
      `UPDATE MembershipPlan SET ${fields.join(', ')} WHERE id = ?`,
      ...params
    );

    const plan = await queryFirst('SELECT * FROM MembershipPlan WHERE id = ?', id);
    await auditLog({
      userId: session?.sub,
      action: 'admin_update_user',
      details: { userId: id, plan: id },
      status: 'success',
    });
    return NextResponse.json({ plan });
  } catch (error) {
    console.error('更新会员套餐失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: '缺少套餐ID' }, { status: 400 });
    }

    await execute('UPDATE MembershipPlan SET isActive = 0 WHERE id = ?', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除会员套餐失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}