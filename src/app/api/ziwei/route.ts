/**
 * 紫微斗数排盘 API · V2
 * 
 * 完全兼容 V1 排盘结果，在此基础上增加：
 * 1. 规则引擎分析（多流派）
 * 2. 格局自动检测（30+ 格局）
 * 3. 动态排盘（流年/流月/小限）
 * 4. 古籍引用
 * 5. 飞星分析
 */

import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/d1';
import { astro } from 'iztro';
import { checkInterpretLimit, deductLingzhu, INTERPRET_COST_LINGZHU } from '@/lib/rate-limit';
import { generateZiweiDetailedAnalysis } from '@/lib/interpretation/ziwei-detailed';
import { createZiweiEngine } from '@/lib/ziwei/engine';
import type { SchoolId } from '@/lib/ziwei/interfaces/chart';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      year, month, day, hour, gender, isLunar = false,
      // 新增参数
      school = 'feixing',
      enableEngine = true,
    } = body;
    const mode = body.mode || 'full'; // 默认 full 向后兼容
    const useLingzhu = body.useLingzhu || false;

    if (!year || !month || !day || hour === undefined) {
      return NextResponse.json(
        { error: '请提供完整的出生信息' },
        { status: 400 }
      );
    }

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

    // ========== V1 兼容层：保持原有数据结构 ==========
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

    const basic = {
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
    };

    // === 如果只请求排盘数据，直接返回（不收费） ===
    if (mode === 'chart') {
      return NextResponse.json({
        result: { basic, palaces },
        mode: 'chart',
        message: '排盘完成，如需详细解读请升级为完整模式',
      });
    }

    // === 解读（收费：每日限免 + 灵珠付费） ===
    const { canInterpret, session, needLingzhu, cost, error, remainingFree } = await checkInterpretLimit('ziwei', req);

    if (!canInterpret && error) return error;

    if (!canInterpret && needLingzhu) {
      // 需要灵珠付费
      if (!useLingzhu) {
        // 用户还没确认付费，返回付费提示
        return NextResponse.json({
          error: '今日免费解读次数已用完',
          needLingzhu: true,
          cost: cost || INTERPRET_COST_LINGZHU,
          module: 'ziwei',
          message: `本次解读需要消耗 ${cost || INTERPRET_COST_LINGZHU} 灵珠`,
          result: { basic, palaces }, // 同时返回排盘数据
        }, { status: 402 }); // 402 Payment Required
      }

      // 用户确认付费，扣灵珠
      if (session) {
        const deductResult = await deductLingzhu(session.sub, cost || INTERPRET_COST_LINGZHU, '紫微解读');
        if (!deductResult.success) {
          return NextResponse.json({
            error: `灵珠不足，需要 ${cost || INTERPRET_COST_LINGZHU} 灵珠，当前余额 ${deductResult.balance} 灵珠`,
            needLingzhu: true,
            cost: cost || INTERPRET_COST_LINGZHU,
            balance: deductResult.balance,
            result: { basic, palaces },
          }, { status: 402 });
        }
      }
    }

    // V1 原有的详细分析
    const detailedAnalysis = generateZiweiDetailedAnalysis(palaces, basic);

    // ========== V2 新增层：规则引擎分析 ==========
    let engineAnalysis: any = null;
    let flyingStarAnalysis: any = null;
    let detectedPatterns: string[] = [];
    
    if (enableEngine) {
      try {
        const engine = createZiweiEngine({ defaultSchool: school as SchoolId });
        
        // 构建标准命盘结构
        const chart = {
          basic: {
            gender: genderStr as any,
            solarDate: dateStr,
            lunarDate: astrolabe.lunarDate,
            chineseDate: astrolabe.chineseDate,
            zodiac: astrolabe.zodiac,
            sign: astrolabe.sign,
            fiveElementsClass: astrolabe.fiveElementsClass,
            soul: astrolabe.soul,
            body: astrolabe.body,
            earthlyBranchOfSoulPalace: astrolabe.earthlyBranchOfSoulPalace,
            earthlyBranchOfBodyPalace: astrolabe.earthlyBranchOfBodyPalace,
          },
          palaces: palaces.map((p, i) => ({
            index: p.index,
            name: p.name,
            earthlyBranch: p.earthlyBranch,
            heavenlyStem: p.heavenlyStem,
            majorStars: p.majorStars.map(s => ({
              name: s.name,
              type: s.type === 'major' ? 'major' as const : ('minor' as const),
              mutagen: s.mutagen || undefined,
              brightness: s.brightness || undefined,
            })),
            minorStars: p.minorStars.map(s => ({
              name: s.name,
              type: 'adjective' as const,
              mutagen: s.mutagen || undefined,
              brightness: s.brightness || undefined,
            })),
            adjectiveStars: p.adjectiveStars,
            decadal: p.decadal,
            isBodyPalace: p.isBody,
            isSoulPalace: p.name === '命宫',
          })),
          birthSihua: {
            stem: (astrolabe.chineseDate?.split('年')[0]?.slice(-1) || '') as any,
            lu: { star: '', palace: '' },
            quan: { star: '', palace: '' },
            ke: { star: '', palace: '' },
            ji: { star: '', palace: '' },
          },
          soulMaster: astrolabe.soul,
          bodyMaster: astrolabe.body,
          version: '2.0.0',
        };
        
        // 执行规则引擎分析
        engineAnalysis = engine.analyze(chart, { school: school as SchoolId });
        
        // 飞星分析
        flyingStarAnalysis = engine.getFlyingStarAnalysis(chart);
        
        // 提取格局名称列表
        if (engineAnalysis?.detectedPatterns) {
          detectedPatterns = engineAnalysis.detectedPatterns.map(p => p.name);
        }
      } catch (e) {
        console.error('规则引擎分析失败:', e);
        // 失败不影响主流程
      }
    }

    // ========== 构建最终响应 ==========
    const result = {
      // V1 原有数据（完全兼容）
      basic,
      palaces,
      detailedAnalysis,
      
      // V2 新增数据
      v2: {
        school,
        engineAnalysis,
        flyingStarAnalysis,
        detectedPatterns,
        features: {
          flowAnalysis: true,      // 支持流年流月分析
          patternDetection: true,  // 支持30+格局检测
          schoolSwitch: true,      // 支持流派切换
          classicReference: true,  // 支持古籍引用
        },
      },
    };

    // 如果用户已登录，保存记录
    if (session) {
      const recordId = `zwr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();
      await execute(
        `INSERT INTO ZiweiRecord (id, userId, gender, birthDate, birthTime, isLunar, mingGong, palaceData, starData, sihuaData, interpretation, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        recordId,
        session.sub,
        gender,
        dateStr,
        `${String(hour).padStart(2, '0')}:00`,
        isLunar ? 1 : 0,
        result.basic.fiveElementsClass,
        JSON.stringify(result.palaces),
        JSON.stringify(result.palaces.flatMap((p: any) => p.majorStars)),
        JSON.stringify(
          result.palaces.flatMap((p: any) =>
            p.majorStars.filter((s: any) => s.mutagen).map((s: any) => ({
              palace: p.name,
              star: s.name,
              mutagen: s.mutagen,
            }))
          )
        ),
        JSON.stringify({ detailedAnalysis, v2: result.v2 }),
        now
      );
    }

    return NextResponse.json({
      result,
      mode: 'full',
      remainingFree: remainingFree ?? undefined,
    });
  } catch (error) {
    console.error('紫微斗数排盘错误:', error);
    return NextResponse.json(
      { error: '排盘失败，请检查输入信息' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ziwei
 * 获取规则配置信息
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'patterns';
    
    if (type === 'patterns') {
      const { ALL_PATTERN_RULES } = await import('@/lib/ziwei/knowledge/patterns/basic');
      const patterns = ALL_PATTERN_RULES.map(r => ({
        id: r.id,
        name: r.name,
        category: r.category,
        description: r.description,
        priority: r.priority,
        classicSource: r.classicSource,
      }));
      
      return NextResponse.json({
        patterns,
        total: patterns.length,
        categories: [...new Set(patterns.map(p => p.category))],
      });
    }
    
    if (type === 'schools') {
      const { SCHOOLS } = await import('@/lib/ziwei/knowledge/schools');
      const schoolsList = Object.values(SCHOOLS).map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        keyMethods: s.keyMethods,
      }));
      
      return NextResponse.json({
        schools: schoolsList,
        total: schoolsList.length,
      });
    }
    
    if (type === 'sihua') {
      const { SIHUA_STANDARD } = await import('@/lib/ziwei/knowledge/sihua/tables');
      return NextResponse.json({
        sihua: Object.entries(SIHUA_STANDARD).map(([stem, v]) => ({
          stem,
          ...v,
        })),
      });
    }
    
    return NextResponse.json({
      error: '无效的 type 参数',
      validTypes: ['patterns', 'schools', 'sihua'],
    });
  } catch (error) {
    console.error('获取规则错误:', error);
    return NextResponse.json(
      { error: '获取规则失败' },
      { status: 500 }
    );
  }
}