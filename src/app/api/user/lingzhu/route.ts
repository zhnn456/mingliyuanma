import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { queryFirst, queryAll, execute } from '@/lib/d1';

// 每月赠送灵珠数量
const MONTHLY_GRANT: Record<string, number> = {
  yearly: 100,
  lifetime: 200,
};

// 检查并发放每月灵珠
async function checkMonthlyGrant(userId: string, memberLevel: string): Promise<number> {
  const grantAmount = MONTHLY_GRANT[memberLevel];
  if (!grantAmount) return 0;

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const monthStart = `${currentMonth}-01T00:00:00.000Z`;

  // 检查本月是否已赠送
  const existing = await queryFirst(
    "SELECT id FROM PointsLedger WHERE userId = ? AND type = 'monthly_grant' AND createdAt >= ? LIMIT 1",
    userId, monthStart
  ) as any;

  if (existing) return 0; // 本月已赠送

  // 赠送灵珠
  const now = new Date().toISOString();
  await execute(
    'INSERT INTO UserPoints (userId, balance, updatedAt) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE balance = balance + ?, updatedAt = ?',
    userId, grantAmount, now, grantAmount, now
  );

  const row = await queryFirst('SELECT balance FROM UserPoints WHERE userId = ?', userId) as any;
  const newBalance = row?.balance || 0;

  await execute(
    'INSERT INTO PointsLedger (id, userId, amount, balance, type, remark, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    `grant_${currentMonth}_${userId.slice(0, 8)}`, userId, grantAmount, newBalance, 'monthly_grant',
    `${currentMonth}会员每月灵珠`, now
  );

  return grantAmount;
}

export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAuth(req);
    if (!allowed || !session) return NextResponse.json({ error: '未登录' }, { status: 401 });
    const userId = session.sub;

    // 获取会员等级
    const user = await queryFirst(
      'SELECT memberLevel, memberExpiryAt FROM User WHERE id = ?',
      userId
    ) as any;
    let memberLevel = user?.memberLevel || 'free';
    if (memberLevel !== 'free' && memberLevel !== 'lifetime' && user?.memberExpiryAt) {
      if (new Date(user.memberExpiryAt) < new Date()) {
        memberLevel = 'free';
      }
    }

    // 检查并发放每月灵珠
    let grantedAmount = 0;
    if (MONTHLY_GRANT[memberLevel]) {
      try {
        grantedAmount = await checkMonthlyGrant(userId, memberLevel);
      } catch (e) {
        console.error('[lingzhu] Monthly grant failed:', e);
      }
    }

    const row = await queryFirst('SELECT balance FROM UserPoints WHERE userId = ?', userId) as any;
    const balance = row?.balance || 0;

    const rows = await queryAll('SELECT * FROM PointsLedger WHERE userId = ? ORDER BY createdAt DESC LIMIT 20', userId);
    return NextResponse.json({
      balance,
      rows,
      memberLevel,
      monthlyGranted: grantedAmount > 0 ? { amount: grantedAmount, message: `本月赠送${grantedAmount}灵珠` } : null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || '查询失败' }, { status: 500 });
  }
}
