import { requireAdmin, requireAgent, requireAuth } from '@/lib/auth-server';
/**
 * 规则管理 API
 * GET  - 查询规则列表（支持分类/类型筛选、关键词搜索、分页）
 * POST - 创建新规则
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchRules, upsertRule, getRuleStats, getRuleTypes, type RuleCategory } from '@/lib/rules/engine';

/** 安全解析 JSON，失败返回 null */
function safeParseJSON(str: string | null | undefined): any {
  if (!str) return null;
  try { return JSON.parse(str); } catch { return null; }
}

async function checkAdmin(req: NextRequest) {
  const { allowed, session } = await requireAdmin(req);
  if (!session || session?.role !== 'admin') {
    return null;
  }
  return session;
}

/** 查询规则列表 */
export async function GET(request: NextRequest) {
  const session = await checkAdmin(request);
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
      content: safeParseJSON(r.content),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

/** 创建新规则 */
export async function POST(request: NextRequest) {
  const session = await checkAdmin(request);
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
  } catch {
    return NextResponse.json({ error: '创建规则失败' }, { status: 500 });
  }
}
