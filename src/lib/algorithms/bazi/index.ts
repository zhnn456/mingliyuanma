/**
 * 四柱八字排盘核心算法
 * 基于万年历数据计算年柱、月柱、日柱、时柱
 * 扩展：胎元命宫身宫、精确大运、流年流月、五行力量量化、格局分析、宫位分析、十神组合
 */
import { Solar, Lunar } from 'lunar-javascript';
import {
  TIAN_GAN,
  DI_ZHI,
  TIAN_GAN_WU_XING,
  DI_ZHI_WU_XING,
  TIAN_GAN_YIN_YANG,
  SHI_SHEN,
  DI_ZHI_CANG_GAN,
  NA_YIN,
  SHENG_XIAO,
  SHI_CHEN,
  BaziResult,
} from '@/types';
import {
  calculateTaiYuanMingGong,
  calculateWuXingStrength,
  determineGeju,
  analyzeGongWei,
  analyzeShiShenCombinations,
  calculateDayunDetails,
  calculateLiuNian,
} from './extended';

/**
 * 获取年柱
 * 注意：八字年柱以立春为分界，不是公历1月1日
 */
function getYearGanZhi(year: number, month: number, day: number): { gan: string; zhi: string } {
  // 使用 lunar-javascript 获取准确的年柱（考虑立春）
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();
  const yearGanZhi = lunar.getYearInGanZhiExact(); // 以立春分界
  
  const gan = yearGanZhi.charAt(0);
  const zhi = yearGanZhi.charAt(1);
  
  return { gan, zhi };
}

/**
 * 获取月柱
 * 月柱以节气为分界（立春、惊蛰、清明、立夏、芒种、小暑、立秋、白露、寒露、立冬、大雪、小寒）
 */
function getMonthGanZhi(year: number, month: number, day: number): { gan: string; zhi: string } {
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();
  const monthGanZhi = lunar.getMonthInGanZhiExact();
  
  const gan = monthGanZhi.charAt(0);
  const zhi = monthGanZhi.charAt(1);
  
  return { gan, zhi };
}

/**
 * 获取日柱
 */
function getDayGanZhi(year: number, month: number, day: number): { gan: string; zhi: string } {
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();
  const dayGanZhi = lunar.getDayInGanZhi();
  
  const gan = dayGanZhi.charAt(0);
  const zhi = dayGanZhi.charAt(1);
  
  return { gan, zhi };
}

/**
 * 获取时柱
 * 时干根据日干推算：甲己日起甲子时，乙庚日起丙子时，丙辛日起戊子时，丁壬日起庚子时，戊癸日起壬子时
 */
function getHourGanZhi(dayGan: string, hour: number): { gan: string; zhi: string } {
  const zhi = SHI_CHEN[hour];
  const zhiIndex = DI_ZHI.indexOf(zhi as any);
  
  // 时干推算规则
  const dayGanIndex = TIAN_GAN.indexOf(dayGan as any);
  // 甲己日起甲子时(0)，乙庚日起丙子时(2)，丙辛日起戊子时(4)，丁壬日起庚子时(6)，戊癸日起壬子时(8)
  const baseGanIndex = (dayGanIndex % 5) * 2;
  const ganIndex = (baseGanIndex + zhiIndex) % 10;
  
  return {
    gan: TIAN_GAN[ganIndex],
    zhi: zhi,
  };
}

/**
 * 计算五行统计
 */
function calculateWuXing(fourPillars: BaziResult['fourPillars']): Record<string, number> {
  const wuxing: Record<string, number> = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };
  
  const pillars = [fourPillars.year, fourPillars.month, fourPillars.day, fourPillars.hour];
  
  for (const pillar of pillars) {
    // 天干五行
    const ganWuxing = TIAN_GAN_WU_XING[pillar.gan];
    if (ganWuxing) wuxing[ganWuxing] += 1;
    
    // 地支五行
    const zhiWuxing = DI_ZHI_WU_XING[pillar.zhi];
    if (zhiWuxing) wuxing[zhiWuxing] += 1;
  }
  
  return wuxing;
}

/**
 * 计算十神
 */
function calculateShiShen(dayGan: string, fourPillars: BaziResult['fourPillars']): Record<string, string> {
  const result: Record<string, string> = {};
  const shishenMap = SHI_SHEN[dayGan];
  
  if (!shishenMap) return result;
  
  const pillars = [
    { name: '年干', gz: fourPillars.year.gan },
    { name: '月干', gz: fourPillars.month.gan },
    { name: '时干', gz: fourPillars.hour.gan },
  ];
  
  for (const p of pillars) {
    result[p.name] = shishenMap[p.gz] || '';
  }
  
  // 地支藏干的十神
  const zhiPillars = [
    { name: '年支', zhi: fourPillars.year.zhi },
    { name: '月支', zhi: fourPillars.month.zhi },
    { name: '日支', zhi: fourPillars.day.zhi },
    { name: '时支', zhi: fourPillars.hour.zhi },
  ];
  
  for (const p of zhiPillars) {
    const cangGan = DI_ZHI_CANG_GAN[p.zhi];
    if (cangGan) {
      result[p.name] = cangGan.map(g => `${g}(${shishenMap[g] || ''})`).join(' ');
    }
  }
  
  return result;
}

/**
 * 计算大运
 * 阳年男命/阴年女命 顺排，阴年男命/阳年女命 逆排
 */
function calculateDayun(
  yearGan: string,
  monthGan: string,
  monthZhi: string,
  gender: string,
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  birthHour: number
): { gan: string; zhi: string; startAge: number }[] {
  const yearGanYang = TIAN_GAN_YIN_YANG[yearGan] === '阳';
  const isMale = gender === 'male';
  
  // 判断顺逆
  const isForward = (yearGanYang && isMale) || (!yearGanYang && !isMale);
  
  const monthGanIndex = TIAN_GAN.indexOf(monthGan as any);
  const monthZhiIndex = DI_ZHI.indexOf(monthZhi as any);
  
  // 计算起运岁数（简化计算，基于出生日到下一个/上一个节气的天数）
  const solar = Solar.fromYmd(birthYear, birthMonth, birthDay);
  const lunar = solar.getLunar();
  
  // 获取当前节气的下一个节气
  const jieQi = lunar.getJieQi();
  let startAge = 3; // 默认起运年龄
  
  // 简化的起运计算
  try {
    const prevJie = lunar.getPrevJie();
    const nextJie = lunar.getNextJie();
    
    if (isForward && nextJie) {
      const nextJieSolar = nextJie.getSolar();
      const diffDays = Math.abs(
        (nextJieSolar.getYear() * 365 + nextJieSolar.getMonth() * 30 + nextJieSolar.getDay()) -
        (birthYear * 365 + birthMonth * 30 + birthDay)
      );
      startAge = Math.round(diffDays / 3);
      if (startAge < 1) startAge = 1;
      if (startAge > 10) startAge = 10;
    } else if (!isForward && prevJie) {
      const prevJieSolar = prevJie.getSolar();
      const diffDays = Math.abs(
        (birthYear * 365 + birthMonth * 30 + birthDay) -
        (prevJieSolar.getYear() * 365 + prevJieSolar.getMonth() * 30 + prevJieSolar.getDay())
      );
      startAge = Math.round(diffDays / 3);
      if (startAge < 1) startAge = 1;
      if (startAge > 10) startAge = 10;
    }
  } catch {
    // 使用默认值
  }
  
  const dayun: { gan: string; zhi: string; startAge: number }[] = [];
  
  for (let i = 1; i <= 8; i++) {
    let ganIndex: number;
    let zhiIndex: number;
    
    if (isForward) {
      ganIndex = (monthGanIndex + i) % 10;
      zhiIndex = (monthZhiIndex + i) % 12;
    } else {
      ganIndex = (monthGanIndex - i + 10) % 10;
      zhiIndex = (monthZhiIndex - i + 12) % 12;
    }
    
    dayun.push({
      gan: TIAN_GAN[ganIndex],
      zhi: DI_ZHI[zhiIndex],
      startAge: startAge + (i - 1) * 10,
    });
  }
  
  return dayun;
}

/**
 * 主函数：四柱八字排盘
 * @param year 出生年
 * @param month 出生月
 * @param day 出生日
 * @param hour 出生小时（null=未知时辰，三柱论命）
 * @param gender 性别
 * @param isLunar 是否农历
 * @param isLeapMonth 是否闰月（农历）
 * @param hourType 早晚子时类型
 */
export function calculateBazi(
  year: number,
  month: number,
  day: number,
  hour: number | null,
  gender: string,
  isLunar: boolean = false,
  isLeapMonth: boolean = false,
  hourType?: 'early-zi' | 'late-zi'
): BaziResult {
  let solarYear = year;
  let solarMonth = month;
  let solarDay = day;
  
  // 如果输入的是农历，先转换为公历
  if (isLunar) {
    // lunar-javascript 用负数月表示闰月
    const lunarMonth = isLeapMonth ? -month : month;
    const lunar = Lunar.fromYmd(year, lunarMonth, day);
    const solar = lunar.getSolar();
    solarYear = solar.getYear();
    solarMonth = solar.getMonth();
    solarDay = solar.getDay();
  }
  
  // 计算四柱
  const yearPillar = getYearGanZhi(solarYear, solarMonth, solarDay);
  const monthPillar = getMonthGanZhi(solarYear, solarMonth, solarDay);
  const dayPillar = getDayGanZhi(solarYear, solarMonth, solarDay);

  // 时柱计算（处理未知时辰和早晚子时）
  const unknownHour = hour === null;
  let hourPillar: { gan: string; zhi: string };
  let dayGanForHour = dayPillar.gan; // 用于推算时干的天干

  if (unknownHour) {
    // 未知时辰：时柱为空
    hourPillar = { gan: '', zhi: '' };
  } else {
    // 晚子时：日柱用当天，但时干用次日干推算
    if (hourType === 'late-zi' && hour === 23) {
      // 获取次日的日干
      try {
        const nextSolar = Solar.fromYmd(solarYear, solarMonth, solarDay + 1);
        const nextLunar = nextSolar.getLunar();
        const nextDayGanZhi = nextLunar.getDayInGanZhi();
        dayGanForHour = nextDayGanZhi.charAt(0);
      } catch {
        // 跨月跨年处理失败时用当天
      }
    }
    hourPillar = getHourGanZhi(dayGanForHour, hour);
  }

  const fourPillars: BaziResult['fourPillars'] = {
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    hour: hourPillar,
  };
  
  // 计算五行（简单计数）
  const wuxing = calculateWuXing(fourPillars);

  // 五行力量量化（加权）
  const wuxingStrength = calculateWuXingStrength(fourPillars);
  
  // 计算十神
  const shishen = calculateShiShen(dayPillar.gan, fourPillars);
  
  // 计算大运（基础版，保持兼容）
  const dayun = calculateDayun(
    yearPillar.gan, monthPillar.gan, monthPillar.zhi,
    gender, solarYear, solarMonth, solarDay, hour || 0
  );

  // 大运详细信息（含十神、神煞、流年）
  const dayunDetails = calculateDayunDetails(
    yearPillar.gan, monthPillar.gan, monthPillar.zhi,
    gender, solarYear, solarMonth, solarDay, dayPillar.gan, 8
  );

  // 胎元命宫身宫
  const taiYuanMingGong = calculateTaiYuanMingGong(
    yearPillar.gan, monthPillar.gan, monthPillar.zhi,
    unknownHour ? null : hourPillar.zhi
  );

  // 格局判定
  const geju = determineGeju(
    dayPillar.gan, monthPillar.gan, monthPillar.zhi,
    fourPillars, wuxingStrength
  );

  // 宫位分析
  const gongWei = analyzeGongWei(dayPillar.gan, fourPillars);

  // 十神组合分析
  const shishenCombinations = analyzeShiShenCombinations(dayPillar.gan, fourPillars, shishen);

  // 流年（当前年份前后20年）
  const liunian = calculateLiuNian(
    solarYear, dayun[0]?.startAge || 3, 20, dayPillar.gan
  );
  
  // 纳音
  const nayin: Record<string, string> = {};
  const pillarNames = ['year', 'month', 'day', 'hour'];
  const pillarLabels = ['年柱', '月柱', '日柱', '时柱'];
  for (let i = 0; i < 4; i++) {
    const p = fourPillars[pillarNames[i] as keyof typeof fourPillars];
    if (p.gan && p.zhi) {
      const key = `${p.gan}${p.zhi}`;
      nayin[pillarLabels[i]] = NA_YIN[key] || '';
    }
  }
  
  // 藏干
  const canggan: Record<string, string[]> = {};
  for (let i = 0; i < 4; i++) {
    const p = fourPillars[pillarNames[i] as keyof typeof fourPillars];
    if (p.zhi) {
      canggan[pillarLabels[i]] = DI_ZHI_CANG_GAN[p.zhi] || [];
    }
  }
  
  // 生肖
  const shengxiao = SHENG_XIAO[yearPillar.zhi] || '';
  
  return {
    fourPillars,
    wuxing,
    dayun,
    shishen,
    nayin,
    canggan,
    shengxiao,
    gender,
    // 扩展字段
    taiYuanMingGong,
    wuxingStrength,
    geju,
    gongWei,
    shishenCombinations,
    dayunDetails,
    liunian,
    unknownHour,
  };
}

/**
 * 分析喜用神（简化版）
 */
export function analyzeXiYongShen(wuxing: Record<string, number>, dayGan: string): { xi: string; yong: string; ji: string } {
  const dayWuxing = TIAN_GAN_WU_XING[dayGan];
  
  // 统计五行强弱
  let maxWuxing = '';
  let minWuxing = '';
  let maxCount = 0;
  let minCount = 999;
  
  for (const [wx, count] of Object.entries(wuxing)) {
    if (count > maxCount) {
      maxCount = count;
      maxWuxing = wx;
    }
    if (count < minCount) {
      minCount = count;
      minWuxing = wx;
    }
  }
  
  // 简化规则：日主强则抑之，日主弱则扶之
  const dayCount = wuxing[dayWuxing] || 0;
  const total = Object.values(wuxing).reduce((a, b) => a + b, 0);
  const isStrong = dayCount > total / 5;
  
  // 五行生克关系
  const sheng: Record<string, string> = { '金': '水', '水': '木', '木': '火', '火': '土', '土': '金' };
  const ke: Record<string, string> = { '金': '木', '木': '土', '土': '水', '水': '火', '火': '金' };
  
  let xi: string, yong: string, ji: string;
  
  if (isStrong) {
    // 日主强：用克、泄、耗
    yong = ke[dayWuxing]; // 用克日主的五行所克的
    xi = sheng[dayWuxing]; // 喜日主所生的
    ji = dayWuxing; // 忌同五行
  } else {
    // 日主弱：用生、扶
    const shengWo = Object.entries(sheng).find(([_, v]) => v === dayWuxing)?.[0] || dayWuxing;
    yong = shengWo; // 用生我者
    xi = dayWuxing; // 喜同五行
    ji = ke[dayWuxing]; // 忌克我者所克的
  }
  
  return { xi, yong, ji };
}
