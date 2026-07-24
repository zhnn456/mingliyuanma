/**
 * 梅花易数卦象解析
 */
import { HEXAGRAM_DATA } from './hexagramData';
import { HEXAGRAM_YAO_1, type YaoData } from './yaoData1';
import { HEXAGRAM_YAO_2 } from './yaoData2';

// 合并所有爻辞数据
export const ALL_YAO_DATA: Record<string, YaoData[]> = { ...HEXAGRAM_YAO_1, ...HEXAGRAM_YAO_2 };

// 六十四卦详细解析 - 使用完整数据
export const HEXAGRAM_DETAIL = HEXAGRAM_DATA;

// 体用关系详解
export const TIYONG_INTERPRETATION: Record<string, {
  level: string;
  description: string;
  advice: string;
}> = {
  '用生体（吉）': {
    level: '大吉',
    description: '用卦生体卦，外部环境对你有利。有贵人相助，事情进展顺利，容易达到目的。',
    advice: '把握机遇，积极行动。外部环境有利，可以放心推进。',
  },
  '体克用（小吉）': {
    level: '小吉',
    description: '体卦克用卦，你能掌控局面。虽然需要付出努力，但最终能够成功。',
    advice: '主动出击，发挥自身优势。虽需努力但结果可期。',
  },
  '比和（平）': {
    level: '平',
    description: '体用比和，势均力敌。事情发展平稳，不会有太大波折，也不会有太大惊喜。',
    advice: '保持现状，稳中求进。不宜冒险，以守为主。',
  },
  '体生用（泄）': {
    level: '小凶',
    description: '体卦生用卦，你在消耗自身能量。付出多回报少，容易劳累。',
    advice: '注意休息，不要过度付出。适当收回精力，保护自身利益。',
  },
  '用克体（凶）': {
    level: '凶',
    description: '用卦克体卦，外部环境对你不利。面临阻碍和压力，事情难以推进。',
    advice: '暂时退守，等待时机。不宜强行推进，以免损失更大。',
  },
};

/**
 * 生成梅花易数完整解析
 */
export function generateMeihuaInterpretation(result: {
  benGua: { name: string; meaning: string };
  huGua: { name: string; meaning: string };
  bianGua: { name: string; meaning: string };
  tiYong: { ti: string; yong: string; relation: string };
  upperGua: { name: string; element: string; nature: string };
  lowerGua: { name: string; element: string; nature: string };
  dongYao: number;
}) {
  const benDetail = HEXAGRAM_DETAIL[result.benGua.name];
  const bianDetail = HEXAGRAM_DETAIL[result.bianGua.name];
  const tiyongDetail = TIYONG_INTERPRETATION[result.tiYong.relation];
  const benYao = ALL_YAO_DATA[result.benGua.name];
  const dongYaoData = benYao ? benYao[result.dongYao - 1] : null;

  // 生成综合解析
  let summary = '';
  if (benDetail) {
    summary += `【本卦：${result.benGua.name}】\n`;
    summary += `卦辞：${benDetail.guaCi}\n`;
    summary += `象曰：${benDetail.xiangYue}\n`;
    summary += `${benDetail.summary}\n\n`;
  }
  if (dongYaoData) {
    summary += `【动爻：第${result.dongYao}爻】\n`;
    summary += `${dongYaoData.yaoCi}\n`;
    summary += `象曰：${dongYaoData.xiangYue}\n`;
    summary += `${dongYaoData.meaning}\n\n`;
  }
  if (tiyongDetail) {
    summary += `【体用关系】${tiyongDetail.level}\n${tiyongDetail.description}\n\n`;
  }
  if (bianDetail) {
    summary += `【变卦：${result.bianGua.name}】\n`;
    summary += `卦辞：${bianDetail.guaCi}\n`;
    summary += `${bianDetail.summary}\n\n`;
  }
  summary += `【综合判断】\n`;
  if (tiyongDetail) {
    summary += tiyongDetail.advice;
  }

  return {
    benDetail,
    bianDetail,
    tiyongDetail,
    dongYaoData,
    summary,
  };
}
