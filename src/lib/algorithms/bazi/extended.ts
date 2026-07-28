/**
 * 四柱八字扩展算法
 * 包含：胎元命宫身宫、精确大运、流年流月、五行力量量化、
 *       从格化格判定、格局分析、宫位分析、十神组合、大运流年神煞
 *
 * 理论依据：
 * - 《渊海子平》：格局判定、用神取法
 * - 《子平真诠》：格局成败、用神变化
 * - 《穷通宝鉴》：调候用神
 * - 《三命通会》：神煞、宫位、综合论命
 * - 《滴天髓》：五行生克制化、旺衰
 */

import {
  TIAN_GAN,
  DI_ZHI,
  TIAN_GAN_WU_XING,
  DI_ZHI_WU_XING,
  TIAN_GAN_YIN_YANG,
  SHI_SHEN,
  DI_ZHI_CANG_GAN,
} from '@/types';
import type {
  TaiYuanMingGong,
  WuXingStrength,
  GeJuAnalysis,
  GongWeiAnalysis,
  ShiShenCombination,
  DayunDetail,
  LiuNian,
} from '@/types';
import { Solar, Lunar } from 'lunar-javascript';

// ========== 1. 胎元/命宫/身宫 ==========

/**
 * 计算胎元
 * 方法：月柱干支各进三位（月干+3, 月支+3）
 * 来源：《三命通会》"胎元，受胎之月也，月干进三位，月支进三位"
 */
export function calculateTaiYuan(monthGan: string, monthZhi: string): { gan: string; zhi: string } {
  const ganIdx = TIAN_GAN.indexOf(monthGan as any);
  const zhiIdx = DI_ZHI.indexOf(monthZhi as any);
  if (ganIdx === -1 || zhiIdx === -1) return { gan: '', zhi: '' };
  return {
    gan: TIAN_GAN[(ganIdx + 3) % 10],
    zhi: DI_ZHI[(zhiIdx + 3) % 12],
  };
}

/**
 * 计算命宫
 * 方法：从子上起正月，逆数到生月；从生月支起，顺数到卯，即为命宫地支
 * 命宫天干：以年干起法（年上起月法推算）
 * 来源：《三命通会》"命宫者，以生月从子起，逆数至本生月止，又从生时顺数至卯，即是命宫"
 * 简化算法：命宫支 = (月支序 - 1 - 时支序 + 2 + 12) % 12，再映射到地支
 */
export function calculateMingGong(monthZhi: string, hourZhi: string | null): { gan: string; zhi: string } {
  if (!hourZhi) return { gan: '', zhi: '' };
  const monthIdx = DI_ZHI.indexOf(monthZhi as any);
  const hourIdx = DI_ZHI.indexOf(hourZhi as any);
  if (monthIdx === -1 || hourIdx === -1) return { gan: '', zhi: '' };

  // 命宫地支：(月支 + 时支) 对照寅为基准
  // 传统口诀：子起正月逆数到生月，再从生月起顺数到卯位
  // 简化：命宫支序 = (14 - monthIdx - hourIdx) % 12
  const mgZhiIdx = ((14 - monthIdx - hourIdx) % 12 + 12) % 12;
  const mgZhi = DI_ZHI[mgZhiIdx];

  // 命宫天干：用年干推算（五虎遁元法，但命宫用年干起）
  // 这里用命宫支的五行属性配合年干来推算命宫干
  // 实际：命宫天干 = 以生年干为基准，按五虎遁推到命宫支
  // 五虎遁：甲己年起丙寅，乙庚年起戊寅，丙辛年起庚寅，丁壬年起壬寅，戊癸年起甲寅
  return { gan: '', zhi: mgZhi }; // 天干需要年干，在主函数中计算
}

/**
 * 计算命宫天干（需要年干）
 * 五虎遁：从寅起，按年干推算
 */
export function calculateMingGongWithYearGan(yearGan: string, monthZhi: string, hourZhi: string | null): { gan: string; zhi: string } {
  const mg = calculateMingGong(monthZhi, hourZhi);
  if (!mg.zhi) return mg;

  // 五虎遁起始干
  const yearGanIdx = TIAN_GAN.indexOf(yearGan as any);
  const startGanIdx = (yearGanIdx % 5) * 2 + 2; // 甲己→丙(2), 乙庚→戊(4), 丙辛→庚(6), 丁壬→壬(8), 戊癸→甲(0)
  const adjustedStart = startGanIdx % 10;

  // 寅的地支序号是2，从寅起推算到命宫支
  const mgZhiIdx = DI_ZHI.indexOf(mg.zhi as any);
  const yinIdx = 2; // 寅
  const offset = (mgZhiIdx - yinIdx + 12) % 12;
  const mgGanIdx = (adjustedStart + offset) % 10;

  return {
    gan: TIAN_GAN[mgGanIdx],
    zhi: mg.zhi,
  };
}

/**
 * 计算身宫
 * 方法：从子上起正月，顺数到生月；从生月起，逆数到卯位
 * 简化：身宫支序 = (monthIdx + hourIdx - 2 + 12) % 12... 
 * 实际传统法：身宫 = (月支 + 时支)，与命宫相反方向
 */
export function calculateShenGong(monthZhi: string, hourZhi: string | null): { gan: string; zhi: string } {
  if (!hourZhi) return { gan: '', zhi: '' };
  const monthIdx = DI_ZHI.indexOf(monthZhi as any);
  const hourIdx = DI_ZHI.indexOf(hourZhi as any);
  if (monthIdx === -1 || hourIdx === -1) return { gan: '', zhi: '' };

  // 身宫地支：与命宫相反方向
  // 口诀：身宫从子起正月顺数到生月，从生月逆数到卯
  const sgZhiIdx = ((monthIdx + hourIdx) % 12 + 12) % 12;
  return { gan: '', zhi: DI_ZHI[sgZhiIdx] };
}

/**
 * 计算胎元、命宫、身宫（综合）
 */
export function calculateTaiYuanMingGong(
  yearGan: string,
  monthGan: string,
  monthZhi: string,
  hourZhi: string | null
): TaiYuanMingGong {
  const taiYuan = calculateTaiYuan(monthGan, monthZhi);
  const mingGong = calculateMingGongWithYearGan(yearGan, monthZhi, hourZhi);
  const shenGong = calculateShenGong(monthZhi, hourZhi);
  return { taiYuan, mingGong, shenGong };
}

// ========== 2. 精确起运岁数 ==========

/**
 * 精确计算起运岁数
 * 方法：从出生日到下一个/上一个节气的天数，3天折1岁，1天折4个月，1时辰折10天
 * 阳年男/阴年女顺排（数到下一个节气）
 * 阴年男/阳年女逆排（数到上一个节气）
 * 来源：《渊海子平》"大运起运法，阳男阴女顺数，阴男阳女逆数"
 */
export function calculatePreciseStartAge(
  yearGan: string,
  gender: string,
  birthYear: number,
  birthMonth: number,
  birthDay: number
): { startAge: number; startMonth: number; totalDays: number; direction: string } {
  const yearGanYang = TIAN_GAN_YIN_YANG[yearGan] === '阳';
  const isMale = gender === 'male';
  const isForward = (yearGanYang && isMale) || (!yearGanYang && !isMale);
  const direction = isForward ? '顺行' : '逆行';

  try {
    const solar = Solar.fromYmd(birthYear, birthMonth, birthDay);
    const lunar = solar.getLunar();

    let targetJie: any;
    if (isForward) {
      targetJie = lunar.getNextJie();
    } else {
      targetJie = lunar.getPrevJie();
    }

    if (!targetJie) {
      return { startAge: 3, startMonth: 0, totalDays: 9, direction };
    }

    const targetSolar = targetJie.getSolar();
    // 精确天数差
    const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
    const targetDate = new Date(targetSolar.getYear(), targetSolar.getMonth() - 1, targetSolar.getDay());
    const diffMs = Math.abs(targetDate.getTime() - birthDate.getTime());
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // 3天折1岁，1天折4个月
    const startAge = Math.floor(totalDays / 3);
    const remainingDays = totalDays % 3;
    const startMonth = Math.floor(remainingDays * 4); // 1天=4个月

    return {
      startAge: Math.max(0, startAge),
      startMonth,
      totalDays,
      direction,
    };
  } catch {
    return { startAge: 3, startMonth: 0, totalDays: 9, direction };
  }
}

// ========== 3. 流年干支 ==========

/**
 * 计算流年干支
 * 推算 birthYear ± yearsRange 范围内的流年
 */
export function calculateLiuNian(
  birthYear: number,
  startAge: number,
  yearsRange: number = 20,
  dayGan: string,
  dayunGanZhi?: { gan: string; zhi: string }
): LiuNian[] {
  const result: LiuNian[] = [];
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - yearsRange;
  const endYear = currentYear + yearsRange;

  for (let year = startYear; year <= endYear; year++) {
    const age = year - birthYear;
    if (age < 0 || age > 100) continue;

    try {
      const solar = Solar.fromYmd(year, 2, 4); // 立春后取年柱
      const lunar = solar.getLunar();
      const yearGanZhi = lunar.getYearInGanZhiExact();
      const gan = yearGanZhi.charAt(0);
      const zhi = yearGanZhi.charAt(1);

      // 流年十神
      const shishenMap = SHI_SHEN[dayGan];
      const shishen = shishenMap?.[gan] || '';

      // 流年神煞
      const shensha = calculateLiuNianShensha(gan, zhi, dayGan);

      result.push({
        year,
        age,
        gan,
        zhi,
        shishen,
        shensha,
      });
    } catch {
      // skip invalid dates
    }
  }

  return result;
}

// ========== 4. 流月干支 ==========

/**
 * 计算某年的流月干支
 * 月干以年干起（五虎遁），月支固定为正月寅、二月卯...
 */
export function calculateLiuYue(year: number, yearGan: string): { month: number; gan: string; zhi: string }[] {
  const result: { month: number; gan: string; zhi: string }[] = [];
  const yearGanIdx = TIAN_GAN.indexOf(yearGan as any);
  if (yearGanIdx === -1) return result;

  // 五虎遁起始干：甲己→丙寅, 乙庚→戊寅, 丙辛→庚寅, 丁壬→壬寅, 戊癸→甲寅
  const startGanIdx = (yearGanIdx % 5) * 2 + 2;
  const adjustedStart = startGanIdx % 10;

  // 正月寅(2), 二月卯(3), ..., 十二月丑(1)
  for (let m = 1; m <= 12; m++) {
    const zhiIdx = (m + 1) % 12; // 正月=寅=2, 二月=卯=3...
    const ganIdx = (adjustedStart + m - 1) % 10;
    result.push({
      month: m,
      gan: TIAN_GAN[ganIdx],
      zhi: DI_ZHI[zhiIdx],
    });
  }

  return result;
}

// ========== 5. 五行力量量化 ==========

/**
 * 五行力量量化
 * 天干：力量1
 * 地支本气：力量3
 * 地支中气：力量2
 * 地支余气：力量1
 * 
 * 来源：《滴天髓》五行生克制化理论
 */
export function calculateWuXingStrength(
  fourPillars: {
    year: { gan: string; zhi: string };
    month: { gan: string; zhi: string };
    day: { gan: string; zhi: string };
    hour: { gan: string; zhi: string };
  }
): WuXingStrength {
  const counts: Record<string, number> = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };
  const strengths: Record<string, number> = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };
  const details: { source: string; wuxing: string; strength: number; type: string }[] = [];

  const pillarNames = [
    { key: 'year', label: '年柱' },
    { key: 'month', label: '月柱' },
    { key: 'day', label: '日柱' },
    { key: 'hour', label: '时柱' },
  ];

  for (const p of pillarNames) {
    const pillar = fourPillars[p.key as keyof typeof fourPillars];
    if (!pillar) continue;

    // 天干力量 = 1
    const ganWx = TIAN_GAN_WU_XING[pillar.gan];
    if (ganWx) {
      counts[ganWx] += 1;
      strengths[ganWx] += 1;
      details.push({ source: `${p.label}干 ${pillar.gan}`, wuxing: ganWx, strength: 1, type: '天干' });
    }

    // 地支藏干力量
    const cangGan = DI_ZHI_CANG_GAN[pillar.zhi];
    if (cangGan) {
      // 藏干列表的顺序是 本气, 中气, 余气
      cangGan.forEach((cg, idx) => {
        const cgWx = TIAN_GAN_WU_XING[cg];
        if (cgWx) {
          const strength = idx === 0 ? 3 : idx === 1 ? 2 : 1;
          const type = idx === 0 ? '本气' : idx === 1 ? '中气' : '余气';
          counts[cgWx] += 1;
          strengths[cgWx] += strength;
          details.push({ source: `${p.label}支 ${pillar.zhi}·${cg}`, wuxing: cgWx, strength, type });
        }
      });
    }
  }

  const total = Object.values(strengths).reduce((a, b) => a + b, 0);

  // 找最旺和最弱
  let dominant = '土', weakest = '土';
  let maxStr = -1, minStr = 999;
  for (const [wx, str] of Object.entries(strengths)) {
    if (str > maxStr) { maxStr = str; dominant = wx; }
    if (str < minStr) { minStr = str; weakest = wx; }
  }

  // 缺失五行
  const missing = Object.entries(strengths).filter(([_, s]) => s === 0).map(([wx]) => wx);

  return { counts, strengths, total, details, dominant, weakest, missing };
}

// ========== 6. 从格/化格判定 ==========

/**
 * 判定从格
 * 条件：日主无根（地支无本气、中气根），且满局某五行力量超过80%
 * 类型：从财格、从杀格、从儿格、从势格
 * 来源：《子平真诠》论从格
 */
export function determineCongGe(
  dayGan: string,
  fourPillars: any,
  wuxingStrength: WuXingStrength
): GeJuAnalysis | null {
  const dayWx = TIAN_GAN_WU_XING[dayGan];

  // 检查日主是否有根
  const pillars = [fourPillars.year, fourPillars.month, fourPillars.day, fourPillars.hour];
  let hasRoot = false;
  for (const p of pillars) {
    if (!p) continue;
    const cangGan = DI_ZHI_CANG_GAN[p.zhi];
    if (cangGan) {
      // 检查本气和中气是否有日主同类五行
      if (cangGan.length >= 1 && TIAN_GAN_WU_XING[cangGan[0]] === dayWx) hasRoot = true;
      if (cangGan.length >= 2 && TIAN_GAN_WU_XING[cangGan[1]] === dayWx) hasRoot = true;
    }
  }

  if (hasRoot) return null; // 有根不从

  // 检查是否有印星生扶
  const shengWo: Record<string, string> = { '木': '水', '火': '木', '土': '火', '金': '土', '水': '金' };
  const yinXing = shengWo[dayWx];
  const yinStrength = wuxingStrength.strengths[yinXing] || 0;
  if (yinStrength >= 3) return null; // 印星有力量，不从

  // 判定从什么
  const ke: Record<string, string> = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' };
  const sheng: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };

  const caiWx = ke[dayWx]; // 我克者财
  const guanWx = shengWo[dayWx] === dayWx ? '' : Object.entries({ '木': '金', '火': '水', '土': '木', '金': '火', '水': '土' }).find(([_, v]) => v === dayWx)?.[0] || ''; // 克我者官杀
  const shiWx = sheng[dayWx]; // 我生者食伤

  const caiStrength = wuxingStrength.strengths[caiWx] || 0;
  const guanStrength = wuxingStrength.strengths[guanWx] || 0;
  const shiStrength = wuxingStrength.strengths[shiWx] || 0;
  const total = wuxingStrength.total;

  // 从财格
  if (caiStrength > total * 0.5) {
    return {
      name: '从财格',
      description: '日主无根无印，满局财星当旺。舍命从财，宜经商求财，财源广进。',
      isEstablished: true,
      level: '从格',
      details: [
        `日主${dayGan}（${dayWx}）无根无印`,
        `财星（${caiWx}）力量${caiStrength}，占全局${Math.round(caiStrength / total * 100)}%`,
        '从财格喜财官食伤，忌印比',
        '《子平真诠》云：从财格者，日主无根，满局财星，舍命从之',
      ],
      classicalRef: '《子平真诠·论从格》',
    };
  }

  // 从杀格
  if (guanStrength > total * 0.5) {
    return {
      name: '从杀格',
      description: '日主无根无印，满局官杀当旺。舍命从杀，宜武职政界，有权威。',
      isEstablished: true,
      level: '从格',
      details: [
        `日主${dayGan}（${dayWx}）无根无印`,
        `官杀（${guanWx}）力量${guanStrength}，占全局${Math.round(guanStrength / total * 100)}%`,
        '从杀格喜财官，忌食伤印比',
        '《子平真诠》云：从杀格者，日主无根，满局官杀，舍命从之',
      ],
      classicalRef: '《子平真诠·论从格》',
    };
  }

  // 从儿格
  if (shiStrength > total * 0.5) {
    return {
      name: '从儿格',
      description: '日主无根无印，满局食伤当旺。舍命从儿，宜艺术创作，才华横溢。',
      isEstablished: true,
      level: '从格',
      details: [
        `日主${dayGan}（${dayWx}）无根无印`,
        `食伤（${shiWx}）力量${shiStrength}，占全局${Math.round(shiStrength / total * 100)}%`,
        '从儿格喜食伤财，忌印比官杀',
        '《子平真诠》云：从儿格者，日主无根，满局食伤，舍命从之',
      ],
      classicalRef: '《子平真诠·论从格》',
    };
  }

  // 从势格（多种五行皆有，但日主无根）
  if (total > 0 && !hasRoot && yinStrength < 3) {
    return {
      name: '从势格',
      description: '日主无根无印，满局五行混杂但日主无力。舍命从势，宜随势而动。',
      isEstablished: true,
      level: '从格',
      details: [
        `日主${dayGan}（${dayWx}）无根无印`,
        '满局五行混杂，日主无力量从势',
        '从势格喜顺势力而行，忌印比助身',
      ],
      classicalRef: '《子平真诠·论从格》',
    };
  }

  return null;
}

/**
 * 判定化格
 * 条件：日干与月干或时干相合，且化神得令得地
 * 来源：《子平真诠》论化气格
 */
export function determineHuaGe(
  dayGan: string,
  monthGan: string,
  monthZhi: string,
  wuxingStrength: WuXingStrength
): GeJuAnalysis | null {
  // 天干五合
  const wuhe: Record<string, { target: string; huaWx: string }> = {
    '甲己': { target: '甲己', huaWx: '土' },
    '乙庚': { target: '乙庚', huaWx: '金' },
    '丙辛': { target: '丙辛', huaWx: '水' },
    '丁壬': { target: '丁壬', huaWx: '木' },
    '戊癸': { target: '戊癸', huaWx: '火' },
  };

  // 检查日干与月干是否合
  const key1 = dayGan + monthGan;
  const key2 = monthGan + dayGan;
  const he = wuhe[key1] || wuhe[key2];

  if (!he) return null;

  // 检查化神是否得令
  const monthWx = DI_ZHI_WU_XING[monthZhi];
  const huaWxStrength = wuxingStrength.strengths[he.huaWx] || 0;
  const total = wuxingStrength.total;

  // 化神得令且力量占50%以上
  if (monthWx === he.huaWx || huaWxStrength > total * 0.4) {
    const huaGanMap: Record<string, string> = { '木': '甲', '火': '丙', '土': '戊', '金': '庚', '水': '壬' };
    return {
      name: `化${he.huaWx}格`,
      description: `${dayGan}与${monthGan}合化${he.huaWx}，化神得令得地，格局纯粹。化气之后以化神论命。`,
      isEstablished: true,
      level: '化格',
      details: [
        `日干${dayGan}与月干${monthGan}天干五合`,
        `化神为${he.huaWx}，${monthWx === he.huaWx ? '化神得月令' : '化神力量充足'}`,
        `化神力量${huaWxStrength}，占全局${Math.round(huaWxStrength / total * 100)}%`,
        `化格喜化神生扶，忌克化神之五行`,
        `《子平真诠》云：化气格者，日干与月干相合，化神得令，方为真化`,
      ],
      classicalRef: '《子平真诠·论化气格》',
    };
  }

  return null;
}

// ========== 7. 格局判定（正格） ==========

/**
 * 格局判定
 * 以月支藏干透出情况判定正格
 * 来源：《子平真诠》论用神成败
 * @returns 格局分析结果
 */
export function determineZhengGe(
  dayGan: string,
  monthZhi: string,
  fourPillars: any
): GeJuAnalysis | null {
  const monthCangGan = DI_ZHI_CANG_GAN[monthZhi];
  if (!monthCangGan || monthCangGan.length === 0) return null;

  const shishenMap = SHI_SHEN[dayGan];
  if (!shishenMap) return null;

  // 月支本气的十神
  const benQi = monthCangGan[0];
  const benQiShiShen = shishenMap[benQi];

  // 检查本气是否透干
  const tianGans = [fourPillars.year?.gan, fourPillars.month?.gan, fourPillars.hour?.gan].filter(Boolean);
  const isBenQiTouGan = tianGans.includes(benQi);

  // 检查中气是否透干
  const zhongQi = monthCangGan[1];
  const zhongQiShiShen = zhongQi ? shishenMap[zhongQi] : '';
  const isZhongQiTouGan = zhongQi && tianGans.includes(zhongQi);

  // 检查余气是否透干
  const yuQi = monthCangGan[2];
  const yuQiShiShen = yuQi ? shishenMap[yuQi] : '';
  const isYuQiTouGan = yuQi && tianGans.includes(yuQi);

  // 取格局：优先本气透干，其次中气，再次余气
  let gejuName = '';
  let gejuGan = '';
  let touGan = false;

  if (isBenQiTouGan) {
    gejuName = benQiShiShen + '格';
    gejuGan = benQi;
    touGan = true;
  } else if (isZhongQiTouGan) {
    gejuName = zhongQiShiShen + '格';
    gejuGan = zhongQi;
    touGan = true;
  } else if (isYuQiTouGan) {
    gejuName = yuQiShiShen + '格';
    gejuGan = yuQi;
    touGan = true;
  } else {
    // 不透干，以本气论格
    gejuName = benQiShiShen + '格';
    gejuGan = benQi;
    touGan = false;
  }

  // 格局描述
  const gejuDescriptions: Record<string, { desc: string; classical: string }> = {
    '正官格': { desc: '月令正官，为人正直有管理才能，宜公职仕途', classical: '《渊海子平》：正官格，喜财印相生，忌伤官七杀' },
    '七杀格': { desc: '月令七杀，性格刚毅有魄力，宜军警开创性事业', classical: '《渊海子平》：七杀格，喜食神制杀，忌财党杀' },
    '正印格': { desc: '月令正印，心地善良学业有成，得长辈庇护', classical: '《渊海子平》：正印格，喜官星生印，忌财破印' },
    '偏印格': { desc: '月令偏印，思维独特有特殊才能，宜玄学技艺', classical: '《渊海子平》：偏印格，喜偏财破印，忌食神受枭' },
    '正财格': { desc: '月令正财，财运稳定勤劳致富，勤俭持家', classical: '《渊海子平》：正财格，喜官星护财，忌比劫夺财' },
    '偏财格': { desc: '月令偏财，偏财运佳慷慨大方，善交际经营', classical: '《渊海子平》：偏财格，喜食伤生财，忌比劫夺财' },
    '食神格': { desc: '月令食神，心宽体胖有口福才艺，宜文艺教育', classical: '《渊海子平》：食神格，喜财星流通，忌枭神夺食' },
    '伤官格': { desc: '月令伤官，聪明伶俐才华横溢，宜技艺创作', classical: '《渊海子平》：伤官格，喜财星引化，忌官星受克' },
    '比肩格': { desc: '月令比肩，个性强独立自主，宜合伙事业', classical: '《渊海子平》：比肩格，喜官杀制比，忌比劫过旺' },
    '劫财格': { desc: '月令劫财，好胜心强有竞争精神，慎防破财', classical: '《渊海子平》：劫财格，喜食伤泄秀，忌劫财夺财' },
  };

  const descInfo = gejuDescriptions[gejuName] || { desc: '月令本气透干成格', classical: '' };

  // 格局成败分析
  const details: string[] = [];
  details.push(`月支${monthZhi}，本气${benQi}（${benQiShiShen}）`);

  if (touGan) {
    details.push(`${gejuGan}透于天干，格局成立`);
  } else {
    details.push(`本气未透干，以月支本气${benQi}（${benQiShiShen}）暗格论`);
  }

  // 检查中气余气
  if (zhongQi) {
    details.push(`月支中气${zhongQi}（${zhongQiShiShen}）${isZhongQiTouGan ? '透干' : '未透'}`);
  }
  if (yuQi) {
    details.push(`月支余气${yuQi}（${yuQiShiShen}）${isYuQiTouGan ? '透干' : '未透'}`);
  }

  if (descInfo.classical) {
    details.push(descInfo.classical);
  }

  return {
    name: gejuName,
    description: descInfo.desc,
    isEstablished: true,
    level: '正格',
    details,
    classicalRef: descInfo.classical,
  };
}

/**
 * 综合格局判定（正格 + 从格 + 化格）
 */
export function determineGeju(
  dayGan: string,
  monthGan: string,
  monthZhi: string,
  fourPillars: any,
  wuxingStrength: WuXingStrength
): GeJuAnalysis {
  // 先查从格
  const congGe = determineCongGe(dayGan, fourPillars, wuxingStrength);
  if (congGe) return congGe;

  // 再查化格
  const huaGe = determineHuaGe(dayGan, monthGan, monthZhi, wuxingStrength);
  if (huaGe) return huaGe;

  // 最后查正格
  const zhengGe = determineZhengGe(dayGan, monthZhi, fourPillars);
  if (zhengGe) return zhengGe;

  // 默认
  return {
    name: '杂格',
    description: '月令藏干未透，格局不纯，以五行生克论命',
    isEstablished: false,
    level: '正格',
    details: ['月令藏干未透天干，格局不够纯粹', '以五行旺衰和十神组合综合论命'],
  };
}

// ========== 8. 宫位分析 ==========

/**
 * 宫位分析
 * 年柱：祖辈宫（祖父母、祖业、根基）
 * 月柱：父母宫（父母、兄弟、成长环境）
 * 日柱：配偶宫（日支为配偶宫）
 * 时柱：子女宫（子女、晚年、归宿）
 * 来源：《三命通会》论宫位
 */
export function analyzeGongWei(
  dayGan: string,
  fourPillars: any
): GongWeiAnalysis[] {
  const shishenMap = SHI_SHEN[dayGan];
  if (!shishenMap) return [];

  const palaceData = [
    {
      position: '年柱',
      palace: '祖辈宫',
      gan: fourPillars.year?.gan,
      zhi: fourPillars.year?.zhi,
      ganShiShen: shishenMap[fourPillars.year?.gan] || '',
      desc: '祖辈宫代表祖父母、祖业根基、早年环境（1-15岁）。',
    },
    {
      position: '月柱',
      palace: '父母宫',
      gan: fourPillars.month?.gan,
      zhi: fourPillars.month?.zhi,
      ganShiShen: shishenMap[fourPillars.month?.gan] || '',
      desc: '父母宫代表父母、兄弟、成长环境（16-30岁）。',
    },
    {
      position: '日柱',
      palace: '配偶宫',
      gan: fourPillars.day?.gan,
      zhi: fourPillars.day?.zhi,
      ganShiShen: '日主',
      desc: '配偶宫代表配偶、婚姻关系（日支为配偶宫，31-45岁为主）。',
    },
    {
      position: '时柱',
      palace: '子女宫',
      gan: fourPillars.hour?.gan,
      zhi: fourPillars.hour?.zhi,
      ganShiShen: shishenMap[fourPillars.hour?.gan] || '',
      desc: '子女宫代表子女、晚年生活、事业归宿（46岁后）。',
    },
  ];

  return palaceData.map(p => {
    if (!p.gan) return null;

    const ganZhi = `${p.gan}${p.zhi}`;
    let analysis = p.desc;

    // 日支配偶宫分析
    if (p.position === '日柱') {
      const zhiShiShen = getZhiShiShen(dayGan, p.zhi, shishenMap);
      analysis += ` 日支${p.zhi}为配偶宫，藏${zhiShiShen}。`;
      // 配偶宫十神含义
      const zhiBenQi = DI_ZHI_CANG_GAN[p.zhi]?.[0] || '';
      const benQiSS = shishenMap[zhiBenQi] || '';
      const spouseMeaning: Record<string, string> = {
        '正官': '配偶端正有责任感，婚姻稳定',
        '七杀': '配偶强势有魄力，婚姻有波折但深刻',
        '正财': '配偶勤俭持家，婚姻美满',
        '偏财': '配偶慷慨大方，异性缘佳',
        '正印': '配偶温柔体贴，有包容心',
        '偏印': '配偶思维独特，有特殊才能',
        '食神': '配偶有口福才艺，性格温和',
        '伤官': '配偶才华横溢，但个性强',
        '比肩': '配偶个性独立，如朋友般相处',
        '劫财': '配偶好胜心强，需注意财务',
      };
      if (spouseMeaning[benQiSS]) {
        analysis += spouseMeaning[benQiSS] + '。';
      }
    }

    // 年柱祖辈宫分析
    if (p.position === '年柱') {
      const yearGanSS = p.ganShiShen;
      const ancestorMeaning: Record<string, string> = {
        '正官': '祖上有官职功名，家风端正',
        '七杀': '祖上创业艰辛，有武职背景',
        '正财': '祖业丰厚，家境殷实',
        '偏财': '祖上经商，财运起伏',
        '正印': '祖上读书人，有文化传承',
        '偏印': '祖上有技艺或玄学背景',
        '食神': '祖上福寿，家风宽厚',
        '伤官': '祖上才华出众，但易叛逆',
        '比肩': '祖上兄弟众多，自立更生',
        '劫财': '祖上竞争激烈，家产易散',
      };
      if (ancestorMeaning[yearGanSS]) {
        analysis += ' ' + ancestorMeaning[yearGanSS] + '。';
      }
    }

    // 时柱子女宫分析
    if (p.position === '时柱') {
      const hourGanSS = p.ganShiShen;
      const childMeaning: Record<string, string> = {
        '正官': '子女孝顺有出息，晚年享福',
        '七杀': '子女个性强，有成就但需严教',
        '正财': '子女勤俭，晚年经济无忧',
        '偏财': '子女有商业头脑，财运佳',
        '正印': '子女读书好，有贵人助',
        '偏印': '子女思维独特，有特长',
        '食神': '子女有福，女命子女多',
        '伤官': '子女聪明但叛逆，需耐心引导',
        '比肩': '子女独立，如朋友相处',
        '劫财': '子女好胜，需注意教育方式',
      };
      if (childMeaning[hourGanSS]) {
        analysis += ' ' + childMeaning[hourGanSS] + '。';
      }
    }

    return {
      position: p.position,
      palace: p.palace,
      ganZhi,
      shiShen: p.position === '日柱' ? '日主/日支藏干' : p.ganShiShen,
      analysis,
    };
  }).filter(Boolean) as GongWeiAnalysis[];
}

// 辅助：获取地支藏干的十神
function getZhiShiShen(dayGan: string, zhi: string, shishenMap: Record<string, string>): string {
  const cangGan = DI_ZHI_CANG_GAN[zhi];
  if (!cangGan) return '';
  return cangGan.map(cg => `${cg}(${shishenMap[cg] || ''})`).join(' ');
}

// ========== 9. 十神组合分析 ==========

/**
 * 十神组合分析
 * 检测命局中的十神组合，分析其影响
 * 来源：《渊海子平》《子平真诠》十神组合论命
 */
export function analyzeShiShenCombinations(
  dayGan: string,
  fourPillars: any,
  shishen: Record<string, string>
): ShiShenCombination[] {
  const result: ShiShenCombination[] = [];
  const shishenMap = SHI_SHEN[dayGan];
  if (!shishenMap) return result;

  // 收集所有天干十神
  const allShiShen: { gan: string; position: string; shishen: string }[] = [];
  if (fourPillars.year?.gan) {
    allShiShen.push({ gan: fourPillars.year.gan, position: '年干', shishen: shishenMap[fourPillars.year.gan] || '' });
  }
  if (fourPillars.month?.gan) {
    allShiShen.push({ gan: fourPillars.month.gan, position: '月干', shishen: shishenMap[fourPillars.month.gan] || '' });
  }
  if (fourPillars.hour?.gan) {
    allShiShen.push({ gan: fourPillars.hour.gan, position: '时干', shishen: shishenMap[fourPillars.hour.gan] || '' });
  }

  // 收集所有地支本气十神
  const zhiShiShen: string[] = [];
  [fourPillars.year, fourPillars.month, fourPillars.day, fourPillars.hour].forEach((p: any) => {
    if (p?.zhi) {
      const cangGan = DI_ZHI_CANG_GAN[p.zhi];
      if (cangGan && cangGan[0]) {
        zhiShiShen.push(shishenMap[cangGan[0]] || '');
      }
    }
  });

  const allSS = [...allShiShen.map(s => s.shishen), ...zhiShiShen];

  // 检查组合
  const combinationChecks: { check: (ss: string[]) => boolean; result: ShiShenCombination }[] = [
    // 食神生财
    {
      check: (ss) => ss.includes('食神') && (ss.includes('正财') || ss.includes('偏财')),
      result: {
        combination: '食神生财',
        description: '食神泄日主精华而生财星，为富贵之兆',
        influence: '善于以才华技艺赚钱，财源广进，一生不愁衣食。适合经商、投资、创意行业。',
        classicalRef: '《子平真诠》：食神生财，富贵之基',
      },
    },
    // 伤官见官
    {
      check: (ss) => ss.includes('伤官') && (ss.includes('正官') || ss.includes('七杀')),
      result: {
        combination: '伤官见官',
        description: '伤官与官星并见，为祸百端',
        influence: '易有口舌是非、事业波折、仕途不顺。需注意言行，避免与上级冲突。女命婚姻多波折。',
        classicalRef: '《渊海子平》：伤官见官，为祸百端',
      },
    },
    // 官杀混杂
    {
      check: (ss) => ss.includes('正官') && ss.includes('七杀'),
      result: {
        combination: '官杀混杂',
        description: '正官与七杀并见，阴阳混杂',
        influence: '事业方向不明确，易有感情纠纷（女命尤甚）。需食神制杀或去官留杀，方能清纯。',
        classicalRef: '《子平真诠》：官杀混杂，须去留分明',
      },
    },
    // 财星坏印
    {
      check: (ss) => (ss.includes('正财') || ss.includes('偏财')) && (ss.includes('正印') || ss.includes('偏印')),
      result: {
        combination: '财星坏印',
        description: '财星克制印星，贪财坏印',
        influence: '易因贪图利益而损害名声学业。需注意不要因小失大，保持学习心态。',
        classicalRef: '《渊海子平》：财能坏印，贪财损名',
      },
    },
    // 印星化杀
    {
      check: (ss) => (ss.includes('七杀') && (ss.includes('正印') || ss.includes('偏印'))),
      result: {
        combination: '杀印相生',
        description: '七杀被印星化解，化杀为权',
        influence: '有权威且有智慧，能在压力中成长。适合管理、军警、政治等岗位，大器晚成。',
        classicalRef: '《子平真诠》：杀印相生，化杀为权',
      },
    },
    // 食神制杀
    {
      check: (ss) => ss.includes('七杀') && ss.includes('食神'),
      result: {
        combination: '食神制杀',
        description: '食神克制七杀，将星受制',
        influence: '有胆识有谋略，能将压力转化为动力。适合创业、管理、军警，有领导才能。',
        classicalRef: '《渊海子平》：食神制杀，英雄独压万人',
      },
    },
    // 枭神夺食
    {
      check: (ss) => ss.includes('偏印') && ss.includes('食神'),
      result: {
        combination: '枭神夺食',
        description: '偏印克制食神，福气受损',
        influence: '才华易被压抑，做事多有阻碍。需偏财破印解救。注意人际关系和健康。',
        classicalRef: '《渊海子平》：枭神夺食，衣食不周',
      },
    },
    // 身财两停
    {
      check: (ss) => {
        const biJian = ss.filter(s => s === '比肩' || s === '劫财').length;
        const cai = ss.filter(s => s === '正财' || s === '偏财').length;
        return biJian >= 2 && cai >= 2;
      },
      result: {
        combination: '身财两停',
        description: '日主与财星力量相当',
        influence: '身旺能担财，一生财运亨通。适合自主创业，中年后大发。',
        classicalRef: '《滴天髓》：身财两停，富贵双全',
      },
    },
    // 伤官配印
    {
      check: (ss) => ss.includes('伤官') && (ss.includes('正印') || ss.includes('偏印')),
      result: {
        combination: '伤官配印',
        description: '印星克制伤官，才华有制',
        influence: '才华有约束，能为正用。适合教育、学术、文艺创作，有大成就。',
        classicalRef: '《子平真诠》：伤官配印，才华有制',
      },
    },
    // 财官双美
    {
      check: (ss) => (ss.includes('正财') || ss.includes('偏财')) && (ss.includes('正官')),
      result: {
        combination: '财官双美',
        description: '财星与正官并见',
        influence: '既有财又有地位，富贵双全。男命事业有成婚姻美满，女命旺夫益子。',
        classicalRef: '《渊海子平》：财官双美，富贵两全',
      },
    },
  ];

  for (const { check, result: res } of combinationChecks) {
    if (check(allSS)) {
      result.push(res);
    }
  }

  return result;
}

// ========== 10. 大运详细信息 ==========

/**
 * 计算大运详细信息（含十神、神煞、流年）
 */
export function calculateDayunDetails(
  yearGan: string,
  monthGan: string,
  monthZhi: string,
  gender: string,
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  dayGan: string,
  count: number = 8
): DayunDetail[] {
  const yearGanYang = TIAN_GAN_YIN_YANG[yearGan] === '阳';
  const isMale = gender === 'male';
  const isForward = (yearGanYang && isMale) || (!yearGanYang && !isMale);

  const monthGanIndex = TIAN_GAN.indexOf(monthGan as any);
  const monthZhiIndex = DI_ZHI.indexOf(monthZhi as any);

  // 精确起运岁数
  const startAgeInfo = calculatePreciseStartAge(yearGan, gender, birthYear, birthMonth, birthDay);
  const startAge = startAgeInfo.startAge;

  const shishenMap = SHI_SHEN[dayGan];
  const result: DayunDetail[] = [];

  for (let i = 1; i <= count; i++) {
    let ganIndex: number;
    let zhiIndex: number;

    if (isForward) {
      ganIndex = (monthGanIndex + i) % 10;
      zhiIndex = (monthZhiIndex + i) % 12;
    } else {
      ganIndex = (monthGanIndex - i + 10 * i) % 10;
      zhiIndex = (monthZhiIndex - i + 12 * i) % 12;
    }

    const gan = TIAN_GAN[ganIndex];
    const zhi = DI_ZHI[zhiIndex];
    const startAgeVal = startAge + (i - 1) * 10;
    const endAgeVal = startAgeVal + 9;
    const startYear = birthYear + startAgeVal;
    const endYear = birthYear + endAgeVal;

    // 大运十神
    const ganShiShen = shishenMap?.[gan] || '';
    const zhiCangGan = DI_ZHI_CANG_GAN[zhi] || [];
    const zhiShiShen = zhiCangGan.map(cg => shishenMap?.[cg] || '');

    // 大运神煞
    const shensha = calculateDayunShensha(gan, zhi, dayGan);

    // 该步大运的流年
    const liunian: LiuNian[] = [];
    for (let j = 0; j < 10; j++) {
      const lnYear = startYear + j;
      const lnAge = startAgeVal + j;
      if (lnAge < 0 || lnAge > 100) continue;

      try {
        const solar = Solar.fromYmd(lnYear, 2, 4);
        const lunar = solar.getLunar();
        const yearGanZhi = lunar.getYearInGanZhiExact();
        const lnGan = yearGanZhi.charAt(0);
        const lnZhi = yearGanZhi.charAt(1);
        const lnShiShen = shishenMap?.[lnGan] || '';
        const lnShensha = calculateLiuNianShensha(lnGan, lnZhi, dayGan);

        liunian.push({
          year: lnYear,
          age: lnAge,
          gan: lnGan,
          zhi: lnZhi,
          shishen: lnShiShen,
          shensha: lnShensha,
        });
      } catch {
        // skip
      }
    }

    result.push({
      gan,
      zhi,
      startAge: startAgeVal,
      endAge: endAgeVal,
      startYear,
      endYear,
      shishen: { gan: ganShiShen, zhi: zhiShiShen },
      shensha,
      liunian,
    });
  }

  return result;
}

// ========== 神煞计算 ==========

/**
 * 计算大运神煞
 */
function calculateDayunShensha(dayunGan: string, dayunZhi: string, dayGan: string): string[] {
  const shensha: string[] = [];

  // 天乙贵人
  const tianYi: Record<string, string> = {
    '甲': '丑未', '乙': '子申', '丙': '酉亥', '丁': '酉亥', '戊': '丑未',
    '己': '子申', '庚': '丑未', '辛': '午寅', '壬': '卯巳', '癸': '卯巳'
  };
  const ty = tianYi[dayGan] || '';
  if (ty.includes(dayunZhi)) shensha.push('天乙贵人');

  // 驿马
  const yima: Record<string, string> = {
    '寅': '申', '午': '申', '戌': '申',
    '亥': '巳', '卯': '巳', '未': '巳',
    '申': '寅', '子': '寅', '辰': '寅',
    '巳': '亥', '酉': '亥', '丑': '亥'
  };
  // 驿马看年支或日支，这里用大运支对比
  // 简化：大运支本身是否带马
  if (dayunZhi === '申' || dayunZhi === '寅' || dayunZhi === '巳' || dayunZhi === '亥') {
    shensha.push('驿马');
  }

  // 桃花
  const taohua: Record<string, string[]> = {
    '寅': ['卯'], '午': ['卯'], '戌': ['卯'],
    '亥': ['子'], '卯': ['子'], '未': ['子'],
    '申': ['酉'], '子': ['酉'], '辰': ['酉'],
    '巳': ['午'], '酉': ['午'], '丑': ['午']
  };

  // 华盖
  const huagai: Record<string, string[]> = {
    '寅': ['戌'], '午': ['戌'], '戌': ['戌'],
    '亥': ['丑'], '卯': ['丑'], '未': ['丑'],
    '申': ['辰'], '子': ['辰'], '辰': ['辰'],
    '巳': ['未'], '酉': ['未'], '丑': ['未']
  };

  // 羊刃
  const yangren: Record<string, string> = {
    '甲': '卯', '丙': '午', '戊': '午', '庚': '酉', '壬': '子'
  };
  if (yangren[dayGan] === dayunZhi) shensha.push('羊刃');

  return shensha;
}

/**
 * 计算流年神煞
 */
function calculateLiuNianShensha(lnGan: string, lnZhi: string, dayGan: string): string[] {
  const shensha: string[] = [];

  // 天乙贵人
  const tianYi: Record<string, string> = {
    '甲': '丑未', '乙': '子申', '丙': '酉亥', '丁': '酉亥', '戊': '丑未',
    '己': '子申', '庚': '丑未', '辛': '午寅', '壬': '卯巳', '癸': '卯巳'
  };
  const ty = tianYi[dayGan] || '';
  if (ty.includes(lnZhi)) shensha.push('天乙贵人');

  // 文昌贵人
  const wenchang: Record<string, string> = {
    '甲': '巳', '乙': '午', '丙': '申', '丁': '酉', '戊': '申',
    '己': '酉', '庚': '亥', '辛': '子', '壬': '寅', '癸': '卯'
  };
  if (wenchang[dayGan] === lnZhi) shensha.push('文昌贵人');

  // 羊刃
  const yangren: Record<string, string> = {
    '甲': '卯', '丙': '午', '戊': '午', '庚': '酉', '壬': '子'
  };
  if (yangren[dayGan] === lnZhi) shensha.push('羊刃');

  return shensha;
}
