import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/d1';

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
    // 手动从 cookie 读取 token 获取用户 ID
    const cookie = req.headers.get('cookie') || '';
    const tokenMatch = cookie.match(/token=([^;]+)/);
    if (!tokenMatch) return NextResponse.json({ error: '未登录' }, { status: 401 });

    const token = decodeURIComponent(tokenMatch[1]);
    let userData: any;
    try {
      const binary = atob(token);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      userData = JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      return NextResponse.json({ error: '登录已过期' }, { status: 401 });
    }

    if (!userData?.sub) return NextResponse.json({ error: '未登录' }, { status: 401 });

    const body = await req.json();
    const { itemName, quantity = 1, dedication } = body;
    const item = ITEMS[itemName];
    if (!item) return NextResponse.json({ error: '无效的供品' }, { status: 400 });

    const qty = Math.max(1, parseInt(quantity) || 1);
    const totalCost = item.price * qty;
    const userId = userData.sub;

    // 查灵珠余额
    let balance = 0;
    try {
      const { getCloudflareContext } = require('@opennextjs/cloudflare');
      const ctx = await getCloudflareContext({ async: true });
      const db = ctx.env.DB;

      const row = await db.prepare('SELECT balance FROM UserPoints WHERE userId = ?').bind(userId).first();
      balance = (row as any)?.balance || 0;

      if (balance < totalCost) {
        return NextResponse.json({ error: `灵珠不足，需要${totalCost}灵珠，当前${balance}灵珠` }, { status: 400 });
      }

      const newBalance = balance - totalCost;
      const now = new Date().toISOString();
      const ledgerId = `pts_${Date.now()}`;
      const recordId = `off_${Date.now()}`;

      await db.prepare(
        'INSERT INTO PointsLedger (id, userId, amount, balance, type, remark, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(ledgerId, userId, -totalCost, newBalance, 'offering', `供奉${itemName}x${qty}`, now).run();

      await db.prepare(
        'INSERT OR REPLACE INTO UserPoints (userId, balance, updatedAt) VALUES (?, ?, ?)'
      ).bind(userId, newBalance, now).run();

      await db.prepare(
        'INSERT INTO OfferingRecord (id, userId, itemId, amount, type, supplyIds, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(recordId, userId, item.id, totalCost, 'single',
        dedication ? JSON.stringify({ dedication }) : null, 'completed', now).run();

      return NextResponse.json({ success: true, cost: totalCost, balance: newBalance, message: '供奉成功 🙏' });
    } catch (dbError: any) {
      console.error('[offer] DB error:', dbError?.message, dbError?.stack);
      return NextResponse.json({ error: '数据库错误: ' + (dbError?.message || '未知错误') }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[offer] Error:', error?.message);
    return NextResponse.json({ error: '供奉失败: ' + (error?.message || '') }, { status: 500 });
  }
}
