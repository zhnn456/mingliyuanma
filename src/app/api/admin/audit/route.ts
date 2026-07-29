import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { queryAuditLogs, cleanOldAuditLogs } from '@/lib/audit';
import { requireAdmin } from '@/lib/security';

/**
 * 审计日志查询
 * GET /api/admin/audit?date=2026-07-26&action=login&status=success&page=1&limit=50
 */
export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || undefined;
    const action = searchParams.get('action') || undefined;
    const status = searchParams.get('status') || undefined;
    const userId = searchParams.get('userId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await queryAuditLogs({
      date,
      action: action as any,
      status: status || undefined,
      userId: userId || undefined,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('查询审计日志失败:', error);
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }
}

/**
 * 清理旧审计日志
 * DELETE /api/admin/audit
 */
export async function DELETE(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const deletedCount = await cleanOldAuditLogs();
    return NextResponse.json({ message: '清理完成', deleted: deletedCount });
  } catch (error) {
    console.error('清理审计日志失败:', error);
    return NextResponse.json({ error: '清理失败' }, { status: 500 });
  }
}
