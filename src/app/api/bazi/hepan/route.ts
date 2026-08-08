import { NextRequest, NextResponse } from 'next/server';
import { calculateBazi, analyzeXiYongShen } from '@/lib/algorithms/bazi';
import { calculateHePan } from '@/lib/hepan';
import type { PaipanFormData } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body: { person1: PaipanFormData; person2: PaipanFormData } = await req.json();
    const { person1, person2 } = body;

    if (!person1 || !person2) {
      return NextResponse.json(
        { error: '请提供双方出生信息' },
        { status: 400 }
      );
    }

    // 校验必填字段
    for (const [label, p] of [['第一方', person1], ['第二方', person2]] as const) {
      if (!p.year || !p.month || !p.day) {
        return NextResponse.json(
          { error: `${label}出生日期不完整` },
          { status: 400 }
        );
      }
      if (p.hour === undefined) {
        return NextResponse.json(
          { error: `${label}出生时辰不完整` },
          { status: 400 }
        );
      }
    }

    // 分别计算双方八字
    const bazi1 = calculateBazi(
      person1.year, person1.month, person1.day, person1.hour,
      person1.gender || 'male',
      person1.isLunar || false,
      person1.isLeapMonth || false,
      person1.hourType
    );

    const bazi2 = calculateBazi(
      person2.year, person2.month, person2.day, person2.hour,
      person2.gender || 'female',
      person2.isLunar || false,
      person2.isLeapMonth || false,
      person2.hourType
    );

    // 分别计算双方喜用神（失败不阻断）
    let xiYongShen1: any = null;
    let xiYongShen2: any = null;
    try {
      xiYongShen1 = analyzeXiYongShen(
        bazi1.wuxing,
        bazi1.fourPillars.day.gan,
        bazi1.fourPillars.month.zhi
      );
    } catch {
      // 喜用神计算失败不阻断合盘
    }
    try {
      xiYongShen2 = analyzeXiYongShen(
        bazi2.wuxing,
        bazi2.fourPillars.day.gan,
        bazi2.fourPillars.month.zhi
      );
    } catch {
      // 喜用神计算失败不阻断合盘
    }

    // 计算合盘结果
    const result = calculateHePan(bazi1, bazi2, xiYongShen1, xiYongShen2);

    return NextResponse.json({
      result,
      bazi1,
      bazi2,
      xiYongShen1,
      xiYongShen2,
    });
  } catch (error) {
    console.error('八字合盘错误:', error);
    return NextResponse.json(
      { error: '合盘计算失败，请检查输入信息' },
      { status: 500 }
    );
  }
}
