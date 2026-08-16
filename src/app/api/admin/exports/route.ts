import { requireAdmin } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll, execute } from '@/lib/d1';
import { auditLog } from '@/lib/audit';

async function ensureTable() {
  await execute(`CREATE TABLE IF NOT EXISTS ExportTask (
    id VARCHAR(255) PRIMARY KEY,
    type TEXT NOT NULL,
    format VARCHAR(50) DEFAULT 'csv',
    status VARCHAR(50) DEFAULT 'pending',
    fileUrl TEXT,
    params TEXT,
    createdBy TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT
  )`);
}

function generateId() {
  return `exp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const keyword = searchParams.get('keyword') || '';
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';

    let sql = 'SELECT * FROM ExportTask WHERE 1=1';
    let countSql = 'SELECT COUNT(*) as total FROM ExportTask WHERE 1=1';
    const params: any[] = [];

    if (keyword) {
      sql += ' AND (type LIKE ? OR id LIKE ?)';
      countSql += ' AND (type LIKE ? OR id LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (type) {
      sql += ' AND type = ?';
      countSql += ' AND type = ?';
      params.push(type);
    }
    if (status) {
      sql += ' AND status = ?';
      countSql += ' AND status = ?';
      params.push(status);
    }

    sql += ` ORDER BY createdAt DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;

    const data = await queryAll(sql, ...params);

    const countParams: any[] = [];
    if (keyword) countParams.push(`%${keyword}%`, `%${keyword}%`);
    if (type) countParams.push(type);
    if (status) countParams.push(status);
    const totalRow = await queryFirst(countSql, ...countParams) as any;

    return NextResponse.json({ data, total: totalRow?.total || 0, page, pageSize });
  } catch (error) {
    console.error('获取导出任务列表失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();

    const body = await req.json();
    const { type, format, params: taskParams } = body;

    if (!type) return NextResponse.json({ error: '导出类型为必填项' }, { status: 400 });

    const VALID_TYPES = ['users', 'orders', 'records', 'transactions', 'members', 'agents', 'coupons'];
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: '无效的导出类型' }, { status: 400 });
    }

    const fmt = format || 'csv';
    if (!['csv', 'xlsx'].includes(fmt)) {
      return NextResponse.json({ error: '无效的导出格式' }, { status: 400 });
    }

    const id = generateId();
    const now = new Date().toISOString();
    await execute(
      `INSERT INTO ExportTask (id, type, format, status, params, createdBy, createdAt, updatedAt)
       VALUES (?, ?, ?, 'processing', ?, ?, ?, ?)`,
      id, type, fmt, taskParams ? JSON.stringify(taskParams) : null, session?.id || null, now, now
    );

    const row = await queryFirst('SELECT * FROM ExportTask WHERE id = ?', id);
    await auditLog({
      userId: session?.sub,
      action: 'admin_update_config',
      details: { target: 'export', type },
      status: 'success',
    });
    return NextResponse.json({ data: row });
  } catch (error) {
    console.error('创建导出任务失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: '缺少任务ID' }, { status: 400 });

    await execute('DELETE FROM ExportTask WHERE id = ?', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除导出任务失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
