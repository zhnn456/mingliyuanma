import { requireAdmin } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll, execute } from '@/lib/d1';

function startOfTodayISO() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

function normalizeEndDate(endDate: string) {
  return endDate.length === 10 ? endDate + 'T23:59:59.999Z' : endDate;
}

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
      where.push('(mr.method LIKE ? OR mr.input LIKE ? OR mr.benGua LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)');
      const like = `%${keyword}%`;
      params.push(like, like, like, like, like, like);
    }
    if (startDate) {
      where.push('mr.createdAt >= ?');
      params.push(startDate);
    }
    if (endDate) {
      where.push('mr.createdAt <= ?');
      params.push(normalizeEndDate(endDate));
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const offset = (page - 1) * pageSize;
    const records = await queryAll(
      `SELECT mr.id, mr.userId, mr.method, mr.input, mr.upperGua, mr.lowerGua, mr.dongYao,
              mr.benGua, mr.huGua, mr.bianGua, mr.tiYong, mr.createdAt,
              u.name as userName, u.email as userEmail, u.phone as userPhone
       FROM MeihuaRecord mr LEFT JOIN User u ON mr.userId = u.id
       ${whereSql} ORDER BY mr.createdAt DESC LIMIT ${pageSize} OFFSET ${offset}`,
      ...params
    );

    const countRow = await queryFirst(
      `SELECT COUNT(*) as total FROM MeihuaRecord mr LEFT JOIN User u ON mr.userId = u.id ${whereSql}`,
      ...params
    ) as any;

    const totalRow = await queryFirst('SELECT COUNT(*) as total FROM MeihuaRecord') as any;
    const todayRow = await queryFirst(
      'SELECT COUNT(*) as total FROM MeihuaRecord WHERE createdAt >= ?',
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
    console.error('获取梅花易数记录失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      await execute('DELETE FROM MeihuaRecord WHERE id = ?', id);
      return NextResponse.json({ success: true });
    }

    const body = await req.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
    if (!ids.length) return NextResponse.json({ error: '缺少记录ID' }, { status: 400 });

    for (const rid of ids) {
      await execute('DELETE FROM MeihuaRecord WHERE id = ?', rid);
    }
    return NextResponse.json({ success: true, count: ids.length });
  } catch (error) {
    console.error('删除梅花易数记录失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
