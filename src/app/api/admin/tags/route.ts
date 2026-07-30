import { requireAdmin } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import {
  getUserTags,
  createUserTag,
  updateUserTag,
  deleteUserTag,
  getUsersByTagId,
} from '@/lib/d1';

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const tagId = searchParams.get('tagId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    if (tagId) {
      const result = await getUsersByTagId(tagId, page, pageSize);
      return NextResponse.json({ ...result });
    }

    const tags = await getUserTags();
    return NextResponse.json({ tags });
  } catch (error: any) {
    console.error('获取标签失败:', error);
    return NextResponse.json({ error: error.message || '获取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const body = await req.json();
    if (!body.name) return NextResponse.json({ error: '标签名称必填' }, { status: 400 });

    const tag = await createUserTag({
      name: body.name,
      color: body.color,
      description: body.description,
    });

    return NextResponse.json({ tag });
  } catch (error: any) {
    console.error('创建标签失败:', error);
    return NextResponse.json({ error: error.message || '创建失败' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: '标签ID必填' }, { status: 400 });

    const tag = await updateUserTag(body.id, {
      name: body.name,
      color: body.color,
      description: body.description,
    });

    return NextResponse.json({ tag });
  } catch (error: any) {
    console.error('更新标签失败:', error);
    return NextResponse.json({ error: error.message || '更新失败' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: '标签ID必填' }, { status: 400 });

    await deleteUserTag(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('删除标签失败:', error);
    return NextResponse.json({ error: error.message || '删除失败' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({ allow: ['GET', 'POST', 'PUT', 'DELETE'] });
}