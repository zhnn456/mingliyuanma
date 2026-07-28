/**
 * 八字专项解读引擎
 * 
 * 基于以下经典著作的论命体系：
 * - 《渊海子平》：格局用神、十神组合、六亲论命
 * - 《子平真诠》：格局成败、用神变化、大运喜忌
 * - 《穷通宝鉴》：调候用神（月令气候）
 * - 《三命通会》：宫位、神煞、综合论命
 * - 《滴天髓》：五行旺衰、生克制化
 * - 《李虚中命书》：六亲、富贵层次
 *
 * 分析维度：
 * 1. 事业分析  — 格局+用神+十神组合 → 事业方向
 * 2. 财运分析  — 财星+大运 → 财运走势
 * 3. 感情婚姻  — 日支配偶宫+财官星+桃花
 * 4. 健康分析  — 五行失衡 → 脏腑对应
 * 5. 学业分析  — 文昌+印星 → 学业方向
 * 6. 六亲关系  — 十神对应六亲
 * 7. 开运建议  — 用神 → 颜色/方位/行业
 * 8. 性格深度  — 四柱综合性格
 * 9. 一生综述  — 格局+大运综合
 * 10. 大运详解  — 每步大运的详细文本
 * 11. 流年详解  — 每个流年的详细文本
 */

import type {
  BaziResult,
  CareerAnalysis,
  WealthAnalysis,
  MarriageAnalysis,
  HealthAnalysis,
  EducationAnalysis,
  FamilyRelationAnalysis,
  LuckEnhancement,
  PersonalityAnalysis,
  LifeOverview,
  BaziDetailedAnalysis,
  DayunDetail,
  LiuNian,
} from '@/types';
import { TIAN_GAN_WU_XING, DI_ZHI_WU_XING, SHI_SHEN, DI_ZHI_CANG_GAN, TIAN_GAN, DI_ZHI } from '@/types';
import { DAY_GAN_PERSONALITY } from './bazi';
import { analyzeQiangRuo, getTiaoHou, getShiShen as getShiShenFn } from './bazi-analysis';

// ========== 辅助函数 ==========

/** 获取命局中所有天干的十神列表 */
function getAllShiShen(dayGan: string, fourPillars: any): string[] {
  const shishenMap = SHI_SHEN[dayGan];
  if (!shishenMap) return [];
  const result: string[] = [];
  if (fourPillars.year?.gan) result.push(shishenMap[fourPillars.year.gan] || '');
  if (fourPillars.month?.gan) result.push(shishenMap[fourPillars.month.gan] || '');
  if (fourPillars.hour?.gan) result.push(shishenMap[fourPillars.hour.gan] || '');
  // 地支本气十神
  [fourPillars.year, fourPillars.month, fourPillars.day, fourPillars.hour].forEach((p: any) => {
    if (p?.zhi) {
      const cg = DI_ZHI_CANG_GAN[p.zhi];
      if (cg && cg[0]) result.push(shishenMap[cg[0]] || '');
    }
  });
  return result;
}

/** 检查命局中是否有某十神 */
function hasShiShen(allSS: string[], ...names: string[]): boolean {
  return names.some(n => allSS.includes(n));
}

/** 获取日主五行 */
function getDayWx(dayGan: string): string {
  return TIAN_GAN_WU_XING[dayGan] || '';
}

// ========== 1. 事业分析 ==========

export function analyzeCareer(
  result: BaziResult,
  qiangRuo: ReturnType<typeof analyzeQiangRuo>
): CareerAnalysis {
  const { fourPillars, geju, shishenCombinations, dayunDetails } = result;
  const dayGan = fourPillars.day.gan;
  const dayWx = getDayWx(dayGan);
  const allSS = getAllShiShen(dayGan, fourPillars);

  // 根据格局定方向
  const gejuName = geju?.name || '';
  let direction = '';
  let suitableIndustries: string[] = [];
  let careerCharacter = '';

  const careerByGeju: Record<string, { dir: string; industries: string[]; char: string }> = {
    '正官格': {
      dir: '宜公职仕途、行政管理、法律事务',
      industries: ['政府机关', '行政管理', '法律', '教育', '国企管理'],
      char: '为人正直有责任感，适合在体制内发展，有管理才能',
    },
    '七杀格': {
      dir: '宜军警武职、开创性事业、危机管理',
      industries: ['军警', '安全', '外科医学', '创业', '危机管理', '竞争性行业'],
      char: '性格刚毅有魄力，善于在压力下工作，有开创精神',
    },
    '正印格': {
      dir: '宜教育学术、文化出版、宗教慈善',
      industries: ['教育', '学术研究', '文化出版', '医疗', '慈善', '宗教'],
      char: '心地善良有耐心，适合传道授业，有学术天赋',
    },
    '偏印格': {
      dir: '宜技术研究、玄学命理、特殊才艺',
      industries: ['技术研发', 'IT', '玄学命理', '艺术设计', '心理咨询', '中医'],
      char: '思维独特有洞察力，适合非传统领域，有特殊才能',
    },
    '正财格': {
      dir: '宜金融财务、商业经营、实体经济',
      industries: ['金融', '财务', '商贸', '房地产', '制造业', '零售'],
      char: '踏实稳健善于理财，适合稳步经营，勤俭致富',
    },
    '偏财格': {
      dir: '宜投资贸易、娱乐传媒、外交公关',
      industries: ['投资', '贸易', '娱乐', '传媒', '公关', '旅游', '餐饮'],
      char: '慷慨大方善交际，适合灵活经营，有商业头脑',
    },
    '食神格': {
      dir: '宜文艺教育、餐饮美食、健康产业',
      industries: ['文艺创作', '教育', '餐饮', '健康养生', '旅游', '设计'],
      char: '温和有才华善表达，适合创意行业，有口福',
    },
    '伤官格': {
      dir: '宜技术创新、艺术表演、自由职业',
      industries: ['技术研发', '艺术设计', '表演', '写作', '律师', '自由职业'],
      char: '聪明伶俐有创造力，适合发挥才智，不喜束缚',
    },
    '比肩格': {
      dir: '宜合伙经营、竞争性行业、独立创业',
      industries: ['合伙创业', '体育', '销售', '中介', '自主经营'],
      char: '个性强有独立精神，适合竞争环境，善于合作',
    },
    '劫财格': {
      dir: '宜营销推广、竞争性商业、体育竞技',
      industries: ['营销', '推广', '体育', '证券', '期货', '竞争性行业'],
      char: '好胜心强有冲劲，适合竞争环境，需防破财',
    },
  };

  const careerInfo = careerByGeju[gejuName];
  if (careerInfo) {
    direction = careerInfo.dir;
    suitableIndustries = careerInfo.industries;
    careerCharacter = careerInfo.char;
  } else {
    // 根据五行定方向
    const careerByWx: Record<string, { dir: string; industries: string[]; char: string }> = {
      '木': { dir: '宜教育文化、医疗医药、农林环保', industries: ['教育', '文化', '医疗', '林业', '环保', '出版'], char: '仁慈正直有进取心' },
      '火': { dir: '宜传媒演艺、能源电力、餐饮服务', industries: ['传媒', '演艺', '能源', '电力', '餐饮', '广告'], char: '热情开朗有感染力' },
      '土': { dir: '宜房地产、建筑工程、农业金融', industries: ['房地产', '建筑', '农业', '金融', '矿业', '仓储'], char: '稳重踏实有包容心' },
      '金': { dir: '宜金融法律、机械制造、军警安保', industries: ['金融', '法律', '机械', '制造', '军警', '五金'], char: '刚毅果断有执行力' },
      '水': { dir: '宜商业贸易、物流运输、传媒旅游', industries: ['商业', '贸易', '物流', '旅游', '传媒', 'IT'], char: '聪明灵活善变通' },
    };
    const info = careerByWx[dayWx] || careerByWx['土'];
    direction = info.dir;
    suitableIndustries = info.industries;
    careerCharacter = info.char;
  }

  // 根据十神组合调整
  if (shishenCombinations) {
    for (const sc of shishenCombinations) {
      if (sc.combination === '杀印相生') {
        direction += '；有权威和管理才能，适合管理岗位';
        careerCharacter += '；能在压力中成长，大器晚成';
      }
      if (sc.combination === '食神制杀') {
        direction += '；有胆识有谋略，适合创业或管理';
      }
      if (sc.combination === '伤官配印') {
        direction += '；才华有约束，适合教育学术';
        suitableIndustries.push('教育', '学术');
      }
    }
  }

  // 事业发展时机（基于大运）
  let developmentTiming = '';
  let peakPeriod = '';
  if (dayunDetails && dayunDetails.length > 0) {
    const yongShen = qiangRuo.yongShen;
    const goodDayuns: string[] = [];
    for (const dy of dayunDetails) {
      const ganWx = TIAN_GAN_WU_XING[dy.gan];
      const zhiWx = DI_ZHI_WU_XING[dy.zhi];
      if (ganWx === yongShen || zhiWx === yongShen) {
        goodDayuns.push(`${dy.startAge}-${dy.endAge}岁（${dy.gan}${dy.zhi}运）`);
      }
    }
    if (goodDayuns.length > 0) {
      developmentTiming = `事业有利时期：${goodDayuns.slice(0, 3).join('、')}`;
      peakPeriod = goodDayuns[0];
    } else {
      developmentTiming = '需根据大运流年具体分析，注意把握时机';
      peakPeriod = '中年时期（35-50岁）为事业关键期';
    }
  } else {
    developmentTiming = '中年时期为事业关键发展期';
    peakPeriod = '35-50岁为事业高峰期';
  }

  return {
    direction,
    suitableIndustries,
    careerCharacter,
    developmentTiming,
    peakPeriod,
    advice: `${careerCharacter}。${direction}。${developmentTiming}。`,
    classicalRef: '《渊海子平》：格局定人生方向，用神定事业成败',
  };
}

// ========== 2. 财运分析 ==========

export function analyzeWealth(
  result: BaziResult,
  qiangRuo: ReturnType<typeof analyzeQiangRuo>
): WealthAnalysis {
  const { fourPillars, wuxingStrength, dayunDetails, geju } = result;
  const dayGan = fourPillars.day.gan;
  const dayWx = getDayWx(dayGan);
  const allSS = getAllShiShen(dayGan, fourPillars);

  // 财星五行（我克者）
  const ke: Record<string, string> = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' };
  const caiWx = ke[dayWx];

  const hasZhengCai = allSS.includes('正财');
  const hasPianCai = allSS.includes('偏财');
  const caiStrength = wuxingStrength?.strengths[caiWx] || 0;
  const caiPct = wuxingStrength ? Math.round(caiStrength / wuxingStrength.total * 100) : 0;

  // 财运类型
  let type = '';
  if (hasZhengCai && hasPianCai) type = '正偏财兼备';
  else if (hasZhengCai) type = '正财运为主';
  else if (hasPianCai) type = '偏财运为主';
  else type = '命中财星不显';

  // 财运等级
  let level = '';
  if (caiPct > 30) level = '财运旺盛';
  else if (caiPct > 15) level = '财运不错';
  else if (caiPct > 5) level = '财运平稳';
  else if (caiPct > 0) level = '财运偏弱';
  else level = '财运需培养';

  // 财运特征
  let characteristics = '';
  if (qiangRuo.level === '极强' || qiangRuo.level === '偏强') {
    characteristics = `日主${qiangRuo.level}，能担大财。${type}，财星力量占${caiPct}%。身旺财旺，一生财运亨通，善于把握商机。`;
  } else if (qiangRuo.level === '极弱' || qiangRuo.level === '偏弱') {
    characteristics = `日主${qiangRuo.level}，担财费力。${type}，财星力量占${caiPct}%。需大运流年生扶日主方能得财，不宜冒险投资。`;
  } else {
    characteristics = `日主中和，财运平稳。${type}，财星力量占${caiPct}%。量入为出，稳步积累，中年后财运渐佳。`;
  }

  // 财运高峰期
  let peakPeriod = '';
  if (dayunDetails && dayunDetails.length > 0) {
    const yongShen = qiangRuo.yongShen;
    const caiDayuns: string[] = [];
    for (const dy of dayunDetails) {
      const ganWx = TIAN_GAN_WU_XING[dy.gan];
      const zhiWx = DI_ZHI_WU_XING[dy.zhi];
      // 身强看财运（财星大运为佳），身弱看比劫印星运（生扶日主方能担财）
      if (qiangRuo.level === '极强' || qiangRuo.level === '偏强') {
        if (ganWx === caiWx || zhiWx === caiWx) {
          caiDayuns.push(`${dy.startAge}-${dy.endAge}岁（${dy.gan}${dy.zhi}运）`);
        }
      } else {
        if (ganWx === dayWx || zhiWx === dayWx || ganWx === yongShen || zhiWx === yongShen) {
          caiDayuns.push(`${dy.startAge}-${dy.endAge}岁（${dy.gan}${dy.zhi}运）`);
        }
      }
    }
    peakPeriod = caiDayuns.length > 0 ? caiDayuns.slice(0, 3).join('、') : '需把握流年财星出现之机';
  } else {
    peakPeriod = '中年后财运渐佳';
  }

  // 理财建议
  let investmentAdvice = '';
  if (qiangRuo.level === '极强' || qiangRuo.level === '偏强') {
    investmentAdvice = '身旺能担财，适合主动投资和创业经营。可适当配置高风险高回报资产，但仍需分散风险。';
  } else if (qiangRuo.level === '极弱' || qiangRuo.level === '偏弱') {
    investmentAdvice = '身弱不宜过度追求偏财，适合稳健理财。以固定收入为主，避免高风险投资，积蓄为上。';
  } else {
    investmentAdvice = '财运平稳，适合均衡配置。正财为主、偏财为辅，量入为出，适度投资。';
  }

  // 风险提示
  let riskWarning = '';
  if (allSS.includes('比肩') && allSS.includes('劫财') && (hasZhengCai || hasPianCai)) {
    riskWarning = '命中比劫夺财，需防因朋友合伙或借贷而破财。不宜与人合伙经营，注意财务独立。';
  } else if (allSS.includes('伤官') && (allSS.includes('正官') || allSS.includes('七杀'))) {
    riskWarning = '伤官见官，事业波折可能影响收入，需注意言行，避免因是非破财。';
  } else {
    riskWarning = '整体财务风险可控，注意量入为出，避免冲动消费。';
  }

  return {
    type,
    level,
    characteristics,
    peakPeriod,
    investmentAdvice,
    riskWarning,
    classicalRef: '《渊海子平》：身旺财旺，富贵双全；身弱财多，富屋贫人',
  };
}

// ========== 3. 感情婚姻分析 ==========

export function analyzeMarriage(result: BaziResult): MarriageAnalysis {
  const { fourPillars, gender, wuxingStrength } = result;
  const dayGan = fourPillars.day.gan;
  const dayZhi = fourPillars.day.zhi;
  const dayWx = getDayWx(dayGan);
  const allSS = getAllShiShen(dayGan, fourPillars);

  // 配偶宫（日支）分析
  const cangGan = DI_ZHI_CANG_GAN[dayZhi] || [];
  const shishenMap = SHI_SHEN[dayGan] || {};
  const zhiSS = cangGan.map(cg => shishenMap[cg] || '').filter(Boolean);

  // 男命以财星为妻，女命以官杀为夫
  const isMale = gender === 'male';
  const spouseStar = isMale ? ['正财', '偏财'] : ['正官', '七杀'];
  const hasSpouseStar = spouseStar.some(s => allSS.includes(s));

  // 配偶特征
  let spouseCharacter = '';
  const zhiBenQiSS = zhiSS[0] || '';
  const spouseBySS: Record<string, string> = {
    '正官': '配偶端正有责任感，为人正直，重视家庭。婚姻稳定，但可能略显保守。',
    '七杀': '配偶个性强势有魄力，有主见。婚姻有激情但可能多波折，需互相尊重。',
    '正财': '配偶勤俭持家，温柔贤惠。婚姻美满，经济稳定。',
    '偏财': '配偶慷慨大方，善于交际。异性缘佳，需注意沟通信任。',
    '正印': '配偶温柔体贴，有包容心。重视精神交流，婚姻和谐。',
    '偏印': '配偶思维独特，有特殊才能。可能略显内向，需多沟通。',
    '食神': '配偶性格温和，有口福才艺。生活有情趣，婚姻幸福。',
    '伤官': '配偶才华横溢，个性鲜明。需互相包容，避免口角。',
    '比肩': '配偶个性独立，如朋友般相处。平等互助，但需注意界限。',
    '劫财': '配偶好胜心强，有冲劲。需注意财务管理，避免争执。',
  };
  spouseCharacter = spouseBySS[zhiBenQiSS] || '配偶特征需结合大运流年综合分析。';

  // 婚姻前景
  let marriageProspect = '';
  if (hasSpouseStar) {
    if (isMale) {
      marriageProspect = '命中财星显透，妻缘较好。' + (allSS.includes('正财') ? '以正财为正妻，婚姻端正。' : '偏财为妻，感情丰富但需专一。');
    } else {
      marriageProspect = '命中官星显透，夫缘较好。' + (allSS.includes('正官') ? '以正官为正夫，婚姻端正。' : '七杀为夫，婚姻有波折但深刻。');
    }
  } else {
    marriageProspect = isMale ? '命中财星不显，婚姻需主动争取，可能晚婚为佳。' : '命中官星不显，姻缘需等待时机，不宜早婚。';
  }

  // 桃花运势
  let romanticLuck = '';
  const zhis = [fourPillars.year.zhi, fourPillars.month.zhi, fourPillars.day.zhi, fourPillars.hour.zhi].filter(Boolean);
  const taohuaMap: Record<string, string[]> = {
    '寅': ['卯'], '午': ['卯'], '戌': ['卯'],
    '亥': ['子'], '卯': ['子'], '未': ['子'],
    '申': ['酉'], '子': ['酉'], '辰': ['酉'],
    '巳': ['午'], '酉': ['午'], '丑': ['午'],
  };
  const yearZhi = fourPillars.year?.zhi || '';
  const taohuaZhi = taohuaMap[yearZhi]?.[0] || '';
  const hasTaohua = taohuaZhi && zhis.includes(taohuaZhi);

  if (hasTaohua) {
    romanticLuck = `命带桃花（${taohuaZhi}），异性缘佳，感情生活丰富。${isMale ? '需注意专一，避免烂桃花影响婚姻。' : '需注意感情选择，避免因桃花影响名誉。'}`;
  } else {
    romanticLuck = '桃花不显，感情较为内敛，需主动社交增加异性缘。';
  }

  // 有利婚恋年龄
  let favorableAge = '';
  if (isMale) {
    favorableAge = '男命以财星为妻，25-35岁为最佳婚恋期。若命中财星早透，可早婚；若财星晚现，宜晚婚。';
  } else {
    favorableAge = '女命以官星为夫，23-30岁为最佳婚恋期。若命中官星早透，可早婚；若官杀混杂，宜晚婚化解。';
  }

  // 感情建议
  let advice = '';
  if (allSS.includes('伤官') && (allSS.includes('正官') || allSS.includes('七杀'))) {
    advice = '伤官见官，感情易有波折。建议培养包容心，避免过于挑剔。选择能欣赏自己才华的伴侣。';
  } else if (allSS.includes('比肩') && allSS.includes('劫财')) {
    advice = '比劫过旺，感情中可能面临竞争。建议主动维护感情，增强沟通信任。';
  } else if (!hasSpouseStar) {
    advice = '配偶星不显，建议多参加社交活动，把握大运流年配偶星出现之机。晚婚反而更稳定。';
  } else {
    advice = '感情运势较好，建议真诚相待，互相尊重包容，婚姻自然美满。';
  }

  return {
    spouseCharacter,
    marriageProspect,
    romanticLuck,
    favorableAge,
    advice,
    classicalRef: '《渊海子平》：男以财为妻，女以官为夫；日支为配偶宫，藏干定配偶性情',
  };
}

// ========== 4. 健康分析 ==========

export function analyzeHealth(
  result: BaziResult,
  qiangRuo: ReturnType<typeof analyzeQiangRuo>
): HealthAnalysis {
  const { fourPillars, wuxingStrength } = result;
  const dayGan = fourPillars.day.gan;
  const dayWx = getDayWx(dayGan);

  // 五行对应脏腑
  const wxOrgans: Record<string, { organs: string; strong: string; weak: string }> = {
    '木': { organs: '肝胆、筋骨、眼睛、神经系统', strong: '肝气偏旺，易怒头痛，需疏肝理气', weak: '肝血不足，视力下降，筋骨酸痛' },
    '火': { organs: '心脏、血液循环、血压、小肠', strong: '心火旺盛，血压偏高，失眠多梦', weak: '心血不足，心悸气短，面色苍白' },
    '土': { organs: '脾胃、消化系统、肌肉、口腔', strong: '脾胃湿热，消化不良，口腔溃疡', weak: '脾胃虚寒，食欲不振，四肢乏力' },
    '金': { organs: '肺部、呼吸系统、皮肤、大肠', strong: '肺气壅塞，咳嗽痰多，皮肤油腻', weak: '肺气不足，易感冒，皮肤干燥' },
    '水': { organs: '肾脏、泌尿系统、耳朵、骨骼', strong: '肾水偏旺，畏寒浮肿，尿频', weak: '肾气不足，腰膝酸软，耳鸣脱发' },
  };

  // 体质特征
  let constitution = '';
  const dayOrgan = wxOrgans[dayWx];
  if (dayOrgan) {
    constitution = `日主${dayGan}（${dayWx}），体质以${dayOrgan.organs}为主。`;
    if (qiangRuo.level === '极强' || qiangRuo.level === '偏强') {
      constitution += dayOrgan.strong + '。';
    } else if (qiangRuo.level === '极弱' || qiangRuo.level === '偏弱') {
      constitution += dayOrgan.weak + '。';
    } else {
      constitution += '五行较为平衡，体质良好。';
    }
  }

  // 易患部位（最旺和最弱的五行对应的脏腑）
  const weakOrgans: string[] = [];
  if (wuxingStrength) {
    // 最弱的五行对应的脏腑易患
    const weakestWx = wuxingStrength.weakest;
    if (wxOrgans[weakestWx]) {
      weakOrgans.push(...wxOrgans[weakestWx].organs.split('、'));
    }
    // 最旺的五行过旺也会导致对应脏腑问题
    const dominantWx = wuxingStrength.dominant;
    if (dominantWx !== dayWx && wxOrgans[dominantWx]) {
      weakOrgans.push(...wxOrgans[dominantWx].organs.split('、').slice(0, 2));
    }
    // 缺失的五行
    if (wuxingStrength.missing.length > 0) {
      for (const mwx of wuxingStrength.missing) {
        if (wxOrgans[mwx]) {
          weakOrgans.push(...wxOrgans[mwx].organs.split('、').slice(0, 2));
        }
      }
    }
  }

  // 健康风险
  let healthRisks = '';
  if (wuxingStrength) {
    const missing = wuxingStrength.missing;
    if (missing.length > 0) {
      healthRisks = `五行缺${missing.join('、')}，对应脏腑功能偏弱，需重点保养。`;
    }
    const dominant = wuxingStrength.dominant;
    const dominantPct = Math.round((wuxingStrength.strengths[dominant] || 0) / wuxingStrength.total * 100);
    if (dominantPct > 40) {
      healthRisks += `${dominant}行过旺（占${dominantPct}%），${wxOrgans[dominant]?.strong || '对应脏腑负担重'}。`;
    }
  }
  if (!healthRisks) healthRisks = '五行较为平衡，健康风险较低，注意日常保养即可。';

  // 养生建议
  let maintenanceAdvice = '';
  const seasonAdvice: Record<string, string> = {
    '木': '春季为重点养生期，保持心情舒畅，少生气，早睡早起',
    '火': '夏季注意防暑降温，避免过度操劳，保持充足睡眠',
    '土': '四季均需注意脾胃保养，饮食规律，避免暴饮暴食',
    '金': '秋季注意润肺防燥，多做有氧运动，注意保暖',
    '水': '冬季注意保暖防寒，适当进补，避免过度劳累',
  };
  maintenanceAdvice = seasonAdvice[dayWx] || '注意四季调养，保持规律作息。';

  // 饮食建议
  let dietaryAdvice = '';
  const dietByWx: Record<string, string> = {
    '木': '宜食绿色食物、酸味食物，如绿叶蔬菜、柠檬、醋。少食油腻。',
    '火': '宜食红色食物、苦味食物，如红枣、苦瓜、莲子心。少食辛辣。',
    '土': '宜食黄色食物、甘味食物，如小米、南瓜、山药。忌生冷。',
    '金': '宜食白色食物、辛味食物，如白萝卜、百合、银耳。少食寒凉。',
    '水': '宜食黑色食物、咸味食物，如黑豆、海带、紫菜。少食过咸。',
  };
  dietaryAdvice = dietByWx[dayWx] || '饮食宜均衡，不偏食。';

  if (wuxingStrength && wuxingStrength.missing.length > 0) {
    const missingDiet = wuxingStrength.missing.map(mwx => dietByWx[mwx] || '').filter(Boolean);
    if (missingDiet.length > 0) {
      dietaryAdvice += ` 五行缺${wuxingStrength.missing.join('、')}，建议多食对应五行食物：${missingDiet.join('；')}`;
    }
  }

  return {
    constitution,
    weakOrgans: Array.from(new Set(weakOrgans)),
    healthRisks,
    maintenanceAdvice,
    dietaryAdvice,
    classicalRef: '《黄帝内经》：五行对应五脏，偏盛偏衰皆可为病',
  };
}

// ========== 5. 学业分析 ==========

export function analyzeEducation(result: BaziResult): EducationAnalysis {
  const { fourPillars } = result;
  const dayGan = fourPillars.day.gan;
  const dayWx = getDayWx(dayGan);
  const allSS = getAllShiShen(dayGan, fourPillars);

  // 学习风格
  let learningStyle = '';
  if (allSS.includes('正印')) {
    learningStyle = '正印显透，学习风格扎实系统，善于循序渐进。适合传统学术研究，记忆力好，理解力强。';
  } else if (allSS.includes('偏印')) {
    learningStyle = '偏印显透，学习风格独特跳跃，善于触类旁通。适合非传统领域，思维敏锐，但需注意专注力。';
  } else if (allSS.includes('食神')) {
    learningStyle = '食神显透，学习风格感性直观，善于通过实践学习。适合应用型学科，有创造力。';
  } else if (allSS.includes('伤官')) {
    learningStyle = '伤官显透，学习风格灵活创新，善于举一反三。适合创造性学科，才思敏捷，但不喜死记硬背。';
  } else {
    learningStyle = '印星不显，学习需靠后天努力。建议培养良好学习习惯，坚持不懈。';
  }

  // 学业潜力
  let academicPotential = '';
  const hasYin = allSS.includes('正印') || allSS.includes('偏印');
  const hasShiShang = allSS.includes('食神') || allSS.includes('伤官');
  if (hasYin && hasShiShang) {
    academicPotential = '印星与食伤并见，学业潜力极佳。既有扎实基础又有创新能力，适合高学历发展。';
  } else if (hasYin) {
    academicPotential = '印星有力，学业潜力较好。善于系统学习，适合深造和研究。';
  } else if (hasShiShang) {
    academicPotential = '食伤有力，学业潜力不错。善于创新思考，适合应用型和创造性学科。';
  } else {
    academicPotential = '印星食伤均不显，学业需靠勤奋。建议找到适合自己的学习方法，坚持不懈。';
  }

  // 有利学科
  let favorableSubjects: string[] = [];
  const subjectsByWx: Record<string, string[]> = {
    '木': ['文学', '历史', '哲学', '中医', '林业', '教育'],
    '火': ['艺术', '传媒', '电子工程', '能源', '心理学', '表演'],
    '土': ['建筑', '地理', '农业', '经济', '考古', '地质'],
    '金': ['法律', '金融', '机械工程', '计算机', '物理', '数学'],
    '水': ['商业管理', '外语', '物流', '传媒', '化学', '生物'],
  };
  favorableSubjects = subjectsByWx[dayWx] || subjectsByWx['土'];

  if (allSS.includes('正印')) {
    favorableSubjects.push('学术研究', '教育学');
  }
  if (allSS.includes('偏印')) {
    favorableSubjects.push('IT技术', '玄学研究');
  }
  if (allSS.includes('伤官')) {
    favorableSubjects.push('艺术设计', '创意写作');
  }

  // 考试运势
  let examLuck = '';
  if (allSS.includes('正官') && hasYin) {
    examLuck = '官印相生，考试运势极佳。逢考必过，适合参加公务员、资格证等考试。';
  } else if (hasYin) {
    examLuck = '印星有力，考试运势不错。善于备考，发挥稳定。';
  } else if (allSS.includes('伤官')) {
    examLuck = '伤官显透，考试发挥不稳定。才思敏捷但易粗心，需注意审题和检查。';
  } else {
    examLuck = '考试运势平稳，需充分准备。建议制定合理复习计划，稳步推进。';
  }

  // 建议
  let advice = '';
  if (hasYin) {
    advice = '发挥印星优势，深入学习专业知识。同时注意培养实践能力，理论与实践并重。';
  } else if (hasShiShang) {
    advice = '发挥食伤优势，多参与创新实践活动。同时注意打好基础，避免眼高手低。';
  } else {
    advice = '命中学业星不显，需靠后天勤奋弥补。建议制定明确学习目标，找到适合自己的方法，坚持不懈必有收获。';
  }

  return {
    learningStyle,
    academicPotential,
    favorableSubjects,
    examLuck,
    advice,
    classicalRef: '《渊海子平》：印星主文，食伤主智；文昌入命，学业有成',
  };
}

// ========== 6. 六亲关系分析 ==========

export function analyzeFamilyRelations(result: BaziResult): FamilyRelationAnalysis {
  const { fourPillars, gender } = result;
  const dayGan = fourPillars.day.gan;
  const shishenMap = SHI_SHEN[dayGan] || {};
  const allSS = getAllShiShen(dayGan, fourPillars);

  // 十神对应六亲
  // 男命：偏财=父亲，正印=母亲，比肩=兄弟，劫财=姐妹，正财=妻子，偏财=情人，正官=女儿，七杀=儿子
  // 女命：偏财=父亲，正印=母亲，比肩=姐妹，劫财=兄弟，正官=丈夫，七杀=情人，食神=女儿，伤官=儿子
  const isMale = gender === 'male';

  const relations: FamilyRelationAnalysis['relations'] = [];

  // 父母
  const hasFather = allSS.includes('偏财') || allSS.includes('正财');
  const hasMother = allSS.includes('正印') || allSS.includes('偏印');
  let parentAnalysis = '';
  if (hasFather && hasMother) {
    parentAnalysis = '父母双全，偏财为父、正印为母均显透。';
    if (allSS.includes('偏财') && allSS.includes('正印')) {
      parentAnalysis += '财印并见，父母关系可能有些摩擦，但整体和睦。';
    }
  } else if (hasMother && !hasFather) {
    parentAnalysis = '印星显透而财星不显，与母亲关系更亲近，父亲缘分可能较薄。';
  } else if (hasFather && !hasMother) {
    parentAnalysis = '财星显透而印星不显，与父亲关系更亲近，母亲缘分可能较薄。';
  } else {
    parentAnalysis = '财印均不显，与父母缘分需看大运流年。建议珍惜亲情，多关心父母。';
  }

  relations.push({
    relation: '父母',
    star: `偏财（父）、正印（母）`,
    analysis: parentAnalysis,
    advice: '孝敬父母是立身之本。无论命局如何，多关心父母健康，常回家看看。',
  });

  // 兄弟姐妹
  const hasBi = allSS.includes('比肩') || allSS.includes('劫财');
  let siblingAnalysis = '';
  if (hasBi) {
    const biCount = allSS.filter(s => s === '比肩' || s === '劫财').length;
    if (biCount >= 3) {
      siblingAnalysis = `比劫较多（${biCount}个），兄弟姐妹多，互相帮助。但也可能因家产分配产生矛盾。`;
    } else {
      siblingAnalysis = '比肩劫财显透，有兄弟姐妹缘。关系较为融洽，可互相扶持。';
    }
  } else {
    siblingAnalysis = '比劫不显，兄弟姐妹缘薄，或为独生子女。';
  }

  relations.push({
    relation: '兄弟姐妹',
    star: '比肩、劫财',
    analysis: siblingAnalysis,
    advice: '兄弟姐妹是血脉至亲，应互相帮助，不计较小事。',
  });

  // 配偶
  const spouseStar = isMale ? '正财/偏财' : '正官/七杀';
  const hasSpouse = isMale
    ? (allSS.includes('正财') || allSS.includes('偏财'))
    : (allSS.includes('正官') || allSS.includes('七杀'));
  let spouseAnalysis = '';
  if (hasSpouse) {
    if (isMale) {
      if (allSS.includes('正财') && allSS.includes('偏财')) {
        spouseAnalysis = '正偏财并见，异性缘佳但需注意感情专一。正财为正妻，偏财为偏房或红颜知己。';
      } else if (allSS.includes('正财')) {
        spouseAnalysis = '正财显透，妻缘端正，婚姻稳定。妻子贤惠持家。';
      } else {
        spouseAnalysis = '偏财显透，异性缘佳但感情可能多波折。需注意专一。';
      }
    } else {
      if (allSS.includes('正官') && allSS.includes('七杀')) {
        spouseAnalysis = '官杀混杂，感情选择较多但易陷入纠葛。需明辨正缘，宜晚婚。';
      } else if (allSS.includes('正官')) {
        spouseAnalysis = '正官显透，夫缘端正，婚姻稳定。丈夫正直有责任。';
      } else {
        spouseAnalysis = '七杀显透，夫缘有波折但深刻。丈夫个性强势。';
      }
    }
  } else {
    spouseAnalysis = isMale ? '财星不显，妻缘需等待时机。' : '官星不显，夫缘需等待时机。';
  }

  relations.push({
    relation: '配偶',
    star: spouseStar,
    analysis: spouseAnalysis,
    advice: '婚姻需要经营，互相尊重包容是长久之道。',
  });

  // 子女
  const childStar = isMale ? '正官/七杀' : '食神/伤官';
  const hasChild = isMale
    ? (allSS.includes('正官') || allSS.includes('七杀'))
    : (allSS.includes('食神') || allSS.includes('伤官'));
  let childAnalysis = '';
  if (hasChild) {
    if (isMale) {
      if (allSS.includes('七杀')) {
        childAnalysis = '七杀显透，有儿子缘。子女个性强，需严教但有出息。';
      }
      if (allSS.includes('正官')) {
        childAnalysis += '正官显透，有女儿缘。子女孝顺有礼。';
      }
    } else {
      if (allSS.includes('食神')) {
        childAnalysis = '食神显透，有女儿缘。子女温和有福气。';
      }
      if (allSS.includes('伤官')) {
        childAnalysis += '伤官显透，有儿子缘。子女聪明但需耐心引导。';
      }
    }
  } else {
    childAnalysis = '子女星不显，子女缘需看大运流年。';
  }

  relations.push({
    relation: '子女',
    star: childStar,
    analysis: childAnalysis,
    advice: '子女教育重在身教。给予足够关爱，同时培养其独立品格。',
  });

  return {
    relations,
    summary: '六亲关系以十神为标，以宫位为本。十神显透则缘分深厚，不显则缘分较薄。然大运流年可补命局之不足，后天经营亦很重要。',
  };
}

// ========== 7. 开运建议 ==========

export function analyzeLuck(result: BaziResult, qiangRuo: ReturnType<typeof analyzeQiangRuo>): LuckEnhancement {
  const { fourPillars } = result;
  const dayGan = fourPillars.day.gan;
  const dayWx = getDayWx(dayGan);
  const yongShen = qiangRuo.yongShen;

  // 用神对应的五行属性
  const wxColors: Record<string, string[]> = {
    '金': ['白色', '银色', '金色'],
    '木': ['绿色', '青色'],
    '水': ['黑色', '深蓝色'],
    '火': ['红色', '紫色', '橙色'],
    '土': ['黄色', '棕色', '米色'],
  };

  const wxDirections: Record<string, string[]> = {
    '金': ['西方', '西北方'],
    '木': ['东方', '东南方'],
    '水': ['北方'],
    '火': ['南方'],
    '土': ['中央', '西南方', '东北方'],
  };

  const wxNumbers: Record<string, string[]> = {
    '金': ['4', '9'],
    '木': ['1', '6'],
    '水': ['1', '6'],
    '火': ['2', '7'],
    '土': ['5', '0'],
  };

  const wxIndustries: Record<string, string[]> = {
    '金': ['金融', '法律', '机械', '五金', '珠宝', '汽车'],
    '木': ['教育', '文化', '医疗', '林业', '出版', '家具'],
    '水': ['贸易', '物流', '旅游', '传媒', '饮品', '航运'],
    '火': ['传媒', '演艺', '能源', '电力', '餐饮', '广告'],
    '土': ['房地产', '建筑', '农业', '矿业', '陶瓷', '仓储'],
  };

  const wxItems: Record<string, string[]> = {
    '金': ['金属饰品', '白水晶', '金银手镯'],
    '木': ['木质饰品', '翡翠', '绿幽灵水晶', '植物'],
    '水': ['黑曜石', '蓝水晶', '鱼缸', '流水摆件'],
    '火': ['红玛瑙', '紫水晶', '红色饰品', '灯光装饰'],
    '土': ['黄水晶', '陶器', '玉石', '石质摆件'],
  };

  // 以用神为主，日主为辅
  const primaryWx = yongShen || dayWx;
  const secondaryWx = dayWx;

  return {
    luckyColors: [...(wxColors[primaryWx] || []), ...(wxColors[secondaryWx] || [])].slice(0, 5),
    luckyDirections: wxDirections[primaryWx] || ['中央'],
    luckyNumbers: wxNumbers[primaryWx] || ['5'],
    luckyIndustries: wxIndustries[primaryWx] || [],
    luckyItems: wxItems[primaryWx] || [],
    fengShuiAdvice: `有利方位为${(wxDirections[primaryWx] || []).join('、')}。居住和办公宜选择此方位。卧室床头朝此方位有助运势。可摆放${(wxItems[primaryWx] || []).slice(0, 2).join('、')}等开运物品。`,
    dailyAdvice: `日常多穿戴${(wxColors[primaryWx] || []).join('、')}色系衣物，使用含${(wxNumbers[primaryWx] || []).join('、')}的数字。多接触${primaryWx}行相关的事物和环境，有助于提升运势。`,
  };
}

// ========== 8. 性格深度分析 ==========

export function analyzePersonality(result: BaziResult): PersonalityAnalysis {
  const { fourPillars, wuxingStrength } = result;
  const dayGan = fourPillars.day.gan;
  const dayWx = getDayWx(dayGan);
  const allSS = getAllShiShen(dayGan, fourPillars);

  // 日主基础性格
  const dayMaster = DAY_GAN_PERSONALITY[dayGan];
  let core = dayMaster?.personality || '性格需综合四柱分析。';

  // 结合四柱调整
  const yearGan = fourPillars.year.gan;
  const monthGan = fourPillars.month.gan;
  const hourGan = fourPillars.hour?.gan;

  // 月柱对性格影响最大（月令决定格局）
  if (monthGan) {
    const monthSS = SHI_SHEN[dayGan]?.[monthGan] || '';
    const monthInfluence: Record<string, string> = {
      '正官': '月柱正官，性格中增添正直守规矩的特质，有责任感。',
      '七杀': '月柱七杀，性格中增添刚毅果断的特质，有魄力。',
      '正印': '月柱正印，性格中增添温和善良的特质，有耐心。',
      '偏印': '月柱偏印，性格中增添思维独特的特质，有洞察力。',
      '正财': '月柱正财，性格中增添踏实勤俭的特质，重实际。',
      '偏财': '月柱偏财，性格中增添慷慨大方的特质，善交际。',
      '食神': '月柱食神，性格中增添温和有才华的特质，有口福。',
      '伤官': '月柱伤官，性格中增添聪明才智的特质，有创造力。',
      '比肩': '月柱比肩，性格中增添独立自主的特质，有主见。',
      '劫财': '月柱劫财，性格中增添好胜竞争的特质，有冲劲。',
    };
    if (monthInfluence[monthSS]) {
      core += ' ' + monthInfluence[monthSS];
    }
  }

  // 优势
  const strengths: string[] = [];
  if (dayMaster?.strength) {
    strengths.push(...dayMaster.strength.split('、'));
  }
  if (allSS.includes('正官')) strengths.push('有责任感');
  if (allSS.includes('正印')) strengths.push('有耐心');
  if (allSS.includes('食神')) strengths.push('有才华');
  if (allSS.includes('偏财')) strengths.push('善交际');

  // 弱势
  const weaknesses: string[] = [];
  if (dayMaster?.weakness) {
    weaknesses.push(...dayMaster.weakness.split('、'));
  }
  if (allSS.includes('七杀')) weaknesses.push('易急躁');
  if (allSS.includes('伤官')) weaknesses.push('易傲慢');
  if (allSS.includes('劫财')) weaknesses.push('易冲动');
  if (allSS.includes('偏印')) weaknesses.push('易多疑');

  // 社交风格
  let socialStyle = '';
  if (allSS.includes('偏财') && allSS.includes('食神')) {
    socialStyle = '社交能力强，善于交际应酬，人缘极佳。在社交场合如鱼得水。';
  } else if (allSS.includes('正官') && allSS.includes('正印')) {
    socialStyle = '社交风格端庄得体，重礼仪，在正式场合表现佳。朋友圈以正经人士为主。';
  } else if (allSS.includes('比肩') || allSS.includes('劫财')) {
    socialStyle = '社交风格直爽，喜欢与朋友交往。重义气，但需注意交友选择。';
  } else if (allSS.includes('偏印')) {
    socialStyle = '社交风格内敛，不喜大型聚会，偏好小圈子深交。朋友不多但知心。';
  } else {
    socialStyle = '社交风格温和，不强求社交但也乐于与人相处。朋友关系较为稳定。';
  }

  // 情感模式
  let emotionalStyle = '';
  if (allSS.includes('正印')) {
    emotionalStyle = '情感丰富但内敛，善于照顾他人感受。容易被感动，也容易心软。';
  } else if (allSS.includes('伤官')) {
    emotionalStyle = '情感表达直接热烈，喜怒形于色。感受力强，但也容易情绪化。';
  } else if (allSS.includes('七杀')) {
    emotionalStyle = '情感强烈但控制力强，不轻易表露。一旦爆发则来势汹汹。';
  } else if (allSS.includes('正财')) {
    emotionalStyle = '情感踏实稳定，不追求轰轰烈烈。重在细水长流，忠贞不渝。';
  } else {
    emotionalStyle = '情感表现因环境而异，时内时外。内心有丰富情感但不轻易展露。';
  }

  // 思维模式
  let thinkingStyle = '';
  if (allSS.includes('正印')) {
    thinkingStyle = '思维缜密系统，善于归纳总结。学习能力强，逻辑清晰。';
  } else if (allSS.includes('偏印')) {
    thinkingStyle = '思维跳跃发散，善于触类旁通。直觉敏锐，有创造力。';
  } else if (allSS.includes('食神')) {
    thinkingStyle = '思维灵活感性，善于从实践中学习。有想象力，不过分追求逻辑。';
  } else if (allSS.includes('伤官')) {
    thinkingStyle = '思维敏捷创新，善于打破常规。反应快，有独到见解。';
  } else if (allSS.includes('正官')) {
    thinkingStyle = '思维严谨守规矩，善于按部就班。重视规则和秩序。';
  } else {
    thinkingStyle = '思维模式较为均衡，灵活与严谨兼备。';
  }

  // 成长建议
  let growthAdvice = '';
  if (weaknesses.includes('过于固执')) {
    growthAdvice = '学会灵活变通，多听取不同意见。适当放松控制欲，给别人更多空间。';
  } else if (weaknesses.includes('优柔寡断')) {
    growthAdvice = '增强决断力，不要过度分析。学会在不确定中做出决定，在实践中调整。';
  } else if (weaknesses.includes('急躁冲动')) {
    growthAdvice = '培养耐心和定力，三思而后行。学会在行动前冷静思考。';
  } else if (weaknesses.includes('过于敏感')) {
    growthAdvice = '增强心理韧性，不要过分在意他人评价。学会区分事实与感受。';
  } else {
    growthAdvice = '发挥自身优势，同时注意改善薄弱环节。保持自我觉察，持续成长。';
  }

  return {
    core,
    strengths: Array.from(new Set(strengths)).slice(0, 6),
    weaknesses: Array.from(new Set(weaknesses)).slice(0, 5),
    socialStyle,
    emotionalStyle,
    thinkingStyle,
    growthAdvice,
  };
}

// ========== 9. 一生运势综述 ==========

export function analyzeLifeOverview(
  result: BaziResult,
  qiangRuo: ReturnType<typeof analyzeQiangRuo>
): LifeOverview {
  const { fourPillars, geju, dayunDetails } = result;
  const dayGan = fourPillars.day.gan;
  const dayWx = getDayWx(dayGan);
  const gejuName = geju?.name || '杂格';

  // 总体概述
  let summary = `${dayGan}日主（${dayWx}），${qiangRuo.level}，${gejuName}。\n`;
  summary += `性格${qiangRuo.level === '极强' || qiangRuo.level === '偏强' ? '刚强有主见' : qiangRuo.level === '极弱' || qiangRuo.level === '偏弱' ? '温和内敛' : '平和均衡'}，`;
  summary += `用神为${qiangRuo.yongShen}，忌神为${qiangRuo.jiShen}。\n`;
  summary += `一生运势起伏与格局成败、大运喜忌密切相关。`;

  // 人生各阶段
  const stages: { period: string; description: string }[] = [];

  // 少年期（0-15岁）：年柱
  stages.push({
    period: '少年期（0-15岁）',
    description: `年柱${fourPillars.year.gan}${fourPillars.year.zhi}主导，代表祖辈宫。${qiangRuo.details.find(d => d.includes('得令') || d.includes('失令')) || '月令决定基础强弱'}。早年环境受祖辈和父母影响较大。`,
  });

  // 青年期（16-30岁）：月柱
  stages.push({
    period: '青年期（16-30岁）',
    description: `月柱${fourPillars.month.gan}${fourPillars.month.zhi}主导，代表父母宫。此阶段格局逐渐显现，学业和初入社会是重点。${gejuName}决定发展方向。`,
  });

  // 中年期（31-50岁）：日柱
  if (dayunDetails && dayunDetails.length > 0) {
    const midDayuns = dayunDetails.filter(d => d.startAge >= 25 && d.startAge <= 55);
    const yongShen = qiangRuo.yongShen;
    const goodMid = midDayuns.filter(d => {
      const ganWx = TIAN_GAN_WU_XING[d.gan];
      const zhiWx = DI_ZHI_WU_XING[d.zhi];
      return ganWx === yongShen || zhiWx === yongShen;
    });
    stages.push({
      period: '中年期（31-50岁）',
      description: `日柱${fourPillars.day.gan}${fourPillars.day.zhi}主导，代表配偶宫。此阶段事业和家庭并重。${goodMid.length > 0 ? `大运有利，${goodMid[0].startAge}-${goodMid[0].endAge}岁（${goodMid[0].gan}${goodMid[0].zhi}运）为事业黄金期。` : '需把握流年机遇，稳扎稳打。'}`,
    });
  } else {
    stages.push({
      period: '中年期（31-50岁）',
      description: '日柱主导，事业和家庭的关键发展期。格局成败在此阶段见分晓。',
    });
  }

  // 晚年期（51岁后）：时柱
  if (fourPillars.hour?.gan) {
    stages.push({
      period: '晚年期（51岁后）',
      description: `时柱${fourPillars.hour.gan}${fourPillars.hour.zhi}主导，代表子女宫。晚年运势看时柱和大运配合。${allSSIncludes(fourPillars, dayGan, '正官') ? '子女有出息，晚年享福。' : '需注意积蓄和健康。'}`,
    });
  } else {
    stages.push({
      period: '晚年期（51岁后）',
      description: '时柱缺失（三柱论命），晚年运势需看大运流年配合。建议注意积蓄和健康。',
    });
  }

  // 关键建议
  let keyAdvice = '';
  if (qiangRuo.level === '极强' || qiangRuo.level === '偏强') {
    keyAdvice = '身旺宜克泄耗，选择官杀、食伤、财星相关行业发展。大运走财运官运为佳。注意不可过于刚强，学会柔韧。';
  } else if (qiangRuo.level === '极弱' || qiangRuo.level === '偏弱') {
    keyAdvice = '身弱宜生扶，选择印星、比劫相关行业发展。大运走印运比劫运为佳。注意保重身体，不可过度操劳。';
  } else {
    keyAdvice = '日主中和，运势平稳。根据大运流年变化灵活调整。关键是把握机遇，顺势而为。';
  }

  return {
    summary,
    stages,
    keyAdvice,
    classicalRef: '《滴天髓》：人道顺逆，天之道也；运之否泰，人之道也',
  };
}

// 辅助函数
function allSSIncludes(fourPillars: any, dayGan: string, target: string): boolean {
  const shishenMap = SHI_SHEN[dayGan];
  if (!shishenMap) return false;
  const allGans = [fourPillars.year?.gan, fourPillars.month?.gan, fourPillars.hour?.gan].filter(Boolean);
  return allGans.some(g => shishenMap[g] === target);
}

// ========== 10. 大运详细解读 ==========

export function interpretDayun(
  result: BaziResult,
  qiangRuo: ReturnType<typeof analyzeQiangRuo>
): { dayunIndex: number; analysis: string }[] {
  const { dayunDetails, fourPillars } = result;
  const dayGan = fourPillars.day.gan;
  const dayWx = getDayWx(dayGan);
  const yongShen = qiangRuo.yongShen;
  const jiShen = qiangRuo.jiShen;

  if (!dayunDetails || dayunDetails.length === 0) return [];

  return dayunDetails.map((dy, idx) => {
    const ganWx = TIAN_GAN_WU_XING[dy.gan];
    const zhiWx = DI_ZHI_WU_XING[dy.zhi];
    const ganSS = dy.shishen.gan;
    const zhiSS = dy.shishen.zhi.join('、');

    // 判断吉凶
    const isYong = ganWx === yongShen || zhiWx === yongShen;
    const isJi = ganWx === jiShen || zhiWx === jiShen;

    let analysis = `第${idx + 1}步大运 ${dy.gan}${dy.zhi}（${dy.startAge}-${dy.endAge}岁，${dy.startYear}-${dy.endYear}年）。\n`;

    // 天干地支十神
    analysis += `天干${dy.gan}（${ganWx}，${ganSS}），地支${dy.zhi}（${zhiWx}，${zhiSS}）。\n`;

    // 吉凶判断
    if (isYong && !isJi) {
      analysis += `此运为用神运，${qiangRuo.level === '极强' || qiangRuo.level === '偏强' ? '身旺喜克泄耗' : '身弱喜生扶'}，${yongShen}为用神到位，运势顺利。`;
    } else if (isJi && !isYong) {
      analysis += `此运为忌神运，${jiShen}为忌神当令，需谨慎行事，防破财、是非、健康问题。`;
    } else if (isYong && isJi) {
      analysis += `此运用忌参半，天干地支吉凶不一。前五年以天干为主，后五年以地支为主，需分段分析。`;
    } else {
      analysis += `此运平平，非用非忌。运势平稳，宜守不宜攻，积蓄力量等待时机。`;
    }

    // 神煞
    if (dy.shensha && dy.shensha.length > 0) {
      analysis += ` 大运带${dy.shensha.join('、')}。`;
      if (dy.shensha.includes('天乙贵人')) {
        analysis += '有贵人相助，逢凶化吉。';
      }
      if (dy.shensha.includes('驿马')) {
        analysis += '驿马星动，可能有搬迁、出差、旅游之事。';
      }
      if (dy.shensha.includes('羊刃')) {
        analysis += '羊刃当头，注意血光之灾和破财，不宜冒险。';
      }
    }

    // 十神分析
    if (ganSS === '正官' || ganSS === '七杀') {
      analysis += ` 天干${ganSS}，事业方面有变动，${ganSS === '正官' ? '可能有升职或获得权力之机' : '可能面临压力和挑战，但也有突破机会'}。`;
    }
    if (ganSS === '正财' || ganSS === '偏财') {
      analysis += ` 天干${ganSS}，财运方面有变化，${ganSS === '正财' ? '正财运佳，收入稳定' : '偏财运来，有意外之财但需把握'}。`;
    }
    if (ganSS === '正印' || ganSS === '偏印') {
      analysis += ` 天干${ganSS}，学业文上有利，${ganSS === '正印' ? '有贵人提携，学业有成' : '思维活跃，适合学习新技术'}。`;
    }
    if (ganSS === '食神' || ganSS === '伤官') {
      analysis += ` 天干${ganSS}，才华得以发挥，${ganSS === '食神' ? '生活安逸，有口福' : '创造力旺盛，但注意言行'}。`;
    }
    if (ganSS === '比肩' || ganSS === '劫财') {
      analysis += ` 天干${ganSS}，人际关系活跃，${ganSS === '比肩' ? '有朋友助力' : '需防破财和竞争'}。`;
    }

    return { dayunIndex: idx, analysis };
  });
}

// ========== 11. 流年详细解读 ==========

export function interpretLiuNian(
  result: BaziResult,
  qiangRuo: ReturnType<typeof analyzeQiangRuo>
): { year: number; analysis: string }[] {
  const { liunian, dayunDetails, fourPillars } = result;
  const dayGan = fourPillars.day.gan;
  const yongShen = qiangRuo.yongShen;

  if (!liunian || liunian.length === 0) return [];

  // 找到当前流年所在的大运
  const currentYear = new Date().getFullYear();

  return liunian.filter(ln => Math.abs(ln.year - currentYear) <= 10).map(ln => {
    const ganWx = TIAN_GAN_WU_XING[ln.gan];
    const zhiWx = DI_ZHI_WU_XING[ln.zhi];
    const isYong = ganWx === yongShen || zhiWx === yongShen;
    const isCurrent = ln.year === currentYear;

    let analysis = `${ln.year}年（${ln.age}岁）${ln.gan}${ln.zhi}。`;

    // 十神
    if (ln.shishen) {
      analysis += ` 流年十神${ln.shishen}。`;
      const shishenEvents: Record<string, string> = {
        '正官': '事业有升迁之机，可能获得权力或名誉',
        '七杀': '面临压力和挑战，但也有突破机会，需谨慎应对',
        '正财': '收入稳定，财运不错，适合稳健理财',
        '偏财': '有意外之财的机会，但也容易破财，需把握分寸',
        '正印': '学业有利，有贵人相助，适合学习考试',
        '偏印': '思维活跃，适合学习新技能，但注意不要想太多',
        '食神': '生活安逸，有口福，适合创作和享受生活',
        '伤官': '才华发挥，但有口舌是非风险，注意言行',
        '比肩': '人际关系好，有朋友助力，适合合作',
        '劫财': '需防破财，注意朋友借贷，不宜合伙',
      };
      if (shishenEvents[ln.shishen]) {
        analysis += shishenEvents[ln.shishen] + '。';
      }
    }

    // 神煞
    if (ln.shensha && ln.shensha.length > 0) {
      analysis += ` 流年带${ln.shensha.join('、')}。`;
      if (ln.shensha.includes('天乙贵人')) {
        analysis += '有贵人相助。';
      }
      if (ln.shensha.includes('文昌贵人')) {
        analysis += '文运亨通，适合考试和学习。';
      }
    }

    // 吉凶
    if (isYong) {
      analysis += ` 流年为用神${yongShen}，运势顺利，宜积极进取。`;
    } else if (ganWx === qiangRuo.jiShen || zhiWx === qiangRuo.jiShen) {
      analysis += ` 流年为忌神${qiangRuo.jiShen}，需谨慎行事。`;
    }

    if (isCurrent) {
      analysis += ' 【今年流年】';
    }

    return { year: ln.year, analysis };
  });
}

// ========== 综合生成函数 ==========

export function generateDetailedAnalysis(
  result: BaziResult
): BaziDetailedAnalysis {
  const { fourPillars } = result;
  const dayGan = fourPillars.day.gan;

  // 强弱分析
  const monthZhi = fourPillars.month.zhi;
  const ZHI_MONTH: Record<string, number> = { '寅': 1, '卯': 2, '辰': 3, '巳': 4, '午': 5, '未': 6, '申': 7, '酉': 8, '戌': 9, '亥': 10, '子': 11, '丑': 12 };
  const month = ZHI_MONTH[monthZhi] || 1;

  const allGanZhi = [
    fourPillars.year.gan + fourPillars.year.zhi,
    fourPillars.month.gan + fourPillars.month.zhi,
    fourPillars.day.gan + fourPillars.day.zhi,
    fourPillars.hour?.gan ? fourPillars.hour.gan + fourPillars.hour.zhi : '',
  ].filter(Boolean);

  const qiangRuo = analyzeQiangRuo(dayGan, monthZhi, allGanZhi);

  return {
    career: analyzeCareer(result, qiangRuo),
    wealth: analyzeWealth(result, qiangRuo),
    marriage: analyzeMarriage(result),
    health: analyzeHealth(result, qiangRuo),
    education: analyzeEducation(result),
    family: analyzeFamilyRelations(result),
    luck: analyzeLuck(result, qiangRuo),
    personality: analyzePersonality(result),
    lifeOverview: analyzeLifeOverview(result, qiangRuo),
    dayunInterpretations: interpretDayun(result, qiangRuo),
    liunianInterpretations: interpretLiuNian(result, qiangRuo),
  };
}
