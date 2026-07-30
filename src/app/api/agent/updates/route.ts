import { NextRequest, NextResponse } from 'next/server';
import { requireAgent } from '@/lib/auth-server';
import { queryFirst, queryAll } from '@/lib/d1';

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAgent(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const currentRow = await queryFirst(
      'SELECT * FROM "UpdateLog" WHERE "isCurrent" = true ORDER BY "createdAt" DESC LIMIT 1'
    ) as any;

    const latestRow = await queryFirst(
      'SELECT * FROM "UpdateLog" WHERE "isLatest" = true ORDER BY "createdAt" DESC LIMIT 1'
    ) as any;

    const fallbackLatest = await queryFirst(
      'SELECT * FROM "UpdateLog" ORDER BY "createdAt" DESC LIMIT 1'
    ) as any;

    const changelog = await queryAll(
      'SELECT version, title, category, content, "createdAt" FROM "UpdateLog" ORDER BY "createdAt" DESC LIMIT 20'
    ) as any[];

    return NextResponse.json({
      currentVersion: currentRow?.version || null,
      latestVersion: latestRow?.version || fallbackLatest?.version || null,
      changelog: changelog.map((c: any) => ({
        version: c.version,
        title: c.title,
        category: c.category,
        content: c.content,
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    console.error('查询版本信息失败:', error);
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }
}