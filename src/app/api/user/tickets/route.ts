import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security';
import { queryAll, execute } from '@/lib/d1';

export async function GET(req: NextRequest) {
  const { allowed, session } = await requireAuth(req);
  if (!allowed || !session) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const tickets = await queryAll('SELECT * FROM Ticket WHERE userId = ? ORDER BY createdAt DESC', session.user.id);
  // 查各工单的最新消息
  const ticketsWithMsg = await Promise.all(tickets.map(async (t: any) => {
    const lastMsg = await queryAll('SELECT content, createdAt FROM TicketMessage WHERE ticketId = ? ORDER BY createdAt DESC LIMIT 1', (t as any).id);
    return { ...t, lastMessage: (lastMsg as any[])[0] || null };
  }));
  return NextResponse.json({ tickets: ticketsWithMsg });
}

export async function POST(req: NextRequest) {
  const { allowed, session } = await requireAuth(req);
  if (!allowed || !session) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { title, category, content } = await req.json();
  if (!title || !content) return NextResponse.json({ error: '请填写标题和内容' }, { status: 400 });

  const ticketId = `tkt_${Date.now()}`;
  const msgId = `tkm_${Date.now()}`;
  const now = new Date().toISOString();

  await execute('INSERT INTO Ticket (id, userId, title, category, status, priority, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ticketId, session.user.id, title, category || 'other', 'open', 'normal', now, now);
  await execute('INSERT INTO TicketMessage (id, ticketId, userId, content, isStaff, createdAt) VALUES (?, ?, ?, ?, 0, ?)',
    msgId, ticketId, session.user.id, content, now);

  return NextResponse.json({ ticketId });
}
