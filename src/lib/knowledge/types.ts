/**
 * 命理知识系统 - 客户端安全类型和常量
 */

export type ArticleCategory = 'basic' | 'bazi' | 'ziwei' | 'qimen' | 'meihua';
export type ArticleLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: ArticleCategory;
  categoryName: string;
  summary: string;
  content: string;
  contentHtml?: string;
  tags: string[];
  level: ArticleLevel;
  levelName: string;
  icon: string;
  image?: string; // 封面图路径（相对 /images/knowledge/）
  order?: number;
  relatedIds?: string[];
  prevId?: string;
  nextId?: string;
  readingTime?: number;
}

export interface KnowledgeCategory {
  id: ArticleCategory;
  name: string;
  icon: string;
  description: string;
  color: string;
  articleCount: number;
  subCategories: KnowledgeSubCategory[];
}

export interface KnowledgeSubCategory {
  name: string;
  description: string;
  articleIds: string[];
}

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  icon: string;
  stages: LearningStage[];
  totalArticles: number;
}

export interface LearningStage {
  name: string;
  description: string;
  articles: string[];
}

// ============ 分类定义 ============

export const KNOWLEDGE_CATEGORIES: Omit<KnowledgeCategory, 'articleCount'>[] = [
  {
    id: 'basic',
    name: '命理基础',
    icon: '📚',
    description: '阴阳五行、天干地支等基础知识',
    color: 'amber',
    subCategories: [
      { name: '阴阳五行', description: '阴阳学说、五行生克、旺衰理论', articleIds: [] },
      { name: '天干地支', description: '十天干、十二地支、六十甲子', articleIds: [] },
      { name: '基础概念', description: '四柱结构、大运流年、神煞', articleIds: [] },
    ],
  },
  {
    id: 'bazi',
    name: '四柱八字',
    icon: '🏛️',
    description: '八字排盘、十神、格局分析、大运流年',
    color: 'red',
    subCategories: [
      { name: '排盘入门', description: '年柱月柱日柱时柱推算方法', articleIds: [] },
      { name: '十神系统', description: '十神详解、组合、喜忌', articleIds: [] },
      { name: '格局分析', description: '正格变格、从格、化气格', articleIds: [] },
      { name: '用神大运', description: '用神取法、大运判断、流年应期', articleIds: [] },
    ],
  },
  {
    id: 'ziwei',
    name: '紫微斗数',
    icon: '⭐',
    description: '十二宫位、十四主星、四化飞星、格局判断',
    color: 'purple',
    subCategories: [
      { name: '基础入门', description: '命宫身宫、十二宫位、五行局', articleIds: [] },
      { name: '星曜详解', description: '十四主星、六吉六煞、杂曜', articleIds: [] },
      { name: '四化格局', description: '四化飞星、经典格局、现代应用', articleIds: [] },
    ],
  },
  {
    id: 'qimen',
    name: '奇门遁甲',
    icon: '🧭',
    description: '九宫八门、天地人神四盘、吉凶判断',
    color: 'blue',
    subCategories: [
      { name: '基础入门', description: '阴阳遁、节气定局、九宫八卦', articleIds: [] },
      { name: '天地人神', description: '九星、八门、八神、十干克应', articleIds: [] },
      { name: '实战应用', description: '决策文化、经典案例、灵活运用', articleIds: [] },
    ],
  },
  {
    id: 'meihua',
    name: '梅花易数',
    icon: '🌸',
    description: '起卦方法、八卦解读、体用分析',
    color: 'pink',
    subCategories: [
      { name: '起卦方法', description: '数字/时间/文字/物象起卦', articleIds: [] },
      { name: '八卦详解', description: '八卦含义、卦象解读、爻位分析', articleIds: [] },
      { name: '体用断卦', description: '体用生克、分类断卦、应期推断', articleIds: [] },
    ],
  },
];

// ============ 学习路径 ============

export const LEARNING_PATHS: LearningPath[] = [
  {
    id: 'bazi-beginner',
    name: '八字从零入门',
    description: '从零开始系统学习四柱八字，适合完全初学者',
    icon: '📖',
    totalArticles: 12,
    stages: [
      {
        name: '打好基础',
        description: '先掌握阴阳五行和天干地支',
        articles: ['basic-yinyang', 'basic-wuxing', 'basic-tiangan'],
      },
      {
        name: '认识八字',
        description: '理解四柱结构和排盘方法',
        articles: ['bazi-intro', 'bazi-paiPan'],
      },
      {
        name: '十神入门',
        description: '学习十神体系和基本判断',
        articles: ['bazi-shishen', 'bazi-shishen-group'],
      },
      {
        name: '格局与用神',
        description: '了解格局分类和用神取法',
        articles: ['bazi-geju-zheng', 'bazi-yongshen'],
      },
      {
        name: '大运流年',
        description: '学习大运起法和流年判断',
        articles: ['bazi-dayun', 'bazi-liunian', 'bazi-yingqi'],
      },
      {
        name: '实战入门',
        description: '通过案例学习综合分析',
        articles: ['bazi-case-career'],
      },
    ],
  },
  {
    id: 'ziwei-beginner',
    name: '紫微斗数入门',
    description: '系统学习紫微斗数，掌握十二宫位和主星',
    icon: '⭐',
    totalArticles: 11,
    stages: [
      {
        name: '基础概念',
        description: '了解紫微斗数的基本框架',
        articles: ['ziwei-intro', 'ziwei-gongwei'],
      },
      {
        name: '认识主星',
        description: '学习十四主星的基本含义',
        articles: ['ziwei-stars-overview', 'ziwei-stars-ziwei', 'ziwei-stars-tianfu'],
      },
      {
        name: '辅星与四化',
        description: '了解辅星作用和四化飞星',
        articles: ['ziwei-fuxing', 'ziwei-sihua'],
      },
      {
        name: '格局判断',
        description: '学习常见格局和应用',
        articles: ['ziwei-geju', 'ziwei-daxian'],
      },
      {
        name: '实战案例',
        description: '通过实际命盘学习综合分析',
        articles: ['ziwei-case-career', 'ziwei-case-marriage'],
      },
    ],
  },
  {
    id: 'meihua-beginner',
    name: '梅花易数入门',
    description: '从零学习梅花易数起卦与断卦',
    icon: '🌸',
    totalArticles: 10,
    stages: [
      {
        name: '基础准备',
        description: '了解八卦和起卦原理',
        articles: ['basic-bagua', 'meihua-intro'],
      },
      {
        name: '起卦方法',
        description: '学习各种起卦方式',
        articles: ['meihua-number', 'meihua-coin', 'meihua-text'],
      },
      {
        name: '八卦详解',
        description: '深入理解八卦含义',
        articles: ['meihua-bagua-qian', 'meihua-bagua-kun'],
      },
      {
        name: '体用断卦',
        description: '掌握体用关系和吉凶判断',
        articles: ['meihua-tiyong', 'meihua-duangua', 'meihua-yingqi'],
      },
    ],
  },
];
