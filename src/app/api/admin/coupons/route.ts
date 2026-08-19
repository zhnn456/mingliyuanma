/**
 * 优惠券管理API
 * 功能：优惠券列表查询、创建优惠券（支持折扣/满减/有效期）、按code兑换
 * 用途：营销促销、用户激励、代理商专属优惠码
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { listCoupons, createCoupon, getCouponByCode, execute } from '@/lib/d1';
import { auditLog } from '@/lib/audit';

/** 确保 Coupon 表存在 */
async function ensureTable() {
  await execute(
    `CREATE TABLE IF NOT EXISTS "Coupon" (
      "id" VARCHAR(255) NOT NULL PRIMARY KEY,
      "code" VARCHAR(100) NOT NULL,
      "name" VARCHAR(255) NOT NULL,
      "discountType" VARCHAR(50) DEFAULT 'percent',
      "discountValue" DOUBLE DEFAULT 0,
      "minAmount" DOUBLE DEFAULT 0,
      "maxDiscount" DOUBLE,
      "totalCount" INT DEFAULT 100,
      "usedCount" INT DEFAULT 0,
      "expiryDate" DATETIME,
      "isActive" INT DEFAULT 1,
      "description" VARCHAR(500),
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY "Coupon_code_key" ("code")
    )`
  );
}

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });
    await ensureTable();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const data = await listCoupons(page, 20);
    return NextResponse.json(data);
  } catch (error) {
    console.error('获取优惠码列表失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });
    await ensureTable();
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
  } catch (error) {
    console.error('创建优惠码失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });
    await ensureTable();
    const { id, isActive } = await req.json();
    await execute('UPDATE Coupon SET isActive = ? WHERE id = ?', isActive ? 1 : 0, id);
    await auditLog({
      userId: session?.sub,
      action: 'admin_update_config',
      details: { target: 'coupon', id },
      status: 'success',
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新优惠码失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}
