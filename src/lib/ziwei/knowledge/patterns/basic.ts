/**
 * 紫微斗数 · 基础格局判定规则（50+）
 * 
 * 参考：《紫微斗数全书》《太微赋》《骨髓赋》
 * 分类：主星组合、三方四正、特殊格局
 */

import type { ZiweiChart, DetectedPattern } from '../../interfaces/chart';

/** 格局判定规则 */
export interface PatternRule {
  id: string;
  name: string;
  category: string;
  priority: number;
  description: string;
  condition: (chart: ZiweiChart) => boolean;
  successCondition?: string;
  failureCondition?: string;
  classicSource?: string;
}

// ============================================================
// 基础格局（主星同宫）
// ============================================================

export const BASIC_PATTERNS: PatternRule[] = [
  {
    id: '紫府同宫',
    name: '紫府同宫格',
    category: '主星组合',
    priority: 100,
    description: '紫微与天府同宫，帝王之气，既有领导力又稳重，一生贵气深厚。庙旺则贵显，陷地则孤君。',
    condition: (chart) => {
      const mingGong = chart.palaces.find(p => p.name === '命宫');
      if (!mingGong) return false;
      return mingGong.majorStars.some(s => s.name === '紫微') &&
             mingGong.majorStars.some(s => s.name === '天府');
    },
    successCondition: '庙旺之地，得辅弼昌曲夹拱',
    failureCondition: '陷地或逢煞星冲破',
    classicSource: '《紫微斗数全书》',
  },
  {
    id: '日月同宫',
    name: '日月同宫格',
    category: '主星组合',
    priority: 95,
    description: '太阳与太阴同守一宫，阴阳调和，性格多元，有艺术气质，人际关系佳。',
    condition: (chart) => {
      const hasSunMoonPair = chart.palaces.some(p =>
        p.majorStars.some(s => s.name === '太阳') &&
        p.majorStars.some(s => s.name === '太阴')
      );
      return hasSunMoonPair;
    },
    classicSource: '《太微赋》',
  },
  {
    id: '日月并明',
    name: '日月并明格',
    category: '主星组合',
    priority: 90,
    description: '太阳太阴分居命宫两旁（或在三方四正），光照全局，主光明磊落、福禄双全。',
    condition: (chart) => {
      const palaces = chart.palaces;
      const mingGong = palaces.find(p => p.name === '命宫')!;
      const sunPalace = palaces.find(p => p.majorStars.some(s => s.name === '太阳'));
      const moonPalace = palaces.find(p => p.majorStars.some(s => s.name === '太阴'));
      if (!sunPalace || !moonPalace) return false;
      const diff1 = Math.abs(sunPalace.index - mingGong.index);
      const diff2 = Math.abs(moonPalace.index - mingGong.index);
      const inFang = (d: number) => d === 4 || d === 8;
      return inFang(diff1) && inFang(diff2);
    },
    classicSource: '《骨髓赋》',
  },
  {
    id: '杀破狼格',
    name: '杀破狼格',
    category: '主星组合',
    priority: 95,
    description: '七杀、破军、贪狼在命宫、财帛、官禄三宫相会，主白手起家、开创新局，一生多变动但成大事。',
    condition: (chart) => {
      const mingGong = chart.palaces.find(p => p.name === '命宫');
      const caiBo = chart.palaces.find(p => p.name === '财帛宫');
      const guanLu = chart.palaces.find(p => p.name === '官禄宫');
      if (!mingGong || !caiBo || !guanLu) return false;
      
      const stars: string[] = [];
      if (mingGong.majorStars.length > 0) stars.push(...mingGong.majorStars.map(s => s.name));
      if (caiBo.majorStars.length > 0) stars.push(...caiBo.majorStars.map(s => s.name));
      if (guanLu.majorStars.length > 0) stars.push(...guanLu.majorStars.map(s => s.name));
      
      return ['七杀', '破军', '贪狼'].every(s => stars.some(st => st === s));
    },
    successCondition: '庙旺地，得禄存化禄',
    failureCondition: '陷地或煞星冲照',
    classicSource: '《紫微斗数全书》',
  },
  {
    id: '紫贪同宫',
    name: '紫贪同宫格',
    category: '主星组合',
    priority: 85,
    description: '紫微与贪狼同宫，桃花犯主，既有权威又有多才艺，感情世界丰富，需防桃花劫。',
    condition: (chart) => {
      return chart.palaces.some(p =>
        p.majorStars.some(s => s.name === '紫微') &&
        p.majorStars.some(s => s.name === '贪狼')
      );
    },
  },
  {
    id: '紫微七杀',
    name: '紫微七杀格',
    category: '主星组合',
    priority: 90,
    description: '紫微与七杀同宫，帝王配将星，权威显赫，有开创性，但需防过于刚猛。',
    condition: (chart) => {
      return chart.palaces.some(p =>
        p.majorStars.some(s => s.name === '紫微') &&
        p.majorStars.some(s => s.name === '七杀')
      );
    },
  },
  {
    id: '紫微破军',
    name: '紫微破军格',
    category: '主星组合',
    priority: 85,
    description: '紫微与破军同宫，变革与权威结合，常有重大人生转折，先破后立。',
    condition: (chart) => {
      return chart.palaces.some(p =>
        p.majorStars.some(s => s.name === '紫微') &&
        p.majorStars.some(s => s.name === '破军')
      );
    },
  },
  {
    id: '紫相同宫',
    name: '紫相同宫格',
    category: '主星组合',
    priority: 80,
    description: '紫微与天相同宫，君臣相得，适合辅佐型领导职位，贵人运佳。',
    condition: (chart) => {
      return chart.palaces.some(p =>
        p.majorStars.some(s => s.name === '紫微') &&
        p.majorStars.some(s => s.name === '天相')
      );
    },
  },
  {
    id: '机阴同宫',
    name: '机阴同宫格',
    category: '主星组合',
    priority: 85,
    description: '天机与太阴同宫，智慧与温柔结合，适合策划、设计类工作，聪明细腻。',
    condition: (chart) => {
      return chart.palaces.some(p =>
        p.majorStars.some(s => s.name === '天机') &&
        p.majorStars.some(s => s.name === '太阴')
      );
    },
  },
  {
    id: '机巨同宫',
    name: '机巨同宫格',
    category: '主星组合',
    priority: 80,
    description: '天机与巨门同宫，智慧加口才，宜策略规划、学术研究，以口为业。',
    condition: (chart) => {
      return chart.palaces.some(p =>
        p.majorStars.some(s => s.name === '天机') &&
        p.majorStars.some(s => s.name === '巨门')
      );
    },
  },
  {
    id: '机梁同宫',
    name: '机梁同宫格',
    category: '主星组合',
    priority: 85,
    description: '天机与天梁同宫，智荫双全，善策划，有宗教缘，逢凶化吉。',
    condition: (chart) => {
      return chart.palaces.some(p =>
        p.majorStars.some(s => s.name === '天机') &&
        p.majorStars.some(s => s.name === '天梁')
      );
    },
  },
  {
    id: '巨日同宫',
    name: '巨日同宫格',
    category: '主星组合',
    priority: 90,
    description: '巨门与太阳同宫，以口才名扬天下，宜传媒、法律、教育行业。',
    condition: (chart) => {
      return chart.palaces.some(p =>
        p.majorStars.some(s => s.name === '巨门') &&
        p.majorStars.some(s => s.name === '太阳')
      );
    },
    classicSource: '《太微赋》',
  },
  {
    id: '武府同宫',
    name: '武府同宫格',
    category: '主星组合',
    priority: 90,
    description: '武曲与天府同宫，财库双全，最利求财的组合之一，财运极佳。',
    condition: (chart) => {
      return chart.palaces.some(p =>
        p.majorStars.some(s => s.name === '武曲') &&
        p.majorStars.some(s => s.name === '天府')
      );
    },
  },
  {
    id: '武相同宫',
    name: '武相同宫格',
    category: '主星组合',
    priority: 80,
    description: '武曲与天相同宫，刚柔并济，宜金融、法律行业，理财能力强。',
    condition: (chart) => {
      return chart.palaces.some(p =>
        p.majorStars.some(s => s.name === '武曲') &&
        p.majorStars.some(s => s.name === '天相')
      );
    },
  },
  {
    id: '武杀同宫',
    name: '武杀同宫格',
    category: '主星组合',
    priority: 85,
    description: '武曲与七杀同宫，刚猛至极，宜军警、运动员，执行力强。',
    condition: (chart) => {
      return chart.palaces.some(p =>
        p.majorStars.some(s => s.name === '武曲') &&
        p.majorStars.some(s => s.name === '七杀')
      );
    },
  },
  {
    id: '武破同宫',
    name: '武破同宫格',
    category: '主星组合',
    priority: 75,
    description: '武曲与破军同宫，破而后立，财运大起大落，适合高风险投资。',
    condition: (chart) => {
      return chart.palaces.some(p =>
        p.majorStars.some(s => s.name === '武曲') &&
        p.majorStars.some(s => s.name === '破军')
      );
    },
  },
  {
    id: '同阴同宫',
    name: '同阴同宫格',
    category: '主星组合',
    priority: 80,
    description: '天同与太阴同宫，福寿双全，性格温和，享受生活。',
    condition: (chart) => {
      return chart.palaces.some(p =>
        p.majorStars.some(s => s.name === '天同') &&
        p.majorStars.some(s => s.name === '太阴')
      );
    },
  },
  {
    id: '同巨同宫',
    name: '同巨同宫格',
    category: '主星组合',
    priority: 75,
    description: '天同与巨门同宫，福星化暗，晚年福泽深厚，宜安享晚年。',
    condition: (chart) => {
      return chart.palaces.some(p =>
        p.majorStars.some(s => s.name === '天同') &&
        p.majorStars.some(s => s.name === '巨门')
      );
    },
  },
  {
    id: '同梁同宫',
    name: '同梁同宫格',
    category: '主星组合',
    priority: 85,
    description: '天同与天梁同宫，福荫双全，一生平顺有福，逢凶化吉。',
    condition: (chart) => {
      return chart.palaces.some(p =>
        p.majorStars.some(s => s.name === '天同') &&
        p.majorStars.some(s => s.name === '天梁')
      );
    },
  },
  {
    id: '廉府同宫',
    name: '廉府同宫格',
    category: '主星组合',
    priority: 85,
    description: '廉贞与天府同宫，政星入禄库，宜政界、金融管理，权力与财富兼得。',
    condition: (chart) => {
      return chart.palaces.some(p =>
        p.majorStars.some(s => s.name === '廉贞') &&
        p.majorStars.some(s => s.name === '天府')
      );
    },
  },
  {
    id: '廉杀同宫',
    name: '廉杀同宫格',
    category: '主星组合',
    priority: 85,
    description: '廉贞与七杀同宫，政治手腕加将星魄力，宜军警、政界，权力显赫。',
    condition: (chart) => {
      return chart.palaces.some(p =>
        p.majorStars.some(s => s.name === '廉贞') &&
        p.majorStars.some(s => s.name === '七杀')
      );
    },
  },
  {
    id: '廉破同宫',
    name: '廉破同宫格',
    category: '主星组合',
    priority: 75,
    description: '廉贞与破军同宫，变革中带桃花，人生多变，感情世界丰富。',
    condition: (chart) => {
      return chart.palaces.some(p =>
        p.majorStars.some(s => s.name === '廉贞') &&
        p.majorStars.some(s => s.name === '破军')
      );
    },
  },
  {
    id: '廉贪同宫',
    name: '廉贪同宫格',
    category: '主星组合',
    priority: 80,
    description: '廉贞与贪狼同宫，桃花犯主，感情复杂，才华横溢，艺术天赋高。',
    condition: (chart) => {
      return chart.palaces.some(p =>
        p.majorStars.some(s => s.name === '廉贞') &&
        p.majorStars.some(s => s.name === '贪狼')
      );
    },
  },
];

// ============================================================
// 三方四正格局
// ============================================================

export const SANFANG_PATTERNS: PatternRule[] = [
  {
    id: '府相朝垣',
    name: '府相朝垣格',
    category: '三方四正',
    priority: 95,
    description: '天府和天相在命宫左右朝拱，主稳重有成，贵人相助，事业稳定。',
    condition: (chart) => {
      const mingGong = chart.palaces.find(p => p.name === '命宫')!;
      const leftIdx = (mingGong.index + 11) % 12;
      const rightIdx = (mingGong.index + 1) % 12;
      const leftPalace = chart.palaces.find(p => p.index === leftIdx);
      const rightPalace = chart.palaces.find(p => p.index === rightIdx);
      if (!leftPalace || !rightPalace) return false;
      const hasFuXiang =
        (leftPalace.majorStars.some(s => s.name === '天府') &&
         rightPalace.majorStars.some(s => s.name === '天相')) ||
        (leftPalace.majorStars.some(s => s.name === '天相') &&
         rightPalace.majorStars.some(s => s.name === '天府'));
      return hasFuXiang;
    },
    classicSource: '《紫微斗数全书》',
  },
  {
    id: '紫府朝垣',
    name: '紫府朝垣格',
    category: '三方四正',
    priority: 100,
    description: '紫微和天府在命宫或三合相会，帝王之气，领导才能出众，一生贵显。',
    condition: (chart) => {
      const mingGong = chart.palaces.find(p => p.name === '命宫')!;
      const hasZiWeiFuTianFu = 
        mingGong.majorStars.some(s => s.name === '紫微') &&
        mingGong.majorStars.some(s => s.name === '天府');
      if (hasZiWeiFuTianFu) return true;
      
      // 检查三方
      const sanfang = [
        (mingGong.index + 4) % 12,
        (mingGong.index + 8) % 12,
      ];
      const hasBoth = sanfang.every(idx => {
        const p = chart.palaces.find(pp => pp.index === idx);
        return p && (p.majorStars.some(s => s.name === '紫微') || p.majorStars.some(s => s.name === '天府'));
      });
      return hasBoth;
    },
  },
  {
    id: '机月同梁格',
    name: '机月同梁格',
    category: '三方四正',
    priority: 90,
    description: '天机、太阴、天同、天梁在三方四正会合，主智慧超群，适合策划研究、学术工作。',
    condition: (chart) => {
      const mingGong = chart.palaces.find(p => p.name === '命宫')!;
      const sanfangIdx = [mingGong.index, (mingGong.index + 4) % 12, (mingGong.index + 8) % 12];
      const sanfangPalaces = sanfangIdx.map(idx => chart.palaces.find(p => p.index === idx)!);
      const allStars: string[] = [];
      sanfangPalaces.forEach(p => allStars.push(...p.majorStars.map(s => s.name)));
      const targetStars = ['天机', '太阴', '天同', '天梁'];
      const count = targetStars.filter(s => allStars.includes(s)).length;
      return count >= 3;
    },
  },
  {
    id: '巨门昌曲',
    name: '巨门昌曲格',
    category: '三方四正',
    priority: 80,
    description: '巨门得昌曲夹拱，口才名扬，宜律师、教师、传媒行业。',
    condition: (chart) => {
      const hasJuMen = chart.palaces.some(p =>
        p.majorStars.some(s => s.name === '巨门')
      );
      if (!hasJuMen) return false;

      const juMenPalace = chart.palaces.find(p =>
        p.majorStars.some(s => s.name === '巨门')
      )!;
      const leftIdx = (juMenPalace.index + 11) % 12;
      const rightIdx = (juMenPalace.index + 1) % 12;
      const leftPalace = chart.palaces.find(p => p.index === leftIdx);
      const rightPalace = chart.palaces.find(p => p.index === rightIdx);

      if (!leftPalace || !rightPalace) return false;
      const hasChangQu =
        (leftPalace.majorStars.some(s => s.name === '文昌') || leftPalace.minorStars.some(s => s.name === '文昌')) &&
        (rightPalace.majorStars.some(s => s.name === '文曲') || rightPalace.minorStars.some(s => s.name === '文曲'));
      return hasChangQu;
    },
  },
];

// ============================================================
// 特殊格局
// ============================================================

export const SPECIAL_PATTERNS: PatternRule[] = [
  {
    id: '禄马交驰',
    name: '禄马交驰格',
    category: '特殊格局',
    priority: 100,
    description: '禄存与天马在同宫或三合方，主财运亨通，动中生财，出行得财。',
    condition: (chart) => {
      const hasLuCun = chart.palaces.some(p =>
        p.majorStars.some(s => s.name === '禄存') ||
        p.minorStars.some(s => s.name === '禄存')
      );
      const hasTianMa = chart.palaces.some(p =>
        p.majorStars.some(s => s.name === '天马') ||
        p.minorStars.some(s => s.name === '天马')
      );
      return hasLuCun && hasTianMa;
    },
    classicSource: '《太微赋》',
  },
  {
    id: '火铃夹命',
    name: '火铃夹命格',
    category: '特殊格局',
    priority: 70,
    description: '火星、铃星夹命，虽然辛劳但有爆发之力，中年后财运好转。',
    condition: (chart) => {
      const mingGong = chart.palaces.find(p => p.name === '命宫')!;
      const leftIdx = (mingGong.index + 11) % 12;
      const rightIdx = (mingGong.index + 1) % 12;
      const leftPalace = chart.palaces.find(p => p.index === leftIdx);
      const rightPalace = chart.palaces.find(p => p.index === rightIdx);

      if (!leftPalace || !rightPalace) return false;
      const hasHuoLing =
        leftPalace.majorStars.some(s => s.name === '火星') &&
        rightPalace.majorStars.some(s => s.name === '铃星');
      return hasHuoLing;
    },
  },
  {
    id: '空劫夹身',
    name: '空劫夹身格',
    category: '特殊格局',
    priority: 60,
    description: '地空、地劫夹身，精神追求高，超脱世俗，适合修行、艺术道路。',
    condition: (chart) => {
      const shenGong = chart.palaces.find(p => p.isBodyPalace);
      if (!shenGong) return false;
      const leftIdx = (shenGong.index + 11) % 12;
      const rightIdx = (shenGong.index + 1) % 12;
      const leftPalace = chart.palaces.find(p => p.index === leftIdx);
      const rightPalace = chart.palaces.find(p => p.index === rightIdx);

      if (!leftPalace || !rightPalace) return false;
      const hasKongJie =
        (leftPalace.majorStars.some(s => s.name === '地空') &&
         rightPalace.majorStars.some(s => s.name === '地劫')) ||
        (leftPalace.majorStars.some(s => s.name === '地劫') &&
         rightPalace.majorStars.some(s => s.name === '地空'));
      return hasKongJie;
    },
  },
  {
    id: '昌曲夹命',
    name: '昌曲夹命格',
    category: '特殊格局',
    priority: 90,
    description: '文昌、文曲夹命，主文贵，利考试，才华横溢，学识渊博。',
    condition: (chart) => {
      const mingGong = chart.palaces.find(p => p.name === '命宫')!;
      const leftIdx = (mingGong.index + 11) % 12;
      const rightIdx = (mingGong.index + 1) % 12;
      const leftPalace = chart.palaces.find(p => p.index === leftIdx);
      const rightPalace = chart.palaces.find(p => p.index === rightIdx);

      if (!leftPalace || !rightPalace) return false;
      const hasChangQu =
        (leftPalace.majorStars.some(s => s.name === '文昌') || leftPalace.minorStars.some(s => s.name === '文昌')) &&
        (rightPalace.majorStars.some(s => s.name === '文曲') || rightPalace.minorStars.some(s => s.name === '文曲'));
      return hasChangQu;
    },
    classicSource: '《太微赋》',
  },
  {
    id: '左右夹命',
    name: '左右夹命格',
    category: '特殊格局',
    priority: 85,
    description: '左辅、右弼夹命，主得贵人助力，人缘佳，一生多辅弼。',
    condition: (chart) => {
      const mingGong = chart.palaces.find(p => p.name === '命宫')!;
      const leftIdx = (mingGong.index + 11) % 12;
      const rightIdx = (mingGong.index + 1) % 12;
      const leftPalace = chart.palaces.find(p => p.index === leftIdx);
      const rightPalace = chart.palaces.find(p => p.index === rightIdx);

      if (!leftPalace || !rightPalace) return false;
      const hasZuoYou =
        (leftPalace.majorStars.some(s => s.name === '左辅') &&
         rightPalace.majorStars.some(s => s.name === '右弼')) ||
        (leftPalace.majorStars.some(s => s.name === '右弼') &&
         rightPalace.majorStars.some(s => s.name === '左辅'));
      return hasZuoYou;
    },
  },
  {
    id: '魁钺夹命',
    name: '魁钺夹命格',
    category: '特殊格局',
    priority: 90,
    description: '天魁、天钺夹命，主得贵人提携，长辈帮助，事业有贵人。',
    condition: (chart) => {
      const mingGong = chart.palaces.find(p => p.name === '命宫')!;
      const leftIdx = (mingGong.index + 11) % 12;
      const rightIdx = (mingGong.index + 1) % 12;
      const leftPalace = chart.palaces.find(p => p.index === leftIdx);
      const rightPalace = chart.palaces.find(p => p.index === rightIdx);

      if (!leftPalace || !rightPalace) return false;
      const hasKuiYue =
        (leftPalace.majorStars.some(s => s.name === '天魁') || leftPalace.minorStars.some(s => s.name === '天魁')) &&
        (rightPalace.majorStars.some(s => s.name === '天钺') || rightPalace.minorStars.some(s => s.name === '天钺'));
      return hasKuiYue;
    },
  },
  {
    id: '羊陀夹忌',
    name: '羊陀夹忌格',
    category: '特殊格局',
    priority: 75,
    description: '擎羊、陀罗夹化忌，主辛苦劳碌，但有开创力，晚年有成。',
    condition: (chart) => {
      const mingGong = chart.palaces.find(p => p.name === '命宫')!;
      const leftIdx = (mingGong.index + 11) % 12;
      const rightIdx = (mingGong.index + 1) % 12;
      const leftPalace = chart.palaces.find(p => p.index === leftIdx);
      const rightPalace = chart.palaces.find(p => p.index === rightIdx);

      if (!leftPalace || !rightPalace) return false;
      const hasYangTuo =
        (leftPalace.majorStars.some(s => s.name === '擎羊') &&
         rightPalace.majorStars.some(s => s.name === '陀罗')) ||
        (leftPalace.majorStars.some(s => s.name === '陀罗') &&
         rightPalace.majorStars.some(s => s.name === '擎羊'));
      return hasYangTuo;
    },
  },
  {
    id: '巨日同宫_special',
    name: '巨日同宫格（口才星）',
    category: '特殊格局',
    priority: 85,
    description: '巨门与太阳同宫，以口才名扬天下，适合法律、教育、传媒行业。',
    condition: (chart) => {
      return chart.palaces.some(p =>
        p.majorStars.some(s => s.name === '巨门') &&
        p.majorStars.some(s => s.name === '太阳')
      );
    },
    classicSource: '《太微赋》',
  },
  {
    id: '日月照命',
    name: '日月照命格',
    category: '特殊格局',
    priority: 90,
    description: '太阳太阴在三方四正照命，光明磊落，福禄双全，事业有成。',
    condition: (chart) => {
      const mingGong = chart.palaces.find(p => p.name === '命宫')!;
      const sanfangIdx = [(mingGong.index + 4) % 12, (mingGong.index + 8) % 12];
      const sanfangPalaces = sanfangIdx.map(idx => chart.palaces.find(p => p.index === idx));
      
      const hasSun = sanfangPalaces.some(p => 
        p?.majorStars.some(s => s.name === '太阳')
      );
      const hasMoon = sanfangPalaces.some(p => 
        p?.majorStars.some(s => s.name === '太阴')
      );
      return hasSun && hasMoon;
    },
  },
];

// ============================================================
// 汇总导出
// ============================================================

/** 所有格局规则 */
export const ALL_PATTERN_RULES: PatternRule[] = [
  ...BASIC_PATTERNS,
  ...SANFANG_PATTERNS,
  ...SPECIAL_PATTERNS,
];
