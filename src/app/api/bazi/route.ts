import { NextRequest, NextResponse } from 'next/server';
import { calculateBazi, analyzeXiYongShen } from '@/lib/algorithms/bazi';
import { generateDetailedAnalysis } from '@/lib/interpretation/bazi-detailed';
import { execute } from '@/lib/d1';
import { checkInterpretLimit, deductLingzhu, INTERPRET_COST_LINGZHU } from '@/lib/rate-limit';
import type { PaipanFormData } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body: PaipanFormData & { mode?: 'chart' | 'full'; useLingzhu?: boolean } = await req.json();
    const { year, month, day, hour, gender, isLunar = false, isLeapMonth = false, hourType } = body;
    const mode = body.mode || 'full'; // 默认 full 向后兼容
    const useLingzhu = body.useLingzhu || false;
    // 高级选项
    const advancedOptions = {
      qiyunDirection: body.qiyunDirection,
      dayunMethod: body.dayunMethod,
      cangganMethod: body.cangganMethod,
      shenshaMethod: body.shenshaMethod,
    };

    if (!year || !month || !day) {
      return NextResponse.json(
        { error: '请提供完整的出生日期' },
        { status: 400 }
      );
    }

    if (hour === undefined) {
      return NextResponse.json(
        { error: '请提供出生时辰或选择未知时辰' },
        { status: 400 }
      );
    }

    // === 排盘（免费不限次） ===
    const result = calculateBazi(
      year, month, day, hour,
      gender || 'male',
      isLunar,
      isLeapMonth,
      hourType,
      advancedOptions
    );

    // 如果只请求排盘数据，直接返回（不收费）
    if (mode === 'chart') {
      // 如果用户已登录，保存记录
      return NextResponse.json({
        result,
        mode: 'chart',
        message: '排盘完成，如需详细解读请升级为完整模式',
      });
    }

    // === 解读（收费：每日限免 + 积分付费） ===
    const { canInterpret, session, needLingzhu, cost, error, remainingFree } = await checkInterpretLimit('bazi', req);

    if (!canInterpret && error) return error;

    if (!canInterpret && needLingzhu) {
      // 需要积分付费
      if (!useLingzhu) {
        // 用户还没确认付费，返回付费提示
        return NextResponse.json({
          error: '今日免费解读次数已用完',
          needLingzhu: true,
          cost: cost || INTERPRET_COST_LINGZHU,
          module: 'bazi',
          message: `本次解读需要消耗 ${cost || INTERPRET_COST_LINGZHU} 积分`,
          result, // 同时返回排盘数据
        }, { status: 402 }); // 402 Payment Required
      }

      // 用户确认付费，扣积分
      if (session) {
        const deductResult = await deductLingzhu(session.sub, cost || INTERPRET_COST_LINGZHU, '八字解读');
        if (!deductResult.success) {
          return NextResponse.json({
            error: `积分不足，需要 ${cost || INTERPRET_COST_LINGZHU} 积分，当前余额 ${deductResult.balance} 积分`,
            needLingzhu: true,
            cost: cost || INTERPRET_COST_LINGZHU,
            balance: deductResult.balance,
            result,
          }, { status: 402 });
        }
      }
    }

    // 分析喜用神
    const xiYongShen = analyzeXiYongShen(result.wuxing, result.fourPillars.day.gan, result.fourPillars.month.zhi);

    // 生成专项详细分析
    const detailedAnalysis = generateDetailedAnalysis(result);
    result.detailedAnalysis = detailedAnalysis;

    // 如果用户已登录，保存记录
    if (session) {
      const fullResult = {
        result,
        xiYongShen,
      };
      const recordId = `bxr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();
      await execute(
        `INSERT INTO BaziRecord (id, userId, gender, birthDate, birthTime, isLunar, yearGan, yearZhi, monthGan, monthZhi, dayGan, dayZhi, hourGan, hourZhi, wuxing, dayun, interpretation, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        recordId,
        session.sub,
        gender || 'male',
        `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        hour !== null ? `${String(hour).padStart(2, '0')}:00` : '未知',
        isLunar ? 1 : 0,
        result.fourPillars.year.gan,
        result.fourPillars.year.zhi,
        result.fourPillars.month.gan,
        result.fourPillars.month.zhi,
        result.fourPillars.day.gan,
        result.fourPillars.day.zhi,
        result.fourPillars.hour.gan || '',
        result.fourPillars.hour.zhi || '',
        JSON.stringify(result.wuxing),
        JSON.stringify(result.dayun),
        JSON.stringify(fullResult),
        now
      );
    }

    return NextResponse.json({
      result,
      xiYongShen,
      mode: 'full',
      remainingFree: remainingFree ?? undefined,
    });
  } catch (error) {
    console.error('八字排盘错误:', error);
    return NextResponse.json(
      { error: '排盘失败，请检查输入信息' },
      { status: 500 }
    );
  }
}
