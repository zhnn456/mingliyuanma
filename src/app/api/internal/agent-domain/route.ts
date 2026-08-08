import { NextRequest, NextResponse } from 'next/server';
import { parseAgentDomain, getAgentByDomain } from '@/lib/agent-domain';

/**
 * 内部 API：解析代理商域名
 * 供 middleware 调用，避免在 middleware 中直接导入 mysql2
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const host = searchParams.get('host');
    if (!host) {
      return NextResponse.json({ agentId: null });
    }
    const parsed = parseAgentDomain(host);
    if (!parsed) {
      return NextResponse.json({ agentId: null });
    }
    const agent = await getAgentByDomain(host);
    if (agent) {
      return NextResponse.json({ agentId: (agent as any).id });
    }
    return NextResponse.json({ agentId: null });
  } catch (error) {
    console.error('Agent domain resolve error:', error);
    return NextResponse.json({ agentId: null });
  }
}
