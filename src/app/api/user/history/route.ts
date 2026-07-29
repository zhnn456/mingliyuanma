import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/security';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin();
    if (!session?.user?.email) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const type = req.nextUrl.searchParams.get('type');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');

    const records: any[] = [];

    if (!type || type === 'bazi') {
      const baziRecords = await prisma.baziRecord.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      records.push(...baziRecords.map((r) => ({
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
      const ziweiRecords = await prisma.ziweiRecord.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      records.push(...ziweiRecords.map((r) => ({
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
      const qimenRecords = await prisma.qimenRecord.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      records.push(...qimenRecords.map((r) => ({
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
      const meihuaRecords = await prisma.meihuaRecord.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      records.push(...meihuaRecords.map((r) => ({
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

    // 按时间排序
    records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ records: records.slice(0, limit) });
  } catch (error) {
    console.error('Failed to fetch history:', error);
    return NextResponse.json({ error: '获取历史记录失败' }, { status: 500 });
  }
}
