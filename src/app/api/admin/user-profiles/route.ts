import { requireAdmin } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll, execute } from '@/lib/d1';

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const user = await queryFirst(
        `SELECT id, email, name, phone, avatar, role, memberLevel, memberExpiry, tags, remark, createdAt
         FROM "User" WHERE id = ?`,
        id
      ) as any;
      if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

      const [orderRow, baziRow, ziweiRow, qimenRow, meihuaRow, pointsRow, ticketRow, lastActivityRow] = await Promise.all([
        queryFirst('SELECT COUNT(*) as cnt, COALESCE(SUM(amount), 0) as totalAmount FROM "Order" WHERE userId = ?', id),
        queryFirst('SELECT COUNT(*) as cnt FROM BaziRecord WHERE userId = ?', id),
        queryFirst('SELECT COUNT(*) as cnt FROM ZiweiRecord WHERE userId = ?', id),
        queryFirst('SELECT COUNT(*) as cnt FROM QimenRecord WHERE userId = ?', id),
        queryFirst('SELECT COUNT(*) as cnt FROM MeihuaRecord WHERE userId = ?', id),
        queryFirst('SELECT balance FROM UserPoints WHERE userId = ?', id),
        queryFirst('SELECT COUNT(*) as cnt FROM Ticket WHERE userId = ?', id),
        queryFirst(
          `SELECT MAX(createdAt) as lastTime FROM (
             SELECT createdAt FROM "Order" WHERE userId = ?
             UNION ALL
             SELECT createdAt FROM BaziRecord WHERE userId = ?
             UNION ALL
             SELECT createdAt FROM ZiweiRecord WHERE userId = ?
             UNION ALL
             SELECT createdAt FROM QimenRecord WHERE userId = ?
             UNION ALL
             SELECT createdAt FROM MeihuaRecord WHERE userId = ?
             UNION ALL
             SELECT createdAt FROM Ticket WHERE userId = ?
           )`,
          id, id, id, id, id, id
        ),
      ]);

      const orderHistory = await queryAll(
        'SELECT id, orderNo, type, amount, status, createdAt FROM "Order" WHERE userId = ? ORDER BY createdAt DESC LIMIT 10',
        id
      );
      const pointsLedger = await queryAll(
        'SELECT id, amount, balance, type, remark, createdAt FROM PointsLedger WHERE userId = ? ORDER BY createdAt DESC LIMIT 20',
        id
      );

      const profile = {
        ...user,
        stats: {
          orderCount: (orderRow as any)?.cnt || 0,
          totalAmount: Number((orderRow as any)?.totalAmount || 0),
          baziCount: (baziRow as any)?.cnt || 0,
          ziweiCount: (ziweiRow as any)?.cnt || 0,
          qimenCount: (qimenRow as any)?.cnt || 0,
          meihuaCount: (meihuaRow as any)?.cnt || 0,
          divinationCount: ((baziRow as any)?.cnt || 0) + ((ziweiRow as any)?.cnt || 0) + ((qimenRow as any)?.cnt || 0) + ((meihuaRow as any)?.cnt || 0),
          balance: (pointsRow as any)?.balance || 0,
          ticketCount: (ticketRow as any)?.cnt || 0,
          lastActivityTime: (lastActivityRow as any)?.lastTime || null,
        },
        orderHistory,
        pointsLedger,
      };

      return NextResponse.json({ profile });
    }

    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const keyword = searchParams.get('keyword') || '';

    let sql = `SELECT u.id, u.email, u.name, u.phone, u.avatar, u.role, u.memberLevel, u.memberExpiry, u.tags, u.createdAt,
               (SELECT COUNT(*) FROM "Order" o WHERE o.userId = u.id) as orderCount,
               (SELECT COALESCE(SUM(amount), 0) FROM "Order" o WHERE o.userId = u.id) as totalAmount,
               (SELECT COUNT(*) FROM BaziRecord b WHERE b.userId = u.id) +
               (SELECT COUNT(*) FROM ZiweiRecord z WHERE z.userId = u.id) +
               (SELECT COUNT(*) FROM QimenRecord q WHERE q.userId = u.id) +
               (SELECT COUNT(*) FROM MeihuaRecord m WHERE m.userId = u.id) as divinationCount
               FROM "User" u WHERE 1=1`;
    let countSql = 'SELECT COUNT(*) as total FROM "User" u WHERE 1=1';
    const params: any[] = [];

    if (keyword) {
      sql += ' AND (u.email LIKE ? OR u.name LIKE ? OR u.phone LIKE ?)';
      countSql += ' AND (u.email LIKE ? OR u.name LIKE ? OR u.phone LIKE ?)';
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw);
    }

    sql += ` ORDER BY u.createdAt DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;

    const users = await queryAll(sql, ...params);
    const total = (await queryFirst(countSql, ...(keyword ? [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`] : [])) as any)?.total || 0;

    return NextResponse.json({ users, total, page, pageSize });
  } catch (error) {
    console.error('获取用户画像失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { userId, memberLevel, memberExpiry, tags, remark, balanceAction } = await req.json();
    if (!userId) return NextResponse.json({ error: '参数不足：userId 必需' }, { status: 400 });

    const updates: string[] = [];
    const params: any[] = [];
    const now = new Date().toISOString();

    if (memberLevel !== undefined) { updates.push('memberLevel = ?'); params.push(memberLevel); }
    if (memberExpiry !== undefined) { updates.push('memberExpiry = ?'); params.push(memberExpiry); }
    if (tags !== undefined) { updates.push('tags = ?'); params.push(tags); }
    if (remark !== undefined) { updates.push('remark = ?'); params.push(remark); }

    if (updates.length > 0) {
      updates.push('updatedAt = ?');
      params.push(now, userId);
      await execute(`UPDATE "User" SET ${updates.join(', ')} WHERE id = ?`, ...params);
    }

    if (balanceAction && balanceAction.amount) {
      const row = await queryFirst('SELECT balance FROM UserPoints WHERE userId = ?', userId) as any;
      const current = row?.balance || 0;
      const newBalance = current + Number(balanceAction.amount);
      if (row) {
        await execute('UPDATE UserPoints SET balance = ?, updatedAt = ? WHERE userId = ?', newBalance, now, userId);
      } else {
        await execute('INSERT INTO UserPoints (userId, balance, updatedAt) VALUES (?, ?, ?)', userId, newBalance, now);
      }
      await execute(
        'INSERT INTO PointsLedger (id, userId, amount, balance, type, remark, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        `pts_${Date.now()}`, userId, balanceAction.amount, newBalance, balanceAction.type || 'admin_adjust', balanceAction.remark || '管理员调整', now
      );
    }

    const user = await queryFirst(`SELECT id, email, name, memberLevel, memberExpiry, tags, remark FROM "User" WHERE id = ?`, userId);
    return NextResponse.json({ user });
  } catch (error) {
    console.error('更新用户画像失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}
