import { NextRequest, NextResponse } from 'next/server';
import { execute, queryAll } from '@/lib/d1';

/**
 * 授权协议签署回传 API（乙方点击签署后调用）
 * 记录：协议编号、乙方信息、签署时间、IP
 * 存储：SiteConfig 表 category='agreement_sign'，key=协议编号，value=JSON
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: '参数错误' }, { status: 400 });

    const no = String(body.no || '').trim();
    const name = String(body.name || '').trim();
    const domain = String(body.domain || '').trim();
    const contact = String(body.contact || '').trim();
    const email = String(body.email || '').trim();
    const signTime = String(body.signTime || '').trim();
    const ip = String(body.ip || '').trim();

    if (!no || !name || !domain) {
      return NextResponse.json({ error: '协议编号、乙方名称、域名为必填' }, { status: 400 });
    }
    if (no.length > 100 || name.length > 100 || domain.length > 200) {
      return NextResponse.json({ error: '参数长度超限' }, { status: 400 });
    }

    const clientIP = ip || req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '';

    const value = JSON.stringify({
      name, domain, contact, email,
      signTime: signTime || new Date().toISOString(),
      ip: clientIP,
    });
    const now = new Date().toISOString();

    await execute(
      `INSERT INTO SiteConfig ("key", value, category, updatedAt) VALUES (?, ?, 'agreement_sign', ?)
       ON DUPLICATE KEY UPDATE value = ?, updatedAt = ?`,
      `agreement:${no}`, value, now, value, now
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('保存协议签署记录失败:', error);
    return NextResponse.json({ error: '保存失败' }, { status: 500 });
  }
}

/**
 * 协议签署记录查询（管理员）
 * GET /api/agreement/signs
 */
export async function GET(req: NextRequest) {
  try {
    const { requireAdmin } = await import('@/lib/auth-server');
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
