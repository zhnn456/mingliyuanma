/**
 * 奇门遁甲深度解读引擎
 *
 * 补全内容：
 * 1. 问题类型选择与用神分析（求财/事业/婚姻/考试/疾病/出行/官司/失物等）
 * 2. 应期判断（根据用神落宫推断应验时间）
 * 3. 格局深度分析（成败条件+影响范围+古籍出处）
 * 4. 三奇六仪组合分析
 * 5. 宫位生克关系分析
 * 6. 综合断局
 */

import {
  BAMEN_INTERPRETATION,
  JIUXING_INTERPRETATION,
  BASHEN_INTERPRETATION,
  TEN_STEM_PATTERNS,
  JIUGONG_BAGUA,
  QIMEN_YONGSHEN,
  JIGE_SUMMARY,
  XIONGGE_SUMMARY,
} from './qimen';

// ============================================================
// 一、问题类型定义
// ============================================================

export interface QuestionType {
  key: string;
  label: string;
  icon: string;
  yongshen: string;
  description: string;
}

export const QUESTION_TYPES: QuestionType[] = [
  { key: 'general', label: '综合运势', icon: '卦', yongshen: '值符', description: '综合判断当前时局吉凶' },
  { key: 'wealth', label: '求财', icon: '财', yongshen: '生门', description: '以生门为用神，看财运方位与时机' },
  { key: 'career', label: '事业', icon: '业', yongshen: '开门', description: '以开门为用神，看事业方向与发展' },
  { key: 'marriage', label: '婚姻', icon: '婚', yongshen: '六合', description: '以六合为用神，兼看乙庚关系' },
  { key: 'exam', label: '考试', icon: '考', yongshen: '天辅', description: '以天辅星为用神，兼看丁奇' },
  { key: 'health', label: '疾病', icon: '疾', yongshen: '天芮', description: '以天芮为病星，天心为医药' },
  { key: 'travel', label: '出行', icon: '行', yongshen: '九天', description: '以九天为用神，看所往方位' },
  { key: 'lawsuit', label: '官司', icon: '讼', yongshen: '开门', description: '以开门为法官，景门为诉状' },
  { key: 'lost', label: '失物', icon: '失', yongshen: '日干', description: '以日干为失主，时干为失物' },
  { key: 'weather', label: '天气', icon: '天', yongshen: '天英', description: '以天英星看晴雨' },
];

// ============================================================
// 二、格局深度分析（成败条件+影响）
// ============================================================

interface PatternDetail {
  name: string;
  level: string;
  condition: string;
  influence: string;
  classicSource: string;
  advice: string;
}

export const PATTERN_DETAILS: Record<string, PatternDetail> = {
  '青龙返首': {
    name: '青龙返首',
    level: '大吉',
    condition: '天盘戊加地盘丙（戊加丙）',
    influence: '第一吉格，万事亨通，求谋皆遂。凡事大吉，所求皆得。',
    classicSource: '《烟波钓叟歌》："青龙返首，万事皆吉。"',
    advice: '此格大吉，宜大胆行动，求财、求职、求婚皆可。',
  },
  '飞鸟跌穴': {
    name: '飞鸟跌穴',
    level: '大吉',
    condition: '天盘丙加地盘戊（丙加戊）',
    influence: '第二吉格，不劳余力，万事顺遂。如飞鸟归巢，自然得其所哉。',
    classicSource: '《奇门遁甲秘笈》："飞鸟跌穴，不劳而获。"',
    advice: '此格大吉，顺势而为，无需强求，自然成功。',
  },
  '青龙耀明': {
    name: '青龙耀明',
    level: '吉',
    condition: '天盘戊加地盘丁（戊加丁）',
    influence: '第三吉格，利于见贵人、求取功名，光明在前。',
    classicSource: '《奇门遁甲秘笈》："青龙耀明，利见大人。"',
    advice: '宜拜访贵人、求职升迁、考试面试。',
  },
  '青龙转光': {
    name: '青龙转光',
    level: '吉',
    condition: '天盘丁加地盘戊（丁加戊）',
    influence: '第四吉格，好事更加顺利，锦上添花。',
    classicSource: '《奇门遁甲秘笈》："青龙转光，喜事重重。"',
    advice: '已有好事在进行的，会更加顺利。',
  },
  '白虎猖狂': {
    name: '白虎猖狂',
    level: '大凶',
    condition: '天盘辛加地盘乙（辛加乙）',
    influence: '大凶之格，主灾祸、伤病、官非、家败人亡。诸事不宜。',
    classicSource: '《烟波钓叟歌》："白虎猖狂，损财伤人。"',
    advice: '此格大凶，切勿行动，静待凶期过去。',
  },
  '青龙逃走': {
    name: '青龙逃走',
    level: '凶',
    condition: '天盘乙加地盘辛（乙加辛）',
    influence: '凶格，主走失、分离、损失，女逃男散。',
    classicSource: '《奇门遁甲秘笈》："青龙逃走，主分离走失。"',
    advice: '不宜远行、不宜合伙、防人走财失。',
  },
  '腾蛇夭矫': {
    name: '腾蛇夭矫',
    level: '凶',
    condition: '天盘癸加地盘丁（癸加丁）',
    influence: '凶格，主虚惊、怪异、不安，官司诉讼。',
    classicSource: '《烟波钓叟歌》："腾蛇夭矫，虚惊怪异。"',
    advice: '防虚惊怪事，不宜签订合同，注意口舌。',
  },
  '朱雀投江': {
    name: '朱雀投江',
    level: '凶',
    condition: '天盘丁加地盘癸（丁加癸）',
    influence: '凶格，主文书口舌是非，音信全无。',
    classicSource: '《奇门遁甲秘笈》："朱雀投江，文书口舌。"',
    advice: '不宜发文书、签合同，防口舌是非。',
  },
  '荧入太白': {
    name: '荧入太白',
    level: '凶',
    condition: '天盘丙加地盘庚（丙加庚）',
    influence: '凶格，主盗贼将至，客不利，需防损失。',
    classicSource: '《烟波钓叟歌》："荧入太白，贼必来。"',
    advice: '防盗窃、防破财，加强安保。',
  },
  '太白入荧': {
    name: '太白入荧',
    level: '凶',
    condition: '天盘庚加地盘丙（庚加丙）',
    influence: '凶格，主客不利，口舌争斗，贼来客不利。',
    classicSource: '《烟波钓叟歌》："太白入荧，贼必来。"',
    advice: '不宜做客，防外来侵犯，主方有利。',
  },
};

// ============================================================
// 三、用神分析
// ============================================================

function findYongshenPalace(
  palaces: any[],
  yongshen: string
): any | null {
  // 先在八门中找
  let palace = palaces.find(p =>
    p.gate === yongshen || p.gate?.includes(yongshen)
  );
  if (palace) return palace;

  // 在九星中找
  palace = palaces.find(p =>
    p.star === yongshen || p.star?.includes(yongshen)
  );
  if (palace) return palace;

  // 在八神中找
  palace = palaces.find(p =>
    p.deity === yongshen || p.deity?.includes(yongshen)
  );
  if (palace) return palace;

  // 在天盘干中找
  palace = palaces.find(p =>
    p.heavenlyStem === yongshen || p.heavenlyStem?.includes(yongshen)
  );
  if (palace) return palace;

  return null;
}

function analyzeYongshen(
  palaces: any[],
  questionType: string,
  dayStem: string
): {
  yongshenName: string;
  yongshenPalace: any | null;
  analysis: string;
  direction: string;
  timing: string;
  advice: string;
} {
  const qType = QUESTION_TYPES.find(q => q.key === questionType);
  if (!qType) {
    return {
      yongshenName: '值符',
      yongshenPalace: null,
      analysis: '请选择问题类型',
      direction: '',
      timing: '',
      advice: '',
    };
  }

  const yongshenName = qType.yongshen;
  let yongshenPalace = findYongshenPalace(palaces, yongshenName);

  // 特殊处理：失物用日干
  if (questionType === 'lost') {
    yongshenPalace = palaces.find(p => p.heavenlyStem === dayStem) || null;
  }

  // 特殊处理：婚姻用六合+乙庚
  if (questionType === 'marriage') {
    const liuHePalace = palaces.find(p => p.deity === '六合');
    const yiPalace = palaces.find(p => p.heavenlyStem === '乙');
    const gengPalace = palaces.find(p => p.heavenlyStem === '庚');
    
    if (liuHePalace) {
      return analyzeMarriage(palaces, liuHePalace, yiPalace, gengPalace);
    }
  }

  // 特殊处理：考试用天辅+丁奇
  if (questionType === 'exam') {
    const tianFuPalace = palaces.find(p => p.star === '天辅');
    const dingPalace = palaces.find(p => p.heavenlyStem === '丁');
    if (tianFuPalace) {
      return analyzeExam(palaces, tianFuPalace, dingPalace);
    }
  }

  // 特殊处理：求财用生门
  if (questionType === 'wealth') {
    const shengMenPalace = palaces.find(p => p.gate === '生门');
    if (shengMenPalace) {
      return analyzeWealth(palaces, shengMenPalace);
    }
  }

  // 特殊处理：事业用开门+值符
  if (questionType === 'career') {
    const kaiMenPalace = palaces.find(p => p.gate === '开门');
    const zhiFuPalace = palaces.find(p => p.isZhiFu);
    if (kaiMenPalace) {
      return analyzeCareer(palaces, kaiMenPalace, zhiFuPalace);
    }
  }

  // 特殊处理：疾病用天芮为病，天心为药
  if (questionType === 'health') {
    const bingXing = palaces.find(p => p.star === '天芮');
    const yaoXing = palaces.find(p => p.star === '天心');
    if (bingXing || yaoXing) {
      return analyzeHealth(palaces, bingXing, yaoXing);
    }
  }

  // 特殊处理：出行用九天
  if (questionType === 'travel') {
    const jiuTianPalace = palaces.find(p => p.deity === '九天');
    if (jiuTianPalace) {
      return analyzeTravel(palaces, jiuTianPalace);
    }
  }

  // 特殊处理：官司用开门+景门
  if (questionType === 'lawsuit') {
    const kaiMenPalace = palaces.find(p => p.gate === '开门');
    const jingMenPalace = palaces.find(p => p.gate === '景门');
    const zhiFuPalace = palaces.find(p => p.isZhiFu);
    if (kaiMenPalace) {
      return analyzeLawsuit(palaces, kaiMenPalace, jingMenPalace, zhiFuPalace);
    }
  }

  // 通用分析
  if (!yongshenPalace) {
    return {
      yongshenName,
      yongshenPalace: null,
      analysis: `用神${yongshenName}未在盘面中找到，请检查排盘数据。`,
      direction: '',
      timing: '',
      advice: '',
    };
  }

  return doGeneralAnalysis(yongshenPalace, yongshenName, qType, palaces, dayStem);
}

// 婚姻专项分析
function analyzeMarriage(palaces: any[], liuHePalace: any, yiPalace: any, gengPalace: any) {
  const liuHeInfo = getPalaceInfo(liuHePalace.trigram, liuHePalace.position);
  const direction = liuHeInfo?.direction || '';
  
  let analysis = `【婚姻专项分析】\n`;
  analysis += `用神六合落${liuHePalace.trigram}宫（${direction}，${liuHeInfo?.wuxing || ''}）。\n`;
  
  // 六合宫分析
  const liuHeGate = BAMEN_INTERPRETATION[liuHePalace.gate];
  const liuHeStar = JIUXING_INTERPRETATION[liuHePalace.star];
  analysis += `六合宫中：${liuHePalace.star}（${liuHeStar?.level || ''}）、${liuHePalace.gate}（${liuHeGate?.level || ''}）。\n`;
  
  // 乙庚关系分析
  if (yiPalace && gengPalace) {
    const yiInfo = getPalaceInfo(yiPalace.trigram, yiPalace.position);
    const gengInfo = getPalaceInfo(gengPalace.trigram, gengPalace.position);
    analysis += `\n女方乙落${yiPalace.trigram}宫（${yiInfo?.direction || ''}），男方庚落${gengPalace.trigram}宫（${gengInfo?.direction || ''}）。\n`;
    
    const relation = getWuxingRelation(yiInfo?.wuxing || '', gengInfo?.wuxing || '');
    if (relation === '生') {
      analysis += `乙方生甲方，女方有助男方，婚姻美满。`;
    } else if (relation === '克') {
      analysis += `乙方克甲方，女方强势，需注意沟通。`;
    } else if (relation === '同') {
      analysis += `乙庚同五行，双方势均力敌，需互敬互重。`;
    }
  }
  
  // 判断吉凶
  const levels = [liuHeGate?.level || '', liuHeStar?.level || ''];
  const auspiciousCount = levels.filter(l => l.includes('吉')).length;
  const inauspiciousCount = levels.filter(l => l.includes('凶')).length;
  
  let overall = '';
  if (auspiciousCount > inauspiciousCount) {
    overall = '六合宫吉象明显，婚姻缘分佳，宜积极把握。';
  } else if (inauspiciousCount > auspiciousCount) {
    overall = '六合宫凶象较多，婚姻有阻，需谨慎等待。';
  } else {
    overall = '六合宫吉凶参半，婚姻成败各半，需双方努力。';
  }
  
  analysis += `\n\n综合判断：${overall}`;
  
  const stemKey = `${liuHePalace.heavenlyStem}${liuHePalace.earthlyStem}`;
  const stemPattern = TEN_STEM_PATTERNS[stemKey];
  if (stemPattern) {
    analysis += `\n\n十干克应：${stemPattern.name}（${stemPattern.level}）。${stemPattern.description}`;
  }
  
  return {
    yongshenName: '六合',
    yongshenPalace: liuHePalace,
    analysis,
    direction,
    timing: getTiming(liuHeInfo?.wuxing || '', liuHePalace.earthBranch || '', liuHePalace.position),
    advice: `宜往${direction}方向谈婚论嫁。${auspiciousCount > inauspiciousCount ? '当前时机有利，可积极推进婚事。' : '需耐心等待吉时，不宜急躁。'}`,
  };
}

// 考试专项分析
function analyzeExam(palaces: any[], tianFuPalace: any, dingPalace: any | null) {
  const tfInfo = getPalaceInfo(tianFuPalace.trigram, tianFuPalace.position);
  const direction = tfInfo?.direction || '';
  
  let analysis = `【考试/求学专项分析】\n`;
  analysis += `用神天辅星落${tianFuPalace.trigram}宫（${direction}，${tfInfo?.wuxing || ''}）。\n`;
  
  const tfGate = BAMEN_INTERPRETATION[tianFuPalace.gate];
  const tfStar = JIUXING_INTERPRETATION[tianFuPalace.star];
  analysis += `天辅宫中：${tianFuPalace.deity}、${tianFuPalace.star}（${tfStar?.level || ''}）、${tianFuPalace.gate}（${tfGate?.level || ''}）。\n`;
  
  // 丁奇分析
  if (dingPalace) {
    const dingInfo = getPalaceInfo(dingPalace.trigram, dingPalace.position);
    analysis += `\n文昌丁奇落${dingPalace.trigram}宫（${dingInfo?.direction || ''}），主考试有利。\n`;
    
    const dingGate = BAMEN_INTERPRETATION[dingPalace.gate];
    if (dingGate?.level.includes('吉')) {
      analysis += `丁奇坐吉门，考试发挥出色，有望金榜题名。`;
    }
  }
  
  // 判断吉凶
  const levels = [tfGate?.level || '', tfStar?.level || ''];
  const auspiciousCount = levels.filter(l => l.includes('吉')).length;
  const inauspiciousCount = levels.filter(l => l.includes('凶')).length;
  
  let overall = '';
  if (auspiciousCount > inauspiciousCount) {
    overall = '天辅星宫吉象，学业运佳，考试顺利。';
  } else if (inauspiciousCount > auspiciousCount) {
    overall = '天辅星宫凶象，考试有压力，需加倍努力。';
  } else {
    overall = '天辅星宫吉凶参半，考试需正常发挥。';
  }
  
  analysis += `\n\n综合判断：${overall}`;
  
  const stemKey = `${tianFuPalace.heavenlyStem}${tianFuPalace.earthlyStem}`;
  const stemPattern = TEN_STEM_PATTERNS[stemKey];
  if (stemPattern) {
    analysis += `\n\n十干克应：${stemPattern.name}（${stemPattern.level}）。${stemPattern.description}`;
  }
  
  return {
    yongshenName: '天辅',
    yongshenPalace: tianFuPalace,
    analysis,
    direction,
    timing: getTiming(tfInfo?.wuxing || '', tianFuPalace.earthBranch || '', tianFuPalace.position),
    advice: `宜往${direction}方向考试求学。${auspiciousCount > inauspiciousCount ? '当前文昌运旺，可大胆应考。' : '需认真备考，沉着应对。'}`,
  };
}

// 求财专项分析
function analyzeWealth(palaces: any[], shengMenPalace: any) {
  const smInfo = getPalaceInfo(shengMenPalace.trigram, shengMenPalace.position);
  const direction = smInfo?.direction || '';
  
  let analysis = `【求财专项分析】\n`;
  analysis += `用神生门落${shengMenPalace.trigram}宫（${direction}，${smInfo?.wuxing || ''}）。\n`;
  
  const smGate = BAMEN_INTERPRETATION[shengMenPalace.gate];
  const smStar = JIUXING_INTERPRETATION[shengMenPalace.star];
  analysis += `生门宫中：${shengMenPalace.deity}、${shengMenPalace.star}（${smStar?.level || ''}）、${shengMenPalace.gate}（${smGate?.level || ''}）。\n`;
  
  // 生门五行旺衰
  const wx = smInfo?.wuxing || '';
  analysis += `生门五行属${wx}，得时令则财源旺盛。\n`;
  
  // 判断吉凶
  const levels = [smGate?.level || '', smStar?.level || ''];
  const auspiciousCount = levels.filter(l => l.includes('吉')).length;
  const inauspiciousCount = levels.filter(l => l.includes('凶')).length;
  
  let overall = '';
  if (auspiciousCount > inauspiciousCount) {
    overall = '生门旺相，财运亨通，求财可得。';
  } else if (inauspiciousCount > auspiciousCount) {
    overall = '生门受制，财运受阻，不宜强求。';
  } else {
    overall = '生门吉凶参半，求财有得有失。';
  }
  
  analysis += `\n\n综合判断：${overall}`;
  
  const stemKey = `${shengMenPalace.heavenlyStem}${shengMenPalace.earthlyStem}`;
  const stemPattern = TEN_STEM_PATTERNS[stemKey];
  if (stemPattern) {
    analysis += `\n\n十干克应：${stemPattern.name}（${stemPattern.level}）。${stemPattern.description}`;
  }
  
  return {
    yongshenName: '生门',
    yongshenPalace: shengMenPalace,
    analysis,
    direction,
    timing: getTiming(smInfo?.wuxing || '', shengMenPalace.earthBranch || '', shengMenPalace.position),
    advice: `宜往${direction}方向求财。${auspiciousCount > inauspiciousCount ? '当前财运旺盛，可积极投资求财。' : '需谨慎理财，不可盲目投资。'}`,
  };
}

// 事业专项分析
function analyzeCareer(palaces: any[], kaiMenPalace: any, zhiFuPalace: any | null) {
  const kmInfo = getPalaceInfo(kaiMenPalace.trigram, kaiMenPalace.position);
  const direction = kmInfo?.direction || '';
  
  let analysis = `【事业/求职专项分析】\n`;
  analysis += `用神开门落${kaiMenPalace.trigram}宫（${direction}，${kmInfo?.wuxing || ''}）。\n`;
  
  const kmGate = BAMEN_INTERPRETATION[kaiMenPalace.gate];
  const kmStar = JIUXING_INTERPRETATION[kaiMenPalace.star];
  analysis += `开门宫中：${kaiMenPalace.deity}、${kaiMenPalace.star}（${kmStar?.level || ''}）、${kaiMenPalace.gate}（${kmGate?.level || ''}）。\n`;
  
  // 值符分析
  if (zhiFuPalace) {
    const zfInfo = getPalaceInfo(zhiFuPalace.trigram, zhiFuPalace.position);
    analysis += `\n值符（${zhiFuPalace.star}）落${zhiFuPalace.trigram}宫（${zfInfo?.direction || ''}），为事业贵人所在。\n`;
  }
  
  // 判断吉凶
  const levels = [kmGate?.level || '', kmStar?.level || ''];
  const auspiciousCount = levels.filter(l => l.includes('吉')).length;
  const inauspiciousCount = levels.filter(l => l.includes('凶')).length;
  
  let overall = '';
  if (auspiciousCount > inauspiciousCount) {
    overall = '开门大吉，事业顺利，求职可得。';
  } else if (inauspiciousCount > auspiciousCount) {
    overall = '开门受制，事业有阻，需耐心等待。';
  } else {
    overall = '开门吉凶参半，事业有成有败。';
  }
  
  analysis += `\n\n综合判断：${overall}`;
  
  const stemKey = `${kaiMenPalace.heavenlyStem}${kaiMenPalace.earthlyStem}`;
  const stemPattern = TEN_STEM_PATTERNS[stemKey];
  if (stemPattern) {
    analysis += `\n\n十干克应：${stemPattern.name}（${stemPattern.level}）。${stemPattern.description}`;
  }
  
  return {
    yongshenName: '开门',
    yongshenPalace: kaiMenPalace,
    analysis,
    direction,
    timing: getTiming(kmInfo?.wuxing || '', kaiMenPalace.earthBranch || '', kaiMenPalace.position),
    advice: `宜往${direction}方向求职谋事。${auspiciousCount > inauspiciousCount ? '当前事业运佳，可积极进取。' : '需静待时机，不宜急躁。'}`,
  };
}

// 疾病专项分析
function analyzeHealth(palaces: any[], bingXing: any | null, yaoXing: any | null) {
  let analysis = `【健康/疾病专项分析】\n`;
  
  if (bingXing) {
    const bingPalace = getPalaceInfo(bingXing.trigram, bingXing.position);
    const bingWx = bingPalace?.wuxing || '';
    analysis += `病星天芮落${bingXing.trigram}宫（${bingPalace?.direction || ''}，${bingWx}）。\n`;
    analysis += `对应身体部位：${bingPalace?.bodyPart || ''}。\n`;
  }
  
  if (yaoXing) {
    const yaoPalace = getPalaceInfo(yaoXing.trigram, yaoXing.position);
    const yaoWx = yaoPalace?.wuxing || '';
    analysis += `医药天心落${yaoXing.trigram}宫（${yaoPalace?.direction || ''}，${yaoWx}）。\n`;
    
    // 五行生克判断
    if (bingXing) {
      const bingPalace = getPalaceInfo(bingXing.trigram, bingXing.position);
      const wxRelation = getWuxingRelation(yaoWx, bingPalace?.wuxing || '');
      if (wxRelation === '生') {
        analysis += `\n药星生病星，医药有效，病情可愈。`;
      } else if (wxRelation === '克') {
        analysis += `\n药星克病星，医药有力，可治此病。`;
      } else if (wxRelation === '同') {
        analysis += `\n药病同五行，需费些时日，但终可治愈。`;
      } else {
        analysis += `\n药星被病星克或泄，医药效果有限，需另寻名医。`;
      }
    }
    
    return {
      yongshenName: '天芮',
      yongshenPalace: bingXing,
      analysis,
      direction: yaoPalace?.direction || '',
      timing: getTiming(yaoWx, yaoXing.earthBranch || '', yaoXing.position),
      advice: `宜往${yaoPalace?.direction || ''}方向求医。注意天芮落宫对应的身体部位，及时就医。`,
    };
  }
  
  return {
    yongshenName: '天芮',
    yongshenPalace: bingXing,
    analysis: analysis + '\n未找到天心医药星，建议全面检查身体。',
    direction: '',
    timing: '',
    advice: '建议全面体检，注意养生保健。',
  };
}

// 出行专项分析
function analyzeTravel(palaces: any[], jiuTianPalace: any) {
  const jtInfo = getPalaceInfo(jiuTianPalace.trigram, jiuTianPalace.position);
  const direction = jtInfo?.direction || '';
  
  let analysis = `【出行专项分析】\n`;
  analysis += `用神九天落${jiuTianPalace.trigram}宫（${direction}，${jtInfo?.wuxing || ''}）。\n`;
  
  const jtGate = BAMEN_INTERPRETATION[jiuTianPalace.gate];
  const jtStar = JIUXING_INTERPRETATION[jiuTianPalace.star];
  analysis += `九天宫中：${jiuTianPalace.deity}、${jiuTianPalace.star}（${jtStar?.level || ''}）、${jiuTianPalace.gate}（${jtGate?.level || ''}）。\n`;
  
  // 判断吉凶
  const levels = [jtGate?.level || '', jtStar?.level || ''];
  const auspiciousCount = levels.filter(l => l.includes('吉')).length;
  const inauspiciousCount = levels.filter(l => l.includes('凶')).length;
  
  let overall = '';
  if (auspiciousCount > inauspiciousCount) {
    overall = '九天旺相，出行顺利，平安可达。';
  } else if (inauspiciousCount > auspiciousCount) {
    overall = '九天受制，出行有阻，建议改期。';
  } else {
    overall = '九天吉凶参半，出行需谨慎。';
  }
  
  analysis += `\n\n综合判断：${overall}`;
  
  // 检查死门惊门
  const siMen = palaces.find(p => p.gate === '死门');
  const jingMen = palaces.find(p => p.gate === '惊门');
  const avoidDirs: string[] = [];
  if (siMen) {
    const siInfo = getPalaceInfo(siMen.trigram, siMen.position);
    avoidDirs.push(`${siInfo?.direction || ''}（死门）`);
  }
  if (jingMen) {
    const jingInfo = getPalaceInfo(jingMen.trigram, jingMen.position);
    avoidDirs.push(`${jingInfo?.direction || ''}（惊门）`);
  }
  
  if (avoidDirs.length > 0) {
    analysis += `\n\n需避开的方位：${avoidDirs.join('、')}`;
  }
  
  return {
    yongshenName: '九天',
    yongshenPalace: jiuTianPalace,
    analysis,
    direction,
    timing: getTiming(jtInfo?.wuxing || '', jiuTianPalace.earthBranch || '', jiuTianPalace.position),
    advice: `宜往${direction}方向出行。避开死门、惊门方位。${auspiciousCount > inauspiciousCount ? '当前出行有利，可放心前往。' : '需谨慎出行，注意安全。'}`,
  };
}

// 官司专项分析
function analyzeLawsuit(palaces: any[], kaiMenPalace: any, jingMenPalace: any | null, zhiFuPalace: any | null) {
  const kmInfo = getPalaceInfo(kaiMenPalace.trigram, kaiMenPalace.position);
  const direction = kmInfo?.direction || '';
  
  let analysis = `【官司/诉讼专项分析】\n`;
  analysis += `用神开门（法官）落${kaiMenPalace.trigram}宫（${direction}，${kmInfo?.wuxing || ''}）。\n`;
  
  const kmGate = BAMEN_INTERPRETATION[kaiMenPalace.gate];
  analysis += `开门宫中：${kaiMenPalace.star}、${kaiMenPalace.gate}（${kmGate?.level || ''}）。\n`;
  
  // 景门（诉状）分析
  if (jingMenPalace) {
    const jmInfo = getPalaceInfo(jingMenPalace.trigram, jingMenPalace.position);
    analysis += `\n诉状景门落${jingMenPalace.trigram}宫（${jmInfo?.direction || ''}），文书证据情况：${jingMenPalace.gate}。\n`;
  }
  
  // 值符（原告/被告）分析
  if (zhiFuPalace) {
    const zfInfo = getPalaceInfo(zhiFuPalace.trigram, zhiFuPalace.position);
    analysis += `\n值符落${zhiFuPalace.trigram}宫（${zfInfo?.direction || ''}），主方局势。\n`;
  }
  
  // 判断吉凶
  const levels = [kmGate?.level || ''];
  const auspiciousCount = levels.filter(l => l.includes('吉')).length;
  const inauspiciousCount = levels.filter(l => l.includes('凶')).length;
  
  let overall = '';
  if (auspiciousCount > inauspiciousCount) {
    overall = '开门得吉，官司有利，可胜诉。';
  } else if (inauspiciousCount > auspiciousCount) {
    overall = '开门受凶，官司不利，需谨慎应对。';
  } else {
    overall = '开门吉凶参半，官司成败各半。';
  }
  
  analysis += `\n\n综合判断：${overall}`;
  
  return {
    yongshenName: '开门',
    yongshenPalace: kaiMenPalace,
    analysis,
    direction,
    timing: getTiming(kmInfo?.wuxing || '', kaiMenPalace.earthBranch || '', kaiMenPalace.position),
    advice: `宜在${direction}方向处理官司。${auspiciousCount > inauspiciousCount ? '当前局势有利，可积极应对。' : '需谨慎处理，建议寻求律师帮助。'}`,
  };
}

// 通用分析
function doGeneralAnalysis(yongshenPalace: any, yongshenName: string, qType: QuestionType, palaces: any[], dayStem: string) {
  const palaceInfo = getPalaceInfo(yongshenPalace.trigram, yongshenPalace.position);
  const direction = palaceInfo?.direction || '';
  const palaceWx = palaceInfo?.wuxing || '';

  // 获取用神所在宫的格局
  const gateInfo = BAMEN_INTERPRETATION[yongshenPalace.gate];
  const starInfo = JIUXING_INTERPRETATION[yongshenPalace.star];
  const deityInfo = BASHEN_INTERPRETATION[yongshenPalace.deity];

  // 十干克应
  const stemKey = `${yongshenPalace.heavenlyStem}${yongshenPalace.earthlyStem}`;
  const stemPattern = TEN_STEM_PATTERNS[stemKey];

  let analysis = `【${qType.label}专项分析】\n`;
  analysis += `用神${yongshenName}落${yongshenPalace.trigram}宫（${direction}，${palaceWx}）。\n`;
  analysis += `宫中：${yongshenPalace.deity}（${deityInfo?.level || ''}）、${yongshenPalace.star}（${starInfo?.level || ''}）、${yongshenPalace.gate}（${gateInfo?.level || ''}）。\n`;
  analysis += `天盘${yongshenPalace.heavenlyStem}加地盘${yongshenPalace.earthlyStem}。`;

  if (stemPattern) {
    analysis += `\n\n十干克应：${stemPattern.name}（${stemPattern.level}）。${stemPattern.description}`;
  }

  // 判断吉凶
  const levels = [
    gateInfo?.level || '',
    starInfo?.level || '',
    deityInfo?.level || '',
    stemPattern?.level || '',
  ];

  const auspiciousCount = levels.filter(l => l.includes('吉')).length;
  const inauspiciousCount = levels.filter(l => l.includes('凶')).length;

  if (auspiciousCount > inauspiciousCount) {
    analysis += `\n\n综合判断：用神所落宫位吉多凶少，${qType.label}之事有望成功。`;
  } else if (inauspiciousCount > auspiciousCount) {
    analysis += `\n\n综合判断：用神所落宫位凶多吉少，${qType.label}之事困难较多，需谨慎。`;
  } else {
    analysis += `\n\n综合判断：用神所落宫位吉凶参半，${qType.label}之事成败各半。`;
  }

  // 空亡判断
  if (yongshenPalace.voidness?.hasVoidness) {
    analysis += `\n注意：用神落空亡宫，主事落空，需等出空之时方可成事。`;
  }

  // 应期判断
  let timing = '';
  if (palaceWx) {
    const stemBranch = yongshenPalace.earthBranch || '';
    timing = getTiming(palaceWx, stemBranch, yongshenPalace.position);
  }

  // 建议
  let advice = '';
  if (qType.key === 'wealth') {
    advice = gateInfo?.advice || '宜在生门所在方位求财。';
  } else if (qType.key === 'career') {
    advice = gateInfo?.advice || '宜在开门所在方位求职谋事。';
  } else if (qType.key === 'marriage') {
    advice = '宜在六合所在方位谈婚论嫁，兼看乙庚落宫关系。';
  } else if (qType.key === 'exam') {
    advice = '宜在天辅星所在方位考试求学，兼看丁奇落宫。';
  } else if (qType.key === 'travel') {
    advice = `宜往${direction}出行，避开死门、惊门方位。`;
  } else {
    advice = gateInfo?.advice || '审时度势，谨慎行事。';
  }

  return {
    yongshenName,
    yongshenPalace,
    analysis,
    direction,
    timing,
    advice,
  };
}

// 宫位数字转中文
const POS_TO_CN: Record<number, string> = {
  1: '一', 2: '二', 3: '三', 4: '四', 5: '五',
  6: '六', 7: '七', 8: '八', 9: '九',
};

function getPalaceInfo(trigram: string, position: number) {
  const key = `${trigram}${POS_TO_CN[position] || position}宫`;
  return JIUGONG_BAGUA[key] || null;
}

// 五行生克关系
function getWuxingRelation(a: string, b: string): string {
  const wx = ['金', '木', '水', '火', '土'];
  if (!wx.includes(a) || !wx.includes(b)) return '';
  if (a === b) return '同';

  const sheng: Record<string, string> = { '金': '水', '水': '木', '木': '火', '火': '土', '土': '金' };
  const ke: Record<string, string> = { '金': '木', '木': '土', '土': '水', '水': '火', '火': '金' };

  if (sheng[a] === b) return '生';
  if (sheng[b] === a) return '被生';
  if (ke[a] === b) return '克';
  if (ke[b] === a) return '被克';
  return '';
}

// 应期判断
function getTiming(palaceWx: string, stemBranch: string, position: number): string {
  const branchTiming: Record<string, string> = {
    '子': '子日或子时（北方·鼠）', '丑': '丑日或丑时（东北·牛）',
    '寅': '寅日或寅时（东北·虎）', '卯': '卯日或卯时（东方·兔）',
    '辰': '辰日或辰时（东南·龙）', '巳': '巳日或巳时（东南·蛇）',
    '午': '午日或午时（南方·马）', '未': '未日或未时（西南·羊）',
    '申': '申日或申时（西南·猴）', '酉': '酉日或酉时（西方·鸡）',
    '戌': '戌日或戌时（西北·狗）', '亥': '亥日或亥时（西北·猪）',
  };

  let timing = '';
  if (stemBranch && branchTiming[stemBranch]) {
    timing += `以地支${stemBranch}为应期：${branchTiming[stemBranch]}。`;
  }

  // 五行应期
  const wxTiming: Record<string, string> = {
    '金': '秋季或庚辛日',
    '木': '春季或甲乙日',
    '水': '冬季或壬癸日',
    '火': '夏季或丙丁日',
    '土': '四季月或戊己日',
  };
  if (wxTiming[palaceWx]) {
    timing += ` 以五行${palaceWx}论：${wxTiming[palaceWx]}。`;
  }

  // 宫位数应期
  const numTiming: Record<number, string> = {
    1: '一数（1天/1月/1年）', 2: '二数（2天/2月/2年）',
    3: '三数（3天/3月/3年）', 4: '四数（4天/4月/4年）',
    6: '六数（6天/6月/6年）', 7: '七数（7天/7月/7年）',
    8: '八数（8天/8月/8年）', 9: '九数（9天/9月/9年）',
  };
  if (numTiming[position]) {
    timing += ` 以宫数论：${numTiming[position]}。`;
  }

  return timing || '应期需结合具体事象判断。';
}

// ============================================================
// 四、宫位生克分析
// ============================================================

function analyzePalaceRelations(
  palaces: any[]
): { analysis: string; bestDirection: string; worstDirection: string } {
  const dayGan = palaces[0]?.earthlyStem; // 简化处理
  let analysis = '';
  let bestDirection = '';
  let worstDirection = '';

  // 找值符宫和值使宫
  const zhiFuPalace = palaces.find(p => p.isZhiFu);
  const zhiShiPalace = palaces.find(p => p.isZhiShi);

  if (zhiFuPalace) {
    const info = getPalaceInfo(zhiFuPalace.trigram, zhiFuPalace.position);
    analysis += `值符（${zhiFuPalace.star}）落${zhiFuPalace.trigram}宫（${info?.direction || ''}），为全局核心。`;
    bestDirection = info?.direction || '';
  }

  if (zhiShiPalace) {
    const info = getPalaceInfo(zhiShiPalace.trigram, zhiShiPalace.position);
    const gateInfo = BAMEN_INTERPRETATION[zhiShiPalace.gate];
    analysis += ` 值使（${zhiShiPalace.gate}）落${zhiShiPalace.trigram}宫（${info?.direction || ''}），${gateInfo?.meaning || ''}`;
    if (gateInfo?.level.includes('凶')) {
      worstDirection = info?.direction || '';
    }
  }

  // 找最吉和最凶的方位
  let bestScore = -1;
  let worstScore = 1;
  for (const p of palaces) {
    if (p.position === 5) continue;
    const gateInfo = BAMEN_INTERPRETATION[p.gate];
    const starInfo = JIUXING_INTERPRETATION[p.star];
    const deityInfo = BASHEN_INTERPRETATION[p.deity];

    let score = 0;
    if (gateInfo?.level.includes('吉')) score++;
    if (gateInfo?.level.includes('凶')) score--;
    if (starInfo?.level.includes('吉')) score++;
    if (starInfo?.level.includes('凶')) score--;
    if (deityInfo?.level.includes('吉')) score++;
    if (deityInfo?.level.includes('凶')) score--;

    const info = getPalaceInfo(p.trigram, p.position);
    if (score > bestScore) {
      bestScore = score;
      bestDirection = info?.direction || '';
    }
    if (score < worstScore) {
      worstScore = score;
      worstDirection = info?.direction || '';
    }
  }

  return { analysis, bestDirection, worstDirection };
}

// ============================================================
// 五、主函数：生成完整深度解读
// ============================================================

export interface QimenDetailedAnalysis {
  // 问题类型分析
  questionType: string;
  yongshenAnalysis: ReturnType<typeof analyzeYongshen>;

  // 格局深度分析
  patternDetails: PatternDetail[];

  // 宫位关系
  palaceRelations: ReturnType<typeof analyzePalaceRelations>;

  // 综合断局
  overallAnalysis: string;

  // 方位建议
  directionAdvice: {
    best: string;
    avoid: string;
    detail: string;
  };
}

export function generateQimenDetailedAnalysis(
  result: any,
  questionType: string = 'general'
): QimenDetailedAnalysis {
  const palaces = result.palaces || [];
  const dayStem = result.fourPillars?.day?.stem || '';

  // 1. 用神分析
  const yongshenAnalysis = analyzeYongshen(palaces, questionType, dayStem);

  // 2. 格局深度分析
  const patternDetails: PatternDetail[] = [];
  const allPatterns = [
    ...(result.specialPatterns?.auspiciousPatterns || []),
    ...(result.specialPatterns?.inauspiciousPatterns || []),
  ];

  for (const p of allPatterns) {
    const detail = PATTERN_DETAILS[p.name];
    if (detail) {
      patternDetails.push(detail);
    } else {
      // 从汇总中查找
      const jige = JIGE_SUMMARY[p.name];
      const xiongge = XIONGGE_SUMMARY[p.name];
      const info = jige || xiongge;
      if (info) {
        patternDetails.push({
          name: p.name,
          level: info.level,
          condition: info.description,
          influence: info.description,
          classicSource: '',
          advice: info.level.includes('吉') ? '宜顺势而为' : '宜守不宜进',
        });
      }
    }
  }

  // 每个宫位的十干克应
  for (const palace of palaces) {
    if (palace.position === 5) continue;
    const stemKey = `${palace.heavenlyStem}${palace.earthlyStem}`;
    const stemPattern = TEN_STEM_PATTERNS[stemKey];
    if (stemPattern && stemPattern.level !== '中') {
      // 检查是否已添加
      if (!patternDetails.find(p => p.name === stemPattern.name)) {
        patternDetails.push({
          name: stemPattern.name,
          level: stemPattern.level,
          condition: `天盘${palace.heavenlyStem}加地盘${palace.earthlyStem}，落${palace.trigram}宫`,
          influence: stemPattern.description,
          classicSource: '',
          advice: stemPattern.level.includes('吉') ? '此宫宜行事' : '此宫不宜行事',
        });
      }
    }
  }

  // 3. 宫位关系
  const palaceRelations = analyzePalaceRelations(palaces);

  // 4. 综合断局
  let overallAnalysis = '';
  overallAnalysis += `当前时局为${result.ju?.type || ''}${result.ju?.number || ''}局，${result.yuan || ''}，节气${result.timeInfo?.solarTerm || ''}。\n`;

  if (yongshenAnalysis.analysis) {
    overallAnalysis += `\n${yongshenAnalysis.analysis}\n`;
  }

  if (yongshenAnalysis.timing) {
    overallAnalysis += `\n应期：${yongshenAnalysis.timing}\n`;
  }

  if (palaceRelations.analysis) {
    overallAnalysis += `\n${palaceRelations.analysis}\n`;
  }

  // 空亡提示
  if (result.timeInfo?.voidness && result.timeInfo.voidness.length > 0) {
    overallAnalysis += `\n空亡方位：${result.timeInfo.voidness.join('、')}，此方位不宜行事。\n`;
  }

  overallAnalysis += `\n建议：${yongshenAnalysis.advice}`;

  // 5. 方位建议
  const directionAdvice = {
    best: palaceRelations.bestDirection,
    avoid: palaceRelations.worstDirection,
    detail: `吉利方位宜行事，不利方位宜避开。空亡方位${result.timeInfo?.voidness?.join('、') || '无'}不宜行事。`,
  };

  return {
    questionType,
    yongshenAnalysis,
    patternDetails,
    palaceRelations,
    overallAnalysis,
    directionAdvice,
  };
}
