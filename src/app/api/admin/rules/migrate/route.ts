/**
 * 规则迁移 API
 *
 * 将现有 .ts 文件中硬编码的常量规则批量导入 DivinationRule 数据库表
 * 后续新增古籍资料可通过后台管理界面直接操作，无需改代码
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { upsertRule, batchUpsertRules, getRuleStats, type RuleData } from '@/lib/rules/engine';

// 导入现有常量规则
import { DAY_GAN_PERSONALITY } from '@/lib/interpretation/bazi';
import {
  MAIN_STAR_INTERPRETATION,
  PALACE_MEANING,
  SIHUA_STAR,
  LIUJI_STAR,
  LIUSHA_STAR,
  STAR_PATTERNS,
} from '@/lib/interpretation/ziwei';
import {
  BAMEN_INTERPRETATION,
  JIUXING_INTERPRETATION,
  BASHEN_INTERPRETATION,
  SPECIAL_PATTERNS,
  JIUGONG_BAGUA,
} from '@/lib/interpretation/qimen';
import { TIYONG_INTERPRETATION } from '@/lib/interpretation/meihua';
import { HEXAGRAM_DATA } from '@/lib/interpretation/hexagramData';
import { QUESTION_TYPES as QIMEN_QUESTION_TYPES, PATTERN_DETAILS as QIMEN_PATTERNS } from '@/lib/interpretation/qimen-detailed';
import { MEIHUA_QUESTION_TYPES } from '@/lib/interpretation/meihua-detailed';

// 安全检查：仅管理员可执行迁移
async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') {
    return null;
  }
  return session;
}

export async function POST(request: Request) {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const rules: RuleData[] = [];
  let migrated = 0;
  const log: string[] = [];

  try {
    // ========== 八字规则迁移 ==========

    // 1. 十天干日主性格
    for (const [gan, data] of Object.entries(DAY_GAN_PERSONALITY)) {
      rules.push({
        category: 'bazi',
        ruleType: 'day_gan_personality',
        ruleKey: gan,
        content: data,
        classicSource: '《渊海子平》',
        classicQuote: undefined,
      });
    }
    log.push(`八字-日主性格: ${Object.keys(DAY_GAN_PERSONALITY).length} 条`);

    // ========== 紫微斗数规则迁移 ==========

    // 2. 十四主星
    for (const [star, data] of Object.entries(MAIN_STAR_INTERPRETATION)) {
      rules.push({
        category: 'ziwei',
        ruleType: 'main_star',
        ruleKey: star,
        content: {
          nature: (data as any).nature,
          personality: (data as any).personality,
          career: (data as any).career,
          wealth: (data as any).wealth,
          emotion: (data as any).emotion,
          health: (data as any).health,
        },
        classicSource: '《紫微斗数全书》',
        classicQuote: (data as any).classicQuote,
      });
    }
    log.push(`紫微-十四主星: ${Object.keys(MAIN_STAR_INTERPRETATION).length} 条`);

    // 3. 十二宫含义
    for (const [palace, meaning] of Object.entries(PALACE_MEANING)) {
      rules.push({
        category: 'ziwei',
        ruleType: 'palace_meaning',
        ruleKey: palace,
        content: { meaning },
        classicSource: '《紫微斗数全书》',
      });
    }
    log.push(`紫微-十二宫: ${Object.keys(PALACE_MEANING).length} 条`);

    // 4. 四化星
    for (const [sihua, data] of Object.entries(SIHUA_STAR)) {
      rules.push({
        category: 'ziwei',
        ruleType: 'sihua_star',
        ruleKey: sihua,
        content: data as any,
        classicSource: '《太微赋》',
      });
    }
    log.push(`紫微-四化星: ${Object.keys(SIHUA_STAR).length} 条`);

    // 5. 六吉星
    for (const [star, data] of Object.entries(LIUJI_STAR)) {
      rules.push({
        category: 'ziwei',
        ruleType: 'liuji_star',
        ruleKey: star,
        content: data as any,
      });
    }
    log.push(`紫微-六吉星: ${Object.keys(LIUJI_STAR).length} 条`);

    // 6. 六煞星
    for (const [star, data] of Object.entries(LIUSHA_STAR)) {
      rules.push({
        category: 'ziwei',
        ruleType: 'liusha_star',
        ruleKey: star,
        content: data as any,
      });
    }
    log.push(`紫微-六煞星: ${Object.keys(LIUSHA_STAR).length} 条`);

    // 7. 星曜格局
    for (const [pattern, data] of Object.entries(STAR_PATTERNS)) {
      rules.push({
        category: 'ziwei',
        ruleType: 'star_pattern',
        ruleKey: pattern,
        content: data as any,
      });
    }
    log.push(`紫微-星曜格局: ${Object.keys(STAR_PATTERNS).length} 条`);

    // 8. 四化入十二宫
    if (typeof SIHUA_STAR !== 'undefined') {
      // 从 ziwei-detailed.ts 导入的 SIHUA_IN_PALACE
      // 由于该常量未 export，这里跳过，后续可通过后台手动添加
    }

    // ========== 奇门遁甲规则迁移 ==========

    // 9. 八门
    for (const [men, data] of Object.entries(BAMEN_INTERPRETATION)) {
      rules.push({
        category: 'qimen',
        ruleType: 'bamen',
        ruleKey: men,
        content: data as any,
      });
    }
    log.push(`奇门-八门: ${Object.keys(BAMEN_INTERPRETATION).length} 条`);

    // 10. 九星
    for (const [star, data] of Object.entries(JIUXING_INTERPRETATION)) {
      rules.push({
        category: 'qimen',
        ruleType: 'jiuxing',
        ruleKey: star,
        content: data as any,
      });
    }
    log.push(`奇门-九星: ${Object.keys(JIUXING_INTERPRETATION).length} 条`);

    // 11. 八神
    for (const [shen, data] of Object.entries(BASHEN_INTERPRETATION)) {
      rules.push({
        category: 'qimen',
        ruleType: 'bashen',
        ruleKey: shen,
        content: data as any,
      });
    }
    log.push(`奇门-八神: ${Object.keys(BASHEN_INTERPRETATION).length} 条`);

    // 12. 九宫八卦
    for (const [gong, data] of Object.entries(JIUGONG_BAGUA)) {
      rules.push({
        category: 'qimen',
        ruleType: 'jiugong_bagua',
        ruleKey: gong,
        content: data as any,
      });
    }
    log.push(`奇门-九宫八卦: ${Object.keys(JIUGONG_BAGUA).length} 条`);

    // 13. 特殊格局
    for (const [pattern, data] of Object.entries(SPECIAL_PATTERNS)) {
      rules.push({
        category: 'qimen',
        ruleType: 'special_pattern',
        ruleKey: pattern,
        content: data as any,
      });
    }
    log.push(`奇门-特殊格局: ${Object.keys(SPECIAL_PATTERNS).length} 条`);

    // 14. 奇门问题类型
    for (const qt of QIMEN_QUESTION_TYPES) {
      rules.push({
        category: 'qimen',
        ruleType: 'question_type',
        ruleKey: qt.key,
        content: { label: qt.label, icon: qt.icon, yongshen: qt.yongshen, description: qt.description },
      });
    }
    log.push(`奇门-问题类型: ${QIMEN_QUESTION_TYPES.length} 条`);

    // 15. 奇门格局深度
    for (const [key, pattern] of Object.entries(QIMEN_PATTERNS)) {
      rules.push({
        category: 'qimen',
        ruleType: 'pattern_detail',
        ruleKey: pattern.name,
        content: {
          level: pattern.level,
          condition: pattern.condition,
          influence: pattern.influence,
          advice: pattern.advice,
        },
        classicSource: pattern.classicSource,
      });
    }
    log.push(`奇门-格局深度: ${Object.keys(QIMEN_PATTERNS).length} 条`);

    // ========== 梅花易数规则迁移 ==========

    // 16. 体用关系
    for (const [relation, data] of Object.entries(TIYONG_INTERPRETATION)) {
      rules.push({
        category: 'meihua',
        ruleType: 'tiyong_relation',
        ruleKey: relation,
        content: data as any,
        classicSource: '邵雍《梅花易数》',
      });
    }
    log.push(`梅花-体用关系: ${Object.keys(TIYONG_INTERPRETATION).length} 条`);

    // 17. 六十四卦
    for (const [num, data] of Object.entries(HEXAGRAM_DATA)) {
      rules.push({
        category: 'meihua',
        ruleType: 'hexagram',
        ruleKey: num,
        content: data as any,
        classicSource: '《周易》',
      });
    }
    log.push(`梅花-六十四卦: ${Object.keys(HEXAGRAM_DATA).length} 条`);

    // 18. 梅花问题类型
    for (const qt of MEIHUA_QUESTION_TYPES) {
      rules.push({
        category: 'meihua',
        ruleType: 'question_type',
        ruleKey: qt.key,
        content: { label: qt.label, icon: qt.icon, description: qt.description, focusYong: qt.focusYong },
      });
    }
    log.push(`梅花-问题类型: ${MEIHUA_QUESTION_TYPES.length} 条`);

    // ========== 执行批量写入 ==========

    migrated = await batchUpsertRules(rules);

    const stats = await getRuleStats();

    return NextResponse.json({
      success: true,
      message: `迁移完成，共导入 ${migrated} 条规则`,
      details: log,
      stats,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        migratedBefore: migrated,
        log,
      },
      { status: 500 },
    );
  }
}

/** GET 查看迁移状态（规则统计） */
export async function GET() {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const stats = await getRuleStats();
  return NextResponse.json({ stats });
}
