import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/d1';
import { QimenChart } from '3meta';
import { checkInterpretLimit, deductLingzhu, INTERPRET_COST_LINGZHU } from '@/lib/rate-limit';
import { generateQimenDetailedAnalysis } from '@/lib/interpretation/qimen-detailed';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { year, month, day, hour = 12, minute = 0 } = body;
    const mode = body.mode || 'full'; // 默认 full 向后兼容
    const useLingzhu = body.useLingzhu || false;

    if (!year || !month || !day) {
      return NextResponse.json(
        { error: '请提供完整的起局时间' },
        { status: 400 }
      );
    }

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

    // === 如果只请求排盘数据，直接返回（不收费） ===
    if (mode === 'chart') {
      return NextResponse.json({
        result,
        mode: 'chart',
        message: '排盘完成，如需详细解读请升级为完整模式',
      });
    }

    // === 解读（收费：每日限免 + 积分付费） ===
    const { canInterpret, session, needLingzhu, cost, error, remainingFree } = await checkInterpretLimit('qimen', req);

    if (!canInterpret && error) return error;

    if (!canInterpret && needLingzhu) {
      // 需要积分付费
      if (!useLingzhu) {
        // 用户还没确认付费，返回付费提示
        return NextResponse.json({
          error: '今日免费解读次数已用完',
          needLingzhu: true,
          cost: cost || INTERPRET_COST_LINGZHU,
          module: 'qimen',
          message: `本次解读需要消耗 ${cost || INTERPRET_COST_LINGZHU} 积分`,
          result, // 同时返回排盘数据
        }, { status: 402 }); // 402 Payment Required
      }

      // 用户确认付费，扣积分
      if (session) {
        const deductResult = await deductLingzhu(session.sub, cost || INTERPRET_COST_LINGZHU, '奇门解读');
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

    return NextResponse.json({
      result,
      detailedAnalysis,
      mode: 'full',
      remainingFree: remainingFree ?? undefined,
    });
  } catch (error) {
    console.error('奇门遁甲排盘错误:', error);
    return NextResponse.json(
      { error: '排盘失败，请检查输入信息' },
      { status: 500 }
    );
  }
}
