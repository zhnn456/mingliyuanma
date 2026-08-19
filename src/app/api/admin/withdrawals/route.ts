/**
 * 提现管理API
 * 功能：提现列表查询（支持状态/金额/关键词筛选）、代理商提交提现申请、管理员审核（通过/拒绝/完成打款）
 * 规则：最低100元、每月最多3次、手续费5%
 * 用法：GET - 查询列表；POST - 提交申请；PUT - 审核操作
 */
import { requireAdmin, requireAuth } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll, execute, ensureWithdrawalTable, getWithdrawalStats } from '@/lib/d1';
import { auditLog } from '@/lib/audit';
import { WITHDRAWAL_RULES } from '@/lib/pricing';

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureWithdrawalTable();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status') || '';
    const keyword = searchParams.get('keyword') || '';
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    const agentId = searchParams.get('agentId') || '';

    let sql = `SELECT w.*, u.email as userEmail, u.name as userName, u.phone as userPhone, a.brandName as agentBrand
               FROM "Withdrawal" w
               LEFT JOIN User u ON w.userId = u.id
               LEFT JOIN Agent a ON w.agentId = a.id
               WHERE 1=1`;
    let countSql = `SELECT COUNT(*) as total FROM "Withdrawal" w WHERE 1=1`;
    const params: any[] = [];
    const countParams: any[] = [];

    if (status) { sql += ' AND w.status = ?'; countSql += ' AND status = ?'; params.push(status); countParams.push(status); }
    if (agentId) { sql += ' AND w.agentId = ?'; countSql += ' AND agentId = ?'; params.push(agentId); countParams.push(agentId); }
    if (keyword) {
      sql += ' AND (u.email LIKE ? OR u.name LIKE ? OR w.account LIKE ? OR a.brandName LIKE ?)';
      countSql += ' AND (u.email LIKE ? OR u.name LIKE ? OR w.account LIKE ? OR a.brandName LIKE ?)';
      const k = `%${keyword}%`;
      params.push(k, k, k, k);
      countParams.push(k, k, k, k);
    }
    if (minAmount) { sql += ' AND w.amount >= ?'; countSql += ' AND amount >= ?'; params.push(parseFloat(minAmount)); countParams.push(parseFloat(minAmount)); }
    if (maxAmount) { sql += ' AND w.amount <= ?'; countSql += ' AND amount <= ?'; params.push(parseFloat(maxAmount)); countParams.push(parseFloat(maxAmount)); }

    sql += ` ORDER BY w.createdAt DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;

    const withdrawals = await queryAll(sql, ...params);
    const total = (await queryFirst(countSql, ...countParams) as any)?.total || 0;
    const stats = await getWithdrawalStats();

    return NextResponse.json({ withdrawals, total, page, pageSize, stats });
  } catch (error) {
    console.error('获取提现列表失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAuth(req);
    if (!allowed || !session) return NextResponse.json({ error: '未登录' }, { status: 401 });

    await ensureWithdrawalTable();

    const { amount, method, account, accountName, remark } = await req.json();
    if (!amount || !method || !account || !accountName) {
      return NextResponse.json({ error: '参数不足：amount, method, account, accountName 必填' }, { status: 400 });
    }
    if (!['alipay', 'wechat', 'bank'].includes(method)) {
      return NextResponse.json({ error: '无效的提现方式' }, { status: 400 });
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      return NextResponse.json({ error: '无效的提现金额' }, { status: 400 });
    }

    // 验证最低提现金额
    if (amt < WITHDRAWAL_RULES.minAmount) {
      return NextResponse.json({ error: `最低提现金额为${WITHDRAWAL_RULES.minAmount}元` }, { status: 400 });
    }

    const userId = session.userId || session.sub || null;
    if (!userId) {
      return NextResponse.json({ error: '未找到用户ID' }, { status: 400 });
    }

    // 验证每月提现次数
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthCount = await queryFirst(
      'SELECT COUNT(*) as cnt FROM "Withdrawal" WHERE userId = ? AND createdAt >= ?',
      userId, monthStart.toISOString()
    );
    if (monthCount?.cnt >= WITHDRAWAL_RULES.maxPerMonth) {
      return NextResponse.json({ error: `每月最多提现${WITHDRAWAL_RULES.maxPerMonth}次` }, { status: 400 });
    }

    // 验证余额
    const agent = await queryFirst(
      'SELECT id, pendingCommission FROM Agent WHERE userId = ?',
      userId
    );
    if (!agent) {
      return NextResponse.json({ error: '未找到代理商信息' }, { status: 404 });
    }
    if (agent.pendingCommission < amt) {
      return NextResponse.json({ error: `余额不足，当前可提现¥${agent.pendingCommission.toFixed(2)}` }, { status: 400 });
    }

    // 计算手续费和实际到账金额
    const fee = Math.round(amt * WITHDRAWAL_RULES.feeRate * 100) / 100;
    const actualAmount = Math.round((amt - fee) * 100) / 100;

    const id = `wd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    await execute(
      `INSERT INTO "Withdrawal" (id, userId, agentId, amount, fee, actualAmount, method, account, accountName, status, remark, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      id, userId, agent.id, amt, fee, actualAmount, method, account, accountName, remark || null, now
    );

    // 扣减待结算佣金
    await execute(
      'UPDATE Agent SET pendingCommission = pendingCommission - ? WHERE id = ?',
      amt, agent.id
    );

    await auditLog({
      userId: session?.sub,
      action: 'admin_update_order',
      details: { withdrawalId: id, amount: amt, fee, actualAmount },
      status: 'success',
    });

    return NextResponse.json({
      withdrawal: {
        id,
        amount: amt,
        fee,
        actualAmount,
        method,
        account,
        accountName,
        status: 'pending',
        createdAt: now,
      },
    });
  } catch (error) {
    console.error('创建提现申请失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await ensureWithdrawalTable();

    const { id, action, auditRemark, paidMethod, paidAccount } = await req.json();
    if (!id || !action) return NextResponse.json({ error: '参数不足' }, { status: 400 });
    if (!['approve', 'reject', 'completed'].includes(action)) {
      return NextResponse.json({ error: '无效的审核操作' }, { status: 400 });
    }

    const row = await queryFirst('SELECT * FROM "Withdrawal" WHERE id = ?', id) as any;
    if (!row) return NextResponse.json({ error: '提现申请不存在' }, { status: 404 });
    if (row.status !== 'pending') {
      return NextResponse.json({ error: '该申请已处理' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const auditorId = session.id || session.userId;
    let status = 'pending';

    if (action === 'approve') {
      status = 'approved';
      // 恢复佣金
      await execute(
        'UPDATE Agent SET pendingCommission = pendingCommission + ? WHERE id = ?',
        row.amount, row.agentId
      );
    } else if (action === 'reject') {
      status = 'rejected';
      // 恢复佣金
      await execute(
        'UPDATE Agent SET pendingCommission = pendingCommission + ? WHERE id = ?',
        row.amount, row.agentId
      );
    } else if (action === 'completed') {
      status = 'completed';
      // 记录打款信息
      await execute(
        `UPDATE "Withdrawal" SET status = ?, auditRemark = ?, auditorId = ?, auditedAt = ?, paidAt = ?, paidMethod = ?, paidAccount = ? WHERE id = ?`,
        status, auditRemark || null, auditorId, now, now, paidMethod || row.method, paidAccount || row.account, id
      );
    await auditLog({
      userId: session?.sub,
      action: 'admin_update_order',
      details: { withdrawalId: id, status },
      status: 'success',
    });
      const updated = await queryFirst('SELECT * FROM "Withdrawal" WHERE id = ?', id);
      return NextResponse.json({ withdrawal: updated });
    }

    await execute(
      `UPDATE "Withdrawal" SET status = ?, auditRemark = ?, auditorId = ?, auditedAt = ? WHERE id = ?`,
      status, auditRemark || null, auditorId, now, id
    );

    await auditLog({
      userId: session?.sub,
      action: 'admin_update_user',
      details: { withdrawalId: id, status, action },
      status: 'success',
    });

    const updated = await queryFirst('SELECT * FROM "Withdrawal" WHERE id = ?', id);
    return NextResponse.json({ withdrawal: updated });
  } catch (error) {
    console.error('审核提现失败:', error);
    return NextResponse.json({ error: '审核失败' }, { status: 500 });
  }
}
