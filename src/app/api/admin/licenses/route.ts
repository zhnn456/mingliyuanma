import { requireAdmin } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll, execute, batch } from '@/lib/d1';
import { generateAgentLicenseAsync, CENTER_SECRET_KEY } from '@/lib/license-generator';

function generateSimpleKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = '';
  for (let i = 0; i < 20; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    let sql = `SELECT l.*, a.brandName as agentName FROM "AgentLicense" l LEFT JOIN Agent a ON l.agentId = a.id WHERE 1=1`;
    let countSql = `SELECT COUNT(*) as total FROM "AgentLicense" WHERE 1=1`;
    const params: any[] = [];

    if (status) {
      sql += ' AND l.status = ?';
      countSql += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (l.licenseKey LIKE ? OR l.domain LIKE ? OR a.brandName LIKE ?)';
      countSql += ' AND (licenseKey LIKE ? OR domain LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    sql += ` ORDER BY l.createdAt DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;

    const licenses = await queryAll(sql, ...params);
    const totalParams = status ? [status] : [];
    if (search) {
      const searchPattern = `%${search}%`;
      totalParams.push(searchPattern, searchPattern);
    }
    const total = (await queryFirst(countSql, ...totalParams))?.total || 0;

    return NextResponse.json({ licenses, total, page, pageSize });
  } catch (error) {
    console.error('获取授权码列表失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const body = await req.json();
    const { agentId, domain, durationDays, maxUsers, features, level, monthlyFee } = body;

    if (!agentId) return NextResponse.json({ error: '代理商ID必填' }, { status: 400 });

    const now = Date.now();
    const expiryTs = now + (durationDays || 365) * 24 * 60 * 60 * 1000;
    const expiryDate = new Date(expiryTs).toISOString();
    const nowStr = new Date(now).toISOString();

    // 使用 HMAC 签名生成授权码
    const signedLicense = await generateAgentLicenseAsync({
      agentId,
      features: features || ['bazi'],
      maxUsers: maxUsers || 10,
      expiryAt: expiryTs,
      domain: domain || undefined,
      level: level || 'basic',
      monthlyFee: monthlyFee || 99,
    });

    const licenseKey = signedLicense.raw;

    await execute(
      `INSERT INTO "AgentLicense" (id, agentId, licenseKey, domain, issuedAt, expiryAt, maxUsers, features, status, createdAt, updatedAt, signature)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
      `lic_${Date.now()}`,
      agentId,
      licenseKey,
      domain || null,
      nowStr,
      expiryDate,
      maxUsers || 10,
      JSON.stringify(features || ['bazi']),
      nowStr,
      nowStr,
      signedLicense.signature
    );

    const license = await queryFirst('SELECT * FROM "AgentLicense" WHERE licenseKey = ?', licenseKey);
    return NextResponse.json({ license, signedLicense, centerSecretKey: CENTER_SECRET_KEY });
  } catch (error) {
    console.error('创建授权码失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { id, expiryAt, maxUsers, features } = await req.json();
    if (!id) return NextResponse.json({ error: '授权码ID必填' }, { status: 400 });

    const updates: string[] = [];
    const params: any[] = [];
    const now = new Date().toISOString();

    if (expiryAt) { updates.push('expiryAt = ?'); params.push(expiryAt); }
    if (maxUsers !== undefined) { updates.push('maxUsers = ?'); params.push(maxUsers); }
    if (features) { updates.push('features = ?'); params.push(JSON.stringify(features)); }

    if (updates.length === 0) return NextResponse.json({ error: '无更新内容' }, { status: 400 });

    updates.push('updatedAt = ?');
    params.push(now, id);

    await execute(`UPDATE "AgentLicense" SET ${updates.join(', ')} WHERE id = ?`, ...params);
    const license = await queryFirst('SELECT * FROM "AgentLicense" WHERE id = ?', id);
    return NextResponse.json({ license });
  } catch (error) {
    console.error('更新授权码失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: '授权码ID必填' }, { status: 400 });

    const now = new Date().toISOString();
    await execute('UPDATE "AgentLicense" SET status = ?, updatedAt = ? WHERE id = ?', 'revoked', now, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('撤销授权码失败:', error);
    return NextResponse.json({ error: '撤销失败' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const body = await req.json();
    const { count, agentId, domain, durationDays, maxUsers, features, level, monthlyFee } = body;

    if (!count || count < 1) return NextResponse.json({ error: '数量必须大于0' }, { status: 400 });
    if (!agentId) return NextResponse.json({ error: '代理商ID必填' }, { status: 400 });

    const now = new Date().toISOString();
    const nowTs = Date.now();
    const expiryTs = nowTs + (durationDays || 365) * 24 * 60 * 60 * 1000;
    const expiryDate = new Date(expiryTs).toISOString();
    const statements: Array<{ sql: string; params?: any[] }> = [];
    const keys: string[] = [];

    for (let i = 0; i < count; i++) {
      const signedLicense = await generateAgentLicenseAsync({
        agentId,
        features: features || ['bazi'],
        maxUsers: maxUsers || 10,
        expiryAt: expiryTs,
        domain: domain || undefined,
        level: level || 'basic',
        monthlyFee: monthlyFee || 99,
      });
      keys.push(signedLicense.raw);
      statements.push({
        sql: `INSERT INTO "AgentLicense" (id, agentId, licenseKey, domain, issuedAt, expiryAt, maxUsers, features, status, createdAt, updatedAt, signature)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
        params: [
          `lic_${Date.now()}_${i}`,
          agentId,
          signedLicense.raw,
          domain || null,
          now,
          expiryDate,
          maxUsers || 10,
          JSON.stringify(features || ['bazi']),
          now,
          now,
          signedLicense.signature,
        ],
      });
    }

    await batch(statements);
    return NextResponse.json({ success: true, keys, count });
  } catch (error) {
    console.error('批量生成授权码失败:', error);
    return NextResponse.json({ error: '批量生成失败' }, { status: 500 });
  }
}