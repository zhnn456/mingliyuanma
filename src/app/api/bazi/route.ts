import { NextRequest, NextResponse } from 'next/server';
import { calculateBazi, analyzeXiYongShen } from '@/lib/algorithms/bazi';
import { prisma } from '@/lib/db/prisma';
import { checkUsageLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { year, month, day, hour, gender, isLunar = false } = body;

    if (!year || !month || !day || hour === undefined) {
      return NextResponse.json(
        { error: '请提供完整的出生信息' },
        { status: 400 }
      );
    }

    // 检查使用次数限制
    const { canUse, session, error } = await checkUsageLimit('bazi');
    if (!canUse && error) return error;

    // 计算八字
    const result = calculateBazi(year, month, day, hour, gender || 'male', isLunar);
    
    // 分析喜用神
    const xiYongShen = analyzeXiYongShen(result.wuxing, result.fourPillars.day.gan);

    // 如果用户已登录，保存记录
    if (session) {
      const fullResult = {
        result,
        xiYongShen,
      };
      await prisma.baziRecord.create({
        data: {
          userId: (session.user as any).id,
          gender: gender || 'male',
          birthDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          birthTime: `${String(hour).padStart(2, '0')}:00`,
          isLunar,
          yearGan: result.fourPillars.year.gan,
          yearZhi: result.fourPillars.year.zhi,
          monthGan: result.fourPillars.month.gan,
          monthZhi: result.fourPillars.month.zhi,
          dayGan: result.fourPillars.day.gan,
          dayZhi: result.fourPillars.day.zhi,
          hourGan: result.fourPillars.hour.gan,
          hourZhi: result.fourPillars.hour.zhi,
          wuxing: JSON.stringify(result.wuxing),
          dayun: JSON.stringify(result.dayun),
          interpretation: JSON.stringify(fullResult),
        },
      });
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
