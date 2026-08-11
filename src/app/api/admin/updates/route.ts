import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { queryFirst, queryAll, execute } from '@/lib/d1';

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const offset = (page - 1) * pageSize;

    let logs: any[] = [];
    let total = 0;

    try {
      // 只返回手动维护的更新公告（kind='manual'），部署记录在"系统更新日志"中查看
      logs = await queryAll(
        `SELECT * FROM UpdateLog WHERE kind = 'manual' ORDER BY createdAt DESC LIMIT ${pageSize} OFFSET ${offset}`
      );
      const countRow = await queryFirst('SELECT COUNT(*) as total FROM UpdateLog WHERE kind = \'manual\'') as any;
      total = countRow?.total || 0;
    } catch (dbErr: any) {
      console.error('[updates/GET] 数据库错误:', dbErr?.message);
      // 表或字段不存在时返回空列表，不抛500
      if (dbErr?.message && (dbErr.message.includes("doesn't exist") || dbErr.message.includes('Unknown column'))) {
        return NextResponse.json({ logs: [], total: 0, page, pageSize, warning: '表尚未初始化，请运行 npm run db:init' });
      }
      throw dbErr;
    }

    return NextResponse.json({ logs, total, page, pageSize });
  } catch (error) {
    console.error('查询更新日志失败:', error);
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { version, title, category, content, isCurrent, isLatest } = await req.json();
    if (!version || !title || !content) {
      return NextResponse.json({ error: '参数不完整：version, title, content 为必填项' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const id = `upd_${Date.now()}`;

    if (isCurrent) {
      await execute('UPDATE UpdateLog SET isCurrent = 0 WHERE isCurrent = 1');
    }
    if (isLatest) {
      await execute('UPDATE UpdateLog SET isLatest = 0 WHERE isLatest = 1');
    }

    await execute(
      `INSERT INTO UpdateLog (id, version, title, category, content, isCurrent, isLatest, createdAt, createdBy, kind)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual')`,
      id, version, title, category || '改进', content,
      isCurrent ? 1 : 0, isLatest ? 1 : 0, now, session?.id || null
    );

    return NextResponse.json({ success: true, id, version });
  } catch (error) {
    console.error('创建更新日志失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { id, version, title, category, content, isCurrent, isLatest } = await req.json();
    if (!id) return NextResponse.json({ error: '缺少 id 参数' }, { status: 400 });

    if (isCurrent !== undefined && isCurrent) {
      await execute('UPDATE UpdateLog SET isCurrent = 0 WHERE id != ? AND isCurrent = 1', id);
    }
    if (isLatest !== undefined && isLatest) {
      await execute('UPDATE UpdateLog SET isLatest = 0 WHERE id != ? AND isLatest = 1', id);
    }

    const fields: string[] = [];
    const params: any[] = [];

    if (version !== undefined) { fields.push('version = ?'); params.push(version); }
    if (title !== undefined) { fields.push('title = ?'); params.push(title); }
    if (category !== undefined) { fields.push('category = ?'); params.push(category); }
    if (content !== undefined) { fields.push('content = ?'); params.push(content); }
    if (isCurrent !== undefined) { fields.push('isCurrent = ?'); params.push(isCurrent ? 1 : 0); }
    if (isLatest !== undefined) { fields.push('isLatest = ?'); params.push(isLatest ? 1 : 0); }

    if (fields.length === 0) {
      return NextResponse.json({ error: '无更新字段' }, { status: 400 });
    }

    params.push(id);
    await execute(`UPDATE UpdateLog SET ${fields.join(', ')} WHERE id = ?`, ...params);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新日志失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const version = searchParams.get('version');

    if (!id && !version) {
      return NextResponse.json({ error: '需要提供 id 或 version 参数' }, { status: 400 });
    }

    if (id) {
      await execute('DELETE FROM UpdateLog WHERE id = ?', id);
    } else {
      await execute('DELETE FROM UpdateLog WHERE version = ?', version!);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除更新日志失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}