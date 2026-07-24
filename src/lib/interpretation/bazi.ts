/**
 * 八字命理解析数据库
 * 包含日主性格、五行分析、事业、财运、婚姻、健康等解读
 */

// 十天干日主性格解析
export const DAY_GAN_PERSONALITY: Record<string, {
  title: string;
  nature: string;
  personality: string;
  strength: string;
  weakness: string;
  career: string;
  wealth: string;
  marriage: string;
  health: string;
  advice: string;
  lucky: { color: string; number: string; direction: string; flower: string };
}> = {
  '甲': {
    title: '甲木日主',
    nature: '阳木，参天大树，栋梁之材',
    personality: '性格刚正不阿，有领导才能和开拓精神。为人正直，有主见，不轻易服输。如参天大树般挺拔，有担当和责任感。做事有魄力，敢于挑战，但有时过于固执。',
    strength: '领导力强、正直坦率、意志坚定、开拓进取、有担当',
    weakness: '过于固执、不善变通、有时显得霸道、缺乏耐心',
    career: '适合从事管理、领导、法律、教育、木材园林、建筑设计等行业。有创业天赋，适合做决策者。',
    wealth: '财运稳健，属于靠实力和能力赚钱的类型。正财运佳，偏财需努力争取。中年后财运渐佳。',
    marriage: '感情中较为强势，需要学会包容和体贴。男命克妻之嫌，需多关心伴侣。女命则易遇强势对象。',
    health: '注意肝胆、筋骨、眼睛方面的保养。避免过度劳累，少熬夜。春季养生最佳。',
    advice: '学会灵活变通，多听取他人意见。培养耐心和包容心，事业会更上一层楼。',
    lucky: { color: '绿色、青色', number: '1、6', direction: '东方', flower: '兰花、竹子' },
  },
  '乙': {
    title: '乙木日主',
    nature: '阴木，花草藤萝，柔韧之木',
    personality: '性格温和柔顺，善于适应环境。如花草藤蔓般柔韧，看似柔弱实则坚韧。心思细腻，善于观察，有艺术天赋。懂得借力使力，善于合作。',
    strength: '适应力强、善于交际、心思细腻、有艺术感、柔中带刚',
    weakness: '优柔寡断、依赖心重、容易受他人影响、缺乏主见',
    career: '适合文艺、设计、花卉园艺、医药、服装、文秘等需要细心和创意的行业。适合做副手或顾问。',
    wealth: '财运平稳，善于理财。不追求大起大落，更倾向于稳定收入。偏财运不错，尤其贵人带来的机会。',
    marriage: '感情细腻温柔，对伴侣体贴入微。异性缘佳，但需注意不要过于依赖对方。婚姻生活和谐美满。',
    health: '注意肝脏、神经系统、过敏等问题。保持心情舒畅，多接触大自然。',
    advice: '增强自信心，学会独立做决定。发挥自身的柔韧优势，以柔克刚。',
    lucky: { color: '绿色、粉色', number: '3、8', direction: '东方', flower: '玫瑰、百合' },
  },
  '丙': {
    title: '丙火日主',
    nature: '阳火，太阳之火，光明普照',
    personality: '性格热情开朗，如太阳般温暖照耀四方。为人慷慨大方，乐于助人，有感染力。做事积极主动，充满活力，但有时过于急躁。',
    strength: '热情开朗、慷慨大方、感染力强、积极主动、光明磊落',
    weakness: '急躁冲动、好面子、缺乏持久力、有时过于张扬',
    career: '适合演艺、传媒、教育、能源、电力、餐饮等行业。天生具有明星气质，适合需要展示自我的工作。',
    wealth: '赚钱能力强，但花钱也大手大脚。正财偏财均有，但需注意理财，避免入不敷出。',
    marriage: '感情热烈而浪漫，对爱人热情似火。但需注意不要过于强势，给伴侣一些空间。',
    health: '注意心脏、血压、眼睛等方面。避免过度操劳，学会放松。夏季注意防暑。',
    advice: '培养耐心和持久力，做事三思而后行。低调行事反而能获得更多尊重。',
    lucky: { color: '红色、紫色', number: '2、7', direction: '南方', flower: '牡丹、向日葵' },
  },
  '丁': {
    title: '丁火日主',
    nature: '阴火，灯烛之光，文明之火',
    personality: '性格温柔细腻，如烛光般温暖而不刺眼。内心敏感，思维敏捷，有洞察力。做事有条理，注重细节，适合做研究和创作。',
    strength: '温柔细腻、思维敏捷、洞察力强、注重细节、有文化底蕴',
    weakness: '多愁善感、过于敏感、缺乏自信、容易焦虑',
    career: '适合文化、教育、研究、电子、光学、心理咨询等需要细致思考的行业。在幕后策划更能发挥才能。',
    wealth: '财运平稳，善于积蓄。不追求暴富，更倾向于细水长流。中年后财运渐佳。',
    marriage: '感情含蓄内敛，需要时间打开心扉。对伴侣忠诚体贴，婚姻生活温馨和睦。',
    health: '注意心脏、血液循环、视力等问题。保持良好作息，避免熬夜。',
    advice: '增强自信心，不要过分在意他人看法。发挥自身洞察优势，在专业领域深耕。',
    lucky: { color: '红色、橙色', number: '2、7', direction: '南方', flower: '荷花、茉莉' },
  },
  '戊': {
    title: '戊土日主',
    nature: '阳土，高山大地，厚德载物',
    personality: '性格稳重踏实，如高山大地般厚重可靠。为人诚信忠厚，言出必行。有包容心，能容纳万物。做事有始有终，值得信赖。',
    strength: '稳重踏实、诚信可靠、包容心强、有耐心、重信守诺',
    weakness: '过于保守、反应较慢、固执己见、不够灵活',
    career: '适合房地产、建筑、农业、矿业、金融、仓储等行业。适合做管理和行政工作。',
    wealth: '财运稳健，属于厚积薄发型。不急于求成，中年后财运亨通。善于守财，是理财高手。',
    marriage: '感情忠诚可靠，对家庭负责。但表达感情较为含蓄，需多与伴侣沟通。婚姻稳定长久。',
    health: '注意脾胃、消化系统。饮食宜规律，避免暴饮暴食。多运动，保持身体活力。',
    advice: '适当接受新事物，不要过于保守。在稳重的基础上，培养创新意识。',
    lucky: { color: '黄色、棕色', number: '5、0', direction: '中央/西南', flower: '菊花、桂花' },
  },
  '己': {
    title: '己土日主',
    nature: '阴土，田园沃土，滋养万物',
    personality: '性格温和谦逊，如田园沃土般默默滋养。为人细心周到，善于照顾他人。做事踏实认真，有服务精神。内心丰富，但不轻易表露。',
    strength: '温和谦逊、细心周到、善于照顾人、踏实认真、有服务精神',
    weakness: '过于迁就他人、缺乏主见、容易委屈自己、优柔寡断',
    career: '适合医疗、护理、教育、农业、服务业、人力资源等行业。善于辅助他人成功。',
    wealth: '财运平稳，善于精打细算。不追求奢华，注重实用。积蓄能力强，晚年财运佳。',
    marriage: '感情温柔体贴，是理想的伴侣。但需注意不要过度付出，保持自我。婚姻温馨美满。',
    health: '注意脾胃、消化系统、皮肤等问题。保持饮食均衡，适当运动。',
    advice: '学会说"不"，不要总是迁就他人。适当表达自身需求，才能获得真正的平衡。',
    lucky: { color: '黄色、米色', number: '5、0', direction: '中央/西南', flower: '康乃馨、向日葵' },
  },
  '庚': {
    title: '庚金日主',
    nature: '阳金，刀剑之金，刚毅果决',
    personality: '性格刚毅果断，如刀剑般锋利。为人直爽豪迈，有侠义精神。做事雷厉风行，有决断力。重义气，讲原则，但有时过于强硬。',
    strength: '刚毅果断、直爽豪迈、有决断力、重义气、执行力强',
    weakness: '过于刚硬、不善表达感情、容易伤人、缺乏柔情',
    career: '适合军警、法律、金融、机械、外科医生、运动员等行业。适合需要果断决策的岗位。',
    wealth: '财运起伏较大，有暴富机会也易破财。偏财运佳，但需控制风险。学会理财很重要。',
    marriage: '感情中过于直接，需学会温柔表达。对爱人忠诚但缺乏浪漫。建议多培养情趣。',
    health: '注意肺部、呼吸系统、骨骼、牙齿等。避免过度劳累，注意防寒保暖。',
    advice: '刚柔并济方能长久。学会在坚持原则的同时，多一些温情和包容。',
    lucky: { color: '白色、银色', number: '4、9', direction: '西方', flower: '梅花、白兰花' },
  },
  '辛': {
    title: '辛金日主',
    nature: '阴金，珠玉首饰，精致优雅',
    personality: '性格精致优雅，如珠宝般光彩照人。为人细腻敏感，有品味。追求完美，注重细节。内心坚强，外表柔和。有艺术天赋和审美能力。',
    strength: '精致优雅、细腻敏感、有品味、追求完美、外柔内刚',
    weakness: '过于挑剔、敏感多疑、好面子、有时显得做作',
    career: '适合珠宝、艺术、设计、金融分析、精密仪器、外交等行业。适合需要审美和精细的工作。',
    wealth: '财运不错，善于发现赚钱机会。对金钱有敏锐的嗅觉，投资理财能力较强。',
    marriage: '感情要求较高，追求完美的爱情。对伴侣体贴但也挑剔。需要学会接纳不完美。',
    health: '注意肺部、皮肤、过敏等问题。保持良好心态，避免过度焦虑。',
    advice: '不要过于追求完美，学会欣赏缺憾之美。保持真实自然，反而更有魅力。',
    lucky: { color: '白色、金色', number: '4、9', direction: '西方', flower: '兰花、水仙' },
  },
  '壬': {
    title: '壬水日主',
    nature: '阳水，江河大海，智慧无穷',
    personality: '性格聪明灵活，如江河大海般奔腾不息。思维活跃，足智多谋。胸怀宽广，志向远大。善于变通，适应力强。有商业头脑和战略眼光。',
    strength: '聪明灵活、思维活跃、胸怀宽广、善于变通、有商业头脑',
    weakness: '变化无常、不够专注、容易分心、有时过于算计',
    career: '适合商业、贸易、物流、旅游、传媒、外交等行业。有很强的商业嗅觉和战略思维。',
    wealth: '财运亨通，善于把握商机。正财偏财俱佳，是最容易发财的日主之一。但需注意守财。',
    marriage: '感情丰富，异性缘佳。但容易见异思迁，需学会专一。婚后需多花时间经营感情。',
    health: '注意肾脏、泌尿系统、耳朵等。避免过度劳累，注意保暖防寒。冬季养生尤为重要。',
    advice: '专注一个方向深耕，不要什么都想尝试。诚信为本，方能赢得长久信任。',
    lucky: { color: '黑色、深蓝色', number: '1、6', direction: '北方', flower: '荷花、睡莲' },
  },
  '癸': {
    title: '癸水日主',
    nature: '阴水，雨露甘泉，润物无声',
    personality: '性格柔和聪慧，如雨露甘泉般润物无声。心思缜密，直觉敏锐。善于观察和分析，有很强的第六感。为人低调谦逊，但内心有坚定想法。',
    strength: '柔和聪慧、心思缜密、直觉敏锐、低调谦逊、善于分析',
    weakness: '过于多虑、缺乏安全感、容易悲观、行动力不足',
    career: '适合研究、分析、策划、心理咨询、玄学、水利等行业。适合做幕后智囊。',
    wealth: '财运平稳，善于积蓄。不追求大富大贵，更注重精神层面的满足。晚年财运较好。',
    marriage: '感情细腻敏感，需要安全感。对爱人温柔体贴，但有时过于多疑。婚姻需要相互信任。',
    health: '注意肾脏、泌尿系统、免疫力等。保持乐观心态，多运动增强体魄。',
    advice: '增强行动力，不要想太多而做太少。保持乐观积极的心态，好运会自然来临。',
    lucky: { color: '黑色、浅蓝色', number: '1、6', direction: '北方', flower: '兰花、梅花' },
  },
};

// 五行旺衰解析
export const WUXING_ANALYSIS: Record<string, {
  description: string;
  career: string;
  wealth: string;
  health: string;
  personality: string;
}> = {
  '金旺': {
    description: '金气旺盛，性格刚毅果断，有领导才能。重义气，做事雷厉风行。',
    career: '适合金融、法律、军警、机械等行业发展',
    wealth: '正财运佳，靠实力赚钱，中年后财运亨通',
    health: '注意肺部和呼吸系统，秋季注意保养',
    personality: '果断刚毅，重情重义，但需注意不要过于强硬',
  },
  '木旺': {
    description: '木气旺盛，性格仁慈正直，有进取心。富有创造力，生机勃勃。',
    career: '适合教育、医疗、文化、园林等行业发展',
    wealth: '财运稳步上升，靠才华和智慧赚钱',
    health: '注意肝胆和眼睛，春季注意养生',
    personality: '仁慈正直，积极向上，但需注意不要过于固执',
  },
  '水旺': {
    description: '水气旺盛，聪明灵活，善于变通。智慧过人，适应力强。',
    career: '适合商业、贸易、传媒、旅游等行业发展',
    wealth: '偏财运佳，善于把握机会，容易获得意外之财',
    health: '注意肾脏和泌尿系统，冬季注意保暖',
    personality: '聪明灵活，善于交际，但需注意不要过于算计',
  },
  '火旺': {
    description: '火气旺盛，热情开朗，有感染力。充满活力，积极向上。',
    career: '适合演艺、传媒、能源、餐饮等行业发展',
    wealth: '赚钱能力强，但花销也大，需学会理财',
    health: '注意心脏和血压，夏季注意防暑降温',
    personality: '热情开朗，积极乐观，但需注意不要过于急躁',
  },
  '土旺': {
    description: '土气旺盛，稳重踏实，诚信可靠。包容心强，善于守成。',
    career: '适合房地产、农业、建筑、金融等行业发展',
    wealth: '财运稳健，善于积蓄，是守财能手',
    health: '注意脾胃和消化系统，饮食宜规律',
    personality: '稳重踏实，忠诚可靠，但需注意不要过于保守',
  },
};

// 纳音五行解析
export const NAYIN_INTERPRETATION: Record<string, string> = {
  '海中金': '性格内敛，才华深藏不露，大器晚成之象。需要时间和机遇来展现才华。',
  '炉中火': '性格热烈，如炉中之火，热情奔放。适合创业，有冲劲和魄力。',
  '大林木': '如参天大树，根基深厚。性格坚韧，有担当，是栋梁之材。',
  '路旁土': '为人朴实，乐于助人。虽不显眼但不可或缺，贵人运佳。',
  '剑锋金': '性格刚毅，如利剑出鞘。有锐气和魄力，适合开拓性事业。',
  '山头火': '热情如火，光明磊落。有领导气质，事业心强。',
  '涧下水': '聪明灵活，如涧底清泉。思维敏捷，善于发现机会。',
  '城头土': '为人稳重，有责任感。如城墙般坚固可靠，值得信赖。',
  '白蜡金': '外柔内刚，如蜡中之金。需要磨练方能成才，中年后运势渐佳。',
  '杨柳木': '性格柔顺，善于适应。如杨柳般柔韧，以柔克刚。',
  '泉中水': '内心清澈，智慧如泉。善于思考，有独到见解。',
  '屋上土': '为人厚道，有包容心。如屋顶遮风挡雨，保护家人。',
  '霹雳火': '性格刚烈，如霹雳闪电。做事雷厉风行，有爆发力。',
  '松柏木': '性格坚毅，如松柏常青。不畏严寒，有长寿之象。',
  '长流水': '智慧绵长，如流水不断。思维活跃，善于变通。',
  '沙中金': '才华被埋没，需要发掘。一旦被发现，光芒万丈。',
  '山下火': '如山下之火，温暖而不烈。性格温和，有内涵。',
  '平地木': '扎根大地，稳重踏实。如平地之木，稳步成长。',
  '壁上土': '为人谨慎，善于防守。如壁上的土，守护家园。',
  '金箔金': '外表光鲜，内心脆弱。需要注意内在修养。',
  '覆灯火': '如灯烛之光，虽小而明。内心温暖，照亮他人。',
  '天河水': '如天上银河，气势磅礴。志向远大，胸怀宽广。',
  '大驿土': '为人豁达，见多识广。如驿站之土，迎来送往。',
  '钗钏金': '精致优雅，有品味。如首饰般光彩照人。',
  '桑柘木': '实用之材，默默奉献。虽不张扬但价值非凡。',
  '大溪水': '如大溪奔流，气势不凡。性格豪爽，有冲劲。',
  '沙中土': '内涵丰富，需要磨练。如沙中之土，厚积薄发。',
  '天上火': '如太阳高照，光芒万丈。性格光明磊落，有领袖气质。',
  '石榴木': '多子多福，果实累累。家庭运佳，晚年幸福。',
  '大海水': '如大海般深邃广阔。胸怀大志，包容万物。',
};

// 地支藏干
export const DIZHI_CANGGAN: Record<string, { bengQi: string; zhongQi?: string; yuQi?: string }> = {
  '子': { bengQi: '癸' },
  '丑': { bengQi: '己', zhongQi: '癸', yuQi: '辛' },
  '寅': { bengQi: '甲', zhongQi: '丙', yuQi: '戊' },
  '卯': { bengQi: '乙' },
  '辰': { bengQi: '戊', zhongQi: '乙', yuQi: '癸' },
  '巳': { bengQi: '丙', zhongQi: '庚', yuQi: '戊' },
  '午': { bengQi: '丁', zhongQi: '己' },
  '未': { bengQi: '己', zhongQi: '丁', yuQi: '乙' },
  '申': { bengQi: '庚', zhongQi: '壬', yuQi: '戊' },
  '酉': { bengQi: '辛' },
  '戌': { bengQi: '戊', zhongQi: '辛', yuQi: '丁' },
  '亥': { bengQi: '壬', zhongQi: '甲' },
};

// 天干五合
export const TIANGAN_WUHE: Record<string, { he: string; huaWuxing: string; nature: string }> = {
  '甲己': { he: '合', huaWuxing: '土', nature: '中正之合，宽大厚道，仁信兼备' },
  '乙庚': { he: '合', huaWuxing: '金', nature: '仁义之合，刚柔并济，进取乐观' },
  '丙辛': { he: '合', huaWuxing: '水', nature: '威制之合，威严果断，有领导力' },
  '丁壬': { he: '合', huaWuxing: '木', nature: '仁寿之合，仁慈长寿，温和善良' },
  '戊癸': { he: '合', huaWuxing: '火', nature: '无情之合，理智冷静，重利轻情' },
};

// 地支六合
export const DIZHI_LIUHE: Record<string, { huaWuxing: string; meaning: string }> = {
  '子丑': { huaWuxing: '土', meaning: '鼠牛相合，稳重踏实' },
  '寅亥': { huaWuxing: '木', meaning: '虎猪相合，仁慈正直' },
  '卯戌': { huaWuxing: '火', meaning: '兔狗相合，忠诚热情' },
  '辰酉': { huaWuxing: '金', meaning: '龙鸡相合，刚毅果断' },
  '巳申': { huaWuxing: '水', meaning: '蛇猴相合，聪明灵活' },
  '午未': { huaWuxing: '火', meaning: '马羊相合，热情温和' },
};

// 地支六冲
export const DIZHI_LIUCHONG: Record<string, { meaning: string }> = {
  '子午': { meaning: '一生不安，情绪波动大' },
  '丑未': { meaning: '事多阻逆，劳碌奔波' },
  '寅申': { meaning: '多情好管闲事，驿马逢冲' },
  '卯酉': { meaning: '背约失信，忧愁多劳' },
  '辰戌': { meaning: '克亲伤子，事业变动' },
  '巳亥': { meaning: '多事好斗，喜助人好管闲事' },
};

// 地支三合局
export const DIZHI_SANHE: Record<string, { huaWuxing: string; meaning: string }> = {
  '申子辰': { huaWuxing: '水', meaning: '三合水局，智慧灵活，善于变通' },
  '亥卯未': { huaWuxing: '木', meaning: '三合木局，仁慈正直，生机勃勃' },
  '寅午戌': { huaWuxing: '火', meaning: '三合火局，热情开朗，充满活力' },
  '巳酉丑': { huaWuxing: '金', meaning: '三合金局，刚毅果断，重义气' },
};

// 地支三刑
export const DIZHI_SANXING: Record<string, { type: string; meaning: string }> = {
  '寅巳申': { type: '无恩之刑', meaning: '恃才傲物，忘恩负义，易遭挫折' },
  '丑戌未': { type: '恃势之刑', meaning: '仗势欺人，过于猛进，易受打击' },
  '子卯': { type: '无礼之刑', meaning: '缺乏礼教，行事无章，夫妻有疾' },
  '辰午酉亥': { type: '自刑', meaning: '自我刑克，为利益犯法，自寻烦恼' },
};

// 地支六害
export const DIZHI_LIUHAI: Record<string, { meaning: string }> = {
  '子未': { meaning: '相害，老年残疾之虞' },
  '丑午': { meaning: '相害，逆来顺受之苦' },
  '寅巳': { meaning: '相害，害中带刑' },
  '卯辰': { meaning: '相害，争竞不休' },
  '申亥': { meaning: '相害，嫉妒之争' },
  '酉戌': { meaning: '相害，谗言戕害' },
};

// 干支对应身体部位
export const GANZHI_BODY: Record<string, string> = {
  '甲': '胆', '乙': '肝', '丙': '小肠', '丁': '心', '戊': '胃',
  '己': '脾', '庚': '大肠', '辛': '肺', '壬': '膀胱', '癸': '肾',
  '子': '膀胱/耳', '丑': '胞肚/脾', '寅': '胆/发脉/手', '卯': '十指/肝',
  '辰': '皮/肩胸', '巳': '面/咽齿/下尻', '午': '精神/眼目', '未': '胃脘/隔脊梁',
  '申': '大肠/经络/肺', '酉': '精血/小肠', '戌': '命门/腿踝足', '亥': '头/肾囊',
};

// 十神含义解析
export const SHISHEN_INTERPRETATION: Record<string, { meaning: string; description: string }> = {
  '比肩': { meaning: '同类相助', description: '代表朋友、同事、同辈。比肩多说明人缘好，有贵人相助，但也容易有竞争。' },
  '劫财': { meaning: '争夺之象', description: '代表竞争和挑战。劫财多说明需要与人争夺资源，需注意理财和人际关系。' },
  '食神': { meaning: '福气之星', description: '代表才华、口福、享受。食神旺说明有口福，有艺术天赋，生活惬意。' },
  '伤官': { meaning: '才华横溢', description: '代表聪明才智和创造力。伤官旺说明才华出众，但也容易恃才傲物，需注意言行。' },
  '偏财': { meaning: '意外之财', description: '代表偏财运、父亲、情人。偏财旺说明有意外财运，人缘好，异性缘佳。' },
  '正财': { meaning: '正当收入', description: '代表固定收入、妻子。正财旺说明有稳定收入，理财能力强，婚姻美满。' },
  '七杀': { meaning: '权威之星', description: '代表权力、压力、挑战。七杀旺说明有领导才能，但也面临较大压力。' },
  '正官': { meaning: '正直之星', description: '代表官运、名誉、丈夫。正官旺说明有官运，为人正直，女命婚姻美满。' },
  '偏印': { meaning: '偏门学识', description: '代表偏门学问、技术、养母。偏印旺说明有特殊才能，适合做研究和技术工作。' },
  '正印': { meaning: '庇护之星', description: '代表学业、母亲、贵人。正印旺说明学业有成，有贵人相助，受长辈疼爱。' },
};

/**
 * 生成八字综合解读
 */
export function generateBaziInterpretation(
  dayGan: string,
  wuxing: Record<string, number>,
  xiYongShen: { xi: string; yong: string; ji: string },
  nayin: Record<string, string>
) {
  const dayMaster = DAY_GAN_PERSONALITY[dayGan];
  if (!dayMaster) return null;

  // 找出最旺和最弱的五行
  const sorted = Object.entries(wuxing).sort((a, b) => b[1] - a[1]);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];
  const missing = sorted.filter(([_, count]) => count === 0);

  const wuxingKey = `${strongest[0]}旺`;
  const wuxingAnalysis = WUXING_ANALYSIS[wuxingKey] || null;

  // 年柱纳音解读
  const yearNayin = nayin['年柱'] || '';
  const nayinInterpretation = NAYIN_INTERPRETATION[yearNayin] || '';

  return {
    dayMaster,
    wuxingAnalysis,
    missing,
    nayinInterpretation,
    yearNayin,
    overallSummary: generateOverallSummary(dayMaster, wuxing, xiYongShen, missing),
  };
}

function generateOverallSummary(
  dayMaster: typeof DAY_GAN_PERSONALITY[string],
  wuxing: Record<string, number>,
  xiYongShen: { xi: string; yong: string; ji: string },
  missing: [string, number][]
) {
  let summary = `【${dayMaster.title}】${dayMaster.nature}。\n\n`;
  summary += `性格特点：${dayMaster.personality}\n\n`;
  summary += `核心优势：${dayMaster.strength}\n\n`;
  summary += `需要注意：${dayMaster.weakness}\n\n`;
  
  if (missing.length > 0) {
    summary += `五行缺${missing.map(([wx]) => wx).join('、')}，建议在日常生活中多接触${missing.map(([wx]) => {
      const colorMap: Record<string, string> = { '金': '白色', '木': '绿色', '水': '黑色', '火': '红色', '土': '黄色' };
      return colorMap[wx] || '';
    }).join('、')}等元素来补足。\n\n`;
  }

  summary += `喜用神为${xiYongShen.yong}，${xiYongShen.xi}为喜神。在日常生活中多亲近喜用神对应的五行，有助于提升运势。\n\n`;
  summary += `开运建议：幸运颜色${dayMaster.lucky.color}，幸运数字${dayMaster.lucky.number}，有利方位${dayMaster.lucky.direction}。`;

  return summary;
}
