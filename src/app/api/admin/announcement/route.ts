import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import {
  listAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  type Announcement,
} from '@/lib/announcement';

/** 获取所有公告（含禁用） */
export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }
    const announcements = await listAllAnnouncements();
    return NextResponse.json({ announcements });
  } catch (error) {
    console.error('获取公告列表失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

/** 新建公告 */
export async function POST(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }
    const body = (await req.json()) as Partial<Announcement>;
    const created = await createAnnouncement(body);
    if (!created) {
      return NextResponse.json({ error: '创建失败' }, { status: 500 });
    }
    return NextResponse.json({ success: true, announcement: created });
  } catch (error) {
    console.error('创建公告失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

/** 更新公告（body 需含 id） */
export async function PUT(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }
    const body = (await req.json()) as Partial<Announcement> & { id: string };
    if (!body.id) {
      return NextResponse.json({ error: '缺少 id' }, { status: 400 });
    }
    const ok = await updateAnnouncement(body.id, body);
    if (!ok) {
      return NextResponse.json({ error: '更新失败' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新公告失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

/** 删除公告（body 需含 id） */
export async function DELETE(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: '缺少 id' }, { status: 400 });
    }
    const ok = await deleteAnnouncement(id);
    if (!ok) {
      return NextResponse.json({ error: '删除失败' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除公告失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
