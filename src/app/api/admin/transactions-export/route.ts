import { requireAdmin } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll, execute } from '@/lib/d1';

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';

    let sql = `SELECT p.*, o.orderNo, o.type as orderType, o.status as orderStatus, o.amount as orderAmount,
               u.email as userEmail, u.name as userName
               FROM "Payment" p
               LEFT JOIN "Order" o ON p.orderId = o.id
               LEFT JOIN "User" u ON p.userId = u.id
               WHERE 1=1`;
    let countSql = `SELECT COUNT(*) as total FROM "Payment" WHERE 1=1`;
    const params: any[] = [];

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
    if (status) {
      sql += ' AND p.status = ?';
      countSql += ' AND status = ?';
      params.push(status);
    }
    if (type) {
      sql += ' AND o.type = ?';
      countSql += ' AND id IN (SELECT id FROM "Order" WHERE type = ?)';
      params.push(type);
    }

    sql += ` ORDER BY p.createdAt DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;

    const transactions = await queryAll(sql, ...params);

    const countParams: any[] = [];
    if (startDate) countParams.push(startDate);
    if (endDate) countParams.push(endDate);
    if (status) countParams.push(status);
    if (type) countParams.push(type);
    const total = (await queryFirst(countSql, ...countParams) as any)?.total || 0;

    const exportTasks = await queryAll(
      `SELECT * FROM ExportTask ORDER BY createdAt DESC LIMIT 50`
    );

    return NextResponse.json({ transactions, total, page, pageSize, exportTasks });
  } catch (error) {
    console.error('获取交易流水失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { type, format, params } = await req.json();
    if (!type) return NextResponse.json({ error: '参数不足' }, { status: 400 });

    const id = `exp_${Date.now()}`;
    const now = new Date().toISOString();
    await execute(
      `INSERT INTO ExportTask (id, type, format, status, params, createdBy, createdAt, updatedAt)
       VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)`,
      id, type, format || 'csv', params ? JSON.stringify(params) : null, session?.id || null, now, now
    );

    return NextResponse.json({ id, status: 'pending' });
  } catch (error) {
    console.error('创建导出任务失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}