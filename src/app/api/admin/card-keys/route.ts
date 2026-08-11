import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { ensureCardKeyTable, queryAll, queryFirst, execute } from '@/lib/d1';
import { generateBatch, CardKeyType } from '@/lib/card-key';
import { auditLog } from '@/lib/audit';

/**
 * 管理员卡密管理 API
 * GET    查询卡密列表（支持按批次/状态/类型筛选 + 自动标记过期 + JOIN使用者信息）
 * POST   生成卡密批次
 * DELETE 禁用卡密
 */

// 查询卡密列表
export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureCardKeyTable();

    // === 先把已过期的未使用卡密自动标记为 expired ===
    await execute(
      `UPDATE CardKey SET status = 'expired' WHERE status = 'unused' AND expiryAt IS NOT NULL AND expiryAt < NOW()`
    );

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');   // unused/used/expired/disabled
    const type = searchParams.get('type');       // lingzhu/agent_balance
    const batchId = searchParams.get('batchId'); // 批次ID
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const pageSize = Math.min(500, Math.max(1, parseInt(searchParams.get('pageSize') || '50') || 50));

    // 动态拼接查询条件
    const conditions: string[] = [];
    const params: any[] = [];
    if (status) { conditions.push('c.status = ?'); params.push(status); }
    if (type) { conditions.push('c.type = ?'); params.push(type); }
    if (batchId) { conditions.push('c.batchId = ?'); params.push(batchId); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * pageSize;

    // 查询列表（JOIN User 获取使用者信息 + 创建者信息）
    // 注意：LIMIT/OFFSET 直接拼接，因为 mysql2 prepared statements 不支持 LIMIT 参数
    const rows = await queryAll(
      `SELECT c.*,
        u.email as usedByEmail,
        u.name as usedByName,
        cu.email as createdByEmail
       FROM CardKey c
       LEFT JOIN User u ON c.usedBy = u.id
       LEFT JOIN User cu ON c.createdBy = cu.id
       ${where}
       ORDER BY c.createdAt DESC
       LIMIT ${pageSize} OFFSET ${offset}`,
      ...params
    );

    // 统计总数（带筛选条件）
    const countRow = await queryFirst(
      `SELECT COUNT(*) as total FROM CardKey c ${where}`,
      ...params
    ) as any;

    // 统计各状态数量（全表，不受筛选影响）
    const statsRow = await queryFirst(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'unused' THEN 1 ELSE 0 END) as unused,
        SUM(CASE WHEN status = 'used' THEN 1 ELSE 0 END) as used,
        SUM(CASE WHEN status = 'disabled' THEN 1 ELSE 0 END) as disabled,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired
      FROM CardKey`
    ) as any;

    // 获取所有批次列表（用于批次筛选下拉框）
    const batches = await queryAll(
      `SELECT batchId, COUNT(*) as count, MIN(createdAt) as createdAt, MAX(expiryAt) as expiryAt
       FROM CardKey GROUP BY batchId ORDER BY createdAt DESC LIMIT 50`
    );

    return NextResponse.json({
      rows,
      total: countRow?.total || 0,
      page,
      pageSize,
      totalPages: Math.ceil((countRow?.total || 0) / pageSize),
      stats: {
        total: statsRow?.total || 0,
        unused: statsRow?.unused || 0,
        used: statsRow?.used || 0,
        disabled: statsRow?.disabled || 0,
        expired: statsRow?.expired || 0,
      },
      batches,
    });
  } catch (error: any) {
    console.error('查询卡密列表失败:', error?.message);
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }
}

// 生成卡密批次
export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed || !session) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const body = await req.json();
    const { count, type, value, price, expiryDays } = body;

    // 参数校验
    if (!count || count <= 0) return NextResponse.json({ error: '数量必须大于 0' }, { status: 400 });
    if (!['lingzhu', 'agent_balance'].includes(type)) {
      return NextResponse.json({ error: '无效的卡密类型' }, { status: 400 });
    }
    if (!value || value <= 0) return NextResponse.json({ error: '面值必须大于 0' }, { status: 400 });

    const items = await generateBatch(
      Number(count),
      type as CardKeyType,
      Number(value),
      Number(price || 0),
      Number(expiryDays || 0),
      session.sub
    );

    // 记录审计日志
    await auditLog({
      userId: session.sub,
      action: 'admin_card_key_generate',
      details: {
        count: Number(count),
        type,
        value: Number(value),
        price: Number(price || 0),
        expiryDays: Number(expiryDays || 0),
        batchId: items[0]?.batchId,
      },
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      batchId: items[0]?.batchId,
      count: items.length,
      items,
    });
  } catch (error: any) {
    console.error('生成卡密失败:', error?.message);
    return NextResponse.json({ error: error?.message || '生成卡密失败' }, { status: 500 });
  }
}

// 禁用卡密
export async function DELETE(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed || !session) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: '缺少卡密ID' }, { status: 400 });

    const card = await queryFirst('SELECT * FROM CardKey WHERE id = ?', id) as any;
    if (!card) return NextResponse.json({ error: '卡密不存在' }, { status: 404 });

    // 已使用的卡密不能禁用
    if (card.status === 'used') {
      return NextResponse.json({ error: '已使用的卡密不能禁用' }, { status: 400 });
    }

    await execute('UPDATE CardKey SET status = ? WHERE id = ?', 'disabled', id);

    await auditLog({
      userId: session.sub,
      action: 'admin_card_key_disable',
      details: { cardKeyId: id, code: card.code, previousStatus: card.status },
      status: 'success',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('禁用卡密失败:', error?.message);
    return NextResponse.json({ error: '禁用失败' }, { status: 500 });
  }
}
