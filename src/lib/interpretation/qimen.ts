/**
 * 奇门遁甲格局解析
 */

// 八门详解
export const BAMEN_INTERPRETATION: Record<string, {
  level: string;
  meaning: string;
  career: string;
  advice: string;
}> = {
  '开门': { level: '大吉', meaning: '开门见山，万事亨通。代表开创、公开、顺利。最适合开业、求官、出行。', career: '事业大开，适合开拓新事业、求职面试', advice: '把握机遇，大胆行动' },
  '休门': { level: '吉', meaning: '休养生息，贵人扶持。代表休息、调整、修养。适合求财、婚姻、疗养。', career: '适合休整、规划，不宜急躁推进', advice: '适当休息，养精蓄锐' },
  '生门': { level: '大吉', meaning: '生生不息，财运亨通。代表生长、利润、活力。最适合求财、开市、交易。', career: '财运极佳，适合投资创业', advice: '积极求财，把握商机' },
  '伤门': { level: '凶', meaning: '伤灾之象，诸事不利。代表伤害、损失、阻碍。不宜出行、求财、签约。', career: '事业受阻，需谨慎行事', advice: '保守为上，避免冒险' },
  '杜门': { level: '平', meaning: '闭塞不通，隐藏之象。代表封闭、隐藏、防守。适合隐藏、躲避、防守。', career: '事业封闭期，宜守不宜攻', advice: '韬光养晦，等待时机' },
  '景门': { level: '小吉', meaning: '光明之象，文书有利。代表光明、文化、考试。适合考试、求学、上书。', career: '利于考试、文书、合同', advice: '以文取胜，光明正大' },
  '死门': { level: '大凶', meaning: '死气沉沉，万事不宜。代表停滞、结束、阻碍。诸事不利，需特别谨慎。', career: '事业停滞，不宜推进任何事', advice: '静待变化，切勿强求' },
  '惊门': { level: '凶', meaning: '惊恐不安，口舌是非。代表惊吓、争论、官非。不宜签约、诉讼、出行。', career: '防小人口舌，避免纷争', advice: '谨言慎行，远离是非' },
};

// 九星详解
export const JIUXING_INTERPRETATION: Record<string, {
  level: string;
  meaning: string;
  influence: string;
}> = {
  '天蓬': { level: '凶', meaning: '天蓬星，主险阻困难。行事需谨慎，防小人暗算。', influence: '增加困难和阻力' },
  '天任': { level: '吉', meaning: '天任星，主勤劳踏实。做事有担当，能得贵人相助。', influence: '增加稳定性和贵人运' },
  '天冲': { level: '凶', meaning: '天冲星，主冲动变故。容易发生意外变化，需保持冷静。', influence: '增加变动和不确定性' },
  '天辅': { level: '大吉', meaning: '天辅星，主文昌学业。利于考试、求学、文化事业。', influence: '增加学业运和文昌运' },
  '天英': { level: '凶', meaning: '天英星，主火灾血光。需防意外事故，注意用火安全。', influence: '增加意外风险' },
  '天芮': { level: '凶', meaning: '天芮星，主疾病灾祸。需注意健康，防病从口入。', influence: '增加健康风险' },
  '天柱': { level: '凶', meaning: '天柱星，主破坏损耗。事物容易受到破坏，需加强防范。', influence: '增加破坏和损失' },
  '天心': { level: '大吉', meaning: '天心星，主领导权威。利于管理、决策、求医问药。', influence: '增加领导力和决策力' },
  '天禽': { level: '吉', meaning: '天禽星，主中正平和。做事公正，能得众人支持。', influence: '增加人缘和公正' },
};

// 八神详解
export const BASHEN_INTERPRETATION: Record<string, {
  level: string;
  meaning: string;
}> = {
  '值符': { level: '大吉', meaning: '诸神之领袖，最吉之神。所临之方万事皆吉，有贵人相助。' },
  '腾蛇': { level: '凶', meaning: '主虚惊怪异，多梦不安。容易遇到诡异之事，需防小人。' },
  '太阴': { level: '吉', meaning: '主阴佑暗助，贵人暗助。适合密谋策划，暗中行事。' },
  '六合': { level: '吉', meaning: '主和合交易，利于合作。适合谈判、签约、婚姻等合作事项。' },
  '白虎': { level: '凶', meaning: '主凶险威猛，兵戈之象。需防意外伤害和官司纠纷。' },
  '玄武': { level: '凶', meaning: '主盗贼暗害，失财之象。需防盗贼和小人暗算。' },
  '九地': { level: '平', meaning: '主柔顺静守，适合守成。不宜冒进，宜静待时机。' },
  '九天': { level: '吉', meaning: '主刚健上升，适合进取。利于出行、求官、开拓。' },
};

// 特殊格局解析（十干克应精选）
export const SPECIAL_PATTERNS: Record<string, { level: string; description: string }> = {
  '青龙返首': { level: '大吉', description: '戊加丙，大吉之格。万事亨通，求谋皆遂。' },
  '飞鸟跌穴': { level: '大吉', description: '丙加戊，大吉之格。不劳余力，万事顺遂。' },
  '青龙逃走': { level: '凶', description: '乙加辛，凶格。主走失、分离、损失。' },
  '白虎猖狂': { level: '大凶', description: '辛加乙，大凶之格。主灾祸、伤病、官非。' },
  '腾蛇夭矫': { level: '凶', description: '癸加丁，凶格。主虚惊、怪异、不安。' },
  '朱雀投江': { level: '凶', description: '丁加癸，凶格。主口舌、文书、失财。' },
  '荧入白': { level: '凶', description: '丙加庚，凶格。主盗贼、损失、灾祸。' },
  '白入荧': { level: '凶', description: '庚加丙，凶格。主客不利、口舌、争斗。' },
};

// 十干克应完整81格局（天盘+地盘）
export const TEN_STEM_PATTERNS: Record<string, {
  name: string;
  level: '大吉' | '吉' | '中' | '凶' | '大凶';
  description: string;
}> = {
  // 天盘乙
  '乙乙': { name: '日奇伏吟', level: '中', description: '乙加乙，伏吟格。主内部不安，事多迟滞，宜守不宜进。' },
  '乙丙': { name: '奇仪顺遂', level: '吉', description: '乙加丙，吉格。主事情顺利，阴阳和谐，可积极行动。' },
  '乙丁': { name: '奇仪相佐', level: '吉', description: '乙加丁，吉格。主有贵人相助，文书有利，事业顺遂。' },
  '乙戊': { name: '阴害阳门', level: '中', description: '乙加戊，利于阴人阴事，不利阳人阳事。吉凶看门。' },
  '乙己': { name: '日奇入墓', level: '凶', description: '乙加己，凶格。主光明被掩，事多阻碍，才华难展。' },
  '乙庚': { name: '奇被刑', level: '凶', description: '乙加庚，凶格。主日奇受制，事业受损，防小人。' },
  '乙辛': { name: '青龙逃走', level: '凶', description: '乙加辛，凶格。主走失、分离、损失，女逃男散。' },
  '乙壬': { name: '日奇入地', level: '中', description: '乙加壬，主尊卑悖乱，官讼是非，阴人不利。' },
  '乙癸': { name: '日奇地网', level: '凶', description: '乙加癸，凶格。主华盖逢星，遁身避世，事多阻碍。' },
  // 天盘丙
  '丙乙': { name: '日月并行', level: '吉', description: '丙加乙，吉格。主日月并行，公私皆利，谋事可成。' },
  '丙丙': { name: '月奇悖师', level: '中', description: '丙加丙，主文书逼迫，公事私事皆多麻烦。' },
  '丙丁': { name: '三奇顺遂', level: '吉', description: '丙加丁，吉格。主三奇顺遂，文书吉，星随月转。' },
  '丙戊': { name: '飞鸟跌穴', level: '大吉', description: '丙加戊，第二吉格。不劳余力，万事顺遂，飞鸟归巢。' },
  '丙己': { name: '火悖入刑', level: '凶', description: '丙加己，凶格。主火入刑狱，官非口舌，事多不顺。' },
  '丙庚': { name: '荧入太白', level: '凶', description: '丙加庚，凶格。主盗贼将至，客不利，需防损失。' },
  '丙辛': { name: '谋事成就', level: '吉', description: '丙加辛，吉格。主谋事可成，干合有情，诸事顺利。' },
  '丙壬': { name: '火入天罗', level: '凶', description: '丙加壬，凶格。主火入天罗，为客不利，是非多。' },
  '丙癸': { name: '月奇地网', level: '凶', description: '丙加癸，凶格。主月奇入墓，阴人害事，暗昧不明。' },
  // 天盘丁
  '丁乙': { name: '玉女奇生', level: '吉', description: '丁加乙，吉格。主玉女奇生，贵人加被，万事更新。' },
  '丁丙': { name: '星随月转', level: '吉', description: '丁加丙，吉格。主星随月转，贵人提携，随势而行。' },
  '丁丁': { name: '奇入太阴', level: '吉', description: '丁加丁，吉格。主奇入太阴，文书吉，暗中有利。' },
  '丁戊': { name: '青龙转光', level: '吉', description: '丁加戊，第四吉格。主青龙转光，好事更加顺利。' },
  '丁己': { name: '火入勾陈', level: '凶', description: '丁加己，凶格。主火入勾陈，暗昧不明，事多纠缠。' },
  '丁庚': { name: '星奇受阻', level: '凶', description: '丁加庚，凶格。主星奇被阻，文书阻隔，行人不至。' },
  '丁辛': { name: '朱雀入狱', level: '凶', description: '丁加辛，凶格。主朱雀入狱，官非口舌，文书失理。' },
  '丁壬': { name: '奇仪相合', level: '吉', description: '丁加壬，吉格。主奇仪相合，干合有情，贵人暗助。' },
  '丁癸': { name: '朱雀投江', level: '凶', description: '丁加癸，凶格。主朱雀投江，文书口舌是非，音信全无。' },
  // 天盘戊
  '戊戊': { name: '青龙伏吟', level: '凶', description: '戊加戊，伏吟格。主本地内部，推迟，以守为主。' },
  '戊乙': { name: '青龙和会', level: '吉', description: '戊加乙，吉格。主青龙和会，合作契机，门吉事吉。' },
  '戊丙': { name: '青龙回首', level: '大吉', description: '戊加丙，第一吉格。万事亨通，求谋皆遂，大吉大利。' },
  '戊丁': { name: '青龙耀明', level: '吉', description: '戊加丁，第三吉格。利于见贵人、求取功名。' },
  '戊己': { name: '贵人入狱', level: '凶', description: '戊加己，凶格。主于公私均不利，冲墓之时方有转机。' },
  '戊庚': { name: '值符飞宫', level: '凶', description: '戊加庚，凶格。好事不成，凶事更凶，值符飞离此宫。' },
  '戊辛': { name: '青龙折足', level: '凶', description: '戊加辛，凶格。主青龙折足，吉门能助，凶门更凶。' },
  '戊壬': { name: '青龙入牢', level: '凶', description: '戊加壬，凶格。主青龙入天牢，凡事不利，谋望难成。' },
  '戊癸': { name: '青龙华盖', level: '中', description: '戊加癸，主青龙华盖，逢吉门吉星尚可，逢凶则不利。' },
  // 天盘己
  '己乙': { name: '地户逢星', level: '中', description: '己加乙，主地户逢星，门吉则事吉，门凶则事不成。' },
  '己丙': { name: '火悖地户', level: '中', description: '己加丙，主火悖地户，阳人有害，阴阳反目。' },
  '己丁': { name: '地户朱雀', level: '凶', description: '己加丁，凶格。主地户朱雀，文书口舌，暗昧不明。' },
  '己戊': { name: '犬遇青龙', level: '中', description: '己加戊，门吉则事吉，门凶则事不成，犬遇青龙。' },
  '己己': { name: '地户逢鬼', level: '凶', description: '己加己，凶格。百事不遂，疾病发凶，好事不成。' },
  '己庚': { name: '刑格返名', level: '凶', description: '己加庚，凶格。不宜谋事，词讼先动者不利。' },
  '己辛': { name: '游魂入墓', level: '凶', description: '己加辛，凶格。主鬼魅作祟，小心谨慎，游魂不安。' },
  '己壬': { name: '地网高张', level: '凶', description: '己加壬，凶格。谋为不利，凡事不吉，易出奸情之事。' },
  '己癸': { name: '地刑玄武', level: '凶', description: '己加癸，凶格。主男女疾病垂危，囚狱词讼之灾。' },
  // 天盘庚
  '庚乙': { name: '太白逢星', level: '凶', description: '庚加乙，凶格。主太白逢星，退吉进凶，客不利。' },
  '庚丙': { name: '太白入荧', level: '凶', description: '庚加丙，凶格。主白入荧，贼必来，客不利主。' },
  '庚丁': { name: '亭亭之格', level: '中', description: '庚加丁，主亭亭之格，因私匿起官司，门吉有救。' },
  '庚戊': { name: '值符伏宫', level: '凶', description: '庚加戊，凶格。主值符伏宫，天乙飞宫，不利谋事。' },
  '庚己': { name: '官府刑格', level: '凶', description: '庚加己，凶格。主官司是非，判刑牢狱之灾。' },
  '庚庚': { name: '太白同宫', level: '凶', description: '庚加庚，凶格。战格，兄弟冲撞，招来官灾横祸。' },
  '庚辛': { name: '白虎干格', level: '凶', description: '庚加辛，凶格。远行不利，诸事有灾，求财更凶。' },
  '庚壬': { name: '小格', level: '凶', description: '庚加壬，凶格。远行迷失，音信全无，上格之象。' },
  '庚癸': { name: '大格', level: '凶', description: '庚加癸，凶格。主车祸行人不至，官讼不息。' },
  // 天盘辛
  '辛乙': { name: '白虎猖狂', level: '大凶', description: '辛加乙，大凶格。主灾祸、伤病、官非，家败人亡。' },
  '辛丙': { name: '干合悖师', level: '中', description: '辛加丙，主干合悖师，门吉则吉，门凶则凶。' },
  '辛丁': { name: '狱神得奇', level: '吉', description: '辛加丁，吉格。狱神得奇，囚人释放，百事皆吉。' },
  '辛戊': { name: '困龙被伤', level: '凶', description: '辛加戊，凶格。困龙被伤，主官司败诉，屈遭刑罚。' },
  '辛己': { name: '入狱自刑', level: '凶', description: '辛加己，凶格。错误由自身造成，奴仆背主，诉讼难伸。' },
  '辛庚': { name: '白虎出力', level: '凶', description: '辛加庚，凶格。主客相残，不可强进，兵戈之象。' },
  '辛辛': { name: '伏吟天庭', level: '凶', description: '辛加辛，凶格。为事自破，进退不果，公废私就。' },
  '辛壬': { name: '凶蛇入狱', level: '凶', description: '辛加壬，凶格。两男争女，争讼不息，先动失理。' },
  '辛癸': { name: '虎投地网', level: '凶', description: '辛加癸，凶格。日月失明，误入地网，动止乖张。' },
  // 天盘壬
  '壬乙': { name: '小蛇得势', level: '中', description: '壬加乙，主小蛇得势，柔能克刚，女子柔顺。' },
  '壬丙': { name: '水蛇入火', level: '凶', description: '壬加丙，凶格。水蛇入火，主官灾刑狱，文书不利。' },
  '壬丁': { name: '干合蛇刑', level: '中', description: '壬加丁，主干合蛇刑，贵人封诰，文书吉利。' },
  '壬戊': { name: '小蛇化龙', level: '吉', description: '壬加戊，吉格。小蛇化龙，男人发达，女人产婴童。' },
  '壬己': { name: '反吟蛇刑', level: '凶', description: '壬加己，凶格。官司败诉，大祸将至，顺守可吉。' },
  '壬庚': { name: '太白擒蛇', level: '中', description: '壬加庚，主太白擒蛇，刑狱公平，立判邪正。' },
  '壬辛': { name: '腾蛇相缠', level: '凶', description: '壬加辛，凶格。吉门也不得安宁，谋望被人欺骗。' },
  '壬壬': { name: '蛇入地罗', level: '凶', description: '壬加壬，凶格。谋事无成，外事缠绕，诸事破败。' },
  '壬癸': { name: '幼女奸淫', level: '凶', description: '壬加癸，凶格。天罗逢地网，诸事不利，阴阳交合。' },
  // 天盘癸
  '癸乙': { name: '华盖逢星', level: '吉', description: '癸加乙，吉格。华盖逢星，贵人施恩，福禄自生。' },
  '癸丙': { name: '华盖悖师', level: '中', description: '癸加丙，主华盖悖师，贵人不临，阴人害事。' },
  '癸丁': { name: '腾蛇夭矫', level: '凶', description: '癸加丁，凶格。主虚惊怪异，官司诉讼，火焚难逃。' },
  '癸戊': { name: '天乙会合', level: '吉', description: '癸加戊，吉格。天乙会合，财喜婚姻，吉人引导。' },
  '癸己': { name: '华盖地户', level: '凶', description: '癸加己，凶格。男女音信皆阻，躲灾避难为吉。' },
  '癸庚': { name: '太白入网', level: '凶', description: '癸加庚，凶格。凡事无成，吉事易空，暴力争讼。' },
  '癸辛': { name: '网盖天牢', level: '凶', description: '癸加辛，凶格。官司败诉，死罪难逃，占病大凶。' },
  '癸壬': { name: '复见腾蛇', level: '凶', description: '癸加壬，凶格。婚姻重婚，婚后无子，事物变化。' },
  '癸癸': { name: '天网四张', level: '凶', description: '癸加癸，凶格。天网四张，行人失伴，病讼皆伤。' },
};

// 九宫八卦方位对应
export const JIUGONG_BAGUA: Record<string, {
  palace: number;
  gua: string;
  direction: string;
  wuxing: string;
  meaning: string;
  bodyPart: string;
  season: string;
}> = {
  '坎一宫': { palace: 1, gua: '坎', direction: '北方', wuxing: '水', meaning: '流动、根基、险陷', bodyPart: '耳、肾、泌尿系统', season: '冬至' },
  '坤二宫': { palace: 2, gua: '坤', direction: '西南', wuxing: '土', meaning: '大地、母亲、包容', bodyPart: '腹、脾胃、消化系统', season: '立秋' },
  '震三宫': { palace: 3, gua: '震', direction: '东方', wuxing: '木', meaning: '雷、行动、奋起', bodyPart: '足、肝、神经系统', season: '春分' },
  '巽四宫': { palace: 4, gua: '巽', direction: '东南', wuxing: '木', meaning: '风、入、文昌', bodyPart: '股、胆、呼吸系统', season: '立夏' },
  '中五宫': { palace: 5, gua: '中', direction: '中央', wuxing: '土', meaning: '太极、枢纽、万物归藏', bodyPart: '脾胃、中枢', season: '四季交替' },
  '乾六宫': { palace: 6, gua: '乾', direction: '西北', wuxing: '金', meaning: '天、君王、刚健', bodyPart: '首、肺、骨骼', season: '立冬' },
  '兑七宫': { palace: 7, gua: '兑', direction: '西方', wuxing: '金', meaning: '泽、悦、口舌', bodyPart: '口、肺、牙齿', season: '秋分' },
  '艮八宫': { palace: 8, gua: '艮', direction: '东北', wuxing: '土', meaning: '山、止、门路', bodyPart: '手、指、脾胃', season: '立春' },
  '离九宫': { palace: 9, gua: '离', direction: '南方', wuxing: '火', meaning: '光明、附着、美丽', bodyPart: '目、心脏、血液循环', season: '夏至' },
};

// 奇门用神取用
export const QIMEN_YONGSHEN: Record<string, { yongshen: string; description: string }> = {
  '求财': { yongshen: '生门', description: '以生门为用神，兼看日干与生门关系。生门旺相则财运亨通。' },
  '事业': { yongshen: '开门', description: '以开门为用神，兼看值符。开门旺相则事业顺利。' },
  '婚姻': { yongshen: '六合', description: '以六合为用神，兼看乙庚关系。六合旺相则婚姻美满。' },
  '考试': { yongshen: '天辅', description: '以天辅星为用神，兼看丁奇。天辅旺相则考试顺利。' },
  '疾病': { yongshen: '天芮', description: '以天芮星为病星，天心星为医药。看二者关系判断病情。' },
  '出行': { yongshen: '九天', description: '以九天为用神，兼看所往方位。九天旺相则出行顺利。' },
  '官司': { yongshen: '开门', description: '以开门为法官，景门为诉状，值符为原告。看各方关系定胜负。' },
  '失物': { yongshen: '日干', description: '以日干为失主，时干为失物。看落宫方位判断方向与距离。' },
  '战争': { yongshen: '值符', description: '以值符为主，九天为客。值符旺相主胜，九天旺相客胜。' },
  '天气': { yongshen: '天英', description: '以天英星为用神。天英旺相主晴，天蓬旺相主雨。' },
};

// 奇门吉凶格汇总
export const JIGE_SUMMARY: Record<string, { level: string; description: string }> = {
  '龙回首': { level: '大吉', description: '戊+丙，第一吉格，诸事皆吉' },
  '鸟跌穴': { level: '大吉', description: '丙+戊，第二吉格，不劳余力' },
  '青龙耀明': { level: '吉', description: '戊+丁，第三吉格，利见贵人' },
  '青龙转光': { level: '吉', description: '丁+戊，第四吉格，好事更顺' },
  '青龙和会': { level: '吉', description: '戊+乙，合作有利' },
  '玉女奇生': { level: '吉', description: '丁+乙，万事更新' },
  '星随月转': { level: '吉', description: '丁+丙，贵人提携' },
  '奇入太阴': { level: '吉', description: '丁+丁，暗中有利' },
  '日月并行': { level: '吉', description: '丙+乙，公私皆利' },
  '谋事成就': { level: '吉', description: '丙+辛，干合有情' },
  '奇仪顺遂': { level: '吉', description: '乙+丙，阴阳和谐' },
  '奇仪相佐': { level: '吉', description: '乙+丁，贵人相助' },
  '狱神得奇': { level: '吉', description: '辛+丁，囚人释放' },
  '小蛇化龙': { level: '吉', description: '壬+戊，男人发达' },
  '天乙会合': { level: '吉', description: '癸+戊，财喜婚姻' },
  '华盖逢星': { level: '吉', description: '癸+乙，贵人施恩' },
};

export const XIONGGE_SUMMARY: Record<string, { level: string; description: string }> = {
  '青龙逃走': { level: '凶', description: '乙+辛，走失分离' },
  '白虎猖狂': { level: '大凶', description: '辛+乙，灾祸官非' },
  '腾蛇夭矫': { level: '凶', description: '癸+丁，虚惊怪异' },
  '朱雀投江': { level: '凶', description: '丁+癸，文书口舌' },
  '荧入太白': { level: '凶', description: '丙+庚，盗贼损失' },
  '白入荧': { level: '凶', description: '庚+丙，客不利主' },
  '值符飞宫': { level: '凶', description: '戊+庚，好事不成' },
  '青龙折足': { level: '凶', description: '戊+辛，吉门能助' },
  '青龙入牢': { level: '凶', description: '戊+壬，凡事不利' },
  '贵人入狱': { level: '凶', description: '戊+己，公私不利' },
  '地户逢鬼': { level: '凶', description: '己+己，百事不遂' },
  '太白同宫': { level: '凶', description: '庚+庚，官灾横祸' },
  '白虎干格': { level: '凶', description: '庚+辛，远行不利' },
  '大格': { level: '凶', description: '庚+癸，车祸官讼' },
  '天网四张': { level: '凶', description: '癸+癸，行人失伴' },
  '网盖天牢': { level: '凶', description: '癸+辛，官司败诉' },
  '太白入网': { level: '凶', description: '癸+庚，凡事无成' },
  '困龙被伤': { level: '凶', description: '辛+戊，官司败诉' },
};
