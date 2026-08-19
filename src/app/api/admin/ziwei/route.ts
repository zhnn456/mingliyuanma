/**
 * 管理后台 · 紫微斗数排盘记录管理
 *
 * 查询用户排盘记录 + 删除
 */
import { requireAdmin } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll, execute } from '@/lib/d1';
import { auditLog } from '@/lib/audit';

function startOfTodayISO() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

function normalizeEndDate(endDate: string) {
  return endDate.length === 10 ? endDate + 'T23:59:59.999Z' : endDate;
}

/**
 * GET /api/admin/ziwei
 * 分页查询紫微斗数排盘记录，支持 keyword/startDate/endDate 筛选
 */
export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const keyword = searchParams.get('keyword') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const where: string[] = [];
    const params: any[] = [];
    if (keyword) {
      where.push('(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR zr.birthDate LIKE ?)');
      const like = `%${keyword}%`;
      params.push(like, like, like, like);
    }
    if (startDate) {
      where.push('zr.createdAt >= ?');
      params.push(startDate);
    }
    if (endDate) {
      where.push('zr.createdAt <= ?');
      params.push(normalizeEndDate(endDate));
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const offset = (page - 1) * pageSize;
    const records = await queryAll(
      `SELECT zr.id, zr.userId, zr.gender, zr.birthDate, zr.birthTime, zr.isLunar, zr.mingGong, zr.createdAt,
              u.name as userName, u.email as userEmail, u.phone as userPhone
       FROM ZiweiRecord zr LEFT JOIN User u ON zr.userId = u.id
       ${whereSql} ORDER BY zr.createdAt DESC LIMIT ${pageSize} OFFSET ${offset}`,
      ...params
    );

    const countRow = await queryFirst(
      `SELECT COUNT(*) as total FROM ZiweiRecord zr LEFT JOIN User u ON zr.userId = u.id ${whereSql}`,
      ...params
    ) as any;

    const totalRow = await queryFirst('SELECT COUNT(*) as total FROM ZiweiRecord') as any;
    const todayRow = await queryFirst(
      'SELECT COUNT(*) as total FROM ZiweiRecord WHERE createdAt >= ?',
      startOfTodayISO()
    ) as any;

    return NextResponse.json({
      data: records,
      total: countRow?.total || 0,
      page,
      pageSize,
      stats: {
        total: totalRow?.total || 0,
        today: todayRow?.total || 0,
      },
    });
  } catch (error) {
    console.error('获取紫微斗数记录失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/ziwei?id=xxx
 * 删除指定排盘记录，支持 body.ids 批量删除
 */
export async function DELETE(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      await execute('DELETE FROM ZiweiRecord WHERE id = ?', id);
      await auditLog({
        userId: session?.sub,
        action: 'admin_update_config',
        details: { target: 'ziwei_record', id },
        status: 'success',
      });
      return NextResponse.json({ success: true });
    }

    const body = await req.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
    if (!ids.length) return NextResponse.json({ error: '缺少记录ID' }, { status: 400 });

    for (const rid of ids) {
      await execute('DELETE FROM ZiweiRecord WHERE id = ?', rid);
    }
    await auditLog({
      userId: session?.sub,
      action: 'admin_update_config',
      details: { target: 'ziwei_record', count: ids.length, ids },
      status: 'success',
    });
    return NextResponse.json({ success: true, count: ids.length });
  } catch (error) {
    console.error('删除紫微斗数记录失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
