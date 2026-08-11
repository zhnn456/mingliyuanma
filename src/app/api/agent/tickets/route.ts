import { NextRequest, NextResponse } from 'next/server';
import { requireAgent } from '@/lib/auth-server';
import { queryFirst, queryAll, execute } from '@/lib/d1';
import { sanitizeString } from '@/lib/security';
import { auditLog } from '@/lib/audit';

/**
 * 代理商 - 技术工单 API
 * GET: 查询代理商的工单列表 / 工单详情
 * POST: 创建工单 / 回复工单
 *
 * 复用 Ticket 表（userId 关联代理商用户）
 */

export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAgent(req);
    if (!allowed || !session) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get('id');

    if (ticketId) {
      // 查询单个工单详情（含回复）
      const ticket = await queryFirst('SELECT * FROM Ticket WHERE id = ? AND userId = ?', ticketId, session.sub) as any;
      if (!ticket) {
        return NextResponse.json({ error: '工单不存在' }, { status: 404 });
      }

      // 查询回复
      let replies: any[] = [];
      try {
        replies = await queryAll(
          'SELECT * FROM TicketReply WHERE ticketId = ? ORDER BY createdAt ASC',
          ticketId
        );
      } catch {
        // TicketReply 表可能不存在
      }

      return NextResponse.json({
        ticket: { ...ticket, replies },
      });
    }

    // 查询工单列表
    const tickets = await queryAll(
      'SELECT * FROM Ticket WHERE userId = ? ORDER BY createdAt DESC LIMIT 50',
      session.sub
    );

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('查询工单失败:', error);
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAgent(req);
    if (!allowed || !session) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const body = await req.json();
    const { isReply } = body;

    if (isReply) {
      // 回复工单
      const { ticketId, content } = body;
      if (!ticketId || !content) {
        return NextResponse.json({ error: '缺少工单ID或回复内容' }, { status: 400 });
      }

      // 验证工单属于该代理
      const ticket = await queryFirst('SELECT * FROM Ticket WHERE id = ? AND userId = ?', ticketId, session.sub) as any;
      if (!ticket) {
        return NextResponse.json({ error: '工单不存在' }, { status: 404 });
      }

      // 确保 TicketReply 表存在
      await ensureTicketReplyTable();

      const replyId = `tr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();

      await execute(
        'INSERT INTO TicketReply (id, ticketId, userId, content, isAdmin, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        replyId, ticketId, session.sub, sanitizeString(content), 0, now
      );

      // 更新工单更新时间
      await execute('UPDATE Ticket SET updatedAt = ? WHERE id = ?', now, ticketId);

      return NextResponse.json({ success: true, id: replyId });
    }

    // 创建工单
    const { title, content, priority } = body;
    if (!title || !content) {
      return NextResponse.json({ error: '标题和内容为必填' }, { status: 400 });
    }

    const id = `tk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    await execute(
      `INSERT INTO Ticket (id, userId, title, content, status, priority, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      id, session.sub, sanitizeString(title), sanitizeString(content),
      'open', priority || 'normal', now, now
    );

    // 记录审计日志
    try {
      await auditLog({
        userId: session.sub,
        action: 'agent_login' as any,
        details: { action: 'agent_ticket_create', resourceId: id, title },
        status: 'success',
      });
    } catch {}

    return NextResponse.json({
      success: true,
      id,
      message: '工单已提交',
    });
  } catch (error) {
    console.error('创建工单失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

/** 确保 TicketReply 表存在 */
async function ensureTicketReplyTable() {
  await execute(
    `CREATE TABLE IF NOT EXISTS \`TicketReply\` (
      \`id\` VARCHAR(64) NOT NULL PRIMARY KEY,
      \`ticketId\` VARCHAR(64) NOT NULL,
      \`userId\` VARCHAR(64) NOT NULL,
      \`content\` TEXT NOT NULL,
      \`isAdmin\` TINYINT NOT NULL DEFAULT 0,
      \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX \`idx_reply_ticketId\` (\`ticketId\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
}
