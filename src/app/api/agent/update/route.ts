import { NextRequest, NextResponse } from 'next/server';
import { requireAgent } from '@/lib/auth-server';
import { queryFirst, execute } from '@/lib/d1';

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAgent(req);
    if (!allowed || !session) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const userId = session.sub;

    const agent = await queryFirst('SELECT id FROM Agent WHERE userId = ?', userId) as any;
    if (!agent) return NextResponse.json({ error: '代理商信息不存在' }, { status: 404 });

    const key = `agent_update:${agent.id}`;
    const now = new Date().toISOString();
    const id = `upd_req_${Date.now()}`;

    await execute(
      `INSERT INTO SiteConfig (id, key, value, category, updatedAt)
       VALUES (?, ?, ?, ?, ?)`,
      id, key, now, 'agent_update', now
    );

    return NextResponse.json({ success: true, message: '更新请求已提交，系统将自动更新' });
  } catch (error) {
    console.error('提交更新请求失败:', error);
    return NextResponse.json({ error: '提交失败' }, { status: 500 });
  }
}