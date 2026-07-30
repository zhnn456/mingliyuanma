import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { queryAll, queryFirst } from '@/lib/d1';

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const year = parseInt(searchParams.get('year') || String(now.getFullYear()));
    const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1));

    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json({ error: '年份或月份参数无效' }, { status: 400 });
    }

    // 月份范围（基于 createdAt 的本地日期分组）
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const monthEnd = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

    const rows = await queryAll(
      `SELECT r.id, r.userId, r.itemId, r.amount, r.type, r.status, r.createdAt,
              r.startDate, r.endDate,
              u.email as userEmail, u.name as userName,
              oi.name as itemName
       FROM OfferingRecord r
       LEFT JOIN User u ON r.userId = u.id
       LEFT JOIN OfferingItem oi ON r.itemId = oi.id
       WHERE r.createdAt >= ? AND r.createdAt < ?
       ORDER BY r.createdAt ASC`,
      monthStart, monthEnd
    );

    // 按日期分组
    const grouped = new Map<string, { count: number; totalAmount: number; items: any[] }>();
    for (const row of rows as any[]) {
      const createdAt = row.createdAt;
      let dateStr = '';
      try {
        dateStr = new Date(createdAt).toISOString().slice(0, 10);
      } catch {
        continue;
      }
      if (!grouped.has(dateStr)) {
        grouped.set(dateStr, { count: 0, totalAmount: 0, items: [] });
      }
      const g = grouped.get(dateStr)!;
      g.count += 1;
      g.totalAmount += Number(row.amount) || 0;
      g.items.push({
        id: row.id,
        itemName: row.itemName || row.itemId,
        userName: row.userName || row.userEmail || row.userId,
        userEmail: row.userEmail,
        type: row.type,
        amount: Number(row.amount) || 0,
        status: row.status,
        createdAt: row.createdAt,
        startDate: row.startDate,
        endDate: row.endDate,
      });
    }

    const days = Array.from(grouped.entries())
      .map(([date, val]) => ({
        date,
        count: val.count,
        totalAmount: Number(val.totalAmount.toFixed(2)),
        items: val.items,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 统计数据
    const [activeRow, monthRow, amountRow] = await Promise.all([
      queryFirst("SELECT COUNT(*) as cnt FROM OfferingRecord WHERE status = 'active'") as any,
      queryFirst(
        'SELECT COUNT(*) as cnt FROM OfferingRecord WHERE createdAt >= ? AND createdAt < ?',
        monthStart, monthEnd
      ) as any,
      queryFirst(
        'SELECT COALESCE(SUM(amount), 0) as total FROM OfferingRecord WHERE createdAt >= ? AND createdAt < ?',
        monthStart, monthEnd
      ) as any,
    ]);

    const daysInMonth = new Date(year, month, 0).getDate();
    const totalThisMonth = monthRow?.cnt || 0;
    const totalAmountThisMonth = amountRow?.total || 0;
    const dailyAvg = daysInMonth > 0 ? Number((totalThisMonth / daysInMonth).toFixed(2)) : 0;

    return NextResponse.json({
      year,
      month,
      days,
      stats: {
        totalActiveOfferings: activeRow?.cnt || 0,
        totalThisMonth,
        totalAmountThisMonth: Number(Number(totalAmountThisMonth).toFixed(2)),
        dailyAvg,
        daysInMonth,
      },
    });
  } catch (error) {
    console.error('获取排期日历失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
