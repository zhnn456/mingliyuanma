/**
 * 命理规则库统一引擎
 *
 * 所有排盘解读规则通过此引擎查询，支持：
 * - 按分类/类型/键名查询规则
 * - 多租户覆盖（代理商自定义规则覆盖平台默认规则）
 * - 古籍出处与原文引用
 * - 内存缓存（5分钟TTL，减少数据库查询）
 * - 后台动态增删改
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ========== 类型定义 ==========

export type RuleCategory = 'bazi' | 'ziwei' | 'qimen' | 'meihua';

export interface RuleQuery {
  category: RuleCategory;
  ruleType: string;
  ruleKey: string;
  subKey?: string;
  agentId?: string;
}

export interface RuleData {
  id?: string;
  category: RuleCategory;
  ruleType: string;
  ruleKey: string;
  subKey?: string;
  content: Record<string, any>;
  classicSource?: string;
  classicQuote?: string;
  priority?: number;
  agentId?: string;
  isActive?: boolean;
}

// ========== 缓存 ==========

interface CacheEntry {
  data: any;
  expireAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟

function getCacheKey(prefix: string, params: any): string {
  return `${prefix}:${JSON.stringify(params)}`;
}

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expireAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCached(key: string, data: any): void {
  cache.set(key, { data, expireAt: Date.now() + CACHE_TTL });
}

/** 清除所有缓存（规则更新后调用） */
export function clearRuleCache(): void {
  cache.clear();
}

// ========== 核心查询方法 ==========

/**
 * 获取单条规则内容
 * 优先级：代理商规则 > 平台默认规则（同 category+ruleType+ruleKey+subKey）
 */
export async function getRule(
  category: RuleCategory,
  ruleType: string,
  ruleKey: string,
  subKey?: string,
  agentId?: string,
): Promise<Record<string, any> | null> {
  const cacheKey = getCacheKey('getRule', { category, ruleType, ruleKey, subKey, agentId });
  const cached = getCached<Record<string, any> | null>(cacheKey);
  if (cached !== null) return cached;

  // 先查代理商规则
  if (agentId) {
    const agentRule = await prisma.divinationRule.findFirst({
      where: {
        category,
        ruleType,
        ruleKey,
        subKey: subKey || null,
        agentId,
        isActive: true,
      },
      orderBy: { priority: 'desc' },
    });
    if (agentRule) {
      const content = JSON.parse(agentRule.content);
      const result = {
        ...content,
        _classicSource: agentRule.classicSource || undefined,
        _classicQuote: agentRule.classicQuote || undefined,
      };
      setCached(cacheKey, result);
      return result;
    }
  }

  // 再查平台默认规则
  const platformRule = await prisma.divinationRule.findFirst({
    where: {
      category,
      ruleType,
      ruleKey,
      subKey: subKey || null,
      agentId: null,
      isActive: true,
    },
    orderBy: { priority: 'desc' },
  });

  if (!platformRule) {
    setCached(cacheKey, null);
    return null;
  }

  const content = JSON.parse(platformRule.content);
  const result = {
    ...content,
    _classicSource: platformRule.classicSource || undefined,
    _classicQuote: platformRule.classicQuote || undefined,
  };
  setCached(cacheKey, result);
  return result;
}

/**
 * 获取某类型的所有规则（以 ruleKey 为键的 Map）
 */
export async function getRulesByType(
  category: RuleCategory,
  ruleType: string,
  agentId?: string,
): Promise<Record<string, Record<string, any>>> {
  const cacheKey = getCacheKey('getRulesByType', { category, ruleType, agentId });
  const cached = getCached<Record<string, Record<string, any>> | null>(cacheKey);
  if (cached !== null) return cached;

  const where: any = {
    category,
    ruleType,
    isActive: true,
    OR: [{ agentId: null }],
  };
  if (agentId) {
    where.OR = [{ agentId: null }, { agentId }];
  }

  const rules = await prisma.divinationRule.findMany({
    where,
    orderBy: [{ agentId: 'desc' }, { priority: 'desc' }],
  });

  // 合并：代理商规则覆盖平台规则
  const result: Record<string, Record<string, any>> = {};
  for (const rule of rules) {
    const key = rule.subKey ? `${rule.ruleKey}:${rule.subKey}` : rule.ruleKey;
    if (result[key] && !rule.agentId) continue; // 已有代理商规则，跳过平台默认
    const content = JSON.parse(rule.content);
    result[key] = {
      ...content,
      _classicSource: rule.classicSource || undefined,
      _classicQuote: rule.classicQuote || undefined,
    };
  }

  setCached(cacheKey, result);
  return result;
}

/**
 * 获取某分类下所有规则（按 ruleType 分组）
 */
export async function getRulesByCategory(
  category: RuleCategory,
  agentId?: string,
): Promise<Record<string, Record<string, Record<string, any>>>> {
  const cacheKey = getCacheKey('getRulesByCategory', { category, agentId });
  const cached = getCached<Record<string, Record<string, Record<string, any>>>>(cacheKey);
  if (cached !== null) return cached;

  const where: any = {
    category,
    isActive: true,
    OR: [{ agentId: null }],
  };
  if (agentId) {
    where.OR = [{ agentId: null }, { agentId }];
  }

  const rules = await prisma.divinationRule.findMany({
    where,
    orderBy: [{ agentId: 'desc' }, { ruleType: 'asc' }, { priority: 'desc' }],
  });

  const result: Record<string, Record<string, Record<string, any>>> = {};
  const seen = new Set<string>(); // 去重：代理商规则覆盖平台规则

  for (const rule of rules) {
    const uniqueKey = `${rule.ruleType}:${rule.ruleKey}:${rule.subKey || ''}`;
    if (seen.has(uniqueKey) && !rule.agentId) continue;
    seen.add(uniqueKey);

    if (!result[rule.ruleType]) result[rule.ruleType] = {};
    const key = rule.subKey ? `${rule.ruleKey}:${rule.subKey}` : rule.ruleKey;
    if (result[rule.ruleType][key] && !rule.agentId) continue;

    const content = JSON.parse(rule.content);
    result[rule.ruleType][key] = {
      ...content,
      _classicSource: rule.classicSource || undefined,
      _classicQuote: rule.classicQuote || undefined,
    };
  }

  setCached(cacheKey, result);
  return result;
}

/**
 * 搜索规则（后台管理用）
 */
export async function searchRules(params: {
  category?: RuleCategory;
  ruleType?: string;
  keyword?: string;
  agentId?: string;
  includeInactive?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<{ rules: any[]; total: number }> {
  const {
    category,
    ruleType,
    keyword,
    agentId,
    includeInactive = false,
    page = 1,
    pageSize = 20,
  } = params;

  const where: any = {};
  if (category) where.category = category;
  if (ruleType) where.ruleType = ruleType;
  if (keyword) {
    where.OR = [
      { ruleKey: { contains: keyword } },
      { classicSource: { contains: keyword } },
      { classicQuote: { contains: keyword } },
      { content: { contains: keyword } },
    ];
  }
  if (agentId !== undefined) {
    where.OR = [{ agentId: null }, { agentId }];
  } else {
    where.agentId = null; // 默认只看平台规则
  }
  if (!includeInactive) {
    where.isActive = true;
  }

  const [rules, total] = await Promise.all([
    prisma.divinationRule.findMany({
      where,
      orderBy: [{ category: 'asc' }, { ruleType: 'asc' }, { ruleKey: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.divinationRule.count({ where }),
  ]);

  return { rules, total };
}

// ========== 写入方法 ==========

/**
 * 创建或更新规则（upsert）
 */
export async function upsertRule(data: RuleData): Promise<any> {
  const content = typeof data.content === 'string' ? data.content : JSON.stringify(data.content);
  const result = await prisma.divinationRule.upsert({
    where: {
      category_ruleType_ruleKey_subKey_agentId: {
        category: data.category,
        ruleType: data.ruleType,
        ruleKey: data.ruleKey,
        subKey: data.subKey || '',
        agentId: data.agentId || '',
      },
    },
    create: {
      category: data.category,
      ruleType: data.ruleType,
      ruleKey: data.ruleKey,
      subKey: data.subKey || null,
      content,
      classicSource: data.classicSource || null,
      classicQuote: data.classicQuote || null,
      priority: data.priority || 0,
      agentId: data.agentId || null,
      isActive: data.isActive ?? true,
    },
    update: {
      content,
      classicSource: data.classicSource || null,
      classicQuote: data.classicQuote || null,
      priority: data.priority || 0,
      isActive: data.isActive ?? true,
    },
  });

  clearRuleCache();
  return result;
}

/**
 * 批量写入规则
 */
export async function batchUpsertRules(rules: RuleData[]): Promise<number> {
  let count = 0;
  for (const data of rules) {
    await upsertRule(data);
    count++;
  }
  return count;
}

/**
 * 删除规则
 */
export async function deleteRule(id: string): Promise<void> {
  await prisma.divinationRule.delete({ where: { id } });
  clearRuleCache();
}

/**
 * 获取所有规则类型（用于后台分类筛选）
 */
export async function getRuleTypes(category?: RuleCategory): Promise<string[]> {
  const cacheKey = getCacheKey('getRuleTypes', { category });
  const cached = getCached<string[] | null>(cacheKey);
  if (cached !== null) return cached;

  const where: any = { isActive: true, agentId: null };
  if (category) where.category = category;

  const results = await prisma.divinationRule.findMany({
    where,
    select: { ruleType: true },
    distinct: ['ruleType'],
    orderBy: { ruleType: 'asc' },
  });

  const types = results.map((r: any) => r.ruleType);
  setCached(cacheKey, types);
  return types;
}

/**
 * 获取规则统计
 */
export async function getRuleStats(): Promise<Record<string, number>> {
  const categories = ['bazi', 'ziwei', 'qimen', 'meihua'];
  const stats: Record<string, number> = {};

  for (const cat of categories) {
    const count = await prisma.divinationRule.count({
      where: { category: cat, isActive: true, agentId: null },
    });
    stats[cat] = count;
  }

  stats['total'] = Object.values(stats).reduce((a, b) => a + b, 0);
  return stats;
}
