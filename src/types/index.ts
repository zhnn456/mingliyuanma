// 天干
export const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;

// 地支
export const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

// 五行
export const WU_XING = ['金', '木', '水', '火', '土'] as const;

// 天干对应五行
export const TIAN_GAN_WU_XING: Record<string, string> = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
};

// 地支对应五行
export const DI_ZHI_WU_XING: Record<string, string> = {
  '子': '水', '丑': '土',
  '寅': '木', '卯': '木',
  '辰': '土', '巳': '火',
  '午': '火', '未': '土',
  '申': '金', '酉': '金',
  '戌': '土', '亥': '水',
};

// 天干阴阳
export const TIAN_GAN_YIN_YANG: Record<string, string> = {
  '甲': '阳', '乙': '阴',
  '丙': '阳', '丁': '阴',
  '戊': '阳', '己': '阴',
  '庚': '阳', '辛': '阴',
  '壬': '阳', '癸': '阴',
};

// 十神
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
  '癸': { '甲': '伤官', '乙': '食神', '丙': '正财', '丁': '偏财', '戊': '正官', '己': '七杀', '庚': '正印', '辛': '偏印', '壬': '劫财', '癸': '比肩' },
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
  '亥': ['壬', '甲'],
};

// 纳音五行
export const NA_YIN: Record<string, string> = {
  '甲子': '海中金', '乙丑': '海中金',
  '丙寅': '炉中火', '丁卯': '炉中火',
  '戊辰': '大林木', '己巳': '大林木',
  '庚午': '路旁土', '辛未': '路旁土',
  '壬申': '剑锋金', '癸酉': '剑锋金',
  '甲戌': '山头火', '乙亥': '山头火',
  '丙子': '涧下水', '丁丑': '涧下水',
  '戊寅': '城头土', '己卯': '城头土',
  '庚辰': '白蜡金', '辛巳': '白蜡金',
  '壬午': '杨柳木', '癸未': '杨柳木',
  '甲申': '泉中水', '乙酉': '泉中水',
  '丙戌': '屋上土', '丁亥': '屋上土',
  '戊子': '霹雳火', '己丑': '霹雳火',
  '庚寅': '松柏木', '辛卯': '松柏木',
  '壬辰': '长流水', '癸巳': '长流水',
  '甲午': '砂石金', '乙未': '砂石金',
  '丙申': '山下火', '丁酉': '山下火',
  '戊戌': '平地木', '己亥': '平地木',
  '庚子': '壁上土', '辛丑': '壁上土',
  '壬寅': '金箔金', '癸卯': '金箔金',
  '甲辰': '覆灯火', '乙巳': '覆灯火',
  '丙午': '天河水', '丁未': '天河水',
  '戊申': '大驿土', '己酉': '大驿土',
  '庚戌': '钗钏金', '辛亥': '钗钏金',
  '壬子': '桑柘木', '癸丑': '桑柘木',
  '甲寅': '大溪水', '乙卯': '大溪水',
  '丙辰': '沙中土', '丁巳': '沙中土',
  '戊午': '天上火', '己未': '天上火',
  '庚申': '石榴木', '辛酉': '石榴木',
  '壬戌': '大海水', '癸亥': '大海水',
};

// 十二生肖
export const SHENG_XIAO: Record<string, string> = {
  '子': '鼠', '丑': '牛',
  '寅': '虎', '卯': '兔',
  '辰': '龙', '巳': '蛇',
  '午': '马', '未': '羊',
  '申': '猴', '酉': '鸡',
  '戌': '狗', '亥': '猪',
};

// 时辰对应地支
export const SHI_CHEN: Record<number, string> = {
  23: '子', 0: '子',
  1: '丑', 2: '丑',
  3: '寅', 4: '寅',
  5: '卯', 6: '卯',
  7: '辰', 8: '辰',
  9: '巳', 10: '巳',
  11: '午', 12: '午',
  13: '未', 14: '未',
  15: '申', 16: '申',
  17: '酉', 18: '酉',
  19: '戌', 20: '戌',
  21: '亥', 22: '亥',
};

// 排盘类型
export type PaipanType = 'bazi' | 'ziwei' | 'qimen' | 'meihua';

// 排盘表单数据
export interface PaipanFormData {
  name: string;
  gender: string;
  year: number;
  month: number;
  day: number;
  hour: number | null; // null = 未知时辰（三柱论命）
  hourType?: 'early-zi' | 'late-zi'; // 早子时(00:00-01:00) / 晚子时(23:00-24:00)
  isLunar: boolean;
  isLeapMonth?: boolean; // 农历闰月
  birthCity: string;
  trueSolarTime: boolean;
  paipanType: PaipanType;
}

// 胎元命宫身宫
export interface TaiYuanMingGong {
  taiYuan: { gan: string; zhi: string };  // 胎元
  mingGong: { gan: string; zhi: string }; // 命宫
  shenGong: { gan: string; zhi: string }; // 身宫
}

// 流年
export interface LiuNian {
  year: number;
  age: number;
  gan: string;
  zhi: string;
  shishen: string;
  shensha: string[];
  analysis?: string;
}

// 流月
export interface LiuYue {
  month: number;
  gan: string;
  zhi: string;
  shishen: string;
}

// 五行力量量化
export interface WuXingStrength {
  counts: Record<string, number>; // 原始计数
  strengths: Record<string, number>; // 加权力量
  total: number;
  details: { source: string; wuxing: string; strength: number; type: string }[];
  dominant: string;   // 最旺五行
  weakest: string;    // 最弱五行
  missing: string[];  // 缺失五行
}

// 格局分析
export interface GeJuAnalysis {
  name: string;
  description: string;
  isEstablished: boolean;
  level: '正格' | '变格' | '从格' | '化格';
  details: string[];
  classicalRef?: string; // 古籍引用
}

// 宫位分析
export interface GongWeiAnalysis {
  position: string;  // 年柱/月柱/日柱/时柱
  palace: string;    // 祖辈宫/父母宫/配偶宫/子女宫
  ganZhi: string;
  shiShen: string;
  analysis: string;
}

// 十神组合
export interface ShiShenCombination {
  combination: string;
  description: string;
  influence: string;
  classicalRef?: string;
}

// 大运详细信息
export interface DayunDetail {
  gan: string;
  zhi: string;
  startAge: number;
  endAge: number;
  startYear: number;
  endYear: number;
  shishen: { gan: string; zhi: string[] };
  shensha: string[];
  analysis?: string;
  liunian?: LiuNian[];
}

// ========== 专项分析类型 ==========

// 事业分析
export interface CareerAnalysis {
  direction: string;         // 事业方向
  suitableIndustries: string[]; // 适合行业
  careerCharacter: string;   // 职业性格
  developmentTiming: string; // 发展时机
  peakPeriod: string;        // 事业高峰期
  advice: string;            // 事业建议
  classicalRef?: string;     // 古籍引用
}

// 财运分析
export interface WealthAnalysis {
  type: string;              // 财运类型（正财/偏财）
  level: string;             // 财运等级
  characteristics: string;   // 财运特征
  peakPeriod: string;        // 财运高峰期
  investmentAdvice: string;  // 理财建议
  riskWarning: string;       // 风险提示
  classicalRef?: string;
}

// 感情婚姻分析
export interface MarriageAnalysis {
  spouseCharacter: string;   // 配偶特征
  marriageProspect: string;  // 婚姻前景
  romanticLuck: string;      // 桃花运势
  favorableAge: string;      // 有利婚恋年龄
  advice: string;            // 感情建议
  classicalRef?: string;
}

// 健康分析
export interface HealthAnalysis {
  constitution: string;      // 体质特征
  weakOrgans: string[];      // 易患部位
  healthRisks: string;       // 健康风险
  maintenanceAdvice: string; // 养生建议
  dietaryAdvice: string;     // 饮食建议
  classicalRef?: string;
}

// 学业分析
export interface EducationAnalysis {
  learningStyle: string;     // 学习风格
  academicPotential: string; // 学业潜力
  favorableSubjects: string[]; // 有利学科
  examLuck: string;          // 考试运势
  advice: string;            // 学业建议
  classicalRef?: string;
}

// 六亲关系分析
export interface FamilyRelationAnalysis {
  relations: {
    relation: string;        // 关系（父母/兄弟/配偶/子女）
    star: string;            // 对应十神
    analysis: string;        // 关系分析
    advice: string;          // 建议
  }[];
  summary: string;
}

// 开运建议
export interface LuckEnhancement {
  luckyColors: string[];
  luckyDirections: string[];
  luckyNumbers: string[];
  luckyIndustries: string[];
  luckyItems: string[];
  fengShuiAdvice: string;
  dailyAdvice: string;
}

// 性格深度分析
export interface PersonalityAnalysis {
  core: string;              // 核心性格
  strengths: string[];       // 优势
  weaknesses: string[];      // 弱势
  socialStyle: string;       // 社交风格
  emotionalStyle: string;    // 情感模式
  thinkingStyle: string;     // 思维模式
  growthAdvice: string;      // 成长建议
}

// 一生运势综述
export interface LifeOverview {
  summary: string;           // 总体概述
  stages: {                  // 人生各阶段
    period: string;
    description: string;
  }[];
  keyAdvice: string;         // 关键建议
  classicalRef?: string;
}

// 综合详细分析结果
export interface BaziDetailedAnalysis {
  career: CareerAnalysis;
  wealth: WealthAnalysis;
  marriage: MarriageAnalysis;
  health: HealthAnalysis;
  education: EducationAnalysis;
  family: FamilyRelationAnalysis;
  luck: LuckEnhancement;
  personality: PersonalityAnalysis;
  lifeOverview: LifeOverview;
  dayunInterpretations: { dayunIndex: number; analysis: string }[];
  liunianInterpretations: { year: number; analysis: string }[];
}

// 八字排盘结果类型
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
  // 扩展字段
  taiYuanMingGong?: TaiYuanMingGong;
  wuxingStrength?: WuXingStrength;
  geju?: GeJuAnalysis;
  gongWei?: GongWeiAnalysis[];
  shishenCombinations?: ShiShenCombination[];
  dayunDetails?: DayunDetail[];
  liunian?: LiuNian[];
  unknownHour?: boolean; // 是否未知时辰（三柱论命）
  detailedAnalysis?: BaziDetailedAnalysis; // 专项分析结果
}

// 会员等级
export type MemberLevel = 'free' | 'monthly' | 'yearly' | 'lifetime';

// 用户信息
export interface UserInfo {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  memberLevel: MemberLevel;
  memberExpiry?: Date | null;
  dailyUsage: number;
}
