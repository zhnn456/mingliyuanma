/**
 * 紫微斗数 · 十干四化标准表
 * 
 * 注：各干四化在不同流派（飞星派/主星派）中有以下争议：
 * - 戊干：飞星派右弼化科，主星派太阳化科
 * - 庚干：飞星派太阴化科，主星派廉贞化科  
 * - 壬干：飞星派左辅化科，主星派天府化科
 */

import type { HeavenlyStem } from '../../interfaces/chart';

/** 四化单条记录 */
export interface SihuaEntry {
  stem: HeavenlyStem;
  lu: string;   // 化禄星
  quan: string; // 化权星
  ke: string;   // 化科星
  ji: string;   // 化忌星
  /** 口诀 */
  mantra: string;
}

/**
 * 十干四化 · 标准表（飞星派）
 * 
 * 口诀：
 * 甲廉破武阳、乙机梁紫阴、丙同机昌廉
 * 丁阴同机巨、戊贪阴右机、己武贪梁曲
 * 庚阳武阴同、辛巨阳曲昌、壬梁紫左武
 * 癸破巨阴贪
 */
export const SIHUA_STANDARD: Record<HeavenlyStem, Omit<SihuaEntry, 'stem'>> = {
  '甲': { lu: '廉贞', quan: '破军', ke: '武曲', ji: '太阳', mantra: '甲廉破武阳' },
  '乙': { lu: '天机', quan: '天梁', ke: '紫微', ji: '太阴', mantra: '乙机梁紫阴' },
  '丙': { lu: '天同', quan: '天机', ke: '文昌', ji: '廉贞', mantra: '丙同机昌廉' },
  '丁': { lu: '太阴', quan: '天同', ke: '天机', ji: '巨门', mantra: '丁阴同机巨' },
  '戊': { lu: '贪狼', quan: '太阴', ke: '右弼', ji: '天机', mantra: '戊贪阴右机' },
  '己': { lu: '武曲', quan: '贪狼', ke: '天梁', ji: '文曲', mantra: '己武贪梁曲' },
  '庚': { lu: '太阳', quan: '武曲', ke: '太阴', ji: '天同', mantra: '庚阳武阴同' },
  '辛': { lu: '巨门', quan: '太阳', ke: '文曲', ji: '文昌', mantra: '辛巨阳曲昌' },
  '壬': { lu: '天梁', quan: '紫微', ke: '左辅', ji: '武曲', mantra: '壬梁紫左武' },
  '癸': { lu: '破军', quan: '巨门', ke: '太阴', ji: '贪狼', mantra: '癸破巨阴贪' },
};

/**
 * 获取指定天干的四化
 */
export function getSihuaForStem(stem: HeavenlyStem): SihuaEntry {
  const base = SIHUA_STANDARD[stem];
  return { stem, ...base };
}

/**
 * 获取所有天干的四化表
 */
export function getAllSihua(): SihuaEntry[] {
  const stems: HeavenlyStem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  return stems.map(stem => ({
    stem,
    ...SIHUA_STANDARD[stem],
  }));
}

/**
 * 根据四化星反查天干（用于动态四化计算）
 */
export function getStemBySihuaStar(starName: string, mutagen: 'lu' | 'quan' | 'ke' | 'ji'): HeavenlyStem[] {
  const stems: HeavenlyStem[] = [];
  const allStems: HeavenlyStem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  
  for (const stem of allStems) {
    if (SIHUA_STANDARD[stem][mutagen] === starName) {
      stems.push(stem);
    }
  }
  
  return stems;
}

/**
 * 四化含义表
 */
export const SIHUA_MEANING: Record<'化禄' | '化权' | '化科' | '化忌', {
  nature: string;
  primaryMeaning: string;
  secondaryMeaning: string;
  interpretation: string;
}> = {
  '化禄': {
    nature: '财禄之星',
    primaryMeaning: '机会、财富、享受、人缘',
    secondaryMeaning: '自信、魅力、顺利、贵人',
    interpretation: '化禄代表机会与财富的聚集。命主在该宫所主领域内，天生具有吸引资源与好运的能力。禄星飞入之处，该宫能量增强，凡事顺遂。若为自化禄，则是"禄出"，代表能量向外散发，虽有表现但也有消耗。',
  },
  '化权': {
    nature: '权威之星',
    primaryMeaning: '掌控、权力、地位、成就',
    secondaryMeaning: '果断、领导、魄力、占有',
    interpretation: '化权代表掌控力与权威。命主在该宫所主领域内，具有卓越的领导才能和决断力。权星飞入之处，该宫能量增强，命主在该领域有掌控欲和成就欲。化权也主固执、强势，需注意刚愎自用的倾向。',
  },
  '化科': {
    nature: '名声之星',
    primaryMeaning: '名声、才华、贵人、考试',
    secondaryMeaning: '礼貌、学术、精神、美好',
    interpretation: '化科代表名声与才华的展现。命主在该宫所主领域内，具有出色的才华与贵人运。科星飞入之处，该宫能量以名声和人际吸引为主要表现。化科利考试、利社交、利展示才华。',
  },
  '化忌': {
    nature: '阻碍之星',
    primaryMeaning: '阻碍、压力、转折、自我',
    secondaryMeaning: '执着、反省、纠结、痛苦',
    interpretation: '化忌代表阻碍与考验。命主在该宫所主领域内，会面临较大的压力与挑战。忌星飞入之处，该宫能量受阻，命主需付出更多努力才能获得成果。但化忌也代表执着与专注，在某些情况下反而能成就深度。',
  },
};
