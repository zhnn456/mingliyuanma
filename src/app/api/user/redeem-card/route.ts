import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { ensureCardKeyTable, queryFirst, execute, addPoints } from '@/lib/d1';
import { auditLog } from '@/lib/audit';

/**
 * 用户兑换卡密 API
 * POST 兑换卡密
 *  - 验证卡密有效性（存在、未使用、未过期、未禁用）
 *  - 根据类型充值：lingzhu 给用户加积分；agent_balance 给代理商加余额
 *  - 更新卡密状态为 used
 *  - 记录审计日志
 */

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAuth(req);
    if (!allowed || !session) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }
    const userId = session.sub;

    await ensureCardKeyTable();

    const body = await req.json();
    const { code } = body as { code?: string };

    if (!code) {
      return NextResponse.json({ error: '请输入卡密' }, { status: 400 });
    }

    // 标准化卡密代码：转大写、去除多余空格
    const normalizedCode = code.trim().toUpperCase();

    // 查询卡密
    const card = await queryFirst('SELECT * FROM CardKey WHERE code = ?', normalizedCode) as any;
    if (!card) {
      return NextResponse.json({ error: '卡密不存在' }, { status: 404 });
    }

    // 校验状态
    if (card.status === 'used') {
      return NextResponse.json({ error: '该卡密已被使用' }, { status: 400 });
    }
    if (card.status === 'disabled') {
      return NextResponse.json({ error: '该卡密已被禁用' }, { status: 400 });
    }
    if (card.status === 'expired') {
      return NextResponse.json({ error: '该卡密已过期' }, { status: 400 });
    }

    // 校验过期时间
    if (card.expiryAt) {
      const expiry = new Date(card.expiryAt);
      if (expiry.getTime() < Date.now()) {
        // 自动标记为过期
        await execute('UPDATE CardKey SET status = ? WHERE id = ?', 'expired', card.id);
        return NextResponse.json({ error: '该卡密已过期' }, { status: 400 });
      }
    }

    const now = new Date().toISOString();
    const cardValue = Number(card.value);

    // 根据卡密类型进行充值
    if (card.type === 'lingzhu') {
      // 积分卡：给用户加积分（使用 addPoints 写入 UserPoints + PointsLedger）
      await addPoints(userId, cardValue, 'card_key_redeem', `兑换卡密 ${normalizedCode}`);

      // 记录审计日志
      await auditLog({
        userId,
        action: 'card_key_redeem',
        ip: req.headers.get('x-forwarded-for') || undefined,
        userAgent: req.headers.get('user-agent') || undefined,
        details: {
          cardKeyId: card.id,
          code: normalizedCode,
          type: 'lingzhu',
          value: cardValue,
        },
        status: 'success',
      });

      // 更新卡密状态为已使用
      await execute(
        'UPDATE CardKey SET status = ?, usedBy = ?, usedAt = ? WHERE id = ?',
        'used', userId, now, card.id
      );

      // 查询最新余额
      const pointsRow = await queryFirst('SELECT balance FROM UserPoints WHERE userId = ?', userId) as any;

      return NextResponse.json({
        success: true,
        type: 'lingzhu',
        value: cardValue,
        message: `兑换成功，获得 ${cardValue} 积分`,
        balance: pointsRow?.balance || 0,
      });
    } else if (card.type === 'agent_balance') {
      // 代理商余额卡：给代理商加余额
      const agent = await queryFirst('SELECT id, balance FROM Agent WHERE userId = ?', userId) as any;
      if (!agent) {
        return NextResponse.json({ error: '您不是代理商，无法使用代理商余额卡' }, { status: 403 });
      }

      const oldBalance = Number(agent.balance ?? 0);
      const newBalance = oldBalance + cardValue;
      await execute('UPDATE Agent SET balance = ? WHERE id = ?', newBalance, agent.id);

      // 记录审计日志
      await auditLog({
        userId,
        action: 'card_key_redeem',
        ip: req.headers.get('x-forwarded-for') || undefined,
        userAgent: req.headers.get('user-agent') || undefined,
        details: {
          cardKeyId: card.id,
          code: normalizedCode,
          type: 'agent_balance',
          value: cardValue,
          agentId: agent.id,
          balanceBefore: oldBalance,
          balanceAfter: newBalance,
        },
        status: 'success',
      });

      // 更新卡密状态为已使用
      await execute(
        'UPDATE CardKey SET status = ?, usedBy = ?, usedAt = ? WHERE id = ?',
        'used', userId, now, card.id
      );

      return NextResponse.json({
        success: true,
        type: 'agent_balance',
        value: cardValue,
        message: `兑换成功，获得 ¥${cardValue} 代理商余额`,
        balance: newBalance,
      });
    } else {
      return NextResponse.json({ error: '未知的卡密类型' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('兑换卡密失败:', error?.message);
    return NextResponse.json({ error: error?.message || '兑换失败，请稍后重试' }, { status: 500 });
  }
}
