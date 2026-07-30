/**
 * 紫微斗数 · 时间计算引擎
 * 
 * 实现小限、流年、流月、流日的计算
 * 核心规则：
 * - 小限：每年一命，男顺女逆
 * - 流年：按天干地支纪年
 * - 流月：按节气定月
 */

import type {
  ZiweiChart,
  AnnualChart,
  MonthlyChart,
  HeavenlyStem,
  EarthlyBranch,
  DynamicSihua,
  Palace,
  PalaceName,
} from '../interfaces/chart';
import { getSihuaForStem } from '../knowledge/sihua/tables';

// ============================================================
// 干支常量
// ============================================================

const HEAVENLY_STEMS: HeavenlyStem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const EARTHLY_BRANCHES: EarthlyBranch[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/** 地支索引对应 */
const BRANCH_INDEX: Record<EarthlyBranch, number> = {
  '子': 0, '丑': 1, '寅': 2, '卯': 3,
  '辰': 4, '巳': 5, '午': 6, '未': 7,
  '申': 8, '酉': 9, '戌': 10, '亥': 11,
};

/** 根据索引获取地支 */
export function getBranchByIndex(index: number): EarthlyBranch {
  return EARTHLY_BRANCHES[((index % 12) + 12) % 12];
}

/** 根据地支获取索引 */
export function getBranchIndex(branch: EarthlyBranch): number {
  return BRANCH_INDEX[branch];
}

// ============================================================
// 小限计算
// ============================================================

/**
 * 计算小限
 * 
 * 规则：小限一年一度逢，男顺女逆不相同
 * 从命宫起，一年走一宫
 */
export function calculateSmallLimit(chart: ZiweiChart, age: number): {
  branch: EarthlyBranch;
  palaceName: string;
  palaceIndex: number;
} {
  const mingGong = chart.palaces.find(p => p.name === '命宫')!;
  const gender = chart.basic.gender;
  
  // 小限起法：男顺女逆
  const offset = gender === '男' ? (age - 1) : -(age - 1);
  const palaceIndex = ((mingGong.index + offset) % 12 + 12) % 12;
  const palace = chart.palaces.find(p => p.index === palaceIndex)!;
  const branch = getBranchByIndex(palaceIndex);
  
  return {
    branch,
    palaceName: palace.name,
    palaceIndex,
  };
}

// ============================================================
// 流年计算
// ============================================================

/**
 * 计算流年干支
 */
export function getAnnualStemBranch(year: number): { stem: HeavenlyStem; branch: EarthlyBranch } {
  // 甲子年为基准（1984年是甲子年）
  const baseYear = 1984;
  const baseStemIdx = 0; // 甲
  const baseBranchIdx = 0; // 子
  
  const yearDiff = year - baseYear;
  const stemIdx = ((baseStemIdx + yearDiff) % 10 + 10) % 10;
  const branchIdx = ((baseBranchIdx + yearDiff) % 12 + 12) % 12;
  
  return {
    stem: HEAVENLY_STEMS[stemIdx],
    branch: EARTHLY_BRANCHES[branchIdx],
  };
}

/**
 * 计算流年盘
 */
export function calculateAnnualChart(chart: ZiweiChart, year: number): AnnualChart {
  const { stem, branch } = getAnnualStemBranch(year);
  const branchIdx = getBranchIndex(branch);
  
  // 流年命宫：从流年地支起，寅宫为起点
  // 简化处理：流年命宫在流年地支对应宫位
  const mingGongIdx = branchIdx;
  
  // 生成流年各宫
  const annualPalaces = generateAnnualPalaces(chart, mingGongIdx, stem);
  
  // 计算流年四化
  const sihua = calculateAnnualSihua(stem, annualPalaces);
  
  return {
    year,
    branch,
    stem,
    sihua,
    mingGong: annualPalaces.find(p => p.name === '命宫')?.earthlyBranch || branch,
    palaces: annualPalaces,
    overlays: calculateOverlays(chart.palaces, annualPalaces),
  };
}

/**
 * 生成流年各宫
 */
function generateAnnualPalaces(chart: ZiweiChart, mingGongIdx: number, stem: HeavenlyStem): Palace[] {
  // 简化：复制原命盘结构，但调整天干
  const palaceNames: PalaceName[] = ['命宫', '兄弟宫', '夫妻宫', '子女宫', '财帛宫', '疾厄宫', '迁移宫', '交友宫', '官禄宫', '田宅宫', '福德宫', '父母宫'];

  return palaceNames.map((name, i) => {
    const idx = (mingGongIdx + i) % 12;
    const originalPalace = chart.palaces.find(p => p.index === idx);
    const branch = getBranchByIndex(idx);

    // 计算天干（五虎遁）
    const palaceStem = calculatePalaceStem(branch, stem);

    return {
      name,
      index: idx,
      earthlyBranch: branch,
      heavenlyStem: palaceStem,
      majorStars: originalPalace?.majorStars || [],
      minorStars: originalPalace?.minorStars || [],
      adjectiveStars: originalPalace?.adjectiveStars || [],
      changsheng12: originalPalace?.changsheng12,
      boshi12: originalPalace?.boshi12,
      decadal: null,
      turnLimit: null,
      isBodyPalace: false,
      isSoulPalace: name === '命宫',
    };
  });
}

/**
 * 计算宫位天干（五虎遁）
 * 甲己之年丙作首，乙庚之岁戊为头
 * 丙辛之岁寻庚起，丁壬壬寅顺水流
 * 戊癸之年甲寅始
 */
function calculatePalaceStem(branch: EarthlyBranch, yearStem: HeavenlyStem): HeavenlyStem {
  // 五虎遁起始
  const starts: Record<string, HeavenlyStem> = {
    '甲': '丙', '己': '丙',
    '乙': '戊', '庚': '戊',
    '丙': '庚', '辛': '庚',
    '丁': '壬', '壬': '壬',
    '戊': '甲', '癸': '甲',
  };
  
  const startStem = starts[yearStem] || '甲';
  const startIdx = HEAVENLY_STEMS.indexOf(startStem);
  const branchIdx = getBranchIndex(branch);
  
  return HEAVENLY_STEMS[(startIdx + branchIdx) % 10];
}

/**
 * 计算流年四化
 */
function calculateAnnualSihua(stem: HeavenlyStem, palaces: Palace[]): DynamicSihua {
  const sihua = getSihuaForStem(stem);
  
  const findPalace = (starName: string) => {
    const palace = palaces.find(p =>
      p.majorStars.some(s => s.name === starName) ||
      p.minorStars.some(s => s.name === starName)
    );
    return palace?.name || '无';
  };
  
  return {
    level: 'year',
    lu: { star: sihua.lu, palace: findPalace(sihua.lu) },
    quan: { star: sihua.quan, palace: findPalace(sihua.quan) },
    ke: { star: sihua.ke, palace: findPalace(sihua.ke) },
    ji: { star: sihua.ji, palace: findPalace(sihua.ji) },
  };
}

/**
 * 计算交叠信息
 */
function calculateOverlays(natalPalaces: Palace[], annualPalaces: Palace[]) {
  const overlays: Array<{ natalPalace: string; annualPalace: string; type: 'same' | 'opposite' | 'three-combination' }> = [];
  
  for (const annualPalace of annualPalaces) {
    const natalPalace = natalPalaces.find(p => p.index === annualPalace.index);
    if (natalPalace) {
      overlays.push({
        natalPalace: natalPalace.name,
        annualPalace: annualPalace.name,
        type: 'same',
      });
    }
  }
  
  return overlays;
}

// ============================================================
// 流月计算
// ============================================================

/**
 * 计算流月盘
 */
export function calculateMonthlyChart(chart: ZiweiChart, year: number, month: number): MonthlyChart {
  const annual = calculateAnnualChart(chart, year);
  
  // 流月：从寅宫起正月
  // 简化处理
  const branchIdx = (getBranchIndex(annual.branch) + month - 1) % 12;
  const branch = getBranchByIndex(branchIdx);
  
  // 流月天干
  const monthStem = calculatePalaceStem(branch, annual.stem);
  
  // 生成流月各宫
  const monthPalaces = generateAnnualPalaces(chart, branchIdx, monthStem);
  
  const sihua = calculateAnnualSihua(monthStem, monthPalaces);
  sihua.level = 'month';
  
  return {
    year,
    month,
    branch,
    sihua,
    palaces: monthPalaces,
  };
}

// ============================================================
// 小限流年联动分析
// ============================================================

/**
 * 获取指定年龄的综合运势
 */
export function getAgeFortune(chart: ZiweiChart, age: number): {
  smallLimit: { palace: string; branch: string };
  annualFortune: AnnualChart | null;
  overview: string;
} {
  // 计算小限
  const smallLimit = calculateSmallLimit(chart, age);
  
  // 计算流年
  const birthYear = parseInt(chart.basic.solarDate.split('-')[0]);
  const year = birthYear + age;
  const annualFortune = calculateAnnualChart(chart, year);
  
  const overview = `${age}岁（${year}年），小限${smallLimit.branch}（${smallLimit.palaceName}），流年${annualFortune.stem}${annualFortune.branch}（${annualFortune.mingGong}）`;
  
  return {
    smallLimit: {
      palace: smallLimit.palaceName,
      branch: smallLimit.branch,
    },
    annualFortune,
    overview,
  };
}
