import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { QimenChart } from '3meta';
import { checkUsageLimit } from '@/lib/rate-limit';
import { generateQimenDetailedAnalysis } from '@/lib/interpretation/qimen-detailed';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { year, month, day, hour = 12, minute = 0 } = body;

    if (!year || !month || !day) {
      return NextResponse.json(
        { error: '请提供完整的起局时间' },
        { status: 400 }
      );
    }

    // 检查使用次数限制
    const { canUse, session, error } = await checkUsageLimit('qimen');
    if (!canUse && error) return error;

    // 使用 3meta 排盘
    const chart = QimenChart.fromSolar(
      parseInt(year),
      parseInt(month),
      parseInt(day),
      parseInt(hour),
      parseInt(minute || 0),
      0
    );

    // 整理返回数据
    const result = {
      timeInfo: chart.timeInfo,
      fourPillars: chart.fourPillars,
      ju: chart.ju,
      yuan: chart.yuan,
      season: chart.season,
      monthElement: chart.monthElement,
      zhiFu: chart.zhiFu,
      zhiShi: chart.zhiShi,
      postHorse: chart.postHorse,
      palaces: chart.palaces.map((p: any) => ({
        position: p.position,
        trigram: p.trigram,
        gate: p.gate,
        star: p.star,
        deity: p.deity,
        heavenlyStem: p.heavenlyStem,
        earthlyStem: p.earthlyStem,
        earthBranch: p.earthBranch,
        fiveElements: p.fiveElements,
        voidness: p.voidness,
        innerOuter: p.innerOuter,
        isZhiFu: p.isZhiFu,
        isZhiShi: p.isZhiShi,
        horse: p.horse,
        auspiciousPatterns: p.auspiciousPatterns || [],
        inauspiciousPatterns: p.inauspiciousPatterns || [],
      })),
      specialPatterns: chart.specialPatterns,
    };

    // 生成深度解读
    const detailedAnalysis = generateQimenDetailedAnalysis(result, 'general');

    // 如果用户已登录，保存记录
    if (session) {
      const queryTime = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      await prisma.qimenRecord.create({
        data: {
          userId: (session.user as any).id,
          queryTime,
          dunType: result.ju?.type || '',
          juNumber: result.ju?.number || 0,
          tianPan: JSON.stringify(result.palaces),
          diPan: JSON.stringify(result.palaces),
          renPan: JSON.stringify(result.palaces.map((p: any) => p.gate)),
          shenPan: JSON.stringify(result.palaces.map((p: any) => p.deity)),
          interpretation: JSON.stringify({ result, detailedAnalysis }),
        },
      });
    }

    return NextResponse.json({ result, detailedAnalysis });
  } catch (error) {
    console.error('奇门遁甲排盘错误:', error);
    return NextResponse.json(
      { error: '排盘失败，请检查输入信息' },
      { status: 500 }
    );
  }
}
