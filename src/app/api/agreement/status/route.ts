import { NextRequest, NextResponse } from 'next/server';
import { queryFirst } from '@/lib/d1';

/**
 * 协议签署状态查询（公开）
 * GET /api/agreement/status?no=xxx
 * 已签署返回签署详情（含签名图），未签署返回 { signed: false }
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const no = (searchParams.get('no') || '').trim();
    if (!no || no.length > 100) {
      return NextResponse.json({ signed: false });
    }

    const row = await queryFirst(
      `SELECT value FROM SiteConfig WHERE "key" = ? AND category = 'agreement_sign'`,
      `agreement:${no}`
    ) as any;

    if (!row?.value) {
      return NextResponse.json({ signed: false });
    }

    let info: any = {};
    try { info = JSON.parse(row.value); } catch { /* 忽略 */ }

    return NextResponse.json({
      signed: true,
      no,
      signerName: info.signerName || '',
      signTime: info.signTime || '',
      ip: info.ip || '',
      signature: info.signature || '',
      name: info.name || '',
      domain: info.domain || '',
    });
  } catch (error) {
    console.error('查询协议状态失败:', error);
    return NextResponse.json({ signed: false });
  }
}
