import type {
  BaziResult,
  BaziDetailedAnalysis,
  CareerAnalysis,
  WealthAnalysis,
  MarriageAnalysis,
  HealthAnalysis,
  EducationAnalysis,
  FamilyRelationAnalysis,
  LuckEnhancement,
  PersonalityAnalysis,
  LifeOverview,
  DayunDetail,
  ShiShenCombination,
  GongWeiAnalysis,
} from '@/types';

// ===================================================================
// AI 解读服务模块 v2（Demo）
// 读取 fortune-master-pro 技能文件 → 组装 System Prompt → 调用大模型
// 输出结构与现有规则引擎的 BaziDetailedAnalysis 完全对齐（11 维度）+ 额外总断层
// 这是纯新增文件，不修改任何现有代码
// ===================================================================

// 使用内联的技能数据，避免运行时读取文件系统
const SKILL_FILES: Record<string, string> = {};

function readSkillFile(relativePath: string): string {
  return SKILL_FILES[relativePath] || '';
}

// ====== AI 解读结果类型 ======
// 与规则引擎的 BaziDetailedAnalysis 完全对齐 + 额外的综合层
export interface AIInterpretationResult {
  title: string;
  totalJudgment: string;       // 总断（额外层，规则引擎没有）
  detailedAnalysis: BaziDetailedAnalysis;  // 11 维度，与规则引擎同结构
  closingRemark: string;       // 点醒句（额外层）
  source: 'ai' | 'fallback';
  model?: string;
}

// ====== System Prompt 组装 ======

function getLevelConstraint(level: string): string {
  const map: Record<string, string> = {
    S: '可进入深度精读',
    A: '可做标准版解读',
    B: '使用轻量版框架，重点讲趋势与模式',
    C: '优先做象征性解读',
  };
  return map[level] || map.C;
}

export function buildBaziSystemPrompt(params: {
  style: string;
  depth: string;
  dataLevel: string;
}): string {
  const { style, depth, dataLevel } = params;

  let prompt = '';
  prompt += readSkillFile('SKILL.md');
  prompt += '\n\n---\n\n' + readSkillFile('references/intake-and-routing.md');
  prompt += '\n\n---\n\n' + readSkillFile('references/output-templates.md');
  prompt += '\n\n---\n\n' + readSkillFile('references/safety-and-ethics.md');
  prompt += '\n\n---\n\n' + readSkillFile('references/bazi-framework.md');

  prompt += `

==== 本次请求参数 ====
体系：八字 / 四柱
输出风格：${style}
解读深度：${depth}
资料完整度级别：${dataLevel}（${getLevelConstraint(dataLevel)}）

==== 输出要求 ====
你是一个命理师，需要基于排盘数据，生成一份与规则引擎同结构、但更深、更有串联逻辑的命理解读。

将结果输出为 JSON，结构如下：
{
  "title": "报告标题（如：甲木日主·正官格·事业分析）",
  "totalJudgment": "总断，2-4句，直接说核心气象，要像老师开口定调子",
  "detailedAnalysis": {
    "career": {
      "direction": "事业方向，结合格局+用神+十神组合给出具体方向描述",
      "suitableIndustries": ["行业1","行业2",...],
      "careerCharacter": "职业性格，结合日主和月柱十神",
      "developmentTiming": "发展时机，结合大运判断",
      "peakPeriod": "事业高峰期",
      "advice": "事业建议，具体可执行",
      "classicalRef": "古籍引用"
    },
    "wealth": {
      "type": "财运类型（正财/偏财/兼备/不显）",
      "level": "财运等级",
      "characteristics": "财运特征，结合身强弱和财星力量",
      "peakPeriod": "财运高峰期",
      "investmentAdvice": "理财建议",
      "riskWarning": "风险提示，结合比劫夺财/伤官见官等",
      "classicalRef": "古籍引用"
    },
    "marriage": {
      "spouseCharacter": "配偶特征，结合日支藏干十神",
      "marriageProspect": "婚姻前景",
      "romanticLuck": "桃花运势",
      "favorableAge": "有利婚恋年龄",
      "advice": "感情建议",
      "classicalRef": "古籍引用"
    },
    "health": {
      "constitution": "体质特征，结合日主五行和强弱",
      "weakOrgans": ["易患部位1","部位2",...],
      "healthRisks": "健康风险，结合五行失衡",
      "maintenanceAdvice": "养生建议",
      "dietaryAdvice": "饮食建议",
      "classicalRef": "古籍引用"
    },
    "education": {
      "learningStyle": "学习风格，结合印星食伤",
      "academicPotential": "学业潜力",
      "favorableSubjects": ["学科1","学科2",...],
      "examLuck": "考试运势",
      "advice": "学业建议",
      "classicalRef": "古籍引用"
    },
    "family": {
      "relations": [
        {"relation":"父母","star":"偏财（父）、正印（母）","analysis":"父母关系分析","advice":"建议"},
        {"relation":"兄弟姐妹","star":"比肩、劫财","analysis":"分析","advice":"建议"},
        {"relation":"配偶","star":"（根据性别）","analysis":"分析","advice":"建议"},
        {"relation":"子女","star":"（根据性别）","analysis":"分析","advice":"建议"}
      ],
      "summary": "六亲综述"
    },
    "luck": {
      "luckyColors": ["颜色1","颜色2",...],
      "luckyDirections": ["方位1","方位2",...],
      "luckyNumbers": ["数字1","数字2",...],
      "luckyIndustries": ["行业1","行业2",...],
      "luckyItems": ["物品1","物品2",...],
      "fengShuiAdvice": "风水建议",
      "dailyAdvice": "日常建议"
    },
    "personality": {
      "core": "核心性格",
      "strengths": ["优势1","优势2",...],
      "weaknesses": ["弱势1","弱势2",...],
      "socialStyle": "社交风格",
      "emotionalStyle": "情感模式",
      "thinkingStyle": "思维模式",
      "growthAdvice": "成长建议"
    },
    "lifeOverview": {
      "summary": "一生总体概述",
      "stages": [
        {"period":"少年期（0-15岁）","description":"描述"},
        {"period":"青年期（16-30岁）","description":"描述"},
        {"period":"中年期（31-50岁）","description":"描述"},
        {"period":"晚年期（51岁后）","description":"描述"}
      ],
      "keyAdvice": "关键建议",
      "classicalRef": "古籍引用"
    },
    "dayunInterpretations": [
      {"dayunIndex":0,"analysis":"第1步大运详解..."},
      {"dayunIndex":1,"analysis":"第2步大运详解..."},
      ...
    ],
    "liunianInterpretations": [
      {"year":2024,"analysis":"流年详解..."},
      ...
    ]
  },
  "closingRemark": "点醒句，一句有余味的话收尾"
}

==== 关键要求 ====
1. 每个维度的每个字段都要有实质内容，不能为空或一句话糊弄。
2. 各维度之间要有串联逻辑：比如事业方向要呼应性格分析，财运风险要呼应健康养生。
3. 术语翻译成人话，但保留命理专业度。
4. 大运解读每步都要有：干支、十神、吉凶判断、神煞、事件预测。
5. 流年解读至少覆盖前后10年。
6. 严格遵守安全边界：不出现绝对化断语、恐吓、医疗诊断。
7. 风格"${style}"要贯穿全文。`;

  return prompt;
}

// ====== 用户消息组装 ======

export function buildBaziUserMessage(
  chart: BaziResult,
  xiYongShen: { xi: string; yong: string; ji: string },
  formData: { gender: string; year: number; month: number; day: number; hour: number | null; name?: string }
): string {
  const dayGan = chart.fourPillars.day.gan;
  const geju = chart.geju;
  const wuxingStrength = chart.wuxingStrength;
  const dayun: { ganzhi: string; ageRange: string; shishen: string; shensha: string[] }[] | undefined =
    chart.dayunDetails?.slice(0, 8).map((d: DayunDetail) => ({
      ganzhi: `${d.gan}${d.zhi}`,
      ageRange: `${d.startAge}-${d.endAge}岁`,
      shishen: d.shishen.gan,
      shensha: d.shensha,
    }));
  const liunian = chart.liunian?.filter(ln => Math.abs(ln.year - new Date().getFullYear()) <= 10).map(ln => ({
    year: ln.year,
    age: ln.age,
    ganzhi: `${ln.gan}${ln.zhi}`,
    shishen: ln.shishen,
    shensha: ln.shensha,
  }));

  return `
用户信息：
- 姓名：${formData.name || '未提供'}
- 性别：${formData.gender}
- 出生：${formData.year}年${formData.month}月${formData.day}日 ${formData.hour !== null ? formData.hour + '时' : '时辰未知'}

排盘结果（已由开源库精确计算）：
- 日主：${dayGan}（${getDayMasterElement(dayGan)}）
- 四柱：年 ${chart.fourPillars.year.gan}${chart.fourPillars.year.zhi} | 月 ${chart.fourPillars.month.gan}${chart.fourPillars.month.zhi} | 日 ${chart.fourPillars.day.gan}${chart.fourPillars.day.zhi} | 时 ${chart.fourPillars.hour.gan || '无'}${chart.fourPillars.hour.zhi || ''}
- 五行统计：${JSON.stringify(chart.wuxing)}
- 五行力量：${wuxingStrength ? `最旺=${wuxingStrength.dominant}, 最弱=${wuxingStrength.weakest}, 缺=${wuxingStrength.missing.join('或')}` : '未计算'}
- 格局：${geju ? `${geju.name}（${geju.level}）- ${geju.description}` : '未分析'}
- 喜用神：喜=${xiYongShen.xi}, 用=${xiYongShen.yong}, 忌=${xiYongShen.ji}
- 纳音：${Object.entries(chart.nayin).map(([k, v]) => `${k}:${v}`).join(', ')}
- 藏干：${Object.entries(chart.canggan).map(([k, v]) => `${k}:${(v as string[]).join('')}`).join(', ')}
- 十神：${JSON.stringify(chart.shishen)}
- 十神组合：${chart.shishenCombinations?.map((s: ShiShenCombination) => `${s.combination}(${s.influence})`).join('; ') || '无'}
- 大运（前8步）：${JSON.stringify(dayun)}
- 流年（近10年）：${JSON.stringify(liunian)}
- 宫位：${chart.gongWei?.map((g: GongWeiAnalysis) => `${g.position}(${g.palace}):${g.shiShen}`).join('; ') || '无'}
- 胎元命宫身宫：${chart.taiYuanMingGong ? JSON.stringify(chart.taiYuanMingGong) : '未计算'}

请基于以上排盘数据，生成 11 维度详细命理解读。`;
}

function getDayMasterElement(gan: string): string {
  const map: Record<string, string> = {
    '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
    '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
  };
  return map[gan] || '';
}

// ====== 主调用 ======

export async function generateAIInterpretation(params: {
  chart: BaziResult;
  xiYongShen: { xi: string; yong: string; ji: string };
  formData: { gender: string; year: number; month: number; day: number; hour: number | null; name?: string };
  style?: string;
}): Promise<AIInterpretationResult> {
  const { chart, xiYongShen, formData } = params;
  const style = params.style || 'master';
  const dataLevel = formData.hour !== null ? 'A' : 'B';
  const depth = dataLevel === 'A' ? 'standard' : 'light';

  const systemPrompt = buildBaziSystemPrompt({ style, depth, dataLevel });
  const userMessage = buildBaziUserMessage(chart, xiYongShen, formData);

  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
  const apiBase = process.env.AI_API_BASE || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  const model = process.env.AI_MODEL || 'qwen-max';

  if (!apiKey) {
    return generateFallbackResult(chart, xiYongShen, formData, style);
  }

  try {
    const response = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) throw new Error(`AI API error: ${response.status}`);

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    return {
      title: parsed.title || '八字 AI 解读',
      totalJudgment: parsed.totalJudgment || '',
      detailedAnalysis: parsed.detailedAnalysis as BaziDetailedAnalysis,
      closingRemark: parsed.closingRemark || '',
      source: 'ai',
      model,
    };
  } catch (err) {
    console.error('AI interpretation error:', err);
    return generateFallbackResult(chart, xiYongShen, formData, style);
  }
}

// ====== Fallback 示例数据（无 API Key 时） ======
// 与规则引擎同结构，但文本更像"老师"写的——有串联、有层次、有气韵

function generateFallbackResult(
  chart: BaziResult,
  xiYongShen: { xi: string; yong: string; ji: string },
  formData: { gender: string; year: number; month: number; day: number; hour: number | null; name?: string },
  style: string
): AIInterpretationResult {
  const dayGan = chart.fourPillars.day.gan;
  const dayZhi = chart.fourPillars.day.zhi;
  const gejuName = chart.geju?.name || '正格';
  const dominant = chart.wuxingStrength?.dominant || '土';
  const weakest = chart.wuxingStrength?.weakest || '金';
  const missing = chart.wuxingStrength?.missing || [];
  const dayWx = getDayMasterElement(dayGan);
  const isMale = formData.gender === 'male';
  const ganWxMap: Record<string, string> = { '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水' };
  const findYongDayun = chart.dayunDetails?.find(d => ganWxMap[d.gan] === xiYongShen.yong);
  const hasYin = chart.shishenCombinations?.some(s => s.combination.includes('印'));
  const hasShiShang = chart.shishenCombinations?.some(s => s.combination.includes('食伤'));
  const hasBiJie = chart.shishenCombinations?.some(s => s.combination.includes('比劫'));
  const hasGuanSha = chart.shishenCombinations?.some(s => s.combination.includes('官') || s.combination.includes('杀'));
  const hasCai = chart.shishenCombinations?.some(s => s.combination.includes('财'));
  const hasShangGuan = chart.shishenCombinations?.some(s => s.combination.includes('伤官'));
  const hasPianYin = chart.shishenCombinations?.some(s => s.combination.includes('偏印'));
  const isStrong = dominant === dayWx;
  const hourNote = formData.hour === null ? '【注意】未提供时辰，时柱相关为轻量版，不做定论。' : '';

  // ====== 1. 事业 ======
  const career: CareerAnalysis = {
    direction: `${gejuName}配${dayGan}${dayWx}日主，宜${wxTrait(dominant)}方向，走"先深耕后扩张"路线。${hasGuanSha ? '有官杀组合，适合管理路线。' : ''}${hasShiShang ? '有食伤配合，适合创意变现。' : ''}不宜过早追短期回报。`,
    suitableIndustries: industriesByWx(dayWx),
    careerCharacter: `${dayGan}日主${gejuName}，${ganCharBrief(dayGan)}。${hasYin ? '有印星支撑，善于系统思考。' : ''}${hasBiJie ? '有比劫，独立性强但需防合作摩擦。' : ''}职场中靠"稳"赢，不靠"快"赢。`,
    developmentTiming: findYongDayun ? `当前大运${chart.dayunDetails![0].gan}${chart.dayunDetails![0].zhi}（${chart.dayunDetails![0].startAge}-${chart.dayunDetails![0].endAge}岁），十神${chart.dayunDetails![0].shishen.gan}。${ganWxMap[chart.dayunDetails![0].gan] === xiYongShen.yong ? '走用神运，事业有加速感。' : ganWxMap[chart.dayunDetails![0].gan] === xiYongShen.ji ? '走忌神运，先储备不硬冲。' : '运势平稳，宜守不宜攻。'}` : '中年时期为关键发展期',
    peakPeriod: findYongDayun ? `${findYongDayun.startAge}-${findYongDayun.endAge}岁（${findYongDayun.gan}${findYongDayun.zhi}运）为事业黄金期` : '35-50岁为事业高峰期',
    advice: `把核心一件事做到极致，忌神${xiYongShen.ji}旺时段先储备。适合${dayWx}行相关行业：${industriesByWx(dayWx).join('、')}`,
    classicalRef: '《渊海子平》：格局定方向，用神定成败',
  };

  // ====== 2. 财运 ======
  const caiWx = wxKe(dayWx);
  const caiPct = wuxingStrengthParse(chart, caiWx);
  const wealth: WealthAnalysis = {
    type: `财星${caiWx}行，${missing.includes(caiWx) ? '命中缺财星，财运看大运补入' : caiPct > 15 ? '财星有力' : '财星偏弱'}。偏"配置型"而非"冲刺型"`,
    level: missing.includes(caiWx) ? '财运需培养' : caiPct > 30 ? '财运旺盛' : caiPct > 15 ? '财运不错' : '财运平稳',
    characteristics: `${isStrong ? '身旺能担财' : '身偏弱，担财需大运生扶'}。${missing.length > 0 ? `缺${missing.join('、')}，` : ''}${missing.map(m => wxFinanceBlindSpot(m)).filter(Boolean).join('；') || '财务纪律'}上容易有盲区`,
    peakPeriod: findYongDayun ? `约${findYongDayun.startAge}岁起财运渐旺（${findYongDayun.gan}${findYongDayun.zhi}运）` : '需把握流年财星出现之机',
    investmentAdvice: isStrong ? '身旺可适当配置高回报资产，仍需分散风险。用神年再做较大投入' : '适合稳健理财，以固定收入为主，避免高风险投资',
    riskWarning: `${hasBiJie ? '比劫夺财，防因合伙或借贷破财，不宜与人合伙经营。' : ''}${hasShangGuan ? '伤官见官，事业波折可能影响收入。' : ''}设止损纪律，不追热点，不在情绪上头时做决策`,
    classicalRef: '《渊海子平》：身旺财旺，富贵双全；身弱财多，富屋贫人',
  };

  // ====== 3. 感情婚姻 ======
  const dayZhiSS = chart.canggan[dayZhi]?.length ? (chart.fourPillars.day.gan && chart.canggan[dayZhi][0] ? ganWxMap[chart.canggan[dayZhi][0]] : '') : '';
  const marriage: MarriageAnalysis = {
    spouseCharacter: `日支${dayZhi}配偶宫，藏干${(chart.canggan[dayZhi] || []).join('、') || '无'}。配偶${dayZhiCharBrief(dayZhi)}`,
    marriageProspect: `${isMale ? '男命以财星为妻' : '女命以官星为夫'}，${hasCai || hasGuanSha ? '配偶星显透，姻缘不差' : '配偶星不显，宜晚婚'}。${formData.hour === null ? '时辰未知，配偶宫细节不做定论。' : ''}当前处"关系筛选期"`,
    romanticLuck: `感情中怕投入后节奏失控——要么太急要结果，要么太被动。${hasBiJie ? '比劫旺，感情中可能面临竞争。' : ''}关系是命局课题的镜子`,
    favorableAge: isMale ? '25-35岁为最佳婚恋期，财星早透可早婚，晚现宜晚婚' : '23-30岁为最佳婚恋期，官星早透可早婚，官杀混杂宜晚婚',
    advice: '先把自己站稳再谈深入，选择能欣赏核心特质而非试图改变你的人。用神旺年主动社交',
    classicalRef: '《渊海子平》：男以财为妻，女以官为夫；日支藏干定配偶性情',
  };

  // ====== 4. 健康 ======
  const health: HealthAnalysis = {
    constitution: `日主${dayGan}（${dayWx}），体质以${organByWx(dayWx)}为主。${dominant === dayWx ? `${dayWx}气偏旺，${organSymptom(dayWx, true)}` : weakest === dayWx ? `${dayWx}气不足，${organSymptom(dayWx, false)}` : '五行较平衡，体质良好'}。风险点在"积累"不在"突发"`,
    weakOrgans: weakOrgansList(dayWx, dominant, weakest, missing),
    healthRisks: `${missing.length > 0 ? `缺${missing.join('、')}，${missing.map(m => organByWx(m)).join('、')}功能偏弱。` : ''}${dominant !== dayWx ? `${dominant}过旺，${organByWx(dominant)}负担重。` : ''}非医学诊断，不适请就医`,
    maintenanceAdvice: `${seasonAdvice(dayWx)}${weakest !== dayWx ? `尤其注意${organByWx(weakest)}保养。` : ''}每天留30分钟"不动脑"恢复时间`,
    dietaryAdvice: `${dietByWx(dayWx)}${missing.length > 0 ? ` 缺${missing.join('、')}，多食：${missing.map(m => dietByWx(m)).join('；')}` : ''}`,
    classicalRef: '《黄帝内经》：五行对应五脏，偏盛偏衰皆可为病',
  };

  // ====== 5. 学业 ======
  const education: EducationAnalysis = {
    learningStyle: `${dayWx === '木' ? '系统型，善于搭建知识框架，适合循序渐进' : dayWx === '火' ? '灵感型，善于在讨论实践中学习，适合互动式' : dayWx === '土' ? '踏实型，善于反复练习巩固，适合应用型' : dayWx === '金' ? '严谨型，善于逻辑推理，适合理科法学' : '直觉型，善于触类旁通，适合交叉学科'}。吸收力不差，差在"持续力"`,
    academicPotential: `${hasYin && hasShiShang ? '印星食伤并见，潜力极佳，适合高学历发展' : hasYin ? '印星有力，适合深造研究' : hasShiShang ? '食伤有力，适合应用型创新学科' : '需靠勤奋，找对方法坚持不懈'}`,
    favorableSubjects: subjectsByWx(dayWx),
    examLuck: `${hasGuanSha && hasYin ? '官印相生，逢考运佳，适合公务员、资格证' : hasYin ? '印星有力，备考发挥稳定' : hasShangGuan ? '才思敏捷但易粗心，注意审题' : '需充分准备，制定合理复习计划'}`,
    advice: '固定最佳学习时段，大目标拆小任务，考前不追新知识只复习已学。每天保证1小时不被打扰的专注时间',
    classicalRef: '《渊海子平》：印星主文，食伤主智；文昌入命，学业有成',
  };

  // ====== 6. 六亲 ======
  const family: FamilyRelationAnalysis = {
    relations: [
      { relation: '父母', star: '偏财（父）、正印（母）', analysis: `${hasCai && hasYin ? '财印并见，父母双全，关系整体和睦但可能有摩擦' : hasYin ? '印星显透财星不显，与母亲更亲近' : hasCai ? '财星显透印星不显，与父亲更亲近' : '财印均不显，与父母缘分需看大运流年'}`, advice: '孝敬父母是立身之本，常回家看看' },
      { relation: '兄弟姐妹', star: '比肩、劫财', analysis: `${hasBiJie ? '比劫显透，有兄弟姐妹缘，可互相扶持。过多时防资源分配摩擦' : '比劫不显，兄弟姐妹缘薄或为独生子女'}`, advice: '互相帮助，不计较小事' },
      { relation: '配偶', star: isMale ? '正财/偏财' : '正官/七杀', analysis: `${hasCai || hasGuanSha ? '配偶星显透，姻缘不差' : '配偶星不显，宜等待时机'}。日支${dayZhi}决定配偶基本气质`, advice: '婚姻需经营，但"经营"不是"忍耐"——长期消耗说明节奏不对' },
      { relation: '子女', star: isMale ? '正官/七杀' : '食神/伤官', analysis: `${hasGuanSha || hasShiShang ? '子女星显透，子女缘好' : '子女星不显，需看大运流年'}。${formData.hour === null ? '时辰未知，子女宫细节不做定论。' : ''}`, advice: '教育重在身教，给安全感同时培养独立品格' },
    ],
    summary: '六亲以十神为标、宫位为本。每段关系中的卡点往往是命局最需修的课题的外显',
  };

  // ====== 7. 开运 ======
  const luck: LuckEnhancement = {
    luckyColors: luckColors(xiYongShen.yong),
    luckyDirections: luckDirections(xiYongShen.yong),
    luckyNumbers: luckNumbers(xiYongShen.yong),
    luckyIndustries: industriesByWx(xiYongShen.yong),
    luckyItems: luckItems(xiYongShen.yong),
    fengShuiAdvice: `用神${xiYongShen.yong}对应方位${luckDirections(xiYongShen.yong).join('、')}。床头/办公宜朝此方位，可摆${luckItems(xiYongShen.yong).slice(0, 2).join('、')}${missing.length > 0 ? `。五行缺${missing.join('、')}，生活中多补充对应元素` : ''}`,
    dailyAdvice: `多穿戴${luckColors(xiYongShen.yong).join('、')}色系，用含${luckNumbers(xiYongShen.yong).join('、')}的数字，多接触${xiYongShen.yong}行相关环境。开运本质是调整状态让判断更准`,
  };

  // ====== 8. 性格 ======
  const personality: PersonalityAnalysis = {
    core: `${dayGan}日主${dayWx}，${gejuName}。性格底色"${wxPersonality(dayWx)}"${chart.fourPillars.month.gan ? '。月柱' + monthInfluence(dayGan, chart.fourPillars.month.gan) : ''}`,
    strengths: personalityStrengths(dayGan, chart),
    weaknesses: personalityWeaknesses(dayGan, chart),
    socialStyle: `${hasCai ? '善于交际应酬，在社交场合如鱼得水' : hasYin ? '内敛，偏好小圈子深交，朋友不多但知心' : hasBiJie ? '直爽重义气，喜欢与朋友交往' : '温和，不强求社交但也乐于相处'}。消耗点在"质量"不在"数量"`,
    emotionalStyle: `${hasYin ? '丰富但内敛，善照顾人，易心软' : hasShangGuan ? '表达直接热烈，喜怒形于色，易情绪化' : hasGuanSha ? '强烈但控制力强，不轻易表露，爆发来势汹汹' : '踏实稳定，重细水长流'}。投入后容易用力过猛`,
    thinkingStyle: `${hasYin ? '缜密系统，善归纳总结，逻辑清晰' : hasPianYin ? '跳跃发散，善触类旁通，直觉敏锐' : hasShangGuan ? '敏捷创新，善打破常规，反应快' : hasShiShang ? '灵活感性，善从实践中学习' : '均衡，灵活与严谨兼备'}。决策偏"先想后动"，想太久变内耗`,
    growthAdvice: `${weaknessesTarget(dayGan)}${missing.length > 0 ? `。缺${missing.join('、')}在${missing.map(m => wxTrait(m, true)).join('、')}方向有盲区，需找互补的人或环境` : ''}`,
  };

  // ====== 9. 一生综述 ======
  const lifeOverview: LifeOverview = {
    summary: `${dayGan}日主（${dayWx}），${gejuName}。${hourNote}整体气象"先蓄后发"——厚积型。用神${xiYongShen.yong}，忌神${xiYongShen.ji}。前半段压着走，后半段才显。关键不在"有没有运"，在"运来接不接得住"`,
    stages: [
      { period: '少年期（0-15岁）', description: `年柱${chart.fourPillars.year.gan}${chart.fourPillars.year.zhi}主导，祖辈宫。早年环境受祖辈父母影响大，塑造底层安全感` },
      { period: '青年期（16-30岁）', description: `月柱${chart.fourPillars.month.gan}${chart.fourPillars.month.zhi}主导，父母宫。格局显现期，学业和初入社会为重点。${gejuName}决定方向。容易急着要结果——但命局不适合急` },
      { period: '中年期（31-50岁）', description: `日柱${chart.fourPillars.day.gan}${chart.fourPillars.day.zhi}主导，配偶宫。事业家庭并重。${findYongDayun ? `大运有利，${findYongDayun.startAge}岁起为黄金期` : '需把握流年机遇，稳扎稳打'}。前期积累开始变现` },
      { period: '晚年期（51岁后）', description: `${formData.hour ? `时柱${chart.fourPillars.hour.gan}${chart.fourPillars.hour.zhi}主导，子女宫。` : '时柱缺失（三柱论命）。'}后半段比前半段顺，关键是前期不分散精力。积蓄和健康是两大根基` },
    ],
    keyAdvice: `${isStrong ? '身旺宜克泄耗，选官杀、食伤、财星相关行业，大运走财官运为佳。不可过于刚强，学会柔韧' : '身偏弱宜生扶，选印星、比劫相关行业，大运走印比运为佳。保重身体，不过度操劳'}`,
    classicalRef: '《滴天髓》：人道顺逆，天之道也；运之否泰，人之道也',
  };

  // ====== 10. 大运详解 ======
  const dayunInterpretations = (chart.dayunDetails || []).slice(0, 8).map((dy, idx) => {
    const ganWx = ganWxMap[dy.gan];
    const isYong = ganWx === xiYongShen.yong;
    const isJi = ganWx === xiYongShen.ji;

    let analysis = `第${idx + 1}步大运 ${dy.gan}${dy.zhi}（${dy.startAge}-${dy.endAge}岁，${dy.startYear}-${dy.endYear}年）。天干${dy.gan}（${ganWx}，${dy.shishen.gan}），地支${dy.zhi}。`;

    if (isYong && !isJi) analysis += `用神运，${xiYongShen.yong}到位，运势顺利。${idx < 3 ? '但勿急躁，根基未稳就扩张适得其反' : '可大胆推进，前期积累可变现'}`;
    else if (isJi && !isYong) analysis += `忌神运，${xiYongShen.ji}当令，需谨慎。防破财、是非、健康问题。重在"守"不在"攻"`;
    else if (isYong && isJi) analysis += `用忌参半，前五年看天干后五年看地支。是"磨"的阶段，关键是心不乱`;
    else analysis += `平平，非用非忌。宜守不宜攻，积蓄力量等时机。别让自己太舒服`;

    if (dy.shensha?.length) {
      analysis += `。带${dy.shensha.join('、')}`;
      if (dy.shensha.includes('天乙贵人')) analysis += '，有贵人逢凶化吉';
      if (dy.shensha.includes('驿马')) analysis += '，驿马星动，防搬迁出差';
      if (dy.shensha.includes('羊刃')) analysis += '，羊刃当头，注意安全破财';
    }

    const ss = dy.shishen.gan;
    const ssEvents: Record<string, string> = {
      '正官': '事业有升迁之机', '七杀': '面临压力但有突破机会', '正财': '收入稳定财运不错',
      '偏财': '有意外之财但需把握分寸', '正印': '学业有利有贵人', '偏印': '思维活跃适合学新技能',
      '食神': '生活安逸有口福', '伤官': '才华发挥但注意言行', '比肩': '人际好有朋友助力', '劫财': '防破财不宜合伙',
    };
    if (ssEvents[ss]) analysis += `。天干${ss}，${ssEvents[ss]}`;

    return { dayunIndex: idx, analysis };
  });

  // ====== 11. 流年详解 ======
  const currentYear = new Date().getFullYear();
  const liunianInterpretations = (chart.liunian || [])
    .filter(ln => Math.abs(ln.year - currentYear) <= 10)
    .map(ln => {
      const ganWx = ganWxMap[ln.gan];
      const isYong = ganWx === xiYongShen.yong;
      const isCurrent = ln.year === currentYear;
      let analysis = `${ln.year}年（${ln.age}岁）${ln.gan}${ln.zhi}。`;
      if (ln.shishen) {
        analysis += `十神${ln.shishen}。`;
        const ssEvents: Record<string, string> = {
          '正官': '事业有升迁之机', '七杀': '面临压力但有突破机会', '正财': '收入稳定',
          '偏财': '有意外之财但需把握', '正印': '学业有利有贵人', '偏印': '思维活跃适合学习',
          '食神': '生活安逸有口福', '伤官': '才华发挥注意言行', '比肩': '人际好有朋友助力', '劫财': '防破财不宜合伙',
        };
        if (ssEvents[ln.shishen]) analysis += ssEvents[ln.shishen] + '。';
      }
      if (ln.shensha?.length) {
        analysis += `带${ln.shensha.join('、')}`;
        if (ln.shensha.includes('天乙贵人')) analysis += '，有贵人';
        if (ln.shensha.includes('文昌贵人')) analysis += '，文运亨通适合考试';
      }
      if (isYong) analysis += `。流年用神${xiYongShen.yong}，运势顺利宜进取`;
      if (isCurrent) analysis += '。【今年流年】';
      return { year: ln.year, analysis };
    });

  const detailedAnalysis: BaziDetailedAnalysis = {
    career,
    wealth,
    marriage,
    health,
    education,
    family,
    luck,
    personality,
    lifeOverview,
    dayunInterpretations,
    liunianInterpretations,
  };

  return {
    title: `八字命理解读 · ${dayGan}${dayWx}日主 · ${gejuName}`,
    totalJudgment: `${hourNote}你命里的底子不是没有运，而是前半段更像压着走，后半段才开始显出来。日主${dayGan}配${gejuName}，五行最旺是${dominant}，最弱是${weakest}，整体气象偏"先蓄后发"——不是急冲型，是厚积型。用神${xiYongShen.yong}，忌神${xiYongShen.ji}，运来时能不能接住，取决于你前期积蓄了多少。`,
    detailedAnalysis,
    closingRemark: '你现在最需要的，不是更急，而是更准。盘里给的是方向，真正落地的，还是你的选择和行动。',
    source: 'fallback',
    model: 'demo-fallback',
  };
}

// ====== 辅助函数 ======

function wxTrait(wx: string, weak: boolean = false): string {
  const traits: Record<string, [string, string]> = {
    '木': ['规划、生长、向上推进', '长期规划和坚持'],
    '火': ['表达、热情、显化', '主动出击和行动'],
    '土': ['承载、稳定、务实', '落地执行和稳定'],
    '金': ['决断、执行、效率', '边界感和决断'],
    '水': ['感受、洞察、流动', '情绪流动和变通'],
  };
  return traits[wx]?.[weak ? 1 : 0] || '综合发展';
}

function industriesByWx(wx: string): string[] {
  const map: Record<string, string[]> = {
    '木': ['教育', '文化', '医疗', '林业', '出版', '家具'],
    '火': ['传媒', '演艺', '能源', '电力', '餐饮', '广告'],
    '土': ['房地产', '建筑', '农业', '矿业', '陶瓷', '仓储'],
    '金': ['金融', '法律', '机械', '制造', '军警', '五金'],
    '水': ['贸易', '物流', '旅游', '传媒', 'IT', '航运'],
  };
  return map[wx] || map['土'];
}

function subjectsByWx(wx: string): string[] {
  const map: Record<string, string[]> = {
    '木': ['文学', '历史', '哲学', '中医', '林业', '教育'],
    '火': ['艺术', '传媒', '电子工程', '能源', '心理学', '表演'],
    '土': ['建筑', '地理', '农业', '经济', '考古', '地质'],
    '金': ['法律', '金融', '机械工程', '计算机', '物理', '数学'],
    '水': ['商业管理', '外语', '物流', '化学', '生物', '传媒'],
  };
  return map[wx] || map['土'];
}

function wxKe(wx: string): string {
  const map: Record<string, string> = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' };
  return map[wx] || '土';
}

function wuxingStrengthParse(chart: BaziResult, wx: string): number {
  if (!chart.wuxingStrength) return 0;
  return Math.round((chart.wuxingStrength.strengths[wx] || 0) / chart.wuxingStrength.total * 100);
}

function wxFinanceBlindSpot(wx: string): string {
  const map: Record<string, string> = {
    '金': '财务边界和风险控制',
    '木': '长期财富规划',
    '火': '变现和营销',
    '土': '资产沉淀',
    '水': '流动性管理',
  };
  return map[wx] || '';
}

function organByWx(wx: string): string {
  const map: Record<string, string> = {
    '木': '肝胆、筋骨、眼睛、神经系统',
    '火': '心脏、血液循环、血压、小肠',
    '土': '脾胃、消化系统、肌肉、口腔',
    '金': '肺部、呼吸系统、皮肤、大肠',
    '水': '肾脏、泌尿系统、耳朵、骨骼',
  };
  return map[wx] || '脾胃';
}

function organSymptom(wx: string, strong: boolean): string {
  const map: Record<string, [string, string]> = {
    '木': ['肝气偏旺，易怒头痛', '肝血不足，视力下降，筋骨酸痛'],
    '火': ['心火旺盛，血压偏高，失眠多梦', '心血不足，心悸气短'],
    '土': ['脾胃湿热，消化不良', '脾胃虚寒，食欲不振'],
    '金': ['肺气壅塞，咳嗽痰多', '肺气不足，易感冒'],
    '水': ['肾水偏旺，畏寒浮肿', '肾气不足，腰膝酸软'],
  };
  return map[wx]?.[strong ? 0 : 1] || '';
}

function weakOrgansList(dayWx: string, dominant: string, weakest: string, missing: string[]): string[] {
  const result: string[] = [];
  result.push(...(organByWx(weakest).split('、')));
  if (dominant !== dayWx) result.push(...(organByWx(dominant).split('、').slice(0, 2)));
  for (const mwx of missing) {
    result.push(...(organByWx(mwx).split('、').slice(0, 2)));
  }
  return Array.from(new Set(result));
}

function seasonAdvice(wx: string): string {
  const map: Record<string, string> = {
    '木': '春季为重点养生期，保持心情舒畅，少生气，早睡早起',
    '火': '夏季注意防暑降温，避免过度操劳，保持充足睡眠',
    '土': '四季均需注意脾胃保养，饮食规律，避免暴饮暴食',
    '金': '秋季注意润肺防燥，多做有氧运动，注意保暖',
    '水': '冬季注意保暖防寒，适当进补，避免过度劳累',
  };
  return map[wx] || '注意四季调养，保持规律作息。';
}

function dietByWx(wx: string): string {
  const map: Record<string, string> = {
    '木': '宜食绿色食物、酸味食物，如绿叶蔬菜、柠檬、醋。少食油腻。',
    '火': '宜食红色食物、苦味食物，如红枣、苦瓜、莲子心。少食辛辣。',
    '土': '宜食黄色食物、甘味食物，如小米、南瓜、山药。忌生冷。',
    '金': '宜食白色食物、辛味食物，如白萝卜、百合、银耳。少食寒凉。',
    '水': '宜食黑色食物、咸味食物，如黑豆、海带、紫菜。少食过咸。',
  };
  return map[wx] || '饮食宜均衡，不偏食。';
}

function luckColors(wx: string): string[] {
  const map: Record<string, string[]> = {
    '金': ['白色', '银色', '金色'], '木': ['绿色', '青色'], '水': ['黑色', '深蓝色'],
    '火': ['红色', '紫色', '橙色'], '土': ['黄色', '棕色', '米色'],
  };
  return map[wx] || map['土'];
}
function luckDirections(wx: string): string[] {
  const map: Record<string, string[]> = {
    '金': ['西方', '西北方'], '木': ['东方', '东南方'], '水': ['北方'],
    '火': ['南方'], '土': ['中央', '西南方', '东北方'],
  };
  return map[wx] || map['土'];
}
function luckNumbers(wx: string): string[] {
  const map: Record<string, string[]> = {
    '金': ['4', '9'], '木': ['1', '6'], '水': ['1', '6'],
    '火': ['2', '7'], '土': ['5', '0'],
  };
  return map[wx] || map['土'];
}
function luckItems(wx: string): string[] {
  const map: Record<string, string[]> = {
    '金': ['金属饰品', '白水晶', '金银手镯'], '木': ['木质饰品', '翡翠', '绿幽灵水晶', '植物'],
    '水': ['黑曜石', '蓝水晶', '鱼缸', '流水摆件'], '火': ['红玛瑙', '紫水晶', '红色饰品', '灯光装饰'],
    '土': ['黄水晶', '陶器', '玉石', '石质摆件'],
  };
  return map[wx] || map['土'];
}

function wxPersonality(wx: string): string {
  const map: Record<string, string> = {
    '木': '仁慈正直有进取心，像树一样向上生长',
    '火': '热情开朗有感染力，像火一样照亮周围',
    '土': '稳重踏实有包容心，像大地一样承载',
    '金': '刚毅果断有执行力，像金属一样锋利',
    '水': '聪明灵活善变通，像水一样随物赋形',
  };
  return map[wx] || '性格需综合四柱分析';
}

function wxOS(wx: string): string {
  const map: Record<string, string> = {
    '木': '生长、规划、向上、原则——你的驱动力来自"想变得更好"',
    '火': '表达、热情、显化、冲劲——你的驱动力来自"想被看见"',
    '土': '承载、现实、稳定、顾虑——你的驱动力来自"想要安全感"',
    '金': '规则、决断、边界、效率——你的驱动力来自"想做到极致"',
    '水': '流动、感受、洞察、变化——你的驱动力来自"想理解一切"',
  };
  return map[wx] || '';
}

function monthInfluence(dayGan: string, monthGan: string): string {
  const shiShenMap: Record<string, Record<string, string>> = {
    '甲': { '甲': '比肩', '乙': '劫财', '丙': '食神', '丁': '伤官', '戊': '偏财', '己': '正财', '庚': '七杀', '辛': '正官', '壬': '偏印', '癸': '正印' },
  };
  // 简化：用通用十神表
  const allSS: Record<string, Record<string, string>> = {
    '甲': { '甲': '比肩', '乙': '劫财', '丙': '食神', '丁': '伤官', '戊': '偏财', '己': '正财', '庚': '七杀', '辛': '正官', '壬': '偏印', '癸': '正印' },
    '乙': { '甲': '劫财', '乙': '比肩', '丙': '伤官', '丁': '食神', '戊': '正财', '己': '偏财', '庚': '正官', '辛': '七杀', '壬': '正印', '癸': '偏印' },
    '丙': { '甲': '偏印', '乙': '正印', '丙': '比肩', '丁': '劫财', '戊': '食神', '己': '伤官', '庚': '偏财', '辛': '正财', '壬': '七杀', '癸': '正官' },
    '丁': { '甲': '正印', '乙': '偏印', '丙': '劫财', '丁': '比肩', '戊': '伤官', '己': '食神', '庚': '正财', '辛': '偏财', '壬': '正官', '癸': '七杀' },
    '戊': { '甲': '七杀', '乙': '正官', '丙': '偏印', '丁': '正印', '戊': '比肩', '己': '劫财', '庚': '食神', '辛': '伤官', '壬': '偏财', '癸': '正财' },
    '己': { '甲': '正官', '乙': '七杀', '丙': '正印', '丁': '偏印', '戊': '劫财', '己': '比肩', '庚': '伤官', '辛': '食神', '壬': '正财', '癸': '偏财' },
    '庚': { '甲': '偏财', '乙': '正财', '丙': '七杀', '丁': '正官', '戊': '偏印', '己': '正印', '庚': '比肩', '辛': '劫财', '壬': '食神', '癸': '伤官' },
    '辛': { '甲': '正财', '乙': '偏财', '丙': '正官', '丁': '七杀', '戊': '正印', '己': '偏印', '庚': '劫财', '辛': '比肩', '壬': '伤官', '癸': '食神' },
    '壬': { '甲': '食神', '乙': '伤官', '丙': '偏财', '丁': '正财', '戊': '七杀', '己': '正官', '庚': '偏印', '辛': '正印', '壬': '比肩', '癸': '劫财' },
    '癸': { '甲': '伤官', '乙': '食神', '丙': '正财', '丁': '偏财', '戊': '正官', '己': '七杀', '庚': '正印', '辛': '偏印', '壬': '劫财', '癸': '比肩' },
  };
  const ss = allSS[dayGan]?.[monthGan] || '';
  const influence: Record<string, string> = {
    '正官': '性格中增添正直守规矩的特质，有责任感',
    '七杀': '性格中增添刚毅果断的特质，有魄力',
    '正印': '性格中增添温和善良的特质，有耐心',
    '偏印': '性格中增添思维独特的特质，有洞察力',
    '正财': '性格中增添踏实勤俭的特质，重实际',
    '偏财': '性格中增添慷慨大方的特质，善交际',
    '食神': '性格中增添温和有才华的特质，有口福',
    '伤官': '性格中增添聪明才智的特质，有创造力',
    '比肩': '性格中增添独立自主的特质，有主见',
    '劫财': '性格中增添好胜竞争的特质，有冲劲',
  };
  return influence[ss] || '';
}

function personalityStrengths(dayGan: string, chart: BaziResult): string[] {
  const result: string[] = [];
  const ss = chart.shishen;
  if (Object.values(ss).some(v => v === '正官')) result.push('有责任感');
  if (Object.values(ss).some(v => v === '正印')) result.push('有耐心');
  if (Object.values(ss).some(v => v === '食神')) result.push('有才华');
  if (Object.values(ss).some(v => v === '偏财')) result.push('善交际');
  if (Object.values(ss).some(v => v === '比肩')) result.push('有主见');
  result.push(wxTrait(getDayMasterElement(dayGan)));
  return Array.from(new Set(result)).slice(0, 6);
}

function personalityWeaknesses(dayGan: string, chart: BaziResult): string[] {
  const result: string[] = [];
  const ss = chart.shishen;
  if (Object.values(ss).some(v => v === '七杀')) result.push('易急躁');
  if (Object.values(ss).some(v => v === '伤官')) result.push('易傲慢');
  if (Object.values(ss).some(v => v === '劫财')) result.push('易冲动');
  if (Object.values(ss).some(v => v === '偏印')) result.push('易多疑');
  result.push(wxTrait(getDayMasterElement(dayGan), true) + '上容易卡住');
  return Array.from(new Set(result)).slice(0, 5);
}

function ganCharBrief(gan: string): string {
  const map: Record<string, string> = {
    '甲': '刚直有主见，不善变通', '乙': '柔韧善适应，容易犹豫',
    '丙': '热情有感染力，容易三分钟热度', '丁': '细腻有洞察力，容易内耗',
    '戊': '稳重有承载力，容易保守', '己': '踏实有包容力，容易被动',
    '庚': '果断有执行力，容易刚硬', '辛': '精炼有标准感，容易挑剔',
    '壬': '灵活有变通力，容易散', '癸': '深沉有洞察力，容易想太多',
  };
  return map[gan] || '性格需综合四柱分析';
}

function dayZhiCharBrief(zhi: string): string {
  const map: Record<string, string> = {
    '子': '情绪感应强，善于察言观色，但容易过度解读', '午': '热情直接，但容易冲动',
    '丑': '踏实稳重，有承载力，但可能略显保守', '未': '温和细腻，善于照顾人',
    '寅': '行动力强，独立有主见，但需要学习表达需求', '卯': '温和有礼，但容易优柔',
    '辰': '稳重有格局，但容易固执', '戌': '忠诚可靠，但容易较真',
    '巳': '灵活善变，但容易急躁', '申': '果断干练，但容易过于理性',
    '酉': '精致有品味，但容易挑剔', '亥': '深沉有智慧，但容易想太多',
  };
  return map[zhi] || '性格需结合大运流年综合分析';
}

function weaknessesTarget(dayGan: string): string {
  const map: Record<string, string> = {
    '甲': '学会灵活变通，多听取不同意见，适当放松控制欲',
    '乙': '增强决断力，不要过度分析，学会在不确定中做决定',
    '丙': '培养耐心和定力，三思而后行，避免三分钟热度',
    '丁': '增强心理韧性，不要过分在意他人评价',
    '戊': '学会放下过度保守，敢于尝试新事物',
    '己': '增强主动性，不要总等别人先动',
    '庚': '学会柔韧，刚过易折，适当放软身段',
    '辛': '降低完美主义，学会"够好就行"',
    '壬': '培养专注力，不要同时铺开太多线',
    '癸': '减少内耗，学会"想了就做"',
  };
  return map[dayGan] || '发挥自身优势，同时注意改善薄弱环节';
}
