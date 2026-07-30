/**
 * 紫微斗数 · 规则引擎
 * 
 * 核心功能：
 * 1. 规则匹配与执行
 * 2. 权重评分
 * 3. 解读文本生成
 * 4. 多流派支持
 */

import type { 
  ZiweiChart, 
  AnalysisContext, 
  AnalysisResult,
  RuleCategory,
  DetectedPattern,
  PalaceAnalysis,
  SihuaAnalysis,
  DecadalAnalysis,
  ClassicalReference,
  SchoolId,
  MutagenType,
} from '../interfaces/chart';
import { detectPatterns } from '../knowledge/patterns';
import { getRelevantClassics } from '../knowledge/classics';
import { getSchoolInfo } from '../knowledge/schools';
import { getSihuaForStem, SIHUA_MEANING } from '../knowledge/sihua/tables';
import { calculateAllFlyingStars, findKeyFlying } from '../knowledge/sihua/flying';

/** 规则引擎配置 */
export interface RuleEngineConfig {
  /** 启用的规则分类 */
  enabledCategories: RuleCategory[];
  /** 最大结果数量 */
  maxResults: number;
  /** 最低权重阈值 */
  minWeight: number;
}

const DEFAULT_CONFIG: RuleEngineConfig = {
  enabledCategories: ['pattern', 'star', 'palace', 'sihua', 'flying', 'decadal'],
  maxResults: 50,
  minWeight: 0,
};

/** 规则引擎 */
export class RuleEngine {
  private config: RuleEngineConfig;
  
  constructor(config?: Partial<RuleEngineConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * 分析命盘
   */
  analyze(chart: ZiweiChart, context: AnalysisContext): AnalysisResult {
    const result: AnalysisResult = {
      overview: this.generateOverview(chart),
      detectedPatterns: this.detectPatterns(chart),
      sihuaAnalysis: this.analyzeSihua(chart),
      flyingStarAnalysis: context.school === 'feixing' 
        ? this.analyzeFlyingStars(chart) 
        : undefined,
      decadalAnalysis: this.analyzeDecadals(chart),
      annualAnalysis: undefined, // 需外部传入流年数据
      palaceAnalyses: this.analyzePalaces(chart, context),
      classicalReferences: this.getReferences(chart),
      suggestions: this.generateSuggestions(chart, context),
    };
    
    return result;
  }
  
  /**
   * 生成概览
   */
  private generateOverview(chart: ZiweiChart) {
    const mingGong = chart.palaces.find(p => p.name === '命宫');
    const mainStars = mingGong?.majorStars.map(s => s.name) || [];
    const patterns = this.detectPatterns(chart);
    
    // 评估格局层次
    let overallLevel: '上上' | '上' | '中上' | '中' | '中下' = '中';
    const maxPatternWeight = patterns.reduce((max, p) => Math.max(max, p.weight), 0);
    
    if (maxPatternWeight >= 95) overallLevel = '上上';
    else if (maxPatternWeight >= 85) overallLevel = '上';
    else if (maxPatternWeight >= 70) overallLevel = '中上';
    else if (maxPatternWeight >= 50) overallLevel = '中';
    else overallLevel = '中下';
    
    return {
      mainStars,
      patterns: patterns.map(p => p.name),
      overallLevel,
    };
  }
  
  /**
   * 检测格局
   */
  private detectPatterns(chart: ZiweiChart): DetectedPattern[] {
    return detectPatterns(chart);
  }
  
  /**
   * 分析四化
   */
  private analyzeSihua(chart: ZiweiChart): SihuaAnalysis {
    const stem = chart.birthSihua.stem;
    const sihua = getSihuaForStem(stem);
    
    const interpretations = {
      lu: SIHUA_MEANING['化禄'].interpretation,
      quan: SIHUA_MEANING['化权'].interpretation,
      ke: SIHUA_MEANING['化科'].interpretation,
      ji: SIHUA_MEANING['化忌'].interpretation,
    };
    
    const result: SihuaAnalysis = {
      birth: chart.birthSihua as unknown as SihuaAnalysis['birth'],
      interpretations,
      overallAssessment: this.assessSihuaOverall(chart),
    };
    
    return result;
  }
  
  /**
   * 评估四化总体吉凶
   */
  private assessSihuaOverall(chart: ZiweiChart): string {
    const stem = chart.birthSihua.stem;
    const sihua = getSihuaForStem(stem);
    const parts: string[] = [];
    
    // 检查四化飞入的宫位
    const luPalace = chart.palaces.find(p => 
      p.majorStars.some(s => s.name === sihua.lu)
    );
    const jiPalace = chart.palaces.find(p => 
      p.majorStars.some(s => s.name === sihua.ji)
    );
    
    if (luPalace) {
      parts.push(`化禄入${luPalace.name}，此宫为命主带来福气`);
    }
    if (jiPalace) {
      parts.push(`化忌入${jiPalace.name}，此宫是命主需要重点注意的领域`);
    }
    
    return parts.length > 0 ? parts.join('；') : '四化分布较为均匀，命局平衡';
  }
  
  /**
   * 分析飞星
   */
  private analyzeFlyingStars(chart: ZiweiChart) {
    const palaces = chart.palaces;
    const palaceFlying = calculateAllFlyingStars(palaces);
    const keyFlying = findKeyFlying(palaces, chart);
    
    // 计算因果链
    const causalChains: any[] = [];
    const importantPalaces = ['命宫', '财帛宫', '官禄宫'];
    for (const name of importantPalaces) {
      const palace = palaces.find(p => p.name === name);
      if (palace) {
        // 简化的因果链分析
        const flying = palaceFlying.find(f => f.sourcePalace === name);
        if (flying && flying.jiFlying.targetPalace !== '无' && !flying.jiFlying.isSelf) {
          causalChains.push({
            startPalace: name,
            nodes: [{
              palace: name,
              mutagen: '化忌' as MutagenType,
              star: flying.jiFlying.star,
              targetPalace: flying.jiFlying.targetPalace,
              assessment: '凶',
            }],
            depth: 1,
          });
        }
      }
    }
    
    return {
      palaceFlying,
      causalChains,
      keyFlying,
    };
  }
  
  /**
   * 分析大限
   */
  private analyzeDecadals(chart: ZiweiChart): DecadalAnalysis[] {
    const decadalAnalyses: DecadalAnalysis[] = [];
    const processedDecadals = new Set<string>();
    
    for (const palace of chart.palaces) {
      if (palace.decadal) {
        const key = `${palace.decadal.startAge}-${palace.decadal.endAge}`;
        if (processedDecadals.has(key)) continue;
        processedDecadals.add(key);
        
        const majorStars = palace.majorStars.map(s => s.name);
        const strength = this.calculateDecadalStrength(palace);
        
        decadalAnalyses.push({
          range: key,
          palaceName: palace.name,
          majorStars,
          sihua: {
            level: 'decade',
            lu: { star: '', palace: '' },
            quan: { star: '', palace: '' },
            ke: { star: '', palace: '' },
            ji: { star: '', palace: '' },
          },
          strength,
          fortune: this.generateDecadalFortune(palace, strength),
          caution: this.generateDecadalCaution(palace),
          keyEvents: this.generateKeyEvents(palace),
        });
      }
    }
    
    return decadalAnalyses;
  }
  
  /**
   * 计算大限强度
   */
  private calculateDecadalStrength(palace: any): number {
    let strength = 50; // 基础分
    
    // 主星加分
    strength += palace.majorStars.length * 10;
    
    // 亮度加分
    const brightnessScores: Record<string, number> = {
      '庙': 20, '旺': 15, '得': 10, '利': 5, '平': 0, '不': -5, '陷': -10,
    };
    palace.majorStars.forEach((s: any) => {
      strength += brightnessScores[s.brightness] || 0;
    });
    
    // 化禄加分
    palace.majorStars.forEach((s: any) => {
      if (s.mutagen === '化禄') strength += 15;
      if (s.mutagen === '化忌') strength -= 15;
    });
    
    return Math.max(0, Math.min(100, strength));
  }
  
  /**
   * 生成大限运势
   */
  private generateDecadalFortune(palace: any, strength: number): string {
    if (strength >= 80) return '此步大限运势极佳，事业财运双丰收';
    if (strength >= 60) return '此步大限运势良好，稳步发展';
    if (strength >= 40) return '此步大限运势平稳，宜守不宜攻';
    return '此步大限运势一般，需加倍努力';
  }
  
  /**
   * 生成大限注意事项
   */
  private generateDecadalCaution(palace: any): string {
    const cautions: string[] = [];
    
    palace.majorStars.forEach((s: any) => {
      if (s.mutagen === '化忌') {
        cautions.push(`${s.name}化忌，需特别注意`);
      }
    });
    
    if (palace.minorStars.some((s: any) => s.name === '擎羊')) {
      cautions.push('擎羊入限，易有竞争');
    }
    if (palace.minorStars.some((s: any) => s.name === '陀罗')) {
      cautions.push('陀罗入限，进展缓慢');
    }
    
    return cautions.length > 0 ? cautions.join('；') : '无特别注意事项';
  }
  
  /**
   * 生成关键事件
   */
  private generateKeyEvents(palace: any): string[] {
    const events: string[] = [];
    
    if (palace.majorStars.some((s: any) => s.name === '紫微')) {
      events.push('可能获得领导赏识');
    }
    if (palace.majorStars.some((s: any) => s.name === '武曲')) {
      events.push('财运可能有大变动');
    }
    if (palace.majorStars.some((s: any) => s.name === '破军')) {
      events.push('适合变革创新');
    }
    
    return events;
  }
  
  /**
   * 分析各宫
   */
  private analyzePalaces(chart: ZiweiChart, context: AnalysisContext): PalaceAnalysis[] {
    const palaceAnalyses: PalaceAnalysis[] = [];
    const palaceNames: Record<string, string> = {
      '命宫': '一生格局',
      '兄弟宫': '兄弟姐妹',
      '夫妻宫': '婚姻感情',
      '子女宫': '子女晚辈',
      '财帛宫': '财运收入',
      '疾厄宫': '健康状况',
      '迁移宫': '外出运势',
      '交友宫': '人际社交',
      '官禄宫': '事业工作',
      '田宅宫': '不动产',
      '福德宫': '精神享受',
      '父母宫': '父母长辈',
    };
    
    for (const palace of chart.palaces) {
      const name = palace.name;
      const area = palaceNames[name] || name;
      const mainStars = palace.majorStars.map(s => s.name);
      
      // 主星解读
      let mainStarReading = '';
      if (mainStars.length > 0) {
        mainStarReading = `${mainStars.join('、')}坐守${area}`;
      } else {
        mainStarReading = `无主星坐守，借对宫星曜参断`;
      }
      
      // 星曜组合
      let starCombinationReading = '';
      if (mainStars.length >= 2) {
        starCombinationReading = `${mainStars.join('与')}同宫，形成特殊组合`;
      }
      
      // 亮度分析
      const brightnesses = palace.majorStars
        .map(s => s.brightness)
        .filter((b): b is NonNullable<typeof b> => b !== undefined) as string[];
      let brightnessReading = '';
      if (brightnesses.length > 0) {
        const mostCommon = this.getMostCommon(brightnesses);
        brightnessReading = `星曜亮度：${mostCommon}`;
      }
      
      // 四化分析
      const hasSihua = palace.majorStars.some(s => s.mutagen);
      let sihuaReading = '';
      if (hasSihua) {
        const sihuaStar = palace.majorStars.find(s => s.mutagen);
        if (sihuaStar) {
          sihuaReading = `${sihuaStar.name}${sihuaStar.mutagen}入${area}`;
        }
      }
      
      // 三方四正
      const sanfangStars = this.getSanfangSummary(palace, chart);
      let sanfangReading = '';
      if (sanfangStars) {
        sanfangReading = `三方四正：${sanfangStars}`;
      }
      
      // 综合解读
      const overallParts = [mainStarReading];
      if (starCombinationReading) overallParts.push(starCombinationReading);
      if (sihuaReading) overallParts.push(sihuaReading);
      const overall = overallParts.join('，');
      
      // 建议
      const advice = this.generatePalaceAdvice(palace, area);
      
      palaceAnalyses.push({
        palace: name,
        area,
        mainStarReading,
        starCombinationReading,
        brightnessReading,
        sihuaReading,
        sanfangReading,
        overall,
        advice,
      });
    }
    
    return palaceAnalyses;
  }
  
  private getMostCommon(arr: string[]): string {
    const counts: Record<string, number> = {};
    for (const item of arr) {
      counts[item] = (counts[item] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  }
  
  private getSanfangSummary(palace: any, chart: ZiweiChart): string {
    const idx = palace.index;
    const sanfangIdx = [(idx + 4) % 12, (idx + 8) % 12];
    const sanfangPalaces = sanfangIdx.map(i => chart.palaces.find(p => p.index === i));
    const stars: string[] = [];
    sanfangPalaces.forEach(p => {
      if (p) {
        p.majorStars.forEach(s => stars.push(s.name));
        p.minorStars.forEach(s => stars.push(s.name));
      }
    });
    return stars.length > 0 ? stars.join('、') : '';
  }
  
  private generatePalaceAdvice(palace: any, area: string): string {
    const advices: string[] = [];
    
    if (palace.majorStars.some(s => s.mutagen === '化忌')) {
      advices.push(`${area}需特别注意，多努力可克服`);
    }
    if (palace.majorStars.some(s => s.mutagen === '化禄')) {
      advices.push(`${area}有先天优势，把握机会`);
    }
    
    return advices.length > 0 ? advices.join('；') : `${area}发展平稳`;
  }
  
  /**
   * 获取古籍引用
   */
  private getReferences(chart: ZiweiChart): ClassicalReference[] {
    const classics = getRelevantClassics(chart);
    return classics.map(c => ({
      source: c.source,
      title: c.title,
      content: c.content,
      relevance: c.applicableStars
        ? `适用于${c.applicableStars.join('、')}等星曜`
        : '通用断语',
    }));
  }
  
  /**
   * 生成综合建议
   */
  private generateSuggestions(chart: ZiweiChart, context: AnalysisContext): string[] {
    const suggestions: string[] = [];
    const schoolInfo = getSchoolInfo(context.school);
    
    suggestions.push(`本次分析采用【${schoolInfo.name}】进行解读`);
    
    const patterns = this.detectPatterns(chart);
    if (patterns.length > 0) {
      suggestions.push(`检测到${patterns.length}个格局，建议重点关注：${patterns.slice(0, 3).map(p => p.name).join('、')}`);
    }
    
    return suggestions;
  }
}
