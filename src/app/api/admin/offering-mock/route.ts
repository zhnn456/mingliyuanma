/**
 * 供奉模拟统计API
 * 功能：供奉数据统计，支持模拟供奉记录和统计
 * 用途：数据分析、供奉活动效果统计
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { execute, queryFirst, getMockConfig, ensureOfferingMockConfigTable, seedMockConfig, calcMockStats } from '@/lib/d1';
import { auditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await seedMockConfig();
    const config = await getMockConfig();
    if (!config) return NextResponse.json({ error: '配置不存在' }, { status: 500 });

    const mockStats = calcMockStats(config);

    // 真实数据统计
    const realStats = await queryFirst(`
      SELECT
        COUNT(*) as totalOfferings,
        COUNT(DISTINCT userId) as totalUsers,
        COALESCE(SUM(amount), 0) as totalLingzhu
      FROM OfferingRecord
    `) as any;

    return NextResponse.json({
      config,
      mockStats,
      realStats: {
        totalOfferings: realStats?.totalOfferings || 0,
        totalUsers: realStats?.totalUsers || 0,
        totalLingzhu: realStats?.totalLingzhu || 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || '获取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const body = await req.json();
    await ensureOfferingMockConfigTable();
    await seedMockConfig();

    if (body.action === 'reset') {
      await execute(
        `UPDATE OfferingMockConfig SET baseDate=?, baseOfferings=?, baseUsers=?, baseLingzhu=?,
         dailyOfferingsInc=?, dailyUsersInc=?, dailyLingzhuInc=?, isActive=?, updatedAt=CURRENT_TIMESTAMP
         WHERE id='default'`,
        '2026-01-01', 12800, 3200, 256000, 80, 15, 12000, 1
      );
      await auditLog({
        userId: session?.sub,
        action: 'admin_update_mock_config',
        details: { action: 'reset' },
        status: 'success',
      });
      return NextResponse.json({ success: true });
    }

    const {
      baseDate, baseOfferings, baseUsers, baseLingzhu,
      dailyOfferingsInc, dailyUsersInc, dailyLingzhuInc, isActive,
    } = body;

    const updates: string[] = [];
    const values: any[] = [];

    if (baseDate !== undefined) { updates.push('baseDate=?'); values.push(baseDate); }
    if (baseOfferings !== undefined) { updates.push('baseOfferings=?'); values.push(baseOfferings); }
    if (baseUsers !== undefined) { updates.push('baseUsers=?'); values.push(baseUsers); }
    if (baseLingzhu !== undefined) { updates.push('baseLingzhu=?'); values.push(baseLingzhu); }
    if (dailyOfferingsInc !== undefined) { updates.push('dailyOfferingsInc=?'); values.push(dailyOfferingsInc); }
    if (dailyUsersInc !== undefined) { updates.push('dailyUsersInc=?'); values.push(dailyUsersInc); }
    if (dailyLingzhuInc !== undefined) { updates.push('dailyLingzhuInc=?'); values.push(dailyLingzhuInc); }
    if (isActive !== undefined) { updates.push('isActive=?'); values.push(isActive ? 1 : 0); }

    if (updates.length === 0) {
      return NextResponse.json({ error: '没有需要更新的字段' }, { status: 400 });
    }

    updates.push('updatedAt=CURRENT_TIMESTAMP');
    values.push('default');

    await execute(`UPDATE OfferingMockConfig SET ${updates.join(', ')} WHERE id=?`, ...values);

    const config = await getMockConfig();
    const mockStats = config ? calcMockStats(config) : null;

    await auditLog({
      userId: session?.sub,
      action: 'admin_update_mock_config',
      details: { action: 'update', fields: updates },
      status: 'success',
    });

    return NextResponse.json({ success: true, config, mockStats });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || '更新失败' }, { status: 500 });
  }
}