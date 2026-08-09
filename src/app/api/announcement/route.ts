import { NextResponse } from 'next/server';
import { queryFirst } from '@/lib/d1';

/**
 * 公开接口：获取当前启用的公告
 * 无需登录，返回右下角浮层公告内容
 */
export async function GET() {
  try {
    const row = await queryFirst(
      "SELECT value FROM SiteConfig WHERE `key` = 'announcement_floating'"
    ) as any;

    if (!row || !row.value) {
      return NextResponse.json({ announcement: null });
    }

    const config = JSON.parse(row.value);
    if (!config.enabled) {
      return NextResponse.json({ announcement: null });
    }

    return NextResponse.json({ announcement: config });
  } catch (error) {
    console.error('获取公告失败:', error);
    return NextResponse.json({ announcement: null });
  }
}
