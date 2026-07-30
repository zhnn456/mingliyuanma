/**
 * 紫微斗数 · 命盘数据结构定义
 * 
 * 标准数据结构，用于引擎层与 API 层之间的数据传递
 */

// ============================================================
// 基础类型
// ============================================================

/** 天干 */
export type HeavenlyStem = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';

/** 地支 */
export type EarthlyBranch = '子' | '丑' | '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥';

/** 四化类型 */
export type MutagenType = '化禄' | '化权' | '化科' | '化忌';

/** 星曜类型 */
export type StarType = 'major' | 'minor' | 'adjective';

/** 星曜亮度 */
export type Brightness = '庙' | '旺' | '得' | '利' | '平' | '不' | '陷';

/** 五行局 */
export type WuXingJu = '水二局' | '木三局' | '金四局' | '土五局' | '火六局';

/** 性别 */
export type Gender = '男' | '女';

// ============================================================
// 星曜数据结构
// ============================================================

/** 单颗星曜 */
export interface Star {
  /** 星曜名称 */
  name: string;
  /** 星曜类型 */
  type: StarType;
  /** 四化状态 */
  mutagen?: MutagenType;
  /** 亮度 */
  brightness?: Brightness;
  /** 五行 */
  element?: string;
  /** 阴阳性 */
  yinYang?: '阴' | '阳';
}

// ============================================================
// 宫位数据结构
// ============================================================

/** 十二宫名称 */
export type PalaceName = 
  | '命宫' | '兄弟宫' | '夫妻宫' | '子女宫'
  | '财帛宫' | '疾厄宫' | '迁移宫' | '交友宫'
  | '官禄宫' | '田宅宫' | '福德宫' | '父母宫';

/** 单宫数据 */
export interface Palace {
  /** 宫位索引 (0=寅, 1=卯, ...) */
  index: number;
  /** 宫位名称 */
  name: PalaceName;
  /** 宫位地支 */
  earthlyBranch: EarthlyBranch;
  /** 宫位天干 */
  heavenlyStem: HeavenlyStem;
  /** 主星 */
  majorStars: Star[];
  /** 辅星 */
  minorStars: Star[];
  /** 杂曜 */
  adjectiveStars: string[];
  /** 长生十二 */
  changsheng12?: string;
  /** 博士十二 */
  boshi12?: string;
  /** 是否为身宫 */
  isBodyPalace?: boolean;
  /** 是否为命宫 */
  isSoulPalace?: boolean;
  /** 大限信息 */
  decadal?: DecadalInfo | null;
  /** 小限信息 */
  turnLimit?: TurnLimitInfo | null;
}

/** 大限信息 */
export interface DecadalInfo {
  /** 起始年龄 */
  startAge: number;
  /** 结束年龄 */
  endAge: number;
  /** 大限天干 */
  stem?: HeavenlyStem;
  /** 大限地支 */
  branch?: EarthlyBranch;
}

/** 小限信息 */
export interface TurnLimitInfo {
  /** 小限年龄 */
  age: number;
  /** 小限地支 */
  branch?: EarthlyBranch;
}

// ============================================================
// 命盘数据结构
// ============================================================

/** 完整命盘 */
export interface ZiweiChart {
  /** 基础信息 */
  basic: ChartBasicInfo;
  /** 十二宫 */
  palaces: Palace[];
  /** 生年四化 */
  birthSihua: BirthSihua;
  /** 命主 */
  soulMaster: string;
  /** 身主 */
  bodyMaster: string;
  /** 版本号 */
  version: string;
}

/** 基础信息 */
export interface ChartBasicInfo {
  /** 性别 */
  gender: Gender;
  /** 阳历日期 */
  solarDate: string;
  /** 农历日期 */
  lunarDate: string;
  /** 干支日期 */
  chineseDate: string;
  /** 生肖 */
  zodiac: string;
  /** 星座 */
  sign: string;
  /** 五行局 */
  fiveElementsClass: WuXingJu;
  /** 命主 */
  soul: string;
  /** 身主 */
  body: string;
  /** 命宫地支 */
  earthlyBranchOfSoulPalace: EarthlyBranch;
  /** 身宫地支 */
  earthlyBranchOfBodyPalace: EarthlyBranch;
  /** 真太阳时校正 */
  solarTimeCorrection?: number;
  /** 出生地经纬度 */
  location?: {
    longitude: number;
    latitude: number;
  };
}

/** 生年四化 */
export interface BirthSihua {
  /** 化禄星 */
  lu: { star: string; palace: string };
  /** 化权星 */
  quan: { star: string; palace: string };
  /** 化科星 */
  ke: { star: string; palace: string };
  /** 化忌星 */
  ji: { star: string; palace: string };
  /** 天干 */
  stem: HeavenlyStem;
}

// ============================================================
// 动态盘数据结构
// ============================================================

/** 时间维度 */
export type TimeDimension = 'birth' | 'decade' | 'turn' | 'year' | 'month' | 'day' | 'hour';

/** 动态四化 */
export interface DynamicSihua {
  /** 作用层级 */
  level: TimeDimension;
  /** 禄 */
  lu: { star: string; palace: string };
  /** 权 */
  quan: { star: string; palace: string };
  /** 科 */
  ke: { star: string; palace: string };
  /** 忌 */
  ji: { star: string; palace: string };
  /** 飞化来源宫 */
  sourcePalace?: string;
}

/** 流年盘 */
export interface AnnualChart {
  /** 年份 */
  year: number;
  /** 流年地支 */
  branch: EarthlyBranch;
  /** 流年天干 */
  stem: HeavenlyStem;
  /** 流年四化 */
  sihua: DynamicSihua;
  /** 流年命宫 */
  mingGong: string;
  /** 流年各宫星曜 */
  palaces: Palace[];
  /** 与本命盘交叠后的信息 */
  overlays: OverlayInfo[];
}

/** 流月盘 */
export interface MonthlyChart {
  /** 年份 */
  year: number;
  /** 月份 */
  month: number;
  /** 流月地支 */
  branch: EarthlyBranch;
  /** 流月四化 */
  sihua: DynamicSihua;
  /** 流月各宫 */
  palaces: Palace[];
}

/** 交叠信息 */
export interface OverlayInfo {
  /** 本命宫位 */
  natalPalace: string;
  /** 流年宫位 */
  annualPalace: string;
  /** 交叠类型 */
  type: 'same' | 'opposite' | 'three-combination';
}

// ============================================================
// 飞星数据结构
// ============================================================

/** 飞化结果 */
export interface FlyingStarResult {
  /** 来源宫 */
  sourcePalace: string;
  /** 来源天干 */
  sourceStem: HeavenlyStem;
  /** 化禄飞入 */
  luFlying: { star: string; targetPalace: string; isSelf: boolean };
  /** 化权飞入 */
  quanFlying: { star: string; targetPalace: string; isSelf: boolean };
  /** 化科飞入 */
  keFlying: { star: string; targetPalace: string; isSelf: boolean };
  /** 化忌飞入 */
  jiFlying: { star: string; targetPalace: string; isSelf: boolean };
  /** 自化（四化落回本宫） */
  selfTransformations: {
    lu?: boolean;
    quan?: boolean;
    ke?: boolean;
    ji?: boolean;
  };
  /** 冲会（化出之星冲对宫） */
  collisions: CollisionInfo[];
}

/** 冲会信息 */
export interface CollisionInfo {
  /** 化出类型 */
  mutagen: MutagenType;
  /** 飞入星 */
  star: string;
  /** 被冲宫位 */
  collidedPalace: string;
}

/** 四化因果链 */
export interface CausalChain {
  /** 起点宫 */
  startPalace: string;
  /** 链条节点 */
  nodes: ChainNode[];
  /** 链条长度 */
  depth: number;
}

/** 链节点 */
export interface ChainNode {
  /** 当前宫 */
  palace: string;
  /** 飞入四化 */
  mutagen: MutagenType;
  /** 飞入星 */
  star: string;
  /** 目标宫 */
  targetPalace: string;
  /** 吉凶评估 */
  assessment: '吉' | '凶' | '中性';
}

// ============================================================
// 流派类型
// ============================================================

/** 流派 ID */
export type SchoolId = 'feixing' | 'sanhe' | 'beipai' | 'nanpai' | 'zhongzhou';

/** 流派信息 */
export interface SchoolInfo {
  id: SchoolId;
  name: string;
  description: string;
  foundedYear?: string;
  keyMethods: string[];
}

// ============================================================
// 分析结果数据结构
// ============================================================

/** 分析结果 */
export interface AnalysisResult {
  /** 命盘概览 */
  overview: {
    mainStars: string[];
    patterns: string[];
    overallLevel: '上上' | '上' | '中上' | '中' | '中下';
  };
  /** 格局检测 */
  detectedPatterns: DetectedPattern[];
  /** 四化分析 */
  sihuaAnalysis: SihuaAnalysis;
  /** 飞星分析 */
  flyingStarAnalysis?: FlyingStarAnalysis;
  /** 大限分析 */
  decadalAnalysis: DecadalAnalysis[];
  /** 流年分析 */
  annualAnalysis?: AnnualAnalysis;
  /** 各宫解读 */
  palaceAnalyses: PalaceAnalysis[];
  /** 古籍引用 */
  classicalReferences: ClassicalReference[];
  /** 综合建议 */
  suggestions: string[];
}

/** 检测到的格局 */
export interface DetectedPattern {
  id: string;
  name: string;
  category: string;
  matched: boolean;
  description: string;
  successCondition?: string;
  failureCondition?: string;
  classicSource?: string;
  weight: number;
}

/** 四化分析 */
export interface SihuaAnalysis {
  /** 生年四化 */
  birth: DynamicSihua;
  /** 四化解读 */
  interpretations: {
    lu: string;
    quan: string;
    ke: string;
    ji: string;
  };
  /** 四化吉凶评估 */
  overallAssessment: string;
}

/** 飞星分析 */
export interface FlyingStarAnalysis {
  /** 各宫飞化 */
  palaceFlying: FlyingStarResult[];
  /** 因果链 */
  causalChains: CausalChain[];
  /** 关键飞化 */
  keyFlying: {
    fromPalace: string;
    toPalace: string;
    mutagen: MutagenType;
    meaning: string;
  }[];
}

/** 大限分析 */
export interface DecadalAnalysis {
  range: string;
  palaceName: string;
  majorStars: string[];
  sihua: DynamicSihua;
  strength: number;
  fortune: string;
  caution: string;
  keyEvents: string[];
}

/** 流年分析 */
export interface AnnualAnalysis {
  year: number;
  palaceName: string;
  majorStars: string[];
  sihua: DynamicSihua;
  annualFortune: {
    overall: string;
    career: string;
    wealth: string;
    relationship: string;
    health: string;
  };
  monthlyHighlights: { month: number; highlight: string }[];
}

/** 宫位解读 */
export interface PalaceAnalysis {
  palace: string;
  area: string;
  mainStarReading: string;
  starCombinationReading: string;
  brightnessReading: string;
  sihuaReading: string;
  sanfangReading: string;
  overall: string;
  advice: string;
}

/** 古籍引用 */
export interface ClassicalReference {
  source: string;
  title: string;
  content: string;
  relevance: string;
}

// ============================================================
// 规则引擎数据结构
// ============================================================

/** 规则接口 */
export interface IZWRule {
  id: string;
  name: string;
  version: string;
  category: string;
  priority: number;
  enabled: boolean;
  description: string;
  
  /** 匹配函数 */
  match(chart: ZiweiChart, context: AnalysisContext): boolean;
  
  /** 获取权重 */
  getWeight(chart: ZiweiChart, context: AnalysisContext): number;
  
  /** 生成解读文本 */
  generateText(chart: ZiweiChart, context: AnalysisContext): string;
  
  /** 获取关联规则 ID */
  getRelatedRuleIds(): string[];
  
  /** 获取古籍引用 */
  getClassicalReferences(): ClassicalReference[];
}

/** 规则上下文 */
export interface AnalysisContext {
  /** 分析流派 */
  school: SchoolId;
  /** 时间维度 */
  timeDimension: TimeDimension;
  /** 流年（如有） */
  year?: number;
  /** 流月（如有） */
  month?: number;
  /** 用户自定义参数 */
  params?: Record<string, unknown>;
}

/** 规则分类 */
export type RuleCategory = 
  | 'pattern'      // 格局判定
  | 'star'         // 星曜解读
  | 'palace'       // 宫位解读
  | 'sihua'        // 四化分析
  | 'flying'       // 飞星分析
  | 'decadal'      // 大限分析
  | 'annual'       // 流年分析
  | 'classic';     // 古籍引用
