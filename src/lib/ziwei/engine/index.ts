/**
 * 紫微斗数 · 统一引擎入口
 * 
 * ZiweiEngine 整合所有子引擎：
 * - 排盘引擎：生成命盘
 * - 规则引擎：执行分析
 * - 飞星引擎：四化飞化分析
 * - 时间引擎：小限/流年/流月计算
 */

import type {
  ZiweiChart,
  AnalysisContext,
  AnalysisResult,
  SchoolId,
  AnnualChart,
  MonthlyChart,
  TimeDimension,
} from '../interfaces/chart';
import { RuleEngine } from './rule-engine';
import { calculateAnnualChart, calculateMonthlyChart, getAgeFortune, calculateSmallLimit } from './time-calculator';
import { calculateAllFlyingStars, findKeyFlying, calculateCausalChain } from '../knowledge/sihua/flying';
import { getSchoolInfo, analyzeBySchool } from '../knowledge/schools';

/** 引擎配置 */
export interface EngineConfig {
  /** 默认流派 */
  defaultSchool: SchoolId;
  /** 是否启用飞星分析 */
  enableFlyingStars: boolean;
  /** 是否启用古籍引用 */
  enableClassics: boolean;
  /** 最大因果链深度 */
  maxChainDepth: number;
}

const DEFAULT_CONFIG: EngineConfig = {
  defaultSchool: 'feixing',
  enableFlyingStars: true,
  enableClassics: true,
  maxChainDepth: 5,
};

/** 紫微斗数引擎 */
export class ZiweiEngine {
  private config: EngineConfig;
  private ruleEngine: RuleEngine;
  
  constructor(config?: Partial<EngineConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.ruleEngine = new RuleEngine();
  }
  
  /**
   * 基础分析（命盘）
   */
  analyze(chart: ZiweiChart, options?: { school?: SchoolId }): AnalysisResult {
    const school = options?.school || this.config.defaultSchool;
    const context: AnalysisContext = {
      school,
      timeDimension: 'birth',
    };
    
    return this.ruleEngine.analyze(chart, context);
  }
  
  /**
   * 动态分析（指定时间维度）
   */
  analyzeDynamic(
    chart: ZiweiChart,
    timeDimension: TimeDimension,
    timeValue?: { year?: number; month?: number; age?: number },
    options?: { school?: SchoolId }
  ): AnalysisResult & { timeInfo?: string } {
    const school = options?.school || this.config.defaultSchool;
    const context: AnalysisContext = {
      school,
      timeDimension,
      year: timeValue?.year,
      month: timeValue?.month,
    };
    
    const result = this.ruleEngine.analyze(chart, context);
    
    let timeInfo: string | undefined;
    
    // 添加时间维度信息
    if (timeDimension === 'year' && timeValue?.year) {
      const annual = calculateAnnualChart(chart, timeValue.year);
      result.annualAnalysis = this.generateAnnualAnalysis(annual);
      timeInfo = `流年${annual.stem}${annual.branch}（${timeValue.year}年）`;
    } else if (timeDimension === 'turn' && timeValue?.age) {
      const fortune = getAgeFortune(chart, timeValue.age);
      timeInfo = fortune.overview;
    }
    
    return {
      ...result,
      timeInfo,
    };
  }
  
  /**
   * 生成流年分析
   */
  private generateAnnualAnalysis(annual: AnnualChart) {
    return {
      year: annual.year,
      palaceName: annual.mingGong,
      majorStars: annual.palaces.find(p => p.name === '命宫')?.majorStars.map(s => s.name) || [],
      sihua: annual.sihua,
      annualFortune: {
        overall: `${annual.year}年，流年${annual.stem}${annual.branch}，命宫${annual.mingGong}`,
        career: '需结合实际命盘详细分析',
        wealth: '需结合实际命盘详细分析',
        relationship: '需结合实际命盘详细分析',
        health: '需结合实际命盘详细分析',
      },
      monthlyHighlights: [],
    };
  }
  
  /**
   * 计算流年盘
   */
  getAnnualChart(chart: ZiweiChart, year: number): AnnualChart {
    return calculateAnnualChart(chart, year);
  }
  
  /**
   * 计算流月盘
   */
  getMonthlyChart(chart: ZiweiChart, year: number, month: number): MonthlyChart {
    return calculateMonthlyChart(chart, year, month);
  }
  
  /**
   * 获取年龄运势
   */
  getFortuneByAge(chart: ZiweiChart, age: number) {
    return getAgeFortune(chart, age);
  }
  
  /**
   * 获取小限
   */
  getSmallLimit(chart: ZiweiChart, age: number) {
    return calculateSmallLimit(chart, age);
  }
  
  /**
   * 飞星分析
   */
  getFlyingStarAnalysis(chart: ZiweiChart) {
    const palaces = chart.palaces;
    const palaceFlying = calculateAllFlyingStars(palaces);
    const keyFlying = findKeyFlying(palaces, chart);
    
    // 计算因果链
    const causalChains = ['命宫', '财帛宫', '官禄宫'].map(name => {
      const palace = palaces.find(p => p.name === name);
      if (palace) {
        return calculateCausalChain(palaces, name, this.config.maxChainDepth);
      }
      return null;
    }).filter(Boolean);
    
    return {
      palaceFlying,
      keyFlying,
      causalChains,
    };
  }
  
  /**
   * 流派分析
   */
  getSchoolAnalysis(chart: ZiweiChart, school: SchoolId, palaceName?: string) {
    return analyzeBySchool(chart, school, palaceName);
  }
  
  /**
   * 获取流派信息
   */
  getSchoolInfo(school: SchoolId) {
    return getSchoolInfo(school);
  }
  
  /**
   * 获取配置
   */
  getConfig(): EngineConfig {
    return { ...this.config };
  }
  
  /**
   * 更新配置
   */
  updateConfig(updates: Partial<EngineConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

/** 全局引擎实例 */
let globalEngine: ZiweiEngine | null = null;

/**
 * 获取全局引擎实例
 */
export function getZiweiEngine(): ZiweiEngine {
  if (!globalEngine) {
    globalEngine = new ZiweiEngine();
  }
  return globalEngine;
}

/**
 * 创建自定义引擎实例
 */
export function createZiweiEngine(config?: Partial<EngineConfig>): ZiweiEngine {
  return new ZiweiEngine(config);
}
