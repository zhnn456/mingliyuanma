import { requireAdmin } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll, execute } from '@/lib/d1';
import { auditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status') || '';
    let sql = `SELECT o.*, u.email as userEmail, u.name as userName FROM "Order" o LEFT JOIN User u ON o.userId = u.id WHERE 1=1`;
    let countSql = `SELECT COUNT(*) as total FROM "Order" WHERE 1=1`;
    const params: any[] = [];
    if (status) { sql += ' AND o.status = ?'; countSql += ' AND status = ?'; params.push(status); }
    // mysql2 prepared statement 不支持 LIMIT ? OFFSET ?，用整数拼接（已 parseInt 安全）
    const offset = (page - 1) * pageSize;
    sql += ` ORDER BY o.createdAt DESC LIMIT ${pageSize} OFFSET ${offset}`;
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
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });
    const { orderId, status } = await req.json();
    if (!orderId || !status) return NextResponse.json({ error: '参数不足' }, { status: 400 });
    const oldRow = await queryFirst('SELECT status FROM "Order" WHERE id = ?', orderId) as any;
    const oldStatus = oldRow?.status;
    await execute('UPDATE "Order" SET status = ?, updatedAt = ? WHERE id = ?', status, new Date().toISOString(), orderId);

    await auditLog({
      userId: session?.sub,
      action: 'admin_update_order',
      details: { orderId, status, oldStatus },
      status: 'success',
    });

    const order = await queryFirst('SELECT * FROM "Order" WHERE id = ?', orderId);
    return NextResponse.json({ order });
  } catch (error) {
    console.error('更新订单失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}
