import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { listCoupons, createCoupon, getCouponByCode, execute } from '@/lib/d1';
import { auditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const { allowed } = await requireAdmin(req);
  if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const data = await listCoupons(page, 20);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { allowed, session } = await requireAdmin(req);
  if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });
  const body = await req.json();
  if (!body.code || !body.name) return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
  const existing = await getCouponByCode(body.code);
  if (existing) return NextResponse.json({ error: '优惠码已存在' }, { status: 400 });
  const result = await createCoupon(body);
  await auditLog({
    userId: session?.sub,
    action: 'admin_update_config',
    details: { target: 'coupon', code: body.code },
    status: 'success',
  });
  return NextResponse.json(result);
}

export async function PUT(req: NextRequest) {
  const { allowed, session } = await requireAdmin(req);
  if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });
  const { id, isActive } = await req.json();
  await execute('UPDATE Coupon SET isActive = ? WHERE id = ?', isActive ? 1 : 0, id);
  await auditLog({
    userId: session?.sub,
    action: 'admin_update_config',
    details: { target: 'coupon', id },
    status: 'success',
  });
  return NextResponse.json({ success: true });
}
