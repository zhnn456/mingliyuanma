/**
 * 八字合盘算法（十二维度增强版）
 * 基于双方八字四柱，从五行互补、日柱关系、生肖年支、喜用神互补、十神配对、大运同步、
 * 纳音五行、夫妻宫稳定、性格匹配、事业财运、子女缘分、神煞互映十二个维度综合评分，
 * 用于婚姻感情匹配度分析。
 *
 * 理论依据：
 * - 《渊海子平》：天干五合、地支六合六冲、纳音五行
 * - 《三命通会》：合婚法、宫位配对、神煞论命
 * - 《滴天髓》：五行生克制化、喜用神互补
 * - 《子平真诠》：十神配偶星论命
 */

// ============================================
// 基础常量
// ============================================

// 天干
const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
// 地支
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 五行属性
const WU_XING: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土',
  '庚': '金', '辛': '金', '壬': '水', '癸': '水',
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水',
};

// 天干五合（化神五行）
const TIAN_GAN_HE: Record<string, string> = {
  '甲己': '土', '己甲': '土', '乙庚': '金', '庚乙': '金',
  '丙辛': '水', '辛丙': '水', '丁壬': '木', '壬丁': '木',
  '戊癸': '火', '癸戊': '火',
};

// 地支六合
const LIU_HE: Record<string, string> = {
  '子丑': '土', '丑子': '土', '寅亥': '木', '亥寅': '木',
  '卯戌': '火', '戌卯': '火', '辰酉': '金', '酉辰': '金',
  '巳申': '水', '申巳': '水', '午未': '土', '未午': '土',
};

// 地支六冲
const LIU_CHONG: Record<string, string> = {
  '子午': '冲', '午子': '冲', '丑未': '冲', '未丑': '冲',
  '寅申': '冲', '申寅': '冲', '卯酉': '冲', '酉卯': '冲',
  '辰戌': '冲', '戌辰': '冲', '巳亥': '冲', '亥巳': '冲',
};

// 地支三合局（仅列两支组合归属，用于判断同局）
const SAN_HE_GROUPS: { zhis: string[]; wx: string }[] = [
  { zhis: ['申', '子', '辰'], wx: '水' },
  { zhis: ['亥', '卯', '未'], wx: '木' },
  { zhis: ['寅', '午', '戌'], wx: '火' },
  { zhis: ['巳', '酉', '丑'], wx: '金' },
];

// 地支三合局（完整组合）
const SAN_HE: Record<string, string> = {
  '申子辰': '水', '子辰申': '水', '辰申子': '水',
  '亥卯未': '木', '卯未亥': '木', '未亥卯': '木',
  '寅午戌': '火', '午戌寅': '火', '戌寅午': '火',
  '巳酉丑': '金', '酉丑巳': '金', '丑巳酉': '金',
};

// 地支相刑
const XIANG_XING: Record<string, string> = {
  '寅巳': '刑', '巳申': '刑', '申寅': '刑',  // 寅巳申三刑
  '丑戌': '刑', '戌未': '刑', '未丑': '刑',  // 丑戌未三刑
  '子卯': '刑', '卯子': '刑',                // 子卯相刑
};

// 地支相害
const XIANG_HAI: Record<string, string> = {
  '子未': '害', '未子': '害', '丑午': '害', '午丑': '害',
  '寅巳': '害', '巳寅': '害', '卯辰': '害', '辰卯': '害',
  '申亥': '害', '亥申': '害', '酉戌': '害', '戌酉': '害',
};

// 五行相生：A 生 B
const WU_XING_SHENG: Record<string, string> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
};

// 五行相克：A 克 B
const WU_XING_KE: Record<string, string> = {
  '木': '土', '土': '水', '水': '火', '火': '金', '金': '木',
};

// 生我者
const SHENG_WO: Record<string, string> = {
  '木': '水', '火': '木', '土': '火', '金': '土', '水': '金',
};

// 克我者
const KE_WO: Record<string, string> = {
  '木': '金', '火': '水', '土': '木', '金': '火', '水': '土',
};

// ============================================
// 新增常量
// ============================================

// 六十甲子纳音五行（用于年柱纳音分析）
const NA_YIN: Record<string, string> = {
  '甲子乙丑': '海中金', '丙寅丁卯': '炉中火', '戊辰己巳': '大林木',
  '庚午辛未': '路旁土', '壬申癸酉': '剑锋金', '甲戌乙亥': '山头火',
  '丙子丁丑': '涧下水', '戊寅己卯': '城墙土', '庚辰辛巳': '白蜡金',
  '壬午癸未': '杨柳木', '甲申乙酉': '泉中水', '丙戌丁亥': '屋上土',
  '戊子己丑': '霹雳火', '庚寅辛卯': '松柏木', '壬辰癸巳': '长流水',
  '甲午乙未': '砂石金', '丙申丁酉': '山下火', '戊戌己亥': '平地木',
  '庚子辛丑': '壁上土', '壬寅癸卯': '金箔金', '甲辰乙巳': '覆灯火',
  '丙午丁未': '天河水', '戊申己酉': '大驿土', '庚戌辛亥': '钗钏金',
  '壬子癸丑': '桑柘木', '甲寅乙卯': '大溪水', '丙辰丁巳': '沙中土',
  '戊午己未': '天上火', '庚申辛酉': '石榴木', '壬戌癸亥': '大海水',
};

// 纳音五行属性
const NAYIN_WX: Record<string, string> = {
  '海中金': '金', '炉中火': '火', '大林木': '木', '路旁土': '土', '剑锋金': '金',
  '山头火': '火', '涧下水': '水', '城墙土': '土', '白蜡金': '金', '杨柳木': '木',
  '泉中水': '水', '屋上土': '土', '霹雳火': '火', '松柏木': '木', '长流水': '水',
  '砂石金': '金', '山下火': '火', '平地木': '木', '壁上土': '土', '金箔金': '金',
  '覆灯火': '火', '天河水': '水', '大驿土': '土', '钗钏金': '金', '桑柘木': '木',
  '大溪水': '水', '沙中土': '土', '天上火': '火', '石榴木': '木', '大海水': '水',
};

// 桃花星（年支或日支推算）
const TAO_HUA: Record<string, string> = {
  '寅': '卯', '午': '卯', '戌': '卯',  // 寅午戌见卯
  '申': '酉', '子': '酉', '辰': '酉',  // 申子辰见酉
  '亥': '子', '卯': '子', '未': '子',  // 亥卯未见子
  '巳': '午', '酉': '午', '丑': '午',  // 巳酉丑见午
};

// 红鸾星（按年支查）
const HONG_LUAN: Record<string, string> = {
  '子': '卯', '丑': '寅', '寅': '丑', '卯': '子', '辰': '亥', '巳': '戌',
  '午': '酉', '未': '申', '申': '未', '酉': '午', '戌': '巳', '亥': '辰',
};

// 天喜星（按年支查）
const TIAN_XI: Record<string, string> = {
  '子': '酉', '丑': '申', '寅': '未', '卯': '午', '辰': '巳', '巳': '辰',
  '午': '卯', '未': '寅', '申': '丑', '酉': '子', '戌': '亥', '亥': '戌',
};

// 孤辰寡宿（按年支查）
const GU_CHEN: Record<string, string> = {
  '子': '寅', '丑': '寅', '寅': '寅',  // 亥子丑见寅为孤
  '卯': '巳', '辰': '巳', '巳': '巳',  // 寅卯辰见巳为孤
  '午': '申', '未': '申', '申': '申',  // 巳午未见申为孤
  '酉': '亥', '戌': '亥', '亥': '亥',  // 申酉戌见亥为孤
};

// 日主性格特征
const RI_ZHU_XING_GE: Record<string, { traits: string[]; desc: string }> = {
  '甲': { traits: ['刚直', '上进', '仁慈'], desc: '甲木参天，如大树般挺拔正直，有领导力但稍显固执' },
  '乙': { traits: ['柔顺', '善变', '温和'], desc: '乙木如藤蔓花草，柔韧灵活，善于交际但易优柔寡断' },
  '丙': { traits: ['热情', '急躁', '光明'], desc: '丙火如太阳，光明磊落，热情大方但易冲动急躁' },
  '丁': { traits: ['细腻', '内敛', '温和'], desc: '丁火如灯烛，温柔细腻，内心丰富但易多愁善感' },
  '戊': { traits: ['厚重', '守信', '保守'], desc: '戊土如城墙，厚重沉稳，忠厚可靠但稍显保守' },
  '己': { traits: ['包容', '谨慎', '多虑'], desc: '己土如田园，包容厚德，心思细密但易多虑' },
  '庚': { traits: ['刚毅', '重义', '好胜'], desc: '庚金如刀剑，刚毅果断，重情义但易好胜刚硬' },
  '辛': { traits: ['精致', '清高', '敏感'], desc: '辛金如珠玉，精致秀气，追求完美但易敏感脆弱' },
  '壬': { traits: ['聪明', '多变', '奔放'], desc: '壬水如江河，聪明智慧，善于变通但易任性奔放' },
  '癸': { traits: ['聪慧', '柔弱', '善感'], desc: '癸水如雨露，聪慧温柔，善解人意但易优柔多感' },
};

// 纳音相生相克友好度（纳音五行间）
// 五行对应的幸运颜色
const WX_COLOR: Record<string, string> = {
  '金': '白色、金色、银色', '木': '绿色、青色', '水': '黑色、蓝色',
  '火': '红色、紫色', '土': '黄色、棕色',
};

// 五行对应的幸运方位
const WX_DIRECTION: Record<string, string> = {
  '金': '西方、西北', '木': '东方、东南', '水': '北方',
  '火': '南方', '土': '中央、东北、西南',
};

// 五行对应的饰品材质
const WX_ACCESSORY: Record<string, string> = {
  '金': '金银饰品、金属手表', '木': '木质手串、翡翠玉石', '水': '黑曜石、蓝水晶',
  '火': '红玛瑙、石榴石', '土': '黄水晶、琥珀蜜蜡',
};

// ============================================
// 类型定义
// ============================================

export interface HePanDimension {
  score: number;
  title: string;
  icon: string;       // emoji图标
  desc: string;       // 详细描述（200字以上）
  details: string[];  // 分项要点
}

export interface HePanResult {
  score: number;
  level: string;
  dimensions: {
    wuxing: HePanDimension;        // 1. 五行互补（12%）
    rizhu: HePanDimension;         // 2. 日柱关系（15%）
    shengxiao: HePanDimension;     // 3. 生肖年支（8%）
    xiyongshen: HePanDimension;    // 4. 喜用神互补（10%）
    shishen: HePanDimension;       // 5. 十神配对（8%）
    dayun: HePanDimension;         // 6. 大运同步（5%）
    nayin: HePanDimension;         // 7. 纳音五行（5%）
    fuguigong: HePanDimension;     // 8. 夫妻宫稳定（12%）
    xingge: HePanDimension;        // 9. 性格匹配（8%）
    caiyun: HePanDimension;        // 10. 事业财运（7%）
    zinv: HePanDimension;          // 11. 子女缘分（5%）
    shensha: HePanDimension;       // 12. 神煞互映（5%）
  };
  personality1: { gan: string; xingge: string; traits: string[]; desc: string };
  personality2: { gan: string; xingge: string; traits: string[]; desc: string };
  summary: string;           // 总评（300字以上）
  suggestions: string[];    // 相处建议（5-8条）
  warnings: string[];       // 潜在考验（2-4条）
  luckyTips: string[];      // 开运建议（3-5条）
  futureForecast: string;   // 感情走向预测（150字以上）
}

// ============================================
// 辅助函数
// ============================================

/** 兼容获取喜用神五行（兼容 {xi,yong,ji} 与 {xiShen,yongShen} 两种结构） */
function getXiYongWx(xy: any): { xi: string; yong: string; ji: string } | null {
  if (!xy) return null;
  const xi = xy.xi || xy.xiShen || xy.xiShenWx || '';
  const yong = xy.yong || xy.yongShen || xy.yongShenWx || '';
  const ji = xy.ji || xy.jiShen || xy.jiShenWx || '';
  if (!xi && !yong) return null;
  return { xi, yong, ji };
}

/** 获取五行力量分布（优先用 wuxingStrength，否则用 wuxing 计数） */
function getWxStrength(bazi: any): Record<string, number> {
  const fallback: Record<string, number> = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };
  if (bazi?.wuxingStrength?.strengths) {
    return { ...fallback, ...bazi.wuxingStrength.strengths };
  }
  if (bazi?.wuxing) {
    return { ...fallback, ...bazi.wuxing };
  }
  return fallback;
}

/** 找最旺的五行 */
function getDominantWx(strength: Record<string, number>): string {
  let max = -1;
  let dom = '土';
  for (const [wx, s] of Object.entries(strength)) {
    if (s > max) { max = s; dom = wx; }
  }
  return dom;
}

/** 找最弱的五行 */
function getWeakestWx(strength: Record<string, number>): string {
  let min = Infinity;
  let weak = '土';
  for (const [wx, s] of Object.entries(strength)) {
    if (s < min) { min = s; weak = wx; }
  }
  return weak;
}

/** 找缺失的五行 */
function getMissingWx(strength: Record<string, number>): string[] {
  return ['金', '木', '水', '火', '土'].filter(wx => (strength[wx] || 0) === 0);
}

/** 判断两个地支是否同属一个三合局 */
function isSameSanHeGroup(zhi1: string, zhi2: string): boolean {
  return SAN_HE_GROUPS.some(g => g.zhis.includes(zhi1) && g.zhis.includes(zhi2));
}

/** 计算当前年龄所走大运 */
function getCurrentDayun(bazi: any): { gan: string; zhi: string; startAge: number } | null {
  const dayun = bazi?.dayun;
  if (!dayun || !Array.isArray(dayun) || dayun.length === 0) return null;
  // 用 dayunDetails 推算当前年龄更精确
  const details = bazi?.dayunDetails;
  if (details && details.length > 0) {
    const currentYear = new Date().getFullYear();
    const current = details.find(d => currentYear >= d.startYear && currentYear <= d.endYear);
    if (current) {
      return { gan: current.gan, zhi: current.zhi, startAge: current.startAge };
    }
  }
  return dayun[0];
}

/** 统计十神出现次数（含地支藏干） */
function countShiShen(shishen: Record<string, string>, target: string): number {
  let count = 0;
  for (const v of Object.values(shishen)) {
    if (!v) continue;
    if (v === target) count += 1;
    // 地支藏干格式如 "己(正财) 癸(偏财)"
    const matches = v.match(/\(([^)]+)\)/g);
    if (matches) {
      for (const m of matches) {
        if (m.includes(target)) count += 1;
      }
    }
  }
  return count;
}

/** 获取年柱纳音五行 */
function getNaYin(gan: string, zhi: string): string {
  if (!gan || !zhi) return '';
  const jiazi = gan + zhi;
  for (const [key, value] of Object.entries(NA_YIN)) {
    if (key.includes(jiazi)) return value;
  }
  return '';
}

/** 判断两五行关系：同、生、克、被生、被克 */
function wxRelation(a: string, b: string): 'same' | 'sheng' | 'keshang' | 'beisheng' | 'beike' | 'none' {
  if (!a || !b) return 'none';
  if (a === b) return 'same';
  if (WU_XING_SHENG[a] === b) return 'sheng';   // a 生 b
  if (WU_XING_SHENG[b] === a) return 'beisheng'; // b 生 a
  if (WU_XING_KE[a] === b) return 'keshang';     // a 克 b
  if (WU_XING_KE[b] === a) return 'beike';       // b 克 a
  return 'none';
}

// ============================================
// 十二维评分
// ============================================

/**
 * 1. 五行互补（权重 12%）
 * 一方缺/弱的五行恰好是对方旺的五行，互补度高 → 高分
 */
function scoreWuxing(bazi1: any, bazi2: any): HePanDimension {
  const s1 = getWxStrength(bazi1);
  const s2 = getWxStrength(bazi2);

  const missing1 = getMissingWx(s1);
  const missing2 = getMissingWx(s2);
  const dom1 = getDominantWx(s1);
  const dom2 = getDominantWx(s2);

  // 互补：一方缺的是对方旺的
  let complement = 0;
  const compDetails: string[] = [];
  for (const m of missing1) {
    if (m === dom2) { complement += 1; compDetails.push(`一方缺${m}，对方${m}旺`); }
  }
  for (const m of missing2) {
    if (m === dom1) { complement += 1; compDetails.push(`对方缺${m}，一方${m}旺`); }
  }

  // 弱旺互补：一方最弱，对方最旺
  const weak1 = getWeakestWx(s1);
  const weak2 = getWeakestWx(s2);
  if (weak1 === dom2) complement += 0.5;
  if (weak2 === dom1) complement += 0.5;

  // 同旺会竞争（双方同五行都旺 → 减分）
  let penalty = 0;
  if (dom1 === dom2) {
    penalty += 1;
  }

  let score = 60 + complement * 12 - penalty * 10;
  score = Math.max(30, Math.min(100, score));

  const details: string[] = [];
  details.push(`一方最旺五行${dom1}，最弱五行${weak1}`);
  details.push(`对方最旺五行${dom2}，最弱五行${weak2}`);
  if (missing1.length > 0) details.push(`一方缺失五行：${missing1.join('、')}`);
  if (missing2.length > 0) details.push(`对方缺失五行：${missing2.join('、')}`);
  if (compDetails.length > 0) details.push(compDetails.join('；'));

  let desc = `五行互补是合婚之根本，讲究双方命局五行能量的相互补益与平衡。经分析，一方最旺五行为${dom1}，最弱五行为${weak1}；对方最旺五行为${dom2}，最弱五行为${weak2}。`;
  if (compDetails.length > 0) {
    desc += `双方五行互补良好，具体表现为：${compDetails.join('；')}。这意味着两人在一起能够相互补足命局中的不足，彼此的能量场形成良性循环，对事业、健康、家庭各方面都有积极的助益，属于格局搭配较佳的组合。`;
  } else if (dom1 === dom2) {
    desc += `双方最旺五行同为${dom1}，五行能量重叠，互补性稍弱。同类五行过旺可能导致性格上的相似与竞争，双方在处事方式上容易雷同而缺乏互补，需通过后天调节（如穿着颜色、居家方位等）来平衡五行能量，增加命局的多样性。`;
  } else {
    desc += `双方五行分布各有侧重，整体互补性中等。一方旺${dom1}而对方旺${dom2}，虽非完美互补，但日常相处中可互相借鉴彼此的长处。建议在生活中注意五行平衡，可通过共同参与不同属性的活动来增进彼此能量的调和。`;
  }
  if (missing1.length > 0 || missing2.length > 0) {
    desc += `需要注意的是，一方存在缺失五行，命局结构有待完善，对方的五行若能恰好补足，则感情会更加稳固。`;
  }

  return { score: Math.round(score), title: '五行互补', icon: '☯️', desc, details };
}

/**
 * 2. 日柱关系（权重 15%）
 * 日干相合→100，相生→80，比劫→60，相克→40
 * 日支六合+20，六冲-30，相刑-20
 */
function scoreRiZhu(bazi1: any, bazi2: any): HePanDimension {
  const dayGan1 = bazi1?.fourPillars?.day?.gan || '';
  const dayGan2 = bazi2?.fourPillars?.day?.gan || '';
  const dayZhi1 = bazi1?.fourPillars?.day?.zhi || '';
  const dayZhi2 = bazi2?.fourPillars?.day?.zhi || '';

  const wx1 = WU_XING[dayGan1] || '';
  const wx2 = WU_XING[dayGan2] || '';

  // 日干关系评分
  let ganScore = 60;
  let ganRel = '无明显关系';
  const ganKey = dayGan1 + dayGan2;
  if (TIAN_GAN_HE[ganKey]) {
    ganScore = 100;
    ganRel = `天干五合（化${TIAN_GAN_HE[ganKey]}）`;
  } else if (wx1 && wx2 && wx1 === wx2) {
    ganScore = 60;
    ganRel = '日干比劫（同类）';
  } else if (wx1 && wx2 && WU_XING_SHENG[wx1] === wx2) {
    ganScore = 80;
    ganRel = `日干相生（${wx1}生${wx2}）`;
  } else if (wx1 && wx2 && WU_XING_SHENG[wx2] === wx1) {
    ganScore = 80;
    ganRel = `日干相生（${wx2}生${wx1}）`;
  } else if (wx1 && wx2 && WU_XING_KE[wx1] === wx2) {
    ganScore = 40;
    ganRel = `日干相克（${wx1}克${wx2}）`;
  } else if (wx1 && wx2 && WU_XING_KE[wx2] === wx1) {
    ganScore = 40;
    ganRel = `日干相克（${wx2}克${wx1}）`;
  }

  // 日支关系加减分
  let zhiAdj = 0;
  const zhiDetails: string[] = [];
  const zhiKey = dayZhi1 + dayZhi2;
  if (LIU_HE[zhiKey]) {
    zhiAdj += 20;
    zhiDetails.push(`日支六合（合化${LIU_HE[zhiKey]}）`);
  }
  if (LIU_CHONG[zhiKey]) {
    zhiAdj -= 30;
    zhiDetails.push('日支六冲');
  }
  if (XIANG_XING[zhiKey]) {
    zhiAdj -= 20;
    zhiDetails.push('日支相刑');
  }
  if (XIANG_HAI[zhiKey]) {
    zhiAdj -= 10;
    zhiDetails.push('日支相害');
  }

  let score = ganScore + zhiAdj;
  score = Math.max(20, Math.min(100, score));

  const details: string[] = [];
  details.push(`日干${dayGan1}（${wx1}）与${dayGan2}（${wx2}）：${ganRel}`);
  if (zhiDetails.length > 0) {
    details.push(...zhiDetails);
  } else if (dayZhi1 && dayZhi2) {
    details.push(`日支${dayZhi1}与${dayZhi2}无特殊刑冲合害`);
  }

  let desc = `日柱为八字之核心，日干代表自身，日支为夫妻宫，日柱关系直接反映二人缘分深浅。经分析，日干${dayGan1}与${dayGan2}之间为${ganRel}，日干五行分别为${wx1}与${wx2}。`;
  if (zhiDetails.length > 0) {
    desc += `日支${dayZhi1}与${dayZhi2}之间形成${zhiDetails.join('、')}的关系，对夫妻宫产生直接影响。`;
  } else if (dayZhi1 && dayZhi2) {
    desc += `日支${dayZhi1}与${dayZhi2}之间无明显刑冲合害，夫妻宫关系平和稳定。`;
  }
  if (ganScore >= 100) {
    desc += `日干相合为合婚大吉之象，天干五合化${TIAN_GAN_HE[ganKey]}，彼此天然吸引、情投意合，是难得的姻缘组合。双方在一起时心有灵犀，感情基础深厚，纵有波折也能相互牵挂、不离不弃。`;
  } else if (ganScore >= 80) {
    desc += `日干相生，五行能量流通有情，相处融洽，能相互滋养与成就。这种组合意味着双方在情感上能够给予对方温暖与支持，在一起时容易产生舒适安定的感觉，感情发展顺遂。`;
  } else if (ganScore >= 60) {
    desc += `日干比劫同类，性格相近，容易产生共鸣与默契，但同类过旺也易出现竞争与分歧。双方需注意在相处中保持各自的独立性，避免因过于相似而产生摩擦，学会欣赏彼此的不同。`;
  } else if (ganScore <= 40) {
    desc += `日干相克，性格冲突较多，相处中易产生矛盾与摩擦。但相克并非全无好处，正所谓"没有冲突就没有成长"，双方若能以包容和理解化解分歧，反而能在磨合中加深感情，关键在于沟通方式的把握。`;
  }

  return { score: Math.round(score), title: '日柱关系', icon: '💑', desc, details };
}

/**
 * 3. 生肖年支（权重 8%）
 */
function scoreShengXiao(bazi1: any, bazi2: any): HePanDimension {
  const zhi1 = bazi1?.fourPillars?.year?.zhi || '';
  const zhi2 = bazi2?.fourPillars?.year?.zhi || '';
  const sx1 = bazi1?.shengxiao || '';
  const sx2 = bazi2?.shengxiao || '';
  const key = zhi1 + zhi2;

  let score = 60;
  let rel = '中性';

  if (zhi1 && zhi1 === zhi2) {
    score = 70;
    rel = '同年生肖';
  } else if (LIU_HE[key]) {
    score = 90;
    rel = '生肖六合';
  } else if (isSameSanHeGroup(zhi1, zhi2)) {
    score = 95;
    rel = '生肖三合';
  } else if (LIU_CHONG[key]) {
    score = 30;
    rel = '生肖相冲';
  } else if (XIANG_HAI[key]) {
    score = 40;
    rel = '生肖相害';
  } else if (XIANG_XING[key]) {
    score = 35;
    rel = '生肖相刑';
  }

  const details: string[] = [];
  details.push(`生肖${sx1}与${sx2}（年支${zhi1}与${zhi2}）`);
  details.push(`关系：${rel}`);
  if (score >= 90) {
    details.push('先天缘分深厚，性格相投');
  } else if (score <= 40) {
    details.push('性格差异较大，需耐心磨合');
  } else {
    details.push('关系平和，无明显冲突');
  }

  let desc = `生肖年支代表先天根基与家族缘分，是合婚传统中重要的参考维度。经分析，一方生肖为${sx1}（年支${zhi1}），对方生肖为${sx2}（年支${zhi2}），二者构成${rel}的关系。`;
  if (score >= 90) {
    desc += `生肖${sx1}与${sx2}属于三合或六合之局，先天缘分深厚，性格相投，相处和谐。在传统命理中，三合六合的组合意味着双方价值观相近，生活节奏一致，家庭关系融洽，长辈也容易认可这段关系，是较为理想的生肖配对。双方在一起自然舒适，不必刻意迎合便能心意相通。`;
  } else if (score >= 70) {
    desc += `双方生肖相同或同类，性格相近，容易产生共同语言与默契。同生肖的组合意味着双方在成长背景、思维方式上有诸多相似之处，能够理解彼此的感受。但也要注意避免因过于相似而缺乏新鲜感，建议在相处中保持一定的个人空间和独立性，让感情持续保鲜。`;
  } else if (score <= 35) {
    desc += `生肖${sx1}与${sx2}相冲或相刑，性格差异较大，相处中容易产生观念上的分歧与冲突。相冲之配并非不可调和，但需要双方付出更多的耐心与包容来磨合差异。建议在相处中多换位思考，尊重彼此的不同，尤其在家庭关系处理上要格外用心，避免因生肖相冲而影响长辈对感情的态度。`;
  } else if (score <= 40) {
    desc += `生肖${sx1}与${sx2}相害，易生暗隙与误解，需注意沟通方式。相害之配虽不如相冲激烈，但容易在日常生活中积累小摩擦，久而久之影响感情。建议双方保持坦诚沟通，遇到问题及时化解，不积压不满情绪，以真诚和耐心维护感情的稳定。`;
  } else {
    desc += `生肖${sx1}与${sx2}关系平和，无明显冲突也无特殊助力，属于中性的配对。双方在性格和观念上各有特点，既不特别相合也不特别相冲，感情的成败更多取决于双方的经营与付出。只要彼此真心相待，用心经营，同样可以成就一段美好的姻缘。`;
  }

  return { score: Math.round(score), title: '生肖年支', icon: '🐾', desc, details };
}

/**
 * 4. 喜用神互补（权重 10%）
 * 一方喜用神五行是对方旺的五行 → 高分；无数据 → 60
 */
function scoreXiYongShen(
  bazi1: any, bazi2: any,
  xy1: any, xy2: any
): HePanDimension {
  const x1 = getXiYongWx(xy1);
  const x2 = getXiYongWx(xy2);

  if (!x1 || !x2) {
    return {
      score: 60,
      title: '喜用神互补',
      icon: '✨',
      desc: '喜用神是命局中对自身最有利的五行，喜用神互补意味着双方能够互相增旺对方运势。当前喜用神数据不完整，暂以默认分评估。建议结合双方命局喜忌深入分析，以获得更精准的喜用神互补判断。喜用神互补良好的组合，双方在一起时运势会互相提升，事业、财运、健康各方面都能受益，是合婚中非常重要的参考指标。',
      details: ['喜用神数据不完整', '暂以默认分60分评估', '建议补充喜用神分析'],
    };
  }

  const s1 = getWxStrength(bazi1);
  const s2 = getWxStrength(bazi2);
  const dom1 = getDominantWx(s1);
  const dom2 = getDominantWx(s2);

  // 一方喜用神是对方旺的五行
  let match = 0;
  const details: string[] = [];
  const xy1Set = new Set([x1.xi, x1.yong].filter(Boolean));
  const xy2Set = new Set([x2.xi, x2.yong].filter(Boolean));

  if (xy1Set.has(dom2)) { match += 1; details.push('一方喜用神为对方旺五行'); }
  if (xy2Set.has(dom1)) { match += 1; details.push('对方喜用神为一方旺五行'); }

  // 一方忌神是对方弱的五行（忌神被对方化解）
  if (x1.ji && getMissingWx(s2).includes(x1.ji)) { match += 0.5; details.push('一方忌神被对方化解'); }
  if (x2.ji && getMissingWx(s1).includes(x2.ji)) { match += 0.5; details.push('对方忌神被一方化解'); }

  // 一方忌神恰好是对方旺五行（加重忌神 → 减分）
  let penalty = 0;
  if (x1.ji && x1.ji === dom2) { penalty += 1; details.push('一方忌神为对方旺五行（不利）'); }
  if (x2.ji && x2.ji === dom1) { penalty += 1; details.push('对方忌神为一方旺五行（不利）'); }

  let score = 60 + match * 18 - penalty * 15;
  score = Math.max(30, Math.min(100, score));

  details.unshift(`一方喜用神：${[x1.xi, x1.yong].filter(Boolean).join('、')}，忌神：${x1.ji || '无'}`);
  details.unshift(`对方喜用神：${[x2.xi, x2.yong].filter(Boolean).join('、')}，忌神：${x2.ji || '无'}`);

  let desc = `喜用神是命局中对自身最有利的五行，喜用神互补是合婚中的高层次要求。经分析，一方喜用神为${[x1.xi, x1.yong].filter(Boolean).join('与')}，忌神为${x1.ji || '无明显忌神'}；对方喜用神为${[x2.xi, x2.yong].filter(Boolean).join('与')}，忌神为${x2.ji || '无明显忌神'}。`;
  if (match >= 2 && penalty === 0) {
    desc += `喜用神互补极佳，双方在一起能互相增旺运势。一方的喜用神恰好是对方命局中旺盛的五行，对方的喜用神也恰好是一方旺盛的五行，形成完美的能量互补循环。这种组合意味着两人在一起后，各自的运势都会得到提升，事业顺遂、财运亨通、家庭和睦，是难得的上等婚配组合。`;
  } else if (penalty >= 1) {
    desc += `存在喜用神冲突，一方的忌神恰好是对方旺盛的五行，这意味着对方的存在可能会加重一方命局中的不利因素，相处中需注意化解五行相逆带来的影响。建议通过风水布局、穿着颜色、饰品佩戴等方式进行调节，同时在生活中保持适当的独立空间，避免过度依赖。`;
  } else {
    desc += `喜用神互补性中等，双方既无明显增益也无严重冲突，整体相处平稳。这种组合虽不如喜用神互补极佳者那般运势互旺，但也避免了喜用神冲突带来的负面影响。建议双方在日常生活中注意五行平衡，可通过共同参与有利五行的活动来增进彼此运势。`;
  }

  return { score: Math.round(score), title: '喜用神互补', icon: '✨', desc, details };
}

/**
 * 5. 十神配对（权重 8%）
 * 男命正财旺 + 女命正官旺 → 高分；基础60分，根据配偶星状态加减
 */
function scoreShiShen(bazi1: any, bazi2: any): HePanDimension {
  const g1 = bazi1?.gender || 'male';
  const g2 = bazi2?.gender || 'female';
  const ss1 = bazi1?.shishen || {};
  const ss2 = bazi2?.shishen || {};

  // 男命配偶星为正财/偏财，女命配偶星为正官/七杀
  const isMale1 = g1 === 'male';
  const isMale2 = g2 === 'male';

  const spouseStar1 = isMale1 ? ['正财', '偏财'] : ['正官', '七杀'];
  const spouseStar2 = isMale2 ? ['正财', '偏财'] : ['正官', '七杀'];

  let cnt1 = 0;
  let cnt2 = 0;
  for (const s of spouseStar1) cnt1 += countShiShen(ss1, s);
  for (const s of spouseStar2) cnt2 += countShiShen(ss2, s);

  let score = 60;
  // 配偶星旺度加成
  if (cnt1 >= 2) score += 12;
  else if (cnt1 >= 1) score += 6;
  if (cnt2 >= 2) score += 12;
  else if (cnt2 >= 1) score += 6;

  // 男命正财 + 女命正官 双旺 → 额外加成
  const maleCai = isMale1 ? countShiShen(ss1, '正财') : countShiShen(ss2, '正财');
  const femaleGuan = !isMale2 ? countShiShen(ss2, '正官') : countShiShen(ss1, '正官');
  if (isMale1 !== isMale2 && maleCai >= 1 && femaleGuan >= 1) {
    score += 10;
  }

  // 配偶星过弱或缺失
  if (cnt1 === 0) score -= 8;
  if (cnt2 === 0) score -= 8;

  score = Math.max(30, Math.min(100, score));

  const starName1 = spouseStar1.join('/');
  const starName2 = spouseStar2.join('/');
  const details: string[] = [];
  details.push(`一方（${isMale1 ? '男' : '女'}命）配偶星${starName1}出现${cnt1}次`);
  details.push(`对方（${isMale2 ? '男' : '女'}命）配偶星${starName2}出现${cnt2}次`);
  if (isMale1 !== isMale2 && maleCai >= 1 && femaleGuan >= 1) {
    details.push('男命正财与女命正官双旺，配偶星互动佳');
  }
  if (cnt1 === 0 || cnt2 === 0) {
    details.push('一方配偶星偏弱，感情缘分布待加强');
  }

  let desc = `十神配对从配偶星的角度分析双方的感情缘分深浅。男命以正财、偏财为配偶星（代表妻子），女命以正官、七杀为配偶星（代表丈夫）。经分析，一方（${isMale1 ? '男' : '女'}命）配偶星${starName1}在命局中出现${cnt1}次，对方（${isMale2 ? '男' : '女'}命）配偶星${starName2}在命局中出现${cnt2}次。`;
  if (cnt1 >= 2 && cnt2 >= 2) {
    desc += `双方配偶星皆旺，感情缘分深厚，婚姻基础稳固。配偶星旺盛意味着双方对感情和婚姻都有较强的渴望与重视，在感情中能够投入真心，彼此珍惜。这种组合的人通常异性缘好，但在确定关系后能够专一经营，婚姻质量较高，是感情缘分深厚的表现。`;
  } else if (cnt1 === 0 || cnt2 === 0) {
    desc += `一方配偶星偏弱或缺失，感情缘分稍薄，需用心经营婚姻。配偶星弱并不意味着没有姻缘，而是需要在感情中付出更多的耐心与真诚。建议通过提升自身魅力、扩大社交圈来增加异性缘分，遇到合适的人后以真心相待，同样可以收获美满的婚姻。`;
  } else {
    desc += `配偶星状态适中，感情发展平稳。双方对感情的态度较为理性，既不过分执着也不冷淡疏离，能够以平和的心态经营婚姻。这种组合的人在感情中较为稳定，不易因外界诱惑而动摇，但也需注意保持感情的新鲜感，避免因过于平淡而失去激情。`;
  }

  return { score: Math.round(score), title: '十神配对', icon: '💍', desc, details };
}

/**
 * 6. 大运同步（权重 5%）
 * 双方大运走势同步 → 高分；基础60分
 */
function scoreDayun(bazi1: any, bazi2: any): HePanDimension {
  const d1 = getCurrentDayun(bazi1);
  const d2 = getCurrentDayun(bazi2);

  if (!d1 || !d2) {
    return {
      score: 60,
      title: '大运同步',
      icon: '📅',
      desc: '大运代表人生不同阶段的运势走势，大运同步分析双方当前及未来人生节奏是否契合。当前大运数据不足，暂以默认分评估。大运同步度高的组合，双方在人生的重要节点上能够同频共振，一起顺境时共享喜悦，一起逆境时相互扶持，人生轨迹更加契合，是感情长久的重要保障。',
      details: ['大运数据不足', '暂以默认分60分评估', '建议补充大运信息'],
    };
  }

  const wx1 = WU_XING[d1.gan] || '';
  const wx2 = WU_XING[d2.gan] || '';
  const zhiWx1 = WU_XING[d1.zhi] || '';
  const zhiWx2 = WU_XING[d2.zhi] || '';

  let score = 60;
  const details: string[] = [];
  details.push(`一方当前大运：${d1.gan}${d1.zhi}（${wx1}${zhiWx1}）`);
  details.push(`对方当前大运：${d2.gan}${d2.zhi}（${wx2}${zhiWx2}）`);

  // 大运干五行相生/比和 → 同步性好
  if (wx1 && wx2) {
    if (wx1 === wx2) { score += 12; details.push('大运天干同五行，节奏一致'); }
    else if (WU_XING_SHENG[wx1] === wx2 || WU_XING_SHENG[wx2] === wx1) { score += 10; details.push('大运天干相生，互相助益'); }
    else if (WU_XING_KE[wx1] === wx2 || WU_XING_KE[wx2] === wx1) { score -= 8; details.push('大运天干相克，节奏交错'); }
  }

  // 大运支六合/三合 → 同步
  const zhiKey = d1.zhi + d2.zhi;
  if (LIU_HE[zhiKey]) { score += 10; details.push('大运地支六合'); }
  if (isSameSanHeGroup(d1.zhi, d2.zhi)) { score += 8; details.push('大运地支三合同局'); }
  if (LIU_CHONG[zhiKey]) { score -= 12; details.push('大运地支相冲，运势起伏'); }

  score = Math.max(30, Math.min(100, score));

  let desc = `大运代表人生不同阶段的运势走势，大运同步分析双方当前及未来人生节奏是否契合。经分析，一方当前所行大运为${d1.gan}${d1.zhi}（天干${wx1}、地支${zhiWx1}），对方当前所行大运为${d2.gan}${d2.zhi}（天干${wx2}、地支${zhiWx2}）。`;
  if (score >= 75) {
    desc += `双方大运走势同步，人生节奏契合，宜携手共进。当前双方大运五行相生或同局相合，意味着在现阶段两人的运势方向一致，能够共同抓住机遇、应对挑战。这种同步性使双方在事业、家庭等重大决策上容易达成共识，一起顺境时共享喜悦，是感情稳步发展的重要保障。`;
  } else if (score <= 50) {
    desc += `双方大运走势有所交错，需互相体谅人生起伏。当前双方大运五行相克或相冲，意味着两人的运势节奏不一致，可能一方顺境时另一方正值逆境。这种情况下需要更多的理解与包容，顺境的一方应多支持鼓励对方，携手度过低谷期。大运流转无常，暂时的不同步不代表永远，关键是相互扶持。`;
  } else {
    desc += `双方大运走势较为平稳，整体协调。当前双方大运既无明显冲突也无特殊助力，运势节奏基本相当。这种组合在现阶段相处较为平顺，没有太大的运势落差带来的压力。建议把握当前平稳期，共同规划未来，为感情的长远发展打下坚实基础。`;
  }

  return { score: Math.round(score), title: '大运同步', icon: '📅', desc, details };
}

/**
 * 7. 纳音五行（权重 5%）
 * 获取双方年柱的纳音五行，判断纳音之间是否相生相克
 */
function scoreNaYin(bazi1: any, bazi2: any): HePanDimension {
  const yearGan1 = bazi1?.fourPillars?.year?.gan || '';
  const yearZhi1 = bazi1?.fourPillars?.year?.zhi || '';
  const yearGan2 = bazi2?.fourPillars?.year?.gan || '';
  const yearZhi2 = bazi2?.fourPillars?.year?.zhi || '';

  const nayin1 = getNaYin(yearGan1, yearZhi1);
  const nayin2 = getNaYin(yearGan2, yearZhi2);
  const wx1 = NAYIN_WX[nayin1] || '';
  const wx2 = NAYIN_WX[nayin2] || '';

  let score = 60;
  const details: string[] = [];
  details.push(`一方年柱${yearGan1}${yearZhi1}纳音：${nayin1}（${wx1}）`);
  details.push(`对方年柱${yearGan2}${yearZhi2}纳音：${nayin2}（${wx2}）`);

  if (!nayin1 || !nayin2) {
    return {
      score: 60,
      title: '纳音五行',
      icon: '🎵',
      desc: '纳音五行是六十甲子赋予的特殊五行属性，源自《三命通会》，用于分析年柱先天根基的相生相克关系。当前年柱数据不完整，暂以默认分评估。纳音五行相生者，先天根基相合，家族缘分融洽；纳音五行相克者，根基有冲，需后天调和。纳音分析虽为辅助参考，但在传统合婚中具有重要地位。',
      details,
    };
  }

  const rel = wxRelation(wx1, wx2);
  if (rel === 'same') {
    score = 70;
    details.push('纳音五行同类，根基相近');
  } else if (rel === 'sheng' || rel === 'beisheng') {
    score = 85;
    details.push(`纳音五行相生（${wx1}与${wx2}），根基相合`);
  } else if (rel === 'keshang' || rel === 'beike') {
    score = 45;
    details.push(`纳音五行相克（${wx1}与${wx2}），根基有冲`);
  } else {
    score = 60;
    details.push('纳音五行关系平和');
  }

  score = Math.max(30, Math.min(100, score));

  let desc = `纳音五行是六十甲子赋予的特殊五行属性，源自《三命通会》，用于分析年柱先天根基的相生相克关系。经分析，一方年柱${yearGan1}${yearZhi1}纳音为${nayin1}（属${wx1}），对方年柱${yearGan2}${yearZhi2}纳音为${nayin2}（属${wx2}）。`;
  if (rel === 'sheng' || rel === 'beisheng') {
    desc += `双方纳音五行相生，${wx1}与${wx2}之间形成生生不息的能量循环，先天根基相合。纳音相生意味着双方家族缘分融洽，长辈之间容易相处，婚姻能得到双方家庭的祝福与支持。这种组合在传统合婚中属于吉配，预示着婚姻根基稳固，家族和谐美满。`;
  } else if (rel === 'same') {
    desc += `双方纳音五行同属${wx1}，根基相近，气质相投。纳音同类意味着双方在先天秉性上有相似之处，容易产生亲切感与归属感。但同类过旺也可能导致性格上的雷同，需注意在生活中保持各自的特色与独立性，避免因过于相似而缺乏互补性。`;
  } else if (rel === 'keshang' || rel === 'beike') {
    desc += `双方纳音五行相克，${wx1}与${wx2}之间存在克制关系，先天根基有冲。纳音相克可能影响双方家族关系，长辈对婚事或有不同意见。但纳音相克并非不可化解，可通过后天调节（如选择有利的婚期、居家风水布局等）来缓解纳音相克的影响，关键在于双方坚定的感情基础与共同经营婚姻的决心。`;
  } else {
    desc += `双方纳音五行关系平和，既无相生之喜也无相克之忧，根基关系中性。这种组合在家族缘分上无明显的助力或阻碍，感情的成败更多取决于双方自身的经营与付出。建议在感情发展中注重与双方家庭的沟通，争取长辈的理解与支持，为婚姻营造良好的家庭氛围。`;
  }

  return { score: Math.round(score), title: '纳音五行', icon: '🎵', desc, details };
}

/**
 * 8. 夫妻宫稳定（权重 12%）
 * 分析双方日支（夫妻宫）的稳定性
 */
function scoreFuGuiGong(bazi1: any, bazi2: any): HePanDimension {
  const pillars1 = bazi1?.fourPillars || {};
  const pillars2 = bazi2?.fourPillars || {};

  const dayZhi1 = pillars1.day?.zhi || '';
  const dayZhi2 = pillars2.day?.zhi || '';

  // 分析各方夫妻宫受其他柱地支的冲刑害合
  function analyzeGong(dayZhi: string, otherZhis: string[], label: string): { unstable: number; stable: number; msgs: string[] } {
    let unstable = 0;
    let stable = 0;
    const msgs: string[] = [];
    for (const zhi of otherZhis) {
      if (!zhi) continue;
      const key = dayZhi + zhi;
      if (LIU_CHONG[key]) { unstable++; msgs.push(`${label}日支${dayZhi}被${zhi}冲`); }
      if (XIANG_XING[key]) { unstable++; msgs.push(`${label}日支${dayZhi}被${zhi}刑`); }
      if (XIANG_HAI[key]) { unstable++; msgs.push(`${label}日支${dayZhi}被${zhi}害`); }
      if (LIU_HE[key]) { stable++; msgs.push(`${label}日支${dayZhi}与${zhi}合（稳定）`); }
      if (isSameSanHeGroup(dayZhi, zhi)) { stable++; msgs.push(`${label}日支${dayZhi}与${zhi}三合同局`); }
    }
    return { unstable, stable, msgs };
  }

  const g1 = analyzeGong(dayZhi1, [pillars1.year?.zhi, pillars1.month?.zhi, pillars1.hour?.zhi], '一方');
  const g2 = analyzeGong(dayZhi2, [pillars2.year?.zhi, pillars2.month?.zhi, pillars2.hour?.zhi], '对方');

  // 双方日支之间的互动
  const crossKey = dayZhi1 + dayZhi2;
  let crossStable = 0;
  let crossUnstable = 0;
  const crossMsgs: string[] = [];
  if (LIU_HE[crossKey]) { crossStable++; crossMsgs.push('双方日支六合，夫妻宫相合'); }
  if (isSameSanHeGroup(dayZhi1, dayZhi2)) { crossStable++; crossMsgs.push('双方日支三合同局'); }
  if (LIU_CHONG[crossKey]) { crossUnstable++; crossMsgs.push('双方日支相冲，夫妻宫不稳'); }
  if (XIANG_XING[crossKey]) { crossUnstable++; crossMsgs.push('双方日支相刑，夫妻宫有损'); }
  if (XIANG_HAI[crossKey]) { crossUnstable++; crossMsgs.push('双方日支相害，夫妻宫有隙'); }

  let score = 75;
  score -= (g1.unstable + g2.unstable) * 8;
  score += (g1.stable + g2.stable) * 5;
  score += crossStable * 10;
  score -= crossUnstable * 12;
  score = Math.max(30, Math.min(100, score));

  const details: string[] = [];
  if (g1.msgs.length > 0) details.push(...g1.msgs);
  if (g2.msgs.length > 0) details.push(...g2.msgs);
  if (crossMsgs.length > 0) details.push(...crossMsgs);
  if (details.length < 3) {
    details.push('双方日支无明显冲刑害');
    details.push('夫妻宫整体较为稳定');
  }

  let desc = `夫妻宫即日支，是八字中代表婚姻感情的核心宫位，其稳定性直接关系到婚姻的牢固程度。经分析，一方日支（夫妻宫）为${dayZhi1}，对方日支（夫妻宫）为${dayZhi2}。`;
  if (g1.unstable > 0 || g2.unstable > 0) {
    desc += `从各自命局来看，${[...g1.msgs, ...g2.msgs].filter(m => m.includes('冲') || m.includes('刑') || m.includes('害')).join('，')}，夫妻宫受到一定程度的冲击，婚姻中可能出现波动与考验。日支被冲者感情易生变故，被刑者夫妻间易有口角，被害者易生暗隙误解。`;
  } else {
    desc += `从各自命局来看，双方夫妻宫均未受到明显的冲刑害，先天结构较为稳定，婚姻基础较为牢固。`;
  }
  if (crossStable > 0) {
    desc += `双方日支之间形成${crossMsgs.filter(m => m.includes('合') || m.includes('三合')).join('、')}的关系，夫妻宫相互呼应，感情基础更加深厚。日支相合意味着双方在感情上有天然的吸引力，彼此眷恋，婚姻关系稳固。`;
  } else if (crossUnstable > 0) {
    desc += `需要注意的是，双方日支之间存在${crossMsgs.filter(m => m.includes('冲') || m.includes('刑') || m.includes('害')).join('、')}的关系，夫妻宫相互冲击，婚姻中可能出现矛盾与波折。建议双方在相处中多加包容，遇事冷静沟通，避免因冲动而伤害感情，以真诚和耐心维护婚姻的稳定。`;
  }
  if (g1.stable > 0 || g2.stable > 0) {
    desc += `此外，双方命局中均存在日支相合的稳定因素，有助于增强夫妻宫的稳固性，为婚姻提供额外的保障。`;
  }

  return { score: Math.round(score), title: '夫妻宫稳定', icon: '🏠', desc, details };
}

/**
 * 9. 性格匹配（权重 8%）
 * 使用 RI_ZHU_XING_GE 数据，对比双方日主性格特征
 */
function scoreXingGe(bazi1: any, bazi2: any): HePanDimension {
  const dayGan1 = bazi1?.fourPillars?.day?.gan || '';
  const dayGan2 = bazi2?.fourPillars?.day?.gan || '';
  const wx1 = WU_XING[dayGan1] || '';
  const wx2 = WU_XING[dayGan2] || '';

  const xingge1 = RI_ZHU_XING_GE[dayGan1];
  const xingge2 = RI_ZHU_XING_GE[dayGan2];

  if (!xingge1 || !xingge2) {
    return {
      score: 60,
      title: '性格匹配',
      icon: '💖',
      desc: '性格匹配从日主五行属性出发，分析双方性格特征的契合程度。当前日主数据不完整，暂以默认分评估。性格匹配良好的组合，双方在相处中容易产生默契与共鸣，沟通顺畅，摩擦较少；性格差异较大的组合，则需要更多的包容与理解来磨合差异。',
      details: ['日主数据不完整', '暂以默认分60分评估'],
    };
  }

  const rel = wxRelation(wx1, wx2);
  let score = 60;
  const details: string[] = [];
  details.push(`一方日主${dayGan1}（${wx1}）：${xingge1.traits.join('、')}`);
  details.push(`对方日主${dayGan2}（${wx2}）：${xingge2.traits.join('、')}`);

  // 找共同特征
  const commonTraits = xingge1.traits.filter(t => xingge2.traits.includes(t));
  if (commonTraits.length > 0) {
    details.push(`共同特征：${commonTraits.join('、')}`);
  }

  if (rel === 'same') {
    score = 75;
    details.push('日主同五行，性格相近');
  } else if (rel === 'sheng' || rel === 'beisheng') {
    score = 88;
    details.push(`日主五行相生（${wx1}与${wx2}），性格互补`);
  } else if (rel === 'keshang' || rel === 'beike') {
    score = 42;
    details.push(`日主五行相克（${wx1}与${wx2}），性格冲突`);
  } else {
    score = 60;
    details.push('日主五行关系平和');
  }

  score = Math.max(30, Math.min(100, score));

  let desc = `性格匹配从日主五行属性出发，分析双方性格特征的契合程度。一方日主为${dayGan1}（${wx1}行），性格特征表现为${xingge1.traits.join('、')}，${xingge1.desc}。对方日主为${dayGan2}（${wx2}行），性格特征表现为${xingge2.traits.join('、')}，${xingge2.desc}。`;
  if (rel === 'sheng' || rel === 'beisheng') {
    desc += `双方日主五行相生，${wx1}与${wx2}之间形成相生关系，性格互补性好。一方性格中的优势恰好能弥补对方的不足，彼此在相处中能够互相成就、互相滋养。这种组合在日常沟通中较为顺畅，容易产生共鸣与默契，感情发展自然融洽，是性格匹配度较高的组合。`;
  } else if (rel === 'same') {
    desc += `双方日主同属${wx1}行，性格相近，容易产生共鸣与理解。同五行的组合意味着双方在思维方式、处事风格上有诸多相似之处，能够感同身受地理解对方的感受。但也需注意，性格过于相似可能导致缺乏互补性，在遇到问题时容易陷入相同的思维模式，建议在相处中保持开放心态，学会从不同角度看问题。`;
  } else if (rel === 'keshang' || rel === 'beike') {
    desc += `双方日主五行相克，${wx1}与${wx2}之间存在克制关系，性格冲突较大。双方在处事方式、价值观念上可能存在明显差异，相处中容易产生摩擦与分歧。但相克并非不可调和，性格差异如果处理得当反而能带来新鲜感与成长。关键在于双方都要学会换位思考，以包容和尊重的态度面对彼此的不同，在磨合中找到平衡点。`;
  } else {
    desc += `双方日主五行关系平和，性格各有特点，既不特别相合也不特别相冲。这种组合在相处中较为自然，双方能够保持各自的性格特色，在日常生活中互相影响、共同成长。建议在相处中多欣赏对方的优点，包容彼此的不足，以真诚和耐心经营感情。`;
  }

  return { score: Math.round(score), title: '性格匹配', icon: '💖', desc, details };
}

/**
 * 10. 事业财运（权重 7%）
 * 分析双方财星（正财/偏财）与官星（正官/七杀）状态
 */
function scoreCaiYun(bazi1: any, bazi2: any): HePanDimension {
  const g1 = bazi1?.gender || 'male';
  const ss1 = bazi1?.shishen || {};
  const ss2 = bazi2?.shishen || {};

  // 财星（正财+偏财）和官星（正官+七杀）统计
  const cai1 = countShiShen(ss1, '正财') + countShiShen(ss1, '偏财');
  const cai2 = countShiShen(ss2, '正财') + countShiShen(ss2, '偏财');
  const guan1 = countShiShen(ss1, '正官') + countShiShen(ss1, '七杀');
  const guan2 = countShiShen(ss2, '正官') + countShiShen(ss2, '七杀');

  // 日主五行
  const dayGan1 = bazi1?.fourPillars?.day?.gan || '';
  const dayGan2 = bazi2?.fourPillars?.day?.gan || '';
  const wx1 = WU_XING[dayGan1] || '';
  const wx2 = WU_XING[dayGan2] || '';

  let score = 65;
  const details: string[] = [];
  details.push(`一方财星${cai1}个、官星${guan1}个`);
  details.push(`对方财星${cai2}个、官星${guan2}个`);

  // 财星旺度加成
  if (cai1 >= 2) score += 8;
  else if (cai1 >= 1) score += 4;
  if (cai2 >= 2) score += 8;
  else if (cai2 >= 1) score += 4;

  // 官星旺度加成（事业运）
  if (guan1 >= 2) score += 6;
  else if (guan1 >= 1) score += 3;
  if (guan2 >= 2) score += 6;
  else if (guan2 >= 1) score += 3;

  // 双方日主五行相生 → 事业方向互补
  const rel = wxRelation(wx1, wx2);
  if (rel === 'sheng' || rel === 'beisheng') {
    score += 6;
    details.push('日主五行相生，事业方向互补');
  } else if (rel === 'keshang' || rel === 'beike') {
    score -= 4;
    details.push('日主五行相克，事业方向或有分歧');
  }

  // 一方财旺 + 对方官旺 → 财官互补
  if ((cai1 >= 2 && guan2 >= 1) || (cai2 >= 2 && guan1 >= 1)) {
    score += 6;
    details.push('财官互补，事业财运互助');
  }

  score = Math.max(30, Math.min(100, score));

  const isMale1 = g1 === 'male';
  let desc = `事业财运分析双方命局中财星与官星的状态，以及双方在事业方向上是否互补。经分析，一方（${isMale1 ? '男' : '女'}命）命局中财星（正财+偏财）出现${cai1}次、官星（正官+七杀）出现${guan1}次；对方命局中财星出现${cai2}次、官星出现${guan2}次。`;
  if (cai1 >= 2 && cai2 >= 2) {
    desc += `双方财星皆旺，财运基础良好，婚后家庭经济条件有望稳步提升。财星旺盛意味着双方都具备较好的理财能力和赚钱机遇，在一起后能够共同创造财富，家庭物质基础牢固。建议合理规划家庭财务，发挥双方各自的理财优势，共同经营家庭经济。`;
  } else if (cai1 >= 1 && cai2 >= 1) {
    desc += `双方财星适中，财运平稳，能够维持家庭的正常开支与稳步发展。双方在财务上都有一定的基础和能力，建议在生活中合理分工，一方主外创收、一方主内理财，共同维护家庭的经济稳定，逐步积累财富。`;
  } else if (cai1 === 0 || cai2 === 0) {
    desc += `一方财星偏弱，财运方面需另一方多加扶持。财星弱并不代表没有财运，而是需要通过后天努力和对方的助力来改善。建议双方在事业规划上互相支持，财运旺的一方多创造机会，财运弱的一方勤奋努力，共同提升家庭的经济水平。`;
  }
  if ((cai1 >= 2 && guan2 >= 1) || (cai2 >= 2 && guan1 >= 1)) {
    desc += `此外，双方财官互补，一方财旺能助另一方事业发展，一方官星能为另一方提供事业助力，事业财运相得益彰，是事业家庭双丰收的好组合。`;
  }

  return { score: Math.round(score), title: '事业财运', icon: '💰', desc, details };
}

/**
 * 11. 子女缘分（权重 5%）
 * 分析时柱（子女宫）及子女星状态
 */
function scoreZiNv(bazi1: any, bazi2: any): HePanDimension {
  const g1 = bazi1?.gender || 'male';
  const g2 = bazi2?.gender || 'female';
  const isMale1 = g1 === 'male';
  const isMale2 = g2 === 'male';

  // 时柱（子女宫）
  const hourZhi1 = bazi1?.fourPillars?.hour?.zhi || '';
  const hourZhi2 = bazi2?.fourPillars?.hour?.zhi || '';
  const hourGan1 = bazi1?.fourPillars?.hour?.gan || '';
  const hourGan2 = bazi2?.fourPillars?.hour?.gan || '';

  // 子女星：男命七杀（也看正官），女命食伤（食神/伤官）
  const ss1 = bazi1?.shishen || {};
  const ss2 = bazi2?.shishen || {};
  const childStar1 = isMale1 ? ['七杀', '正官'] : ['食神', '伤官'];
  const childStar2 = isMale2 ? ['七杀', '正官'] : ['食神', '伤官'];
  let childCnt1 = 0;
  let childCnt2 = 0;
  for (const s of childStar1) childCnt1 += countShiShen(ss1, s);
  for (const s of childStar2) childCnt2 += countShiShen(ss2, s);

  let score = 65;
  const details: string[] = [];
  details.push(`一方时柱（子女宫）：${hourGan1}${hourZhi1}`);
  details.push(`对方时柱（子女宫）：${hourGan2}${hourZhi2}`);
  details.push(`一方子女星（${childStar1.join('/')}）：${childCnt1}个`);
  details.push(`对方子女星（${childStar2.join('/')}）：${childCnt2}个`);

  // 时柱相合 → 子女缘好
  const zhiKey = hourZhi1 + hourZhi2;
  if (LIU_HE[zhiKey]) { score += 12; details.push('双方时支六合，子女缘佳'); }
  if (isSameSanHeGroup(hourZhi1, hourZhi2)) { score += 10; details.push('双方时支三合同局，子女缘好'); }
  if (LIU_CHONG[zhiKey]) { score -= 15; details.push('双方时支相冲，子女缘受影响'); }
  if (XIANG_XING[zhiKey]) { score -= 10; details.push('双方时支相刑，子女缘有波折'); }

  // 子女星旺度
  if (childCnt1 >= 2) score += 6;
  else if (childCnt1 >= 1) score += 3;
  if (childCnt2 >= 2) score += 6;
  else if (childCnt2 >= 1) score += 3;
  if (childCnt1 === 0) score -= 5;
  if (childCnt2 === 0) score -= 5;

  score = Math.max(30, Math.min(100, score));

  let desc = `子女缘分从时柱（子女宫）和子女星两个角度分析双方在子女方面的缘分深浅。时柱为子女宫，代表子女的根基与发展；子女星方面，男命以七杀、正官为子女星，女命以食神、伤官为子女星。经分析，一方时柱为${hourGan1}${hourZhi1}，子女星出现${childCnt1}次；对方时柱为${hourGan2}${hourZhi2}，子女星出现${childCnt2}次。`;
  if (LIU_HE[zhiKey] || isSameSanHeGroup(hourZhi1, hourZhi2)) {
    desc += `双方时支（子女宫）相合或同局，子女缘分良好，婚后容易得子，且子女乖巧孝顺。时支相合意味着双方在子女教育理念上容易达成共识，家庭氛围和谐，有利于子女的健康成长。这种组合的家庭通常子女缘深，亲子关系融洽，晚年也能享受子女的福报。`;
  } else if (LIU_CHONG[zhiKey] || XIANG_XING[zhiKey]) {
    desc += `双方时支（子女宫）相冲或相刑，子女缘分方面可能有一些波折，如得子较晚或子女教育中易有分歧。时支相冲并不意味着没有子女，而是在子女成长过程中需要更多的耐心与用心。建议双方在子女教育上提前沟通、统一理念，以和谐的家庭氛围化解时支相冲带来的影响。`;
  } else {
    desc += `双方时支（子女宫）关系平和，子女缘分适中，婚后顺其自然可得子女。双方在子女方面的缘分不深不浅，只要用心经营家庭、关爱子女成长，同样能够培养出优秀的下一代。建议在子女教育上互相配合，共同营造温馨和谐的家庭环境。`;
  }
  if (childCnt1 >= 2 && childCnt2 >= 2) {
    desc += `此外，双方子女星皆旺，子女缘分深厚，子女数量与质量都有较好的基础。`;
  } else if (childCnt1 === 0 || childCnt2 === 0) {
    desc += `需要注意的是，一方子女星偏弱，子女缘分方面可能需要更多的时间与耐心，顺其自然不必过于强求。`;
  }

  return { score: Math.round(score), title: '子女缘分', icon: '👶', desc, details };
}

/**
 * 12. 神煞互映（权重 5%）
 * 桃花星、红鸾天喜、孤辰寡宿等神煞对婚姻的影响
 */
function scoreShenSha(bazi1: any, bazi2: any): HePanDimension {
  // 以年支推算各神煞
  const yearZhi1 = bazi1?.fourPillars?.year?.zhi || '';
  const yearZhi2 = bazi2?.fourPillars?.year?.zhi || '';
  const dayZhi1 = bazi1?.fourPillars?.day?.zhi || '';
  const dayZhi2 = bazi2?.fourPillars?.day?.zhi || '';

  // 桃花星（按年支和日支推算）
  const tao1 = TAO_HUA[yearZhi1] || TAO_HUA[dayZhi1] || '';
  const tao2 = TAO_HUA[yearZhi2] || TAO_HUA[dayZhi2] || '';

  // 红鸾星
  const hong1 = HONG_LUAN[yearZhi1] || '';
  const hong2 = HONG_LUAN[yearZhi2] || '';

  // 天喜星
  const xi1 = TIAN_XI[yearZhi1] || '';
  const xi2 = TIAN_XI[yearZhi2] || '';

  // 孤辰寡宿
  const gu1 = GU_CHEN[yearZhi1] || '';
  const gu2 = GU_CHEN[yearZhi2] || '';

  let score = 65;
  const details: string[] = [];
  details.push(`一方桃花星：${tao1}，对方桃花星：${tao2}`);

  // 桃花星互补：一方桃花星出现在对方命局中
  const allZhi1 = [bazi1?.fourPillars?.year?.zhi, bazi1?.fourPillars?.month?.zhi, dayZhi1, bazi1?.fourPillars?.hour?.zhi].filter(Boolean);
  const allZhi2 = [bazi2?.fourPillars?.year?.zhi, bazi2?.fourPillars?.month?.zhi, dayZhi2, bazi2?.fourPillars?.hour?.zhi].filter(Boolean);

  let taoMatch = false;
  if (tao1 && allZhi2.includes(tao1)) { score += 8; taoMatch = true; details.push('一方桃花星入对方命局，异性缘佳'); }
  if (tao2 && allZhi1.includes(tao2)) { score += 8; taoMatch = true; details.push('对方桃花星入一方命局，异性缘佳'); }
  if (tao1 && tao2 && tao1 === tao2) { score += 6; details.push('双方桃花星相同，缘分深厚'); }

  // 红鸾天喜：婚恋吉星
  let hongXiMatch = false;
  if (hong1 && allZhi2.includes(hong1)) { score += 8; hongXiMatch = true; details.push('一方红鸾星入对方命局，婚恋吉兆'); }
  if (hong2 && allZhi1.includes(hong2)) { score += 8; hongXiMatch = true; details.push('对方红鸾星入一方命局，婚恋吉兆'); }
  if (xi1 && allZhi2.includes(xi1)) { score += 6; hongXiMatch = true; details.push('一方天喜星入对方命局，喜庆之兆'); }
  if (xi2 && allZhi1.includes(xi2)) { score += 6; hongXiMatch = true; details.push('对方天喜星入一方命局，喜庆之兆'); }

  // 孤辰寡宿：不利婚姻
  let guMatch = false;
  if (gu1 && allZhi1.includes(gu1)) { score -= 6; guMatch = true; details.push('一方命带孤辰寡宿，需注意感情孤独'); }
  if (gu2 && allZhi2.includes(gu2)) { score -= 6; guMatch = true; details.push('对方命带孤辰寡宿，需注意感情孤独'); }

  if (!taoMatch && !hongXiMatch && !guMatch) {
    details.push('双方神煞无明显互动，影响中性');
  }

  score = Math.max(30, Math.min(100, score));

  let desc = `神煞互映从桃花星、红鸾天喜、孤辰寡宿等传统神煞的角度，分析双方命局中的婚恋吉凶信号。经分析，一方桃花星为${tao1 || '无'}，对方桃花星为${tao2 || '无'}；一方红鸾星为${hong1}、天喜星为${xi1}，对方红鸾星为${hong2}、天喜星为${xi2}。`;
  if (taoMatch) {
    desc += `双方桃花星互入对方命局，异性缘佳，彼此之间有天然的吸引力。桃花星互映意味着双方在感情上有较强的魅力与吸引力，容易一见倾心、互生情愫。这种组合在感情初期尤为甜蜜，但也需注意在婚后保持对彼此的吸引力，避免因桃花过旺而引来不必要的感情困扰。`;
  }
  if (hongXiMatch) {
    desc += `红鸾天喜为传统命理中的婚恋吉星，双方红鸾天喜互入对方命局，是婚恋喜庆之兆。红鸾星主婚恋喜事，天喜星主喜庆消灾，吉星互映预示着双方感情发展顺利，婚姻幸福美满，容易得到上天的眷顾与祝福。这种组合在感情中多有喜庆之事发生，是难得的吉配。`;
  }
  if (guMatch) {
    desc += `需要注意的是，一方或双方命带孤辰寡宿，孤辰寡宿为传统命理中主孤独之神煞，命带此星者在感情中可能易有孤独感，或婚姻中聚少离多。但孤辰寡宿的影响可通过积极的感情经营来化解，建议双方在相处中多关心对方的情感需求，增加陪伴时间，以真心和温暖化解孤寡因素的影响。`;
  }
  if (!taoMatch && !hongXiMatch && !guMatch) {
    desc += `双方神煞之间无明显互动，既无特别突出的婚恋吉星加持，也无明显的不利神煞影响，神煞层面影响中性。感情的成败更多取决于双方自身的经营与付出，只要彼此真心相待、用心经营，同样可以收获美满的婚姻。`;
  }

  return { score: Math.round(score), title: '神煞互映', icon: '🌟', desc, details };
}

// ============================================
// 等级判定
// ============================================

function getLevel(score: number): string {
  if (score >= 90) return '天作之合';
  if (score >= 75) return '佳偶天成';
  if (score >= 60) return '中等匹配';
  if (score >= 45) return '需多磨合';
  return '差异较大';
}

// ============================================
// 双方性格分析
// ============================================

function buildPersonality(bazi: any): { gan: string; xingge: string; traits: string[]; desc: string } {
  const dayGan = bazi?.fourPillars?.day?.gan || '';
  const data = RI_ZHU_XING_GE[dayGan];
  if (!data) {
    return { gan: dayGan, xingge: '待分析', traits: [], desc: '日主数据不完整，暂无法分析性格特征。' };
  }
  const wx = WU_XING[dayGan] || '';
  const xinggeName = `${dayGan}${wx}命`;
  return { gan: dayGan, xingge: xinggeName, traits: data.traits, desc: data.desc };
}

// ============================================
// 建议 / 考验 / 开运 生成
// ============================================

function generateSuggestions(dims: HePanResult['dimensions']): string[] {
  const suggestions: string[] = [];

  // 沟通方式
  if (dims.xingge.score >= 80) {
    suggestions.push('双方性格互补，沟通顺畅，建议保持开放坦诚的交流习惯，遇事多商量、少独断，让彼此在感情中感到被尊重与重视。');
  } else if (dims.xingge.score <= 50) {
    suggestions.push('性格差异较大时，沟通方式尤为重要。建议采用"先倾听后表达"的方式，避免在情绪激动时做决定，学会用对方能接受的方式传达自己的想法。');
  } else {
    suggestions.push('日常相处中保持耐心倾听，遇到分歧时先理解对方立场再表达自己观点，以"我们"而非"你我"的视角共同面对问题。');
  }

  // 冲突处理
  if (dims.rizhu.score <= 50 || dims.fuguigong.score <= 50) {
    suggestions.push('夫妻宫或日柱关系存在冲克，冲突在所难免。建议约定"冷静机制"——争执时先暂停，各自冷静后再沟通，避免在气头上说出伤人的话。');
  } else {
    suggestions.push('感情基础较好，但也需建立健康的冲突处理机制。建议不积压不满，有问题及时沟通化解，以包容和理解的心态面对彼此的不同。');
  }

  // 共同成长
  if (dims.xiyongshen.score >= 80) {
    suggestions.push('喜用神互补佳，双方能互相增旺运势，建议共同制定人生目标，在事业、学习上互相鼓励支持，携手成长、共同进步。');
  } else {
    suggestions.push('保留各自的兴趣与成长空间，在独立中互相成就。建议定期分享彼此的学习与成长心得，让感情在共同进步中不断深化。');
  }

  // 生活习惯
  if (dims.wuxing.score >= 80) {
    suggestions.push('五行互补良好，生活习惯容易协调。建议共同培养健康的生活方式，在饮食、运动、作息上互相监督、互相带动。');
  } else if (dims.wuxing.score <= 50) {
    suggestions.push('五行能量有重叠或冲突，可通过调整居家风水、穿着颜色等方式平衡五行。建议在生活细节上互相迁就，找到双方都舒适的相处节奏。');
  }

  // 家庭关系
  if (dims.shengxiao.score <= 40) {
    suggestions.push('生肖相冲可能影响家庭关系，建议在处理双方长辈关系时格外用心，多创造家庭聚会的温馨时刻，以真诚赢得家人的认可与祝福。');
  } else {
    suggestions.push('维护好与双方家庭的关系，定期探望长辈，在重要节日团聚，让家庭成为感情的助力而非压力。');
  }

  // 事业配合
  if (dims.caiyun.score >= 75) {
    suggestions.push('事业财运互补佳，建议在事业规划上互相支持，发挥各自优势，有条件可共同创业或投资，让感情与事业双丰收。');
  } else {
    suggestions.push('在事业上互相理解与支持，尊重彼此的职业选择，不因工作忙碌而忽视感情，合理分配事业与家庭的时间精力。');
  }

  // 大运/未来
  if (dims.dayun.score >= 75) {
    suggestions.push('当前大运走势同步，宜把握共同好运期推进婚恋、置业等人生大事，在顺境中积蓄能量，为未来打下更坚实的根基。');
  } else if (dims.dayun.score <= 50) {
    suggestions.push('大运走势有交错，一方顺境时多支持另一方。建议在对方低谷期给予更多关爱与鼓励，携手度过人生的起伏。');
  }

  // 控制在 5-8 条
  return suggestions.slice(0, 8);
}

function generateWarnings(dims: HePanResult['dimensions']): string[] {
  const warnings: string[] = [];
  const dimArr: [string, HePanDimension][] = [
    ['五行互补', dims.wuxing],
    ['日柱关系', dims.rizhu],
    ['生肖年支', dims.shengxiao],
    ['喜用神互补', dims.xiyongshen],
    ['十神配对', dims.shishen],
    ['大运同步', dims.dayun],
    ['纳音五行', dims.nayin],
    ['夫妻宫稳定', dims.fuguigong],
    ['性格匹配', dims.xingge],
    ['事业财运', dims.caiyun],
    ['子女缘分', dims.zinv],
    ['神煞互映', dims.shensha],
  ];

  // 按分数升序排列，取最低的几个维度生成考验
  const sorted = dimArr.sort((a, b) => a[1].score - b[1].score);
  const lowest = sorted.filter(d => d[1].score < 60).slice(0, 4);

  for (const [name, dim] of lowest) {
    if (name === '日柱关系' && dim.score <= 50) {
      warnings.push('日柱关系存在冲克，双方性格易有摩擦，感情中可能经历较多波折与考验，需以极大的耐心与包容来化解。');
    } else if (name === '夫妻宫稳定' && dim.score <= 50) {
      warnings.push('夫妻宫受到冲刑害的影响，婚姻稳定性存在隐患，需警惕感情中的波动与变故，以真诚和坚定维护婚姻。');
    } else if (name === '五行互补' && dim.score <= 50) {
      warnings.push('五行互补性不足，命局能量有重叠或冲突，相处中可能感到能量不协调，需通过后天调节平衡五行。');
    } else if (name === '喜用神互补' && dim.score <= 50) {
      warnings.push('喜用神存在冲突，一方的存在可能加重另一方命局不利因素，相处中需注意化解五行相逆的影响。');
    } else if (name === '生肖年支' && dim.score <= 40) {
      warnings.push('生肖相冲相刑，先天缘分有阻，家庭关系和性格磨合方面可能面临较多考验，需双方共同努力克服。');
    } else if (name === '性格匹配' && dim.score <= 50) {
      warnings.push('性格差异较大，日常相处中易产生观念分歧与摩擦，需在磨合中学会换位思考与相互包容。');
    } else if (name === '十神配对' && dim.score <= 50) {
      warnings.push('配偶星偏弱，感情缘分稍薄，婚姻需要更多的用心经营与付出方能长久稳固。');
    } else if (name === '子女缘分' && dim.score <= 50) {
      warnings.push('子女缘分方面或有波折，如得子较晚或子女教育分歧，需提前沟通、顺其自然。');
    } else if (name === '事业财运' && dim.score <= 50) {
      warnings.push('事业财运方面互补不足，家庭经济可能面临一定压力，需合理规划财务、共同奋斗。');
    } else if (name === '纳音五行' && dim.score <= 50) {
      warnings.push('纳音五行相克，先天根基有冲，家族关系方面可能面临一些考验，需用心经营双方家庭关系。');
    } else if (name === '神煞互映' && dim.score <= 50) {
      warnings.push('命带孤辰寡宿等不利神煞，感情中易有孤独感或聚少离多，需以陪伴与关爱化解。');
    } else if (name === '大运同步' && dim.score <= 50) {
      warnings.push('大运走势交错，人生节奏不一致，可能一方顺境时另一方正值逆境，需互相扶持度过低谷。');
    }
  }

  // 不足2条时补充通用考验
  if (warnings.length < 2) {
    warnings.push('任何感情都会面临现实生活的考验，关键在于双方是否愿意以真心和耐心共同面对，在磨合中加深理解与信任。');
  }
  if (warnings.length < 2) {
    warnings.push('感情长久的最大考验往往来自日常琐事，建议在平淡中保持初心，不忘当初相爱的理由。');
  }

  return warnings.slice(0, 4);
}

function generateLuckyTips(
  dims: HePanResult['dimensions'],
  xy1: any,
  xy2: any,
  bazi1: any,
  bazi2: any
): string[] {
  const tips: string[] = [];

  // 综合双方喜用神确定有利五行
  const x1 = getXiYongWx(xy1);
  const x2 = getXiYongWx(xy2);
  const favWx = new Set<string>();
  if (x1) { if (x1.xi) favWx.add(x1.xi); if (x1.yong) favWx.add(x1.yong); }
  if (x2) { if (x2.xi) favWx.add(x2.xi); if (x2.yong) favWx.add(x2.yong); }

  // 如果无喜用神数据，用双方最弱五行作为有利五行
  if (favWx.size === 0) {
    const s1 = getWxStrength(bazi1);
    const s2 = getWxStrength(bazi2);
    favWx.add(getWeakestWx(s1));
    favWx.add(getWeakestWx(s2));
  }

  const wxList = Array.from(favWx).filter(Boolean);

  // 颜色建议
  if (wxList.length > 0) {
    const colors = wxList.map(wx => WX_COLOR[wx]).filter(Boolean);
    if (colors.length > 0) {
      tips.push(`幸运颜色：双方可多穿戴${colors.join('或')}的衣物饰品，有助于增强感情运势与个人气场。`);
    }
  }

  // 方位建议
  if (wxList.length > 0) {
    const dirs = wxList.map(wx => WX_DIRECTION[wx]).filter(Boolean);
    if (dirs.length > 0) {
      tips.push(`幸运方位：约会、旅行宜选${dirs.join('或')}方位，居家床头朝此方位亦有助感情和谐。`);
    }
  }

  // 饰品建议
  if (wxList.length > 0) {
    const accs = wxList.map(wx => WX_ACCESSORY[wx]).filter(Boolean);
    if (accs.length > 0) {
      tips.push(`开运饰品：可佩戴${accs.join('或')}，增强双方有利五行能量，促进感情稳定。`);
    }
  }

  // 五行互补不足时的调节建议
  if (dims.wuxing.score <= 60) {
    const s1 = getWxStrength(bazi1);
    const s2 = getWxStrength(bazi2);
    const missing = [...getMissingWx(s1), ...getMissingWx(s2)];
    if (missing.length > 0) {
      const uniqueMissing = Array.from(new Set(missing));
      tips.push(`五行调节：双方命局缺${uniqueMissing.join('、')}，可在居家装饰中增添此五行元素（如颜色、植物、摆件等）以平衡能量。`);
    }
  }

  // 喜用神互补佳时的共同活动建议
  if (dims.xiyongshen.score >= 80) {
    tips.push('共同开运：喜用神互补佳，建议多一起参加喜庆活动、共同行善积德，以正向能量增旺双方运势与感情。');
  }

  // 通用建议
  if (tips.length < 3) {
    tips.push('心诚则灵：无论风水方位如何调节，最核心的"开运"是双方的真心与用心。以真诚相待、以善良处世，自然福气盈门。');
  }

  return tips.slice(0, 5);
}

function generateFutureForecast(
  dims: HePanResult['dimensions'],
  bazi1: any,
  bazi2: any
): string {
  const d1 = getCurrentDayun(bazi1);
  const d2 = getCurrentDayun(bazi2);

  let forecast = `综合双方命局与大运走势，对未来3-5年的感情走向预测如下：`;

  if (dims.dayun.score >= 75 && dims.rizhu.score >= 70) {
    forecast += `当前双方大运走势同步，日柱缘分深厚，未来数年感情发展顺遂。短期内双方有望在感情上更进一步，推进订婚、结婚等重大事项的时机成熟。中期来看，双方能够携手应对生活中的各种挑战，感情在共同经历中不断加深，婚姻基础日益稳固。`;
  } else if (dims.dayun.score <= 50) {
    forecast += `当前双方大运走势有所交错，未来数年感情可能经历一些起伏与考验。一方顺境时另一方可能正值压力期，需要更多的理解与包容。建议在顺境时多积蓄感情能量，在逆境时互相扶持，共同度过人生的低谷期。只要双方坚定信念，暂时的不同步终将过去，感情会在磨合中更加深厚。`;
  } else if (dims.fuguigong.score <= 50) {
    forecast += `夫妻宫存在一定的不稳定因素，未来数年感情中可能出现一些波折与考验。这些考验可能来自外部环境（如工作压力、家庭变故）或内部矛盾（如沟通不畅、观念分歧）。建议双方提前做好心理准备，以成熟的心态面对挑战，遇事多沟通、少猜疑，在考验中加深对彼此的信任与依赖。`;
  } else {
    forecast += `未来数年感情发展整体平稳，双方能够在平淡中经营出属于自己的幸福。短期内感情稳步推进，中期有望在事业、家庭等方面取得共同进展。建议把握当前平稳期，共同规划未来人生蓝图，为感情的长远发展奠定更加坚实的基础。只要保持初心、用心经营，未来可期。`;
  }

  if (dims.shensha.score >= 75) {
    forecast += `此外，双方命局中婚恋吉星互映，未来数年有望迎来感情上的喜庆之事，是适合推进婚恋大事的有利时机。`;
  }

  return forecast;
}

function generateSummary(
  score: number,
  level: string,
  dims: HePanResult['dimensions'],
  bazi1: any,
  bazi2: any,
  p1: { gan: string; xingge: string },
  p2: { gan: string; xingge: string }
): string {
  const dayGan1 = bazi1?.fourPillars?.day?.gan || '';
  const dayGan2 = bazi2?.fourPillars?.day?.gan || '';
  const sx1 = bazi1?.shengxiao || '';
  const sx2 = bazi2?.shengxiao || '';

  const dimArr: [string, HePanDimension][] = [
    ['五行互补', dims.wuxing],
    ['日柱关系', dims.rizhu],
    ['生肖年支', dims.shengxiao],
    ['喜用神互补', dims.xiyongshen],
    ['十神配对', dims.shishen],
    ['大运同步', dims.dayun],
    ['纳音五行', dims.nayin],
    ['夫妻宫稳定', dims.fuguigong],
    ['性格匹配', dims.xingge],
    ['事业财运', dims.caiyun],
    ['子女缘分', dims.zinv],
    ['神煞互映', dims.shensha],
  ];
  const sorted = [...dimArr].sort((a, b) => b[1].score - a[1].score);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const secondBest = sorted[1];
  const secondWorst = sorted[sorted.length - 2];

  let summary = `本次合盘分析涵盖十二个维度，对双方命局进行了全面深入的匹配度评估。一方日主为${dayGan1}（${p1.xingge}），生肖${sx1}；对方日主为${dayGan2}（${p2.xingge}），生肖${sx2}。双方合盘总分${score}分，属「${level}」。`;

  summary += `从各维度表现来看，${best[0]}表现最佳（${best[1].score}分），${secondBest[0]}次之（${secondBest[1].score}分），这是双方命局中最突出的优势所在，为感情奠定了良好的基础。相对而言，${worst[0]}最为薄弱（${worst[1].score}分），${secondWorst[0]}也有待加强（${secondWorst[1].score}分），这些是双方在感情中需要重点关注的方面。`;

  if (score >= 90) {
    summary += `整体而言，双方命局匹配度极高，属于难得的天作之合。十二个维度中多数表现优异，缘分深厚，先天条件优越。双方在一起能够互相成就、共同成长，是值得珍惜的良缘。建议把握这段难得的缘分，以真心相待，携手共创美好未来。`;
  } else if (score >= 75) {
    summary += `整体而言，双方命局匹配度较高，属于佳偶天成之配。各维度表现整体优良，虽有少数维度需要磨合，但优势明显大于不足。双方在一起能够相互补足、互相增旺，感情发展前景良好。建议在发挥优势的同时，用心改善薄弱环节，让感情更加圆满。`;
  } else if (score >= 60) {
    summary += `整体而言，双方命局匹配度适中，有共同基础也需互相磨合。各维度表现参差不齐，既有亮点也有短板。感情的成功与否取决于双方的经营与付出，只要彼此真心相待、用心经营，同样可以成就一段美好的姻缘。建议发挥优势维度、改善薄弱环节，在磨合中加深理解。`;
  } else if (score >= 45) {
    summary += `整体而言，双方命局匹配度偏弱，差异较多，需双方付出更多的耐心与理解方能长久。多个维度存在不足，感情中可能面临较多的考验与挑战。但这并不意味着感情无法成功，关键在于双方是否有共同面对困难的决心与勇气。建议理性看待差异，以包容和耐心经营感情。`;
  } else {
    summary += `整体而言，双方命局差异较大，各维度匹配度整体偏低。这段感情将面临较多的挑战与考验，需要双方付出极大的努力方能维持。建议理性看待匹配结果，若决意在一起需做好充分的心理准备，以坚定的信念和不懈的努力经营感情，同时也要有面对现实的勇气与智慧。`;
  }

  summary += `命理合盘仅供参考，感情的成功最终取决于双方的真心与努力。无论匹配高低，真诚沟通、相互尊重、共同成长才是感情长久的真谛。`;

  return summary;
}

// ============================================
// 主函数
// ============================================

/**
 * 计算合盘（十二维度增强版）
 * @param bazi1 第一方八字结果（来自 calculateBazi 的返回值）
 * @param bazi2 第二方八字结果
 * @param xiYongShen1 第一方喜用神
 * @param xiYongShen2 第二方喜用神
 */
export function calculateHePan(
  bazi1: any,
  bazi2: any,
  xiYongShen1?: any,
  xiYongShen2?: any
): HePanResult {
  // 十二维评分
  const wuxing = scoreWuxing(bazi1, bazi2);
  const rizhu = scoreRiZhu(bazi1, bazi2);
  const shengxiao = scoreShengXiao(bazi1, bazi2);
  const xiyongshen = scoreXiYongShen(bazi1, bazi2, xiYongShen1, xiYongShen2);
  const shishen = scoreShiShen(bazi1, bazi2);
  const dayun = scoreDayun(bazi1, bazi2);
  const nayin = scoreNaYin(bazi1, bazi2);
  const fuguigong = scoreFuGuiGong(bazi1, bazi2);
  const xingge = scoreXingGe(bazi1, bazi2);
  const caiyun = scoreCaiYun(bazi1, bazi2);
  const zinv = scoreZiNv(bazi1, bazi2);
  const shensha = scoreShenSha(bazi1, bazi2);

  const dimensions = {
    wuxing, rizhu, shengxiao, xiyongshen, shishen, dayun,
    nayin, fuguigong, xingge, caiyun, zinv, shensha,
  };

  // 加权总分（权重总和 = 100%）
  const score = Math.round(
    wuxing.score * 0.12 +
    rizhu.score * 0.15 +
    shengxiao.score * 0.08 +
    xiyongshen.score * 0.10 +
    shishen.score * 0.08 +
    dayun.score * 0.05 +
    nayin.score * 0.05 +
    fuguigong.score * 0.12 +
    xingge.score * 0.08 +
    caiyun.score * 0.07 +
    zinv.score * 0.05 +
    shensha.score * 0.05
  );

  const level = getLevel(score);

  // 双方性格分析
  const personality1 = buildPersonality(bazi1);
  const personality2 = buildPersonality(bazi2);

  // 各项内容生成
  const suggestions = generateSuggestions(dimensions);
  const warnings = generateWarnings(dimensions);
  const luckyTips = generateLuckyTips(dimensions, xiYongShen1, xiYongShen2, bazi1, bazi2);
  const futureForecast = generateFutureForecast(dimensions, bazi1, bazi2);
  const summary = generateSummary(score, level, dimensions, bazi1, bazi2, personality1, personality2);

  return {
    score,
    level,
    dimensions,
    personality1,
    personality2,
    summary,
    suggestions,
    warnings,
    luckyTips,
    futureForecast,
  };
}
