import { NextRequest, NextResponse } from 'next/server';
import { requireAgent } from '@/lib/auth-server';
import { queryFirst, queryAll } from '@/lib/d1';

export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAgent(req);
    if (!allowed || !session) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const agent = await queryFirst('SELECT * FROM Agent WHERE userId = ?', session.sub) as any;
    if (!agent) return NextResponse.json({ error: '代理商信息不存在' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const offset = (page - 1) * pageSize;

    const conditions: string[] = ['o.agentId = ?'];
    const values: any[] = [agent.id];

    if (status) { conditions.push('o.status = ?'); values.push(status); }
    if (startDate) { conditions.push('o.createdAt >= ?'); values.push(startDate); }
    if (endDate) { conditions.push('o.createdAt <= ?'); values.push(endDate); }

    const where = 'WHERE ' + conditions.join(' AND ');

    const orders = await queryAll(
      `SELECT o.*, u.name as userName, u.email as userEmail,
        CASE o.type
          WHEN 'membership' THEN '会员'
          WHEN 'offering' THEN '服务'
          WHEN 'pdf_report' THEN 'PDF报告'
          WHEN 'recharge' THEN '充值'
          ELSE o.type
        END as productTypeName
       FROM "Order" o
       LEFT JOIN User u ON o.userId = u.id
       ${where}
       ORDER BY o.createdAt DESC LIMIT ${pageSize} OFFSET ${offset}`,
      ...values
    ) as any[];

    const countRow = await queryFirst(
      `SELECT COUNT(*) as total FROM "Order" o ${where}`,
      ...values
    ) as any;

    return NextResponse.json({
      orders,
      total: countRow?.total || 0,
    });
  } catch (error) {
    console.error('获取代理商订单失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}