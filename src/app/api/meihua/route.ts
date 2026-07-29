import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/d1';
import { calculateByNumbers, calculateByTime, calculateByText, calculateByCoin, calculateByRandom, calculateByDate } from '@/lib/algorithms/meihua';
import { generateMeihuaDetailedAnalysis } from '@/lib/interpretation/meihua-detailed';
import { checkUsageLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { method, num1, num2, num3, year, month, day, hour, text, flips, date, questionType } = body;

    // 检查使用次数限制
    const { canUse, session, error } = await checkUsageLimit('meihua');
    if (!canUse && error) return error;

    let result;

    switch (method) {
      case 'number':
        if (!num1 || !num2 || !num3) {
          return NextResponse.json({ error: '请提供三个数字' }, { status: 400 });
        }
        result = calculateByNumbers(parseInt(num1), parseInt(num2), parseInt(num3));
        break;

      case 'time':
        const now = new Date();
        result = calculateByTime(
          year || now.getFullYear(),
          month || now.getMonth() + 1,
          day || now.getDate(),
          hour !== undefined ? hour : now.getHours()
        );
        break;

      case 'text':
        if (!text || text.trim().length < 2) {
          return NextResponse.json({ error: '请输入至少两个汉字' }, { status: 400 });
        }
        result = calculateByText(text.trim());
        break;

      case 'coin':
        if (!flips || !Array.isArray(flips) || flips.length !== 6) {
          return NextResponse.json({ error: '请提供6次投掷结果' }, { status: 400 });
        }
        result = calculateByCoin(flips.map(Number));
        break;

      case 'random':
        result = calculateByRandom();
        break;

      case 'date':
        if (!date) {
          return NextResponse.json({ error: '请提供日期' }, { status: 400 });
        }
        result = calculateByDate(date);
        break;

      default:
        return NextResponse.json({ error: '无效的起卦方式' }, { status: 400 });
    }

    // 如果用户已登录，保存记录
    if (session) {
      const recordId = `mhr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();
      await execute(
        `INSERT INTO MeihuaRecord (id, userId, method, input, upperGua, lowerGua, dongYao, benGua, huGua, bianGua, tiYong, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        recordId,
        (session.user as any).id,
        method || 'random',
        JSON.stringify(body),
        result.upperGua.name,
        result.lowerGua.name,
        result.dongYao,
        result.benGua.name,
        result.huGua.name,
        result.bianGua.name,
        JSON.stringify(result.tiYong),
        now
      );
    }

    // 生成深度解读
    const detailedAnalysis = generateMeihuaDetailedAnalysis(
      result,
      questionType || 'general',
      month || (new Date().getMonth() + 1)
    );

    return NextResponse.json({ result, detailedAnalysis });
  } catch (error) {
    console.error('梅花易数起卦错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '起卦失败' },
      { status: 500 }
    );
  }
}
