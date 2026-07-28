/**
 * 紫微斗数深度解读引擎 — V2.0
 *
 * 补全内容：
 * 1. 十二宫逐一详细解读（含三方四正汇星分析）
 * 2. 大限十年运势分析（每步大限的宫位+星曜+四化→运势文本）
 * 3. 流年运势分析（当前流年宫位+星曜→吉凶判断）
 * 4. 格局深度分析（成败条件、影响范围、古籍出处）
 * 5. 四化飞星入宫完整含义（化禄/化权/化科/化忌入十二宫）
 * 6. 六吉星/六煞星入宫含义
 * 7. 空宫借星分析
 * 8. 命身宫同度分析
 */

import {
  MAIN_STAR_INTERPRETATION,
  PALACE_MEANING,
  SIHUA_STAR,
  STAR_BRIGHTNESS,
  LIUJI_STAR,
  LIUSHA_STAR,
  WUXING_JU,
} from './ziwei';

// 规范化四化名称：iztro 返回 "禄"/"权"/"科"/"忌"，统一加"化"前缀
function normalizeMutagen(mutagen: string): string {
  if (!mutagen) return '';
  if (mutagen.startsWith('化')) return mutagen;
  return '化' + mutagen;
}

// ============================================================
// 一、四化飞星入十二宫含义
// ============================================================

const SIHUA_IN_PALACE: Record<string, Record<string, { meaning: string; advice: string }>> = {
  '化禄': {
    '命宫': { meaning: '化禄入命，天生福气深厚，人缘极佳，一生财源不断。', advice: '把握贵人运，多结善缘，福气自然来。' },
    '兄弟': { meaning: '化禄入兄弟宫，与兄弟朋友关系融洽，得力于平辈。', advice: '可与人合伙创业，朋友是财源。' },
    '夫妻': { meaning: '化禄入夫妻宫，婚姻美满，配偶旺财，感情甜蜜。', advice: '珍惜伴侣，婚后财运更佳。' },
    '子女': { meaning: '化禄入子女宫，子女孝顺有出息，晚年享福。', advice: '多花时间陪伴子女，培养其才能。' },
    '财帛': { meaning: '化禄入财帛宫，财源广进，赚钱轻松，一生不缺钱。', advice: '此生财运最旺之宫，宜大胆理财投资。' },
    '疾厄': { meaning: '化禄入疾厄，逢凶化吉，疾病易愈，身体底子好。', advice: '虽先天体质佳，仍需注意保养。' },
    '迁移': { meaning: '化禄入迁移，外出得财，异地发展顺利。', advice: '宜离乡发展，外出遇贵人。' },
    '交友': { meaning: '化禄入交友，朋友多且有钱，社交圈层高。', advice: '善用人脉资源，朋友带来财富。' },
    '官禄': { meaning: '化禄入官禄，事业顺利，升职加薪，事业心强。', advice: '专注事业发展，前途光明。' },
    '田宅': { meaning: '化禄入田宅，家业兴旺，房产丰裕，居住环境好。', advice: '宜投资不动产，祖业可守。' },
    '福德': { meaning: '化禄入福德，精神富足，享受人生，内心安乐。', advice: '培养精神追求，福泽绵长。' },
    '父母': { meaning: '化禄入父母，得长辈疼爱，家庭和睦，长辈贵人多。', advice: '孝敬长辈，得长辈荫庇。' },
  },
  '化权': {
    '命宫': { meaning: '化权入命，性格强势，有主见有魄力，掌控欲强。', advice: '发挥领导力，但需学会放权。' },
    '兄弟': { meaning: '化权入兄弟，兄弟中有强势者，或自己在朋友圈中有话语权。', advice: '注意与平辈的权力平衡。' },
    '夫妻': { meaning: '化权入夫妻，配偶能干有主见，婚姻中需互相尊重。', advice: '避免权力之争，互相补位。' },
    '子女': { meaning: '化权入子女，子女独立有主见，管教需适度。', advice: '给子女空间，培养其独立性。' },
    '财帛': { meaning: '化权入财帛，理财能力强，掌控财富，靠权力赚钱。', advice: '适合管理职位或创业，财运随权增长。' },
    '疾厄': { meaning: '化权入疾厄，身体强硬但容易过劳，需注意积劳成疾。', advice: '适当休息，避免硬撑。' },
    '迁移': { meaning: '化权入迁移，外出有主导权，异地发展能掌控局面。', advice: '可在外地创业或管理。' },
    '交友': { meaning: '化权入交友，朋友中有权贵，或自己对朋友有影响力。', advice: '善用社交影响力。' },
    '官禄': { meaning: '化权入官禄，事业心极强，有升迁运，适合管理层。', advice: '此生事业最有成之宫，勇攀高峰。' },
    '田宅': { meaning: '化权入田宅，持家有道，房产运旺，家庭中有主导权。', advice: '积极置产，家庭管理得当。' },
    '福德': { meaning: '化权入福德，精神世界强大，自我要求高，追求精神成就。', advice: '适当放松，不必事事追求完美。' },
    '父母': { meaning: '化权入父母，父母严格，或长辈对自己有较大影响力。', advice: '理解父母苦心，但也要有自己主见。' },
  },
  '化科': {
    '命宫': { meaning: '化科入命，气质文雅，有学识有声名，为人讲道理。', advice: '发挥学术才华，追求名声。' },
    '兄弟': { meaning: '化科入兄弟，兄弟有学问，或朋友中有贵人。', advice: '结交有学问的朋友。' },
    '夫妻': { meaning: '化科入夫妻，配偶温柔有才华，婚姻以精神交流为主。', advice: '注重精神层面的沟通。' },
    '子女': { meaning: '化科入子女，子女聪明好学，学业有成。', advice: '重点培养子女学业。' },
    '财帛': { meaning: '化科入财帛，以才华生财，收入稳定，理财有方。', advice: '靠专业技能赚钱，不必冒险。' },
    '疾厄': { meaning: '化科入疾厄，疾病容易找到好医生，逢凶化吉。', advice: '有病及时就医，多遇良医。' },
    '迁移': { meaning: '化科入迁移，外出有声名，在外受人尊敬。', advice: '适合在外发展，名声在外。' },
    '交友': { meaning: '化科入交友，朋友多为文人雅士，社交有品位。', advice: '结交文化圈朋友。' },
    '官禄': { meaning: '化科入官禄，事业中以名声取胜，适合学术、教育、考试。', advice: '追求专业认证和学术成就。' },
    '田宅': { meaning: '化科入田宅，居家环境优雅，有书香气。', advice: '布置书房，营造文化氛围。' },
    '福德': { meaning: '化科入福德，内心安宁，注重精神修养，有文学艺术天赋。', advice: '培养文艺爱好，精神富足。' },
    '父母': { meaning: '化科入父母，父母有文化，家庭教育好。', advice: '感恩家庭教育的恩泽。' },
  },
  '化忌': {
    '命宫': { meaning: '化忌入命，性格多虑，容易自责，人生多波折但能磨炼心性。', advice: '学会放下执念，逆境是修行。' },
    '兄弟': { meaning: '化忌入兄弟，与兄弟易有矛盾，朋友关系需维护。', advice: '注意沟通，避免误会。' },
    '夫妻': { meaning: '化忌入夫妻，感情多波折，婚姻需特别经营。', advice: '珍惜眼前人，多包容少计较。' },
    '子女': { meaning: '化忌入子女，子女缘分较薄，或子女让人操心。', advice: '多关心子女，耐心教育。' },
    '财帛': { meaning: '化忌入财帛，财运多波折，容易破财，理财需谨慎。', advice: '保守理财，避免投机，量入为出。' },
    '疾厄': { meaning: '化忌入疾厄，身体易有慢性病，需特别注意保养。', advice: '定期体检，注意日常保健。' },
    '迁移': { meaning: '化忌入迁移，外出多不顺，旅途易有变故。', advice: '出行需谨慎，做好预案。' },
    '交友': { meaning: '化忌入交友，易被朋友拖累，人际关系需甄别。', advice: '择友需谨慎，远离损友。' },
    '官禄': { meaning: '化忌入官禄，事业多波折，工作压力大，但坚持终有成。', advice: '不轻言放弃，波折中成长。' },
    '田宅': { meaning: '化忌入田宅，房产多变动，家庭和睦需用心。', advice: '不急于置产，注重家庭沟通。' },
    '福德': { meaning: '化忌入福德，精神压力大，容易焦虑不安。', advice: '培养静心习惯，修心养性。' },
    '父母': { meaning: '化忌入父母，与父母缘分较薄，或父母健康需关注。', advice: '多关心父母，尽孝趁早。' },
  },
};

// ============================================================
// 二、六吉星/六煞星入宫含义
// ============================================================

const JI_STAR_IN_PALACE: Record<string, Record<string, string>> = {
  '左辅': {
    '命宫': '左辅入命，为人忠厚，得贵人助，一生多助力。',
    '夫妻': '左辅入夫妻，婚姻有外力相助，但也暗示第三者介入的可能。',
    '官禄': '左辅入官禄，事业得同事拥护，适合团队工作。',
    '财帛': '左辅入财帛，财运有朋友相助，合伙生财。',
  },
  '右弼': {
    '命宫': '右弼入命，性格豁达，善计划，多贵人。',
    '夫妻': '右弼入夫妻，婚姻有贵人撮合，但也需防桃花。',
    '官禄': '右弼入官禄，事业得贵人扶持，升迁顺利。',
    '财帛': '右弼入财帛，偏财运佳，有意外之财。',
  },
  '文昌': {
    '命宫': '文昌入命，文质彬彬，学识渊博，利考试。',
    '夫妻': '文昌入夫妻，配偶有才华，婚姻有书卷气。',
    '官禄': '文昌入官禄，利学术文化事业，考试运佳。',
    '财帛': '文昌入财帛，以文才生财，利文化教育行业。',
  },
  '文曲': {
    '命宫': '文曲入命，口才佳，有才艺，善表达。',
    '夫妻': '文曲入夫妻，感情浪漫，配偶有艺术气质。',
    '官禄': '文曲入官禄，利演艺、传媒、公关行业。',
    '财帛': '文曲入财帛，靠口才赚钱，偏财旺。',
  },
  '天魁': {
    '命宫': '天魁入命，正直善良，得长辈提拔，贵人多。',
    '夫妻': '天魁入夫妻，婚姻得长辈撮合，配偶家世好。',
    '官禄': '天魁入官禄，得男性贵人提拔，官运亨通。',
    '财帛': '天魁入财帛，财运有贵人指点，投资有道。',
  },
  '天钺': {
    '命宫': '天钺入命，自重好义，得女性贵人相助。',
    '夫妻': '天钺入夫妻，婚姻得女性贵人帮助，配偶温柔。',
    '官禄': '天钺入官禄，得女性贵人提拔，事业顺利。',
    '财帛': '天钺入财帛，有暗财，女性贵人带来财运。',
  },
};

const SHA_STAR_IN_PALACE: Record<string, Record<string, string>> = {
  '擎羊': {
    '命宫': '擎羊入命，性格刚强，有竞争心，但易受伤。',
    '夫妻': '擎羊入夫妻，婚姻多冲突，需互相忍让。',
    '官禄': '擎羊入官禄，事业有竞争压力，但也激发斗志。',
    '财帛': '擎羊入财帛，财运有竞争，财来财去快。',
    '疾厄': '擎羊入疾厄，注意刀伤、外伤、手术。',
  },
  '陀罗': {
    '命宫': '陀罗入命，性格纠结，做事拖泥带水，但耐力强。',
    '夫妻': '陀罗入夫妻，婚姻有拖延纠葛，需耐心解决。',
    '官禄': '陀罗入官禄，事业进展缓慢，但深入研究有成。',
    '财帛': '陀罗入财帛，财来慢但稳，不宜急躁。',
    '疾厄': '陀罗入疾厄，注意慢性病、结石、肿瘤。',
  },
  '火星': {
    '命宫': '火星入命，性急胆大，有爆发力，但易冲动。',
    '夫妻': '火星入夫妻，婚姻多急躁冲突，需控制脾气。',
    '官禄': '火星入官禄，事业有突发机遇，但也易急转直下。',
    '财帛': '火星入财帛，财运有暴发机会，但也易暴破。',
    '疾厄': '火星入疾厄，注意上火、炎症、心脏。',
  },
  '铃星': {
    '命宫': '铃星入命，内敛焦躁，暗藏变动，外柔内刚。',
    '夫妻': '铃星入夫妻，婚姻有暗涌，表面平静内心不满。',
    '官禄': '铃星入官禄，事业有暗中变动，需防暗算。',
    '财帛': '铃星入财帛，财运暗中波动，需防暗损。',
    '疾厄': '铃星入疾厄，注意慢性炎症、精神压力。',
  },
  '地空': {
    '命宫': '地空入命，思想超脱，不务实际，有宗教缘。',
    '夫妻': '地空入夫妻，感情易有空窗期，精神恋爱。',
    '官禄': '地空入官禄，事业多变动，不宜守成。',
    '财帛': '地空入财帛，财运有损耗，不宜守财。',
    '福德': '地空入福德，精神世界丰富，有玄学天赋。',
  },
  '地劫': {
    '命宫': '地劫入命，人生多变故，但也赋予超脱智慧。',
    '夫妻': '地劫入夫妻，感情易有变故，聚少离多。',
    '官禄': '地劫入官禄，事业多波折，适合非常规行业。',
    '财帛': '地劫入财帛，易破财劫财，需防诈骗。',
    '福德': '地劫入福德，精神追求超越物质，有修行缘。',
  },
};

// ============================================================
// 三、格局深度分析（成败条件+影响+古籍出处）
// ============================================================

interface PatternDetail {
  name: string;
  condition: string;
  successCondition: string;
  failureCondition: string;
  influence: string;
  classicSource: string;
  advice: string;
}

const PATTERN_DETAILS: PatternDetail[] = [
  {
    name: '紫府同宫格',
    condition: '紫微与天府同在寅宫或申宫',
    successCondition: '得左辅右弼、天魁天钺拱照，三方四正无煞星冲破',
    failureCondition: '逢擎羊陀罗冲破，或有化忌同宫，则格局减分',
    influence: '帝王之气，领导才能卓越，一生贵气显赫，适合从政或大企业管理',
    classicSource: '《紫微斗数全书》："紫府同宫，贵不可言。"',
    advice: '培养大局观和包容力，善用辅佐人才，切忌刚愎自用。',
  },
  {
    name: '杀破狼格',
    condition: '七杀、破军、贪狼分守命宫、财帛、官禄三宫',
    successCondition: '庙旺会吉星（左辅右弼、文昌文曲），大运流年配合',
    failureCondition: '陷地逢煞星，或大运流年不利，则变动为祸',
    influence: '白手起家，开创新局，人生多变，适合创业、军警、科技',
    classicSource: '《骨髓赋》："杀破狼入庙，威权出众。"',
    advice: '拥抱变化，在变动中寻找机遇，避免安于现状。',
  },
  {
    name: '机月同梁格',
    condition: '天机、太阴、天同、天梁在命宫及三方四正会齐',
    successCondition: '庙旺无煞，文昌文曲加会',
    failureCondition: '逢煞星冲破，则仅聪明而无成',
    influence: '智慧超群，善于策划研究，适合文职、参谋、学术',
    classicSource: '《太微赋》："机月同梁作吏人。"',
    advice: '发挥分析才能，选择稳定平台，不宜独立创业。',
  },
  {
    name: '府相朝垣格',
    condition: '天府与天相在命宫左右朝拱，或分守命身二宫',
    successCondition: '天府天相庙旺，得吉星加会',
    failureCondition: '逢煞星冲破，则朝垣不力',
    influence: '稳重有成，贵人相助，一生衣食无忧，适合管理和服务',
    classicSource: '《紫微斗数全书》："府相朝垣，福寿绵长。"',
    advice: '善用贵人运，稳步发展，不宜冒进。',
  },
  {
    name: '日月并明格',
    condition: '太阳太阴同在庙旺之地（丑未宫同守，或分守庙旺宫位）',
    successCondition: '二星庙旺，无煞星冲破',
    failureCondition: '二星陷地，或逢煞星，则阴阳失调',
    influence: '光明磊落，福禄双全，阴阳调和，性格多元',
    classicSource: '《骨髓赋》："日月并明，佐九重于尧殿。"',
    advice: '发挥多元才能，平衡事业与家庭，广结善缘。',
  },
  {
    name: '巨日同宫格',
    condition: '太阳与巨门同在寅宫或申宫',
    successCondition: '太阳庙旺，巨门得令，无煞冲破',
    failureCondition: '太阳陷地，巨门化忌，则口舌是非多',
    influence: '以口才名扬天下，适合传媒、法律、教育、外交',
    classicSource: '《太微赋》："巨日同宫，名扬四海。"',
    advice: '善用口才，选择适合的传播平台，注意言行分寸。',
  },
  {
    name: '武贪同行格',
    condition: '武曲与贪狼同宫（丑未宫），或分守命身三合',
    successCondition: '庙旺得吉星，且大运配合',
    failureCondition: '陷地逢煞，或少年运走武贪，则暴发暴破',
    influence: '暴发格局，横发横破，财运大起大落',
    classicSource: '《骨髓赋》："武贪同行，威权压众。"',
    advice: '暴发时需冷静守财，不宜贪多，设立止损线。',
  },
  {
    name: '日月反背格',
    condition: '太阳在申酉戌亥子（陷地），太阴在寅卯辰巳午未（陷地）',
    successCondition: '逢吉星化解可减轻',
    failureCondition: '无吉星化解则格局成立',
    influence: '日夜颠倒，劳碌奔波，事业辛苦但未必有成',
    classicSource: '《骨髓赋》："日月反背，多主劳碌。"',
    advice: '选择日夜班交替的工作反为有利，或从事跨国业务。',
  },
  {
    name: '石中隐玉格',
    condition: '巨门在子或午宫坐命，三方四正无煞',
    successCondition: '巨门庙旺，得化禄化权化科，无煞冲破',
    failureCondition: '逢煞星则破格，或巨门陷地则不成',
    influence: '深藏不露，才华内敛，经磨砺后方成大器',
    classicSource: '《紫微斗数全书》："巨门子午，石中隐玉。"',
    advice: '耐得住寂寞，厚积薄发，终有大放异彩之日。',
  },
  {
    name: '火贪格/铃贪格',
    condition: '火星或铃星与贪狼同宫（命宫或财帛宫）',
    successCondition: '贪狼庙旺，火星/铃星庙旺，无化忌冲破',
    failureCondition: '贪狼陷地或逢化忌，则暴发后暴破',
    influence: '突发横财，意外之财，适合投机、创业',
    classicSource: '《骨髓赋》："火星贪狼，名振诸邦。"',
    advice: '横财来时需见好就收，不宜贪心，财散人安。',
  },
  {
    name: '阳梁昌禄格',
    condition: '太阳、天梁、文昌、化禄在命宫及三方四正会齐',
    successCondition: '四要素齐备，且太阳庙旺',
    failureCondition: '缺一要素则格局不完整',
    influence: '利考试、学术、公职，是状元之格',
    classicSource: '《紫微斗数全书》："阳梁昌禄，魁名天下。"',
    advice: '专注学业和考试，适合公务员、学术研究。',
  },
  {
    name: '贪武同行格',
    condition: '贪狼与武曲同宫（丑未宫），少年运遇之',
    successCondition: '庙旺无煞，中年以后发福',
    failureCondition: '少年发迹易暴破，需三十岁后方稳',
    influence: '少年辛苦，中年后暴发，才艺与财运并存',
    classicSource: '《骨髓赋》："贪武同行，晚发之命。"',
    advice: '少年韬光养晦，积累实力，三十岁后厚积薄发。',
  },
];

// ============================================================
// 四、大限运势分析
// ============================================================

function analyzeDecadal(
  palace: any,
  palaceIdx: number,
  allPalaces: any[],
  ageRange: [number, number]
): { range: string; palaceName: string; stars: string; fortune: string; caution: string } {
  const starNames = palace.majorStars.map((s: any) => s.name).filter(Boolean);
  const starText = starNames.length > 0 ? starNames.join('、') : '无主星（借对宫参断）';

  // 获取对宫
  const oppositeIdx = (palaceIdx + 6) % 12;
  const oppositePalace = allPalaces.find((p: any) => p.index === oppositeIdx);
  const oppositeStars = oppositePalace?.majorStars.map((s: any) => s.name).filter(Boolean) || [];

  // 检查四化
  const hasLu = palace.majorStars.some((s: any) => normalizeMutagen(s.mutagen) === '化禄');
  const hasQuan = palace.majorStars.some((s: any) => normalizeMutagen(s.mutagen) === '化权');
  const hasKe = palace.majorStars.some((s: any) => normalizeMutagen(s.mutagen) === '化科');
  const hasJi = palace.majorStars.some((s: any) => normalizeMutagen(s.mutagen) === '化忌');

  let fortune = '';
  let caution = '';

  // 根据主星性质判断大限运势
  const allStarText = starNames.join('');
  if (allStarText.includes('紫微')) {
    fortune = `此大限紫微坐守，事业上有突破和提升的机会，有贵人相助，适合谋求更高的社会地位。`;
    caution = '注意过于刚愎自用，需听取他人意见。';
  } else if (allStarText.includes('天府')) {
    fortune = `此大限天府坐守，财运稳定，守成有道，适合稳健发展和积累资产。`;
    caution = '注意过于保守而错失良机。';
  } else if (allStarText.includes('太阳')) {
    fortune = `此大限太阳坐守，事业光明，有名扬之机，适合拓展人脉和影响力。`;
    caution = '注意过度操劳，劳逸结合。';
  } else if (allStarText.includes('太阴')) {
    fortune = `此大限太阴坐守，财运佳，尤其不动产投资有利，感情生活丰富。`;
    caution = '注意情绪波动，避免多愁善感。';
  } else if (allStarText.includes('武曲')) {
    fortune = `此大限武曲坐守，财运旺盛，事业心强，适合创业或金融投资。`;
    caution = '注意人际关系，刚毅易得罪人。';
  } else if (allStarText.includes('天机')) {
    fortune = `此大限天机坐守，思维活跃，适合学习、策划、转型，多有变动但利于成长。`;
    caution = '注意想太多导致焦虑，决策需果断。';
  } else if (allStarText.includes('天同')) {
    fortune = `此大限天同坐守，生活平顺安逸，福气深厚，适合享受生活和培养兴趣。`;
    caution = '注意过于安逸而缺乏进取。';
  } else if (allStarText.includes('廉贞')) {
    fortune = `此大限廉贞坐守，事业有政治手腕或艺术发展，人缘佳但感情复杂。`;
    caution = '注意感情纠葛和官非。';
  } else if (allStarText.includes('贪狼')) {
    fortune = `此大限贪狼坐守，社交活跃，多才多艺，有偏财机会，桃花旺。`;
    caution = '注意欲望过度，桃花劫。';
  } else if (allStarText.includes('巨门')) {
    fortune = `此大限巨门坐守，以口才谋事，适合演讲、教学、法律，但需防口舌是非。`;
    caution = '注意言多必失，谨言慎行。';
  } else if (allStarText.includes('天相')) {
    fortune = `此大限天相坐守，事业稳定，得贵人辅佐，适合服务和管理岗位。`;
    caution = '注意过于在意他人评价。';
  } else if (allStarText.includes('天梁')) {
    fortune = `此大限天梁坐守，逢凶化吉，贵人运旺，适合医疗、教育、慈善。`;
    caution = '注意过于说教，影响人际关系。';
  } else if (allStarText.includes('七杀')) {
    fortune = `此大限七杀坐守，事业有重大变动和突破，适合开创性工作，有魄力。`;
    caution = '注意冲动冒险，防意外伤害。';
  } else if (allStarText.includes('破军')) {
    fortune = `此大限破军坐守，人生有重大变革，先破后立，适合创业和转型。`;
    caution = '注意破坏力过强，三思而后行。';
  } else {
    // 空宫，借对宫
    if (oppositeStars.length > 0) {
      fortune = `此大限无主星，借对宫${oppositeStars.join('、')}参断。运势受对宫星曜影响，灵活多变。`;
    } else {
      fortune = `此大限无主星，运势较为平淡，以守成为主。`;
    }
    caution = '注意方向感缺失，需明确目标。';
  }

  // 四化加持
  if (hasLu) {
    fortune += ' 大限逢化禄，财运亨通，机缘佳。';
  }
  if (hasQuan) {
    fortune += ' 大限逢化权，权力上升，事业有成。';
  }
  if (hasKe) {
    fortune += ' 大限逢化科，名声提升，考试有利。';
  }
  if (hasJi) {
    fortune += ' 大限逢化忌，多有波折阻碍，需谨慎应对。';
    caution += ' 化忌入限，注意健康、感情和财务风险。';
  }

  // 亮度修正
  const brightnessList = palace.majorStars.map((s: any) => s.brightness).filter(Boolean);
  if (brightnessList.includes('庙') || brightnessList.includes('旺')) {
    fortune += ' 主星庙旺，吉力加倍。';
  } else if (brightnessList.includes('陷') || brightnessList.includes('不')) {
    fortune += ' 主星陷地，吉力减分，需更加努力。';
    caution += ' 星曜陷地，运势打折。';
  }

  return {
    range: `${ageRange[0]}-${ageRange[1]}岁`,
    palaceName: palace.name,
    stars: starText,
    fortune,
    caution,
  };
}

// ============================================================
// 五、十二宫逐一详细解读
// ============================================================

function analyzePalaceDetail(
  palace: any,
  palaceIdx: number,
  allPalaces: any[]
): {
  palaceName: string;
  area: string;
  description: string;
  mainStarAnalysis: string;
  minorStarAnalysis: string;
  shaStarAnalysis: string;
  sihuaAnalysis: string;
  sanfangAnalysis: string;
  brightnessAnalysis: string;
  overall: string;
} {
  const palaceName = palace.name;
  const palaceInfo = PALACE_MEANING[palaceName] || { area: '', description: '' };

  // 主星分析
  const majorStars = palace.majorStars || [];
  let mainStarAnalysis = '';
  if (majorStars.length > 0) {
    majorStars.forEach((star: any) => {
      const starKey = Object.keys(MAIN_STAR_INTERPRETATION).find(k => star.name.includes(k));
      if (starKey) {
        const info = MAIN_STAR_INTERPRETATION[starKey];
        mainStarAnalysis += `${star.name}（${info.nature}）：${info.personality}\n`;
        if (star.brightness) {
          mainStarAnalysis += `亮度${star.brightness}：${STAR_BRIGHTNESS[star.brightness] || ''}\n`;
        }
        if (star.mutagen) {
          const normMut = normalizeMutagen(star.mutagen);
          const sihuaInfo = SIHUA_IN_PALACE[normMut]?.[palaceName];
          if (sihuaInfo) {
            mainStarAnalysis += `${normMut}入${palaceName}：${sihuaInfo.meaning}\n`;
          }
        }
      }
    });
  } else {
    // 空宫借星
    const oppositeIdx = (palaceIdx + 6) % 12;
    const oppositePalace = allPalaces.find((p: any) => p.index === oppositeIdx);
    const oppositeStars = oppositePalace?.majorStars || [];
    if (oppositeStars.length > 0) {
      mainStarAnalysis = `本宫无主星坐守，借对宫${oppositeStars.map((s: any) => s.name).join('、')}参断。性格灵活多变，受对宫星曜影响较大。\n`;
    } else {
      mainStarAnalysis = '本宫无主星坐守，对宫亦无主星，运势较为平淡，以守成为主。\n';
    }
  }

  // 辅星分析
  const minorStars = palace.minorStars || [];
  let minorStarAnalysis = '';
  minorStars.forEach((star: any) => {
    const jiInfo = JI_STAR_IN_PALACE[star.name]?.[palaceName];
    if (jiInfo) {
      minorStarAnalysis += `${star.name}：${jiInfo}\n`;
    }
  });
  if (minorStarAnalysis === '' && minorStars.length > 0) {
    minorStarAnalysis = minorStars.map((s: any) => s.name).join('、') + '辅佐，助力一般。';
  }

  // 煞星分析
  let shaStarAnalysis = '';
  const allStars = [...majorStars, ...minorStars];
  allStars.forEach((star: any) => {
    const shaKey = Object.keys(SHA_STAR_IN_PALACE).find(k => star.name.includes(k));
    if (shaKey) {
      const shaInfo = SHA_STAR_IN_PALACE[shaKey]?.[palaceName];
      if (shaInfo) {
        shaStarAnalysis += `${star.name}：${shaInfo}\n`;
      }
    }
  });

  // 四化分析
  let sihuaAnalysis = '';
  majorStars.forEach((star: any) => {
    if (star.mutagen) {
      const normMut = normalizeMutagen(star.mutagen);
      const sihuaInfo = SIHUA_IN_PALACE[normMut]?.[palaceName];
      if (sihuaInfo) {
        sihuaAnalysis += `${star.name}${normMut}：${sihuaInfo.meaning}\n建议：${sihuaInfo.advice}\n`;
      }
    }
  });
  minorStars.forEach((star: any) => {
    if (star.mutagen) {
      const normMut = normalizeMutagen(star.mutagen);
      const sihuaInfo = SIHUA_IN_PALACE[normMut]?.[palaceName];
      if (sihuaInfo) {
        sihuaAnalysis += `${star.name}${normMut}：${sihuaInfo.meaning}\n`;
      }
    }
  });

  // 三方四正分析
  const sanfangIndices = getSanfangIndices(palaceIdx);
  const sanfangPalaces = sanfangIndices.map(idx => allPalaces.find((p: any) => p.index === idx)).filter(Boolean);
  const sanfangStars = sanfangPalaces.flatMap((p: any) => p.majorStars.map((s: any) => s.name));
  const duiGongIdx = (palaceIdx + 6) % 12;
  const duiGongPalace = allPalaces.find((p: any) => p.index === duiGongIdx);
  const duiGongStars = duiGongPalace?.majorStars.map((s: any) => s.name) || [];

  let sanfangAnalysis = `三方四正汇入星曜：${sanfangStars.length > 0 ? sanfangStars.join('、') : '无'}\n`;
  sanfangAnalysis += `对宫（${duiGongPalace?.name || ''}）：${duiGongStars.length > 0 ? duiGongStars.join('、') : '无主星'}\n`;

  // 检查三方四正吉凶星比例
  const jiCount = sanfangStars.filter(s =>
    ['左辅', '右弼', '文昌', '文曲', '天魁', '天钺', '紫微', '天府', '太阳', '太阴', '天相', '天梁', '天同'].some(k => s.includes(k))
  ).length;
  const shaCount = sanfangStars.filter(s =>
    ['擎羊', '陀罗', '火星', '铃星', '地空', '地劫'].some(k => s.includes(k))
  ).length;

  if (jiCount > shaCount) {
    sanfangAnalysis += `三方四正吉星多于煞星，${palaceName}得力，运势向好。\n`;
  } else if (shaCount > jiCount) {
    sanfangAnalysis += `三方四正煞星多于吉星，${palaceName}受制，需注意波折。\n`;
  } else {
    sanfangAnalysis += `三方四正吉煞均衡，${palaceName}运势平稳。\n`;
  }

  // 亮度分析
  let brightnessAnalysis = '';
  const brightnessList = majorStars.map((s: any) => s.brightness).filter(Boolean);
  if (brightnessList.length > 0) {
    brightnessAnalysis = brightnessList.map((b: string) => `${b}：${STAR_BRIGHTNESS[b] || ''}`).join('；');
  }

  // 总体评价
  let overall = '';
  const hasLu = majorStars.some((s: any) => normalizeMutagen(s.mutagen) === '化禄');
  const hasJi = majorStars.some((s: any) => normalizeMutagen(s.mutagen) === '化忌');
  const hasMiao = brightnessList.includes('庙') || brightnessList.includes('旺');
  const hasXian = brightnessList.includes('陷') || brightnessList.includes('不');

  if (majorStars.length === 0) {
    overall = `${palaceName}无主星，借对宫参断，运势灵活多变。`;
  } else if (hasLu && hasMiao) {
    overall = `${palaceName}主星庙旺且逢化禄，此宫运势极佳，大吉之象。`;
  } else if (hasJi && hasXian) {
    overall = `${palaceName}主星陷地且逢化忌，此宫运势受阻，需特别注意。`;
  } else if (hasMiao) {
    overall = `${palaceName}主星庙旺，此宫运势良好，发展顺利。`;
  } else if (hasXian) {
    overall = `${palaceName}主星陷地，此宫运势受制，需加倍努力。`;
  } else if (hasLu) {
    overall = `${palaceName}逢化禄，此宫有福气加持，运势向好。`;
  } else if (hasJi) {
    overall = `${palaceName}逢化忌，此宫有波折阻碍，需谨慎应对。`;
  } else {
    overall = `${palaceName}星曜配置平稳，运势中平。`;
  }

  return {
    palaceName,
    area: palaceInfo.area || '',
    description: palaceInfo.description || '',
    mainStarAnalysis,
    minorStarAnalysis,
    shaStarAnalysis,
    sihuaAnalysis,
    sanfangAnalysis,
    brightnessAnalysis,
    overall,
  };
}

// 三方四正关系
function getSanfangIndices(branchIndex: number): number[] {
  const SANFANG_RELATIONS: Record<number, number[]> = {
    0: [4, 8], 1: [5, 9], 2: [6, 10], 3: [7, 11],
    4: [0, 8], 5: [1, 9], 6: [2, 10], 7: [3, 11],
    8: [4, 0], 9: [5, 1], 10: [6, 2], 11: [7, 3],
  };
  return SANFANG_RELATIONS[branchIndex] || [];
}

// ============================================================
// 六、格局检测（增强版）
// ============================================================

function detectPatterns(
  palaces: any[]
): PatternDetail[] {
  const foundPatterns: PatternDetail[] = [];
  const allStarNames = palaces.flatMap((p: any) => p.majorStars.map((s: any) => s.name));
  const allNames = allStarNames.join('');

  // 命宫主星
  const mingGong = palaces.find(p => p.name === '命宫');
  const mingStars = mingGong?.majorStars.map((s: any) => s.name) || [];
  const mingNames = mingStars.join('');

  // 财帛宫
  const caiGong = palaces.find(p => p.name === '财帛');
  const caiStars = caiGong?.majorStars.map((s: any) => s.name) || [];

  // 官禄宫
  const guanGong = palaces.find(p => p.name === '官禄');
  const guanStars = guanGong?.majorStars.map((s: any) => s.name) || [];

  for (const pattern of PATTERN_DETAILS) {
    let matched = false;
    switch (pattern.name) {
      case '紫府同宫格':
        if (mingNames.includes('紫微') && mingNames.includes('天府')) matched = true;
        break;
      case '杀破狼格':
        if (['七杀', '破军', '贪狼'].every(s => allNames.includes(s))) matched = true;
        break;
      case '机月同梁格':
        if (['天机', '太阴', '天同', '天梁'].filter(s => allNames.includes(s)).length >= 3) matched = true;
        break;
      case '府相朝垣格':
        if (allNames.includes('天府') && allNames.includes('天相')) matched = true;
        break;
      case '日月并明格':
        if (allNames.includes('太阳') && allNames.includes('太阴')) matched = true;
        break;
      case '巨日同宫格':
        if (mingNames.includes('巨门') && mingNames.includes('太阳')) matched = true;
        break;
      case '武贪同行格':
        if (mingNames.includes('武曲') && mingNames.includes('贪狼')) matched = true;
        break;
      case '日月反背格':
        // 太阳在申酉戌亥子，太阴在寅卯辰巳午
        const sunPalace = palaces.find((p: any) => p.majorStars.some((s: any) => s.name.includes('太阳')));
        const moonPalace = palaces.find((p: any) => p.majorStars.some((s: any) => s.name.includes('太阴')));
        if (sunPalace && moonPalace) {
          const sunBranch = sunPalace.earthlyBranch;
          const moonBranch = moonPalace.earthlyBranch;
          const sunWeak = ['申', '酉', '戌', '亥', '子'].includes(sunBranch);
          const moonWeak = ['寅', '卯', '辰', '巳', '午'].includes(moonBranch);
          if (sunWeak && moonWeak) matched = true;
        }
        break;
      case '石中隐玉格':
        if (mingNames.includes('巨门')) {
          const branch = mingGong?.earthlyBranch;
          if (branch === '子' || branch === '午') matched = true;
        }
        break;
      case '火贪格/铃贪格':
        const hasHuo = allNames.includes('火星');
        const hasLing = allNames.includes('铃星');
        const hasTan = allNames.includes('贪狼');
        if ((hasHuo && hasTan) || (hasLing && hasTan)) matched = true;
        break;
      case '阳梁昌禄格':
        const hasYang = allNames.includes('太阳');
        const hasLiang = allNames.includes('天梁');
        const hasChang = allNames.includes('文昌');
        const hasLu = palaces.some((p: any) => p.majorStars.some((s: any) => normalizeMutagen(s.mutagen) === '化禄'));
        if (hasYang && hasLiang && hasChang && hasLu) matched = true;
        break;
      case '贪武同行格':
        if (mingNames.includes('贪狼') && mingNames.includes('武曲')) matched = true;
        break;
    }
    if (matched) foundPatterns.push(pattern);
  }

  return foundPatterns;
}

// ============================================================
// 七、命身宫关系分析
// ============================================================

function analyzeMingShen(
  palaces: any[]
): { analysis: string; advice: string } {
  const mingGong = palaces.find((p: any) => p.name === '命宫');
  const shenGong = palaces.find((p: any) => p.isBody);

  if (!mingGong || !shenGong) return { analysis: '', advice: '' };

  const mingStars = mingGong.majorStars.map((s: any) => s.name);
  const shenStars = shenGong.majorStars.map((s: any) => s.name);
  const samePalace = mingGong.index === shenGong.index;

  let analysis = '';
  let advice = '';

  if (samePalace) {
    analysis = `命身同宫：命宫与身宫在同一宫位（${mingGong.name}），${mingStars.join('、')}坐守。命身同宫者，先天禀赋与后天努力方向一致，人生目标明确，精力集中，成就往往较高。`;
    advice = '发挥命身同宫的专注优势，一生聚焦一个方向深耕。';
  } else {
    analysis = `命宫在${mingGong.earthlyBranch}（${mingStars.join('、')}），身宫在${shenGong.name}（${shenStars.join('、') || '无主星'}）。`;

    // 身宫在不同宫位的含义
    const shenGongName = shenGong.name;
    switch (shenGongName) {
      case '夫妻':
        analysis += '身宫在夫妻宫，后天受感情婚姻影响大，中年后运势与配偶密切相关。';
        advice = '慎重择偶，好的婚姻能大幅提升后半生运势。';
        break;
      case '财帛':
        analysis += '身宫在财帛宫，后天受财运驱动，中年后以追逐财富为主要方向。';
        advice = '善用对财富的追求动力，但不可贪得无厌。';
        break;
      case '迁移':
        analysis += '身宫在迁移宫，后天在外出发展中成长，中年后运势与外出、社交密切相关。';
        advice = '宜离乡发展，外出机遇多于守在家中。';
        break;
      case '官禄':
        analysis += '身宫在官禄宫，后天受事业驱动，中年后以事业成就为主要追求。';
        advice = '专注事业发展，事业成则人生顺。';
        break;
      case '福德':
        analysis += '身宫在福德宫，后天受精神世界驱动，中年后注重精神享受和内心修养。';
        advice = '培养精神追求，内心的富足比物质更重要。';
        break;
      default:
        analysis += `身宫在${shenGongName}，后天受此宫位影响。`;
        advice = '根据身宫所在宫位的领域，调整后天努力方向。';
    }
  }

  return { analysis, advice };
}

// ============================================================
// 八、主函数：生成完整深度解读
// ============================================================

export interface ZiweiDetailedAnalysis {
  // 十二宫逐一详析
  palaceDetails: ReturnType<typeof analyzePalaceDetail>[];

  // 格局深度分析
  patterns: PatternDetail[];

  // 大限运势
  decadalAnalysis: ReturnType<typeof analyzeDecadal>[];

  // 命身宫关系
  mingShenAnalysis: { analysis: string; advice: string };

  // 四化飞星总论
  sihuaOverview: {
    palace: string;
    star: string;
    mutagen: string;
    meaning: string;
    advice: string;
  }[];

  // 综合总评
  overallSummary: string;
}

export function generateZiweiDetailedAnalysis(
  palaces: any[],
  basic: any
): ZiweiDetailedAnalysis {
  // 1. 十二宫逐一详析
  const palaceDetails = palaces
    .sort((a: any, b: any) => a.index - b.index)
    .map((p: any) => analyzePalaceDetail(p, p.index, palaces));

  // 2. 格局检测
  const patterns = detectPatterns(palaces);

  // 3. 大限运势
  const decadalAnalysis: ReturnType<typeof analyzeDecadal>[] = [];
  for (const palace of palaces) {
    if (palace.decadal?.range) {
      const result = analyzeDecadal(palace, palace.index, palaces, palace.decadal.range);
      decadalAnalysis.push(result);
    }
  }
  // 按年龄排序
  decadalAnalysis.sort((a, b) => {
    const aStart = parseInt(a.range);
    const bStart = parseInt(b.range);
    return aStart - bStart;
  });

  // 4. 命身宫关系
  const mingShenAnalysis = analyzeMingShen(palaces);

  // 5. 四化飞星总论
  const sihuaOverview = palaces.flatMap(p =>
    [...p.majorStars, ...p.minorStars]
      .filter((s: any) => s.mutagen)
      .map((s: any) => {
        const normMut = normalizeMutagen(s.mutagen);
        const info = SIHUA_IN_PALACE[normMut]?.[p.name];
        return {
          palace: p.name,
          star: s.name,
          mutagen: normMut,
          meaning: info?.meaning || SIHUA_STAR[normMut as keyof typeof SIHUA_STAR]?.meaning || '',
          advice: info?.advice || '',
        };
      })
  );

  // 6. 综合总评
  let overallSummary = '';

  // 命宫总评
  const mingGong = palaces.find((p: any) => p.name === '命宫');
  if (mingGong) {
    const mingStars = mingGong.majorStars.map((s: any) => s.name);
    const brightness = mingGong.majorStars.map((s: any) => s.brightness).filter(Boolean);
    const hasMiao = brightness.includes('庙') || brightness.includes('旺');

    overallSummary += `【命宫总评】\n`;
    if (mingStars.length > 0) {
      overallSummary += `命宫${mingStars.join('、')}坐守`;
      if (hasMiao) overallSummary += '，主星庙旺，先天禀赋优良';
      overallSummary += '。';
    } else {
      overallSummary += '命宫无主星，性格灵活多变，借对宫参断。';
    }
    overallSummary += '\n\n';
  }

  // 格局总评
  if (patterns.length > 0) {
    overallSummary += `【命盘格局】\n`;
    overallSummary += `本命盘检测到${patterns.length}个格局：${patterns.map(p => p.name).join('、')}。\n`;
    overallSummary += `其中${patterns[0].name}是主要格局，${patterns[0].influence}\n\n`;
  }

  // 四化总评
  if (sihuaOverview.length > 0) {
    overallSummary += `【四化飞星总论】\n`;
    const luPalace = sihuaOverview.find(s => s.mutagen === '化禄');
    const quanPalace = sihuaOverview.find(s => s.mutagen === '化权');
    const kePalace = sihuaOverview.find(s => s.mutagen === '化科');
    const jiPalace = sihuaOverview.find(s => s.mutagen === '化忌');

    if (luPalace) overallSummary += `化禄入${luPalace.palace}（${luPalace.star}）：一生财运/福气来源在此。\n`;
    if (quanPalace) overallSummary += `化权入${quanPalace.palace}（${quanPalace.star}）：一生权力/事业重心在此。\n`;
    if (kePalace) overallSummary += `化科入${kePalace.palace}（${kePalace.star}）：一生名声/学业方向在此。\n`;
    if (jiPalace) overallSummary += `化忌入${jiPalace.palace}（${jiPalace.star}）：一生波折/课题所在，需特别注意。\n`;
    overallSummary += '\n';
  }

  // 命身宫关系
  if (mingShenAnalysis.analysis) {
    overallSummary += `【命身宫关系】\n${mingShenAnalysis.analysis}\n\n`;
  }

  // 五行局
  if (basic?.fiveElementsClass) {
    const juInfo = WUXING_JU[basic.fiveElementsClass as keyof typeof WUXING_JU];
    if (juInfo) {
      overallSummary += `【五行局】\n${basic.fiveElementsClass}：${juInfo.personality}\n适合行业：${juInfo.career}\n开运：${juInfo.lucky}\n`;
    }
  }

  return {
    palaceDetails,
    patterns,
    decadalAnalysis,
    mingShenAnalysis,
    sihuaOverview,
    overallSummary,
  };
}
