import { requireAdmin } from '@/lib/auth-server';
import { auditLog } from '@/lib/audit';
import { NextRequest, NextResponse } from 'next/server';
import { execute, queryFirst } from '@/lib/d1';

/**
 * 协议签署记录管理（管理员）
 * DELETE /api/admin/agreement-signs?id=xxx
 */
export async function DELETE(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 });

    const row = await queryFirst(
      'SELECT id FROM SiteConfig WHERE category = ? AND (id = ? OR "key" = ? OR "key" = ?)',
      'agreement_sign', id, id, `agreement:${id}`
    );
    if (!row) return NextResponse.json({ error: '记录不存在' }, { status: 404 });

    await execute('DELETE FROM SiteConfig WHERE id = ?', (row as any).id);

    await auditLog({
      userId: session?.sub,
      action: 'admin_update_config',
      details: { target: 'agreement_sign', id },
      status: 'success',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('删除协议签署记录失败:', error);
    return NextResponse.json({ error: error.message || '删除失败' }, { status: 500 });
  }
}
