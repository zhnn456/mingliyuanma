import { NextRequest, NextResponse } from 'next/server';
import { requireAgent } from '@/lib/auth-server';
import { queryFirst, queryAll, execute } from '@/lib/d1';
import { auditLog } from '@/lib/audit';

/**
 * 源码部署代理 - 续费管理 API
 * GET: 返回续费选项 + 当前授权状态 + 续费记录
 * POST: 提交续费申请（写入 RenewRecord 表）
 *
 * 续费类型：
 * - annual_renew: 年度授权续费 1980元/年
 * - update_service: 更新服务续费 980元/年
 * - upgrade_lifetime: 升级永久授权 6800元（年度用户专享）
 */

const RENEW_OPTIONS = {
  annualRenew: { price: 1980, name: '年度授权续费', desc: '延长1年授权期限，含当年更新服务' },
  updateServiceRenew: { price: 980, name: '更新服务续费', desc: '延长1年更新服务，可获取新版本' },
  upgradeLifetime: { price: 6800, name: '升级永久授权', desc: '从年度授权升级为永久买断，含1年更新服务' },
};

export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAgent(req);
    if (!allowed || !session) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const agent = await queryFirst('SELECT * FROM Agent WHERE userId = ?', session.sub) as any;
    if (!agent) {
      return NextResponse.json({ error: '代理商信息不存在' }, { status: 404 });
    }

    let siteConfig: any = {};
    try {
      siteConfig = JSON.parse(agent.siteConfig || '{}');
    } catch {}

    // 查询续费记录
    let records: any[] = [];
    try {
      records = await queryAll(
        'SELECT * FROM RenewRecord WHERE agentId = ? ORDER BY createdAt DESC LIMIT 20',
        agent.id
      );
    } catch {
      // RenewRecord 表可能不存在，返回空数组
      records = [];
    }

    return NextResponse.json({
      agent: {
        id: agent.id,
        brandName: agent.brandName,
        level: agent.level || (siteConfig.deployMode || siteConfig.level === 'source' ? 'source' : 'saas'),
        planType: siteConfig.planType || agent.plan || 'annual',
        licenseExpiry: agent.licenseExpiry,
        updateServiceExpiry: siteConfig.updateServiceExpiry || null,
      },
      options: RENEW_OPTIONS,
      records,
    });
  } catch (error) {
    console.error('获取续费信息失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed, session } = await requireAgent(req);
    if (!allowed || !session) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const body = await req.json();
    const { type } = body;

    // 校验续费类型
    const validTypes = ['annual_renew', 'update_service', 'upgrade_lifetime'];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json({ error: '无效的续费类型' }, { status: 400 });
    }

    const agent = await queryFirst('SELECT * FROM Agent WHERE userId = ?', session.sub) as any;
    if (!agent) {
      return NextResponse.json({ error: '代理商信息不存在' }, { status: 404 });
    }

    // 根据类型获取价格
    const priceMap: Record<string, number> = {
      annual_renew: 1980,
      update_service: 980,
      upgrade_lifetime: 6800,
    };

    const amount = priceMap[type] || 0;
    if (amount === 0) {
      return NextResponse.json({ error: '无效的续费类型' }, { status: 400 });
    }

    const id = `renew_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    // 确保 RenewRecord 表存在
    await ensureRenewRecordTable();

    await execute(
      `INSERT INTO RenewRecord (id, agentId, type, amount, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      id, agent.id, type, amount, 'pending', now, now
    );

    // 记录审计日志
    try {
      await auditLog({
        userId: session.sub,
        action: 'agent_login' as any,
        details: { action: 'agent_renew_apply', resourceId: id, brandName: agent.brandName, type, amount },
        status: 'success',
      });
    } catch {}

    return NextResponse.json({
      success: true,
      id,
      message: '续费申请已提交，平台客服会尽快与您联系确认支付方式',
    });
  } catch (error) {
    console.error('提交续费申请失败:', error);
    return NextResponse.json({ error: '提交失败' }, { status: 500 });
  }
}

/** 确保 RenewRecord 表存在 */
async function ensureRenewRecordTable() {
  await execute(
    `CREATE TABLE IF NOT EXISTS \`RenewRecord\` (
      \`id\` VARCHAR(64) NOT NULL PRIMARY KEY,
      \`agentId\` VARCHAR(64) NOT NULL,
      \`type\` VARCHAR(32) NOT NULL,
      \`amount\` DECIMAL(10,2) NOT NULL,
      \`status\` VARCHAR(20) NOT NULL DEFAULT 'pending',
      \`remark\` TEXT NULL,
      \`auditorId\` VARCHAR(64) NULL,
      \`auditRemark\` TEXT NULL,
      \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` DATETIME NULL,
      INDEX \`idx_renew_agentId\` (\`agentId\`),
      INDEX \`idx_renew_status\` (\`status\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
}
