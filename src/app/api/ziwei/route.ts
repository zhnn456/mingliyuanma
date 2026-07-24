import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { astro } from 'iztro';
import { checkUsageLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { year, month, day, hour, gender, isLunar = false } = body;

    if (!year || !month || !day || hour === undefined) {
      return NextResponse.json(
        { error: '请提供完整的出生信息' },
        { status: 400 }
      );
    }

    // 检查使用次数限制
    const { canUse, session, error } = await checkUsageLimit('ziwei');
    if (!canUse && error) return error;

    // iztro 的时辰索引: 0=子时, 1=丑时, 2=寅时...
    const timeIndex = Math.floor(((hour + 1) % 24) / 2);
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const genderStr = gender === 'male' ? '男' : '女';

    let astrolabe;
    if (isLunar) {
      astrolabe = astro.byLunar(dateStr, timeIndex, genderStr, false, true, 'zh-CN');
    } else {
      astrolabe = astro.bySolar(dateStr, timeIndex, genderStr, true, 'zh-CN');
    }

    // 提取宫位数据（完整版）
    const palaces = astrolabe.palaces.map((palace: any) => ({
      name: palace.name,
      index: palace.index,
      heavenlyStem: palace.heavenlyStem || '',
      earthlyBranch: palace.earthlyBranch || '',
      majorStars: (palace.majorStars || []).map((s: any) => ({
        name: s.name,
        type: s.type,
        mutagen: s.mutagen || '',
        brightness: s.brightness || '',
      })),
      minorStars: (palace.minorStars || []).map((s: any) => ({
        name: s.name,
        type: s.type,
        mutagen: s.mutagen || '',
        brightness: s.brightness || '',
      })),
      adjectiveStars: (palace.adjectiveStars || []).map((s: any) => s.name || ''),
      changsheng12: palace.changsheng12 || '',
      boshi12: palace.boshi12 || '',
      decadal: palace.decadal || null,
      isBody: palace.isBodyPalace || false,
    }));

    // 基本信息
    const result = {
      basic: {
        gender: genderStr,
        solarDate: dateStr,
        lunarDate: astrolabe.lunarDate,
        chineseDate: astrolabe.chineseDate,
        zodiac: astrolabe.zodiac,
        sign: astrolabe.sign,
        fiveElementsClass: astrolabe.fiveElementsClass,
        soul: astrolabe.soul,
        body: astrolabe.body,
        earthlyBranchOfBodyPalace: astrolabe.earthlyBranchOfBodyPalace,
        earthlyBranchOfSoulPalace: astrolabe.earthlyBranchOfSoulPalace,
      },
      palaces,
    };

    // 如果用户已登录，保存记录
    if (session) {
      await prisma.ziweiRecord.create({
        data: {
          userId: (session.user as any).id,
          gender,
          birthDate: dateStr,
          birthTime: `${String(hour).padStart(2, '0')}:00`,
          isLunar,
          mingGong: result.basic.fiveElementsClass,
          palaceData: JSON.stringify(result.palaces),
          starData: JSON.stringify(result.palaces.flatMap((p: any) => p.majorStars)),
          sihuaData: JSON.stringify(
            result.palaces.flatMap((p: any) =>
              p.majorStars.filter((s: any) => s.mutagen).map((s: any) => ({
                palace: p.name,
                star: s.name,
                mutagen: s.mutagen,
              }))
            )
          ),
          interpretation: JSON.stringify({ result }),
        },
      });
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('紫微斗数排盘错误:', error);
    return NextResponse.json(
      { error: '排盘失败，请检查输入信息' },
      { status: 500 }
    );
  }
}
