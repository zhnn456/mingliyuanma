import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { queryFirst, queryAll, execute, batch } from '@/lib/d1';
import { auditLog } from '@/lib/audit';

async function ensureTable() {
  await execute(`CREATE TABLE IF NOT EXISTS ChatSession (
    id TEXT PRIMARY KEY,
    userId TEXT,
    subject TEXT,
    status VARCHAR(50) DEFAULT 'open',
    lastMessage TEXT,
    lastMessageAt TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT
  )`);
  await execute(`CREATE TABLE IF NOT EXISTS ChatMessage (
    id TEXT PRIMARY KEY,
    sessionId TEXT,
    sender TEXT,
    content TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  await execute('CREATE INDEX IF NOT EXISTS idx_chat_session_user ON ChatSession(userId)');
  await execute('CREATE INDEX IF NOT EXISTS idx_chat_session_status ON ChatSession(status)');
  await execute('CREATE INDEX IF NOT EXISTS idx_chat_message_session ON ChatMessage(sessionId)');
}

function genId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';
    const keyword = searchParams.get('keyword') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const offset = (page - 1) * pageSize;
    const sessionId = searchParams.get('sessionId');

    // 单会话消息历史
    if (sessionId) {
      const session = await queryFirst(
        `SELECT s.*, u.email as userEmail, u.name as userName, u.avatar as userAvatar
         FROM ChatSession s LEFT JOIN User u ON s.userId = u.id WHERE s.id = ?`,
        sessionId
      );
      const messages = await queryAll(
        'SELECT * FROM ChatMessage WHERE sessionId = ? ORDER BY createdAt ASC',
        sessionId
      );
      return NextResponse.json({ session, messages });
    }

    let sql = `SELECT s.*, u.email as userEmail, u.name as userName, u.avatar as userAvatar
               FROM ChatSession s LEFT JOIN User u ON s.userId = u.id WHERE 1=1`;
    const params: any[] = [];
    if (status && status !== 'all') {
      sql += ' AND s.status = ?';
      params.push(status);
    }
    if (keyword) {
      sql += ' AND (s.subject LIKE ? OR s.lastMessage LIKE ? OR u.name LIKE ? OR u.email LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    sql += ` ORDER BY s.lastMessageAt DESC NULLS LAST LIMIT ${pageSize} OFFSET ${offset}`;
    const rows = await queryAll(sql, ...params);

    let countSql = 'SELECT COUNT(*) as total FROM ChatSession s LEFT JOIN User u ON s.userId = u.id WHERE 1=1';
    const countParams: any[] = [];
    if (status && status !== 'all') {
      countSql += ' AND s.status = ?';
      countParams.push(status);
    }
    if (keyword) {
      countSql += ' AND (s.subject LIKE ? OR s.lastMessage LIKE ? OR u.name LIKE ? OR u.email LIKE ?)';
      countParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    const countRow = await queryFirst(countSql, ...countParams) as any;

    // 统计
    const totalRow = await queryFirst('SELECT COUNT(*) as c FROM ChatSession') as any;
    const openRow = await queryFirst("SELECT COUNT(*) as c FROM ChatSession WHERE status = 'open'") as any;
    const closedRow = await queryFirst("SELECT COUNT(*) as c FROM ChatSession WHERE status = 'closed'") as any;
    const today = new Date().toISOString().split('T')[0];
    const todayRow = await queryFirst("SELECT COUNT(*) as c FROM ChatSession WHERE DATE(createdAt) = ?", today) as any;

    return NextResponse.json({
      data: rows,
      total: countRow?.total || 0,
      stats: {
        total: totalRow?.c || 0,
        open: openRow?.c || 0,
        closed: closedRow?.c || 0,
        todayNew: todayRow?.c || 0,
      },
    });
  } catch (error) {
    console.error('获取会话失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();
    const body = await req.json();
    const { action } = body;
    const now = new Date().toISOString();

    if (action === 'create') {
      const { userId, subject, content } = body;
      if (!userId || !subject) return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
      const id = genId('chat');
      await execute(
        'INSERT INTO ChatSession (id, userId, subject, status, lastMessage, lastMessageAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        id, userId, subject, 'open', content || '', now, now, now
      );
      if (content) {
        const mid = genId('msg');
        await execute(
          'INSERT INTO ChatMessage (id, sessionId, sender, content, createdAt) VALUES (?, ?, ?, ?, ?)',
          mid, id, 'staff', content, now
        );
      }
      await auditLog({
        userId: session?.sub,
        action: 'admin_update_config',
        details: { target: 'chat_message' },
        status: 'success',
      });
      return NextResponse.json({ id });
    }

    if (action === 'send') {
      const { sessionId, content } = body;
      if (!sessionId || !content) return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
      const mid = genId('msg');
      await batch([
        {
          sql: 'INSERT INTO ChatMessage (id, sessionId, sender, content, createdAt) VALUES (?, ?, ?, ?, ?)',
          params: [mid, sessionId, 'staff', content, now],
        },
        {
          sql: 'UPDATE ChatSession SET lastMessage = ?, lastMessageAt = ?, updatedAt = ? WHERE id = ?',
          params: [content, now, now, sessionId],
        },
      ]);
      await auditLog({
        userId: session?.sub,
        action: 'admin_update_config',
        details: { target: 'chat_message' },
        status: 'success',
      });
      return NextResponse.json({ id: mid });
    }

    return NextResponse.json({ error: '未知操作' }, { status: 400 });
  } catch (error) {
    console.error('会话操作失败:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();
    const { sessionId, status } = await req.json();
    if (!sessionId || !status) return NextResponse.json({ error: '参数不足' }, { status: 400 });
    if (!['open', 'closed'].includes(status)) return NextResponse.json({ error: '非法状态' }, { status: 400 });

    await execute('UPDATE ChatSession SET status = ?, updatedAt = ? WHERE id = ?', status, new Date().toISOString(), sessionId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新会话状态失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}
