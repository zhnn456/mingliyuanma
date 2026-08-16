import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, execute } from '@/lib/d1';
import { requireAdmin } from '@/lib/auth-server';

/**
 * 生成协议编号（管理员）
 * GET /api/agreement/next-no?agentId=xxx
 * 协议号带序号：LIC-DEPLOY-{agentId}-{n}，撤销后重新生成会得到新序号
 */
export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const agentId = (req.nextUrl.searchParams.get('agentId') || '').trim();
    if (!agentId || agentId.length > 100) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }

    const seqKey = `agreement_seq:${agentId}`;
    const row = await queryFirst(`SELECT value FROM SiteConfig WHERE "key" = ?`, seqKey) as any;
    const seq = (parseInt(row?.value || '0', 10) || 0) + 1;
    const now = new Date().toISOString();
    await execute(
      `INSERT INTO SiteConfig ("key", value, category, updatedAt) VALUES (?, ?, 'agreement_seq', ?)
       ON DUPLICATE KEY UPDATE value = ?, updatedAt = ?`,
      seqKey, String(seq), now, String(seq), now
    );

    return NextResponse.json({ no: `LIC-DEPLOY-${agentId}-${seq}` });
  } catch (error) {
    console.error('生成协议编号失败:', error);
    return NextResponse.json({ error: '生成失败' }, { status: 500 });
  }
}
