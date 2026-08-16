-- ============================================================
-- 知微阁 v4.0.0 → v4.1.0 数据库迁移脚本
-- 新增：源码客户升级权益管理字段
-- 安全：使用 IF NOT EXISTS，可重复执行
-- ============================================================

SET NAMES utf8mb4;

-- ============================================================
-- 1. Agent 表新增升级权益字段
-- ============================================================

-- upgradePlan: 升级方案 (free=免费1年 / annual=年度付费 / none=无)
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Agent' AND COLUMN_NAME = 'upgradePlan');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `Agent` ADD COLUMN `upgradePlan` VARCHAR(20) DEFAULT ''none''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- upgradeExpiryAt: 升级服务到期时间 (null=无升级权益)
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Agent' AND COLUMN_NAME = 'upgradeExpiryAt');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `Agent` ADD COLUMN `upgradeExpiryAt` DATETIME NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- upgradeToken: 升级验证令牌（每次检查更新时刷新，用于下载验证）
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Agent' AND COLUMN_NAME = 'upgradeToken');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `Agent` ADD COLUMN `upgradeToken` VARCHAR(500) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================
-- 2. AgentLicense 表新增升级权益字段（冗余，供客户端验证）
-- ============================================================

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'AgentLicense' AND COLUMN_NAME = 'upgradeExpiryAt');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `AgentLicense` ADD COLUMN `upgradeExpiryAt` DATETIME NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'AgentLicense' AND COLUMN_NAME = 'upgradePlan');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `AgentLicense` ADD COLUMN `upgradePlan` VARCHAR(20) DEFAULT ''none''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================
-- 3. 创建版本更新包记录表 UpgradePackage
-- ============================================================
CREATE TABLE IF NOT EXISTS `UpgradePackage` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `version` VARCHAR(50) NOT NULL,
  `minVersion` VARCHAR(50),
  `filePath` VARCHAR(500) NOT NULL,
  `fileSize` BIGINT DEFAULT 0,
  `checksum` VARCHAR(128),
  `changelog` TEXT,
  `requiresMigration` INT DEFAULT 0,
  `migrationScript` VARCHAR(500),
  `status` VARCHAR(50) DEFAULT 'published',
  `publishedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `UpgradePackage_version_key` (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. 创建升级下载日志表 UpgradeDownloadLog
-- ============================================================
CREATE TABLE IF NOT EXISTS `UpgradeDownloadLog` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `agentId` VARCHAR(255),
  `licenseKey` VARCHAR(500),
  `domain` VARCHAR(255),
  `version` VARCHAR(50) NOT NULL,
  `clientIP` VARCHAR(100),
  `downloadToken` VARCHAR(500),
  `status` VARCHAR(50) DEFAULT 'success',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 索引
-- ALTER TABLE ADD INDEX (see below) `UpgradeDownloadLog_agentId_idx` ON `UpgradeDownloadLog`(`agentId`);
-- ALTER TABLE ADD INDEX (see below) `UpgradeDownloadLog_createdAt_idx` ON `UpgradeDownloadLog`(`createdAt`);

-- ============================================================
-- 5. 为已有源码买断代理商初始化免费升级权益
-- ============================================================
UPDATE `Agent` 
SET `upgradePlan` = 'free', 
    `upgradeExpiryAt` = DATE_ADD(NOW(), INTERVAL 365 DAY)
WHERE `level` = 'source' 
  AND (`upgradePlan` IS NULL OR `upgradePlan` = 'none' OR `upgradePlan` = '');

-- ============================================================
-- 完成
-- ============================================================
SELECT 'v4.1.0 migration completed' AS result;