/**
 * 管理后台 · 紫微斗数规则管理 API
 * 
 * 功能：
 * 1. 获取/添加/更新/删除规则
 * 2. 规则版本管理
 * 3. 规则测试验证
 */

import { NextRequest, NextResponse } from 'next/server';
import { astro } from 'iztro';
import { requireAdmin } from '@/lib/auth-server';
import { getRuleStore } from '@/lib/ziwei/storage/rule-store';
import { getZiweiEngine } from '@/lib/ziwei/engine';
import { auditLog } from '@/lib/audit';

/**
 * GET /api/admin/ziwei/rules
 * 获取所有规则列表
 */
export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'list';
    const category = searchParams.get('category');
    
    const store = getRuleStore();
    
    if (action === 'list') {
      const rules = category 
        ? await store.getRulesByCategory(category as any)
        : await store.getAllRules();
      
      return NextResponse.json({
        rules: rules.map(r => ({
          id: r.id,
          name: r.name,
          version: r.version,
          category: r.category,
          priority: r.priority,
          enabled: r.enabled,
          description: r.description,
        })),
        total: rules.length,
      });
    }
    
    if (action === 'detail') {
      const id = searchParams.get('id');
      if (!id) return NextResponse.json({ error: '缺少规则ID' }, { status: 400 });
      
      const rule = await store.getRuleById(id);
      if (!rule) return NextResponse.json({ error: '规则不存在' }, { status: 404 });
      
      return NextResponse.json({ rule });
    }
    
    if (action === 'history') {
      const id = searchParams.get('id');
      if (!id) return NextResponse.json({ error: '缺少规则ID' }, { status: 400 });
      
      const history = await store.getRuleHistory(id);
      return NextResponse.json({ history });
    }
    
    if (action === 'patterns') {
      // 格局列表
      const { ALL_PATTERN_RULES } = await import('@/lib/ziwei/knowledge/patterns/basic');
      const patterns = ALL_PATTERN_RULES.map(r => ({
        id: r.id,
        name: r.name,
        category: r.category,
        description: r.description,
        priority: r.priority,
        successCondition: r.successCondition,
        failureCondition: r.failureCondition,
        classicSource: r.classicSource,
      }));
      
      return NextResponse.json({
        patterns,
        categories: [...new Set(patterns.map(p => p.category))],
        total: patterns.length,
      });
    }
    
    return NextResponse.json({ error: '无效的 action 参数' });
  } catch (error) {
    console.error('获取紫微斗数规则错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

/**
 * POST /api/admin/ziwei/rules
 * 创建规则或触发操作
 */
export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const body = await req.json();
    const { action } = body;
    
    const store = getRuleStore();
    
    if (action === 'create') {
      // 创建新规则
      const { rule } = body;
      if (!rule?.id || !rule?.name) {
        return NextResponse.json({ error: '规则ID和名称必填' }, { status: 400 });
      }
      
      await store.saveRule({
        id: rule.id,
        name: rule.name,
        version: rule.version || 'v1.0.0',
        category: rule.category || 'custom',
        priority: rule.priority || 50,
        enabled: rule.enabled ?? true,
        description: rule.description || '',
        match: () => false,
        getWeight: () => rule.priority || 50,
        generateText: () => rule.description || '',
        getRelatedRuleIds: () => [],
        getClassicalReferences: () => [],
      });

      await auditLog({
        userId: session?.sub,
        action: 'admin_update_config',
        details: { target: 'ziwei_rule', name: rule.name },
        status: 'success',
      });

      return NextResponse.json({ success: true, id: rule.id });
    }

    if (action === 'update') {
      // 更新规则
      const { id, updates } = body;
      if (!id) return NextResponse.json({ error: '缺少规则ID' }, { status: 400 });

      await store.updateRule(id, updates);
      await auditLog({
        userId: session?.sub,
        action: 'admin_update_config',
        details: { target: 'ziwei_rule', id },
        status: 'success',
      });
      return NextResponse.json({ success: true, id });
    }

    if (action === 'delete') {
      // 删除规则
      const { id } = body;
      if (!id) return NextResponse.json({ error: '缺少规则ID' }, { status: 400 });

      await store.deleteRule(id);
      await auditLog({
        userId: session?.sub,
        action: 'admin_update_config',
        details: { target: 'ziwei_rule', id },
        status: 'success',
      });
      return NextResponse.json({ success: true, id });
    }
    
    if (action === 'test') {
      // 测试规则
      const { testData, ruleId } = body;
      if (!testData?.year || !testData?.month || !testData?.day) {
        return NextResponse.json({ error: '测试数据不完整' }, { status: 400 });
      }
      
      const engine = getZiweiEngine();
      const result = engine.analyze(
        testData.chart || createTestChart(testData),
        { school: testData.school || 'feixing' }
      );
      
      return NextResponse.json({
        testResult: {
          patterns: result.detectedPatterns,
          palaceAnalyses: result.palaceAnalyses.slice(0, 3),
          overview: result.overview,
        },
      });
    }
    
    if (action === 'export') {
      // 导出所有规则
      const rules = await store.getAllRules();
      return NextResponse.json({
        rules: rules.map(r => ({
          id: r.id,
          name: r.name,
          version: r.version,
          category: r.category,
          priority: r.priority,
          description: r.description,
        })),
        exportTime: new Date().toISOString(),
      });
    }
    
    if (action === 'import') {
      // 导入规则
      const { rules } = body;
      if (!Array.isArray(rules)) {
        return NextResponse.json({ error: '规则格式错误' }, { status: 400 });
      }
      
      for (const rule of rules) {
        await store.saveRule({
          id: rule.id,
          name: rule.name,
          version: rule.version || 'v1.0.0',
          category: rule.category || 'custom',
          priority: rule.priority || 50,
          enabled: rule.enabled ?? true,
          description: rule.description || '',
          match: () => false,
          getWeight: () => rule.priority || 50,
          generateText: () => rule.description || '',
          getRelatedRuleIds: () => [],
          getClassicalReferences: () => [],
        });
      }
      
      return NextResponse.json({ success: true, imported: rules.length });
    }
    
    return NextResponse.json({ error: '无效的 action 参数' });
  } catch (error) {
    console.error('管理后台规则操作错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

/**
 * 创建测试用命盘
 */
function createTestChart(data: any) {
  const dateStr = `${data.year}-${String(data.month).padStart(2, '0')}-${String(data.day).padStart(2, '0')}`;
  const timeIndex = Math.floor(((data.hour || 12) + 1) % 24 / 2);
  const gender = data.gender === 'male' ? '男' : '女';
  
  const astrolabe = astro.bySolar(dateStr, timeIndex, gender, true, 'zh-CN');
  
  return {
    basic: {
      gender,
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
    palaces: astrolabe.palaces.map((p: any) => ({
      index: p.index,
      name: p.name,
      earthlyBranch: p.earthlyBranch,
      heavenlyStem: p.heavenlyStem || '',
      majorStars: (p.majorStars || []).map((s: any) => ({
        name: s.name,
        type: s.type,
        mutagen: s.mutagen,
        brightness: s.brightness,
      })),
      minorStars: (p.minorStars || []).map((s: any) => ({
        name: s.name,
        type: s.type,
        mutagen: s.mutagen,
        brightness: s.brightness,
      })),
      adjectiveStars: (p.adjectiveStars || []).map((s: any) => s.name),
      decadal: p.decadal || null,
      isBodyPalace: p.isBodyPalace,
      isSoulPalace: p.isSoulPalace,
    })),
    birthSihua: {
      stem: '',
      lu: { star: '', palace: '' },
      quan: { star: '', palace: '' },
      ke: { star: '', palace: '' },
      ji: { star: '', palace: '' },
    },
    soulMaster: astrolabe.soul,
    bodyMaster: astrolabe.body,
    version: '2.0.0',
  };
}
