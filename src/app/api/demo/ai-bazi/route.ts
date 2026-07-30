import { NextRequest, NextResponse } from 'next/server';
import { calculateBazi, analyzeXiYongShen } from '@/lib/algorithms/bazi';
import { generateDetailedAnalysis } from '@/lib/interpretation/bazi-detailed';
import { generateAIInterpretation } from '@/lib/interpretation/bazi-ai';
import type { PaipanFormData } from '@/types';

// ===================================================================
// Demo API：AI 增强解读
// 复用现有排盘引擎 → 规则引擎解读 + AI 技能解读 同时返回
// 不修改原有 /api/bazi 路由，这是独立的新路由
// ===================================================================

export async function POST(req: NextRequest) {
  try {
    const body: PaipanFormData = await req.json();
    const { year, month, day, hour, gender, isLunar = false, isLeapMonth = false, hourType } = body;

    if (!year || !month || !day) {
      return NextResponse.json({ error: '请提供完整的出生日期' }, { status: 400 });
    }
    if (hour === undefined) {
      return NextResponse.json({ error: '请提供出生时辰或选择未知时辰' }, { status: 400 });
    }

    // 1. 排盘（复用现有引擎）
    const chart = calculateBazi(
      year, month, day, hour,
      gender || 'male',
      isLunar, isLeapMonth, hourType
    );

    // 2. 喜用神分析（复用现有引擎）
    const xiYongShen = analyzeXiYongShen(
      chart.wuxing,
      chart.fourPillars.day.gan,
      chart.fourPillars.month.zhi
    );

    // 3. 规则引擎详细分析（现有逻辑）
    const detailedAnalysis = generateDetailedAnalysis(chart);
    chart.detailedAnalysis = detailedAnalysis;

    // 4. AI 技能增强解读（新增）
    const aiResult = await generateAIInterpretation({
      chart,
      xiYongShen,
      formData: { gender, year, month, day, hour, name: body.name },
      style: 'master',
    });

    // 5. 同时返回两种结果，前端做对比
    return NextResponse.json({
      // 原有规则引擎结果
      ruleEngine: {
        result: chart,
        xiYongShen,
      },
      // AI 技能增强结果
      aiEngine: aiResult,
      // 元信息
      meta: {
        dataLevel: hour !== null ? 'A' : 'B',
        aiSource: aiResult.source,
        aiModel: aiResult.model,
      },
    });
  } catch (error) {
    console.error('Demo AI bazi error:', error);
    return NextResponse.json(
      { error: '排盘失败，请检查输入信息' },
      { status: 500 }
    );
  }
}
