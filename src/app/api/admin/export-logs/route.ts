import { requireAdmin } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll, execute } from '@/lib/d1';

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

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const keyword = searchParams.get('keyword') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    // 仅展示已完成的导出记录
    let sql = "SELECT * FROM ExportTask WHERE status = 'completed'";
    let countSql = "SELECT COUNT(*) as total FROM ExportTask WHERE status = 'completed'";
    const params: any[] = [];

    if (keyword) {
      sql += ' AND (type LIKE ? OR id LIKE ? OR fileUrl LIKE ?)';
      countSql += ' AND (type LIKE ? OR id LIKE ? OR fileUrl LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (startDate) {
      sql += ' AND createdAt >= ?';
      countSql += ' AND createdAt >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND createdAt <= ?';
      countSql += ' AND createdAt <= ?';
      params.push(endDate);
    }

    sql += ` ORDER BY createdAt DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;

    const data = await queryAll(sql, ...params);

    const countParams: any[] = [];
    if (keyword) countParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    if (startDate) countParams.push(startDate);
    if (endDate) countParams.push(endDate);
    const totalRow = await queryFirst(countSql, ...countParams) as any;

    // 统计信息
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthStartStr = monthStart.toISOString();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartStr = todayStart.toISOString();

    const monthRow = await queryFirst(
      "SELECT COUNT(*) as cnt FROM ExportTask WHERE status = 'completed' AND createdAt >= ?",
      monthStartStr
    ) as any;
    const todayRow = await queryFirst(
      "SELECT COUNT(*) as cnt FROM ExportTask WHERE status = 'completed' AND createdAt >= ?",
      todayStartStr
    ) as any;
    const allRow = await queryFirst(
      "SELECT COUNT(*) as cnt FROM ExportTask WHERE status = 'completed'"
    ) as any;

    return NextResponse.json({
      data,
      total: totalRow?.total || 0,
      page,
      pageSize,
      stats: {
        total: allRow?.cnt || 0,
        monthCount: monthRow?.cnt || 0,
        todayCount: todayRow?.cnt || 0,
      },
    });
  } catch (error) {
    console.error('获取导出记录失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    // 清理旧导出记录（30天前）
    if (action === 'cleanup') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const result = await execute(
        "DELETE FROM ExportTask WHERE status = 'completed' AND createdAt < ?",
        cutoff.toISOString()
      );
      return NextResponse.json({ success: true, message: '已清理30天前的导出记录' });
    }

    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: '缺少记录ID' }, { status: 400 });
    await execute('DELETE FROM ExportTask WHERE id = ?', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除导出记录失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
