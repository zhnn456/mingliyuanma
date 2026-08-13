/**
 * 八字排盘类型定义
 * 
 * 包含：常量定义、数据结构、分析结果类型
 */

// ============================================
// 八字排盘常量类型
// ============================================

// 天干
export const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;

// 地支
export const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

// 天干五行
export const TIAN_GAN_WU_XING: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
};

// 地支五行
export const DI_ZHI_WU_XING: Record<string, string> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
};

// 天干阴阳
export const TIAN_GAN_YIN_YANG: Record<string, string> = {
  '甲': '阳', '乙': '阴', '丙': '阳', '丁': '阴', '戊': '阳',
  '己': '阴', '庚': '阳', '辛': '阴', '壬': '阳', '癸': '阴'
};

// 十神（以日干为中心）
export const SHI_SHEN: Record<string, Record<string, string>> = {
  '甲': { '甲': '比肩', '乙': '劫财', '丙': '食神', '丁': '伤官', '戊': '偏财', '己': '正财', '庚': '七杀', '辛': '正官', '壬': '偏印', '癸': '正印' },
  '乙': { '甲': '劫财', '乙': '比肩', '丙': '伤官', '丁': '食神', '戊': '正财', '己': '偏财', '庚': '正官', '辛': '七杀', '壬': '正印', '癸': '偏印' },
  '丙': { '甲': '偏印', '乙': '正印', '丙': '比肩', '丁': '劫财', '戊': '食神', '己': '伤官', '庚': '偏财', '辛': '正财', '壬': '七杀', '癸': '正官' },
  '丁': { '甲': '正印', '乙': '偏印', '丙': '劫财', '丁': '比肩', '戊': '伤官', '己': '食神', '庚': '正财', '辛': '偏财', '壬': '正官', '癸': '七杀' },
  '戊': { '甲': '七杀', '乙': '正官', '丙': '偏印', '丁': '正印', '戊': '比肩', '己': '劫财', '庚': '食神', '辛': '伤官', '壬': '偏财', '癸': '正财' },
  '己': { '甲': '正官', '乙': '七杀', '丙': '正印', '丁': '偏印', '戊': '劫财', '己': '比肩', '庚': '伤官', '辛': '食神', '壬': '正财', '癸': '偏财' },
  '庚': { '甲': '偏财', '乙': '正财', '丙': '七杀', '丁': '正官', '戊': '偏印', '己': '正印', '庚': '比肩', '辛': '劫财', '壬': '食神', '癸': '伤官' },
  '辛': { '甲': '正财', '乙': '偏财', '丙': '正官', '丁': '七杀', '戊': '正印', '己': '偏印', '庚': '劫财', '辛': '比肩', '壬': '伤官', '癸': '食神' },
  '壬': { '甲': '食神', '乙': '伤官', '丙': '偏财', '丁': '正财', '戊': '七杀', '己': '正官', '庚': '偏印', '辛': '正印', '壬': '比肩', '癸': '劫财' },
  '癸': { '甲': '伤官', '乙': '食神', '丙': '正财', '丁': '偏财', '戊': '正官', '己': '七杀', '庚': '正印', '辛': '偏印', '壬': '劫财', '癸': '比肩' }
};

// 地支藏干
export const DI_ZHI_CANG_GAN: Record<string, string[]> = {
  '子': ['癸'],
  '丑': ['己', '癸', '辛'],
  '寅': ['甲', '丙', '戊'],
  '卯': ['乙'],
  '辰': ['戊', '乙', '癸'],
  '巳': ['丙', '庚', '戊'],
  '午': ['丁', '己'],
  '未': ['己', '丁', '乙'],
  '申': ['庚', '壬', '戊'],
  '酉': ['辛'],
  '戌': ['戊', '辛', '丁'],
  '亥': ['壬', '甲']
};

// 纳音
export const NA_YIN: Record<string, string> = {
  '甲子': '海中金', '乙丑': '海中金', '丙寅': '炉中火', '丁卯': '炉中火',
  '戊辰': '大林木', '己巳': '大林木', '庚午': '路旁土', '辛未': '路旁土',
  '壬申': '剑锋金', '癸酉': '剑锋金', '甲戌': '山头火', '乙亥': '山头火',
  '丙子': '涧下水', '丁丑': '涧下水', '戊寅': '城头土', '己卯': '城头土',
  '庚辰': '白蜡金', '辛巳': '白蜡金', '壬午': '杨柳木', '癸未': '杨柳木',
  '甲申': '泉中水', '乙酉': '泉中水', '丙戌': '屋上土', '丁亥': '屋上土',
  '戊子': '霹雳火', '己丑': '霹雳火', '庚寅': '松柏木', '辛卯': '松柏木',
  '壬辰': '长流水', '癸巳': '长流水', '甲午': '砂石金', '乙未': '砂石金',
  '丙申': '山下火', '丁酉': '山下火', '戊戌': '平地木', '己亥': '平地木',
  '庚子': '壁上土', '辛丑': '壁上土', '壬寅': '金箔金', '癸卯': '金箔金',
  '甲辰': '覆灯火', '乙巳': '覆灯火', '丙午': '天河水', '丁未': '天河水',
  '戊申': '大驿土', '己酉': '大驿土', '庚戌': '钗钏金', '辛亥': '钗钏金',
  '壬子': '桑柘木', '癸丑': '桑柘木', '甲寅': '大溪水', '乙卯': '大溪水',
  '丙辰': '沙中土', '丁巳': '沙中土', '戊午': '天上火', '己未': '天上火',
  '庚申': '石榴木', '辛酉': '石榴木', '壬戌': '大海水', '癸亥': '大海水'
};

// 生肖
export const SHENG_XIAO: Record<string, string> = {
  '子': '鼠', '丑': '牛', '寅': '虎', '卯': '兔', '辰': '龙', '巳': '蛇',
  '午': '马', '未': '羊', '申': '猴', '酉': '鸡', '戌': '狗', '亥': '猪'
};

// 时辰（用于时柱推算）
export const SHI_CHEN: Record<number, string> = {
  0: '子', 1: '丑', 2: '寅', 3: '卯', 4: '辰', 5: '巳',
  6: '午', 7: '未', 8: '申', 9: '酉', 10: '戌', 11: '亥',
  12: '子', 13: '丑', 14: '寅', 15: '卯', 16: '辰', 17: '巳',
  18: '午', 19: '未', 20: '申', 21: '酉', 22: '戌', 23: '亥'
};

// ============================================
// 八字排盘相关类型
// ============================================

export interface PaipanFormData {
  year: number;
  month: number;
  day: number;
  hour: number | null;
  gender: string;
  name?: string;
  birthCity?: string;
  trueSolarTime?: boolean;
  paipanType?: string;
  isLunar?: boolean;
  isLeapMonth?: boolean;
  hourType?: 'early-zi' | 'late-zi';
  // 高级选项
  qiyunDirection?: 'auto' | 'yang-male-yin-female' | 'yin-male-yang-female';
  dayunMethod?: 'three-days-one-year' | 'precise-minutes';
  cangganMethod?: 'full' | 'benqi-only';
  shenshaMethod?: 'full' | 'common' | 'none';
}

export interface BaziResult {
  fourPillars: {
    year: { gan: string; zhi: string };
    month: { gan: string; zhi: string };
    day: { gan: string; zhi: string };
    hour: { gan: string; zhi: string };
  };
  wuxing: Record<string, number>;
  dayun: { gan: string; zhi: string; startAge: number }[];
  shishen: Record<string, string>;
  nayin: Record<string, string>;
  canggan: Record<string, string[]>;
  shengxiao: string;
  gender: string;
  taiYuanMingGong: TaiYuanMingGong;
  wuxingStrength: WuXingStrength;
  geju: GeJuAnalysis;
  gongWei: GongWeiAnalysis[];
  shishenCombinations: ShiShenCombination[];
  dayunDetails: DayunDetail[];
  liunian: LiuNian[];
  unknownHour: boolean;
  detailedAnalysis?: BaziDetailedAnalysis;
}

export interface BaziDetailedAnalysis {
  career?: CareerAnalysis;
  wealth?: WealthAnalysis;
  marriage?: MarriageAnalysis;
  health?: HealthAnalysis;
  education?: EducationAnalysis;
  family?: FamilyRelationAnalysis;
  personality?: PersonalityAnalysis;
  luck?: LuckEnhancement;
  luckEnhancement?: LuckEnhancement;
  lifeOverview?: LifeOverview;
  dayunInterpretations?: { dayunIndex: number; analysis: string }[];
  liunianInterpretations?: { year: number; analysis: string }[];
}

export interface TaiYuanMingGong {
  taiYuan: { gan: string; zhi: string };
  mingGong: { gan: string; zhi: string };
  shenGong: { gan: string; zhi: string };
}

export interface WuXingStrength {
  counts: Record<string, number>;
  strengths: Record<string, number>;
  total: number;
  details: { source: string; wuxing: string; strength: number; type: string }[];
  dominant: string;
  weakest: string;
  missing: string[];
}

export interface GeJuAnalysis {
  name: string;
  description: string;
  isEstablished: boolean;
  level: string;
  details: string[];
  classicalRef?: string;
}

export interface GongWeiAnalysis {
  position: string;
  palace: string;
  ganZhi: string;
  shiShen: string;
  analysis: string;
}

export interface ShiShenCombination {
  combination: string;
  description: string;
  influence: string;
  classicalRef?: string;
}

export interface DayunDetail {
  gan: string;
  zhi: string;
  startAge: number;
  endAge: number;
  startYear: number;
  endYear: number;
  shishen: { gan: string; zhi: string[] };
  shensha: string[];
  liunian: LiuNian[];
}

export interface LiuNian {
  year: number;
  age: number;
  gan: string;
  zhi: string;
  shishen: string;
  shensha: string[];
}

export interface CareerAnalysis {
  overall?: string;
  direction: string;
  careerCharacter: string;
  developmentTiming: string;
  peakPeriod: string;
  suitableIndustries: string[];
  suitablePositions?: string[];
  careerPath?: string;
  keyAges?: { age: number; event: string }[];
  strengths?: string[];
  weaknesses?: string[];
  advice: string;
  classicalRef?: string;
}

export interface WealthAnalysis {
  overall?: string;
  type: string;
  level: string;
  characteristics: string;
  peakPeriod: string;
  incomeSources?: string[];
  wealthPattern?: string;
  keyAges?: { age: number; event: string }[];
  investmentAdvice: string;
  financialAdvice?: string[];
  riskWarning: string;
  classicalRef?: string;
}

export interface MarriageAnalysis {
  overall?: string;
  spouseProfile?: string;
  spouseCharacter: string;
  marriageProspect: string;
  romanticLuck: string;
  favorableAge: string;
  marriageTiming?: string;
  relationshipDynamics?: string;
  keyAges?: { age: number; event: string }[];
  marriageAdvice?: string[];
  advice: string;
  classicalRef?: string;
}

export interface HealthAnalysis {
  overall?: string;
  constitution: string;
  weakOrgans: string[];
  healthRisks: string | string[];
  maintenanceAdvice: string;
  dietaryAdvice: string;
  healthAdvice?: string[];
  keyAges?: { age: number; event: string }[];
  classicalRef?: string;
}

export interface EducationAnalysis {
  overall?: string;
  learningStyle: string;
  academicPotential: string;
  academicStrengths?: string[];
  academicPath?: string;
  favorableSubjects: string[];
  examLuck: string;
  keyAges?: { age: number; event: string }[];
  advice: string;
  classicalRef?: string;
}

export interface FamilyRelationAnalysis {
  overall?: string;
  relations: FamilyRelationItem[];
  summary: string;
  parents?: string;
  siblings?: string;
  children?: string;
  keyAges?: { age: number; event: string }[];
}

export interface FamilyRelationItem {
  relation: string;
  star: string;
  analysis: string;
  advice: string;
}

export interface LuckEnhancement {
  luckyColors: string[];
  luckyDirections: string[];
  luckyNumbers: string[];
  luckyIndustries: string[];
  luckyItems: string[];
  fengShuiAdvice: string;
  dailyAdvice: string;
  // 兼容旧字段名
  colors?: string[];
  directions?: string[];
  numbers?: number[];
  materials?: string[];
  items?: string[];
  tips?: string[];
}

export interface PersonalityAnalysis {
  overall?: string;
  core: string;
  strengths: string[];
  weaknesses: string[];
  personalityType?: string;
  socialStyle: string;
  emotionalStyle: string;
  emotionalPattern?: string;
  thinkingStyle: string;
  growthAdvice: string;
}

export interface LifeOverview {
  summary: string;
  stages: { period: string; age?: string; description: string }[];
  keyFactors?: string[];
  keyAdvice?: string;
  overallScore?: number;
  classicalRef?: string;
}
