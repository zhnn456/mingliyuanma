/**
 * 紫微斗数 · 古籍原文知识库
 * 
 * 收录《骨髓赋》《太微赋》《紫微斗数全书》等经典著作中的核心断语
 * 用于解读时引用古籍原文，增强权威性
 */

/** 古籍条目 */
export interface ClassicText {
  id: string;
  source: string;      // 出处：《骨髓赋》《太微赋》等
  title: string;       // 标题
  dynasty?: string;    // 朝代
  author?: string;     // 作者
  content: string;     // 原文
  interpretation?: string; // 白话解读
  applicableStars?: string[]; // 适用星曜
  applicablePalaces?: string[]; // 适用宫位
  tags?: string[];     // 标签
}

// ============================================================
// 《太微赋》精选
// ============================================================

export const TAIWEI_FU: ClassicText[] = [
  {
    id: 'taiwei_001',
    source: '《太微赋》',
    title: '紫微帝座',
    dynasty: '宋',
    author: '陈希夷',
    content: '紫微帝座，以辅弼为佐，以天相为印。得之者贵气充盈，一生顺遂。',
    interpretation: '紫微星作为帝星，需要左辅右弼的辅佐和天相星的印绶，才能发挥最大作用。有这些星拱照的紫微星，主大贵。',
    applicableStars: ['紫微', '左辅', '右弼', '天相'],
    tags: ['紫微', '辅弼', '贵气'],
  },
  {
    id: 'taiwei_002',
    source: '《太微赋》',
    title: '日月并明',
    dynasty: '宋',
    author: '陈希夷',
    content: '日月并明，主光明磊落，福禄双全。居庙旺则名扬四海，陷地则劳碌奔波。',
    interpretation: '太阳和太阴同时照耀命盘，主命主性格光明磊落，福气深厚。但如果星曜落陷地，则福气减损，反而奔波劳碌。',
    applicableStars: ['太阳', '太阴'],
    tags: ['太阳', '太阴', '福禄'],
  },
  {
    id: 'taiwei_003',
    source: '《太微赋》',
    title: '禄马交驰',
    dynasty: '宋',
    author: '陈希夷',
    content: '禄马交驰，动中生财。得禄而不得马，财运难发；得马而不得禄，奔波徒劳。',
    interpretation: '禄存和天马同时存在的命盘，财运是在行动中获得的。两者缺一不可：只有禄没有马，财运难以发动；只有马没有禄，只会奔波劳累。',
    applicableStars: ['禄存', '天马'],
    tags: ['禄存', '天马', '财运'],
  },
  {
    id: 'taiwei_004',
    source: '《太微赋》',
    title: '府相朝垣',
    dynasty: '宋',
    author: '陈希夷',
    content: '府相朝垣，主稳重有成，贵人相助。天府为禄库，天相为印绶，两相朝拱，富贵双全。',
    interpretation: '天府和天相在命宫两侧朝拱，如同两座靠山，主命主稳重可靠，一生有贵人相助。天府负责守财，天相负责协调，配合默契。',
    applicableStars: ['天府', '天相'],
    tags: ['天府', '天相', '贵人'],
  },
  {
    id: 'taiwei_005',
    source: '《太微赋》',
    title: '机月同梁',
    dynasty: '宋',
    author: '陈希夷',
    content: '机月同梁，智慧超群。天机主智，太阴主思，天梁主荫，同宫或三合，聪明过人。',
    interpretation: '天机、太阴、天梁三颗星相遇，构成智慧格局。天机星赋予智慧，太阴星赋予深思，天梁星赋予荫庇，三者结合使命主聪明过人，适合研究策划。',
    applicableStars: ['天机', '太阴', '天梁'],
    tags: ['天机', '太阴', '天梁', '智慧'],
  },
];

// ============================================================
// 《骨髓赋》精选
// ============================================================

export const GUSUI_FU: ClassicText[] = [
  {
    id: 'gusui_001',
    source: '《骨髓赋》',
    title: '紫微居午',
    dynasty: '宋',
    author: '陈希夷',
    content: '紫微居午，庙旺之乡，名为"极向离明"，主大贵。',
    interpretation: '紫微星在午宫（正南方位），处于庙旺状态，这是紫微最理想的位置之一，称为"极向离明"格，主命主大富大贵。',
    applicableStars: ['紫微'],
    applicablePalaces: ['午'],
    tags: ['紫微', '午宫', '大贵'],
  },
  {
    id: 'gusui_002',
    source: '《骨髓赋》',
    title: '太阴居亥',
    dynasty: '宋',
    author: '陈希夷',
    content: '太阴居亥，水澄桂萼之象。月光皎洁，主富有艺术气质，财运佳。',
    interpretation: '太阴星在亥宫，如同秋夜的月光澄澈明亮，主命主富有艺术气质，财运亨通，尤其不动产投资有利。',
    applicableStars: ['太阴'],
    applicablePalaces: ['亥'],
    tags: ['太阴', '亥宫', '艺术', '财运'],
  },
  {
    id: 'gusui_003',
    source: '《骨髓赋》',
    title: '破军居子午',
    dynasty: '宋',
    author: '陈希夷',
    content: '破军居子午，四海扬名。陷地逢之，破败祖业。',
    interpretation: '破军星在子或午宫（对宫位置），处于庙旺状态时，主命主能够在外地扬名。但如果落陷地，则会破败祖业。',
    applicableStars: ['破军'],
    applicablePalaces: ['子', '午'],
    tags: ['破军', '子午', '扬名'],
  },
  {
    id: 'gusui_004',
    source: '《骨髓赋》',
    title: '七杀朝斗',
    dynasty: '宋',
    author: '陈希夷',
    content: '七杀朝斗，权威显赫。得禄则为将星，失禄则为凶煞。',
    interpretation: '七杀星朝拱斗柄（紫微、北斗方向），主命主权威显赫，有将帅之才。如果有禄存同宫，则是将星格局；如果没有禄存，则变为凶煞。',
    applicableStars: ['七杀', '紫微'],
    tags: ['七杀', '权威', '将星'],
  },
  {
    id: 'gusui_005',
    source: '《骨髓赋》',
    title: '贪狼在戌',
    dynasty: '宋',
    author: '陈希夷',
    content: '贪狼在戌，名为"桃花犯主"。主多才多艺，但需防桃花劫。',
    interpretation: '贪狼星在戌宫，与紫微对宫相望，形成"桃花犯主"格局。主命主多才多艺，社交活跃，但感情世界复杂，需防桃花带来的麻烦。',
    applicableStars: ['贪狼'],
    applicablePalaces: ['戌'],
    tags: ['贪狼', '桃花', '才艺'],
  },
];

// ============================================================
// 《紫微斗数全书》精选
// ============================================================

export const QUANSHU: ClassicText[] = [
  {
    id: 'quanshu_001',
    source: '《紫微斗数全书》',
    title: '紫微为帝',
    dynasty: '清',
    author: '王道亨',
    content: '紫微为帝星，居命宫者，主领导才能，为人正直大方，有王者风范。',
    interpretation: '紫微星作为紫微斗数的帝星，进入命宫的命主天生具备领导才能，为人正直慷慨，有王者气度。',
    applicableStars: ['紫微'],
    applicablePalaces: ['命宫'],
    tags: ['紫微', '命宫', '领导'],
  },
  {
    id: 'quanshu_002',
    source: '《紫微斗数全书》',
    title: '天机为兄弟主',
    dynasty: '清',
    author: '王道亨',
    content: '天机为兄弟主，以智谋为用。居命宫者，聪明机智，善于谋略。',
    interpretation: '天机星是兄弟宫的主星，以智慧谋略为用。进入命宫的命主聪明机智，善于策划，但也容易想太多。',
    applicableStars: ['天机'],
    applicablePalaces: ['命宫'],
    tags: ['天机', '智慧', '谋略'],
  },
  {
    id: 'quanshu_003',
    source: '《紫微斗数全书》',
    title: '武曲司财',
    dynasty: '清',
    author: '王道亨',
    content: '武曲属金，司财帛之权。居财帛宫者，财运亨通，是为财星入财库。',
    interpretation: '武曲星属金，掌管财帛之权。进入财帛宫的命主财运极佳，这是最有利于求财的位置之一。',
    applicableStars: ['武曲'],
    applicablePalaces: ['财帛宫'],
    tags: ['武曲', '财帛', '财运'],
  },
  {
    id: 'quanshu_004',
    source: '《紫微斗数全书》',
    title: '廉贞为次桃花',
    dynasty: '清',
    author: '王道亨',
    content: '廉贞为次桃花，在官禄为政星。居官禄者，宜政界、法律。',
    interpretation: '廉贞星是次桃花星，在官禄宫时变成政星。进入官禄宫的命主适合从政、法律行业，有政治手腕。',
    applicableStars: ['廉贞'],
    applicablePalaces: ['官禄宫'],
    tags: ['廉贞', '官禄', '政治'],
  },
  {
    id: 'quanshu_005',
    source: '《紫微斗数全书》',
    title: '贪狼为第一桃花',
    dynasty: '清',
    author: '王道亨',
    content: '贪狼为第一桃花星，主才艺与欲望。居命宫者，多才多艺，交际广泛。',
    interpretation: '贪狼星是第一桃花星，代表才艺和欲望。进入命宫的命主多才多艺，善于交际，但也容易沉溺于欲望。',
    applicableStars: ['贪狼'],
    applicablePalaces: ['命宫'],
    tags: ['贪狼', '桃花', '才艺'],
  },
  {
    id: 'quanshu_006',
    source: '《紫微斗数全书》',
    title: '天梁为荫星',
    dynasty: '清',
    author: '王道亨',
    content: '天梁为荫星，主寿与贵，逢凶化吉。居命宫者，正直清高，有长者风范。',
    interpretation: '天梁星是荫星，主管寿命和贵气，能够逢凶化吉。进入命宫的命主正直清高，有长者风范，一生多得贵人庇佑。',
    applicableStars: ['天梁'],
    applicablePalaces: ['命宫'],
    tags: ['天梁', '荫星', '贵人'],
  },
];

// ============================================================
// 汇总导出
// ============================================================

/** 所有古籍文本 */
export const ALL_CLASSIC_TEXTS: ClassicText[] = [
  ...TAIWEI_FU,
  ...GUSUI_FU,
  ...QUANSHU,
];

/**
 * 根据星曜查询相关古籍
 */
export function findClassicsByStar(starName: string): ClassicText[] {
  return ALL_CLASSIC_TEXTS.filter(t => 
    t.applicableStars?.includes(starName)
  );
}

/**
 * 根据宫位查询相关古籍
 */
export function findClassicsByPalace(palaceName: string): ClassicText[] {
  return ALL_CLASSIC_TEXTS.filter(t => 
    t.applicablePalaces?.includes(palaceName)
  );
}

/**
 * 根据标签查询古籍
 */
export function findClassicsByTag(tag: string): ClassicText[] {
  return ALL_CLASSIC_TEXTS.filter(t => t.tags?.includes(tag));
}

/**
 * 获取指定条件的古籍引用
 */
export function getRelevantClassics(chart: ZiweiChart): ClassicText[] {
  const relevant = new Set<ClassicText>();
  
  // 收集所有主星
  const allMajorStars = new Set<string>();
  chart.palaces.forEach(p => {
    p.majorStars.forEach(s => allMajorStars.add(s.name));
  });
  
  // 查找相关古籍
  allMajorStars.forEach(star => {
    findClassicsByStar(star).forEach(t => relevant.add(t));
  });
  
  return Array.from(relevant);
}

// 需要在导入处补充类型
import type { ZiweiChart } from '../../interfaces/chart';
