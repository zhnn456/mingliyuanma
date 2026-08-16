import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { queryFirst, queryAll, execute } from '@/lib/d1';
import { auditLog } from '@/lib/audit';

async function ensureTable() {
  await execute(`CREATE TABLE IF NOT EXISTS ContactMessage (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(200) NOT NULL,
    subject VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    reply TEXT,
    repliedBy VARCHAR(64),
    repliedAt DATETIME NULL,
    clientIP VARCHAR(100),
    userAgent TEXT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
}

export async function GET(req: NextRequest) {
  const { allowed } = await requireAdmin(req);
  if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });
  await ensureTable();

  const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
  const pageSize = parseInt(req.nextUrl.searchParams.get('pageSize') || '20');
  const status = req.nextUrl.searchParams.get('status') || '';
  const q = req.nextUrl.searchParams.get('q') || '';
  const offset = (page - 1) * pageSize;

  let sql = 'SELECT * FROM ContactMessage WHERE 1=1';
  const params: any[] = [];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (q) { sql += ' AND (name LIKE ? OR email LIKE ? OR content LIKE ? OR subject LIKE ?)'; params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`); }
  sql += ` ORDER BY createdAt DESC LIMIT ${pageSize} OFFSET ${offset}`;
  const messages = await queryAll(sql, ...params);

  let countSql = 'SELECT COUNT(*) as total FROM ContactMessage WHERE 1=1';
  const countParams: any[] = [];
  if (status) { countSql += ' AND status = ?'; countParams.push(status); }
  if (q) { countSql += ' AND (name LIKE ? OR email LIKE ? OR content LIKE ? OR subject LIKE ?)'; countParams.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`); }
  const countRow = await queryFirst(countSql, ...countParams) as any;

  const totalRow = await queryFirst('SELECT COUNT(*) as c FROM ContactMessage') as any;
  const pendingRow = await queryFirst("SELECT COUNT(*) as c FROM ContactMessage WHERE status = 'pending'") as any;
  const repliedRow = await queryFirst("SELECT COUNT(*) as c FROM ContactMessage WHERE status = 'replied'") as any;
  const closedRow = await queryFirst("SELECT COUNT(*) as c FROM ContactMessage WHERE status = 'closed'") as any;
  const today = new Date().toISOString().split('T')[0];
  const todayRow = await queryFirst("SELECT COUNT(*) as c FROM ContactMessage WHERE DATE(createdAt) = ?", today) as any;

  return NextResponse.json({
    messages,
    total: countRow?.total || 0,
    page,
    pageSize,
    stats: {
      total: totalRow?.c || 0,
      pending: pendingRow?.c || 0,
      replied: repliedRow?.c || 0,
      closed: closedRow?.c || 0,
      todayNew: todayRow?.c || 0,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const { allowed, session } = await requireAdmin(req);
  if (!allowed || !session) return NextResponse.json({ error: '无权限' }, { status: 403 });
  await ensureTable();

  try {
    const body = await req.json();
    const { id, action, reply, status } = body;

    if (!id) return NextResponse.json({ error: '缺少消息ID' }, { status: 400 });

    // 回复
    if (action === 'reply') {
      if (!reply || !reply.trim()) return NextResponse.json({ error: '回复内容不能为空' }, { status: 400 });
      await execute(
        `UPDATE ContactMessage SET reply = ?, status = 'replied', repliedBy = ?, repliedAt = NOW(), updatedAt = NOW() WHERE id = ?`,
        reply.trim(), session.userId || session.sub, id
      );
      await auditLog({
        userId: session?.sub,
        action: 'admin_update_config',
        details: { target: 'contact_message', id },
        status: 'success',
      });
      return NextResponse.json({ success: true });
    }

    // 更新状态
    if (action === 'status' && status) {
      const valid = ['pending', 'replied', 'closed'];
      if (!valid.includes(status)) return NextResponse.json({ error: '状态无效' }, { status: 400 });
      await execute('UPDATE ContactMessage SET status = ?, updatedAt = NOW() WHERE id = ?', status, id);
      await auditLog({
        userId: session?.sub,
        action: 'admin_update_config',
        details: { target: 'contact_message', id },
        status: 'success',
      });
      return NextResponse.json({ success: true });
    }

    // 标记已读（pending → read，但保持简洁用 replied 之外的状态）
    if (action === 'read') {
      await execute("UPDATE ContactMessage SET status = IF(status='pending','read',status), updatedAt = NOW() WHERE id = ?", id);
      await auditLog({
        userId: session?.sub,
        action: 'admin_update_config',
        details: { target: 'contact_message', id },
        status: 'success',
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: '未知操作' }, { status: 400 });
  } catch (err: any) {
    console.error('[admin/contact-messages] PATCH error:', err);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}
