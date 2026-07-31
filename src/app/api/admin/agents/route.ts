import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll, execute } from '@/lib/d1';
import { requireAdmin } from '@/lib/auth-server'
import { sanitizeString } from '@/lib/security';
import { hashPassword } from '@/lib/password';
import { auditLog } from '@/lib/audit';
import { generateAgentLicenseAsync } from '@/lib/license-generator';

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const agents = await queryAll('SELECT * FROM Agent ORDER BY createdAt DESC');

    const userIds = agents.map((a: any) => a.userId);
    const agentIds = agents.map((a: any) => a.id);

    const users = userIds.length > 0
      ? await queryAll(
          `SELECT id, email, name, memberLevel, createdAt FROM User WHERE id IN (${userIds.map(() => '?').join(',')})`,
          ...userIds
        )
      : [];
    const userMap = new Map(users.map((u: any) => [u.id, u]));

    let customerCountMap = new Map<string, number>();
    if (agentIds.length > 0) {
      const groupResults = await queryAll(
        `SELECT value, COUNT(*) as cnt FROM SiteConfig WHERE category = ? AND value IN (${agentIds.map(() => '?').join(',')}) GROUP BY value`,
        'agent_customer', ...agentIds
      );
      customerCountMap = new Map((groupResults as any[]).map((c: any) => [c.value, c.cnt]));
    }

    const agentsWithStats = agents.map((agent: any) => {
      const user = userMap.get(agent.userId);
      const customerCount = customerCountMap.get(agent.id) || 0;
      return { ...agent, user, _count: { customers: customerCount } };
    });

    return NextResponse.json({ agents: agentsWithStats });
  } catch (error) {
    console.error('获取代理商列表失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const body = await req.json();
    const action = body.action;
    const adminId = session.sub;

    if (action === 'create') {
      const { companyName, contactName, contactPhone, domain, brandName, licenseExpiry, maxUsers } = body;

      if (!contactName || !contactPhone) {
        return NextResponse.json({ error: '联系人姓名和电话为必填' }, { status: 400 });
      }

      if (domain) {
        const existing = await queryFirst('SELECT * FROM Agent WHERE domain = ?', domain);
        if (existing) {
          return NextResponse.json({ error: '该域名已被注册' }, { status: 400 });
        }
      }

      const email = sanitizeString(body.email || '').toLowerCase();
      const password = body.password || (() => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        const buf = new Uint8Array(12);
        globalThis.crypto.getRandomValues(buf);
        return Array.from(buf).map((b: number) => chars[b % chars.length]).join('');
      })();

      if (!email) {
        return NextResponse.json({ error: '请提供代理商登录邮箱' }, { status: 400 });
      }

      const existingUser = await queryFirst('SELECT * FROM User WHERE email = ?', email);
      if (existingUser) {
        return NextResponse.json({ error: '该邮箱已注册' }, { status: 400 });
      }

      const passwordHash = await hashPassword(password);
      const now = new Date().toISOString();
      const nowTs = Date.now();

      const userId = `usr_${nowTs}_${Math.random().toString(36).slice(2, 8)}`;
      await execute(
        `INSERT INTO User (id, email, passwordHash, name, phone, role, memberLevel, createdAt)
         VALUES (?, ?, ?, ?, ?, 'agent', 'lifetime', ?)`,
        userId, email, passwordHash, contactName, contactPhone, now
      );

      const agentId = `agt_${nowTs}_${Math.random().toString(36).slice(2, 8)}`;
      const durationDays = body.durationDays || 365;
      const expiryTs = nowTs + durationDays * 24 * 60 * 60 * 1000;

      // 使用 HMAC 签名生成安全授权码
      const signedLicense = await generateAgentLicenseAsync({
        agentId,
        features: ['bazi', 'ziwei', 'qimen', 'meihua'],
        maxUsers: maxUsers || 1000,
        expiryAt: expiryTs,
        domain: domain || undefined,
        level: body.level || 'basic',
        monthlyFee: body.monthlyFee || 99,
      });
      const licenseKey = signedLicense.raw;

      await execute(
        `INSERT INTO Agent (id, userId, companyName, contactName, contactPhone, domain, brandName, licenseKey, licenseExpiry, siteConfig, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        agentId,
        userId,
        sanitizeString(companyName || ''),
        sanitizeString(contactName),
        sanitizeString(contactPhone),
        domain || null,
        sanitizeString(brandName || companyName || ''),
        licenseKey,
        new Date(expiryTs).toISOString(),
        JSON.stringify({
          maxUsers: maxUsers || 1000,
          customPricing: false,
          whiteLabel: false,
          level: body.level || 'basic',
          monthlyFee: body.monthlyFee || 99,
        }),
        now
      );

      const licenseId = `lic_${nowTs}_${Math.random().toString(36).slice(2, 8)}`;
      await execute(
        `INSERT INTO AgentLicense (id, agentId, licenseKey, domain, maxUsers, expiryAt, features, status, createdAt, signature)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
        licenseId,
        agentId,
        licenseKey,
        domain || null,
        maxUsers || 1000,
        new Date(expiryTs).toISOString(),
        JSON.stringify(['bazi', 'ziwei', 'qimen', 'meihua']),
        now,
        signedLicense.signature
      );

      await auditLog({
        userId: adminId,
        action: 'admin_create_agent',
        details: { agentId, email, companyName, domain },
        status: 'success',
      });

      return NextResponse.json({
        agent: { id: agentId, userId, companyName, brandName, domain, licenseKey, licenseExpiry, isActive: 1 },
        credentials: { email, password },
      });
    }

    if (action === 'toggle') {
      const { agentId, isActive } = body;
      await execute('UPDATE Agent SET isActive = ? WHERE id = ?', isActive ? 1 : 0, agentId);
      await execute('UPDATE AgentLicense SET status = ? WHERE agentId = ?', isActive ? 'active' : 'revoked', agentId);

      await auditLog({
        userId: adminId,
        action: 'admin_toggle_agent',
        details: { agentId, isActive },
        status: 'success',
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'regenerate_license') {
      const { agentId } = body;
      const agent = await queryFirst('SELECT * FROM Agent WHERE id = ?', agentId);
      if (!agent) {
        return NextResponse.json({ error: '代理商不存在' }, { status: 404 });
      }

      const nowTs = Date.now();
      const expiryTs = nowTs + 365 * 24 * 60 * 60 * 1000;

      // 使用 HMAC 签名重新生成授权码
      const signedLicense = await generateAgentLicenseAsync({
        agentId,
        features: ['bazi', 'ziwei', 'qimen', 'meihua'],
        maxUsers: (agent as any).siteConfig ? JSON.parse((agent as any).siteConfig).maxUsers || 1000 : 1000,
        expiryAt: expiryTs,
        domain: (agent as any).domain || undefined,
        level: (agent as any).siteConfig ? JSON.parse((agent as any).siteConfig).level || 'basic' : 'basic',
        monthlyFee: (agent as any).siteConfig ? JSON.parse((agent as any).siteConfig).monthlyFee || 99 : 99,
      });
      const newLicenseKey = signedLicense.raw;

      await execute("UPDATE AgentLicense SET status = 'revoked' WHERE agentId = ? AND status = 'active'", agentId);
      await execute('UPDATE Agent SET licenseKey = ?, licenseExpiry = ? WHERE id = ?', newLicenseKey, new Date(expiryTs).toISOString(), agentId);

      const licenseId = `lic_${nowTs}_${Math.random().toString(36).slice(2, 8)}`;
      await execute(
        `INSERT INTO AgentLicense (id, agentId, licenseKey, domain, maxUsers, expiryAt, features, status, createdAt, signature)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
        licenseId,
        agentId,
        newLicenseKey,
        (agent as any).domain || null,
        1000,
        new Date(expiryTs).toISOString(),
        JSON.stringify(['bazi', 'ziwei', 'qimen', 'meihua']),
        new Date().toISOString(),
        signedLicense.signature
      );

      return NextResponse.json({ agent, licenseKey: newLicenseKey, signedLicense });
    }

    return NextResponse.json({ error: '无效操作' }, { status: 400 });
  } catch (error) {
    console.error('代理商管理操作失败:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const body = await req.json();
    const { agentId, companyName, contactName, contactPhone, domain, brandName, logo, licenseExpiry, siteConfig } = body;

    const updateData: any = {};
    if (companyName !== undefined) updateData.companyName = sanitizeString(companyName);
    if (contactName !== undefined) updateData.contactName = sanitizeString(contactName);
    if (contactPhone !== undefined) updateData.contactPhone = sanitizeString(contactPhone);
    if (domain !== undefined) updateData.domain = domain;
    if (brandName !== undefined) updateData.brandName = sanitizeString(brandName);
    if (logo !== undefined) updateData.logo = logo;
    if (licenseExpiry !== undefined) updateData.licenseExpiry = licenseExpiry ? new Date(licenseExpiry).toISOString() : null;
    if (siteConfig !== undefined) updateData.siteConfig = JSON.stringify(siteConfig);

    const sets: string[] = [];
    const params: any[] = [];
    if (updateData.companyName !== undefined) { sets.push('companyName = ?'); params.push(updateData.companyName); }
    if (updateData.contactName !== undefined) { sets.push('contactName = ?'); params.push(updateData.contactName); }
    if (updateData.contactPhone !== undefined) { sets.push('contactPhone = ?'); params.push(updateData.contactPhone); }
    if (updateData.domain !== undefined) { sets.push('domain = ?'); params.push(updateData.domain); }
    if (updateData.brandName !== undefined) { sets.push('brandName = ?'); params.push(updateData.brandName); }
    if (updateData.logo !== undefined) { sets.push('logo = ?'); params.push(updateData.logo); }
    if (updateData.licenseExpiry !== undefined) { sets.push('licenseExpiry = ?'); params.push(updateData.licenseExpiry); }
    if (updateData.siteConfig !== undefined) { sets.push('siteConfig = ?'); params.push(updateData.siteConfig); }

    params.push(agentId);
    await execute(`UPDATE Agent SET ${sets.join(', ')} WHERE id = ?`, ...params);

    await auditLog({
      userId: session.sub,
      action: 'admin_update_user',
      details: { agentId, updated: Object.keys(updateData) },
      status: 'success',
    });

    const agent = await queryFirst('SELECT * FROM Agent WHERE id = ?', agentId);
    return NextResponse.json({ agent });
  } catch (error) {
    console.error('更新代理商失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { allowed, session } = await requireAdmin(req);
    if (!allowed) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: '缺少代理商ID' }, { status: 400 });
    }

    const agent = await queryFirst('SELECT * FROM Agent WHERE id = ?', id);
    if (!agent) {
      return NextResponse.json({ error: '代理商不存在' }, { status: 404 });
    }

    await execute("DELETE FROM AgentLicense WHERE agentId = ?", id);
    await execute("DELETE FROM Agent WHERE id = ?", id);

    await auditLog({
      userId: session.sub,
      action: 'admin_delete_agent',
      details: { agentId: id, brandName: agent.brandName },
      status: 'success',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除代理商失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}