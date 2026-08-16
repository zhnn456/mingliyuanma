-- ============================================================
-- v5.0 品牌定制 + SaaS分站管理 数据库迁移
-- ============================================================

-- ===== 1. Agent 表新增品牌定制字段 =====

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Agent' AND COLUMN_NAME = 'siteName');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `Agent` ADD COLUMN `siteName` VARCHAR(100) NULL COMMENT ''站点名称''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Agent' AND COLUMN_NAME = 'themeColor');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `Agent` ADD COLUMN `themeColor` VARCHAR(20) NULL DEFAULT ''#D4916A'' COMMENT ''主题色''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Agent' AND COLUMN_NAME = 'customerServiceQR');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `Agent` ADD COLUMN `customerServiceQR` VARCHAR(500) NULL COMMENT ''客服二维码图片URL''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Agent' AND COLUMN_NAME = 'contactEmail');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `Agent` ADD COLUMN `contactEmail` VARCHAR(100) NULL COMMENT ''联系邮箱''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Agent' AND COLUMN_NAME = 'contactWechat');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `Agent` ADD COLUMN `contactWechat` VARCHAR(100) NULL COMMENT ''微信号''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Agent' AND COLUMN_NAME = 'footerText');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `Agent` ADD COLUMN `footerText` VARCHAR(500) NULL COMMENT ''页脚文字''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Agent' AND COLUMN_NAME = 'announcement');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `Agent` ADD COLUMN `announcement` TEXT NULL COMMENT ''站点公告''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ===== 2. Agent 表新增SaaS分站字段 =====

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Agent' AND COLUMN_NAME = 'parentAgentId');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `Agent` ADD COLUMN `parentAgentId` VARCHAR(100) NULL COMMENT ''上级代理商ID''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Agent' AND COLUMN_NAME = 'subAgentCommissionRate');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `Agent` ADD COLUMN `subAgentCommissionRate` FLOAT NOT NULL DEFAULT 0.4 COMMENT ''下级分站分润比例''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Agent' AND COLUMN_NAME = 'maxSubAgents');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `Agent` ADD COLUMN `maxSubAgents` INT NOT NULL DEFAULT 0 COMMENT ''最大下级分站数(0=不允许)''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Agent' AND COLUMN_NAME = 'subAgentMonthlyFee');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `Agent` ADD COLUMN `subAgentMonthlyFee` FLOAT NOT NULL DEFAULT 99 COMMENT ''下级分站月费(元)''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 索引
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Agent' AND INDEX_NAME = 'idx_parentAgentId');
SET @sql = IF(@idx_exists = 0, 'ALTER TABLE `Agent` ADD INDEX `idx_parentAgentId` (`parentAgentId`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
