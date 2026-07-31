import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, execute } from '@/lib/d1';
import { verifyLicenseSignature } from '@/lib/license-generator';

/**
 * 代理商同步 API
 * 代理商 Worker 启动时调用此接口，向中央服务器报告状态
 * POST /api/agent/sync
 * Body: { license, agentId, domain, version, status }
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { license, agentId, domain, version, status } = body;

    if (!license || !agentId || !domain) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 验证授权码
    const verifyResult = await verifyLicenseSignature(license, domain);
    if (!verifyResult.valid) {
      return NextResponse.json({ error: `授权验证失败: ${verifyResult.reason}` }, { status: 403 });
    }

    // 验证 agentId 匹配
    if (verifyResult.payload?.agentId !== agentId) {
      return NextResponse.json({ error: 'agentId 与授权码不匹配' }, { status: 403 });
    }

    // 查询代理商
    const agent = await queryFirst('SELECT * FROM Agent WHERE id = ?', agentId);
    if (!agent) {
      return NextResponse.json({ error: '代理商不存在' }, { status: 404 });
    }

    // 更新代理商状态
    await execute(
      `UPDATE Agent SET lastSyncAt = ?, lastVersion = ?, systemStatus = ? WHERE id = ?`,
      new Date().toISOString(),
      version || 'v4.0.0',
      status || 'online',
      agentId
    );

    // 记录同步日志
    await execute(
      `INSERT INTO AgentSyncLog (id, agentId, syncTime, version, status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      `sync_${Date.now()}`,
      agentId,
      new Date().toISOString(),
      version || 'v4.0.0',
      status || 'online',
      new Date().toISOString()
    );

    return NextResponse.json({
      success: true,
      agentId,
      payload: verifyResult.payload,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error('代理商同步失败:', error);
    return NextResponse.json({ error: '同步失败' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');
    const license = searchParams.get('license');

    if (!agentId) {
      return NextResponse.json({ error: '缺少 agentId' }, { status: 400 });
    }

    // 验证授权码
    if (license) {
      const verifyResult = await verifyLicenseSignature(license);
      if (!verifyResult.valid) {
        return NextResponse.json({ error: `授权验证失败: ${verifyResult.reason}` }, { status: 403 });
      }
      if (verifyResult.payload?.agentId !== agentId) {
        return NextResponse.json({ error: 'agentId 与授权码不匹配' }, { status: 403 });
      }
    }

    const agent = await queryFirst(`
      SELECT a.*, u.email, u.name as contactName
      FROM Agent a
      JOIN User u ON a.userId = u.id
      WHERE a.id = ?
    `, agentId);

    if (!agent) {
      return NextResponse.json({ error: '代理商不存在' }, { status: 404 });
    }

    return NextResponse.json({
      agent,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取代理商信息失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
