import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';

const ITEMS: Record<string, { price: number; id: string }> = {
  '清香': { price: 100, id: 'item_incense' },
  '鲜花': { price: 200, id: 'item_flower' },
  '水果': { price: 300, id: 'item_fruit' },
  '素食': { price: 500, id: 'item_veg' },
  '供灯': { price: 1000, id: 'item_lamp' },
  '宝鼎': { price: 2000, id: 'item_tripod' },
};

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const body = await req.json();
    const { itemName, quantity = 1, dedication } = body;
    const item = ITEMS[itemName];
    if (!item) return NextResponse.json({ error: '无效的供品' }, { status: 400 });

    const qty = Math.max(1, parseInt(quantity) || 1);
    const totalCost = item.price * qty;
    const userId = session.user.id;

    if (dedication && dedication.length > 200) {
      return NextResponse.json({ error: '祈愿文字不能超过200字' }, { status: 400 });
    }

    try {
      const { getCloudflareContext } = require('@opennextjs/cloudflare');
      const ctx = await getCloudflareContext({ async: true });
      const db = ctx.env.DB;

      const now = new Date().toISOString();
      const ledgerId = `pts_${Date.now()}`;
      const recordId = `off_${Date.now()}`;

      // 原子扣减灵珠（防止并发超扣）
      const result = await db.prepare(
        'UPDATE UserPoints SET balance = balance - ?, updatedAt = ? WHERE userId = ? AND balance >= ?'
      ).bind(totalCost, now, userId, totalCost).run();

      if (result.changes === 0) {
        const row = await db.prepare('SELECT balance FROM UserPoints WHERE userId = ?').bind(userId).first();
        const balance = (row as any)?.balance || 0;
        return NextResponse.json({ error: `灵珠不足，需要${totalCost}灵珠，当前${balance}灵珠` }, { status: 400 });
      }

      // 获取更新后的余额
      const updatedRow = await db.prepare('SELECT balance FROM UserPoints WHERE userId = ?').bind(userId).first();
      const newBalance = (updatedRow as any)?.balance || 0;

      await db.prepare(
        'INSERT INTO PointsLedger (id, userId, amount, balance, type, remark, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(ledgerId, userId, -totalCost, newBalance, 'offering', `供奉${itemName}x${qty}`, now).run();

      await db.prepare(
        'INSERT INTO OfferingRecord (id, userId, itemId, amount, type, supplyIds, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(recordId, userId, item.id, totalCost, 'single',
        dedication ? JSON.stringify({ dedication: dedication.slice(0, 200) }) : null, 'completed', now).run();

      return NextResponse.json({ success: true, cost: totalCost, balance: newBalance, message: '供奉成功 🙏' });
    } catch (dbError: any) {
      console.error('[offer] DB error:', dbError?.message);
      return NextResponse.json({ error: '操作失败，请稍后重试' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[offer] Error:', error?.message);
    return NextResponse.json({ error: '操作失败，请稍后重试' }, { status: 500 });
  }
}
