/**
 * 单条规则管理 API
 * GET   - 查看规则详情
 * PUT   - 更新规则
 * DELETE - 删除规则
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { clearRuleCache } from '@/lib/rules/engine';

const prisma = new PrismaClient();

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') {
    return null;
  }
  return session;
}

/** 查看规则详情 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const rule = await prisma.divinationRule.findUnique({
    where: { id },
  });

  if (!rule) {
    return NextResponse.json({ error: '规则不存在' }, { status: 404 });
  }

  return NextResponse.json({
    ...rule,
    content: rule.content ? JSON.parse(rule.content) : null,
  });
}

/** 更新规则 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await checkAdmin();
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
    const rule = await prisma.divinationRule.update({
      where: { id },
      data: updateData,
    });
    clearRuleCache();
    return NextResponse.json({ success: true, rule });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** 删除规则 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  try {
    await prisma.divinationRule.delete({ where: { id } });
    clearRuleCache();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
