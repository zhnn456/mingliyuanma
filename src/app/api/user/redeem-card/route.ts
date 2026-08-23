import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { ensureCardKeyTable, queryFirst, execute, addPoints } from '@/lib/d1';
import { auditLog } from '@/lib/audit';
import { checkIPRateLimit, getClientIP } from '@/lib/security';

/**
 * 用户兑换卡密 API
 * POST 兑换卡密
 *  - 验证卡密有效性（存在、未使用、未过期、未禁用）
 *  - 原子抢占卡密（防止并发双花）
 *  - 根据类型充值：lingzhu 给用户加积分；agent_balance 给代理商加余额
 *  - 充值失败自动回滚卡密状态
 *  - 记录审计日志
 */

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAuth(req);
    if (!allowed || !session) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }
    const userId = session.sub;

    const rl = await checkIPRateLimit(`card:${userId}:${getClientIP(req)}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: '兑换尝试过于频繁，请稍后再试' }, { status: 429 });
    }

    await ensureCardKeyTable();

    const body = await req.json();
    const { code } = body as { code?: string };

    if (!code) {
      return NextResponse.json({ error: '请输入卡密' }, { status: 400 });
    }

    // 标准化卡密代码：转大写、去除多余空格和连字符
    const normalizedCode = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    // 查询卡密
    const card = await queryFirst('SELECT * FROM CardKey WHERE code = ? OR code = ?', normalizedCode, code.trim().toUpperCase()) as any;
    if (!card) {
      return NextResponse.json({ error: '卡密无效，请检查后重试' }, { status: 404 });
    }

    // 校验状态（统一话术，防止卡密枚举探测）
    if (card.status !== 'unused') {
      return NextResponse.json({ error: '卡密无效，请检查后重试' }, { status: 400 });
    }

    // 校验过期时间
    if (card.expiryAt) {
      const expiry = new Date(card.expiryAt);
      if (expiry.getTime() < Date.now()) {
        // 自动标记为过期
        await execute('UPDATE CardKey SET status = ? WHERE id = ?', 'expired', card.id);
        return NextResponse.json({ error: '卡密无效，请检查后重试' }, { status: 400 });
      }
    }

    const now = new Date().toISOString();
    const cardValue = Number(card.value);

    // === 原子抢占卡密（防止并发双花）===
    // 只在 status = 'unused' 时才能更新为 'used'
    const claimResult = await execute(
      'UPDATE CardKey SET status = ?, usedBy = ?, usedAt = ? WHERE id = ? AND status = ?',
      'used', userId, now, card.id, 'unused'
    );

    if (claimResult.changes === 0) {
      // 卡密已被其他并发请求抢占
      return NextResponse.json({ error: '卡密无效，请检查后重试' }, { status: 400 });
    }

    // === 抢占成功，执行充值 ===
    try {
      if (card.type === 'lingzhu') {
        // 积分卡：给用户加积分
        await addPoints(userId, cardValue, 'card_key_redeem', `兑换卡密 ${card.code}`);

        await auditLog({
          userId,
          action: 'card_key_redeem',
          ip: req.headers.get('x-forwarded-for') || undefined,
          userAgent: req.headers.get('user-agent') || undefined,
          details: {
            cardKeyId: card.id,
            code: card.code,
            type: 'lingzhu',
            value: cardValue,
          },
          status: 'success',
        });

        // 查询最新余额
        const pointsRow = await queryFirst('SELECT balance FROM UserPoints WHERE userId = ?', userId) as any;

        return NextResponse.json({
          success: true,
          type: 'lingzhu',
          value: cardValue,
          points: pointsRow?.balance || 0,
          balance: pointsRow?.balance || 0,
          message: `兑换成功，获得 ${cardValue} 积分`,
        });

      } else if (card.type === 'agent_balance') {
        // 代理商余额卡：给代理商加余额
        const agent = await queryFirst('SELECT id, balance FROM Agent WHERE userId = ?', userId) as any;
        if (!agent) {
          // 回滚卡密状态
          await execute('UPDATE CardKey SET status = ?, usedBy = NULL, usedAt = NULL WHERE id = ?', 'unused', card.id);
          return NextResponse.json({ error: '您不是代理商，无法使用代理商余额卡' }, { status: 403 });
        }

        const oldBalance = Number(agent.balance ?? 0);
        await execute('UPDATE Agent SET balance = balance + ? WHERE id = ?', cardValue, agent.id);
        const freshAgent = await queryFirst('SELECT balance FROM Agent WHERE id = ?', agent.id) as any;
        const newBalance = Number(freshAgent?.balance ?? (oldBalance + cardValue));

        await auditLog({
          userId,
          action: 'card_key_redeem',
          ip: req.headers.get('x-forwarded-for') || undefined,
          userAgent: req.headers.get('user-agent') || undefined,
          details: {
            cardKeyId: card.id,
            code: card.code,
            type: 'agent_balance',
            value: cardValue,
            agentId: agent.id,
            balanceBefore: oldBalance,
            balanceAfter: newBalance,
          },
          status: 'success',
        });

        return NextResponse.json({
          success: true,
          type: 'agent_balance',
          value: cardValue,
          balance: newBalance,
          message: `兑换成功，获得 ¥${cardValue} 代理商余额`,
        });

      } else {
        // 未知类型，回滚
        await execute('UPDATE CardKey SET status = ?, usedBy = NULL, usedAt = NULL WHERE id = ?', 'unused', card.id);
        return NextResponse.json({ error: '未知的卡密类型' }, { status: 400 });
      }

    } catch (redeemError: any) {
      // 充值失败，回滚卡密状态
      console.error('充值失败，回滚卡密状态:', redeemError?.message);
      await execute('UPDATE CardKey SET status = ?, usedBy = NULL, usedAt = NULL WHERE id = ?', 'unused', card.id);
      return NextResponse.json({ error: '兑换失败，请稍后重试' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('兑换卡密失败:', error?.message);
    return NextResponse.json({ error: '兑换失败，请稍后重试' }, { status: 500 });
  }
}
