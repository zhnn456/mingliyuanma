import { NextRequest, NextResponse } from 'next/server';
import { requirePrimaryAdmin } from '@/lib/auth-server';
import { queryFirst, execute } from '@/lib/d1';
import { queryAll } from '@/lib/d1';
import { auditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requirePrimaryAdmin(req);
    if (!allowed || !session) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const body = await req.json();
    const {
      version,
      title,
      changelog,
      category,
      downloadUrl,
      checksum,
      isLatest = false,
      isDeprecated = false,
      makeLatest = false,
    } = body;

    if (!version) {
      return NextResponse.json({ error: '版本号必填' }, { status: 400 });
    }

    if (!/^v\d+\.\d+\.\d+$/.test(version)) {
      return NextResponse.json({ error: '版本号格式错误，应为 vX.Y.Z' }, { status: 400 });
    }

    // 检查版本号是否已存在
    const existing = await queryFirst(
      'SELECT id FROM Version WHERE version = ?',
      version
    ) as any;

    if (existing) {
      return NextResponse.json({ error: '该版本号已存在' }, { status: 400 });
    }

    const id = `ver_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    // 如果设为最新版本，取消其他版本的 latest 标记
    if (makeLatest) {
      await execute('UPDATE Version SET isLatest = 0');
    }

    await execute(
      `INSERT INTO Version (id, version, title, category, changelog, downloadUrl, checksum, isLatest, isDeprecated, releaseAt, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      version,
      title || '',
      category || '',
      changelog ? JSON.stringify(changelog) : '',
      downloadUrl || '',
      checksum || '',
      makeLatest ? 1 : (isLatest ? 1 : 0),
      isDeprecated ? 1 : 0,
      now,
      now
    );

    await auditLog({
      userId: session?.sub,
      action: 'admin_publish_version',
      details: { id, version, title, makeLatest },
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      version,
      id,
      message: `版本 ${version} 发布成功`,
    });
  } catch (err: any) {
    console.error('发布版本失败:', err);
    return NextResponse.json({ error: err?.message || '发布失败' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requirePrimaryAdmin(req);
    if (!allowed) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    let versions: any[] = [];

    try {
      versions = await queryAll(
        'SELECT id, version, title, category, changelog, downloadUrl, checksum, isLatest, isDeprecated, releaseAt, createdAt FROM Version ORDER BY releaseAt DESC'
      ) as any[];
    } catch (dbErr: any) {
      console.error('[version/release/GET] 数据库错误:', dbErr?.message);
      // 表不存在时返回空列表，不抛500
      if (dbErr?.message && (dbErr.message.includes("doesn't exist") || dbErr.message.includes('Unknown column'))) {
        return NextResponse.json({
          versions: [],
          total: 0,
          warning: 'Version表尚未初始化，请运行 npm run db:init',
        });
      }
      throw dbErr;
    }

    return NextResponse.json({
      versions: versions.map((v: any) => ({
        ...v,
        changelog: v.changelog ? JSON.parse(v.changelog) : [],
      })),
      total: versions.length,
    });
  } catch (err: any) {
    console.error('[version/release/GET] 错误:', err?.message);
    return NextResponse.json({ error: err?.message || '查询失败' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { allowed, session } = await requirePrimaryAdmin(req);
    if (!allowed) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const body = await req.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 });
    }

    if (action === 'make_latest') {
      await execute('UPDATE Version SET isLatest = 0');
      await execute('UPDATE Version SET isLatest = 1 WHERE id = ?', id);
      await auditLog({
        userId: session?.sub,
        action: 'admin_update_version',
        details: { id, action: 'make_latest' },
        status: 'success',
      });
      return NextResponse.json({ success: true, message: '已设为最新版本' });
    }

    if (action === 'deprecate') {
      await execute('UPDATE Version SET isDeprecated = 1, isLatest = 0 WHERE id = ?', id);
      await auditLog({
        userId: session?.sub,
        action: 'admin_update_version',
        details: { id, action: 'deprecate' },
        status: 'success',
      });
      return NextResponse.json({ success: true, message: '版本已弃用' });
    }

    if (action === 'undeprecate') {
      await execute('UPDATE Version SET isDeprecated = 0 WHERE id = ?', id);
      await auditLog({
        userId: session?.sub,
        action: 'admin_update_version',
        details: { id, action: 'undeprecate' },
        status: 'success',
      });
      return NextResponse.json({ success: true, message: '版本已恢复' });
    }

    if (action === 'delete') {
      await execute('DELETE FROM Version WHERE id = ?', id);
      await auditLog({
        userId: session?.sub,
        action: 'admin_delete_version',
        details: { id },
        status: 'success',
      });
      return NextResponse.json({ success: true, message: '版本已删除' });
    }

    return NextResponse.json({ error: '未知操作' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || '操作失败' }, { status: 500 });
  }
}
