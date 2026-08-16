import { requirePrimaryAdmin } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll, execute } from '@/lib/d1';

async function ensureTable() {
  await execute(`CREATE TABLE IF NOT EXISTS AgentSettlement (
    id VARCHAR(255) PRIMARY KEY,
    agentId VARCHAR(255) NOT NULL,
    period VARCHAR(50) NOT NULL,
    totalAmount DOUBLE DEFAULT 0,
    commissionRate VARCHAR(50),
    commissionAmount DOUBLE DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    paidAt DATETIME,
    remark TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME
  )`);
}

function generateId() {
  return `set_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requirePrimaryAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const period = searchParams.get('period') || '';
    const status = searchParams.get('status') || '';
    const action = searchParams.get('action') || '';

    // 统计
    if (action === 'stats') {
      const allRow = await queryFirst(
        "SELECT COALESCE(SUM(totalAmount), 0) as totalAmount, COALESCE(SUM(commissionAmount), 0) as commission FROM AgentSettlement"
      ) as any;
      const paidRow = await queryFirst(
        "SELECT COALESCE(SUM(totalAmount), 0) as paidAmount FROM AgentSettlement WHERE status = 'paid'"
      ) as any;
      const pendingRow = await queryFirst(
        "SELECT COALESCE(SUM(totalAmount), 0) as pendingAmount FROM AgentSettlement WHERE status = 'pending'"
      ) as any;
      let periodCommission = 0;
      if (period) {
        const pRow = await queryFirst(
          "SELECT COALESCE(SUM(commissionAmount), 0) as commission FROM AgentSettlement WHERE period = ?",
          period
        ) as any;
        periodCommission = pRow?.commission || 0;
      }
      return NextResponse.json({
        totalAmount: allRow?.totalAmount || 0,
        paidAmount: paidRow?.paidAmount || 0,
        pendingAmount: pendingRow?.pendingAmount || 0,
        periodCommission,
      });
    }

    let sql = `SELECT s.*, a.companyName, a.contactName, a.contactPhone, u.email as agentEmail, u.name as userName
               FROM AgentSettlement s
               LEFT JOIN Agent a ON s.agentId = a.id
               LEFT JOIN User u ON a.userId = u.id
               WHERE 1=1`;
    let countSql = 'SELECT COUNT(*) as total FROM AgentSettlement WHERE 1=1';
    const params: any[] = [];

    if (period) {
      sql += ' AND s.period = ?';
      countSql += ' AND period = ?';
      params.push(period);
    }
    if (status) {
      sql += ' AND s.status = ?';
      countSql += ' AND status = ?';
      params.push(status);
    }

    sql += ` ORDER BY s.createdAt DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;

    const data = await queryAll(sql, ...params);

    const countParams: any[] = [];
    if (period) countParams.push(period);
    if (status) countParams.push(status);
    const totalRow = await queryFirst(countSql, ...countParams) as any;

    return NextResponse.json({ data, total: totalRow?.total || 0, page, pageSize });
  } catch (error) {
    console.error('获取结算列表失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed } = await requirePrimaryAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();

    const body = await req.json();
    const { action, agentId, period, totalAmount, commissionRate, commissionAmount, remark } = body;

    // 批量生成本期结算
    if (action === 'generate') {
      if (!period) return NextResponse.json({ error: '请选择结算周期' }, { status: 400 });

      const agents = await queryAll('SELECT id FROM Agent WHERE isActive = 1') as any[];
      if (agents.length === 0) return NextResponse.json({ error: '没有活跃的代理商' }, { status: 400 });

      const now = new Date().toISOString();
      let created = 0;
      for (const agent of agents) {
        const existing = await queryFirst(
          'SELECT id FROM AgentSettlement WHERE agentId = ? AND period = ?',
          agent.id, period
        );
        if (existing) continue;

        const id = generateId();
        await execute(
          `INSERT INTO AgentSettlement (id, agentId, period, totalAmount, commissionRate, commissionAmount, status, remark, createdAt, updatedAt)
           VALUES (?, ?, ?, 0, '0%', 0, 'pending', ?, ?, ?)`,
          id, agent.id, period, remark || null, now, now
        );
        created++;
      }

      return NextResponse.json({ success: true, created, message: `已为 ${created} 个代理商生成结算记录` });
    }

    // 单条创建
    if (!agentId || !period) {
      return NextResponse.json({ error: '代理商和结算周期为必填项' }, { status: 400 });
    }

    const existing = await queryFirst(
      'SELECT id FROM AgentSettlement WHERE agentId = ? AND period = ?',
      agentId, period
    );
    if (existing) return NextResponse.json({ error: '该代理商本周期已存在结算记录' }, { status: 400 });

    const id = generateId();
    const now = new Date().toISOString();
    await execute(
      `INSERT INTO AgentSettlement (id, agentId, period, totalAmount, commissionRate, commissionAmount, status, remark, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
      id, agentId, period, totalAmount || 0, commissionRate || '0%', commissionAmount || 0,
      remark || null, now, now
    );

    const row = await queryFirst(
      `SELECT s.*, a.companyName, a.contactName FROM AgentSettlement s LEFT JOIN Agent a ON s.agentId = a.id WHERE s.id = ?`,
      id
    );
    return NextResponse.json({ data: row });
  } catch (error) {
    console.error('创建结算记录失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { allowed } = await requirePrimaryAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();

    const body = await req.json();
    const { id, status, remark, totalAmount, commissionRate, commissionAmount } = body;

    if (!id) return NextResponse.json({ error: '缺少结算ID' }, { status: 400 });

    const existing = await queryFirst('SELECT * FROM AgentSettlement WHERE id = ?', id);
    if (!existing) return NextResponse.json({ error: '结算记录不存在' }, { status: 404 });

    const fields: string[] = [];
    const params: any[] = [];

    if (status !== undefined) { fields.push('status = ?'); params.push(status); }
    if (remark !== undefined) { fields.push('remark = ?'); params.push(remark); }
    if (totalAmount !== undefined) { fields.push('totalAmount = ?'); params.push(totalAmount); }
    if (commissionRate !== undefined) { fields.push('commissionRate = ?'); params.push(commissionRate); }
    if (commissionAmount !== undefined) { fields.push('commissionAmount = ?'); params.push(commissionAmount); }

    // 标记已付时记录支付时间
    if (status === 'paid') {
      fields.push('paidAt = ?');
      params.push(new Date().toISOString());
    }

    if (fields.length === 0) return NextResponse.json({ error: '没有要更新的字段' }, { status: 400 });

    fields.push('updatedAt = ?');
    params.push(new Date().toISOString());
    params.push(id);

    await execute(`UPDATE AgentSettlement SET ${fields.join(', ')} WHERE id = ?`, ...params);
    const row = await queryFirst(
      `SELECT s.*, a.companyName, a.contactName FROM AgentSettlement s LEFT JOIN Agent a ON s.agentId = a.id WHERE s.id = ?`,
      id
    );
    return NextResponse.json({ data: row });
  } catch (error) {
    console.error('更新结算记录失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { allowed } = await requirePrimaryAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: '缺少结算ID' }, { status: 400 });

    await execute('DELETE FROM AgentSettlement WHERE id = ?', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除结算记录失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
