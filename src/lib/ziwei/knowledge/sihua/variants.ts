/**
 * 紫微斗数 · 四化变体表
 * 
 * 不同流派对戊、庚、壬三干的四化有不同说法
 * 主要差异：
 * - 戊干：飞星派右弼化科；主星派太阳化科
 * - 庚干：飞星派太阴化科；主星派廉贞化科  
 * - 壬干：飞星派左辅化科；主星派天府化科
 */

import type { HeavenlyStem } from '../../interfaces/chart';

/** 四化变体 */
export const SIHUA_VARIANTS: Record<string, { lu: string; quan: string; ke: string; ji: string }> = {
  // 戊干变体
  '戊_飞星派': { lu: '贪狼', quan: '太阴', ke: '右弼', ji: '天机' },
  '戊_主星派': { lu: '贪狼', quan: '太阴', ke: '太阳', ji: '天机' },
  '戊_中州派': { lu: '贪狼', quan: '太阴', ke: '右弼', ji: '天机' },
  
  // 庚干变体
  '庚_飞星派': { lu: '太阳', quan: '武曲', ke: '太阴', ji: '天同' },
  '庚_主星派': { lu: '太阳', quan: '武曲', ke: '廉贞', ji: '天同' },
  '庚_中州派': { lu: '太阳', quan: '武曲', ke: '太阴', ji: '天同' },
  
  // 壬干变体
  '壬_飞星派': { lu: '天梁', quan: '紫微', ke: '左辅', ji: '武曲' },
  '壬_主星派': { lu: '天梁', quan: '紫微', ke: '天府', ji: '武曲' },
  '壬_中州派': { lu: '天梁', quan: '紫微', ke: '左辅', ji: '武曲' },
};

/** 飞星派专用四化（用于流年/大限动态四化计算） */
export const FEIXING_SIHUA_TABLE: Record<HeavenlyStem, { lu: string; quan: string; ke: string; ji: string }> = {
  '甲': { lu: '廉贞', quan: '破军', ke: '武曲', ji: '太阳' },
  '乙': { lu: '天机', quan: '天梁', ke: '紫微', ji: '太阴' },
  '丙': { lu: '天同', quan: '天机', ke: '文昌', ji: '廉贞' },
  '丁': { lu: '太阴', quan: '天同', ke: '天机', ji: '巨门' },
  '戊': { lu: '贪狼', quan: '太阴', ke: '右弼', ji: '天机' },
  '己': { lu: '武曲', quan: '贪狼', ke: '天梁', ji: '文曲' },
  '庚': { lu: '太阳', quan: '武曲', ke: '太阴', ji: '天同' },
  '辛': { lu: '巨门', quan: '太阳', ke: '文曲', ji: '文昌' },
  '壬': { lu: '天梁', quan: '紫微', ke: '左辅', ji: '武曲' },
  '癸': { lu: '破军', quan: '巨门', ke: '太阴', ji: '贪狼' },
};

/** 导出标准四化表（别名） */
export { SIHUA_STANDARD as SIHUA_STANDARD } from './tables';

/** 主星派（三合派）四化表 */
export const SANHE_SIHUA_TABLE: Record<HeavenlyStem, { lu: string; quan: string; ke: string; ji: string }> = {
  '甲': { lu: '廉贞', quan: '破军', ke: '武曲', ji: '太阳' },
  '乙': { lu: '天机', quan: '天梁', ke: '紫微', ji: '太阴' },
  '丙': { lu: '天同', quan: '天机', ke: '文昌', ji: '廉贞' },
  '丁': { lu: '太阴', quan: '天同', ke: '天机', ji: '巨门' },
  '戊': { lu: '贪狼', quan: '太阴', ke: '太阳', ji: '天机' },
  '己': { lu: '武曲', quan: '贪狼', ke: '天梁', ji: '文曲' },
  '庚': { lu: '太阳', quan: '武曲', ke: '廉贞', ji: '天同' },
  '辛': { lu: '巨门', quan: '太阳', ke: '文曲', ji: '文昌' },
  '壬': { lu: '天梁', quan: '紫微', ke: '天府', ji: '武曲' },
  '癸': { lu: '破军', quan: '巨门', ke: '太阴', ji: '贪狼' },
};

/**
 * 获取指定流派的四化表
 */
export function getSihuaTableBySchool(school: 'feixing' | 'sanhe' | 'zhongzhou'): Record<HeavenlyStem, { lu: string; quan: string; ke: string; ji: string }> {
  switch (school) {
    case 'feixing':
      return FEIXING_SIHUA_TABLE;
    case 'sanhe':
      return SANHE_SIHUA_TABLE;
    case 'zhongzhou':
      // 中州派默认使用飞星派表
      return FEIXING_SIHUA_TABLE;
    default:
      return FEIXING_SIHUA_TABLE;
  }
}
