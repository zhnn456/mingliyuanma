/**
 * 代理商心跳接口
 * 源码部署站定期调用此接口报告运行状态
 * 更新 Agent 表的 lastSyncAt / lastVersion / systemStatus
 */
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, execute } from '@/lib/d1';
import { verifyLicenseSignature } from '@/lib/license-generator';

export async function POST(req: NextRequest) {
  try {
    const { license, domain, version, agentId } = await req.json();

    if (!license || !domain) {
      return NextResponse.json({ ok: false, reason: '缺少必要参数' }, { status: 400 });
    }

    // 验证授权码签名
    const verifyResult = await verifyLicenseSignature(license, domain);
    if (!verifyResult.valid) {
      return NextResponse.json({ ok: false, reason: '授权码无效' }, { status: 403 });
    }

    // 查找 Agent 记录
    let agent = await queryFirst('SELECT id FROM Agent WHERE licenseKey = ?', license) as any;
    if (!agent) {
      // 自动创建 Agent 记录（首次心跳）
      const id = agentId || `agt_${Date.now()}`;
      await execute(
        `INSERT INTO Agent (id, licenseKey, domain, lastSyncAt, lastVersion, systemStatus, isActive, createdAt)
         VALUES (?, ?, ?, NOW(), ?, 'online', 1, NOW())`,
        id, license, domain, version || 'v4.0.0'
      );
    } else {
      // 更新心跳信息
      await execute(
        `UPDATE Agent SET lastSyncAt = NOW(), lastVersion = ?, systemStatus = 'online', isActive = 1 WHERE licenseKey = ?`,
        version || 'v4.0.0', license
      );
    }

    return NextResponse.json({ ok: true, syncedAt: new Date().toISOString() });
  } catch (error: any) {
    console.error('[Heartbeat] 错误:', error?.message);
    return NextResponse.json({ ok: false, reason: '服务器错误' }, { status: 500 });
  }
}
