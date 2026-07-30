import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { queryFirst } from '@/lib/d1';

export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAuth(req);
    if (!allowed || !session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const user = await queryFirst('SELECT * FROM User WHERE id = ?', session.sub);

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const type = req.nextUrl.searchParams.get('type');
    if (!type) {
      return NextResponse.json({ error: '请指定类型' }, { status: 400 });
    }

    const userId = (user as any).id;

    if (type === 'bazi') {
      const record = await queryFirst(
        'SELECT * FROM BaziRecord WHERE userId = ? ORDER BY createdAt DESC',
        userId
      );
      if (!record) return NextResponse.json({ record: null });

      if ((record as any).interpretation) {
        const parsed = JSON.parse((record as any).interpretation);
        return NextResponse.json({ record: parsed });
      }

      return NextResponse.json({
        record: {
          result: {
            fourPillars: {
              year: { gan: (record as any).yearGan, zhi: (record as any).yearZhi },
              month: { gan: (record as any).monthGan, zhi: (record as any).monthZhi },
              day: { gan: (record as any).dayGan, zhi: (record as any).dayZhi },
              hour: { gan: (record as any).hourGan, zhi: (record as any).hourZhi },
            },
            wuxing: (record as any).wuxing ? JSON.parse((record as any).wuxing) : {},
            dayun: (record as any).dayun ? JSON.parse((record as any).dayun) : [],
            shishen: {},
            nayin: {},
            canggan: {},
            shengxiao: '',
            gender: (record as any).gender,
          },
          xiYongShen: null,
        },
      });
    }

    if (type === 'ziwei') {
      const record = await queryFirst(
        'SELECT * FROM ZiweiRecord WHERE userId = ? ORDER BY createdAt DESC',
        userId
      );
      if (!record) return NextResponse.json({ record: null });

      if ((record as any).interpretation) {
        const parsed = JSON.parse((record as any).interpretation);
        return NextResponse.json({ record: parsed });
      }

      return NextResponse.json({
        record: {
          result: {
            basic: {
              gender: (record as any).gender,
              solarDate: (record as any).birthDate,
              lunarDate: (record as any).birthDate,
              chineseDate: '',
              zodiac: '',
              sign: '',
              fiveElementsClass: (record as any).mingGong || '',
              soul: '',
              body: '',
              earthlyBranchOfSoulPalace: '',
              earthlyBranchOfBodyPalace: '',
            },
            palaces: (record as any).palaceData ? JSON.parse((record as any).palaceData) : [],
          },
        },
      });
    }

    if (type === 'qimen') {
      const record = await queryFirst(
        'SELECT * FROM QimenRecord WHERE userId = ? ORDER BY createdAt DESC',
        userId
      );
      if (!record) return NextResponse.json({ record: null });

      if ((record as any).interpretation) {
        const parsed = JSON.parse((record as any).interpretation);
        return NextResponse.json({ record: parsed });
      }

      return NextResponse.json({
        record: {
          result: {
            timeInfo: { solarDate: (record as any).queryTime, lunarDate: '', chineseYear: '', chineseMonth: '', chineseDay: '', chineseTime: '', timeName: '', solarTerm: '', xunShou: '', voidness: [] },
            fourPillars: { year: { stem: '', branch: '' }, month: { stem: '', branch: '' }, day: { stem: '', branch: '' }, hour: { stem: '', branch: '' } },
            ju: { type: (record as any).dunType, number: (record as any).juNumber },
            yuan: '',
            zhiFu: { star: '', position: 0 },
            zhiShi: { gate: '', position: 0 },
            palaces: (record as any).tianPan ? JSON.parse((record as any).tianPan) : [],
            specialPatterns: {},
          },
        },
      });
    }

    if (type === 'meihua') {
      const record = await queryFirst(
        'SELECT * FROM MeihuaRecord WHERE userId = ? ORDER BY createdAt DESC',
        userId
      );
      if (!record) return NextResponse.json({ record: null });

      if ((record as any).interpretation) {
        const parsed = JSON.parse((record as any).interpretation);
        return NextResponse.json({ record: parsed });
      }

      return NextResponse.json({
        record: {
          result: {
            method: (record as any).method,
            upperGua: { name: (record as any).upperGua, symbol: '', element: '', nature: '' },
            lowerGua: { name: (record as any).lowerGua, symbol: '', element: '', nature: '' },
            dongYao: (record as any).dongYao,
            benGua: { name: (record as any).benGua || '', meaning: '', lines: [] },
            huGua: { name: (record as any).huGua || '', meaning: '', lines: [] },
            bianGua: { name: (record as any).bianGua || '', meaning: '', lines: [] },
            tiYong: (record as any).tiYong ? JSON.parse((record as any).tiYong) : { ti: '', yong: '', relation: '' },
          },
        },
      });
    }

    return NextResponse.json({ error: '无效类型' }, { status: 400 });
  } catch (error) {
    console.error('获取最新记录失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}