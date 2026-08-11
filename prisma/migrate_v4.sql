-- ============================================================
-- v4.0.0 商源版本 - SaaS 多代理商体系数据库迁移
-- 执行方式: mysql -u ming8 -p ming8_db < prisma/migrate_v4.sql
-- ============================================================

-- ============================================================
-- 1. 版本管理表
-- ============================================================
CREATE TABLE IF NOT EXISTS "Version" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "version" TEXT NOT NULL UNIQUE,
    "title" TEXT,
    "category" TEXT DEFAULT '',
    "changelog" TEXT DEFAULT '',
    "downloadUrl" TEXT,
    "checksum" TEXT,
    "isLatest" INTEGER NOT NULL DEFAULT 0,
    "isDeprecated" INTEGER NOT NULL DEFAULT 0,
    "releaseAt" TEXT NOT NULL DEFAULT (datetime('now')),
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 初始化 v4.0.0 版本记录
INSERT INTO "Version" (id, version, title, category, changelog, isLatest, releaseAt)
SELECT 'ver_v4_init', 'v4.0.0', '商源：代理商 SaaS 分发体系', '主版本更新',
'[{"title":"新增","items":["HMAC-SHA256签名授权码体系","代理商双重验证机制（本地+远程）","中心化版本控制服务器","自动分润计算引擎","中央支付代理接口","系统完整性校验","离线宽限期容错机制","源码水印防篡改"]},{"title":"改进","items":["中间件增加代理商License验证","版本号构建时自动注入","结算流程优化"]}]',
1, datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM "Version" WHERE version = 'v4.0.0');

-- ============================================================
-- 2. 分润记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS "CommissionRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderAmount" REAL NOT NULL,
    "commissionRate" REAL NOT NULL,
    "commissionAmount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "period" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
    "updatedAt" TEXT
);

CREATE INDEX IF NOT EXISTS "idx_commission_agent" ON "CommissionRecord" ("agentId");
CREATE INDEX IF NOT EXISTS "idx_commission_status" ON "CommissionRecord" ("status");
CREATE INDEX IF NOT EXISTS "idx_commission_period" ON "CommissionRecord" ("period");

-- ============================================================
-- 3. 结算单表
-- ============================================================
CREATE TABLE IF NOT EXISTS "Settlement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "note" TEXT,
    "createdBy" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
    "updatedAt" TEXT
);

CREATE INDEX IF NOT EXISTS "idx_settlement_agent" ON "Settlement" ("agentId");
CREATE INDEX IF NOT EXISTS "idx_settlement_status" ON "Settlement" ("status");
CREATE INDEX IF NOT EXISTS "idx_settlement_period" ON "Settlement" ("period");

-- ============================================================
-- 4. 授权验证日志表
-- ============================================================
CREATE TABLE IF NOT EXISTS "LicenseLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT,
    "licenseKey" TEXT,
    "domain" TEXT,
    "action" TEXT DEFAULT 'verify',
    "result" TEXT,
    "ip" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS "idx_licenselog_agent" ON "LicenseLog" ("agentId");
CREATE INDEX IF NOT EXISTS "idx_licenselog_created" ON "LicenseLog" ("createdAt");

-- ============================================================
-- 5. 代理商授权码升级（如果已有数据，更新格式）
-- ============================================================
-- 注意：旧授权码格式 AGT-xxx-xxx 保持兼容
-- 新授权码格式 LIC.payload.signature

-- ============================================================
-- 6. 系统配置表增强
-- ============================================================
-- 插入 v4.0.0 版本配置
INSERT INTO "SiteConfig" (id, key, value, category, updatedAt)
SELECT 'cfg_v4_version', 'system_version', 'v4.0.0', 'system', datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM "SiteConfig" WHERE key = 'system_version');

INSERT INTO "SiteConfig" (id, key, value, category, updatedAt)
SELECT 'cfg_v4_codename', 'system_codename', '商源', 'system', datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM "SiteConfig" WHERE key = 'system_codename');

INSERT INTO "SiteConfig" (id, key, value, category, updatedAt)
SELECT 'cfg_v4_center_api', 'center_api_url', 'https://mingli-yuanma.zhnn456.workers.dev', 'system', datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM "SiteConfig" WHERE key = 'center_api_url');

-- 分润比例配置
INSERT INTO "SiteConfig" (id, key, value, category, updatedAt)
SELECT 'cfg_commission_basic', 'commission_rate_basic', '0.30', 'commission', datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM "SiteConfig" WHERE key = 'commission_rate_basic');

INSERT INTO "SiteConfig" (id, key, value, category, updatedAt)
SELECT 'cfg_commission_standard', 'commission_rate_standard', '0.40', 'commission', datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM "SiteConfig" WHERE key = 'commission_rate_standard');

INSERT INTO "SiteConfig" (id, key, value, category, updatedAt)
SELECT 'cfg_commission_premium', 'commission_rate_premium', '0.50', 'commission', datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM "SiteConfig" WHERE key = 'commission_rate_premium');

-- ============================================================
-- 迁移完成
-- ============================================================
SELECT 'v4.0.0 migration completed' as status;
