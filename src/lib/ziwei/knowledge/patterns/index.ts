/**
 * 紫微斗数 · 格局知识库汇总
 */

import type { ZiweiChart, DetectedPattern } from '../../interfaces/chart';
import { BASIC_PATTERNS, SANFANG_PATTERNS, SPECIAL_PATTERNS, type PatternRule } from './basic';

/** 所有格局规则 */
export const ALL_PATTERN_RULES: PatternRule[] = [
  ...BASIC_PATTERNS,
  ...SANFANG_PATTERNS,
  ...SPECIAL_PATTERNS,
];

/**
 * 检测命盘中的所有格局
 */
export function detectPatterns(chart: ZiweiChart): DetectedPattern[] {
  const detected: DetectedPattern[] = [];
  
  for (const rule of ALL_PATTERN_RULES) {
    try {
      if (rule.condition(chart)) {
        detected.push({
          id: rule.id,
          name: rule.name,
          category: rule.category,
          matched: true,
          description: rule.description,
          successCondition: rule.successCondition,
          failureCondition: rule.failureCondition,
          classicSource: rule.classicSource,
          weight: rule.priority,
        });
      }
    } catch (e) {
      // 单个规则出错不影响其他规则
      continue;
    }
  }
  
  // 按优先级排序
  detected.sort((a, b) => b.weight - a.weight);
  
  return detected;
}

/**
 * 获取格局总数
 */
export function getPatternCount(): number {
  return ALL_PATTERN_RULES.length;
}

/**
 * 按分类获取格局
 */
export function getPatternsByCategory(category: string): PatternRule[] {
  return ALL_PATTERN_RULES.filter(r => r.category === category);
}

/**
 * 获取所有格局分类
 */
export function getAllPatternCategories(): string[] {
  const categories = new Set<string>();
  ALL_PATTERN_RULES.forEach(r => categories.add(r.category));
  return Array.from(categories);
}

/**
 * 根据 ID 获取格局规则
 */
export function getPatternById(id: string): PatternRule | undefined {
  return ALL_PATTERN_RULES.find(r => r.id === id);
}
