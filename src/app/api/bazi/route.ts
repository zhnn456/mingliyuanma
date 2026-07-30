import { NextRequest, NextResponse } from 'next/server';
import { calculateBazi, analyzeXiYongShen } from '@/lib/algorithms/bazi';
import { generateDetailedAnalysis } from '@/lib/interpretation/bazi-detailed';
import { execute } from '@/lib/d1';
import { checkUsageLimit } from '@/lib/rate-limit';
import type { PaipanFormData } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body: PaipanFormData = await req.json();
    const { year, month, day, hour, gender, isLunar = false, isLeapMonth = false, hourType } = body;

    if (!year || !month || !day) {
      return NextResponse.json(
        { error: '请提供完整的出生日期' },
        { status: 400 }
      );
    }

    // hour 为 null 时表示未知时辰（三柱论命），允许通过
    if (hour === undefined) {
      return NextResponse.json(
        { error: '请提供出生时辰或选择未知时辰' },
        { status: 400 }
      );
    }

    // 检查使用次数限制
    const { canUse, session, error } = await checkUsageLimit('bazi');
    if (!canUse && error) return error;

    // 计算八字（传入新参数）
    const result = calculateBazi(
      year, month, day, hour,
      gender || 'male',
      isLunar,
      isLeapMonth,
      hourType
    );
    
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
    });
  } catch (error) {
    console.error('八字排盘错误:', error);
    return NextResponse.json(
      { error: '排盘失败，请检查输入信息' },
      { status: 500 }
    );
  }
}
