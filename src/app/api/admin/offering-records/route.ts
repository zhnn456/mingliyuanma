/**
 * 供奉记录查询API
 * 功能：供奉订单记录查询，支持按用户/状态/时间筛选
 * 用途：供奉活动订单管理、用户供奉记录查看
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { queryFirst, queryAll } from '@/lib/d1';

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.max(1, parseInt(searchParams.get('pageSize') || '20'));
    const keyword = (searchParams.get('keyword') || '').trim();
    const status = searchParams.get('status') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const offset = (page - 1) * pageSize;

    const where: string[] = [];
    const params: any[] = [];
    if (keyword) {
      where.push('(u.email LIKE ? OR u.name LIKE ? OR oi.name LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (status && status !== 'all') {
      where.push('r.status = ?');
      params.push(status);
    }
    if (startDate) {
      where.push('date(r.createdAt) >= date(?)');
      params.push(startDate);
    }
    if (endDate) {
      where.push('date(r.createdAt) <= date(?)');
      params.push(endDate);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const rows = await queryAll(
      `SELECT r.*, u.email as userEmail, u.name as userName, u.phone as userPhone,
              oi.name as itemName, oi.category as categoryId
       FROM OfferingRecord r
       LEFT JOIN User u ON r.userId = u.id
       LEFT JOIN OfferingSupply oi ON r.itemId = oi.id
       ${whereSql}
       ORDER BY r.createdAt DESC
       LIMIT ${pageSize} OFFSET ${offset}`,
      ...params
    );

    const countRow = await queryFirst(
      `SELECT COUNT(*) as total
       FROM OfferingRecord r
       LEFT JOIN User u ON r.userId = u.id
       LEFT JOIN OfferingSupply oi ON r.itemId = oi.id
       ${whereSql}`,
      ...params
    ) as any;

    const total = countRow?.total || 0;

    // 统计卡片数据
    const [totalRow, activeRow, endedRow, amountRow] = await Promise.all([
      queryFirst('SELECT COUNT(*) as cnt FROM OfferingRecord') as any,
      queryFirst("SELECT COUNT(*) as cnt FROM OfferingRecord WHERE status = 'active'") as any,
      queryFirst("SELECT COUNT(*) as cnt FROM OfferingRecord WHERE status = 'ended'") as any,
      queryFirst('SELECT COALESCE(SUM(amount), 0) as total FROM OfferingRecord') as any,
    ]);

    return NextResponse.json({
      data: rows,
      total,
      page,
      pageSize,
      stats: {
        total: totalRow?.cnt || 0,
        active: activeRow?.cnt || 0,
        ended: endedRow?.cnt || 0,
        totalAmount: amountRow?.total || 0,
      },
    });
  } catch (error) {
    console.error('获取供奉记录失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
