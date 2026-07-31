/**
 * 梅花易数深度解读引擎
 *
 * 依据邵雍《梅花易数》传统断卦体系，补全以下内容：
 * 1. 问题类型选择与分领域断语（求财/事业/婚姻/考试/疾病/出行等）
 * 2. 五行旺衰判断（结合月令判断体卦旺衰，旺则有力衰则无力）
 * 3. 体用深度分析（体用关系+互卦对体用的影响+变卦结局分析）
 * 4. 卦象演变分析（本卦→互卦→变卦的时序逻辑：起因→过程→结局）
 * 5. 应期推断（根据体用五行、卦气、数理推断应验时间）
 * 6. 断卦步骤系统化（按照传统梅花易数断卦六步法）
 */

import { HEXAGRAM_DATA } from './hexagramData';
import { ALL_YAO_DATA } from './meihua';

// ============================================================
// 一、问题类型定义
// ============================================================

export interface MeihuaQuestionType {
  key: string;
  label: string;
  icon: string;
  description: string;
  focusYong: string; // 关注的用卦
}

export const MEIHUA_QUESTION_TYPES: MeihuaQuestionType[] = [
  { key: 'general', label: '综合运势', icon: '☯', description: '综合判断吉凶趋势，了解整体运势', focusYong: '整体体用' },
  { key: 'wealth', label: '求财', icon: '💰', description: '看体用关系断财运，体克用有财，用生体有财', focusYong: '用卦为财' },
  { key: 'career', label: '事业', icon: '💼', description: '看体用旺衰断事业，体旺用弱可成', focusYong: '用卦为事业' },
  { key: 'marriage', label: '婚姻', icon: '❤️', description: '体为求测人，用为对方。用生体则对方有意', focusYong: '用卦为对方' },
  { key: 'exam', label: '考试', icon: '📚', description: '体旺用衰则考运佳，用生体有贵人助', focusYong: '用卦为考运' },
  { key: 'health', label: '疾病', icon: '🏥', description: '体为病人，用为病症。用克体则病重', focusYong: '用卦为病症' },
  { key: 'travel', label: '出行', icon: '🧳', description: '体为出行人，用为目的地。用生体则出行顺利', focusYong: '用卦为目的地' },
  { key: 'lawsuit', label: '官司', icon: '⚖', description: '体为自己，用为对方。体克用则胜诉', focusYong: '用卦为对方' },
  { key: 'lost', label: '失物', icon: '🔍', description: '体为失主，用为失物。用生体则物可寻回', focusYong: '用卦为失物' },
  { key: 'weather', label: '天气', icon: '☀', description: '看卦象五行断晴雨，离火为晴坎水为雨', focusYong: '卦象五行' },
];

// ============================================================
// 二、五行旺衰判断（月令旺相休囚死）
// ============================================================

// 月令五行：正月寅木、二月卯木、三月辰土、四月巳火、五月午火、六月未土...
const MONTH_WUXING: Record<number, string> = {
  1: '木', 2: '木', 3: '土',
  4: '火', 5: '火', 6: '土',
  7: '金', 8: '金', 9: '土',
  10: '水', 11: '水', 12: '土',
};

// 五行旺相休囚死关系
// 当令者旺，令生者相，生令者休，克令者囚，令克者死
function getWangShuai(tiElement: string, monthWuxing: string): string {
  if (tiElement === monthWuxing) return '旺';
  const sheng: Record<string, string> = { '金': '水', '水': '木', '木': '火', '火': '土', '土': '金' };
  const ke: Record<string, string> = { '金': '木', '木': '土', '土': '水', '水': '火', '火': '金' };
  if (sheng[monthWuxing] === tiElement) return '相'; // 月令生体
  if (sheng[tiElement] === monthWuxing) return '休'; // 体生月令
  if (ke[monthWuxing] === tiElement) return '囚'; // 月令克体
  if (ke[tiElement] === monthWuxing) return '死'; // 体克月令
  return '平';
}

const WANGSHUAI_MEANING: Record<string, string> = {
  '旺': '体卦当令而旺，力量最强，如日中天，谋为可成。',
  '相': '体卦得月令之生，力量较强，如春木得雨，蒸蒸日上。',
  '休': '体卦生月令，力量减弱，休养生息，需积蓄力量。',
  '囚': '体卦被月令所克，力量受困，如虎落平阳，难以施展。',
  '死': '体卦克月令，力量耗损，强弩之末，不宜妄动。',
  '平': '体卦力量平平，需看用卦关系定吉凶。',
};

// ============================================================
// 三、体用深度分析
// ============================================================

interface TiYongAnalysis {
  relation: string;
  level: string;
  tiElement: string;
  yongElement: string;
  tiWangshuai: string;
  yongWangshuai: string;
  description: string;
  huGuaInfluence: string; // 互卦对体用的影响
  bianGuaInfluence: string; // 变卦结局
  advice: string;
}

function analyzeTiYongDeep(
  result: any,
  month?: number
): TiYongAnalysis {
  // 解析体用五行
  const tiStr = result.tiYong.ti || '';
  const yongStr = result.tiYong.yong || '';
  const tiElement = tiStr.match(/[金木水火土]/)?.[0] || '';
  const yongElement = yongStr.match(/[金木水火土]/)?.[0] || '';
  const relation = result.tiYong.relation || '';

  // 月令旺衰
  const monthWx = month ? MONTH_WUXING[month] || '' : '';
  const tiWangshuai = monthWx ? getWangShuai(tiElement, monthWx) : '平';
  const yongWangshuai = monthWx ? getWangShuai(yongElement, monthWx) : '平';

  // 判断等级
  let level = '平';
  if (relation.includes('吉')) level = relation.includes('大') ? '大吉' : '小吉';
  else if (relation.includes('凶')) level = relation.includes('大') ? '大凶' : '凶';
  else if (relation.includes('泄')) level = '小凶';

  // 体用旺衰修正
  let description = `体卦${tiStr}（${tiElement}）${tiWangshuai}，用卦${yongStr}（${yongElement}）${yongWangshuai}。\n`;

  // 旺衰影响
  if (tiWangshuai === '旺' || tiWangshuai === '相') {
    description += `体卦${tiWangshuai}相，自身力量充足。`;
    if (relation.includes('凶') || relation.includes('泄')) {
      description += `虽体用关系不利，但体旺可抗，凶中有救。`;
      level = level === '大凶' ? '凶' : level === '凶' ? '小凶' : level;
    }
  } else if (tiWangshuai === '囚' || tiWangshuai === '死') {
    description += `体卦${tiWangshuai}，自身力量不足。`;
    if (relation.includes('吉')) {
      description += `虽体用关系有利，但体衰难承，吉中有亏。`;
      level = level === '大吉' ? '小吉' : level;
    }
  }

  // 互卦影响（互卦代表事物发展过程）
  const huGuaName = result.huGua?.name || '';
  let huGuaInfluence = '';
  const huDetail = HEXAGRAM_DATA[huGuaName];
  if (huDetail) {
    huGuaInfluence = `互卦${huGuaName}代表事物发展过程。${huDetail.summary}`;
  } else {
    huGuaInfluence = `互卦${huGuaName}反映事物中间过程，需结合卦象综合判断。`;
  }

  // 变卦结局（变卦代表最终结局）
  const bianGuaName = result.bianGua?.name || '';
  let bianGuaInfluence = '';
  const bianDetail = HEXAGRAM_DATA[bianGuaName];
  if (bianDetail) {
    bianGuaInfluence = `变卦${bianGuaName}代表事物最终结局。${bianDetail.summary}`;
  } else {
    bianGuaInfluence = `变卦${bianGuaName}反映最终趋势，需结合卦象判断。`;
  }

  // 变卦后的体用关系
  // 动爻变后，体用关系可能改变
  if (result.dongYao) {
    const dongInUpper = result.dongYao > 3;
    const bianTiElement = dongInUpper ? tiElement : yongElement; // 体卦不动
    const bianYongElement = dongInUpper ? yongElement : tiElement; // 用卦变了
    // 这里简化处理，实际需要重新计算变卦的五行
    bianGuaInfluence += `\n动爻在第${result.dongYao}爻（${dongInUpper ? '上卦' : '下卦'}），用卦发生变化，最终结局取决于变卦五行与体卦的关系。`;
  }

  // 建议
  let advice = '';
  if (level === '大吉') {
    advice = '大吉之象，宜把握时机，积极行动，必有所成。';
  } else if (level === '小吉') {
    advice = '小吉之象，可以推进，但需谨慎，终有好结果。';
  } else if (level === '平') {
    advice = '平平之象，宜守不宜进，静待时机变化。';
  } else if (level === '小凶') {
    advice = '小凶之象，不宜冒进，退守为上，等待转机。';
  } else {
    advice = '凶象明显，切忌行动，宜静守避险，待凶气消散再议。';
  }

  return {
    relation,
    level,
    tiElement,
    yongElement,
    tiWangshuai,
    yongWangshuai,
    description,
    huGuaInfluence,
    bianGuaInfluence,
    advice,
  };
}

// ============================================================
// 四、卦象演变分析（本卦→互卦→变卦）
// ============================================================

interface GuaEvolution {
  benGua: { name: string; phase: string; summary: string; career?: string; wealth?: string; love?: string; health?: string };
  huGua: { name: string; phase: string; summary: string };
  bianGua: { name: string; phase: string; summary: string; career?: string; wealth?: string; love?: string; health?: string };
  evolution: string;
}

function analyzeGuaEvolution(result: any): GuaEvolution {
  const benName = result.benGua?.name || '';
  const huName = result.huGua?.name || '';
  const bianName = result.bianGua?.name || '';

  const benDetail = HEXAGRAM_DATA[benName];
  const huDetail = HEXAGRAM_DATA[huName];
  const bianDetail = HEXAGRAM_DATA[bianName];

  const benGua = {
    name: benName,
    phase: '起始（起因）',
    summary: benDetail?.summary || result.benGua?.meaning || '',
    career: benDetail?.career,
    wealth: benDetail?.wealth,
    love: benDetail?.love,
    health: benDetail?.health,
  };

  const huGua = {
    name: huName,
    phase: '中间（过程）',
    summary: huDetail?.summary || result.huGua?.meaning || '',
  };

  const bianGua = {
    name: bianName,
    phase: '结局（结果）',
    summary: bianDetail?.summary || result.bianGua?.meaning || '',
    career: bianDetail?.career,
    wealth: bianDetail?.wealth,
    love: bianDetail?.love,
    health: bianDetail?.health,
  };

  let evolution = '';
  evolution += `本卦${benName}为事物起始之象，${benGua.summary}\n\n`;
  evolution += `互卦${huName}为事物发展过程，${huGua.summary}\n\n`;
  evolution += `变卦${bianName}为事物最终结局，${bianGua.summary}\n\n`;

  // 演变趋势判断
  if (benName === bianName) {
    evolution += `本卦与变卦相同，事物始末如一，中途虽有波澜但终归原点。`;
  } else {
    evolution += `本卦变至${bianName}，事物从${benGua.phase}发展到${bianGua.phase}，发生了根本性转变。`;
  }

  return { benGua, huGua, bianGua, evolution };
}

// ============================================================
// 五、应期推断
// ============================================================

function inferTiming(
  result: any,
  tiYongAnalysis: TiYongAnalysis
): string {
  let timing = '';

  // 1. 以体卦五行断应期
  const tiElement = tiYongAnalysis.tiElement;
  const wxTiming: Record<string, string> = {
    '金': '秋季（申酉月）或庚辛日',
    '木': '春季（寅卯月）或甲乙日',
    '水': '冬季（亥子月）或壬癸日',
    '火': '夏季（巳午月）或丙丁日',
    '土': '四季月（辰戌丑未月）或戊己日',
  };

  if (wxTiming[tiElement]) {
    timing += `以体卦${tiElement}行论，应期在${wxTiming[tiElement]}。`;
  }

  // 2. 以卦数断应期
  const upperGua = result.upperGua;
  const lowerGua = result.lowerGua;
  if (upperGua && lowerGua) {
    const baguaNum: Record<string, number> = {
      '乾': 1, '兑': 2, '离': 3, '震': 4,
      '巽': 5, '坎': 6, '艮': 7, '坤': 8,
    };
    const upNum = baguaNum[upperGua.name] || 0;
    const lowNum = baguaNum[lowerGua.name] || 0;
    const totalNum = upNum + lowNum;
    if (totalNum > 0) {
      timing += ` 以卦数论，上卦${upNum}加下卦${lowNum}等于${totalNum}，应期约${totalNum}天/月/年。`;
    }
  }

  // 3. 以动爻数断应期
  if (result.dongYao) {
    timing += ` 以动爻论，第${result.dongYao}爻动，应期约${result.dongYao}天/周/月。`;
  }

  // 4. 以体用关系断应期快慢
  const relation = tiYongAnalysis.relation;
  if (relation.includes('生体') || relation.includes('比和')) {
    timing += ` 体用相生比和，应期较快，近期可验。`;
  } else if (relation.includes('克体') || relation.includes('泄')) {
    timing += ` 体用相克相泄，应期较慢，需耐心等待。`;
  }

  return timing || '应期需结合具体事象和起卦时间综合判断。';
}

// ============================================================
// 六、分领域断语
// ============================================================

interface DomainAnalysis {
  career: string;
  wealth: string;
  marriage: string;
  health: string;
  exam: string;
}

function generateDomainAnalysis(
  result: any,
  tiYongAnalysis: TiYongAnalysis,
  evolution: GuaEvolution
): DomainAnalysis {
  const level = tiYongAnalysis.level;
  const relation = tiYongAnalysis.relation;
  const tiWang = tiYongAnalysis.tiWangshuai;
  const benCareer = evolution.benGua.career || '';
  const benWealth = evolution.benGua.wealth || '';
  const benLove = evolution.benGua.love || '';
  const benHealth = evolution.benGua.health || '';
  const bianCareer = evolution.bianGua.career || '';
  const bianWealth = evolution.bianGua.wealth || '';

  // 事业断语
  let career = '';
  if (benCareer) career += `本卦事业运：${benCareer}\n`;
  if (bianCareer) career += `变卦事业运：${bianCareer}\n`;
  if (level === '大吉' || level === '小吉') {
    career += `体用${relation}，${tiWang === '旺' || tiWang === '相' ? '体旺有力' : '体衰需借力'}，事业可成。`;
  } else if (level === '凶') {
    career += `体用${relation}，事业受阻，宜暂避锋芒，不宜变动。`;
  } else {
    career += `体用${relation}，事业平稳，宜守不宜进。`;
  }

  // 财运断语
  let wealth = '';
  if (benWealth) wealth += `本卦财运：${benWealth}\n`;
  if (bianWealth) wealth += `变卦财运：${bianWealth}\n`;
  if (relation.includes('用生体') || relation.includes('体克用')) {
    wealth += `体用关系利财，${relation.includes('生') ? '财来就我' : '我能制财'}，财运可期。`;
  } else if (relation.includes('用克体') || relation.includes('泄')) {
    wealth += `体用关系不利财，${relation.includes('克') ? '财来克我，有破财之虞' : '我生财，付出多回报少'}，宜保守理财。`;
  } else {
    wealth += `体用比和，财运平平，无大得失。`;
  }

  // 婚姻断语
  let marriage = '';
  if (benLove) marriage += `本卦感情运：${benLove}\n`;
  if (relation.includes('用生体')) {
    marriage += `用生体，对方有意于你，婚姻可成，宜主动回应。`;
  } else if (relation.includes('体生用')) {
    marriage += `体生用，你付出较多，需看对方是否珍惜。婚姻可成但较辛苦。`;
  } else if (relation.includes('用克体')) {
    marriage += `用克体，对方强势或不利你，婚姻有阻碍，需谨慎。`;
  } else if (relation.includes('体克用')) {
    marriage += `体克用，你掌握主动权，但需注意方式，不可过于强势。`;
  } else {
    marriage += `体用比和，双方势均力敌，婚姻平稳。`;
  }

  // 健康断语
  let health = '';
  if (benHealth) health += `本卦健康运：${benHealth}\n`;
  const tiElement = tiYongAnalysis.tiElement;
  const organMap: Record<string, string> = {
    '金': '肺、大肠、呼吸系统',
    '木': '肝、胆、神经系统',
    '水': '肾、膀胱、泌尿系统',
    '火': '心、小肠、血液循环',
    '土': '脾、胃、消化系统',
  };
  if (relation.includes('用克体')) {
    health += `用克体，病症较重，需注意${organMap[tiElement] || '相关器官'}的保养。`;
  } else if (relation.includes('体生用')) {
    health += `体生用，体力消耗较大，需注意休息，补充${organMap[tiElement] || '相关器官'}的能量。`;
  } else if (relation.includes('用生体') || relation.includes('比和')) {
    health += `体用相生比和，身体恢复力强，病情较轻，预后良好。`;
  } else {
    health += `体用相克，需注意${organMap[tiElement] || '相关器官'}，及时就医。`;
  }

  // 考试断语
  let exam = '';
  if (tiWang === '旺' || tiWang === '相') {
    exam += `体卦${tiWang}相，头脑清晰，状态良好。`;
    if (relation.includes('吉')) {
      exam += `体用吉利，考运亨通，必能金榜题名。`;
    } else if (relation.includes('凶')) {
      exam += `虽体旺但用卦不利，考试有波折，需加倍努力。`;
    } else {
      exam += `体旺用平，考试发挥正常，可获中等成绩。`;
    }
  } else if (tiWang === '囚' || tiWang === '死') {
    exam += `体卦${tiWang}，状态不佳，难以发挥实力。`;
    if (relation.includes('吉')) {
      exam += `虽有外在助力，但自身状态不足，需调整心态。`;
    } else {
      exam += `考运不佳，宜充分准备，不可掉以轻心。`;
    }
  } else {
    exam += `体卦力量平平，考试发挥取决于准备程度。`;
  }

  return { career, wealth, marriage, health, exam };
}

// ============================================================
// 七、断卦步骤系统化（邵雍六步法）
// ============================================================

function generateDivinationSteps(
  result: any,
  tiYongAnalysis: TiYongAnalysis,
  evolution: GuaEvolution,
  timing: string,
  domain: DomainAnalysis,
  questionType: string
): string[] {
  const steps: string[] = [];

  // 第一步：审卦象
  steps.push(
    `【第一步：审卦象】\n` +
    `本卦：${result.benGua.name}（${result.benGua.meaning}）\n` +
    `互卦：${result.huGua.name}（${result.huGua.meaning}）\n` +
    `变卦：${result.bianGua.name}（${result.bianGua.meaning}）\n` +
    `动爻：第${result.dongYao}爻\n` +
    `上卦：${result.upperGua.name}（${result.upperGua.nature}·${result.upperGua.element}）\n` +
    `下卦：${result.lowerGua.name}（${result.lowerGua.nature}·${result.lowerGua.element}）`
  );

  // 第二步：明体用
  steps.push(
    `【第二步：明体用】\n` +
    `体卦：${result.tiYong.ti}（不动之卦，代表自身）\n` +
    `用卦：${result.tiYong.yong}（动爻所在之卦，代表所测之事）\n` +
    `体用关系：${tiYongAnalysis.relation}（${tiYongAnalysis.level}）\n` +
    `体卦旺衰：${tiYongAnalysis.tiWangshuai}（${WANGSHUAI_MEANING[tiYongAnalysis.tiWangshuai] || ''}）\n` +
    `用卦旺衰：${tiYongAnalysis.yongWangshuai}`
  );

  // 第三步：看生克
  steps.push(
    `【第三步：看生克】\n` +
    `${tiYongAnalysis.description}\n` +
    `综合判断：${tiYongAnalysis.level}。${tiYongAnalysis.advice}`
  );

  // 第四步：观互卦
  steps.push(
    `【第四步：观互卦】\n` +
    `互卦${result.huGua.name}代表事物发展的中间过程。\n` +
    `${tiYongAnalysis.huGuaInfluence}`
  );

  // 第五步：断变卦
  steps.push(
    `【第五步：断变卦】\n` +
    `变卦${result.bianGua.name}代表事物的最终结局。\n` +
    `${tiYongAnalysis.bianGuaInfluence}`
  );

  // 第六步：定应期
  steps.push(
    `【第六步：定应期】\n` +
    timing
  );

  // 附加：分领域断语
  const qType = MEIHUA_QUESTION_TYPES.find(q => q.key === questionType);
  if (qType) {
    let domainText = `【分领域断语：${qType.label}】\n`;
    switch (questionType) {
      case 'career':
        domainText += domain.career;
        break;
      case 'wealth':
        domainText += domain.wealth;
        break;
      case 'marriage':
        domainText += domain.marriage;
        break;
      case 'health':
        domainText += domain.health;
        break;
      case 'exam':
        domainText += domain.exam;
        break;
      default:
        domainText += `事业：${domain.career.split('\n').pop() || ''}\n`;
        domainText += `财运：${domain.wealth.split('\n').pop() || ''}\n`;
        domainText += `婚姻：${domain.marriage.split('\n').pop() || ''}\n`;
        domainText += `健康：${domain.health.split('\n').pop() || ''}`;
        break;
    }
    steps.push(domainText);
  }

  return steps;
}

// ============================================================
// 八、主函数：生成完整深度解读
// ============================================================

export interface MeihuaDetailedAnalysis {
  questionType: string;
  tiYongAnalysis: TiYongAnalysis;
  guaEvolution: GuaEvolution;
  timing: string;
  domainAnalysis: DomainAnalysis;
  divinationSteps: string[];
  overallSummary: string;
}

export function generateMeihuaDetailedAnalysis(
  result: any,
  questionType: string = 'general',
  month?: number
): MeihuaDetailedAnalysis {
  // 1. 体用深度分析
  const tiYongAnalysis = analyzeTiYongDeep(result, month);

  // 2. 卦象演变分析
  const guaEvolution = analyzeGuaEvolution(result);

  // 3. 应期推断
  const timing = inferTiming(result, tiYongAnalysis);

  // 4. 分领域断语
  const domainAnalysis = generateDomainAnalysis(result, tiYongAnalysis, guaEvolution);

  // 5. 断卦步骤
  const divinationSteps = generateDivinationSteps(
    result, tiYongAnalysis, guaEvolution, timing, domainAnalysis, questionType
  );

  // 6. 综合总结
  let overallSummary = '';
  overallSummary += `本卦${result.benGua.name}，变卦${result.bianGua.name}，动爻第${result.dongYao}爻。\n`;
  overallSummary += `体用${tiYongAnalysis.relation}（${tiYongAnalysis.level}），体卦${tiYongAnalysis.tiWangshuai}。\n`;
  overallSummary += `${tiYongAnalysis.advice}\n`;
  overallSummary += `${timing}\n`;
  overallSummary += `\n卦象演变：${guaEvolution.evolution}`;

  return {
    questionType,
    tiYongAnalysis,
    guaEvolution,
    timing,
    domainAnalysis,
    divinationSteps,
    overallSummary,
  };
}
