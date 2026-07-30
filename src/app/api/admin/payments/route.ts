import { requireAdmin } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll } from '@/lib/d1';

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    let sql = `SELECT p.*, u.email as userEmail, u.name as userName, o.orderNo as orderNo, o.type as orderType
               FROM "Payment" p
               LEFT JOIN "User" u ON p.userId = u.id
               LEFT JOIN "Order" o ON p.orderId = o.id
               WHERE 1=1`;
    let countSql = `SELECT COUNT(*) as total FROM "Payment" WHERE 1=1`;
    const params: any[] = [];

    if (status) {
      sql += ' AND p.status = ?';
      countSql += ' AND status = ?';
      params.push(status);
    }
    if (startDate) {
      sql += ' AND p.createdAt >= ?';
      countSql += ' AND createdAt >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND p.createdAt <= ?';
      countSql += ' AND createdAt <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY p.createdAt DESC LIMIT ? OFFSET ?';
    params.push(pageSize, (page - 1) * pageSize);

    const payments = await queryAll(sql, ...params);
    const total = (await queryFirst(countSql, ...(status ? [status] : []), ...(startDate ? [startDate] : []), ...(endDate ? [endDate] : [])) as any)?.total || 0;

    return NextResponse.json({ payments, total, page, pageSize });
  } catch (error) {
    console.error('获取支付记录失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
