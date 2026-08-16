import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, execute } from '@/lib/d1';
import { requireAdmin } from '@/lib/auth-server';
import { clearRuleCache } from '@/lib/rules/engine';
import { auditLog } from '@/lib/audit';

async function checkAdmin(req: NextRequest) {
  const { allowed, session } = await requireAdmin(req);
  if (!session || session.role !== 'admin') {
    return null;
  }
  return session;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await checkAdmin(request);
  if (!session) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const rule = await queryFirst('SELECT * FROM DivinationRule WHERE id = ?', id);

  if (!rule) {
    return NextResponse.json({ error: '规则不存在' }, { status: 404 });
  }

  return NextResponse.json({
    ...rule,
    content: (rule as any).content ? JSON.parse((rule as any).content) : null,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await checkAdmin(request);
  if (!session) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const body = await request.json();
  const { content, classicSource, classicQuote, priority, isActive } = body;

  const updateData: any = {};
  if (content !== undefined) {
    updateData.content = typeof content === 'string' ? content : JSON.stringify(content);
  }
  if (classicSource !== undefined) updateData.classicSource = classicSource;
  if (classicQuote !== undefined) updateData.classicQuote = classicQuote;
  if (priority !== undefined) updateData.priority = priority;
  if (isActive !== undefined) updateData.isActive = isActive;

  try {
    const existing = await queryFirst('SELECT * FROM DivinationRule WHERE id = ?', id);
    if (!existing) {
      return NextResponse.json({ error: '规则不存在' }, { status: 404 });
    }

    const sets: string[] = [];
    const params: any[] = [];
    if (updateData.content !== undefined) { sets.push('content = ?'); params.push(updateData.content); }
    if (updateData.classicSource !== undefined) { sets.push('classicSource = ?'); params.push(updateData.classicSource); }
    if (updateData.classicQuote !== undefined) { sets.push('classicQuote = ?'); params.push(updateData.classicQuote); }
    if (updateData.priority !== undefined) { sets.push('priority = ?'); params.push(updateData.priority); }
    if (updateData.isActive !== undefined) { sets.push('isActive = ?'); params.push(updateData.isActive ? 1 : 0); }

    params.push(id);
    await execute(`UPDATE DivinationRule SET ${sets.join(', ')} WHERE id = ?`, ...params);
    clearRuleCache();

    await auditLog({
      userId: session?.sub,
      action: 'admin_update_config',
      details: { target: 'rule', id },
      status: 'success',
    });

    const rule = await queryFirst('SELECT * FROM DivinationRule WHERE id = ?', id);
    return NextResponse.json({ success: true, rule });
  } catch {
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await checkAdmin(request);
  if (!session) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  try {
    const existing = await queryFirst('SELECT * FROM DivinationRule WHERE id = ?', id);
    if (!existing) {
      return NextResponse.json({ error: '规则不存在' }, { status: 404 });
    }
    await execute('DELETE FROM DivinationRule WHERE id = ?', id);
    clearRuleCache();
    await auditLog({
      userId: session?.sub,
      action: 'admin_update_config',
      details: { target: 'rule', id },
      status: 'success',
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}