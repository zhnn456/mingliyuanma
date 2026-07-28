/**
 * 四柱八字专业分析引擎
 * 基于《渊海子平》《子平真诠》《穷通宝鉴》《三命通会》
 * 
 * 分析维度：
 * 1. 日主强弱（通根/透干/得令/得地/得势）
 * 2. 格局判定（19种正格+从化格）
 * 3. 气候调候（穷通宝鉴法）
 * 4. 长生十二宫
 * 5. 刑冲合害
 * 6. 神煞（完整版）
 * 7. 十神深入分析
 * 8. 空亡
 */

// ========== 基础数据 ==========

const TIAN_GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const DI_ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

const TIAN_GAN_WU_XING: Record<string, string> = {
  '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'
};

const DI_ZHI_WU_XING: Record<string, string> = {
  '子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水'
};

// 地支藏干
const DI_ZHI_CANG: Record<string, Array<{g:string;q:'本'|'中'|'余'}>> = {
  '子':[{g:'癸',q:'本'}],'丑':[{g:'己',q:'本'},{g:'癸',q:'中'},{g:'辛',q:'余'}],
  '寅':[{g:'甲',q:'本'},{g:'丙',q:'中'},{g:'戊',q:'余'}],'卯':[{g:'乙',q:'本'}],
  '辰':[{g:'戊',q:'本'},{g:'乙',q:'中'},{g:'癸',q:'余'}],'巳':[{g:'丙',q:'本'},{g:'庚',q:'中'},{g:'戊',q:'余'}],
  '午':[{g:'丁',q:'本'},{g:'己',q:'中'}],'未':[{g:'己',q:'本'},{g:'丁',q:'中'},{g:'乙',q:'余'}],
  '申':[{g:'庚',q:'本'},{g:'壬',q:'中'},{g:'戊',q:'余'}],'酉':[{g:'辛',q:'本'}],
  '戌':[{g:'戊',q:'本'},{g:'辛',q:'中'},{g:'丁',q:'余'}],'亥':[{g:'壬',q:'本'},{g:'甲',q:'中'}],
};

// 月令对应节气（正月寅-十二月丑）
const MONTH_JIEQI: Record<number, string> = {
  1:'立春',2:'惊蛰',3:'清明',4:'立夏',5:'芒种',6:'小暑',
  7:'立秋',8:'白露',9:'寒露',10:'立冬',11:'大雪',12:'小寒'
};

// ========== 长生十二宫 ==========
// 天干在十二地支的长生状态
const SHI_ER_GONG: Record<string, string[]> = {
  '甲':['亥','子','丑','寅','卯','辰','巳','午','未','申','酉','戌'],
  '丙':['寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'],
  '戊':['寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'],
  '庚':['巳','午','未','申','酉','戌','亥','子','丑','寅','卯','辰'],
  '壬':['申','酉','戌','亥','子','丑','寅','卯','辰','巳','午','未'],
  '乙':['午','未','申','酉','戌','亥','子','丑','寅','卯','辰','巳'],
  '丁':['酉','戌','亥','子','丑','寅','卯','辰','巳','午','未','申'],
  '己':['酉','戌','亥','子','丑','寅','卯','辰','巳','午','未','申'],
  '辛':['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'],
  '癸':['卯','辰','巳','午','未','申','酉','戌','亥','子','丑','寅'],
};
// 长生十二宫名称
const SHIER_MING: string[] = ['长生','沐浴','冠带','临官','帝旺','衰','病','死','墓','绝','胎','养'];

export function getShiErGong(gan: string, zhi: string): {index:number; name:string} {
  const gong = SHI_ER_GONG[gan];
  if (!gong) return {index:-1, name:''};
  const idx = gong.indexOf(zhi);
  return {index: idx, name: idx >=0 ? SHIER_MING[idx] : ''};
}

// ========== 格局判定 ==========
// 月支藏干透出情况判定格局
const GE_JU: Record<string, {name:string;desc:string}> = {
  '正官格': {name:'正官格',desc:'月令正官透于天干，或地支会合官局。为人正直，有管理才能，宜公职。'},
  '七杀格': {name:'七杀格',desc:'月令七杀透干，或杀旺得制。性格刚毅，有魄力，宜军警外科。'},
  '正印格': {name:'正印格',desc:'月令正印透干。心地善良，学业有成，得长辈庇护。'},
  '偏印格': {name:'偏印格',desc:'月令偏印透干。思维独特，有特殊才能，玄学天赋。'},
  '正财格': {name:'正财格',desc:'月令正财透干。财运稳定，勤劳致富，勤俭持家。'},
  '偏财格': {name:'偏财格',desc:'月令偏财透干。偏财运佳，慷慨大方，善交际。'},
  '食神格': {name:'食神格',desc:'月令食神透干。心宽体胖，有口福，才艺好。'},
  '伤官格': {name:'伤官格',desc:'月令伤官透干。聪明伶俐，才华横溢，但易恃才傲物。'},
  '比肩格': {name:'比肩格',desc:'月令比肩透干。个性强，独立自主，宜合伙事业。'},
  '劫财格': {name:'劫财格',desc:'月令劫财透干。好胜心强，有竞争精神，慎防破财。'},
  '从财格': {name:'从财格',desc:'日主弱极，满局财星。舍命从财，宜经商求财。'},
  '从官格': {name:'从官格',desc:'日主弱极，满局官杀。舍命从官，宜政界发展。'},
  '从儿格': {name:'从儿格',desc:'日主弱极，满局食伤。舍命从儿，宜艺术创作。'},
  '化木格': {name:'化木格',desc:'甲己合化木，格局纯粹者。仁寿之命。'},
  '化火格': {name:'化火格',desc:'戊癸合化火，格局纯粹者。热情光明。'},
  '化土格': {name:'化土格',desc:'甲己合化土，格局纯粹者。稳重诚信。'},
  '化金格': {name:'化金格',desc:'乙庚合化金，格局纯粹者。刚毅果断。'},
  '化水格': {name:'化水格',desc:'丙辛合化水，格局纯粹者。智慧灵活。'},
};

// 十神关系
export function getShiShen(dayGan: string, otherGan: string): string {
  const idx = TIAN_GAN.indexOf(dayGan);
  const oIdx = TIAN_GAN.indexOf(otherGan);
  if (idx === -1 || oIdx === -1) return '';
  const diff = (oIdx - idx + 10) % 10;
  const sameYinYang = (idx % 2) === (oIdx % 2);
  const wuxingDiff = Math.floor(diff / 2);
  const wuxingDay = Math.floor(idx / 2);
  const wuxingOther = Math.floor(oIdx / 2);
  
  // 生我者印枭
  if ((wuxingOther + 1) % 5 === wuxingDay) return sameYinYang ? '偏印' : '正印';
  // 我生者食伤
  if ((wuxingDay + 1) % 5 === wuxingOther) return sameYinYang ? '食神' : '伤官';
  // 克我者官杀
  if ((wuxingOther + 2) % 5 === wuxingDay || (wuxingOther + 3) % 5 === wuxingDay) {
    if ((wuxingOther + 2) % 5 === wuxingDay || (wuxingOther + 3) % 5 === wuxingDay) {
      // 需要更精确的阴阳判断
      return sameYinYang ? '七杀' : '正官';
    }
  }
  // 我克者财
  if ((wuxingDay + 2) % 5 === wuxingOther || (wuxingDay + 3) % 5 === wuxingOther) {
    return sameYinYang ? '偏财' : '正财';
  }
  // 同我者比劫
  return sameYinYang ? '比肩' : '劫财';
}

// ========== 日主强弱分析 ==========
export interface QiangRuoResult {
  level: '极强'|'偏强'|'中和'|'偏弱'|'极弱';
  score: number;
  details: string[];
  yongShen: string;
  jiShen: string;
}

export function analyzeQiangRuo(dayGan: string, monthZhi: string, ganZhiList: string[]): QiangRuoResult {
  const dayWx = TIAN_GAN_WU_XING[dayGan];
  let score = 0;
  const details: string[] = [];

  // 1. 得令（月令是否为日主五行旺相）
  const monthWx = DI_ZHI_WU_XING[monthZhi];
  // 四季旺相休囚死
  const seasonMap: Record<string, Record<string, number>> = {
    '木': {'寅':2,'卯':3,'辰':1,'巳':0,'午':0,'未':0.5,'申':-2,'酉':-2,'戌':0,'亥':2,'子':1,'丑':0.5},
    '火': {'寅':1,'卯':1,'辰':2,'巳':3,'午':3,'未':1,'申':0,'酉':-1,'戌':0.5,'亥':-2,'子':-2,'丑':0},
    '土': {'寅':0,'卯':-1,'辰':2,'巳':1,'午':2,'未':3,'申':0,'酉':0,'戌':2,'亥':-1,'子':-1,'丑':2},
    '金': {'寅':-2,'卯':-2,'辰':0,'巳':1,'午':-1,'未':0,'申':3,'酉':3,'戌':1,'亥':0,'子':0,'丑':0},
    '水': {'寅':0,'卯':0,'辰':0,'巳':-2,'午':-2,'未':-1,'申':1,'酉':0,'戌':-1,'亥':3,'子':3,'丑':1},
  };
  const seasonScore = seasonMap[dayWx]?.[monthZhi] || 0;
  if (seasonScore > 0) { score += seasonScore * 2; details.push(`得令：生于${monthZhi}月，${dayWx}得令，加${seasonScore*2}分`); }
  else if (seasonScore < 0) { score += seasonScore; details.push(`失令：生于${monthZhi}月，${dayWx}失令，减${Math.abs(seasonScore)}分`); }
  else { details.push('平令：月令与日主五行持平'); }

  // 2. 得地（地支是否有根气）
  let rootCount = 0;
  ganZhiList.forEach(gz => {
    const zhi = gz[1]; // 地支第二位
    const cang = DI_ZHI_CANG[zhi];
    if (cang) {
      const hasRoot = cang.some(c => TIAN_GAN_WU_XING[c.g] === dayWx);
      if (hasRoot) {
        rootCount++;
        // 本气加2分，中气加1分
        const mainRoot = cang.filter(c => TIAN_GAN_WU_XING[c.g] === dayWx);
        mainRoot.forEach(r => { score += r.q === '本' ? 2 : 1; });
        details.push(`得地：${zhi}中有${mainRoot.map(r=>r.g).join('、')}（${dayWx}根），加${mainRoot.reduce((s,r)=>s+(r.q==='本'?2:1),0)}分`);
      }
    }
  });
  if (rootCount === 0) details.push('无根：地支中无日主五行之根气');

  // 3. 得势（天干是否有比劫）
  let gangCount = 0;
  ganZhiList.forEach(gz => {
    const g = gz[0];
    if (TIAN_GAN_WU_XING[g] === dayWx) { gangCount++; score += 1; }
  });
  if (gangCount > 1) details.push(`得势：天干有${gangCount}个${dayWx}，加${gangCount-1}分`);
  else if (gangCount === 0) details.push('失势：天干无同类五行相助');

  // 4. 判断强弱
  let level: QiangRuoResult['level'] = '中和';
  if (score >= 6) level = '极强';
  else if (score >= 3) level = '偏强';
  else if (score <= -3) level = '极弱';
  else if (score <= -1) level = '偏弱';

  // 用神/忌神
  const ke: Record<string, string> = {'木':'土','土':'水','水':'火','火':'金','金':'木'};
  const sheng: Record<string, string> = {'木':'火','火':'土','土':'金','金':'水','水':'木'};
  const keWo: Record<string, string> = {'木':'金','火':'水','土':'木','金':'火','水':'土'};
  const shengWo: Record<string, string> = {'木':'水','火':'木','土':'火','金':'土','水':'金'};

  let yongShen = '', jiShen = '';
  if (level === '极强' || level === '偏强') {
    // 身强：用克泄耗
    yongShen = ke[dayWx]; // 克我（官杀）
    jiShen = shengWo[dayWx]; // 生我（印枭）
  } else if (level === '极弱' || level === '偏弱') {
    // 身弱：用生扶
    yongShen = shengWo[dayWx]; // 生我（印枭）
    jiShen = ke[dayWx]; // 克我（官杀）
  } else {
    yongShen = dayWx;
    jiShen = ke[dayWx];
  }

  return { level, score, details, yongShen, jiShen };
}

// ========== 调候分析（穷通宝鉴法） ==========
// 以日主+月令查询调候用神
const TIAO_HOU: Record<string, Record<number, {need:string;reason:string}>> = {
  '甲': {
    1: {need:'丙火、癸水',reason:'初春余寒，用丙暖局，癸水润木'},
    2: {need:'丙火、癸水',reason:'仲春木旺，丙癸并用，火温水润'},
    3: {need:'癸水、庚金',reason:'暮春木老，需癸水滋润，庚金修剪'},
    4: {need:'癸水、丁火',reason:'巳月火旺木泄，癸水为救，丁火助身'},
    5: {need:'癸水、庚金',reason:'午月火炎木枯，癸水急用，庚金生水'},
    6: {need:'癸水、庚金',reason:'未月土燥木枯，癸庚并用'},
    7: {need:'庚金、丁火',reason:'申月金旺木衰，庚金发用，丁火暖局'},
    8: {need:'庚金、丁火',reason:'酉月金锐木凋，庚丁并用'},
    9: {need:'庚金、丁火',reason:'戌月土燥，庚金为用，丁火为辅'},
    10:{need:'庚金、丙火',reason:'亥月水寒木漂，庚金为用，丙火暖局'},
    11:{need:'丙火、戊土',reason:'子月水冰木冻，丙火解冻，戊土培根'},
    12:{need:'丙火、丁火',reason:'丑月寒土冻木，丙丁齐用暖局'},
  },
  '乙': {
    1: {need:'丙火、癸水',reason:'初春尚寒，丙火暖局，癸水润根'},
    2: {need:'丙火、癸水',reason:'仲春乙木茂盛，丙癸并用'},
    3: {need:'癸水、丙火',reason:'暮春乙木，癸水为先，丙火为辅'},
    4: {need:'癸水',reason:'巳月火炎，癸水为救命之水'},
    5: {need:'癸水、丙火',reason:'午月火炎，癸水为主，丙火调节'},
    6: {need:'癸水、丙火',reason:'未月土燥，癸水润局，丙火助气'},
    7: {need:'丙火、癸水、庚金',reason:'申月金旺，丙火暖局，癸水润木，庚金修剪'},
    8: {need:'丙火、癸水',reason:'酉月金锐，丙火暖局，癸水润木'},
    9: {need:'癸水、庚金',reason:'戌月土燥，癸水为先，庚金为次'},
    10:{need:'丙火、戊土',reason:'亥月水寒，丙火为要，戊土制水'},
    11:{need:'丙火',reason:'子月寒水，丙火为唯一用神'},
    12:{need:'丙火',reason:'丑月寒土，丙火暖局解冻'},
  },
  '丙': {
    1: {need:'壬水、庚金',reason:'初春火尚未旺，壬水为用，庚金生水'},
    2: {need:'壬水、庚金',reason:'仲春火渐旺，壬庚齐用'},
    3: {need:'壬水',reason:'暮春火旺，壬水为尊'},
    4: {need:'壬水、庚金',reason:'巳月火炎，壬庚并用'},
    5: {need:'壬水、庚金',reason:'午月火极旺，壬庚为救'},
    6: {need:'壬水、庚金',reason:'未月火燥，壬庚并用'},
    7: {need:'壬水、戊土',reason:'申月金水进气，壬水为用'},
    8: {need:'壬水、甲木',reason:'酉月秋金，壬水为用，甲木生火'},
    9: {need:'甲木、壬水',reason:'戌月土燥，甲木生火，壬水润局'},
    10:{need:'甲木、戊土',reason:'亥月水旺，甲木为用，戊土制水'},
    11:{need:'甲木、戊土、庚金',reason:'子月水旺火弱，甲戊庚并用'},
    12:{need:'甲木、戊土',reason:'丑月寒土，甲木生火，戊土制水'},
  },
  '丁': {
    1: {need:'甲木、庚金',reason:'初春火弱，甲木为尊，庚金劈甲引丁'},
    2: {need:'甲木、庚金',reason:'仲春木旺，庚甲并用'},
    3: {need:'甲木、庚金',reason:'暮春木老，庚甲并用'},
    4: {need:'甲木、庚金、癸水',reason:'巳月丁火旺，甲庚为主，癸水调节'},
    5: {need:'壬水、庚金、癸水',reason:'午月丁炎，壬庚并用，癸水为辅'},
    6: {need:'甲木、庚金、癸水',reason:'未月土燥，甲庚癸并用'},
    7: {need:'甲木、庚金、戊土',reason:'申月金旺，甲木为要，庚戊为佐'},
    8: {need:'甲木、庚金、戊土',reason:'酉月金锐，甲庚并用，戊土生金'},
    9: {need:'甲木、庚金、戊土',reason:'戌月土燥，甲庚戊并用'},
    10:{need:'甲木、庚金、戊土',reason:'亥月水旺，甲木化水，庚金劈甲'},
    11:{need:'甲木、庚金、戊土',reason:'子月水寒，甲木为尊，庚戊为佐'},
    12:{need:'甲木、庚金',reason:'丑月寒土，甲庚并用'},
  },
  '戊': {
    1: {need:'丙火、癸水、甲木',reason:'初春寒土，丙火暖局，癸水润土，甲木疏土'},
    2: {need:'丙火、癸水、甲木',reason:'仲春木旺土虚，丙癸并用，甲木疏土'},
    3: {need:'丙火、癸水、甲木',reason:'暮春土厚，丙火为先，甲木疏土，癸水润泽'},
    4: {need:'癸水、丙火、甲木',reason:'巳月火炎土燥，癸水为救，丙火为辅，甲木疏土'},
    5: {need:'癸水、壬水、甲木',reason:'午月火炎土燥，壬癸水并用，甲木疏土'},
    6: {need:'癸水、丙火、甲木',reason:'未月土燥，癸水为先，丙火为辅，甲木疏土'},
    7: {need:'丙火、癸水',reason:'申月金旺土虚，丙火暖土，癸水润土'},
    8: {need:'丙火、癸水',reason:'酉月金旺泄土，丙火暖土生土，癸水润土'},
    9: {need:'甲木、癸水、丙火',reason:'戌月土厚，甲木疏土为先，癸水润泽，丙火为辅'},
    10:{need:'甲木、丙火、戊土',reason:'亥月水旺土寒，甲木化水，丙火暖局，戊土助身'},
    11:{need:'丙火、甲木、戊土',reason:'子月寒水，丙火解冻，甲木疏土，戊土助身'},
    12:{need:'丙火、甲木、戊土',reason:'丑月冻土，丙火暖局，甲木疏土，戊土助身'},
  },
  '己': {
    1: {need:'丙火、癸水、甲木',reason:'初春寒土，丙火暖局，癸水润土，甲木疏土'},
    2: {need:'丙火、癸水、甲木',reason:'仲春木旺土虚，丙癸并用，甲木疏土'},
    3: {need:'丙火、癸水、甲木',reason:'暮春己土，丙火为先，甲木疏土，癸水润泽'},
    4: {need:'癸水、丙火',reason:'巳月火炎土燥，癸水为救，丙火为辅'},
    5: {need:'癸水、丙火',reason:'午月火炎，癸水为主，丙火为辅'},
    6: {need:'癸水、丙火',reason:'未月土燥，癸水为先，丙火为辅'},
    7: {need:'丙火、癸水、甲木',reason:'申月金旺土虚，丙火暖土，癸水润土，甲木疏土'},
    8: {need:'丙火、甲木',reason:'酉月金旺泄土，丙火暖土生土，甲木疏土'},
    9: {need:'甲木、癸水、丙火',reason:'戌月土厚，甲木疏土为先，癸水润泽，丙火为辅'},
    10:{need:'丙火、甲木、戊土',reason:'亥月水旺土寒，丙火暖局，甲木化水，戊土助身'},
    11:{need:'丙火、甲木',reason:'子月寒水，丙火解冻，甲木疏土'},
    12:{need:'丙火、甲木',reason:'丑月冻土，丙火暖局，甲木疏土'},
  },
  '庚': {
    1: {need:'丙火、丁火、甲木',reason:'初春金寒，丙丁暖金，甲木生火炼金'},
    2: {need:'丁火、甲木',reason:'仲春木旺金弱，丁火炼金，甲木生火'},
    3: {need:'丁火、甲木、壬水',reason:'暮春土旺，丁火炼金，甲木疏土，壬水淘金'},
    4: {need:'壬水、戊土、丙火',reason:'巳月火旺金熔，壬水为救，戊土护金，丙火为辅'},
    5: {need:'壬水、戊土、丁火',reason:'午月火极旺，壬水为救，戊土护金，丁火炼金'},
    6: {need:'壬水、戊土、甲木',reason:'未月土厚金埋，壬水淘金，戊土生金，甲木疏土'},
    7: {need:'丁火、甲木、壬水',reason:'申月金旺，丁火炼金为用，甲木生火，壬水淘金'},
    8: {need:'丁火、甲木、壬水',reason:'酉月金锐，丁火炼金，甲木生火，壬水淘金'},
    9: {need:'壬水、甲木、丁火',reason:'戌月土厚，壬水淘金，甲木疏土，丁火炼金'},
    10:{need:'丁火、丙火、甲木',reason:'亥月水旺金寒，丁丙并用暖金，甲木生火'},
    11:{need:'丁火、丙火、甲木',reason:'子月水旺金寒，丁丙并用暖金，甲木生火'},
    12:{need:'丙火、丁火、甲木',reason:'丑月寒土金冻，丙丁并用暖金，甲木生火'},
  },
  '辛': {
    1: {need:'壬水、庚金、丙火',reason:'初春金弱，壬水洗金，庚金助身，丙火暖局'},
    2: {need:'壬水、庚金',reason:'仲春木旺金弱，壬水洗金，庚金助身'},
    3: {need:'壬水、庚金',reason:'暮春辛金，壬水洗金为先，庚金助身'},
    4: {need:'壬水、癸水、戊土',reason:'巳月火旺金弱，壬癸水并用，戊土护金'},
    5: {need:'壬水、癸水、己土',reason:'午月火极旺，壬癸水并用，己土护金'},
    6: {need:'壬水、癸水、庚金',reason:'未月土厚，壬癸水并用，庚金助身'},
    7: {need:'壬水、癸水',reason:'申月金旺，壬水洗金淘洗'},
    8: {need:'壬水、癸水',reason:'酉月金锐，壬水洗金淘洗'},
    9: {need:'壬水、癸水、丙火',reason:'戌月土厚，壬癸水并用，丙火为辅'},
    10:{need:'壬水、丙火、戊土',reason:'亥月水旺金寒，壬水洗金，丙火暖局，戊土生金'},
    11:{need:'壬水、丙火、戊土',reason:'子月水旺金寒，壬水洗金，丙火暖局，戊土生金'},
    12:{need:'壬水、丙火、戊土',reason:'丑月寒土金冻，壬水洗金，丙火暖局，戊土生金'},
  },
  '壬': {
    1: {need:'戊土、丙火、庚金',reason:'初春水弱，戊土制水，丙火暖局，庚金生水'},
    2: {need:'戊土、丙火、庚金',reason:'仲春木旺泄水，戊土制水，丙火暖局，庚金生水'},
    3: {need:'甲木、丙火、戊土',reason:'暮春土厚，甲木疏土，丙火暖局，戊土制水'},
    4: {need:'壬水、癸水、辛金',reason:'巳月火旺水弱，壬癸水并用，辛金生水'},
    5: {need:'壬水、癸水、辛金、庚金',reason:'午月火极旺，壬癸水并用，辛庚金生水'},
    6: {need:'壬水、癸水、辛金',reason:'未月土燥，壬癸水并用，辛金生水'},
    7: {need:'戊土、丙火、甲木',reason:'申月金旺水生，戊土制水，丙火暖局，甲木泄水'},
    8: {need:'甲木、戊土、丙火',reason:'酉月金旺水生，甲木泄水，戊土制水，丙火暖局'},
    9: {need:'甲木、丙火、戊土',reason:'戌月土厚，甲木泄水，丙火暖局，戊土制水'},
    10:{need:'戊土、丙火、甲木',reason:'亥月水旺，戊土制水为先，丙火暖局，甲木泄水'},
    11:{need:'戊土、丙火、甲木',reason:'子月水极旺，戊土制水为先，丙火暖局，甲木泄水'},
    12:{need:'戊土、丙火、甲木',reason:'丑月水旺，戊土制水，丙火暖局，甲木泄水'},
  },
  '癸': {
    1: {need:'辛金、丙火',reason:'初春水弱，辛金生水，丙火暖局'},
    2: {need:'辛金、丙火',reason:'仲春木旺泄水，辛金生水，丙火暖局'},
    3: {need:'辛金、丙火',reason:'暮春癸水，辛金生水，丙火暖局'},
    4: {need:'辛金、庚金、壬水',reason:'巳月火旺水弱，辛庚金并用生水，壬水助身'},
    5: {need:'辛金、庚金、壬水',reason:'午月火极旺，辛庚金并用生水，壬水助身'},
    6: {need:'辛金、庚金、壬水',reason:'未月土燥，辛庚金并用生水，壬水助身'},
    7: {need:'戊土、丙火',reason:'申月金旺水生，戊土制水，丙火暖局'},
    8: {need:'戊土、丙火、丁火',reason:'酉月金旺水生，戊土制水，丙丁火暖局'},
    9: {need:'辛金、丙火',reason:'戌月土厚，辛金生水，丙火暖局'},
    10:{need:'戊土、丙火、辛金',reason:'亥月水旺，戊土制水，丙火暖局，辛金生水'},
    11:{need:'戊土、丙火、辛金',reason:'子月水极旺，戊土制水，丙火暖局，辛金生水'},
    12:{need:'戊土、丙火、辛金',reason:'丑月水旺，戊土制水，丙火暖局，辛金生水'},
  },
};

export function getTiaoHou(dayGan: string, month: number): {need:string; reason:string} | null {
  return TIAO_HOU[dayGan]?.[month] || null;
}

// ========== 神煞完整版 ==========
export const ALL_SHEN_SHA: Record<string, (dg:string, yz:string, ygz:string, mz?:string) => string[]> = {
  '天乙贵人': (dg) => ({'甲':'丑未','乙':'子申','丙':'酉亥','丁':'酉亥','戊':'丑未','己':'子申','庚':'丑未','辛':'午寅','壬':'卯巳','癸':'卯巳'}[dg]?.split('').map(z=>z+'方')||[]),
  '太极贵人': (dg) => ({'甲':'子午','乙':'子午','丙':'卯酉','丁':'卯酉','戊':'辰戌丑未','己':'辰戌丑未','庚':'寅亥','辛':'寅亥','壬':'巳申','癸':'巳申'}[dg]?.split('').join('、')?[({'甲':'子午','乙':'子午','丙':'卯酉','丁':'卯酉','戊':'辰戌丑未','己':'辰戌丑未','庚':'寅亥','辛':'寅亥','壬':'巳申','癸':'巳申'}[dg]||'')]:[]),
  '天德贵人': (_,__,___,mz) => mz?{1:'丁',2:'坤',3:'壬',4:'辛',5:'乾',6:'甲',7:'癸',8:'艮',9:'丙',10:'乙',11:'巳',12:'庚'}[parseInt(mz)]?[({1:'丁',2:'坤',3:'壬',4:'辛',5:'乾',6:'甲',7:'癸',8:'艮',9:'丙',10:'乙',11:'巳',12:'庚'}[parseInt(mz)]||'')]:[]:[],
  '月德贵人': (_,__,___,mz) => mz?{1:'丙',2:'甲',3:'壬',4:'庚',5:'丙',6:'甲',7:'壬',8:'庚',9:'丙',10:'甲',11:'壬',12:'庚'}[parseInt(mz)]?[({1:'丙',2:'甲',3:'壬',4:'庚',5:'丙',6:'甲',7:'壬',8:'庚',9:'丙',10:'甲',11:'壬',12:'庚'}[parseInt(mz)]||'')]:[]:[],
  '文昌贵人': (dg) => ({'甲':'巳','乙':'午','丙':'申','丁':'酉','戊':'申','己':'酉','庚':'亥','辛':'子','壬':'寅','癸':'卯'}[dg]?[({'甲':'巳','乙':'午','丙':'申','丁':'酉','戊':'申','己':'酉','庚':'亥','辛':'子','壬':'寅','癸':'卯'}[dg]||'')]:[]),
  '福星贵人': (dg) => [{'甲':'寅','乙':'卯','丙':'子','丁':'丑','戊':'子','己':'丑','庚':'寅','辛':'卯','壬':'午','癸':'巳'}[dg]||''].filter(Boolean),
  '驿马': (_,yz) => ({'寅':'申','午':'申','戌':'申','亥':'巳','卯':'巳','未':'巳','申':'寅','子':'寅','辰':'寅','巳':'亥','酉':'亥','丑':'亥'}[yz]?[({'寅':'申','午':'申','戌':'申','亥':'巳','卯':'巳','未':'巳','申':'寅','子':'寅','辰':'寅','巳':'亥','酉':'亥','丑':'亥'}[yz]||'')]:[]),
  '华盖': (_,yz) => ({'寅':'戌','午':'戌','戌':'戌','亥':'丑','卯':'丑','未':'丑','申':'辰','子':'辰','辰':'辰','巳':'未','酉':'未','丑':'未'}[yz]?[({'寅':'戌','午':'戌','戌':'戌','亥':'丑','卯':'丑','未':'丑','申':'辰','子':'辰','辰':'辰','巳':'未','酉':'未','丑':'未'}[yz]||'')]:[]),
  '桃花': (_,yz) => ({'寅':'卯','午':'卯','戌':'卯','亥':'子','卯':'子','未':'子','申':'酉','子':'酉','辰':'酉','巳':'午','酉':'午','丑':'午'}[yz]?[({'寅':'卯','午':'卯','戌':'卯','亥':'子','卯':'子','未':'子','申':'酉','子':'酉','辰':'酉','巳':'午','酉':'午','丑':'午'}[yz]||'')]:[]),
  '将星': (_,yz) => ({'寅':'子','午':'子','戌':'子','亥':'卯','卯':'卯','未':'卯','申':'午','子':'午','辰':'午','巳':'酉','酉':'酉','丑':'酉'}[yz]?[({'寅':'子','午':'子','戌':'子','亥':'卯','卯':'卯','未':'卯','申':'午','子':'午','辰':'午','巳':'酉','酉':'酉','丑':'酉'}[yz]||'')]:[]),
  '金舆': (dg) => ({'甲':'辰','乙':'巳','丙':'未','丁':'申','戊':'未','己':'申','庚':'戌','辛':'亥','壬':'丑','癸':'寅'}[dg]?[({'甲':'辰','乙':'巳','丙':'未','丁':'申','戊':'未','己':'申','庚':'戌','辛':'亥','壬':'丑','癸':'寅'}[dg]||'')]:[]),
  '劫煞': (_,yz) => ({'寅':'巳','午':'巳','戌':'巳','亥':'申','卯':'申','未':'申','申':'亥','子':'亥','辰':'亥','巳':'寅','酉':'寅','丑':'寅'}[yz]?[({'寅':'巳','午':'巳','戌':'巳','亥':'申','卯':'申','未':'申','申':'亥','子':'亥','辰':'亥','巳':'寅','酉':'寅','丑':'寅'}[yz]||'')]:[]),
  '灾煞': (_,yz) => ({'寅':'午','午':'午','戌':'午','亥':'酉','卯':'酉','未':'酉','申':'子','子':'子','辰':'子','巳':'卯','酉':'卯','丑':'卯'}[yz]?[({'寅':'午','午':'午','戌':'午','亥':'酉','卯':'酉','未':'酉','申':'子','子':'子','辰':'子','巳':'卯','酉':'卯','丑':'卯'}[yz]||'')]:[]),
  '孤辰': (_,yz) => ({'寅':'巳','午':'巳','戌':'巳','亥':'寅','卯':'寅','未':'寅','申':'亥','子':'亥','辰':'亥','巳':'申','酉':'申','丑':'申'}[yz]?[({'寅':'巳','午':'巳','戌':'巳','亥':'寅','卯':'寅','未':'寅','申':'亥','子':'亥','辰':'亥','巳':'申','酉':'申','丑':'申'}[yz]||'')]:[]),
  '寡宿': (_,yz) => ({'寅':'丑','午':'丑','戌':'丑','亥':'戌','卯':'戌','未':'戌','申':'未','子':'未','辰':'未','巳':'辰','酉':'辰','丑':'辰'}[yz]?[({'寅':'丑','午':'丑','戌':'丑','亥':'戌','卯':'戌','未':'戌','申':'未','子':'未','辰':'未','巳':'辰','酉':'辰','丑':'辰'}[yz]||'')]:[]),
  '亡神': (_,yz) => ({'寅':'巳','午':'巳','戌':'巳','亥':'申','卯':'申','未':'申','申':'亥','子':'亥','辰':'亥','巳':'寅','酉':'寅','丑':'寅'}[yz]?[({'寅':'巳','午':'巳','戌':'巳','亥':'申','卯':'申','未':'申','申':'亥','子':'亥','辰':'亥','巳':'寅','酉':'寅','丑':'寅'}[yz]||'')]:[]),
  '羊刃': (dg) => ({'甲':'卯','丙':'午','戊':'午','庚':'酉','壬':'子'}[dg]?[({'甲':'卯','丙':'午','戊':'午','庚':'酉','壬':'子'}[dg]||'')]:[]),
  '红鸾': (_,yz) => ({'寅':'卯','卯':'寅','辰':'丑','巳':'子','午':'亥','未':'戌','申':'酉','酉':'申','戌':'未','亥':'午','子':'巳','丑':'辰'}[yz]?[({'寅':'卯','卯':'寅','辰':'丑','巳':'子','午':'亥','未':'戌','申':'酉','酉':'申','戌':'未','亥':'午','子':'巳','丑':'辰'}[yz]||'')]:[]),
  '天喜': (_,yz) => ({'寅':'戌','卯':'亥','辰':'子','巳':'丑','午':'寅','未':'卯','申':'辰','酉':'巳','戌':'午','亥':'未','子':'申','丑':'酉'}[yz]?[({'寅':'戌','卯':'亥','辰':'子','巳':'丑','午':'寅','未':'卯','申':'辰','酉':'巳','戌':'午','亥':'未','子':'申','丑':'酉'}[yz]||'')]:[]),
  '魁罡': (_,__,ygz) => ['庚辰','庚戌','壬辰','壬戌'].includes(ygz)?['魁罡照命']:[],
  '日德': (_,__,ygz) => ['庚辰','丙戌','戊寅','甲寅'].includes(ygz)?['日德入命']:[],
};

// ========== 刑冲合害分析 ==========
export interface GanZhiRelation {
  type: string;
  description: string;
  items: string[];
}

export function analyzeRelations(gans: string[], zhis: string[]): GanZhiRelation[] {
  const result: GanZhiRelation[] = [];
  const sortedZhis = [...zhis].sort();
  
  // ===== 天干关系 =====
  
  // 1. 天干五合
  const wuhe: Record<string, string> = {'甲己':'化土','乙庚':'化金','丙辛':'化水','丁壬':'化木','戊癸':'化火'};
  const heItems: string[] = [];
  for (let i = 0; i < gans.length; i++) {
    for (let j = i+1; j < gans.length; j++) {
      const key = gans[i]+gans[j], rev = gans[j]+gans[i];
      if (wuhe[key]) heItems.push(`${gans[i]}${gans[j]}五合${wuhe[key]}`);
      else if (wuhe[rev]) heItems.push(`${gans[j]}${gans[i]}五合${wuhe[rev]}`);
    }
  }
  if (heItems.length > 0) result.push({type:'天干五合', description:'两干相合，化出之五行改变原性', items: heItems});

  // 2. 天干四冲（甲庚冲、乙辛冲、丙壬冲、丁癸冲）
  const tianChong: Record<string, string> = {'甲庚':'金木冲','乙辛':'金木冲','丙壬':'水火冲','丁癸':'水火冲'};
  const tcItems: string[] = [];
  for (let i = 0; i < gans.length; i++) {
    for (let j = i+1; j < gans.length; j++) {
      const key = gans[i]+gans[j], rev = gans[j]+gans[i];
      if (tianChong[key]) tcItems.push(`${gans[i]}${gans[j]}相冲（${tianChong[key]}）`);
      else if (tianChong[rev]) tcItems.push(`${gans[j]}${gans[i]}相冲（${tianChong[rev]}）`);
    }
  }
  if (tcItems.length > 0) result.push({type:'天干相冲', description:'天干相冲主对立冲突，多应于外', items: tcItems});

  // 3. 天干相克（五行的直接克）
  const GAN_WX: Record<string,string> = {'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'};
  const KE: Record<string,string> = {'木':'土','土':'水','水':'火','火':'金','金':'木'};
  const tkItems: string[] = [];
  for (let i = 0; i < gans.length; i++) {
    for (let j = 0; j < gans.length; j++) {
      if (i === j) continue;
      const wxI = GAN_WX[gans[i]], wxJ = GAN_WX[gans[j]];
      if (KE[wxI] === wxJ) tkItems.push(`${gans[i]}${gans[j]}相克（${wxI}克${wxJ}）`);
    }
  }
  if (tkItems.length > 0) result.push({type:'天干相克', description:'相克为五行直接压制', items: Array.from(new Set(tkItems))});

  // ===== 地支关系 =====

  // 4. 地支六合
  const liuhe: Record<string, string> = {'子丑':'合土','寅亥':'合木','卯戌':'合火','辰酉':'合金','巳申':'合水','午未':'合火'};
  const lhItems: string[] = [];
  for (let i = 0; i < zhis.length; i++) {
    for (let j = i+1; j < zhis.length; j++) {
      const key = zhis[i]+zhis[j], rev = zhis[j]+zhis[i];
      if (liuhe[key]) lhItems.push(`${zhis[i]}${zhis[j]}六合${liuhe[key]}`);
      else if (liuhe[rev]) lhItems.push(`${zhis[j]}${zhis[i]}六合${liuhe[rev]}`);
    }
  }
  if (lhItems.length > 0) result.push({type:'地支六合', description:'合化成功则变化为其他五行，增强力量', items: lhItems});

  // 5. 地支三合
  const sanhe: Record<string, string> = {'申子辰':'水局','亥卯未':'木局','寅午戌':'火局','巳酉丑':'金局'};
  Object.entries(sanhe).forEach(([k,v]) => {
    if (k.split('').every(p => sortedZhis.includes(p))) {
      result.push({type:'地支三合', description:`${k}三合化为${v}，力量强大，格局之象`, items:[`${k}三合${v}`]});
    }
  });

  // 6. 地支三会
  const sanhui: Record<string, string> = {'寅卯辰':'东方木','巳午未':'南方火','申酉戌':'西方金','亥子丑':'北方水'};
  Object.entries(sanhui).forEach(([k,v]) => {
    if (k.split('').every(p => sortedZhis.includes(p))) {
      result.push({type:'地支三会', description:`${k}三会${v}方，气势专一，力量比三合更强`, items:[`${k}三会${v}方`]});
    }
  });

  // 7. 地支暗合
  const anhe: Record<string, string> = {'寅丑':'暗合','卯申':'暗合','午亥':'暗合'};
  const ahItems: string[] = [];
  for (let i = 0; i < zhis.length; i++) {
    for (let j = i+1; j < zhis.length; j++) {
      const key = zhis[i]+zhis[j], rev = zhis[j]+zhis[i];
      if (anhe[key] || anhe[rev]) ahItems.push(`${zhis[i]}${zhis[j]}暗合`);
    }
  }
  if (ahItems.length > 0) result.push({type:'地支暗合', description:'暗中相合，不为人知，暗中有情', items: ahItems});

  // 8. 地支六冲
  const liuchong: Record<string, string> = {'子午':'水火冲','丑未':'土冲','寅申':'金木冲','卯酉':'金木冲','辰戌':'土冲','巳亥':'水火冲'};
  const lcItems: string[] = [];
  for (let i = 0; i < zhis.length; i++) {
    for (let j = i+1; j < zhis.length; j++) {
      const key = zhis[i]+zhis[j], rev = zhis[j]+zhis[i];
      if (liuchong[key]) lcItems.push(`${zhis[i]}${zhis[j]}相冲（${liuchong[key]}）`);
      else if (liuchong[rev]) lcItems.push(`${zhis[j]}${zhis[i]}相冲（${liuchong[rev]}）`);
    }
  }
  if (lcItems.length > 0) result.push({type:'地支六冲', description:'相冲则动，对应宫位易有变动、冲突、分离', items: lcItems});

  // 9. 地支相刑
  const sanxing: Record<string, string> = {'寅巳申':'无恩之刑','丑未戌':'恃势之刑','子卯':'无礼之刑'};
  const ziXing: Record<string, string> = {'辰':'自刑','午':'自刑','酉':'自刑','亥':'自刑'};
  Object.entries(sanxing).forEach(([k,v]) => {
    if (k.split('').every(p => sortedZhis.includes(p))) {
      result.push({type:'地支三刑', description:`${v}，主是非口舌、刑伤克害`, items:[`${k}（${v}）`]});
    }
  });
  // 自刑
  const zxItems: string[] = [];
  zhis.forEach(z => { if (ziXing[z]) zxItems.push(`${z}自刑（${ziXing[z]}）`); });
  if (zxItems.length > 0) result.push({type:'地支自刑', description:'自我刑害，自寻烦恼', items: zxItems});

  // 10. 地支相破
  const xiangpo: Record<string, string> = {'子酉':'破','寅亥':'破','辰丑':'破','午卯':'破','申巳':'破','戌未':'破'};
  const poItems: string[] = [];
  for (let i = 0; i < zhis.length; i++) {
    for (let j = i+1; j < zhis.length; j++) {
      const key = zhis[i]+zhis[j], rev = zhis[j]+zhis[i];
      if (xiangpo[key] || xiangpo[rev]) poItems.push(`${zhis[i]}${zhis[j]}相破`);
    }
  }
  if (poItems.length > 0) result.push({type:'地支相破', description:'相破主破坏、分裂，合作关系易生裂痕', items: poItems});

  // 11. 地支六害
  const xianghai: Record<string, string> = {'子未':'害','丑午':'害','寅巳':'害','卯辰':'害','申亥':'害','酉戌':'害'};
  const xhItems: string[] = [];
  for (let i = 0; i < zhis.length; i++) {
    for (let j = i+1; j < zhis.length; j++) {
      const key = zhis[i]+zhis[j], rev = zhis[j]+zhis[i];
      if (xianghai[key] || xianghai[rev]) xhItems.push(`${zhis[i]}${zhis[j]}相害`);
    }
  }
  if (xhItems.length > 0) result.push({type:'地支六害', description:'相害主暗中伤害、背后是非，人际关系受损', items: xhItems});

  return result;
}

// ========== 空亡计算 ==========
export function getKongWang(dayGan: string, dayZhi: string): string[] {
  const xunStart: Record<string, string[]> = {
    '甲子':['戌','亥'],'甲戌':['申','酉'],'甲申':['午','未'],
    '甲午':['辰','巳'],'甲辰':['寅','卯'],'甲寅':['子','丑'],
  };
  const dayGanIdx = TIAN_GAN.indexOf(dayGan);
  const dayZhiIdx = DI_ZHI.indexOf(dayZhi);
  if (dayGanIdx === -1 || dayZhiIdx === -1) return [];
  
  // 确定日柱属于哪一旬
  const xunIdx = Math.floor(dayGanIdx / 10 * 6 + dayZhiIdx / 12);
  // 简化：根据日干支确定旬空
  const zhuxun = dayGanIdx - (dayGanIdx % 10);
  const zhiXun = dayZhiIdx % 12;
  // 甲子旬：戌亥空，甲戌旬：申酉空，以此类推
  const xuns = [
    {start:0, kw:['戌','亥']},{start:2, kw:['申','酉']},{start:4, kw:['午','未']},
    {start:6, kw:['辰','巳']},{start:8, kw:['寅','卯']},{start:10, kw:['子','丑']}
  ];
  // 更精确的旬空计算
  const dayGanZhiIdx = (dayGanIdx * 12 + dayZhiIdx) % 60;
  const kwIdx = Math.floor(dayGanZhiIdx / 10);
  const kwMap = [['戌','亥'],['申','酉'],['午','未'],['辰','巳'],['寅','卯'],['子','丑']];
  return kwMap[kwIdx % 6] || [];
}
