/**
 * 品牌设置API
 * 功能：读写品牌相关配置（品牌名、Logo、标语），主站和独立站通用
 * 用途：品牌展示配置，前台通过 /api/public/agent-brand 读取
 */
import { NextRequest, NextResponse } from 'next/server';
import { queryAll, queryFirst, execute } from '@/lib/d1';
import { requireAdmin } from '@/lib/auth-server';
import { auditLog } from '@/lib/audit';

/**
 * 品牌设置 API（主站/独立站通用）
 * 读写 SiteConfig 表中的品牌键值（brandName / logo / tagline）
 * 前台通过 /api/public/agent-brand 读取并显示
 */

const BRAND_KEYS = ['brandName', 'logo', 'tagline'];

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const rows = await queryAll(
      `SELECT "key", value FROM SiteConfig WHERE "key" IN (${BRAND_KEYS.map(() => '?').join(',')})`,
      ...BRAND_KEYS
    ) as any[];

    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;

    return NextResponse.json({
      brandName: map.brandName || '',
      logo: map.logo || '',
      tagline: map.tagline || '',
    });
  } catch (error) {
    console.error('获取品牌设置失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const body = await req.json();
    const brandName = (body.brandName || '').trim();
    const logo = (body.logo || '').trim();
    const tagline = (body.tagline || '').trim();

    if (!brandName) {
      return NextResponse.json({ error: '网站名称不能为空' }, { status: 400 });
    }

    const now = new Date().toISOString();
    // SiteConfig: id 是主键，key 无唯一索引，需要先查再决定 INSERT 或 UPDATE
    const values: Array<[string, string]> = [
      ['brandName', brandName],
      ['logo', logo],
      ['tagline', tagline],
    ];
    for (const [key, value] of values) {
      const existing = await queryFirst('SELECT id FROM SiteConfig WHERE "key" = ?', key) as any;
      if (existing) {
        await execute(
          'UPDATE SiteConfig SET value = ?, category = ?, updatedAt = ? WHERE "key" = ?',
          value, 'brand', now, key
        );
      } else {
        const id = `cfg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        await execute(
          'INSERT INTO SiteConfig (id, "key", value, category, updatedAt) VALUES (?, ?, ?, ?, ?)',
          id, key, value, 'brand', now
        );
      }
    }

    await auditLog({
      userId: session?.sub,
      action: 'admin_update_brand_settings',
      details: { brandName },
      status: 'success',
    });

    return NextResponse.json({ success: true, brandName, logo, tagline });
  } catch (error) {
    console.error('保存品牌设置失败:', error);
    return NextResponse.json({ error: '保存失败' }, { status: 500 });
  }
}
