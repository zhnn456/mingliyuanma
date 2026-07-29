import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { queryAll, execute } from '@/lib/d1';

export async function GET(req: NextRequest) {
  const { allowed } = await requireAdmin(req);
  if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

  const status = req.nextUrl.searchParams.get('status') || '';
  let sql = 'SELECT t.*, u.email as userEmail, u.name as userName FROM Ticket t LEFT JOIN User u ON t.userId = u.id';
  const params: any[] = [];
  if (status) { sql += ' WHERE t.status = ?'; params.push(status); }
  sql += ' ORDER BY t.updatedAt DESC';
  const tickets = await queryAll(sql, ...params);
  return NextResponse.json({ tickets });
}

export async function PUT(req: NextRequest) {
  const { allowed } = await requireAdmin(req);
  if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

  const { ticketId, status } = await req.json();
  if (!ticketId || !status) return NextResponse.json({ error: '参数不足' }, { status: 400 });
  await execute('UPDATE Ticket SET status = ?, updatedAt = ? WHERE id = ?', status, new Date().toISOString(), ticketId);
  return NextResponse.json({ success: true });
}
