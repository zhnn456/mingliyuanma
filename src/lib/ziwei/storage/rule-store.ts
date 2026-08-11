/**
 * 紫微斗数 · 规则存储层
 * 
 * 提供规则的加载、存储、版本管理功能
 * 支持从数据库读取自定义规则，也支持本地规则作为默认值
 */

import type { IZWRule, AnalysisContext, RuleCategory, ZiweiChart } from '../interfaces/chart';
import { ALL_PATTERN_RULES, type PatternRule } from '../knowledge/patterns/basic';

/** 规则存储接口 */
export interface IRuleStore {
  /** 获取所有规则 */
  getAllRules(): Promise<IZWRule[]>;
  
  /** 获取指定分类的规则 */
  getRulesByCategory(category: RuleCategory): Promise<IZWRule[]>;
  
  /** 获取指定流派的规则 */
  getRulesBySchool(school: string): Promise<IZWRule[]>;
  
  /** 获取指定 ID 的规则 */
  getRuleById(id: string): Promise<IZWRule | null>;
  
  /** 保存规则 */
  saveRule(rule: IZWRule): Promise<void>;
  
  /** 更新规则 */
  updateRule(id: string, updates: Partial<IZWRule>): Promise<void>;
  
  /** 删除规则 */
  deleteRule(id: string): Promise<void>;
  
  /** 获取规则版本历史 */
  getRuleHistory(id: string): Promise<RuleVersion[]>;
}

/** 规则版本 */
export interface RuleVersion {
  version: string;
  rule: IZWRule;
  createdAt: Date;
  createdBy: string;
  changeLog: string;
}

/** 本地规则存储（默认实现） */
export class LocalRuleStore implements IRuleStore {
  private rules: Map<string, IZWRule> = new Map();
  private versions: Map<string, RuleVersion[]> = new Map();
  private readonly defaultVersion = 'v1.0.0';
  
  constructor() {
    this.loadDefaultRules();
  }
  
  /**
   * 加载默认规则（从知识库）
   */
  private loadDefaultRules(): void {
    // 加载格局规则
    for (const pattern of ALL_PATTERN_RULES) {
      const rule = this.patternToRule(pattern);
      this.rules.set(rule.id, rule);
      this.addVersion(rule, '系统初始加载');
    }
  }
  
  /**
   * 将格局规则转换为通用规则
   */
  private patternToRule(pattern: PatternRule): IZWRule {
    return {
      id: `pattern_${pattern.id}`,
      name: pattern.name,
      version: this.defaultVersion,
      category: 'pattern',
      priority: pattern.priority,
      enabled: true,
      description: pattern.description,
      
      match: (chart: ZiweiChart) => pattern.condition(chart),
      
      getWeight: () => pattern.priority,
      
      generateText: () => {
        const parts = [pattern.description];
        if (pattern.successCondition) parts.push(`成格条件：${pattern.successCondition}`);
        if (pattern.failureCondition) parts.push(`破格条件：${pattern.failureCondition}`);
        return parts.join('\n');
      },
      
      getRelatedRuleIds: () => [],
      
      getClassicalReferences: () => pattern.classicSource ? [{
        source: pattern.classicSource,
        title: pattern.name,
        content: pattern.description,
        relevance: '格局判定',
      }] : [],
    };
  }
  
  private addVersion(rule: IZWRule, changeLog: string): void {
    const versions = this.versions.get(rule.id) || [];
    versions.push({
      version: rule.version,
      rule: { ...rule },
      createdAt: new Date(),
      createdBy: 'system',
      changeLog,
    });
    this.versions.set(rule.id, versions);
  }
  
  async getAllRules(): Promise<IZWRule[]> {
    return Array.from(this.rules.values()).sort((a, b) => b.priority - a.priority);
  }
  
  async getRulesByCategory(category: RuleCategory): Promise<IZWRule[]> {
    return Array.from(this.rules.values())
      .filter(r => r.category === category)
      .sort((a, b) => b.priority - a.priority);
  }
  
  async getRulesBySchool(_school: string): Promise<IZWRule[]> {
    // 简化实现：返回所有规则
    return this.getAllRules();
  }
  
  async getRuleById(id: string): Promise<IZWRule | null> {
    return this.rules.get(id) || null;
  }
  
  async saveRule(rule: IZWRule): Promise<void> {
    this.rules.set(rule.id, rule);
    this.addVersion(rule, '新增规则');
  }
  
  async updateRule(id: string, updates: Partial<IZWRule>): Promise<void> {
    const existing = this.rules.get(id);
    if (existing) {
      const updated: IZWRule = { ...existing, ...updates };
      this.rules.set(id, updated);
      this.addVersion(updated, '更新规则');
    }
  }
  
  async deleteRule(id: string): Promise<void> {
    this.rules.delete(id);
  }
  
  async getRuleHistory(id: string): Promise<RuleVersion[]> {
    return this.versions.get(id) || [];
  }
}

/** 全局规则存储实例 */
let globalStore: LocalRuleStore | null = null;

/**
 * 获取全局规则存储
 */
export function getRuleStore(): LocalRuleStore {
  if (!globalStore) {
    globalStore = new LocalRuleStore();
  }
  return globalStore;
}

/**
 * 重置全局规则存储（用于测试）
 */
export function resetRuleStore(): void {
  globalStore = null;
}
