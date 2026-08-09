import { NextResponse } from 'next/server';
import { listEnabledAnnouncements } from '@/lib/announcement';

/**
 * 公开接口：获取所有启用的公告列表
 * 无需登录，返回按 sortOrder, createdAt 升序的公告数组
 * 前端根据 localStorage 中的已读 ID 过滤未读公告，逐条弹出
 */
export async function GET() {
  try {
    const announcements = await listEnabledAnnouncements();
    return NextResponse.json({ announcements });
  } catch (error) {
    console.error('获取公告列表失败:', error);
    return NextResponse.json({ announcements: [] });
  }
}
