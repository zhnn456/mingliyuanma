import { NextRequest, NextResponse } from 'next/server';
import { queryFirst } from '@/lib/d1';

const QR_KEYS = {
  url: 'membership_qr_url',
  title: 'membership_qr_title',
  subtitle: 'membership_qr_subtitle',
};

const FALLBACK = {
  url: '',
  title: '扫码联系客服',
  subtitle: '微信/支付宝咨询 · 人工协助开通',
};

export async function GET(req: NextRequest) {
  try {
    const result: Record<string, string> = {};
    for (const [k, key] of Object.entries(QR_KEYS)) {
      const row = (await queryFirst('SELECT value FROM SiteConfig WHERE "key" = ?', key)) as any;
      result[k] = row?.value || '';
    }
    return NextResponse.json({
      url: result.url?.trim() || FALLBACK.url,
      title: result.title?.trim() || FALLBACK.title,
      subtitle: result.subtitle?.trim() || FALLBACK.subtitle,
    });
  } catch (error) {
    console.error('获取会员二维码配置失败:', error);
    return NextResponse.json(FALLBACK);
  }
}
