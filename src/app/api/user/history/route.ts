import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { queryFirst, queryAll } from '@/lib/d1';

export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAuth(req);
    if (!allowed || !session?.sub) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const user = await queryFirst('SELECT * FROM User WHERE id = ?', session.sub);

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const type = req.nextUrl.searchParams.get('type');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');

    const records: any[] = [];
    const userId = (user as any).id;

    if (!type || type === 'bazi') {
      const baziRecords = await queryAll(
        'SELECT * FROM BaziRecord WHERE userId = ? ORDER BY createdAt DESC LIMIT ?',
        userId, limit
      );
      records.push(...(baziRecords as any[]).map((r: any) => ({
        id: r.id,
        type: 'bazi' as const,
        createdAt: r.createdAt,
        input: { birthDate: r.birthDate, birthTime: r.birthTime, gender: r.gender, isLunar: r.isLunar },
        result: {
          fourPillars: { year: { gan: r.yearGan, zhi: r.yearZhi }, month: { gan: r.monthGan, zhi: r.monthZhi }, day: { gan: r.dayGan, zhi: r.dayZhi }, hour: { gan: r.hourGan, zhi: r.hourZhi } },
          wuxing: r.wuxing ? JSON.parse(r.wuxing) : {},
          dayun: r.dayun ? JSON.parse(r.dayun) : [],
        },
      })));
    }

    if (!type || type === 'ziwei') {
      const ziweiRecords = await queryAll(
        'SELECT * FROM ZiweiRecord WHERE userId = ? ORDER BY createdAt DESC LIMIT ?',
        userId, limit
      );
      records.push(...(ziweiRecords as any[]).map((r: any) => ({
        id: r.id,
        type: 'ziwei' as const,
        createdAt: r.createdAt,
        input: { birthDate: r.birthDate, birthTime: r.birthTime, gender: r.gender },
        result: {
          basic: { gender: r.gender, lunarDate: r.birthDate, chineseDate: '', zodiac: '', fiveElementsClass: r.mingGong || '', soul: '', body: '', earthlyBranchOfSoulPalace: '', earthlyBranchOfBodyPalace: '' },
          palaces: r.palaceData ? JSON.parse(r.palaceData) : [],
        },
      })));
    }

    if (!type || type === 'qimen') {
      const qimenRecords = await queryAll(
        'SELECT * FROM QimenRecord WHERE userId = ? ORDER BY createdAt DESC LIMIT ?',
        userId, limit
      );
      records.push(...(qimenRecords as any[]).map((r: any) => ({
        id: r.id,
        type: 'qimen' as const,
        createdAt: r.createdAt,
        input: { queryTime: r.queryTime, dunType: r.dunType, juNumber: r.juNumber },
        result: {
          ju: r.juNumber,
          palaces: r.tianPan ? JSON.parse(r.tianPan) : [],
        },
      })));
    }

    if (!type || type === 'meihua') {
      const meihuaRecords = await queryAll(
        'SELECT * FROM MeihuaRecord WHERE userId = ? ORDER BY createdAt DESC LIMIT ?',
        userId, limit
      );
      records.push(...(meihuaRecords as any[]).map((r: any) => ({
        id: r.id,
        type: 'meihua' as const,
        createdAt: r.createdAt,
        input: { method: r.method, input: r.input },
        result: {
          upperGua: { name: r.upperGua },
          lowerGua: { name: r.lowerGua },
          dongYao: r.dongYao,
          benGua: { name: r.benGua || '' },
          huGua: { name: r.huGua || '' },
          bianGua: { name: r.bianGua || '' },
          tiYong: r.tiYong ? JSON.parse(r.tiYong) : {},
        },
      })));
    }

    records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ records: records.slice(0, limit) });
  } catch (error) {
    console.error('Failed to fetch history:', error);
    return NextResponse.json({ error: '获取历史记录失败' }, { status: 500 });
  }
}