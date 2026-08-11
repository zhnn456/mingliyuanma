import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { execute, queryFirst, getUserReferralCode, getAgentByReferralCode } from '@/lib/d1';
import { calculateCommission, saveCommissionRecord } from '@/lib/commission';

const LEGACY_ITEMS: Record<string, { price: number; id: string }> = {
  '清香': { price: 100, id: 'item_incense' },
  '鲜花': { price: 200, id: 'item_flower' },
  '水果': { price: 300, id: 'item_fruit' },
  '素食': { price: 500, id: 'item_veg' },
  '供灯': { price: 1000, id: 'item_lamp' },
  '宝鼎': { price: 2000, id: 'item_tripod' },
};

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAuth(req);
    if (!allowed || !session) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const body = await req.json();
    const { supplyId, itemName, quantity = 1, dedication } = body;

    let supply: any = null;

    if (supplyId) {
      supply = await queryFirst('SELECT * FROM OfferingSupply WHERE id = ? AND isActive = 1', supplyId);
      if (!supply) return NextResponse.json({ error: '供品不存在或已下架' }, { status: 400 });
    } else if (itemName) {
      supply = await queryFirst('SELECT * FROM OfferingSupply WHERE name = ? AND isActive = 1', itemName);
      if (!supply) {
        const legacyItem = LEGACY_ITEMS[itemName];
        if (!legacyItem) return NextResponse.json({ error: '无效的供品' }, { status: 400 });
        supply = { id: legacyItem.id, name: itemName, price: legacyItem.price };
      }
    } else {
      return NextResponse.json({ error: '缺少供品信息' }, { status: 400 });
    }

    const qty = Math.max(1, parseInt(quantity) || 1);
    const totalCost = supply.price * qty;
    const userId = session.sub;

    if (dedication && dedication.length > 200) {
      return NextResponse.json({ error: '祈愿文字不能超过200字' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const ledgerId = `pts_${Date.now()}`;
    const recordId = `off_${Date.now()}`;
    const orderId = `ord_${Date.now()}`;
    const orderNo = `ORD${Date.now()}`;

    const result = await execute(
      'UPDATE UserPoints SET balance = balance - ?, updatedAt = ? WHERE userId = ? AND balance >= ?',
      totalCost, now, userId, totalCost
    );

    if (result.changes === 0) {
      const row = await queryFirst('SELECT balance FROM UserPoints WHERE userId = ?', userId) as any;
      const balance = row?.balance || 0;
      return NextResponse.json({ error: `积分不足，需要${totalCost}积分，当前${balance}积分` }, { status: 400 });
    }

    const updatedRow = await queryFirst('SELECT balance FROM UserPoints WHERE userId = ?', userId) as any;
    const newBalance = updatedRow?.balance || 0;

    await execute(
      'INSERT INTO PointsLedger (id, userId, amount, balance, type, remark, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ledgerId, userId, -totalCost, newBalance, 'offering', `祈福${supply.name}x${qty}`, now
    );

    await execute(
      'INSERT INTO OfferingRecord (id, userId, itemId, amount, type, supplyIds, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      recordId, userId, supply.id, totalCost, 'single',
      dedication ? JSON.stringify({ dedication: dedication.slice(0, 200) }) : null, 'completed', now
    );

    let agentId: string | null = null;
    let agentReferralCode: string | null = null;
    try {
      agentReferralCode = await getUserReferralCode(userId);
      if (agentReferralCode) {
        const agent = await getAgentByReferralCode(agentReferralCode);
        if (agent) {
          agentId = agent.id;
        }
      }
    } catch {}

    await execute(
      `INSERT INTO "Order" (id, orderNo, userId, type, targetId, amount, status, agentId, agentReferralCode, commissionSettled, createdAt, updatedAt)
       VALUES (?, ?, ?, 'offering', ?, ?, 'completed', ?, ?, 0, ?, ?)`,
      orderId, orderNo, userId, supply.id, totalCost, agentId, agentReferralCode, now, now
    );

    if (agentId) {
      try {
        const commissionResult = await calculateCommission({
          agentId,
          orderId,
          userId,
          productType: 'offering',
          productId: supply.id,
          orderAmount: totalCost,
        });
        if (commissionResult) {
          await saveCommissionRecord(commissionResult);
        }
      } catch (err) {
        console.error('[offer] Commission calculation failed:', err);
      }
    }

    return NextResponse.json({ success: true, cost: totalCost, balance: newBalance, message: '祈福成功 🙏' });
  } catch (error: any) {
    console.error('[offer] Error:', error?.message);
    return NextResponse.json({ error: '操作失败，请稍后重试' }, { status: 500 });
  }
}