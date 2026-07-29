import { requireAdmin } from '@/lib/security';
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll, execute } from '@/lib/d1';

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin();
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status') || '';
    let sql = `SELECT o.*, u.email as userEmail, u.name as userName FROM "Order" o LEFT JOIN User u ON o.userId = u.id WHERE 1=1`;
    let countSql = `SELECT COUNT(*) as total FROM "Order" WHERE 1=1`;
    const params: any[] = [];
    if (status) { sql += ' AND o.status = ?'; countSql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY o.createdAt DESC LIMIT ? OFFSET ?';
    params.push(pageSize, (page - 1) * pageSize);
    const orders = await queryAll(sql, ...params);
    const total = (await queryFirst(countSql, ...(status ? [status] : [])) as any)?.total || 0;
    return NextResponse.json({ orders, total, page, pageSize });
  } catch (error) {
    console.error('获取订单失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin();
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });
    const { orderId, status } = await req.json();
    if (!orderId || !status) return NextResponse.json({ error: '参数不足' }, { status: 400 });
    await execute('UPDATE "Order" SET status = ?, updatedAt = ? WHERE id = ?', status, new Date().toISOString(), orderId);
    const order = await queryFirst('SELECT * FROM "Order" WHERE id = ?', orderId);
    return NextResponse.json({ order });
  } catch (error) {
    console.error('更新订单失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}
