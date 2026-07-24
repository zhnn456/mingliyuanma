/**
 * 紫微斗数命理解析
 */

// 十四主星解析
export const MAIN_STAR_INTERPRETATION: Record<string, {
  nature: string;
  personality: string;
  career: string;
  wealth: string;
  emotion: string;
  health: string;
}> = {
  '紫微': { nature: '帝星', personality: '领导力强，气质高贵，有王者风范。为人正直大方，有组织能力，但有时显得高傲。', career: '适合管理层、政界、大企业领导岗位', wealth: '财运亨通，善于理财，有聚财能力', emotion: '感情中较为强势，需要崇拜自己的对象', health: '注意脾胃保养，避免过度操劳' },
  '天机': { nature: '智星', personality: '聪明机智，思维敏捷，善于谋略。学习能力强，但有时想太多，容易焦虑。', career: '适合策划、顾问、技术研究、玄学', wealth: '偏财运佳，善于发现投资机会', emotion: '感情细腻，但容易想太多导致患得患失', health: '注意神经系统和睡眠质量' },
  '太阳': { nature: '贵星', personality: '热情开朗，光明磊落，有博爱精神。乐于助人，有公众影响力，但有时过于操劳。', career: '适合政界、传媒、演艺、公益事业', wealth: '正财运佳，靠名气和人脉赚钱', emotion: '感情热烈，对伴侣慷慨大方', health: '注意眼睛和头部保养' },
  '武曲': { nature: '财星', personality: '刚毅果断，有商业头脑。做事干脆利落，执行力强，但有时显得固执。', career: '适合金融、军警、体育、技术行业', wealth: '财运极佳，是最容易发财的主星', emotion: '感情中较为直接，不善于表达浪漫', health: '注意呼吸系统和肺部' },
  '天同': { nature: '福星', personality: '温和善良，知足常乐。有艺术天赋，人缘好，但有时缺乏进取心。', career: '适合文艺、社工、服务业、教育', wealth: '财运平稳，不追求大富大贵', emotion: '感情温馨甜蜜，是理想伴侣', health: '注意肾脏和泌尿系统' },
  '廉贞': { nature: '囚星/桃花星', personality: '性格复杂，既有领导力又有桃花性质。聪明能干，但容易感情用事。', career: '适合政界、法律、演艺、电子科技', wealth: '财运起伏大，需注意投资风险', emotion: '感情丰富，异性缘佳，但需防感情纠葛', health: '注意心脏和血液循环' },
  '天府': { nature: '禄星', personality: '稳重大方，有包容心。善于守财，有长者之风，但有时过于保守。', career: '适合金融、地产、管理、餐饮', wealth: '财运极佳，是天生的守财高手', emotion: '感情稳定，对家庭负责', health: '注意消化系统，饮食宜节制' },
  '太阴': { nature: '富星', personality: '温柔细腻，内心丰富。有艺术修养，善于体察他人，但有时多愁善感。', career: '适合文化、房地产、设计、医药', wealth: '财运佳，尤其不动产投资运好', emotion: '感情含蓄，追求精神层面的共鸣', health: '注意眼睛和妇科/泌尿系统' },
  '贪狼': { nature: '欲望之星', personality: '多才多艺，好奇心强。善于交际，有桃花性质，但有时贪多嚼不烂。', career: '适合演艺、公关、宗教、玄学', wealth: '偏财运佳，善于把握机会', emotion: '异性缘极佳，感情丰富但需防桃花劫', health: '注意肝脏和肾脏' },
  '巨门': { nature: '暗星', personality: '口才了得，善于分析。有研究精神，洞察力强，但有时过于多疑。', career: '适合律师、教师、医生、分析师', wealth: '靠口才和专业赚钱，财运平稳', emotion: '感情中容易多疑，需要建立信任', health: '注意口腔和肠胃' },
  '天相': { nature: '印星', personality: '正直善良，有服务精神。善于协调，人缘好，但有时过于在意他人看法。', career: '适合公务员、秘书、人力资源、服务业', wealth: '财运平稳，善于理财', emotion: '感情忠诚，是可靠的伴侣', health: '注意脾胃和皮肤' },
  '天梁': { nature: '荫星', personality: '正直清高，有长者风范。乐于助人，逢凶化吉，但有时过于说教。', career: '适合医疗、教育、慈善、宗教', wealth: '财运平稳，晚年财运佳', emotion: '感情中像长辈般照顾对方', health: '注意神经系统和筋骨' },
  '七杀': { nature: '将星', personality: '刚毅果决，有魄力。敢于冒险，执行力强，但有时过于冲动。', career: '适合军警、运动员、企业家、外科医生', wealth: '财运起伏大，有暴富机会', emotion: '感情热烈但来得快去得快', health: '注意肝胆和意外伤害' },
  '破军': { nature: '耗星', personality: '敢于变革，不拘一格。创新能力强，有开拓精神，但有时破坏力强。', career: '适合创业、科技、艺术、探险', wealth: '财运大起大落，适合高风险投资', emotion: '感情多变，需要稳定的伴侣', health: '注意呼吸系统和意外伤害' },
};

// 十二宫位含义
export const PALACE_MEANING: Record<string, { area: string; description: string }> = {
  '命宫': { area: '一生格局', description: '代表先天命格、性格特质、一生总体格局' },
  '兄弟': { area: '兄弟姐妹', description: '代表兄弟姐妹关系、合伙事业、朋友往来' },
  '夫妻': { area: '婚姻感情', description: '代表婚姻状况、感情生活、配偶特质' },
  '子女': { area: '子女晚辈', description: '代表子女缘分、生育能力、晚辈关系' },
  '财帛': { area: '财运收入', description: '代表赚钱能力、理财方式、财运好坏' },
  '疾厄': { area: '健康状况', description: '代表身体状况、易患疾病、健康提醒' },
  '迁移': { area: '外出运势', description: '代表出外运势、旅行搬迁、社会活动' },
  '交友': { area: '人际社交', description: '代表人际关系、下属缘分、社交能力' },
  '官禄': { area: '事业工作', description: '代表事业发展、工作运势、适合行业' },
  '田宅': { area: '不动产', description: '代表房产地产、家庭环境、居住条件' },
  '福德': { area: '精神享受', description: '代表精神生活、福气享受、内心世界' },
  '父母': { area: '父母长辈', description: '代表父母缘分、长辈关系、家庭教育' },
};

// 六吉星详解
export const LIUJI_STAR: Record<string, {
  nature: string;
  meaning: string;
  career: string;
  wealth: string;
}> = {
  '左辅': { nature: '助力星', meaning: '主忠厚尽职，人缘佳，善助人。提升良善本质，多行好事。', career: '事业顺利，得同事助力', wealth: '财运平稳，有朋友相助' },
  '右弼': { nature: '助力星', meaning: '主豁达乐观，好文学，善计划。精神帮助，多助加强。', career: '事业顺利，得贵人扶持', wealth: '偏财运佳，有意外收获' },
  '文昌': { nature: '才华星', meaning: '主文质彬彬，学识渊博。代表传统学问、文学艺术。', career: '利考试、学术、文化事业', wealth: '靠才华赚钱，文财' },
  '文曲': { nature: '才艺星', meaning: '主口才佳，有文章才华。代表才艺、口才、异路功名。', career: '利演艺、传媒、公关', wealth: '偏财旺，靠口才赚钱' },
  '天魁': { nature: '阳贵人星', meaning: '主正直善良，积极机敏。代表明显的贵人机会，长辈提携。', career: '得长辈提拔，官运亨通', wealth: '财运佳，有贵人指点' },
  '天钺': { nature: '阴贵人星', meaning: '主自重好义，积极上进。代表暗中的贵人帮助，女性贵人。', career: '得女性贵人相助', wealth: '财运佳，有暗财' },
};

// 六煞星详解
export const LIUSHA_STAR: Record<string, {
  nature: string;
  meaning: string;
  influence: string;
}> = {
  '擎羊': { nature: '竞争星', meaning: '主权威、事业心强、有个性。冲劲强但也容易受伤，小人众多。', influence: '增加竞争与冲突，庙旺可激发斗志' },
  '陀罗': { nature: '纠结星', meaning: '主推理、顽固，但容忍心强。容易陷入纠结，拖延不决。', influence: '增加拖延与纠结，利于深入研究' },
  '火星': { nature: '突发星', meaning: '主胆识、外向、不耐静。精神压力大，突发变化。', influence: '增加突变与急躁，庙旺主爆发力' },
  '铃星': { nature: '暗火星', meaning: '主内敛焦躁，暗藏变动。外烈内燃，急切焦躁。', influence: '增加暗中的压力与变动' },
  '地空': { nature: '虚空星', meaning: '主反层次，伤世俗不伤脱俗。财物损耗，但常给人超脱智慧。', influence: '增加波动与灵性，不利世俗求财' },
  '地劫': { nature: '劫夺星', meaning: '主波动与灵性。可能带来财物损耗，但也常让人拥有超脱智慧。', influence: '增加劫夺与变化，利于修行' },
};

// 四化星详解
export const SIHUA_STAR: Record<string, {
  nature: string;
  meaning: string;
  effect: string;
}> = {
  '化禄': { nature: '财禄', meaning: '代表机会、财富与享受。为人多重感情，大小限遇禄为好机运。', effect: '增财增运，诸事顺利' },
  '化权': { nature: '权威', meaning: '代表掌控、权威与成就。为人多能干好胜，大小限遇权为升迁好时机。', effect: '增权力地位，事业上升' },
  '化科': { nature: '名声', meaning: '代表名声、才华与贵人。为人有声名，讲道理。大小限遇化科为出名好时机。', effect: '增名声贵人，考试有利' },
  '化忌': { nature: '阻碍', meaning: '代表压力、阻碍与转折。为人多自责，多反省，大小限遇化忌为多波折时期。', effect: '增加阻碍波折，需特别注意' },
};

// 星曜亮度等级
export const STAR_BRIGHTNESS: Record<string, string> = {
  '庙': '星曜能量最强，吉性充分发挥，凶星逢之不凶',
  '旺': '星曜能量强，吉性显著，遇煞影响不大',
  '得': '星曜能量中等，吉凶参半，力量较稳定',
  '利': '星曜亮度较弱，属小吉，遇煞影响较大',
  '平': '星曜亮度已低，吉星难发挥，遇吉取平遇煞则凶',
  '不': '星曜亮度已暗，吉星无吉凶星愈凶',
  '陷': '星曜能量最弱，负面特质凸显，吉星不吉凶星更凶',
};

// 五行局详解
export const WUXING_JU: Record<string, {
  element: string;
  personality: string;
  career: string;
  lucky: string;
  nayin: string[];
}> = {
  '水二局': { element: '水', personality: '聪明灵活，善于变通，智慧过人', career: '适合商业、贸易、传媒、旅游', lucky: '北方、黑色、数字1/6', nayin: ['涧下水', '泉中水', '长流水', '天河水', '大溪水', '大海水'] },
  '木三局': { element: '木', personality: '仁慈正直，有进取心，生机勃勃', career: '适合教育、医疗、文化、园林', lucky: '东方、绿色、数字3/8', nayin: ['大林木', '杨柳木', '松柏木', '平地木', '桑柘木', '石榴木'] },
  '金四局': { element: '金', personality: '刚毅果断，重义气，有领导才能', career: '适合金融、法律、军警、机械', lucky: '西方、白色、数字4/9', nayin: ['海中金', '剑锋金', '白蜡金', '砂中金', '金箔金', '钗钏金'] },
  '土五局': { element: '土', personality: '稳重踏实，诚信可靠，包容心强', career: '适合房地产、农业、建筑、金融', lucky: '中央、黄色、数字2/5/8', nayin: ['路旁土', '城头土', '屋上土', '壁上土', '大驿土', '砂中土'] },
  '火六局': { element: '火', personality: '热情开朗，有活力，光明磊落', career: '适合演艺、传媒、能源、餐饮', lucky: '南方、红色、数字2/7', nayin: ['炉中火', '山头火', '霹雳火', '山下火', '覆灯火', '天上火'] },
};

/**
 * 生成紫微命盘解析
 */
export function generateZiweiInterpretation(palaces: Array<{
  name: string;
  majorStars: Array<{ name: string; mutagen: string; brightness: string }>;
  minorStars: Array<{ name: string }>;
  isBody: boolean;
}>, basic: any) {
  const mingGong = palaces.find(p => p.name === '命宫' || p.name?.includes('命'));
  const shenGong = palaces.find(p => p.name === '财帛' || p.name?.includes('财'));
  const guanGong = palaces.find(p => p.name === '官禄' || p.name?.includes('官'));
  const fuDeGong = palaces.find(p => p.name === '福德' || p.name?.includes('福'));

  // 提取命宫主星
  const mainStars = mingGong?.majorStars.filter(s => 
    Object.keys(MAIN_STAR_INTERPRETATION).some(k => s.name.includes(k))
  ) || [];

  const interpretations = mainStars.map(star => {
    const starName = Object.keys(MAIN_STAR_INTERPRETATION).find(k => star.name.includes(k)) || '';
    return {
      name: star.name,
      ...MAIN_STAR_INTERPRETATION[starName],
      brightness: star.brightness,
      mutagen: star.mutagen,
    };
  });

  // 生成综合总结
  let summary = '';
  if (interpretations.length > 0) {
    summary = `命宫主星为${interpretations.map(i => i.name).join('、')}，`;
    summary += interpretations.map(i => i.personality).join('');
  } else {
    summary = '命宫无主星，需借对宫星曜来推断。性格较为灵活多变，适应力强。';
  }

  if (basic?.fiveElementsClass) {
    summary += `\n\n五行局为「${basic.fiveElementsClass}」，`;
    const juMap: Record<string, string> = {
      '水二局': '属水，聪明灵活，善于变通',
      '木三局': '属木，仁慈正直，有进取心',
      '金四局': '属金，刚毅果断，重义气',
      '土五局': '属土，稳重踏实，诚信可靠',
      '火六局': '属火，热情开朗，有活力',
    };
    summary += juMap[basic.fiveElementsClass] || '';
  }

  return {
    mingGongStars: interpretations,
    summary,
    palaces: { mingGong, shenGong, guanGong, fuDeGong },
  };
}
