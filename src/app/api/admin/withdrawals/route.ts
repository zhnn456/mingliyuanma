import { requireAdmin, requireAuth } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll, execute, ensureWithdrawalTable, getWithdrawalStats } from '@/lib/d1';

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

    let sql = `SELECT w.*, u.email as userEmail, u.name as userName, u.phone as userPhone
               FROM "Withdrawal" w LEFT JOIN User u ON w.userId = u.id WHERE 1=1`;
    let countSql = `SELECT COUNT(*) as total FROM "Withdrawal" WHERE 1=1`;
    const params: any[] = [];

    if (status) { sql += ' AND w.status = ?'; countSql += ' AND status = ?'; params.push(status); }
    if (keyword) {
      sql += ' AND (u.email LIKE ? OR u.name LIKE ? OR w.account LIKE ?)';
      countSql += ' AND (userId IN (SELECT id FROM User WHERE email LIKE ? OR name LIKE ?) OR account LIKE ?)';
      const k = `%${keyword}%`;
      params.push(k, k, k);
    }
    if (minAmount) { sql += ' AND w.amount >= ?'; countSql += ' AND amount >= ?'; params.push(parseFloat(minAmount)); }
    if (maxAmount) { sql += ' AND w.amount <= ?'; countSql += ' AND amount <= ?'; params.push(parseFloat(maxAmount)); }

    sql += ' ORDER BY w.createdAt DESC LIMIT ? OFFSET ?';
    params.push(pageSize, (page - 1) * pageSize);

    const withdrawals = await queryAll(sql, ...params);
    const total = (await queryFirst(countSql, ...params.slice(0, -2)) as any)?.total || 0;
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

    const id = `wd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    await execute(
      `INSERT INTO "Withdrawal" (id, userId, amount, method, account, accountName, status, remark, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      id, session.userId || session.id, amt, method, account, accountName, remark || null, now
    );

    return NextResponse.json({
      withdrawal: { id, amount: amt, method, account, accountName, status: 'pending', createdAt: now },
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

    const { id, action, auditRemark } = await req.json();
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
    const status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'completed';

    await execute(
      `UPDATE "Withdrawal" SET status = ?, auditRemark = ?, auditorId = ?, auditedAt = ? WHERE id = ?`,
      status, auditRemark || null, auditorId, now, id
    );

    const updated = await queryFirst('SELECT * FROM "Withdrawal" WHERE id = ?', id);
    return NextResponse.json({ withdrawal: updated });
  } catch (error) {
    console.error('审核提现失败:', error);
    return NextResponse.json({ error: '审核失败' }, { status: 500 });
  }
}
