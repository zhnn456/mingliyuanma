/**
 * 退款管理API
 * 功能：退款申请审核、退款记录查询、订单退款处理
 * 用途：售后处理、退款对账
 */
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
    const keyword = searchParams.get('keyword') || '';

    let sql = `SELECT p.*, o.orderNo, u.email as userEmail, u.name as userName
               FROM Payment p
               LEFT JOIN "Order" o ON p.orderId = o.id
               LEFT JOIN User u ON p.userId = u.id
               WHERE p.refundAt IS NOT NULL`;
    let countSql = `SELECT COUNT(*) as total FROM Payment p WHERE p.refundAt IS NOT NULL`;
    const params: any[] = [];

    if (status) {
      sql += ' AND p.status = ?';
      countSql += ' AND status = ?';
      params.push(status);
    }

    if (keyword) {
      sql += ' AND (o.orderNo LIKE ? OR u.email LIKE ? OR u.name LIKE ?)';
      countSql += ' AND (o.orderNo LIKE ? OR u.email LIKE ? OR u.name LIKE ?)';
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw);
    }

    sql += ` ORDER BY p.refundAt DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;

    const refunds = await queryAll(sql, ...params);
    const countParams = [
      ...(status ? [status] : []),
      ...(keyword ? [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`] : []),
    ];
    const total = (await queryFirst(countSql, ...countParams))?.total || 0;

    return NextResponse.json({ refunds, total, page, pageSize });
  } catch (error) {
    console.error('获取退款记录失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { paymentId, refundAmount, remark } = await req.json();
    if (!paymentId) return NextResponse.json({ error: '参数不足' }, { status: 400 });

    const payment = await queryFirst('SELECT * FROM Payment WHERE id = ?', paymentId);
    if (!payment) return NextResponse.json({ error: '支付记录不存在' }, { status: 404 });

    const now = new Date().toISOString();
    const finalAmount = refundAmount !== undefined ? refundAmount : payment.amount;

    await execute(
      `UPDATE Payment
       SET refundAt = ?, refundAmount = ?, remark = ?, updatedAt = ?
       WHERE id = ?`,
      now, finalAmount, remark || '', now, paymentId
    );

    await auditLog({
      userId: session?.sub,
      action: 'admin_update_order',
      details: { refundId: paymentId, status: 'refunded' },
      status: 'success',
    });

    const updated = await queryFirst('SELECT * FROM Payment WHERE id = ?', paymentId);
    return NextResponse.json({ refund: updated });
  } catch (error) {
    console.error('处理退款失败:', error);
    return NextResponse.json({ error: '处理失败' }, { status: 500 });
  }
}
