import { NextRequest, NextResponse } from 'next/server';
import { queryAll } from '@/lib/d1';
import { requireAdmin } from '@/lib/auth-server';

/**
 * 协议签署记录查询（管理员）
 * GET /api/agreement/signs
 */
export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const rows = await queryAll(
      `SELECT "key", value, updatedAt FROM SiteConfig WHERE category = 'agreement_sign' ORDER BY updatedAt DESC`
    ) as any[];

    const signs = rows.map((r: any) => {
      let info: any = {};
      try { info = JSON.parse(r.value); } catch { /* 忽略 */ }
      return {
        no: String(r.key || '').replace(/^agreement:/, ''),
        ...info,
        updatedAt: r.updatedAt || null,
      };
    });

    return NextResponse.json({ signs });
  } catch (error) {
    console.error('获取协议签署记录失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
