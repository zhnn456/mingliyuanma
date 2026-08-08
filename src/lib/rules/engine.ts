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

import { queryFirst, queryAll, execute } from '@/lib/d1';

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

/** 把数据库行转为规则结果（解析 content JSON + 注入古籍字段） */
function rowToResult(row: any): Record<string, any> {
  const content = JSON.parse(row.content);
  return {
    ...content,
    _classicSource: row.classicSource || undefined,
    _classicQuote: row.classicQuote || undefined,
  };
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

  const sk = subKey || '';

  // 先查代理商规则
  if (agentId) {
    const agentRule = await queryFirst(
      'SELECT * FROM DivinationRule WHERE category = ? AND ruleType = ? AND ruleKey = ? AND subKey = ? AND agentId = ? AND isActive = 1 ORDER BY priority DESC LIMIT 1',
      category, ruleType, ruleKey, sk, agentId,
    ) as any;
    if (agentRule) {
      const result = rowToResult(agentRule);
      setCached(cacheKey, result);
      return result;
    }
  }

  // 再查平台默认规则（agentId 为空字符串）
  const platformRule = await queryFirst(
    'SELECT * FROM DivinationRule WHERE category = ? AND ruleType = ? AND ruleKey = ? AND subKey = ? AND agentId = ? AND isActive = 1 ORDER BY priority DESC LIMIT 1',
    category, ruleType, ruleKey, sk, '',
  ) as any;

  if (!platformRule) {
    setCached(cacheKey, null);
    return null;
  }

  const result = rowToResult(platformRule);
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

  let sql = 'SELECT * FROM DivinationRule WHERE category = ? AND ruleType = ? AND isActive = 1';
  const params: any[] = [category, ruleType];
  if (agentId) {
    // 代理商规则 + 平台默认规则
    sql += ' AND (agentId = ? OR agentId = ?)';
    params.push(agentId, '');
  } else {
    sql += ' AND agentId = ?';
    params.push('');
  }
  // 代理商规则排在前面（非空字符串 > 空字符串）
  sql += ' ORDER BY agentId DESC, priority DESC';

  const rules = await queryAll(sql, ...params) as any[];

  // 合并：代理商规则覆盖平台规则
  const result: Record<string, Record<string, any>> = {};
  for (const rule of rules) {
    const key = rule.subKey ? `${rule.ruleKey}:${rule.subKey}` : rule.ruleKey;
    if (result[key] && !rule.agentId) continue; // 已有代理商规则，跳过平台默认
    result[key] = rowToResult(rule);
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

  let sql = 'SELECT * FROM DivinationRule WHERE category = ? AND isActive = 1';
  const params: any[] = [category];
  if (agentId) {
    sql += ' AND (agentId = ? OR agentId = ?)';
    params.push(agentId, '');
  } else {
    sql += ' AND agentId = ?';
    params.push('');
  }
  sql += ' ORDER BY agentId DESC, ruleType ASC, priority DESC';

  const rules = await queryAll(sql, ...params) as any[];

  const result: Record<string, Record<string, Record<string, any>>> = {};
  const seen = new Set<string>(); // 去重：代理商规则覆盖平台规则

  for (const rule of rules) {
    const uniqueKey = `${rule.ruleType}:${rule.ruleKey}:${rule.subKey || ''}`;
    if (seen.has(uniqueKey) && !rule.agentId) continue;
    seen.add(uniqueKey);

    if (!result[rule.ruleType]) result[rule.ruleType] = {};
    const key = rule.subKey ? `${rule.ruleKey}:${rule.subKey}` : rule.ruleKey;
    if (result[rule.ruleType][key] && !rule.agentId) continue;

    result[rule.ruleType][key] = rowToResult(rule);
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

  let where = 'WHERE 1=1';
  const conditions: any[] = [];
  if (category) { where += ' AND category = ?'; conditions.push(category); }
  if (ruleType) { where += ' AND ruleType = ?'; conditions.push(ruleType); }
  if (keyword) {
    where += ' AND (ruleKey LIKE ? OR classicSource LIKE ? OR classicQuote LIKE ? OR content LIKE ?)';
    const kw = `%${keyword}%`;
    conditions.push(kw, kw, kw, kw);
  }
  if (agentId !== undefined) {
    where += ' AND (agentId = ? OR agentId = ?)';
    conditions.push(agentId, '');
  } else {
    where += ' AND agentId = ?';
    conditions.push('');
  }
  if (!includeInactive) {
    where += ' AND isActive = 1';
  }

  const offset = (page - 1) * pageSize;
  const rules = await queryAll(
    `SELECT * FROM DivinationRule ${where} ORDER BY category, ruleType, ruleKey LIMIT ? OFFSET ?`,
    ...conditions, pageSize, offset,
  ) as any[];

  const countRow = await queryFirst(
    `SELECT COUNT(*) as total FROM DivinationRule ${where}`,
    ...conditions,
  ) as any;

  return { rules, total: countRow?.total || 0 };
}

// ========== 写入方法 ==========

/**
 * 创建或更新规则（upsert，基于唯一键 category+ruleType+ruleKey+subKey+agentId）
 */
export async function upsertRule(data: RuleData): Promise<any> {
  const content = typeof data.content === 'string' ? data.content : JSON.stringify(data.content);
  const subKey = data.subKey || '';
  const agentId = data.agentId || '';
  const isActive = data.isActive !== false ? 1 : 0;

  await execute(
    `INSERT INTO DivinationRule (id, category, ruleType, ruleKey, subKey, content, classicSource, classicQuote, priority, agentId, isActive, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
     ON DUPLICATE KEY UPDATE
       content = VALUES(content),
       classicSource = VALUES(classicSource),
       classicQuote = VALUES(classicQuote),
       priority = VALUES(priority),
       isActive = VALUES(isActive),
       updatedAt = NOW()`,
    `rule_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    data.category, data.ruleType, data.ruleKey, subKey, content,
    data.classicSource || null, data.classicQuote || null,
    data.priority || 0, agentId, isActive,
  );

  clearRuleCache();
  return { ...data, content: data.content };
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
  await execute('DELETE FROM DivinationRule WHERE id = ?', id);
  clearRuleCache();
}

/**
 * 获取所有规则类型（用于后台分类筛选）
 */
export async function getRuleTypes(category?: RuleCategory): Promise<string[]> {
  const cacheKey = getCacheKey('getRuleTypes', { category });
  const cached = getCached<string[] | null>(cacheKey);
  if (cached !== null) return cached;

  let sql = 'SELECT DISTINCT ruleType FROM DivinationRule WHERE isActive = 1 AND agentId = ?';
  const params: any[] = [''];
  if (category) { sql += ' AND category = ?'; params.push(category); }
  sql += ' ORDER BY ruleType';

  const results = await queryAll(sql, ...params) as any[];
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
    const row = await queryFirst(
      'SELECT COUNT(*) as cnt FROM DivinationRule WHERE category = ? AND isActive = 1 AND agentId = ?',
      cat, '',
    ) as any;
    stats[cat] = row?.cnt || 0;
  }

  stats['total'] = Object.values(stats).reduce((a, b) => a + b, 0);
  return stats;
}
