import { requireAdmin } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll, execute } from '@/lib/d1';
import { auditLog } from '@/lib/audit';

function generateId() {
  return `banner_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const position = searchParams.get('position') || '';

    const rows = await queryAll(
      "SELECT * FROM SiteConfig WHERE category = 'banner' ORDER BY updatedAt DESC"
    );

    let banners = rows.map((row: any) => {
      try {
        return { id: row.id, ...JSON.parse(row.value) };
      } catch {
        return null;
      }
    }).filter(Boolean);

    if (position) {
      banners = banners.filter((b: any) => b.position === position);
    }

    banners.sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));

    return NextResponse.json({ banners });
  } catch (error) {
    console.error('获取Banner列表失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const body = await req.json();
    const { title, imageUrl, linkUrl, position, sortOrder, isActive, startAt, endAt } = body;

    if (!title || !imageUrl) {
      return NextResponse.json({ error: '标题和图片为必填项' }, { status: 400 });
    }

    const id = generateId();
    const now = new Date().toISOString();
    const bannerData = {
      id,
      title,
      imageUrl,
      linkUrl: linkUrl || '',
      position: position || 'home',
      sortOrder: sortOrder || 0,
      isActive: isActive !== undefined ? isActive : true,
      startAt: startAt || null,
      endAt: endAt || null,
    };

    await execute(
      "INSERT INTO SiteConfig (id, key, value, category, updatedAt) VALUES (?, ?, ?, 'banner', ?)",
      id, `banner_${id}`, JSON.stringify(bannerData), now
    );

    await auditLog({
      userId: session?.sub,
      action: 'admin_update_config',
      details: { target: 'banner', title },
      status: 'success',
    });

    return NextResponse.json({ banner: bannerData });
  } catch (error) {
    console.error('创建Banner失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) return NextResponse.json({ error: '缺少Banner ID' }, { status: 400 });

    const existing = await queryFirst(
      "SELECT * FROM SiteConfig WHERE id = ? AND category = 'banner'",
      id
    );

    if (!existing) return NextResponse.json({ error: 'Banner不存在' }, { status: 404 });

    let bannerData: any = {};
    try {
      bannerData = JSON.parse(existing.value);
    } catch {}

    bannerData = { ...bannerData, ...updateData, id };

    const now = new Date().toISOString();
    await execute(
      "UPDATE SiteConfig SET value = ?, updatedAt = ? WHERE id = ?",
      JSON.stringify(bannerData), now, id
    );

    await auditLog({
      userId: session?.sub,
      action: 'admin_update_config',
      details: { target: 'banner', id },
      status: 'success',
    });

    return NextResponse.json({ banner: bannerData });
  } catch (error) {
    console.error('更新Banner失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: '缺少Banner ID' }, { status: 400 });

    await execute(
      "DELETE FROM SiteConfig WHERE id = ? AND category = 'banner'",
      id
    );

    await auditLog({
      userId: session?.sub,
      action: 'admin_update_config',
      details: { target: 'banner', id },
      status: 'success',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除Banner失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const body = await req.json();
    const { orders } = body;

    if (!Array.isArray(orders)) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }

    const now = new Date().toISOString();
    for (const item of orders) {
      const existing = await queryFirst(
        "SELECT * FROM SiteConfig WHERE id = ? AND category = 'banner'",
        item.id
      );
      if (!existing) continue;

      let bannerData: any = {};
      try {
        bannerData = JSON.parse(existing.value);
      } catch {}

      bannerData.sortOrder = item.sortOrder;

      await execute(
        "UPDATE SiteConfig SET value = ?, updatedAt = ? WHERE id = ?",
        JSON.stringify(bannerData), now, item.id
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('批量更新排序失败:', error);
    return NextResponse.json({ error: '批量更新失败' }, { status: 500 });
  }
}