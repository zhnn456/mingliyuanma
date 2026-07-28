/**
 * 规则管理 API
 * GET  - 查询规则列表（支持分类/类型筛选、关键词搜索、分页）
 * POST - 创建新规则
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { searchRules, upsertRule, getRuleStats, getRuleTypes, type RuleCategory } from '@/lib/rules/engine';

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') {
    return null;
  }
  return session;
}

/** 查询规则列表 */
export async function GET(request: Request) {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') as RuleCategory | null;
  const ruleType = searchParams.get('ruleType') || undefined;
  const keyword = searchParams.get('keyword') || undefined;
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');

  // 如果请求统计信息
  if (searchParams.get('stats') === 'true') {
    const stats = await getRuleStats();
    const types = await getRuleTypes(category || undefined);
    return NextResponse.json({ stats, ruleTypes: types });
  }

  const { rules, total } = await searchRules({
    category: category || undefined,
    ruleType,
    keyword,
    page,
    pageSize,
  });

  return NextResponse.json({
    rules: rules.map((r: any) => ({
      ...r,
      content: r.content ? JSON.parse(r.content) : null,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

/** 创建新规则 */
export async function POST(request: Request) {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const body = await request.json();
  const { category, ruleType, ruleKey, subKey, content, classicSource, classicQuote, priority, isActive } = body;

  if (!category || !ruleType || !ruleKey || !content) {
    return NextResponse.json(
      { error: '缺少必填字段: category, ruleType, ruleKey, content' },
      { status: 400 },
    );
  }

  try {
    const rule = await upsertRule({
      category,
      ruleType,
      ruleKey,
      subKey,
      content,
      classicSource,
      classicQuote,
      priority: priority || 0,
      isActive: isActive ?? true,
    });

    return NextResponse.json({ success: true, rule });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
