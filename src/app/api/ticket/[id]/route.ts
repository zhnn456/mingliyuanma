import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth-server';
import { queryFirst, queryAll, execute } from '@/lib/d1';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { allowed, session } = await requireAuth(req);
  if (!allowed || !session) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const ticket = await queryFirst('SELECT * FROM Ticket WHERE id = ?', id) as any;
  if (!ticket) return NextResponse.json({ error: '工单不存在' }, { status: 404 });
  if (ticket.userId !== session.sub && session.role !== 'admin')
    return NextResponse.json({ error: '无权访问' }, { status: 403 });

  const messages = await queryAll('SELECT * FROM TicketMessage WHERE ticketId = ? ORDER BY createdAt ASC', id);
  return NextResponse.json({ ticket, messages });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { allowed, session } = await requireAuth(req);
  if (!allowed || !session) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const ticket = await queryFirst('SELECT * FROM Ticket WHERE id = ?', id) as any;
  if (!ticket) return NextResponse.json({ error: '工单不存在' }, { status: 404 });
  if (ticket.userId !== session.sub && session.role !== 'admin')
    return NextResponse.json({ error: '无权访问' }, { status: 403 });

  const { content } = await req.json();
  if (!content) return NextResponse.json({ error: '请输入内容' }, { status: 400 });

  const msgId = `tkm_${Date.now()}`;
  const now = new Date().toISOString();
  const isStaff = session.role === 'admin' ? 1 : 0;
  await execute('INSERT INTO TicketMessage (id, ticketId, userId, content, isStaff, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
    msgId, id, session.sub, content, isStaff, now);
  await execute('UPDATE Ticket SET status = ?, updatedAt = ? WHERE id = ?', ticket.status === 'closed' ? 'open' : ticket.status, now, id);

  return NextResponse.json({ message: '发送成功' });
}
