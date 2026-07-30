/**
 * 紫微斗数 · 流派规则
 * 
 * 主要流派：飞星派、三合派
 * 飞星派核心：以宫干四化飞化，重动态分析、因果链
 * 三合派核心：以生年四化定格局，重静态分析、三方四正
 */

import type { SchoolInfo, SchoolId, ZiweiChart, Palace } from '../../interfaces/chart';
import { getSihuaTableBySchool, SIHUA_STANDARD } from '../sihua/variants';

// ============================================================
// 流派信息
// ============================================================

export const SCHOOLS: Record<SchoolId, SchoolInfo> = {
  feixing: {
    id: 'feixing',
    name: '飞星派',
    description: '以宫干四化飞化为核心，每宫天干四化飞入他宫形成动态关联。重视因果链和时间维度分析，是现代最流行的流派之一。',
    foundedYear: '近代（台湾梁若瑜体系）',
    keyMethods: [
      '宫干四化飞化',
      '因果链追踪',
      '自化/飞化/冲分析',
      '大限/流年动态四化',
    ],
  },
  sanhe: {
    id: 'sanhe',
    name: '三合派',
    description: '以生年四化定基本格局，重三方四正分析。强调星曜组合、庙旺平陷、格局层次判定，是最传统的流派。',
    foundedYear: '宋代（陈希夷创）',
    keyMethods: [
      '生年四化定格局',
      '三方四正分析',
      '星曜组合判定',
      '庙旺平陷判断',
    ],
  },
  beipai: {
    id: 'beipai',
    name: '北派',
    description: '以中州派为核心，重视命盘结构和星曜亮度。安星法以传统法为准，解读以星曜组合为核心。',
    foundedYear: '近代',
    keyMethods: ['中州派安星法', '星曜亮度判断', '格局判定'],
  },
  nanpai: {
    id: 'nanpai',
    name: '南派',
    description: '以四化飞星为核心，重视时间维度的动态分析。与飞星派类似，但更强调流年流月的引动。',
    foundedYear: '近代',
    keyMethods: ['四化飞星', '动态引动分析', '流年流月细化'],
  },
  zhongzhou: {
    id: 'zhongzhou',
    name: '中州派',
    description: '传统流派之一，以命盘结构严谨、安星准确著称。重视星曜在十二宫的分布和亮度。',
    foundedYear: '宋代',
    keyMethods: ['传统安星法', '星曜分布', '亮度精细判断'],
  },
};

/**
 * 获取流派信息
 */
export function getSchoolInfo(id: SchoolId): SchoolInfo {
  return SCHOOLS[id];
}

// ============================================================
// 飞星派核心规则
// ============================================================

/**
 * 飞星派分析要点
 * 
 * 1. 每宫天干四化飞入他宫，形成"飞化"
 * 2. 四化飞化有方向：化出→化入
 * 3. 自化：四化星落回本宫
 * 4. 冲：化出之星冲对宫
 * 5. 因果链：从一宫追四化的完整路径
 * 6. 四化层级：生年 > 大限 > 流年 > 流月 > 流日
 */

export interface FeixingAnalysisConfig {
  /** 分析重点宫位 */
  focusPalaces: string[];
  /** 因果链最大深度 */
  maxChainDepth: number;
  /** 四化权重 */
  sihuaWeight: { lu: number; quan: number; ke: number; ji: number };
  /** 是否分析自化 */
  analyzeSelfTransform: boolean;
  /** 是否分析冲会 */
  analyzeCollision: boolean;
}

export const FEIXING_DEFAULT_CONFIG: FeixingAnalysisConfig = {
  focusPalaces: ['命宫', '财帛宫', '官禄宫', '夫妻宫', '迁移宫'],
  maxChainDepth: 5,
  sihuaWeight: { lu: 10, quan: 8, ke: 6, ji: -10 },
  analyzeSelfTransform: true,
  analyzeCollision: true,
};

// ============================================================
// 三合派核心规则
// ============================================================

/**
 * 三合派分析要点
 * 
 * 1. 生年四化定基本格局
 * 2. 三方四正分析：本宫 + 对宫 + 三合宫
 * 3. 星曜组合判定：主星+辅星组合含义
 * 4. 庙旺平陷判断：亮度影响吉凶程度
 * 5. 格局层次：大格局 > 中格局 > 小格局
 */

export interface SanheAnalysisConfig {
  /** 是否分析三方四正 */
  analyzeSanfang: boolean;
  /** 是否分析星曜组合 */
  analyzeStarCombo: boolean;
  /** 是否分析亮度 */
  analyzeBrightness: boolean;
  /** 是否分析格局 */
  analyzePattern: boolean;
}

export const SANHE_DEFAULT_CONFIG: SanheAnalysisConfig = {
  analyzeSanfang: true,
  analyzeStarCombo: true,
  analyzeBrightness: true,
  analyzePattern: true,
};

// ============================================================
// 三方四正计算
// ============================================================

/**
 * 获取指定宫位的三方四正
 */
export function getSanfangPalaces(palace: Palace, palaces: Palace[]): {
  target: Palace;
  opposite: Palace | undefined;
  leftSanfang: Palace | undefined;
  rightSanfang: Palace | undefined;
} {
  const oppositeIdx = (palace.index + 6) % 12;
  const leftSanfangIdx = (palace.index + 4) % 12;
  const rightSanfangIdx = (palace.index + 8) % 12;
  
  return {
    target: palace,
    opposite: palaces.find(p => p.index === oppositeIdx),
    leftSanfang: palaces.find(p => p.index === leftSanfangIdx),
    rightSanfang: palaces.find(p => p.index === rightSanfangIdx),
  };
}

/**
 * 计算三方四正汇星（所有相关宫的星曜汇总）
 */
export function getSanfangStars(palace: Palace, palaces: Palace[]): {
  majorStars: string[];
  minorStars: string[];
  totalCount: number;
} {
  const { target, opposite, leftSanfang, rightSanfang } = getSanfangPalaces(palace, palaces);
  
  const majorStars = new Set<string>();
  const minorStars = new Set<string>();
  
  [target, opposite, leftSanfang, rightSanfang].forEach(p => {
    if (p) {
      p.majorStars.forEach(s => majorStars.add(s.name));
      p.minorStars.forEach(s => minorStars.add(s.name));
    }
  });
  
  return {
    majorStars: Array.from(majorStars),
    minorStars: Array.from(minorStars),
    totalCount: majorStars.size + minorStars.size,
  };
}

/**
 * 三合派宫位解读
 */
export function sanhePalaceAnalysis(palace: Palace, palaces: Palace[]): string {
  const stars = getSanfangStars(palace, palaces);
  const parts: string[] = [];
  
  parts.push(`【${palace.name}】`);
  
  // 本宫主星
  if (palace.majorStars.length > 0) {
    const starNames = palace.majorStars.map(s => s.name).join('、');
    parts.push(`${starNames}坐守`);
  } else {
    parts.push('无主星坐守，借对宫参断');
  }
  
  // 三方四正星曜
  if (stars.majorStars.length > 0) {
    parts.push(`三方四正汇${stars.majorStars.join('、')}`);
  }
  
  return parts.join('，');
}

// ============================================================
// 流派分析接口
// ============================================================

/**
 * 根据流派进行分析
 */
export function analyzeBySchool(
  chart: ZiweiChart,
  school: SchoolId,
  palaceName?: string
): { summary: string; details: string[] } {
  const details: string[] = [];
  
  if (school === 'feixing') {
    // 飞星派：分析四化飞化
    details.push('飞星派分析：');
    details.push('每宫天干四化，飞入他宫形成动态关联');
    details.push('重点关注：化忌所入、禄权科忌引动');
    
    if (palaceName) {
      const palace = chart.palaces.find(p => p.name === palaceName);
      if (palace) {
        const stem = palace.heavenlyStem;
        const sihuaTable = SIHUA_STANDARD;
        const sihua = sihuaTable[stem];
        details.push(`${palaceName}天干${stem}：${sihua.lu}化禄、${sihua.quan}化权、${sihua.ke}化科、${sihua.ji}化忌`);
      }
    }
  } else if (school === 'sanhe') {
    // 三合派：分析三方四正
    details.push('三合派分析：');
    details.push('以生年四化定格局，重三方四正汇星');
    
    if (palaceName) {
      const palace = chart.palaces.find(p => p.name === palaceName);
      if (palace) {
        const sanfangStars = getSanfangStars(palace, chart.palaces);
        details.push(sanhePalaceAnalysis(palace, chart.palaces));
        details.push(`三方四正共${sanfangStars.totalCount}颗星`);
      }
    }
  }
  
  const summary = `${SCHOOLS[school].name}分析完成，共${details.length}条结论`;
  
  return { summary, details };
}

/**
 * 获取流派的四化表
 */
export function getSchoolSihuaTable(school: SchoolId) {
  // 北派和南派使用三合派四化表
  const schoolMap: Record<SchoolId, 'feixing' | 'sanhe' | 'zhongzhou'> = {
    feixing: 'feixing',
    sanhe: 'sanhe',
    zhongzhou: 'zhongzhou',
    beipai: 'sanhe',
    nanpai: 'sanhe',
  };
  return getSihuaTableBySchool(schoolMap[school]);
}
