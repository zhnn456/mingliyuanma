/**
 * 更新日志 API 路由
 * 
 * 提供更新日志的 CRUD 操作：
 * - GET: 查询更新日志列表
 * - POST: 创建更新日志记录
 * - DELETE: 删除指定日志（支持批量）
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { queryFirst, queryAll, execute } from '@/lib/d1';

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const keyword = searchParams.get('keyword');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const offset = (page - 1) * pageSize;

    // 构建查询条件
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (type) {
      conditions.push('type = ?');
      params.push(type);
    }
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (keyword) {
      conditions.push('(title LIKE ? OR content LIKE ? OR version LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (startDate) {
      conditions.push('createdAt >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('createdAt <= ?');
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 查询总数
    const countResult = await queryFirst(
      `SELECT COUNT(*) as total FROM UpdateLog ${whereClause}`,
      ...params
    ) as any;
    const total = countResult?.total || 0;

    // 查询列表
    const logs = await queryAll(
      `SELECT * FROM UpdateLog ${whereClause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
      ...params,
      pageSize,
      offset
    );

    return NextResponse.json({
      logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error: any) {
    console.error('[update-logs/GET] 错误:', error?.message);
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const body = await req.json();
    const { version, title, content, type = 'update', isMajor = false, changes, tag } = body;

    if (!version || !title || !content) {
      return NextResponse.json({ error: '版本号、标题和内容为必填项' }, { status: 400 });
    }

    const id = `ul${Date.now()}`;
    const changesJson = changes ? JSON.stringify(changes) : null;
    const operatorName = session?.name || session?.email || '管理员';

    await execute(
      `INSERT INTO UpdateLog (id, version, title, content, type, isMajor, changes, operatorId, operatorName, tag, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'success')`,
      id, version, title, content, type, isMajor ? 1 : 0, changesJson, session?.id || null, operatorName, tag || null
    );

    const log = await queryFirst('SELECT * FROM UpdateLog WHERE id = ?', id);

    return NextResponse.json({ log });
  } catch (error: any) {
    console.error('[update-logs/POST] 错误:', error?.message);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json({ error: '请提供要删除的日志 ID' }, { status: 400 });
    }

    const ids = idsParam.split(',').map(id => id.trim());
    const placeholders = ids.map(() => '?').join(',');

    await execute(`DELETE FROM UpdateLog WHERE id IN (${placeholders})`, ...ids);

    return NextResponse.json({ success: true, deletedCount: ids.length });
  } catch (error: any) {
    console.error('[update-logs/DELETE] 错误:', error?.message);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
