import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/d1';
import { calculateByNumbers, calculateByTime, calculateByText, calculateByCoin, calculateByRandom, calculateByDate, calculateByReport, calculateByDirection, calculateByColor, calculateBySound, calculateByName } from '@/lib/algorithms/meihua';
import { generateMeihuaDetailedAnalysis } from '@/lib/interpretation/meihua-detailed';
import { checkInterpretLimit, deductLingzhu, INTERPRET_COST_LINGZHU } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { method, num1, num2, num3, year, month, day, hour, text, flips, date, questionType,
      nums, upperDir, lowerDir, dongYao, upperColor, lowerColor, soundCount, duration, surname, givenName } = body;
    const mode = body.mode || 'full'; // 默认 full 向后兼容
    const useLingzhu = body.useLingzhu || false;

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

      case 'report':
        if (!nums || !Array.isArray(nums) || nums.length === 0) {
          return NextResponse.json({ error: '请报数字' }, { status: 400 });
        }
        result = calculateByReport(nums.map(Number));
        break;

      case 'direction':
        if (!upperDir || !lowerDir) {
          return NextResponse.json({ error: '请选择方位' }, { status: 400 });
        }
        result = calculateByDirection(upperDir, lowerDir, dongYao ? parseInt(dongYao) : undefined);
        break;

      case 'color':
        if (!upperColor || !lowerColor) {
          return NextResponse.json({ error: '请选择颜色' }, { status: 400 });
        }
        result = calculateByColor(upperColor, lowerColor);
        break;

      case 'sound':
        if (!soundCount || !duration) {
          return NextResponse.json({ error: '请提供声音次数和持续时间' }, { status: 400 });
        }
        result = calculateBySound(parseInt(soundCount), parseInt(duration));
        break;

      case 'name':
        if (!surname || !givenName) {
          return NextResponse.json({ error: '请输入姓名' }, { status: 400 });
        }
        result = calculateByName(surname, givenName);
        break;

      default:
        return NextResponse.json({ error: '无效的起卦方式' }, { status: 400 });
    }

    // === 如果只请求排盘数据，直接返回（不收费） ===
    if (mode === 'chart') {
      return NextResponse.json({
        result,
        mode: 'chart',
        message: '排盘完成，如需详细解读请升级为完整模式',
      });
    }

    // === 解读（收费：每日限免 + 积分付费） ===
    const { canInterpret, session, needLingzhu, cost, error, remainingFree } = await checkInterpretLimit('meihua', req);

    if (!canInterpret && error) return error;

    if (!canInterpret && needLingzhu) {
      // 需要积分付费
      if (!useLingzhu) {
        // 用户还没确认付费，返回付费提示
        return NextResponse.json({
          error: '今日免费解读次数已用完',
          needLingzhu: true,
          cost: cost || INTERPRET_COST_LINGZHU,
          module: 'meihua',
          message: `本次解读需要消耗 ${cost || INTERPRET_COST_LINGZHU} 积分`,
          result, // 同时返回排盘数据
        }, { status: 402 }); // 402 Payment Required
      }

      // 用户确认付费，扣积分
      if (session) {
        const deductResult = await deductLingzhu(session.sub, cost || INTERPRET_COST_LINGZHU, '梅花解读');
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

    // 如果用户已登录，保存记录
    if (session) {
      const recordId = `mhr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();
      await execute(
        `INSERT INTO MeihuaRecord (id, userId, method, input, upperGua, lowerGua, dongYao, benGua, huGua, bianGua, tiYong, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        recordId,
        session.sub,
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

    return NextResponse.json({
      result,
      detailedAnalysis,
      mode: 'full',
      remainingFree: remainingFree ?? undefined,
    });
  } catch (error) {
    console.error('梅花易数起卦错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '起卦失败' },
      { status: 500 }
    );
  }
}
