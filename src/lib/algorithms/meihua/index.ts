/**
 * 梅花易数核心算法
 * 支持数字起卦、时间起卦、文字起卦、报数起卦、方位起卦、颜色起卦、声音起卦等
 */

// 八卦数据 - 先天八卦
export const BAGUA = [
  { name: '乾', symbol: '☰', element: '金', nature: '天', lines: [1, 1, 1], num: 1 },
  { name: '兑', symbol: '☱', element: '金', nature: '泽', lines: [1, 1, 0], num: 2 },
  { name: '离', symbol: '☲', element: '火', nature: '火', lines: [1, 0, 1], num: 3 },
  { name: '震', symbol: '☳', element: '木', nature: '雷', lines: [1, 0, 0], num: 4 },
  { name: '巽', symbol: '☴', element: '木', nature: '风', lines: [0, 1, 1], num: 5 },
  { name: '坎', symbol: '☵', element: '水', nature: '水', lines: [0, 1, 0], num: 6 },
  { name: '艮', symbol: '☶', element: '土', nature: '山', lines: [0, 0, 1], num: 7 },
  { name: '坤', symbol: '☷', element: '土', nature: '地', lines: [0, 0, 0], num: 8 },
];

// 后天八卦方位对应
export const BAGUA_DIRECTION: Record<string, { name: string; index: number }> = {
  '乾': { name: '西北', index: 0 },
  '兑': { name: '西', index: 1 },
  '离': { name: '南', index: 2 },
  '震': { name: '东', index: 3 },
  '巽': { name: '东南', index: 4 },
  '坎': { name: '北', index: 5 },
  '艮': { name: '东北', index: 6 },
  '坤': { name: '西南', index: 7 },
};

// 颜色对应五行和八卦
export const COLOR_TO_BAGUA: Record<string, { element: string; baguaIndex: number }> = {
  '白色': { element: '金', baguaIndex: 0 },  // 乾
  '金色': { element: '金', baguaIndex: 0 },  // 乾
  '银色': { element: '金', baguaIndex: 0 },  // 乾
  '黑色': { element: '水', baguaIndex: 5 },  // 坎
  '蓝色': { element: '水', baguaIndex: 5 },  // 坎
  '红色': { element: '火', baguaIndex: 2 },  // 离
  '紫色': { element: '火', baguaIndex: 2 },  // 离
  '绿色': { element: '木', baguaIndex: 3 },  // 震
  '青色': { element: '木', baguaIndex: 3 },  // 震
  '黄色': { element: '土', baguaIndex: 7 },  // 坤
  '棕色': { element: '土', baguaIndex: 7 },  // 坤
  '褐色': { element: '土', baguaIndex: 7 },  // 坤
};

// 六十四卦数据 [上卦索引, 下卦索引]
export const HEXAGRAMS: Record<string, { name: string; meaning: string }> = {
  '11': { name: '乾为天', meaning: '刚健中正，自强不息' },
  '12': { name: '天泽履', meaning: '履虎尾，不咥人，亨' },
  '13': { name: '天火同人', meaning: '同人于野，亨，利涉大川' },
  '14': { name: '天雷无妄', meaning: '元亨利贞，其匪正有眚' },
  '15': { name: '天风姤', meaning: '女壮，勿用取女' },
  '16': { name: '天水讼', meaning: '有孚，窒惕，中吉' },
  '17': { name: '天山遁', meaning: '亨，小利贞' },
  '18': { name: '天地否', meaning: '否之匪人，不利君子贞' },
  '21': { name: '泽天夬', meaning: '扬于王庭，孚号有厉' },
  '22': { name: '兑为泽', meaning: '亨，利贞' },
  '23': { name: '泽火革', meaning: '巳日乃孚，元亨利贞' },
  '24': { name: '泽雷随', meaning: '元亨利贞，无咎' },
  '25': { name: '泽风大过', meaning: '栋桡，利有攸往' },
  '26': { name: '泽水困', meaning: '亨，贞大人吉，无咎' },
  '27': { name: '泽山咸', meaning: '亨，利贞，取女吉' },
  '28': { name: '泽地萃', meaning: '亨，王假有庙，利见大人' },
  '31': { name: '火天大有', meaning: '元亨' },
  '32': { name: '火泽睽', meaning: '小事吉' },
  '33': { name: '离为火', meaning: '利贞，亨，畜牝牛吉' },
  '34': { name: '火雷噬嗑', meaning: '亨，利用狱' },
  '35': { name: '火风鼎', meaning: '元吉，亨' },
  '36': { name: '火水未济', meaning: '亨，小狐汔济，濡其尾' },
  '37': { name: '火山旅', meaning: '小亨，旅贞吉' },
  '38': { name: '火地晋', meaning: '康侯用锡马蕃庶，昼日三接' },
  '41': { name: '雷天大壮', meaning: '利贞' },
  '42': { name: '雷泽归妹', meaning: '征凶，无攸利' },
  '43': { name: '雷火丰', meaning: '亨，王假之，勿忧，宜日中' },
  '44': { name: '震为雷', meaning: '亨，震来虩虩，笑言哑哑' },
  '45': { name: '雷风恒', meaning: '亨，无咎，利贞' },
  '46': { name: '雷水解', meaning: '利西南，无所往' },
  '47': { name: '雷山小过', meaning: '亨，利贞，可小事，不可大事' },
  '48': { name: '雷地豫', meaning: '利建侯行师' },
  '51': { name: '风天小畜', meaning: '亨，密云不雨，自我西郊' },
  '52': { name: '风泽中孚', meaning: '豚鱼吉，利涉大川' },
  '53': { name: '风火家人', meaning: '利女贞' },
  '54': { name: '风雷益', meaning: '利有攸往，利涉大川' },
  '55': { name: '巽为风', meaning: '小亨，利有攸往' },
  '56': { name: '风水涣', meaning: '亨，王假有庙，利涉大川' },
  '57': { name: '风山渐', meaning: '女归吉，利贞' },
  '58': { name: '风地观', meaning: '盥而不荐，有孚颙若' },
  '61': { name: '水天需', meaning: '有孚，光亨贞吉，利涉大川' },
  '62': { name: '水泽节', meaning: '亨，苦节不可贞' },
  '63': { name: '水火既济', meaning: '亨小，利贞，初吉终乱' },
  '64': { name: '水雷屯', meaning: '元亨利贞，勿用有攸往' },
  '65': { name: '水风井', meaning: '改邑不改井，无丧无得' },
  '66': { name: '坎为水', meaning: '有孚维心，亨，行有尚' },
  '67': { name: '水山蹇', meaning: '利西南，不利东北' },
  '68': { name: '水地比', meaning: '吉，原筮元永贞，无咎' },
  '71': { name: '山天大畜', meaning: '利贞，不家食吉' },
  '72': { name: '山泽损', meaning: '有孚，元吉，无咎' },
  '73': { name: '山火贲', meaning: '亨，小利有攸往' },
  '74': { name: '山雷颐', meaning: '贞吉，观颐，自求口实' },
  '75': { name: '山风蛊', meaning: '元亨，利涉大川' },
  '76': { name: '山水蒙', meaning: '亨，匪我求童蒙，童蒙求我' },
  '77': { name: '艮为山', meaning: '艮其背，不获其身' },
  '78': { name: '山地剥', meaning: '不利有攸往' },
  '81': { name: '地天泰', meaning: '小往大来，吉亨' },
  '82': { name: '地泽临', meaning: '元亨利贞，至于八月有凶' },
  '83': { name: '地火明夷', meaning: '利艰贞' },
  '84': { name: '地雷复', meaning: '亨，出入无疾，朋来无咎' },
  '85': { name: '地风升', meaning: '元亨，用见大人，勿恤' },
  '86': { name: '地水师', meaning: '贞，丈人吉，无咎' },
  '87': { name: '地山谦', meaning: '亨，君子有终' },
  '88': { name: '坤为地', meaning: '元亨，利牝马之贞' },
};

export interface MeihuaResult {
  method: string;
  upperGua: { name: string; symbol: string; element: string; nature: string };
  lowerGua: { name: string; symbol: string; element: string; nature: string };
  dongYao: number;
  benGua: { name: string; meaning: string; lines: number[] };
  huGua: { name: string; meaning: string; lines: number[] };
  bianGua: { name: string; meaning: string; lines: number[] };
  tiYong: { ti: string; yong: string; relation: string };
}

/**
 * 数字起卦
 * @param num1 第一个数字（上卦）
 * @param num2 第二个数字（下卦）
 * @param num3 第三个数字（动爻）
 */
export function calculateByNumbers(num1: number, num2: number, num3: number): MeihuaResult {
  const upperIdx = (num1 - 1) % 8;
  const lowerIdx = (num2 - 1) % 8;
  const dongYao = num3 % 6 || 6;

  return buildResult('number', upperIdx, lowerIdx, dongYao);
}

/**
 * 时间起卦
 * @param year 年
 * @param month 月
 * @param day 日
 * @param hour 时
 */
export function calculateByTime(year: number, month: number, day: number, hour: number): MeihuaResult {
  // 年数取地支序数：子1丑2寅3卯4辰5巳6午7未8申9酉10戌11亥12
  const dizhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const yearNum = year % 12;
  const yearZhiIdx = yearNum >= 4 ? (yearNum - 4) % 12 : (yearNum + 8) % 12;
  const yearBranch = dizhi[yearZhiIdx];
  const yearNum2 = dizhi.indexOf(yearBranch) + 1;

  const upperNum = (yearNum2 + month + day) % 8 || 8;
  const lowerNum = (yearNum2 + month + day + hour) % 8 || 8;
  const dongYaoNum = (yearNum2 + month + day + hour) % 6 || 6;

  const upperIdx = upperNum - 1;
  const lowerIdx = lowerNum - 1;
  const dongYao = dongYaoNum;

  return buildResult('time', upperIdx, lowerIdx, dongYao);
}

/**
 * 文字起卦
 * @param text 输入文字
 */
export function calculateByText(text: string): MeihuaResult {
  const chars = text.replace(/\s/g, '');
  const len = chars.length;

  if (len < 2) {
    throw new Error('请输入至少两个汉字');
  }

  // 前半部分为上卦，后半部分为下卦
  const half = Math.floor(len / 2);
  const firstHalf = chars.substring(0, half);
  const secondHalf = chars.substring(half);

  // 计算笔画数（简化：用字符编码值之和）
  const sum1 = getStrokeCount(firstHalf);
  const sum2 = getStrokeCount(secondHalf);

  const upperIdx = (sum1 - 1) % 8;
  const lowerIdx = (sum2 - 1) % 8;
  const dongYao = (sum1 + sum2) % 6 || 6;

  return buildResult('text', upperIdx, lowerIdx, dongYao);
}

/**
 * 计算文字笔画数
 * 使用简化的笔画对照表，未收录的字符用Unicode码位取模
 */
const STROKE_MAP: Record<string, number> = {
  '一':1,'二':2,'三':3,'四':5,'五':4,'六':4,'七':2,'八':2,'九':2,'十':2,
  '大':3,'小':3,'天':4,'地':6,'人':2,'上':3,'下':3,'中':4,'心':4,'日':4,
  '月':4,'水':4,'火':4,'木':4,'金':8,'土':3,'山':3,'石':5,'田':5,'龙':5,
  '风':4,'云':4,'雷':13,'电':5,'春':9,'夏':10,'秋':9,'冬':5,'年':6,'岁':6,
  '甲':5,'乙':1,'丙':5,'丁':2,'戊':5,'己':3,'庚':8,'辛':7,'壬':4,'癸':9,
  '子':3,'丑':4,'寅':11,'卯':5,'辰':7,'巳':3,'午':4,'未':5,'申':5,'酉':7,
  '戌':6,'亥':6,'乾':11,'坤':8,'震':15,'巽':12,'坎':7,'离':10,'艮':6,'兑':7,
  '生':5,'成':6,'吉':6,'凶':4,'福':13,'禄':12,'寿':7,'喜':12,'财':7,'运':7,
};
const STROKE_CACHE: Record<string, number> = {};

function getStrokeCount(text: string): number {
  let sum = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (STROKE_MAP[char]) {
      sum += STROKE_MAP[char];
    } else if (STROKE_CACHE[char]) {
      sum += STROKE_CACHE[char];
    } else {
      // 未收录字符：简化为按长度比例估算
      const code = text.charCodeAt(i);
      const estimated = Math.max(1, ((code % 50) + 5) % 30);
      STROKE_CACHE[char] = estimated;
      sum += estimated;
    }
  }
  return sum % 64 || 1;
}

/**
 * 构建完整结果
 */
function buildResult(method: string, upperIdx: number, lowerIdx: number, dongYao: number): MeihuaResult {
  const upperGua = BAGUA[upperIdx];
  const lowerGua = BAGUA[lowerIdx];

  // 本卦六爻（从下到上）
  const benLines = [...lowerGua.lines, ...upperGua.lines];

  // 本卦名称
  const benKey = `${upperIdx + 1}${lowerIdx + 1}`;
  const benGua = HEXAGRAMS[benKey] || { name: '未知卦', meaning: '' };

  // 动爻变化后的变卦
  const bianLines = [...benLines];
  bianLines[dongYao - 1] = bianLines[dongYao - 1] === 1 ? 0 : 1;

  // 变卦的上下卦
  const bianUpperLines = bianLines.slice(3);
  const bianLowerLines = bianLines.slice(0, 3);
  const bianUpperIdx = BAGUA.findIndex(g => g.lines.join('') === bianUpperLines.join(''));
  const bianLowerIdx = BAGUA.findIndex(g => g.lines.join('') === bianLowerLines.join(''));
  const bianKey = `${bianUpperIdx + 1}${bianLowerIdx + 1}`;
  const bianGua = HEXAGRAMS[bianKey] || { name: '未知卦', meaning: '' };

  // 互卦（2-4爻为下互，3-5爻为上互）
  const huLowerLines = [benLines[1], benLines[2], benLines[3]];
  const huUpperLines = [benLines[2], benLines[3], benLines[4]];
  const huUpperIdx = BAGUA.findIndex(g => g.lines.join('') === huUpperLines.join(''));
  const huLowerIdx = BAGUA.findIndex(g => g.lines.join('') === huLowerLines.join(''));
  const huKey = `${huUpperIdx + 1}${huLowerIdx + 1}`;
  const huGua = HEXAGRAMS[huKey] || { name: '未知卦', meaning: '' };

  // 体用分析
  // 动爻在上卦（4-6爻）：上卦为用，下卦为体
  // 动爻在下卦（1-3爻）：下卦为用，上卦为体
  const ti = dongYao <= 3 ? upperGua.name : lowerGua.name;
  const yong = dongYao <= 3 ? lowerGua.name : upperGua.name;
  const tiElement = dongYao <= 3 ? upperGua.element : lowerGua.element;
  const yongElement = dongYao <= 3 ? lowerGua.element : upperGua.element;

  // 体用五行关系
  const relation = getWuxingRelation(tiElement, yongElement);

  return {
    method,
    upperGua: { name: upperGua.name, symbol: upperGua.symbol, element: upperGua.element, nature: upperGua.nature },
    lowerGua: { name: lowerGua.name, symbol: lowerGua.symbol, element: lowerGua.element, nature: lowerGua.nature },
    dongYao,
    benGua: { ...benGua, lines: benLines },
    huGua: { ...huGua, lines: [...huLowerLines, ...huUpperLines] },
    bianGua: { ...bianGua, lines: bianLines },
    tiYong: { ti: `${ti}(${tiElement})`, yong: `${yong}(${yongElement})`, relation },
  };
}

/**
 * 硬币起卦
 * 模拟掷6次硬币，每次3枚
 * @param flips 6次投掷结果，每次为3枚硬币正面数(0-3)
 */
export function calculateByCoin(flips: number[]): MeihuaResult {
  if (flips.length !== 6) throw new Error('需要6次投掷结果');
  // 每次3枚硬币，正面(3)=阳，反面(0)=阴
  // 6次从下到上为6爻
  const lines: number[] = flips.map(f => f >= 2 ? 1 : 0);
  const lowerLines = lines.slice(0, 3);
  const upperLines = lines.slice(3, 6);
  const upperIdx = BAGUA.findIndex(g => g.lines.join('') === upperLines.join(''));
  const lowerIdx = BAGUA.findIndex(g => g.lines.join('') === lowerLines.join(''));
  // 动爻：第一个变化的爻（值恰好为2或3的，即老阳老阴）
  let dongYao = 1;
  for (let i = 0; i < 6; i++) {
    if (flips[i] === 0 || flips[i] === 3) { dongYao = i + 1; break; }
  }
  return buildResult('coin', upperIdx < 0 ? 0 : upperIdx, lowerIdx < 0 ? 0 : lowerIdx, dongYao);
}

/**
 * 随机起卦
 * 使用随机数生成上下卦和动爻
 */
export function calculateByRandom(): MeihuaResult {
  const upperIdx = Math.floor(Math.random() * 8);
  const lowerIdx = Math.floor(Math.random() * 8);
  const dongYao = Math.floor(Math.random() * 6) + 1;
  return buildResult('random', upperIdx, lowerIdx, dongYao);
}

/**
 * 日期起卦
 * @param dateStr 日期字符串 YYYY-MM-DD
 */
export function calculateByDate(dateStr: string): MeihuaResult {
  const parts = dateStr.split('-').map(Number);
  if (parts.length < 3) throw new Error('日期格式应为 YYYY-MM-DD');
  const [y, m, d] = parts;
  const upperNum = (y + m + d) % 8 || 8;
  const lowerNum = (y + m + d + d) % 8 || 8;
  const dongYaoNum = (y + m + d) % 6 || 6;
  return buildResult('date', upperNum - 1, lowerNum - 1, dongYaoNum);
}

/**
 * 五行生克关系
 */
function getWuxingRelation(tiElement: string, yongElement: string): string {
  const sheng: Record<string, string> = { '金': '水', '水': '木', '木': '火', '火': '土', '土': '金' };
  const ke: Record<string, string> = { '金': '木', '木': '土', '土': '水', '水': '火', '火': '金' };

  if (tiElement === yongElement) return '比和（平）';
  if (sheng[yongElement] === tiElement) return '用生体（吉）';
  if (sheng[tiElement] === yongElement) return '体生用（泄）';
  if (ke[yongElement] === tiElement) return '用克体（凶）';
  if (ke[tiElement] === yongElement) return '体克用（小吉）';
  return '比和（平）';
}

// ============================================================
// 扩展起卦方式
// ============================================================

/**
 * 报数起卦 - 1/2/3/4+数字
 * @param nums 报的数字数组
 */
export function calculateByReport(nums: number[]): MeihuaResult {
  const len = nums.length;
  
  if (len === 0) throw new Error('请至少报一个数字');
  
  if (len === 1) {
    // 1数成卦：上卦为该数%8，下卦为时辰数%8
    const now = new Date();
    const hour = now.getHours();
    const shichenIdx = Math.floor((hour + 1) / 2) % 12; // 时辰索引
    const upperIdx = (nums[0] - 1) % 8;
    const lowerIdx = shichenIdx % 8;
    const dongYao = (nums[0] + shichenIdx) % 6 || 6;
    return buildResult('report', upperIdx, lowerIdx, dongYao);
  } else if (len === 2) {
    // 2数成卦：第一个数为上卦，第二个数为下卦，两数和除以6为动爻
    const upperIdx = (nums[0] - 1) % 8;
    const lowerIdx = (nums[1] - 1) % 8;
    const dongYao = (nums[0] + nums[1]) % 6 || 6;
    return buildResult('report', upperIdx, lowerIdx, dongYao);
  } else if (len === 3) {
    // 3数成卦：第一个数为上卦，第二个数为下卦，第三个数为动爻
    const upperIdx = (nums[0] - 1) % 8;
    const lowerIdx = (nums[1] - 1) % 8;
    const dongYao = nums[2] % 6 || 6;
    return buildResult('report', upperIdx, lowerIdx, dongYao);
  } else {
    // 4数以上：分前后两部分
    const mid = Math.floor(len / 2);
    const upperSum = nums.slice(0, mid).reduce((a, b) => a + b, 0);
    const lowerSum = nums.slice(mid).reduce((a, b) => a + b, 0);
    const totalSum = nums.reduce((a, b) => a + b, 0);
    const upperIdx = (upperSum - 1) % 8;
    const lowerIdx = (lowerSum - 1) % 8;
    const dongYao = totalSum % 6 || 6;
    return buildResult('report', upperIdx, lowerIdx, dongYao);
  }
}

/**
 * 方位起卦
 * @param upperDir 上卦方位（乾/兑/离/震/巽/坎/艮/坤）
 * @param lowerDir 下卦方位
 * @param dongYao 动爻（可选，默认随机）
 */
export function calculateByDirection(upperDir: string, lowerDir: string, dongYao?: number): MeihuaResult {
  const upperIdx = BAGUA.findIndex(b => b.name === upperDir);
  const lowerIdx = BAGUA.findIndex(b => b.name === lowerDir);
  
  if (upperIdx < 0) throw new Error(`无效的上卦方位：${upperDir}`);
  if (lowerIdx < 0) throw new Error(`无效的下卦方位：${lowerDir}`);
  
  const yao = dongYao || (Math.floor(Math.random() * 6) + 1);
  return buildResult('direction', upperIdx, lowerIdx, yao);
}

/**
 * 颜色起卦
 * @param upperColor 上卦颜色
 * @param lowerColor 下卦颜色
 */
export function calculateByColor(upperColor: string, lowerColor: string): MeihuaResult {
  const upperInfo = COLOR_TO_BAGUA[upperColor];
  const lowerInfo = COLOR_TO_BAGUA[lowerColor];
  
  if (!upperInfo) throw new Error(`无效的上卦颜色：${upperColor}`);
  if (!lowerInfo) throw new Error(`无效的下卦颜色：${lowerColor}`);
  
  const dongYao = Math.floor(Math.random() * 6) + 1;
  return buildResult('color', upperInfo.baguaIndex, lowerInfo.baguaIndex, dongYao);
}

/**
 * 声音起卦
 * @param soundCount 声音次数（1-8）
 * @param duration 持续时间（秒）用于动爻
 */
export function calculateBySound(soundCount: number, duration: number): MeihuaResult {
  const upperIdx = (soundCount - 1) % 8;
  const lowerIdx = (soundCount + 3) % 8; // 下卦与上卦关联
  const dongYao = Math.min(Math.max(duration % 6, 1), 6);
  return buildResult('sound', upperIdx, lowerIdx, dongYao);
}

/**
 * 姓名起卦
 * @param surname 姓氏
 * @param givenName 名字
 */
export function calculateByName(surname: string, givenName: string): MeihuaResult {
  const surnameSum = getStrokeCount(surname);
  const givenNameSum = getStrokeCount(givenName);
  
  const upperIdx = (surnameSum - 1) % 8;
  const lowerIdx = (givenNameSum - 1) % 8;
  const dongYao = (surnameSum + givenNameSum) % 6 || 6;
  
  return buildResult('name', upperIdx, lowerIdx, dongYao);
}
