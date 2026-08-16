import { requirePrimaryAdmin } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll, execute } from '@/lib/d1';
import { auditLog } from '@/lib/audit';

const DEFAULT_RATE = 0.2;

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requirePrimaryAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const summary = searchParams.get('summary');

    if (summary === 'true') {
      return getSummary(req);
    }

    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const agentId = searchParams.get('agentId') || '';

    const params: any[] = [];
    let sql = `SELECT s.*, a.companyName, a.contactName, o.orderNo, o.amount as orderAmount, o.type as orderType
               FROM AgentShare s
               LEFT JOIN Agent a ON s.agentId = a.id
               LEFT JOIN "Order" o ON s.orderId = o.id
               WHERE 1=1`;
    let countSql = `SELECT COUNT(*) as total FROM AgentShare WHERE 1=1`;

    if (status) {
      sql += ' AND s.status = ?';
      countSql += ' AND status = ?';
      params.push(status);
    }
    if (agentId) {
      sql += ' AND s.agentId = ?';
      countSql += ' AND agentId = ?';
      params.push(agentId);
    }
    if (startDate) {
      sql += ' AND s.createdAt >= ?';
      countSql += ' AND createdAt >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND s.createdAt <= ?';
      countSql += ' AND createdAt <= ?';
      params.push(endDate);
    }

    sql += ` ORDER BY s.createdAt DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;

    const shares = await queryAll(sql, ...params);
    const totalResult = await queryFirst(countSql, ...params);
    const total = (totalResult as any)?.total || 0;

    return NextResponse.json({ shares, total, page, pageSize });
  } catch (error) {
    console.error('获取分润列表失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

async function getSummary(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'month';
    const agentId = searchParams.get('agentId') || '';

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'quarter': {
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      }
      case 'year': {
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      }
      default: {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
    }

    const startStr = startDate.toISOString();
    const endStr = now.toISOString();

    const params: any[] = [startStr, endStr];
    let sql = `SELECT
               COUNT(*) as totalRecords,
               COALESCE(SUM(shareAmount), 0) as totalShare,
               COALESCE(SUM(CASE WHEN status = 'settled' THEN shareAmount ELSE 0 END), 0) as settledAmount,
               COALESCE(SUM(CASE WHEN status = 'pending' THEN shareAmount ELSE 0 END), 0) as pendingAmount
               FROM AgentShare WHERE createdAt >= ? AND createdAt <= ?`;

    if (agentId) {
      sql += ' AND agentId = ?';
      params.push(agentId);
    }

    const summary = await queryFirst(sql, ...params) as any;

    let agentBreakdown: any[] = [];
    if (!agentId) {
      let breakdownSql = `SELECT a.id as agentId, a.companyName, a.contactName,
                          COALESCE(SUM(s.shareAmount), 0) as totalShare,
                          COALESCE(SUM(CASE WHEN s.status = 'settled' THEN s.shareAmount ELSE 0 END), 0) as settledAmount,
                          COALESCE(SUM(CASE WHEN s.status = 'pending' THEN s.shareAmount ELSE 0 END), 0) as pendingAmount,
                          COUNT(s.id) as recordCount
                          FROM Agent a
                          LEFT JOIN AgentShare s ON a.id = s.agentId AND s.createdAt >= ? AND s.createdAt <= ?
                          GROUP BY a.id, a.companyName, a.contactName
                          ORDER BY totalShare DESC`;
      agentBreakdown = await queryAll(breakdownSql, startStr, endStr);
    }

    return NextResponse.json({
      period,
      summary: {
        totalRecords: summary?.totalRecords || 0,
        totalShare: summary?.totalShare || 0,
        settledAmount: summary?.settledAmount || 0,
        pendingAmount: summary?.pendingAmount || 0,
      },
      agentBreakdown,
    });
  } catch (error) {
    console.error('获取分润汇总失败:', error);
    return NextResponse.json({ error: '获取汇总失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed } = await requirePrimaryAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const body = await req.json();
    const { agentId, orderId, rate, period } = body;

    if (!agentId || !orderId) {
      return NextResponse.json({ error: '代理商和订单为必填项' }, { status: 400 });
    }

    const agent = await queryFirst('SELECT * FROM Agent WHERE id = ?', agentId);
    if (!agent) {
      return NextResponse.json({ error: '代理商不存在' }, { status: 404 });
    }

    const order = await queryFirst('SELECT * FROM "Order" WHERE id = ?', orderId);
    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 });
    }

    const existing = await queryFirst(
      'SELECT * FROM AgentShare WHERE agentId = ? AND orderId = ?',
      agentId, orderId
    );
    if (existing) {
      return NextResponse.json({ error: '该订单已存在分润记录' }, { status: 400 });
    }

    const shareRate = rate || DEFAULT_RATE;
    const shareAmount = parseFloat(order.amount) * shareRate;
    const now = new Date().toISOString();
    const id = `as_${Date.now()}`;
    const periodStr = period || now.slice(0, 7);

    await execute(
      `INSERT INTO AgentShare (id, agentId, orderId, amount, rate, shareAmount, status, period, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      id, agentId, orderId, order.amount, shareRate, shareAmount, periodStr, now
    );

    const share = await queryFirst('SELECT * FROM AgentShare WHERE id = ?', id);
    return NextResponse.json({ share });
  } catch (error) {
    console.error('创建分润记录失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { allowed, session } = await requirePrimaryAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const body = await req.json();
    const { ids, action } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: '请选择要操作的记录' }, { status: 400 });
    }

    const now = new Date().toISOString();

    if (action === 'settle') {
      for (const id of ids) {
        await execute(
          'UPDATE AgentShare SET status = ?, settledAt = ? WHERE id = ? AND status = ?',
          'settled', now, id, 'pending'
        );
      }
    } else if (action === 'cancel') {
      for (const id of ids) {
        await execute(
          'UPDATE AgentShare SET status = ? WHERE id = ? AND status = ?',
          'cancelled', id, 'pending'
        );
      }
    } else {
      return NextResponse.json({ error: '无效的操作类型' }, { status: 400 });
    }

    await auditLog({
      userId: session?.sub,
      action: 'admin_update_agent',
      details: { ids, action },
      status: 'success',
    });
    return NextResponse.json({ success: true, updatedCount: ids.length });
  } catch (error) {
    console.error('批量结算失败:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}