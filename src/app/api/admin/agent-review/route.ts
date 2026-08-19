/**
 * 代理商审核API
 * 功能：代理商入驻申请审核（通过/拒绝），管理代理商授权状态
 * 用途：审核新代理商申请，控制代理商入驻流程
 */
import { requirePrimaryAdmin } from '@/lib/auth-server';
import { auditLog } from '@/lib/audit';
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll, execute, batch } from '@/lib/d1';

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requirePrimaryAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status') || '';
    const keyword = searchParams.get('keyword') || '';

    let sql = `SELECT a.*, u.email as userEmail, u.name as userName, u.phone as userPhone,
      al.id as licenseId, al.licenseKey, al.domain as licenseDomain, al.features, al.status as licenseStatus,
      al.createdAt as licenseCreatedAt, al.updatedAt as licenseUpdatedAt
      FROM Agent a
      LEFT JOIN User u ON a.userId = u.id
      LEFT JOIN AgentLicense al ON al.agentId = a.id
      WHERE 1=1`;
    let countSql = `SELECT COUNT(*) as total FROM Agent a LEFT JOIN AgentLicense al ON al.agentId = a.id WHERE 1=1`;
    const params: any[] = [];

    if (status === 'pending') {
      sql += " AND (al.status = 'pending' OR al.status IS NULL)";
      countSql += " AND (al.status = 'pending' OR al.status IS NULL)";
    } else if (status === 'active') {
      sql += " AND al.status = 'active'";
      countSql += " AND al.status = 'active'";
    } else if (status === 'rejected') {
      sql += " AND al.status = 'rejected'";
      countSql += " AND al.status = 'rejected'";
    }

    if (keyword) {
      sql += ' AND (a.companyName LIKE ? OR a.domain LIKE ? OR a.brandName LIKE ?)';
      countSql += ' AND (a.companyName LIKE ? OR a.domain LIKE ? OR a.brandName LIKE ?)';
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw);
    }

    sql += ` ORDER BY a.createdAt DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;

    const agents = await queryAll(sql, ...params);
    const countParams: any[] = [];
    if (keyword) { const kw = `%${keyword}%`; countParams.push(kw, kw, kw); }
    const totalRow = await queryFirst(countSql, ...countParams) as any;
    const total = totalRow?.total || 0;

    const list = agents.map((a: any) => {
      let rejectReason = '';
      if (a.features && a.licenseStatus === 'rejected') {
        try {
          const parsed = typeof a.features === 'string' ? JSON.parse(a.features) : a.features;
          rejectReason = parsed?.rejectReason || '';
        } catch {
          rejectReason = '';
        }
      }
      return {
        ...a,
        rejectReason,
        reviewStatus: a.licenseStatus || (a.isActive ? 'active' : 'pending'),
      };
    });

    return NextResponse.json({ agents: list, total, page, pageSize });
  } catch (error) {
    console.error('获取资质审核列表失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { allowed, session } = await requirePrimaryAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { agentId, action, rejectReason } = await req.json();
    if (!agentId || !action) return NextResponse.json({ error: '参数不足' }, { status: 400 });
    if (!['approve', 'reject'].includes(action)) return NextResponse.json({ error: '无效操作' }, { status: 400 });

    const now = new Date().toISOString();
    const agent = await queryFirst('SELECT * FROM Agent WHERE id = ?', agentId);
    if (!agent) return NextResponse.json({ error: '代理商不存在' }, { status: 404 });

    const license = await queryFirst('SELECT * FROM AgentLicense WHERE agentId = ?', agentId);

    if (action === 'approve') {
      const statements: Array<{ sql: string; params?: any[] }> = [
        { sql: 'UPDATE Agent SET isActive = ?, updatedAt = ? WHERE id = ?', params: [1, now, agentId] },
      ];

      if (license) {
        let features = license.features;
        try {
          const parsed = features ? (typeof features === 'string' ? JSON.parse(features) : features) : {};
          delete parsed.rejectReason;
          features = JSON.stringify(parsed);
        } catch {
          features = null;
        }
        statements.push({
          sql: 'UPDATE AgentLicense SET status = ?, features = ?, updatedAt = ? WHERE id = ?',
          params: ['active', features, now, license.id],
        });
      } else {
        const newLicenseId = `al_${Date.now()}`;
        const licenseKey = agent.licenseKey || `LIC-${agentId.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
        statements.push({
          sql: `INSERT INTO AgentLicense (id, agentId, licenseKey, domain, status, features, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, 'active', '{}', ?, ?)`,
          params: [newLicenseId, agentId, licenseKey, agent.domain || null, now, now],
        });
      }

      await batch(statements);
      return NextResponse.json({ success: true, status: 'active' });
    } else {
      if (!rejectReason || !String(rejectReason).trim()) {
        return NextResponse.json({ error: '拒绝原因不能为空' }, { status: 400 });
      }
      const reason = String(rejectReason).trim();
      const statements: Array<{ sql: string; params?: any[] }> = [
        { sql: 'UPDATE Agent SET isActive = ?, updatedAt = ? WHERE id = ?', params: [0, now, agentId] },
      ];

      if (license) {
        let features: any = {};
        try {
          features = license.features ? (typeof license.features === 'string' ? JSON.parse(license.features) : license.features) : {};
        } catch {}
        features.rejectReason = reason;
        features.rejectedAt = now;
        statements.push({
          sql: 'UPDATE AgentLicense SET status = ?, features = ?, updatedAt = ? WHERE id = ?',
          params: ['rejected', JSON.stringify(features), now, license.id],
        });
      } else {
        const newLicenseId = `al_${Date.now()}`;
        const licenseKey = agent.licenseKey || `LIC-${agentId.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
        statements.push({
          sql: `INSERT INTO AgentLicense (id, agentId, licenseKey, domain, status, features, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, 'rejected', ?, ?, ?)`,
          params: [newLicenseId, agentId, licenseKey, agent.domain || null, JSON.stringify({ rejectReason: reason, rejectedAt: now }), now, now],
        });
      }

      await batch(statements);
      await auditLog({
        userId: session?.sub,
        action: 'admin_update_agent',
        details: { agentId, status: 'rejected' },
        status: 'success',
      });
      return NextResponse.json({ success: true, status: 'rejected', rejectReason: reason });
    }
  } catch (error) {
    console.error('资质审核失败:', error);
    return NextResponse.json({ error: '审核失败' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { allowed } = await requirePrimaryAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const idsStr = searchParams.get('ids');
    const action = searchParams.get('action') || 'reject';
    if (!idsStr) return NextResponse.json({ error: '缺少 agentId 列表' }, { status: 400 });

    const ids = idsStr.split(',').map((s: string) => s.trim()).filter(Boolean);
    if (ids.length === 0) return NextResponse.json({ error: '无效的 agentId 列表' }, { status: 400 });
    if (!['approve', 'reject'].includes(action)) return NextResponse.json({ error: '无效操作' }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const rejectReason = body?.rejectReason || '批量审核';

    const now = new Date().toISOString();
    const statements: Array<{ sql: string; params?: any[] }> = [];

    for (const agentId of ids) {
      if (action === 'approve') {
        statements.push({
          sql: 'UPDATE Agent SET isActive = ?, updatedAt = ? WHERE id = ?',
          params: [1, now, agentId],
        });
        statements.push({
          sql: "UPDATE AgentLicense SET status = 'active', updatedAt = ? WHERE agentId = ?",
          params: [now, agentId],
        });
      } else {
        statements.push({
          sql: 'UPDATE Agent SET isActive = ?, updatedAt = ? WHERE id = ?',
          params: [0, now, agentId],
        });
        const license = await queryFirst('SELECT * FROM AgentLicense WHERE agentId = ?', agentId);
        let features: any = {};
        try {
          features = license?.features ? (typeof license.features === 'string' ? JSON.parse(license.features) : license.features) : {};
        } catch {}
        features.rejectReason = rejectReason;
        features.rejectedAt = now;
        statements.push({
          sql: "UPDATE AgentLicense SET status = 'rejected', features = ?, updatedAt = ? WHERE agentId = ?",
          params: [JSON.stringify(features), now, agentId],
        });
      }
    }

    await batch(statements);
    return NextResponse.json({ success: true, updated: ids.length, status: action === 'approve' ? 'active' : 'rejected' });
  } catch (error) {
    console.error('批量审核失败:', error);
    return NextResponse.json({ error: '批量审核失败' }, { status: 500 });
  }
}
