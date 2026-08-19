/**
 * 用户标签批量操作API
 * 功能：批量为用户添加/移除标签，支持批量打标签和批量移除标签
 * 用途：用户分群批量管理、精准营销标签操作
 */
import { requireAdmin } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { addTagsToUsers, removeTagsFromUsers, queryAll, queryFirst, ensureTagRelationTable } from '@/lib/d1';
import { auditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const body = await req.json();
    const { userIds, tagIds, mode = 'add' } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: '用户列表不能为空' }, { status: 400 });
    }
    if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
      return NextResponse.json({ error: '标签列表不能为空' }, { status: 400 });
    }

    if (mode === 'remove') {
      await removeTagsFromUsers(userIds, tagIds);
    } else {
      await addTagsToUsers(userIds, tagIds);
    }

    await auditLog({
      userId: session?.sub,
      action: 'admin_batch_tag',
      details: { mode, userCount: userIds.length, tagCount: tagIds.length, userIds: userIds.slice(0, 10), tagIds },
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      userCount: userIds.length,
      tagCount: tagIds.length,
      mode,
    });
  } catch (error: any) {
    console.error('批量打标签失败:', error);
    return NextResponse.json({ error: error.message || '操作失败' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const tagId = searchParams.get('tagId') || '';
    const keyword = searchParams.get('keyword') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    if (!tagId) {
      return NextResponse.json({ error: '标签ID必填' }, { status: 400 });
    }

    await ensureTagRelationTable();

    const baseSql = `FROM "UserTagRelation" r LEFT JOIN User u ON r.userId = u.id WHERE r.tagId = ?`;
    let countSql = `SELECT COUNT(*) as total ${baseSql}`;
    let sql = `SELECT u.id, u.name, u.email, u.phone, r.createdAt as taggedAt ${baseSql}`;
    const countParams: any[] = [tagId];
    const queryParams: any[] = [tagId];

    if (keyword) {
      sql += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)';
      countSql += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)';
      const kw = `%${keyword}%`;
      countParams.push(kw, kw, kw);
      queryParams.push(kw, kw, kw);
    }

    sql += ` ORDER BY r.createdAt DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;

    const users = await queryAll(sql, ...queryParams);
    const total = (await queryFirst(countSql, ...countParams)) as any;

    return NextResponse.json({
      users,
      total: total?.total || 0,
      page,
      pageSize,
    });
  } catch (error: any) {
    console.error('获取标签用户列表失败:', error);
    return NextResponse.json({ error: error.message || '获取失败' }, { status: 500 });
  }
}