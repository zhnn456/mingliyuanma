import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { queryFirst, queryAll, execute } from '@/lib/d1';
import { auditLog } from '@/lib/audit';

async function ensureTable() {
  await execute(`CREATE TABLE IF NOT EXISTS TicketMessage (
    id TEXT PRIMARY KEY,
    ticketId TEXT NOT NULL,
    userId TEXT NOT NULL,
    content TEXT NOT NULL,
    isStaff INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  await execute('CREATE INDEX IF NOT EXISTS idx_ticket_message_ticketId ON TicketMessage(ticketId)');
}

export async function GET(req: NextRequest) {
  const { allowed } = await requireAdmin(req);
  if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });
  await ensureTable();

  const id = req.nextUrl.searchParams.get('id');

  if (id) {
    const ticket = await queryFirst(
      'SELECT t.*, u.email as userEmail, u.name as userName FROM Ticket t LEFT JOIN User u ON t.userId = u.id WHERE t.id = ?',
      id
    ) as any;
    if (!ticket) return NextResponse.json({ error: '工单不存在' }, { status: 404 });

    const messages = await queryAll(
      'SELECT * FROM TicketMessage WHERE ticketId = ? ORDER BY createdAt ASC',
      id
    );
    return NextResponse.json({ ticket, messages });
  }

  const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
  const pageSize = parseInt(req.nextUrl.searchParams.get('pageSize') || '20');
  const status = req.nextUrl.searchParams.get('status') || '';
  const q = req.nextUrl.searchParams.get('q') || '';
  const offset = (page - 1) * pageSize;

  let sql = 'SELECT t.*, u.email as userEmail, u.name as userName, (SELECT COUNT(*) FROM TicketMessage WHERE ticketId = t.id) as messageCount FROM Ticket t LEFT JOIN User u ON t.userId = u.id WHERE 1=1';
  const params: any[] = [];
  if (status) { sql += ' AND t.status = ?'; params.push(status); }
  if (q) { sql += ' AND (t.title LIKE ? OR u.name LIKE ? OR u.email LIKE ?)'; params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  sql += ` ORDER BY t.updatedAt DESC LIMIT ${pageSize} OFFSET ${offset}`;
  const tickets = await queryAll(sql, ...params);

  let countSql = 'SELECT COUNT(*) as total FROM Ticket t LEFT JOIN User u ON t.userId = u.id WHERE 1=1';
  const countParams: any[] = [];
  if (status) { countSql += ' AND t.status = ?'; countParams.push(status); }
  if (q) { countSql += ' AND (t.title LIKE ? OR u.name LIKE ? OR u.email LIKE ?)'; countParams.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  const countRow = await queryFirst(countSql, ...countParams) as any;

  const totalRow = await queryFirst('SELECT COUNT(*) as c FROM Ticket') as any;
  const openRow = await queryFirst("SELECT COUNT(*) as c FROM Ticket WHERE status = 'open'") as any;
  const closedRow = await queryFirst("SELECT COUNT(*) as c FROM Ticket WHERE status = 'closed'") as any;
  const today = new Date().toISOString().split('T')[0];
  const todayRow = await queryFirst("SELECT COUNT(*) as c FROM Ticket WHERE DATE(createdAt) = ?", today) as any;

  return NextResponse.json({
    tickets,
    total: countRow?.total || 0,
    page,
    pageSize,
    stats: {
      total: totalRow?.c || 0,
      open: openRow?.c || 0,
      closed: closedRow?.c || 0,
      todayNew: todayRow?.c || 0,
    },
  });
}

export async function POST(req: NextRequest) {
  const { allowed, session } = await requireAdmin(req);
  if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });
  await ensureTable();

  const body = await req.json();
  const action = body.action;

  if (action === 'reply') {
    const { ticketId, content } = body;
    if (!ticketId || !content) return NextResponse.json({ error: '参数不足' }, { status: 400 });

    const ticket = await queryFirst('SELECT * FROM Ticket WHERE id = ?', ticketId) as any;
    if (!ticket) return NextResponse.json({ error: '工单不存在' }, { status: 404 });

    const now = new Date().toISOString();
    const msgId = `tkm_${Date.now()}`;
    await execute(
      'INSERT INTO TicketMessage (id, ticketId, userId, content, isStaff, createdAt) VALUES (?, ?, ?, ?, 1, ?)',
      msgId, ticketId, session.sub, content, now
    );
    await execute('UPDATE Ticket SET updatedAt = ? WHERE id = ?', now, ticketId);
    await auditLog({
      userId: session?.sub,
      action: 'admin_update_config',
      details: { target: 'ticket', title: ticketId },
      status: 'success',
    });
    return NextResponse.json({ success: true, id: msgId });
  }

  if (action === 'close') {
    const { ticketId } = body;
    if (!ticketId) return NextResponse.json({ error: '参数不足' }, { status: 400 });
    await execute('UPDATE Ticket SET status = ?, updatedAt = ? WHERE id = ?', 'closed', new Date().toISOString(), ticketId);
    await auditLog({
      userId: session?.sub,
      action: 'admin_update_config',
      details: { target: 'ticket', title: ticketId },
      status: 'success',
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: '未知操作' }, { status: 400 });
}

export async function PUT(req: NextRequest) {
  const { allowed, session } = await requireAdmin(req);
  if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

  const { ticketId, status } = await req.json();
  if (!ticketId || !status) return NextResponse.json({ error: '参数不足' }, { status: 400 });
  await execute('UPDATE Ticket SET status = ?, updatedAt = ? WHERE id = ?', status, new Date().toISOString(), ticketId);
  await auditLog({
    userId: session?.sub,
    action: 'admin_update_config',
    details: { target: 'ticket', id: ticketId },
    status: 'success',
  });
  return NextResponse.json({ success: true });
}