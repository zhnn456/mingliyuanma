/**
 * 订单管理API
 * 功能：订单列表查询、订单状态更新、支持按代理商隔离和状态筛选
 * 用法：GET ?page=1&status=paid - 查询订单；PUT - 更新订单状态并记录审计日志
 */
import { requireAdmin } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll, execute } from '@/lib/d1';
import { auditLog } from '@/lib/audit';

/**
 * 获取当前请求的agentId
 */
function getAgentId(req: NextRequest): string | null {
  return req.headers.get('x-agent-id') || null;
}

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const agentId = getAgentId(req);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status') || '';

    let sql = `SELECT o.*, u.email as userEmail, u.name as userName FROM "Order" o LEFT JOIN User u ON o.userId = u.id WHERE 1=1`;
    let countSql = `SELECT COUNT(*) as total FROM "Order" o LEFT JOIN User u ON o.userId = u.id WHERE 1=1`;
    const params: any[] = [];

    // 代理商数据隔离：只查看属于该代理商的订单
    if (agentId) {
      sql += ' AND u.agentId = ?';
      countSql += ' AND u.agentId = ?';
      params.push(agentId);
    }

    if (status) {
      sql += ' AND o.status = ?';
      countSql += ' AND o.status = ?';
      params.push(status);
    }

    // mysql2 prepared statement 不支持 LIMIT ? OFFSET ?，用整数拼接（已 parseInt 安全）
    const offset = Math.max(0, (page - 1) * pageSize);
    const limit = Math.max(1, Math.min(100, pageSize));
    sql += ` ORDER BY o.createdAt DESC LIMIT ${limit} OFFSET ${offset}`;

    const orders = await queryAll(sql, ...params);
    const total = (await queryFirst(countSql, ...params) as any)?.total || 0;
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

    const agentId = getAgentId(req);
    const { orderId, status } = await req.json();
    if (!orderId || !status) return NextResponse.json({ error: '参数不足' }, { status: 400 });

    // 代理商只能修改自己的订单
    if (agentId) {
      const order = await queryFirst(
        'SELECT o.id FROM "Order" o JOIN User u ON o.userId = u.id WHERE o.id = ? AND u.agentId = ?',
        orderId, agentId
      ) as any;
      if (!order) return NextResponse.json({ error: '订单不存在或无权限' }, { status: 404 });
    }

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
