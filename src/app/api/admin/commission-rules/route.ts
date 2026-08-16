import { requirePrimaryAdmin } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll, execute, ensureCommissionTables } from '@/lib/d1';
import { auditLog } from '@/lib/audit';

async function ensureTable() {
  await ensureCommissionTables();
}

function generateId() {
  return `crrule_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requirePrimaryAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();

    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId') || '';
    const stats = searchParams.get('stats') === 'true';

    if (stats) {
      const byType = await queryAll(
        `SELECT productType, COUNT(*) as cnt FROM "CommissionRule" WHERE isActive = 1 GROUP BY productType`
      ) as any[];
      const activeRow = await queryFirst(
        'SELECT COUNT(*) as cnt FROM "CommissionRule" WHERE isActive = 1'
      ) as any;
      const disabledRow = await queryFirst(
        'SELECT COUNT(*) as cnt FROM "CommissionRule" WHERE isActive = 0'
      ) as any;
      const globalRow = await queryFirst(
        'SELECT COUNT(*) as cnt FROM "CommissionRule" WHERE agentId IS NULL AND isActive = 1'
      ) as any;
      const agentRow = await queryFirst(
        'SELECT COUNT(*) as cnt FROM "CommissionRule" WHERE agentId IS NOT NULL AND isActive = 1'
      ) as any;

      return NextResponse.json({
        byProductType: byType,
        activeCount: activeRow?.cnt || 0,
        disabledCount: disabledRow?.cnt || 0,
        globalCount: globalRow?.cnt || 0,
        agentCount: agentRow?.cnt || 0,
      });
    }

    let sql = `SELECT r.*, a.brandName as agentBrand, a.companyName
               FROM "CommissionRule" r
               LEFT JOIN "Agent" a ON r.agentId = a.id
               WHERE 1=1`;
    const params: any[] = [];

    if (agentId) {
      sql += ' AND r.agentId = ?';
      params.push(agentId);
    }

    sql += ' ORDER BY r.createdAt DESC';

    const rules = await queryAll(sql, ...params);
    const total = rules.length;

    return NextResponse.json({ rules, total });
  } catch (error) {
    console.error('获取分润规则失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

const DEFAULT_RULES = [
  { productType: 'membership', baseRate: 0.50, tierBonus: 0.03, newCustomerBonus: 0.05 },
  { productType: 'offering', baseRate: 0.50, tierBonus: 0.03, newCustomerBonus: 0.05 },
  { productType: 'pdf_report', baseRate: 0.60, tierBonus: 0.03, newCustomerBonus: 0.05 },
];

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requirePrimaryAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();

    const body = await req.json();
    const { agentId, productType, productId, baseRate, tierBonus, newCustomerBonus, maxMarkupRate, isActive, action } = body;

    if (action === 'apply-defaults') {
      const now = new Date().toISOString();
      const inserted: any[] = [];

      for (const rule of DEFAULT_RULES) {
        const id = generateId();
        await execute(
          `INSERT INTO "CommissionRule" (id, agentId, productType, productId, baseRate, tierBonus, newCustomerBonus, maxMarkupRate, isActive, createdAt, updatedAt)
           VALUES (?, NULL, ?, NULL, ?, ?, ?, 0, 1, ?, ?)`,
          id, rule.productType, rule.baseRate, rule.tierBonus, rule.newCustomerBonus, now, now
        );
        inserted.push({ id, ...rule });
      }

      await auditLog({
        userId: session?.sub,
        action: 'admin_update_config',
        details: { target: 'commission_rule' },
        status: 'success',
      });
      return NextResponse.json({ success: true, inserted, count: inserted.length });
    }

    if (!productType || !['membership', 'offering', 'pdf_report', 'all'].includes(productType)) {
      return NextResponse.json({ error: '无效的产品类型' }, { status: 400 });
    }
    if (baseRate === undefined || baseRate === null) {
      return NextResponse.json({ error: '基础比例为必填项' }, { status: 400 });
    }

    const id = generateId();
    const now = new Date().toISOString();

    await execute(
      `INSERT INTO "CommissionRule" (id, agentId, productType, productId, baseRate, tierBonus, newCustomerBonus, maxMarkupRate, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      agentId || null,
      productType,
      productId || null,
      parseFloat(baseRate) || 0,
      parseFloat(tierBonus) || 0,
      parseFloat(newCustomerBonus) || 0,
      parseFloat(maxMarkupRate) || 0,
      isActive !== undefined ? (isActive ? 1 : 0) : 1,
      now,
      now
    );

    const rule = await queryFirst(
      `SELECT r.*, a.brandName as agentBrand, a.companyName FROM "CommissionRule" r LEFT JOIN "Agent" a ON r.agentId = a.id WHERE r.id = ?`,
      id
    );
    await auditLog({
      userId: session?.sub,
      action: 'admin_update_config',
      details: { target: 'commission_rule' },
      status: 'success',
    });
    return NextResponse.json({ rule });
  } catch (error) {
    console.error('创建分润规则失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { allowed, session } = await requirePrimaryAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();

    const body = await req.json();
    const { id, agentId, productType, productId, baseRate, tierBonus, newCustomerBonus, maxMarkupRate, isActive } = body;

    if (!id) return NextResponse.json({ error: '缺少规则ID' }, { status: 400 });

    const existing = await queryFirst('SELECT * FROM "CommissionRule" WHERE id = ?', id);
    if (!existing) return NextResponse.json({ error: '规则不存在' }, { status: 404 });

    const fields: string[] = [];
    const params: any[] = [];

    if (agentId !== undefined) { fields.push('agentId = ?'); params.push(agentId || null); }
    if (productType !== undefined) { fields.push('productType = ?'); params.push(productType); }
    if (productId !== undefined) { fields.push('productId = ?'); params.push(productId || null); }
    if (baseRate !== undefined) { fields.push('baseRate = ?'); params.push(parseFloat(baseRate) || 0); }
    if (tierBonus !== undefined) { fields.push('tierBonus = ?'); params.push(parseFloat(tierBonus) || 0); }
    if (newCustomerBonus !== undefined) { fields.push('newCustomerBonus = ?'); params.push(parseFloat(newCustomerBonus) || 0); }
    if (maxMarkupRate !== undefined) { fields.push('maxMarkupRate = ?'); params.push(parseFloat(maxMarkupRate) || 0); }
    if (isActive !== undefined) { fields.push('isActive = ?'); params.push(isActive ? 1 : 0); }

    if (fields.length === 0) return NextResponse.json({ error: '没有要更新的字段' }, { status: 400 });

    fields.push('updatedAt = ?');
    params.push(new Date().toISOString());
    params.push(id);

    await execute(`UPDATE "CommissionRule" SET ${fields.join(', ')} WHERE id = ?`, ...params);

    const rule = await queryFirst(
      `SELECT r.*, a.brandName as agentBrand, a.companyName FROM "CommissionRule" r LEFT JOIN "Agent" a ON r.agentId = a.id WHERE r.id = ?`,
      id
    );
    await auditLog({
      userId: session?.sub,
      action: 'admin_update_config',
      details: { target: 'commission_rule', id },
      status: 'success',
    });
    return NextResponse.json({ rule });
  } catch (error) {
    console.error('更新分润规则失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { allowed, session } = await requirePrimaryAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureTable();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: '缺少规则ID' }, { status: 400 });

    await execute('DELETE FROM "CommissionRule" WHERE id = ?', id);

    await auditLog({
      userId: session?.sub,
      action: 'admin_update_config',
      details: { target: 'commission_rule', id },
      status: 'success',
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除分润规则失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}