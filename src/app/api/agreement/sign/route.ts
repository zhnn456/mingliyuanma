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
    const signerName = String(body.signerName || '').trim();
    const signerIdCard = String(body.signerIdCard || '').trim();
    const signerPhone = String(body.signerPhone || '').trim();
    const signature = String(body.signature || '').trim();

    if (!no || !name || !domain) {
      return NextResponse.json({ error: '协议编号、乙方名称、域名为必填' }, { status: 400 });
    }
    if (no.length > 100 || name.length > 100 || domain.length > 200 || signerName.length > 50
        || signerIdCard.length > 30 || signerPhone.length > 20 || signature.length > 200000) {
      return NextResponse.json({ error: '参数长度超限' }, { status: 400 });
    }

    const clientIP = ip || req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '';

    const value = JSON.stringify({
      name, domain, contact, email,
      signerName, signerIdCard, signerPhone,
      signature,
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
 * 撤销协议签署记录（管理员）
 * DELETE /api/agreement/sign?no=xxx
 * 撤销后该协议号失效，可在代理商列表重新生成新协议
 */
export async function DELETE(req: NextRequest) {
  try {
    const { requireAdmin } = await import('@/lib/auth-server');
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const no = (req.nextUrl.searchParams.get('no') || '').trim();
    if (!no || no.length > 100) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }

    await execute(
      `DELETE FROM SiteConfig WHERE "key" = ? AND category = 'agreement_sign'`,
      `agreement:${no}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('撤销协议失败:', error);
    return NextResponse.json({ error: '撤销失败' }, { status: 500 });
  }
}
