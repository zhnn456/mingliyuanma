/**
 * 紫微斗数命理解析 — V2.0 完整版
 * 
 * 融合：
 * - 古籍原文（《紫微斗数全书》《太微赋》《骨髓赋》）
 * - 当代名家解读规则
 * - 星曜在十二宫的组合含义
 * - 三方四正、亮度庙陷、四化飞星综合判读
 */

// ============================================================
// 一、十四主星基本属性
// ============================================================

export const MAIN_STAR_INTERPRETATION: Record<string, {
  nature: string;
  personality: string;
  career: string;
  wealth: string;
  emotion: string;
  health: string;
  /** 古籍引用 */
  classicQuote?: string;
}> = {
  '紫微': {
    nature: '帝星',
    personality: '领导力强，气质高贵，有王者风范。为人正直大方，有组织能力，但有时显得高傲。',
    career: '适合管理层、政界、大企业领导岗位',
    wealth: '财运亨通，善于理财，有聚财能力',
    emotion: '感情中较为强势，需要崇拜自己的对象',
    health: '注意脾胃保养，避免过度操劳',
    classicQuote: '《太微赋》云："紫微帝座，以辅弼为佐，以天相为印。"'
  },
  '天机': {
    nature: '智星',
    personality: '聪明机智，思维敏捷，善于谋略。学习能力强，但有时想太多，容易焦虑。',
    career: '适合策划、顾问、技术研究、玄学',
    wealth: '偏财运佳，善于发现投资机会',
    emotion: '感情细腻，但容易想太多导致患得患失',
    health: '注意神经系统和睡眠质量',
    classicQuote: '《紫微斗数全书》云："天机为兄弟主，以智谋为用。"'
  },
  '太阳': {
    nature: '贵星',
    personality: '热情开朗，光明磊落，有博爱精神。乐于助人，有公众影响力，但有时过于操劳。',
    career: '适合政界、传媒、演艺、公益事业',
    wealth: '正财运佳，靠名气和人脉赚钱',
    emotion: '感情热烈，对伴侣慷慨大方',
    health: '注意眼睛和头部保养',
    classicQuote: '《骨髓赋》云："太阳居午，名扬四海；陷地逢之，劳碌奔波。"'
  },
  '武曲': {
    nature: '财星',
    personality: '刚毅果断，有商业头脑。做事干脆利落，执行力强，但有时显得固执。',
    career: '适合金融、军警、体育、技术行业',
    wealth: '财运极佳，是最容易发财的主星',
    emotion: '感情中较为直接，不善于表达浪漫',
    health: '注意呼吸系统和肺部',
    classicQuote: '《紫微斗数全书》云："武曲属金，司财帛之权。"'
  },
  '天同': {
    nature: '福星',
    personality: '温和善良，知足常乐。有艺术天赋，人缘好，但有时缺乏进取心。',
    career: '适合文艺、社工、服务业、教育',
    wealth: '财运平稳，不追求大富大贵',
    emotion: '感情温馨甜蜜，是理想伴侣',
    health: '注意肾脏和泌尿系统',
    classicQuote: '《太微赋》云："天同为福德主，化福为祥。"'
  },
  '廉贞': {
    nature: '囚星/桃花星',
    personality: '性格复杂，既有领导力又有桃花性质。聪明能干，但容易感情用事。',
    career: '适合政界、法律、演艺、电子科技',
    wealth: '财运起伏大，需注意投资风险',
    emotion: '感情丰富，异性缘佳，但需防感情纠葛',
    health: '注意心脏和血液循环',
    classicQuote: '《紫微斗数全书》云："廉贞为次桃花，在官禄为政星。"'
  },
  '天府': {
    nature: '禄星',
    personality: '稳重大方，有包容心。善于守财，有长者之风，但有时过于保守。',
    career: '适合金融、地产、管理、餐饮',
    wealth: '财运极佳，是天生的守财高手',
    emotion: '感情稳定，对家庭负责',
    health: '注意消化系统，饮食宜节制',
    classicQuote: '《太微赋》云："天府为禄库，守财帛丰盈。"'
  },
  '太阴': {
    nature: '富星',
    personality: '温柔细腻，内心丰富。有艺术修养，善于体察他人，但有时多愁善感。',
    career: '适合文化、房地产、设计、医药',
    wealth: '财运佳，尤其不动产投资运好',
    emotion: '感情含蓄，追求精神层面的共鸣',
    health: '注意眼睛和妇科/泌尿系统',
    classicQuote: '《骨髓赋》云："太阴居亥，水澄桂萼之象。"'
  },
  '贪狼': {
    nature: '欲望之星',
    personality: '多才多艺，好奇心强。善于交际，有桃花性质，但有时贪多嚼不烂。',
    career: '适合演艺、公关、宗教、玄学',
    wealth: '偏财运佳，善于把握机会',
    emotion: '异性缘极佳，感情丰富但需防桃花劫',
    health: '注意肝脏和肾脏',
    classicQuote: '《紫微斗数全书》云："贪狼为第一桃花星，主才艺与欲望。"'
  },
  '巨门': {
    nature: '暗星',
    personality: '口才了得，善于分析。有研究精神，洞察力强，但有时过于多疑。',
    career: '适合律师、教师、医生、分析师',
    wealth: '靠口才和专业赚钱，财运平稳',
    emotion: '感情中容易多疑，需要建立信任',
    health: '注意口腔和肠胃',
    classicQuote: '《太微赋》云："巨门司口舌，暗曜主是非。"'
  },
  '天相': {
    nature: '印星',
    personality: '正直善良，有服务精神。善于协调，人缘好，但有时过于在意他人看法。',
    career: '适合公务员、秘书、人力资源、服务业',
    wealth: '财运平稳，善于理财',
    emotion: '感情忠诚，是可靠的伴侣',
    health: '注意脾胃和皮肤',
    classicQuote: '《紫微斗数全书》云："天相为印绶，主司爵禄之权。"'
  },
  '天梁': {
    nature: '荫星',
    personality: '正直清高，有长者风范。乐于助人，逢凶化吉，但有时过于说教。',
    career: '适合医疗、教育、慈善、宗教',
    wealth: '财运平稳，晚年财运佳',
    emotion: '感情中像长辈般照顾对方',
    health: '注意神经系统和筋骨',
    classicQuote: '《太微赋》云："天梁为荫星，主寿与贵，逢凶化吉。"'
  },
  '七杀': {
    nature: '将星',
    personality: '刚毅果决，有魄力。敢于冒险，执行力强，但有时过于冲动。',
    career: '适合军警、运动员、企业家、外科医生',
    wealth: '财运起伏大，有暴富机会',
    emotion: '感情热烈但来得快去得快',
    health: '注意肝胆和意外伤害',
    classicQuote: '《紫微斗数全书》云："七杀为将星，主肃杀与开创。"'
  },
  '破军': {
    nature: '耗星',
    personality: '敢于变革，不拘一格。创新能力强，有开拓精神，但有时破坏力强。',
    career: '适合创业、科技、艺术、探险',
    wealth: '财运大起大落，适合高风险投资',
    emotion: '感情多变，需要稳定的伴侣',
    health: '注意呼吸系统和意外伤害',
    classicQuote: '《骨髓赋》云："破军居子午，四海扬名；陷地逢之，破败祖业。"'
  },
};

// ============================================================
// 二、十二宫位含义
// ============================================================

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

// ============================================================
// 三、星曜在十二宫的含义（核心解读库）
// ============================================================

// 主星在命宫时的关键特质
const STAR_IN_PALACE_KEY: Record<string, Partial<Record<string, string>>> = {
  '紫微': {
    '命宫': '紫微坐命，帝王之相，领导力出众，喜掌权柄。庙旺则贵气显赫，陷地则刚愎自用。',
    '财帛': '紫微守财帛，财源广进，多来自官方或大企业。天府同宫更佳。',
    '官禄': '紫微入官禄，事业有成，宜管理层或自主创业。得左右昌曲更佳。',
    '夫妻': '紫微在夫妻，配偶有领导能力，但关系中有强势一方需调和。',
    '疾厄': '紫微在疾厄，脾胃易有恙，注意饮食规律。',
    '田宅': '紫微在田宅，祖业丰厚，房产运佳，宜置产。',
    '福德': '紫微在福德，精神享受高，喜受人尊重，有贵族气质。',
    '迁移': '紫微在迁移，外出有贵人，社交场合受人尊敬。',
  },
  '天机': {
    '命宫': '天机坐命，聪明绝顶，思维敏捷，善策划。但易想太多，心神不宁。',
    '财帛': '天机守财帛，以智谋生财，财路多变，宜策划咨询行业。',
    '官禄': '天机入官禄，事业多变动，适合技术、策划、顾问类工作。',
    '夫妻': '天机在夫妻，配偶聪明，但感情中容易因多虑产生误会。',
    '疾厄': '天机在疾厄，注意神经衰弱、失眠、肝胆问题。',
    '田宅': '天机在田宅，房产多次变动，环境常换。',
    '福德': '天机在福德，思想活跃，喜研究哲学、玄学。',
    '迁移': '天机在迁移，外出多变动，旅途中有学习机会。',
  },
  '太阳': {
    '命宫': '太阳坐命，光明磊落，热情大方，博爱无私。庙旺则名扬四海，陷地则劳碌奔波。',
    '财帛': '太阳守财帛，以名气生财，宜公益、传媒行业。',
    '官禄': '太阳入官禄，事业光明，宜政界、教育、传媒。',
    '夫妻': '太阳在夫妻，配偶热情开朗，但陷地婚姻易有波折。',
    '疾厄': '太阳在疾厄，注意眼睛、心脏、头部问题。',
    '田宅': '太阳在田宅，房产阳光充足，居家明亮。',
    '福德': '太阳在福德，心胸开阔，积极乐观。',
    '迁移': '太阳在迁移，外出得贵人，受欢迎。',
  },
  '武曲': {
    '命宫': '武曲坐命，刚毅果决，财星入命，利求财。庙旺则财运亨通，陷地则孤寡。',
    '财帛': '武曲守财帛，正财旺盛，是十二宫中最利财帛的组合之一。',
    '官禄': '武曲入官禄，事业多与金融、军警、技术相关。',
    '夫妻': '武曲在夫妻，配偶性格刚强，感情中缺乏浪漫。',
    '疾厄': '武曲在疾厄，注意呼吸系统、肺部、骨骼。',
    '田宅': '武曲在田宅，房产多为实用型，利于投资增值。',
    '福德': '武曲在福德，性格务实，注重物质享受。',
    '迁移': '武曲在迁移，外出常为工作奔忙，财运随行。',
  },
  '天同': {
    '命宫': '天同坐命，温和善良，福星照命，一生平顺。庙旺则福泽深厚，陷地则懒散。',
    '财帛': '天同守财帛，财运平顺，不争不抢，自然来财。',
    '官禄': '天同入官禄，事业轻松愉快，适合文化、艺术工作。',
    '夫妻': '天同在夫妻，感情温馨，夫妻和睦。',
    '疾厄': '天同在疾厄，注意肾脏、泌尿系统。',
    '田宅': '天同在田宅，居住环境舒适优雅。',
    '福德': '天同在福德，知足常乐，精神生活丰富。',
    '迁移': '天同在迁移，外出有福气，旅途愉快。',
  },
  '廉贞': {
    '命宫': '廉贞坐命，气质独特，兼具政治手腕和艺术才华。庙旺则贵显，陷地则官非。',
    '财帛': '廉贞守财帛，财路复杂，既有正财也有偏财，需防财来财去。',
    '官禄': '廉贞入官禄，事业多为政界、法律、演艺，是"政星"入官禄。',
    '夫妻': '廉贞在夫妻，感情世界丰富，但需防桃花过多影响婚姻。',
    '疾厄': '廉贞在疾厄，注意心脏、血液、妇科问题。',
    '田宅': '廉贞在田宅，房产与政府、机关有关。',
    '福德': '廉贞在福德，思想深刻，内心世界复杂。',
    '迁移': '廉贞在迁移，外出人缘佳，应酬多。',
  },
  '天府': {
    '命宫': '天府坐命，稳重大方，禄星入命，一生富足。庙旺则福厚，陷地则保守。',
    '财帛': '天府守财帛，守财能力极强，理财有道，积累丰厚。',
    '官禄': '天府入官禄，事业稳定，宜金融、管理、地产。',
    '夫妻': '天府在夫妻，婚姻稳定，配偶稳重顾家。',
    '疾厄': '天府在疾厄，注意消化系统，暴饮暴食。',
    '田宅': '天府在田宅，房产丰裕，居家豪华。',
    '福德': '天府在福德，享受生活，注重品味。',
    '迁移': '天府在迁移，外出安定，常有美食享受。',
  },
  '太阴': {
    '命宫': '太阴坐命，温柔含蓄，心思细腻，有艺术感。庙旺则富，陷地则多愁。',
    '财帛': '太阴守财帛，以柔和方式生财，宜不动产投资。',
    '官禄': '太阴入官禄，事业与文化、房地产、设计相关。',
    '夫妻': '太阴在夫妻，配偶温柔，感情细腻。',
    '疾厄': '太阴在疾厄，注意眼睛、妇科、湿气。',
    '田宅': '太阴在田宅，房产旺，居家环境优美。',
    '福德': '太阴在福德，内心丰富，有艺术鉴赏力。',
    '迁移': '太阴在迁移，外出常有月光般的美妙际遇。',
  },
  '贪狼': {
    '命宫': '贪狼坐命，多才多艺，交际能力强。庙旺则才华横溢，陷地则欲望过度。',
    '财帛': '贪狼守财帛，偏财运佳，善于把握机会，但财来波动大。',
    '官禄': '贪狼入官禄，事业多变，宜演艺、公关、外交。',
    '夫妻': '贪狼在夫妻，感情丰富，桃花旺，需注意婚姻稳定。',
    '疾厄': '贪狼在疾厄，注意肝脏、肾脏、性病。',
    '田宅': '贪狼在田宅，房产华丽，但常变动。',
    '福德': '贪狼在福德，享受欲望强，追求丰富多彩的生活。',
    '迁移': '贪狼在迁移，外出人脉广，社交活跃。',
  },
  '巨门': {
    '命宫': '巨门坐命，口才出众，以口为业。庙旺则名扬，陷地则多口舌是非。',
    '财帛': '巨门守财帛，靠口才和专业赚钱，宜律师、教师。',
    '官禄': '巨门入官禄，事业与口才相关，宜法律、教育、媒体。',
    '夫妻': '巨门在夫妻，易因言语产生误会，需多沟通。',
    '疾厄': '巨门在疾厄，注意口腔、肠胃、消化系统。',
    '田宅': '巨门在田宅，居家附近易有声音干扰。',
    '福德': '巨门在福德，思想深入，善于研究。',
    '迁移': '巨门在迁移，外出注意口舌是非。',
  },
  '天相': {
    '命宫': '天相坐命，正直善良，有服务精神。庙旺则贵显，陷地则过于在意他人。',
    '财帛': '天相守财帛，以服务生财，宜中介、秘书、服务行业。',
    '官禄': '天相入官禄，事业宜公职、秘书、人力资源。',
    '夫妻': '天相在夫妻，配偶品貌端正，婚姻美满。',
    '疾厄': '天相在疾厄，注意皮肤、脾胃。',
    '田宅': '天相在田宅，居家环境规整。',
    '福德': '天相在福德，心地善良，乐于助人。',
    '迁移': '天相在迁移，外出受人尊重。',
  },
  '天梁': {
    '命宫': '天梁坐命，正直清高，有长者风范，逢凶化吉。庙旺则贵寿，陷地则孤。',
    '财帛': '天梁守财帛，财运平稳，晚年更佳，宜医疗、教育。',
    '官禄': '天梁入官禄，事业宜医疗、教育、慈善机构。',
    '夫妻': '天梁在夫妻，配偶如长者般照顾，年龄差距较大。',
    '疾厄': '天梁在疾厄，注意慢性病、筋骨问题。',
    '田宅': '天梁在田宅，房产与老人或医院有关。',
    '福德': '天梁在福德，思想清高，有宗教倾向。',
    '迁移': '天梁在迁移，外出有老人贵人相助。',
  },
  '七杀': {
    '命宫': '七杀坐命，刚毅果决，将星入命。庙旺则开创有成，陷地则灾难重重。',
    '财帛': '七杀守财帛，以冒险换财，财来大起大落。',
    '官禄': '七杀入官禄，事业多开创性、竞争性工作。',
    '夫妻': '七杀在夫妻，婚姻中多冲突，需互相包容。',
    '疾厄': '七杀在疾厄，注意意外伤害、肝脏。',
    '田宅': '七杀在田宅，房产多次变动。',
    '福德': '七杀在福德，思想激进，敢作敢当。',
    '迁移': '七杀在迁移，外出多变，常有机遇。',
  },
  '破军': {
    '命宫': '破军坐命，勇于变革，先破后立。庙旺则成大业，陷地则败业。',
    '财帛': '破军守财帛，大破大立，先破财后得财。',
    '官禄': '破军入官禄，事业多变革，宜创业、科技等创新型行业。',
    '夫妻': '破军在夫妻，婚姻多变动，需稳定心态。',
    '疾厄': '破军在疾厄，注意意外伤害、呼吸系统。',
    '田宅': '破军在田宅，房产常拆建、翻新。',
    '福德': '破军在福德，思想超前，不守常规。',
    '迁移': '破军在迁移，外出多变动，常有意外旅程。',
  },
};

// ============================================================
// 四、星曜组合判读（双星同宫 / 三合方）
// ============================================================

const STAR_COMBINATIONS: Record<string, string> = {
  '紫微天府': '紫府同宫格，帝王之气，既有领导力又稳重，一生贵气。',
  '紫微贪狼': '紫贪同宫，桃花犯主，既有权威又有多才艺，感情世界丰富。',
  '紫微天相': '紫相同宫，君臣相得，适合辅佐型领导职位。',
  '紫微七杀': '紫杀同宫，帝王配将星，有开创性但需防过于刚猛。',
  '紫微破军': '紫破同宫，变革与权威结合，常有重大人生转折。',
  '天机太阴': '机阴同宫，智慧与温柔结合，适合策划、设计类工作。',
  '天机巨门': '机巨同宫，智慧加口才，宜策略规划、学术研究。',
  '天机天梁': '机梁同宫，智荫双全，善策画，有宗教缘。',
  '太阳太阴': '日月同宫，阴阳调和，性格多元，有艺术气质。',
  '太阳巨门': '日巨同宫，光明破暗，以口才成名，宜传媒、法律。',
  '太阳天梁': '日梁同宫，光明正大，有贵气，宜公益、教育。',
  '武曲天府': '武府同宫，财库双全，最利求财的组合之一。',
  '武曲天相': '武相同宫，刚柔并济，宜金融、法律行业。',
  '武曲七杀': '武杀同宫，刚猛至极，宜军警、运动员。',
  '武曲破军': '武破同宫，破而后立，财运大起大落。',
  '天同太阴': '同阴同宫，福寿双全，性格温和。',
  '天同巨门': '同巨同宫，福星化暗，晚年福泽深厚。',
  '天同天梁': '同梁同宫，福荫双全，一生平顺有福。',
  '廉贞天府': '廉府同宫，政星入禄库，宜政界、金融管理。',
  '廉贞七杀': '廉杀同宫，政治手腕加将星魄力，宜军警、政界。',
  '廉贞破军': '廉破同宫，变革中带桃花，人生多变。',
  '廉贞贪狼': '廉贪同宫，桃花犯主，感情复杂，才华横溢。',
};

// ============================================================
// 五、星曜格局（特殊组合）
// ============================================================

const STAR_PATTERNS: Record<string, string> = {
  '杀破狼': '杀破狼格局：七杀、破军、贪狼三者在命宫、财帛、官禄三宫相会，主白手起家、开创新局。',
  '府相朝垣': '府相朝垣：天府和天相在命宫左右朝拱，主稳重有成，贵人相助。',
  '日月并明': '日月并明：太阳太阴同守在庙旺之地，主光明磊落，福禄双全。',
  '机月同梁': '机月同梁格：天机、太阴、天同、天梁组合出现，主智慧超群，适合策划研究。',
  '紫府朝垣': '紫府朝垣：紫微和天府在命宫或三合相会，帝王之气，领导才能。',
  '巨日同宫': '巨日同宫格：巨门和太阳同宫，以口才名扬天下。',
  '武贪同行': '武贪同行：武曲贪狼同宫或三合，主暴发，横发横破。',
};

// ============================================================
// 六、六吉星、六煞星解析
// ============================================================

export const LIUJI_STAR: Record<string, { nature: string; meaning: string; career: string; wealth: string }> = {
  '左辅': { nature: '助力星', meaning: '主忠厚尽职，人缘佳，善助人。提升良善本质，多行好事。', career: '事业顺利，得同事助力', wealth: '财运平稳，有朋友相助' },
  '右弼': { nature: '助力星', meaning: '主豁达乐观，好文学，善计划。精神帮助，多助加强。', career: '事业顺利，得贵人扶持', wealth: '偏财运佳，有意外收获' },
  '文昌': { nature: '才华星', meaning: '主文质彬彬，学识渊博。代表传统学问、文学艺术。', career: '利考试、学术、文化事业', wealth: '靠才华赚钱，文财' },
  '文曲': { nature: '才艺星', meaning: '主口才佳，有文章才华。代表才艺、口才、异路功名。', career: '利演艺、传媒、公关', wealth: '偏财旺，靠口才赚钱' },
  '天魁': { nature: '阳贵人星', meaning: '主正直善良，积极机敏。代表明显的贵人机会，长辈提携。', career: '得长辈提拔，官运亨通', wealth: '财运佳，有贵人指点' },
  '天钺': { nature: '阴贵人星', meaning: '主自重好义，积极上进。代表暗中的贵人帮助，女性贵人。', career: '得女性贵人相助', wealth: '财运佳，有暗财' },
};

export const LIUSHA_STAR: Record<string, { nature: string; meaning: string; influence: string }> = {
  '擎羊': { nature: '竞争星', meaning: '主权威、事业心强、有个性。冲劲强但也容易受伤，小人众多。', influence: '增加竞争与冲突，庙旺可激发斗志' },
  '陀罗': { nature: '纠结星', meaning: '主推理、顽固，但容忍心强。容易陷入纠结，拖延不决。', influence: '增加拖延与纠结，利于深入研究' },
  '火星': { nature: '突发星', meaning: '主胆识、外向、不耐静。精神压力大，突发变化。', influence: '增加突变与急躁，庙旺主爆发力' },
  '铃星': { nature: '暗火星', meaning: '主内敛焦躁，暗藏变动。外烈内燃，急切焦躁。', influence: '增加暗中的压力与变动' },
  '地空': { nature: '虚空星', meaning: '主反层次，伤世俗不伤脱俗。财物损耗，但常给人超脱智慧。', influence: '增加波动与灵性，不利世俗求财' },
  '地劫': { nature: '劫夺星', meaning: '主波动与灵性。可能带来财物损耗，但也常让人拥有超脱智慧。', influence: '增加劫夺与变化，利于修行' },
};

export const SIHUA_STAR: Record<string, { nature: string; meaning: string; effect: string }> = {
  '化禄': { nature: '财禄', meaning: '代表机会、财富与享受。为人多重感情，大小限遇禄为好机运。', effect: '增财增运，诸事顺利' },
  '化权': { nature: '权威', meaning: '代表掌控、权威与成就。为人多能干好胜，大小限遇权为升迁好时机。', effect: '增权力地位，事业上升' },
  '化科': { nature: '名声', meaning: '代表名声、才华与贵人。为人有声名，讲道理。大小限遇化科为出名好时机。', effect: '增名声贵人，考试有利' },
  '化忌': { nature: '阻碍', meaning: '代表压力、阻碍与转折。为人多自责，多反省，大小限遇化忌为多波折时期。', effect: '增加阻碍波折，需特别注意' },
};

export const STAR_BRIGHTNESS: Record<string, string> = {
  '庙': '星曜能量最强，吉性充分发挥，凶星逢之不凶',
  '旺': '星曜能量强，吉性显著，遇煞影响不大',
  '得': '星曜能量中等，吉凶参半，力量较稳定',
  '利': '星曜亮度较弱，属小吉，遇煞影响较大',
  '平': '星曜亮度已低，吉星难发挥，遇吉取平遇煞则凶',
  '不': '星曜亮度已暗，吉星无吉凶星愈凶',
  '陷': '星曜能量最弱，负面特质凸显，吉星不吉凶星更凶',
};

export const WUXING_JU: Record<string, { element: string; personality: string; career: string; lucky: string; nayin: string[] }> = {
  '水二局': { element: '水', personality: '聪明灵活，善于变通，智慧过人', career: '适合商业、贸易、传媒、旅游', lucky: '北方、黑色、数字1/6', nayin: ['涧下水', '泉中水', '长流水', '天河水', '大溪水', '大海水'] },
  '木三局': { element: '木', personality: '仁慈正直，有进取心，生机勃勃', career: '适合教育、医疗、文化、园林', lucky: '东方、绿色、数字3/8', nayin: ['大林木', '杨柳木', '松柏木', '平地木', '桑柘木', '石榴木'] },
  '金四局': { element: '金', personality: '刚毅果断，重义气，有领导才能', career: '适合金融、法律、军警、机械', lucky: '西方、白色、数字4/9', nayin: ['海中金', '剑锋金', '白蜡金', '砂中金', '金箔金', '钗钏金'] },
  '土五局': { element: '土', personality: '稳重踏实，诚信可靠，包容心强', career: '适合房地产、农业、建筑、金融', lucky: '中央、黄色、数字2/5/8', nayin: ['路旁土', '城头土', '屋上土', '壁上土', '大驿土', '砂中土'] },
  '火六局': { element: '火', personality: '热情开朗，有活力，光明磊落', career: '适合演艺、传媒、能源、餐饮', lucky: '南方、红色、数字2/7', nayin: ['炉中火', '山头火', '霹雳火', '山下火', '覆灯火', '天上火'] },
};

// ============================================================
// 七、三方四正和亮度分析辅助
// ============================================================

// 三方四正关系：每个地支的三合宫和对宫
const SANFANG_RELATIONS: Record<number, number[]> = {
  0: [4, 8],   // 寅 - 午、戌
  1: [5, 9],   // 卯 - 未、亥
  2: [6, 10],  // 辰 - 申、子
  3: [7, 11],  // 巳 - 酉、丑
  4: [0, 8],   // 午 - 寅、戌
  5: [1, 9],   // 未 - 卯、亥
  6: [2, 10],  // 申 - 辰、子
  7: [3, 11],  // 酉 - 巳、丑
  8: [4, 0],   // 戌 - 午、寅
  9: [5, 1],   // 亥 - 未、卯
  10: [6, 2],  // 子 - 申、辰
  11: [7, 3],  // 丑 - 酉、巳
};

function getSanfangIndices(branchIndex: number): number[] {
  return SANFANG_RELATIONS[branchIndex] || [];
}

function getDuiGongIndex(branchIndex: number): number {
  return (branchIndex + 6) % 12;
}

// ============================================================
// 八、完整命盘解读生成
// ============================================================

export function generateZiweiInterpretation(
  palaces: Array<{
    name: string;
    index: number;
    heavenlyStem?: string;
    earthlyBranch?: string;
    majorStars: Array<{ name: string; mutagen?: string; brightness?: string }>;
    minorStars: Array<{ name: string; mutagen?: string; brightness?: string }>;
    adjectiveStars?: string[];
    changsheng12?: string;
    boshi12?: string;
    decadal?: { range: [number, number] } | null;
    isBody?: boolean;
  }>,
  basic: any
) {
  const mingGong = palaces.find(p => p.name === '命宫');
  const caiBoGong = palaces.find(p => p.name === '财帛');
  const guanLuGong = palaces.find(p => p.name === '官禄');
  const fuDeGong = palaces.find(p => p.name === '福德');
  const qianYiGong = palaces.find(p => p.name === '迁移');
  const fuQiGong = palaces.find(p => p.name === '夫妻');
  const ziNuGong = palaces.find(p => p.name === '子女');

  const result: {
    summary: string;
    mingGongStars: any[];
    palaces: any;
    starDetails?: any[];
    palaceDetails?: any[];
    patterns?: string[];
    fourTransformations?: any[];
  } = {
    mingGongStars: [],
    palaces: { mingGong, shenGong: caiBoGong, guanGong: guanLuGong, fuDeGong },
    summary: '',
  };

  // ---------- 1. 命宫主星分析 ----------
  if (mingGong) {
    const mainStars = mingGong.majorStars.filter(s =>
      Object.keys(MAIN_STAR_INTERPRETATION).some(k => s.name.includes(k))
    );
    const starDetails = mainStars.map(star => {
      const starKey = Object.keys(MAIN_STAR_INTERPRETATION).find(k => star.name.includes(k)) || '';
      const info = MAIN_STAR_INTERPRETATION[starKey];
      // 星曜在命宫的含义
      const inPalaceKey = STAR_IN_PALACE_KEY[starKey]?.['命宫'] || '';
      return {
        name: star.name,
        ...info,
        brightness: star.brightness,
        mutagen: star.mutagen,
        inPalaceMeaning: inPalaceKey,
      };
    });
    result.mingGongStars = starDetails;

    // 星曜组合检测
    const starNames = mingGong.majorStars.map(s => s.name);
    const allNames = palaces.flatMap(p => p.majorStars.map(s => s.name));
    const comboKey = Object.keys(STAR_COMBINATIONS).find(c => c.split('').every(ch => starNames.some(n => n.includes(ch))));
    // 更准确的组合检测
    let foundCombo = '';
    for (const [combo, meaning] of Object.entries(STAR_COMBINATIONS)) {
      const stars = combo.split('');
      if (stars.every(s => starNames.some(n => n.includes(s)))) {
        foundCombo = meaning;
        break;
      }
    }

    // 格局检测
    const patterns: string[] = [];
    for (const [pattern, desc] of Object.entries(STAR_PATTERNS)) {
      if (pattern === '杀破狼') {
        const hasAll = ['七杀', '破军', '贪狼'].every(s => allNames.includes(s));
        if (hasAll) patterns.push(desc);
      } else if (pattern === '巨日同宫') {
        if (starNames.includes('巨门') && starNames.includes('太阳')) patterns.push(desc);
      } else if (pattern === '日月并明') {
        if (starNames.includes('太阳') && starNames.includes('太阴')) patterns.push(desc);
      } else if (pattern === '紫府朝垣') {
        if (starNames.includes('紫微') && starNames.includes('天府')) patterns.push(desc);
      }
    }
    result.patterns = patterns;

    // 命宫解读
    let summary = '';
    if (starDetails.length > 0) {
      summary += `【命宫】${starDetails.map(s => s.name).join('、')}坐守。\n`;
      starDetails.forEach(s => {
        summary += `${s.personality}\n`;
        if (s.inPalaceMeaning) summary += `${s.inPalaceMeaning}\n`;
        if (s.brightness) summary += `亮度${s.brightness}，${STAR_BRIGHTNESS[s.brightness] || ''}\n`;
        if (s.mutagen) summary += `四化${s.mutagen}，${SIHUA_STAR[s.mutagen]?.effect || ''}\n`;
        if (s.classicQuote) summary += `${s.classicQuote}\n`;
      });
      if (foundCombo) summary += `\n${foundCombo}\n`;
    } else {
      summary += '【命宫】无主星坐守，需借对宫星曜参断。性格灵活多变，适应力强。\n';
    }

    // ---------- 2. 财帛宫分析 ----------
    if (caiBoGong) {
      const starNames = caiBoGong.majorStars.map(s => s.name);
      const starKey = Object.keys(MAIN_STAR_INTERPRETATION).find(k => starNames.some(n => n.includes(k)));
      if (starKey) {
        const inPalace = STAR_IN_PALACE_KEY[starKey]?.['财帛'] || `${starKey}守财帛，财运有特定轨迹。`;
        summary += `\n【财帛宫】${caiBoGong.majorStars.map(s => s.name).join('、')}。${inPalace}\n`;
      } else {
        summary += `\n【财帛宫】无主星，宜借对宫参断。\n`;
      }
    }

    // ---------- 3. 官禄宫分析 ----------
    if (guanLuGong) {
      const starNames = guanLuGong.majorStars.map(s => s.name);
      const starKey = Object.keys(MAIN_STAR_INTERPRETATION).find(k => starNames.some(n => n.includes(k)));
      if (starKey) {
        const inPalace = STAR_IN_PALACE_KEY[starKey]?.['官禄'] || `${starKey}入官禄，事业有成。`;
        summary += `\n【官禄宫】${guanLuGong.majorStars.map(s => s.name).join('、')}。${inPalace}\n`;
      } else {
        summary += `\n【官禄宫】无主星，宜借对宫参断。\n`;
      }
    }

    // ---------- 4. 夫妻宫分析 ----------
    if (fuQiGong) {
      const starNames = fuQiGong.majorStars.map(s => s.name);
      const starKey = Object.keys(MAIN_STAR_INTERPRETATION).find(k => starNames.some(n => n.includes(k)));
      if (starKey) {
        const inPalace = STAR_IN_PALACE_KEY[starKey]?.['夫妻'] || `${starKey}在夫妻宫。`;
        summary += `\n【夫妻宫】${fuQiGong.majorStars.map(s => s.name).join('、')}。${inPalace}\n`;
      } else {
        summary += `\n【夫妻宫】无主星，借对宫参断。\n`;
      }
    }

    // ---------- 5. 迁移宫分析 ----------
    if (qianYiGong) {
      const starNames = qianYiGong.majorStars.map(s => s.name);
      const starKey = Object.keys(MAIN_STAR_INTERPRETATION).find(k => starNames.some(n => n.includes(k)));
      if (starKey) {
        const inPalace = STAR_IN_PALACE_KEY[starKey]?.['迁移'] || '';
        if (inPalace) summary += `\n【迁移宫】${inPalace}\n`;
      }
    }

    // ---------- 6. 四化分布 ----------
    const allMutagens = palaces.flatMap(p =>
      p.majorStars.filter(s => s.mutagen).map(s => ({
        palace: p.name,
        star: s.name,
        mutagen: s.mutagen,
      }))
    );
    if (allMutagens.length > 0) {
      summary += '\n【四化飞星】\n';
      allMutagens.forEach(m => {
        const mutagen = m.mutagen || '';
        summary += `${m.palace}：${m.star}${mutagen}，${SIHUA_STAR[mutagen as keyof typeof SIHUA_STAR]?.effect || ''}\n`;
      });
    }
    result.fourTransformations = allMutagens;

    // ---------- 7. 五行局 ----------
    if (basic?.fiveElementsClass) {
      summary += `\n【五行局】${basic.fiveElementsClass}。${WUXING_JU[basic.fiveElementsClass as keyof typeof WUXING_JU]?.personality || ''}\n`;
    }

    result.summary = summary;
  }

  return result;
}
