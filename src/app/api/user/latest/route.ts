import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/security';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
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
    if (!type) {
      return NextResponse.json({ error: '请指定类型' }, { status: 400 });
    }

    /**
     * 尝试从 interpretation 字段返回完整结果，
     * 如果没有则使用字段拼接（兼容旧数据）
     */

    if (type === 'bazi') {
      const record = await prisma.baziRecord.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });
      if (!record) return NextResponse.json({ record: null });

      // 优先使用完整保存的 interpretation
      if (record.interpretation) {
        const parsed = JSON.parse(record.interpretation);
        return NextResponse.json({ record: parsed });
      }

      // 兼容旧数据
      return NextResponse.json({
        record: {
          result: {
            fourPillars: {
              year: { gan: record.yearGan, zhi: record.yearZhi },
              month: { gan: record.monthGan, zhi: record.monthZhi },
              day: { gan: record.dayGan, zhi: record.dayZhi },
              hour: { gan: record.hourGan, zhi: record.hourZhi },
            },
            wuxing: record.wuxing ? JSON.parse(record.wuxing) : {},
            dayun: record.dayun ? JSON.parse(record.dayun) : [],
            shishen: {},
            nayin: {},
            canggan: {},
            shengxiao: '',
            gender: record.gender,
          },
          xiYongShen: null,
        },
      });
    }

    if (type === 'ziwei') {
      const record = await prisma.ziweiRecord.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });
      if (!record) return NextResponse.json({ record: null });

      // 优先使用完整保存的 interpretation
      if (record.interpretation) {
        const parsed = JSON.parse(record.interpretation);
        return NextResponse.json({ record: parsed });
      }

      // 兼容旧数据
      return NextResponse.json({
        record: {
          result: {
            basic: {
              gender: record.gender,
              solarDate: record.birthDate,
              lunarDate: record.birthDate,
              chineseDate: '',
              zodiac: '',
              sign: '',
              fiveElementsClass: record.mingGong || '',
              soul: '',
              body: '',
              earthlyBranchOfSoulPalace: '',
              earthlyBranchOfBodyPalace: '',
            },
            palaces: record.palaceData ? JSON.parse(record.palaceData) : [],
          },
        },
      });
    }

    if (type === 'qimen') {
      const record = await prisma.qimenRecord.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });
      if (!record) return NextResponse.json({ record: null });

      // 优先使用完整保存的 interpretation
      if (record.interpretation) {
        const parsed = JSON.parse(record.interpretation);
        return NextResponse.json({ record: parsed });
      }

      // 兼容旧数据
      return NextResponse.json({
        record: {
          result: {
            timeInfo: { solarDate: record.queryTime, lunarDate: '', chineseYear: '', chineseMonth: '', chineseDay: '', chineseTime: '', timeName: '', solarTerm: '', xunShou: '', voidness: [] },
            fourPillars: { year: { stem: '', branch: '' }, month: { stem: '', branch: '' }, day: { stem: '', branch: '' }, hour: { stem: '', branch: '' } },
            ju: { type: record.dunType, number: record.juNumber },
            yuan: '',
            zhiFu: { star: '', position: 0 },
            zhiShi: { gate: '', position: 0 },
            palaces: record.tianPan ? JSON.parse(record.tianPan) : [],
            specialPatterns: {},
          },
        },
      });
    }

    if (type === 'meihua') {
      const record = await prisma.meihuaRecord.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });
      if (!record) return NextResponse.json({ record: null });

      // 优先使用完整保存的 interpretation
      if (record.interpretation) {
        const parsed = JSON.parse(record.interpretation);
        return NextResponse.json({ record: parsed });
      }

      // 兼容旧数据
      return NextResponse.json({
        record: {
          result: {
            method: record.method,
            upperGua: { name: record.upperGua, symbol: '', element: '', nature: '' },
            lowerGua: { name: record.lowerGua, symbol: '', element: '', nature: '' },
            dongYao: record.dongYao,
            benGua: { name: record.benGua || '', meaning: '', lines: [] },
            huGua: { name: record.huGua || '', meaning: '', lines: [] },
            bianGua: { name: record.bianGua || '', meaning: '', lines: [] },
            tiYong: record.tiYong ? JSON.parse(record.tiYong) : { ti: '', yong: '', relation: '' },
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
