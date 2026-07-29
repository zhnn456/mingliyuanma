import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { queryFirst, queryAll, execute } from '@/lib/d1';

/** 简单的每日运势生成（基于八字天干地支） */
function generateDailyFortune(dayGan: string, dayZhi: string): any {
  const ganFortune: Record<string, any> = {
    甲: { overall: '贵人运强，适合拓展人脉', career: '事业有突破机会', wealth: '正财稳定', health: '注意肝胆', love: '桃花运旺' },
    乙: { overall: '运势平稳，宜守不宜攻', career: '按部就班即可', wealth: '财运平平', health: '注意休息', love: '感情稳定' },
    丙: { overall: '精力充沛，行动力强', career: '适合推进新项目', wealth: '偏财运佳', health: '注意心脏', love: '主动出击' },
    丁: { overall: '灵感丰富，适合创意工作', career: '展现才华的机会', wealth: '财来财去', health: '注意眼睛', love: '浪漫指数高' },
    戊: { overall: '稳重求进，脚踏实地', career: '适合深耕现有领域', wealth: '储蓄运佳', health: '注意脾胃', love: '踏实可靠' },
    己: { overall: '人际关系融洽', career: '合作运强', wealth: '细水长流', health: '注意饮食', love: '和谐美满' },
    庚: { overall: '果断决策，执行力强', career: '竞争中有优势', wealth: '大胆投资', health: '注意肺部', love: '直接表白' },
    辛: { overall: '细节决定成败', career: '适合精细工作', wealth: '小有收获', health: '注意皮肤', love: '细腻体贴' },
    壬: { overall: '水到渠成，顺其自然', career: '等待时机', wealth: '意外之财', health: '注意肾脏', love: '随缘' },
    癸: { overall: '内省反思，积蓄力量', career: '不宜冒进', wealth: '保守理财', health: '注意内分泌', love: '静待花开' },
  };
  return ganFortune[dayGan] || { overall: '平平淡淡才是真', career: '保持现状', wealth: '稳定', health: '良好', love: '随缘' };
}

export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAuth(req);
    if (!allowed || !session) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const type = req.nextUrl.searchParams.get('type') || 'daily';
    const today = new Date().toISOString().split('T')[0];

    // 查最近的一条八字记录来获取日干
    const bazi = await queryFirst(
      'SELECT dayGan, dayZhi FROM BaziRecord WHERE userId = ? ORDER BY createdAt DESC LIMIT 1',
      session.user.id
    ) as any;

    if (!bazi) {
      return NextResponse.json({ error: '请先进行一次八字排盘', needBazi: true }, { status: 400 });
    }

    // 查今天是否已有运势记录
    let fortune = await queryFirst('SELECT * FROM Fortune WHERE userId = ? AND date = ? AND type = ?', session.user.id, today, type) as any;

    if (!fortune) {
      const content = JSON.stringify(generateDailyFortune(bazi.dayGan, bazi.dayZhi));
      const id = `fort_${Date.now()}`;
      await execute('INSERT INTO Fortune (id, userId, date, type, content, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        id, session.user.id, today, type, content, new Date().toISOString());
      fortune = { id, userId: session.user.id, date: today, type, content, createdAt: new Date().toISOString() };
    }

    return NextResponse.json({
      fortune: {
        ...fortune,
        content: typeof fortune.content === 'string' ? JSON.parse(fortune.content) : fortune.content,
      },
      dayGan: bazi.dayGan,
      dayZhi: bazi.dayZhi,
    });
  } catch (error) {
    console.error('获取运势失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
