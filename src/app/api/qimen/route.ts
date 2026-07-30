import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/d1';
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
      const recordId = `qmr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();
      await execute(
        `INSERT INTO QimenRecord (id, userId, queryTime, dunType, juNumber, tianPan, diPan, renPan, shenPan, interpretation, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        recordId,
        session.sub,
        queryTime,
        result.ju?.type || '',
        result.ju?.number || 0,
        JSON.stringify(result.palaces.filter((p: any) => p.star)),
        JSON.stringify(result.palaces.map((p: any) => ({
          position: p.position, trigram: p.trigram,
          heavenlyStem: p.heavenlyStem, earthlyStem: p.earthlyStem, earthBranch: p.earthBranch,
        }))),
        JSON.stringify(result.palaces.map((p: any) => ({
          position: p.position, gate: p.gate,
        }))),
        JSON.stringify(result.palaces.map((p: any) => ({
          position: p.position, deity: p.deity,
        }))),
        JSON.stringify({ result, detailedAnalysis }),
        now
      );
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
