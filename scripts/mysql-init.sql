-- ============================================================
-- 知微阁站 MySQL 初始化脚本
-- 从 Prisma Schema (SQLite) 迁移到 MySQL
-- 数据库：ming8_db
-- 版本：v4.0.0
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. 用户表 User
-- ============================================================
CREATE TABLE IF NOT EXISTS `User` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `email` VARCHAR(255) UNIQUE,
  `passwordHash` VARCHAR(500) NOT NULL,
  `name` VARCHAR(255),
  `phone` VARCHAR(50),
  `avatar` VARCHAR(500),
  `role` VARCHAR(50) NOT NULL DEFAULT 'user',
  `memberLevel` VARCHAR(50) NOT NULL DEFAULT 'basic',
  `memberExpiryAt` DATETIME,
  `agentId` VARCHAR(255),
  `dailyUsage` INT NOT NULL DEFAULT 0,
  `lastUsageDate` VARCHAR(50),
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- 索引由底部存储过程 add_index_if_missing 安全创建（支持重复执行）

-- ============================================================
-- 2. 代理商表 Agent
-- ============================================================
CREATE TABLE IF NOT EXISTS `Agent` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `userId` VARCHAR(255) NOT NULL,
  `companyName` VARCHAR(255),
  `contactName` VARCHAR(255),
  `contactPhone` VARCHAR(50),
  `domain` VARCHAR(255),
  `brandName` VARCHAR(255),
  `logo` VARCHAR(500),
  `siteConfig` TEXT,
  `licenseKey` VARCHAR(500),
  `licenseExpiry` DATETIME,
  `level` VARCHAR(50) DEFAULT 'saas',
  `plan` VARCHAR(50) DEFAULT 'trial',
  `planExpiry` DATETIME,
  `referralCode` VARCHAR(255),
  `maxCustomers` INT DEFAULT 500,
  `commissionRate` DOUBLE DEFAULT 0.3,
  `totalCommission` DOUBLE DEFAULT 0,
  `pendingCommission` DOUBLE DEFAULT 0,
  `currentMonthGMV` DOUBLE DEFAULT 0,
  `settlementCycle` VARCHAR(50) DEFAULT 'weekly',
  `balance` DOUBLE DEFAULT 0,
  `bankName` VARCHAR(255),
  `bankAccount` VARCHAR(255),
  `bankAccountName` VARCHAR(255),
  `lastSyncAt` DATETIME,
  `lastVersion` VARCHAR(50),
  `systemStatus` VARCHAR(50) DEFAULT 'online',
  `subdomain` VARCHAR(255),
  `customDomain` VARCHAR(255),
  `customDomainExpiry` DATETIME,
  `isActive` INT DEFAULT 1,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `Agent_userId_key` (`userId`),
  UNIQUE KEY `Agent_domain_key` (`domain`),
  UNIQUE KEY `Agent_licenseKey_key` (`licenseKey`),
  UNIQUE KEY `Agent_referralCode_key` (`referralCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- 索引由底部存储过程 add_index_if_missing 安全创建（支持重复执行）

-- ============================================================
-- 3. 授权码表 AgentLicense
-- ============================================================
CREATE TABLE IF NOT EXISTS `AgentLicense` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `agentId` VARCHAR(255) NOT NULL,
  `licenseKey` VARCHAR(500) NOT NULL,
  `domain` VARCHAR(255),
  `issuedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expiryAt` DATETIME,
  `maxUsers` INT DEFAULT 1000,
  `features` TEXT,
  `status` VARCHAR(50) NOT NULL DEFAULT 'active',
  `signature` VARCHAR(500),
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `AgentLicense_licenseKey_key` (`licenseKey`),
  UNIQUE KEY `AgentLicense_domain_key` (`domain`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ALTER TABLE ADD INDEX (see below) `AgentLicense_agentId_idx` ON `AgentLicense`(`agentId`);
-- ALTER TABLE ADD INDEX (see below) `AgentLicense_status_idx` ON `AgentLicense`(`status`);

-- ============================================================
-- 4. 代理商站点配置表 AgentSiteConfig
-- ============================================================
CREATE TABLE IF NOT EXISTS `AgentSiteConfig` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `agentId` VARCHAR(255) NOT NULL,
  `key` VARCHAR(255) NOT NULL,
  `value` TEXT,
  `category` VARCHAR(50) NOT NULL DEFAULT 'general',
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `AgentSiteConfig_agentId_key_key` (`agentId`, `key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ALTER TABLE ADD INDEX (see below) `AgentSiteConfig_agentId_idx` ON `AgentSiteConfig`(`agentId`);

-- ============================================================
-- 5. 订单表 Order
-- ============================================================
CREATE TABLE IF NOT EXISTS `Order` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `orderNo` VARCHAR(255),
  `userId` VARCHAR(255) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `targetId` VARCHAR(255),
  `amount` DOUBLE NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `paymentMethod` VARCHAR(50),
  `transactionId` VARCHAR(255),
  `paidAt` DATETIME,
  `orderData` TEXT,
  `agentId` VARCHAR(255),
  `agentReferralCode` VARCHAR(255),
  `isNewCustomer` INT DEFAULT 0,
  `commissionRate` DOUBLE,
  `commissionAmount` DOUBLE DEFAULT 0,
  `commissionSettled` INT DEFAULT 0,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `Order_orderNo_key` (`orderNo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ALTER TABLE ADD INDEX (see below) `Order_userId_idx` ON `Order`(`userId`);
-- ALTER TABLE ADD INDEX (see below) `Order_status_idx` ON `Order`(`status`);
-- ALTER TABLE ADD INDEX (see below) `Order_type_idx` ON `Order`(`type`);
-- ALTER TABLE ADD INDEX (see below) `Order_agentId_idx` ON `Order`(`agentId`);

-- ============================================================
-- 6. 用户灵珠余额表 UserPoints
-- ============================================================
CREATE TABLE IF NOT EXISTS `UserPoints` (
  `userId` VARCHAR(255) NOT NULL PRIMARY KEY,
  `balance` INT DEFAULT 0,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. 积分流水表 PointsLedger
-- ============================================================
CREATE TABLE IF NOT EXISTS `PointsLedger` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `userId` VARCHAR(255) NOT NULL,
  `amount` INT NOT NULL,
  `balance` INT NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `remark` VARCHAR(500),
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ALTER TABLE ADD INDEX (see below) `PointsLedger_userId_idx` ON `PointsLedger`(`userId`);

-- ============================================================
-- 8. 优惠码表 Coupon
-- ============================================================
CREATE TABLE IF NOT EXISTS `Coupon` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `code` VARCHAR(100) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `discountType` VARCHAR(50) DEFAULT 'percent',
  `discountValue` DOUBLE DEFAULT 0,
  `minAmount` DOUBLE DEFAULT 0,
  `maxDiscount` DOUBLE,
  `totalCount` INT DEFAULT 100,
  `usedCount` INT DEFAULT 0,
  `expiryDate` DATETIME,
  `isActive` INT DEFAULT 1,
  `description` VARCHAR(500),
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `Coupon_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. 八字记录表 BaziRecord
-- ============================================================
CREATE TABLE IF NOT EXISTS `BaziRecord` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `userId` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255),
  `gender` VARCHAR(50) NOT NULL,
  `birthDate` VARCHAR(50) NOT NULL,
  `birthTime` VARCHAR(50) NOT NULL,
  `isLunar` TINYINT(1) NOT NULL DEFAULT 0,
  `yearGan` VARCHAR(50) NOT NULL,
  `yearZhi` VARCHAR(50) NOT NULL,
  `monthGan` VARCHAR(50) NOT NULL,
  `monthZhi` VARCHAR(50) NOT NULL,
  `dayGan` VARCHAR(50) NOT NULL,
  `dayZhi` VARCHAR(50) NOT NULL,
  `hourGan` VARCHAR(50) NOT NULL,
  `hourZhi` VARCHAR(50) NOT NULL,
  `wuxing` TEXT,
  `dayun` TEXT,
  `liunian` TEXT,
  `interpretation` TEXT,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ALTER TABLE ADD INDEX (see below) `BaziRecord_userId_idx` ON `BaziRecord`(`userId`);

-- ============================================================
-- 10. 供奉记录表 OfferingRecord
-- ============================================================
CREATE TABLE IF NOT EXISTS `OfferingRecord` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `userId` VARCHAR(255) NOT NULL,
  `itemId` VARCHAR(255) NOT NULL,
  `supplyIds` TEXT,
  `amount` DOUBLE NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `startDate` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `endDate` DATETIME,
  `status` VARCHAR(50) NOT NULL DEFAULT 'active',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ALTER TABLE ADD INDEX (see below) `OfferingRecord_userId_idx` ON `OfferingRecord`(`userId`);
-- ALTER TABLE ADD INDEX (see below) `OfferingRecord_status_idx` ON `OfferingRecord`(`status`);

-- ============================================================
-- 11. 供奉供品表 OfferingSupply
-- ============================================================
CREATE TABLE IF NOT EXISTS `OfferingSupply` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `icon` VARCHAR(50),
  `image` VARCHAR(500),
  `price` DOUBLE NOT NULL,
  `description` VARCHAR(500),
  `category` VARCHAR(50) NOT NULL DEFAULT 'general',
  `sortOrder` INT NOT NULL DEFAULT 0,
  `isActive` INT NOT NULL DEFAULT 1,
  `stock` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ALTER TABLE ADD INDEX (see below) `OfferingSupply_category_idx` ON `OfferingSupply`(`category`);
-- ALTER TABLE ADD INDEX (see below) `OfferingSupply_isActive_idx` ON `OfferingSupply`(`isActive`);

-- ============================================================
-- 11b. 供奉分类表 OfferingCategory
-- ============================================================
CREATE TABLE IF NOT EXISTS `OfferingCategory` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `icon` VARCHAR(50),
  `description` VARCHAR(500),
  `sortOrder` INT NOT NULL DEFAULT 0,
  `isActive` INT NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. 工单表 Ticket
-- ============================================================
CREATE TABLE IF NOT EXISTS `Ticket` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `userId` VARCHAR(255) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT,
  `status` VARCHAR(50) NOT NULL DEFAULT 'open',
  `priority` VARCHAR(50) NOT NULL DEFAULT 'normal',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ALTER TABLE ADD INDEX (see below) `Ticket_userId_idx` ON `Ticket`(`userId`);
-- ALTER TABLE ADD INDEX (see below) `Ticket_status_idx` ON `Ticket`(`status`);

-- ============================================================
-- 13. 站点配置表 SiteConfig (key-value 结构)
-- ============================================================
CREATE TABLE IF NOT EXISTS `SiteConfig` (
  `key` VARCHAR(255) NOT NULL PRIMARY KEY,
  `value` TEXT,
  `category` VARCHAR(50) NOT NULL DEFAULT 'general',
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ALTER TABLE ADD INDEX (see below) `SiteConfig_category_idx` ON `SiteConfig`(`category`);

-- ============================================================
-- 13b. 公告表 Announcement（多公告队列，支持已读追踪）
-- ============================================================
CREATE TABLE IF NOT EXISTS `Announcement` (
  `id` VARCHAR(32) NOT NULL PRIMARY KEY,
  `icon` VARCHAR(16) NOT NULL DEFAULT '📢',
  `badge` VARCHAR(64) NOT NULL DEFAULT '公告',
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT,
  `link` VARCHAR(255) NOT NULL DEFAULT '',
  `linkText` VARCHAR(64) NOT NULL DEFAULT '查看详情',
  `enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ALTER TABLE ADD INDEX (see below) `Announcement_enabled_sort_idx` ON `Announcement`(`enabled`, `sortOrder`, `createdAt`);

-- ============================================================
-- 14. 用户标签关系表 UserTagRelation
-- ============================================================
CREATE TABLE IF NOT EXISTS `UserTagRelation` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `userId` VARCHAR(255) NOT NULL,
  `tagId` VARCHAR(255) NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ALTER TABLE ADD INDEX (see below) `UserTagRelation_userId_idx` ON `UserTagRelation`(`userId`);
-- ALTER TABLE ADD INDEX (see below) `UserTagRelation_tagId_idx` ON `UserTagRelation`(`tagId`);

-- ============================================================
-- 15. 提现表 Withdrawal
-- ============================================================
CREATE TABLE IF NOT EXISTS `Withdrawal` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `userId` VARCHAR(255) NOT NULL,
  `amount` DOUBLE NOT NULL,
  `method` VARCHAR(50) NOT NULL,
  `account` VARCHAR(255) NOT NULL,
  `accountName` VARCHAR(255) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `remark` VARCHAR(500),
  `auditRemark` VARCHAR(500),
  `auditorId` VARCHAR(255),
  `auditedAt` DATETIME,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ALTER TABLE ADD INDEX (see below) `Withdrawal_userId_idx` ON `Withdrawal`(`userId`);
-- ALTER TABLE ADD INDEX (see below) `Withdrawal_status_idx` ON `Withdrawal`(`status`);
-- ALTER TABLE ADD INDEX (see below) `Withdrawal_createdAt_idx` ON `Withdrawal`(`createdAt`);

-- ============================================================
-- 16. 佣金规则表 CommissionRule
-- ============================================================
CREATE TABLE IF NOT EXISTS `CommissionRule` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `agentId` VARCHAR(255),
  `productType` VARCHAR(50) NOT NULL,
  `productId` VARCHAR(255),
  `baseRate` DOUBLE NOT NULL DEFAULT 0,
  `tierBonus` DOUBLE DEFAULT 0,
  `newCustomerBonus` DOUBLE DEFAULT 0,
  `maxMarkupRate` DOUBLE DEFAULT 0,
  `isActive` INT DEFAULT 1,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ALTER TABLE ADD INDEX (see below) `CommissionRule_agentId_idx` ON `CommissionRule`(`agentId`);
-- ALTER TABLE ADD INDEX (see below) `CommissionRule_productType_idx` ON `CommissionRule`(`productType`);

-- ============================================================
-- 17. 分润记录表 CommissionRecord
-- ============================================================
CREATE TABLE IF NOT EXISTS `CommissionRecord` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `agentId` VARCHAR(255) NOT NULL,
  `orderId` VARCHAR(255) NOT NULL,
  `userId` VARCHAR(255) NOT NULL,
  `productType` VARCHAR(50) NOT NULL,
  `productId` VARCHAR(255),
  `orderAmount` DOUBLE NOT NULL DEFAULT 0,
  `baseAmount` DOUBLE NOT NULL DEFAULT 0,
  `commissionRate` DOUBLE NOT NULL DEFAULT 0,
  `commissionAmount` DOUBLE NOT NULL DEFAULT 0,
  `tierBonusAmount` DOUBLE DEFAULT 0,
  `newCustomerBonusAmount` DOUBLE DEFAULT 0,
  `totalCommission` DOUBLE NOT NULL DEFAULT 0,
  `settlementId` VARCHAR(255),
  `status` VARCHAR(50) DEFAULT 'pending',
  `clawbackAmount` DOUBLE DEFAULT 0,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `settledAt` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ALTER TABLE ADD INDEX (see below) `CommissionRecord_agentId_idx` ON `CommissionRecord`(`agentId`);
-- ALTER TABLE ADD INDEX (see below) `CommissionRecord_orderId_idx` ON `CommissionRecord`(`orderId`);
-- ALTER TABLE ADD INDEX (see below) `CommissionRecord_status_idx` ON `CommissionRecord`(`status`);
-- ALTER TABLE ADD INDEX (see below) `CommissionRecord_createdAt_idx` ON `CommissionRecord`(`createdAt`);

-- ============================================================
-- 18. 结算记录表 SettlementRecord
-- ============================================================
CREATE TABLE IF NOT EXISTS `SettlementRecord` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `agentId` VARCHAR(255) NOT NULL,
  `periodStart` VARCHAR(50) NOT NULL,
  `periodEnd` VARCHAR(50) NOT NULL,
  `orderCount` INT DEFAULT 0,
  `totalOrderAmount` DOUBLE DEFAULT 0,
  `totalCommission` DOUBLE DEFAULT 0,
  `clawbackAmount` DOUBLE DEFAULT 0,
  `netCommission` DOUBLE DEFAULT 0,
  `status` VARCHAR(50) DEFAULT 'pending',
  `paidAt` DATETIME,
  `paidMethod` VARCHAR(50),
  `paidAccount` VARCHAR(255),
  `auditorId` VARCHAR(255),
  `auditRemark` VARCHAR(500),
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ALTER TABLE ADD INDEX (see below) `SettlementRecord_agentId_idx` ON `SettlementRecord`(`agentId`);
-- ALTER TABLE ADD INDEX (see below) `SettlementRecord_status_idx` ON `SettlementRecord`(`status`);

-- ============================================================
-- 19. 邀请码表 ReferralCode
-- ============================================================
CREATE TABLE IF NOT EXISTS `ReferralCode` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `agentId` VARCHAR(255) NOT NULL,
  `code` VARCHAR(255) NOT NULL,
  `usageCount` INT DEFAULT 0,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `ReferralCode_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ALTER TABLE ADD INDEX (see below) `ReferralCode_code_idx` ON `ReferralCode`(`code`);
-- ALTER TABLE ADD INDEX (see below) `ReferralCode_agentId_idx` ON `ReferralCode`(`agentId`);

-- ============================================================
-- 20. 卡密表 CardKey
-- ============================================================
CREATE TABLE IF NOT EXISTS `CardKey` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `code` VARCHAR(255) NOT NULL,
  `type` VARCHAR(50) NOT NULL DEFAULT 'lingzhu',
  `value` DOUBLE NOT NULL,
  `price` DOUBLE NOT NULL DEFAULT 0,
  `status` VARCHAR(50) NOT NULL DEFAULT 'unused',
  `createdBy` VARCHAR(255),
  `usedBy` VARCHAR(255),
  `usedAt` DATETIME,
  `batchId` VARCHAR(255),
  `expiryAt` DATETIME,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `CardKey_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ALTER TABLE ADD INDEX (see below) `CardKey_code_idx` ON `CardKey`(`code`);
-- ALTER TABLE ADD INDEX (see below) `CardKey_status_idx` ON `CardKey`(`status`);
-- ALTER TABLE ADD INDEX (see below) `CardKey_batchId_idx` ON `CardKey`(`batchId`);
-- ALTER TABLE ADD INDEX (see below) `CardKey_type_idx` ON `CardKey`(`type`);

-- ============================================================
-- 21. 更新日志表 UpdateLog
-- ============================================================
CREATE TABLE IF NOT EXISTS `UpdateLog` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `version` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `type` VARCHAR(50) NOT NULL DEFAULT 'update',
  `isMajor` TINYINT(1) NOT NULL DEFAULT 0,
  `changes` TEXT,
  `operatorId` VARCHAR(255),
  `operatorName` VARCHAR(255),
  `tag` VARCHAR(255),
  `status` VARCHAR(50) NOT NULL DEFAULT 'success',
  `rollbackVersion` VARCHAR(50),
  `category` VARCHAR(50) DEFAULT '改进',
  `isCurrent` TINYINT(1) NOT NULL DEFAULT 0,
  `isLatest` TINYINT(1) NOT NULL DEFAULT 0,
  `createdBy` VARCHAR(255),
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Version` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `version` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255),
  `category` VARCHAR(50),
  `changelog` TEXT,
  `downloadUrl` VARCHAR(500),
  `checksum` VARCHAR(255),
  `isLatest` TINYINT(1) NOT NULL DEFAULT 0,
  `isDeprecated` TINYINT(1) NOT NULL DEFAULT 0,
  `releaseAt` DATETIME,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 当前版本种子（幂等）
INSERT IGNORE INTO `Version` (id, version, title, category, changelog, isLatest, isDeprecated, releaseAt, createdAt)
VALUES ('ver_v4_0_0', 'v4.0.0', '商源：代理商 SaaS 分发体系', '主版本更新', '[]', 1, 0, NOW(), NOW());

-- ALTER TABLE ADD INDEX (see below) `UpdateLog_version_idx` ON `UpdateLog`(`version`);
-- ALTER TABLE ADD INDEX (see below) `UpdateLog_type_idx` ON `UpdateLog`(`type`);
-- ALTER TABLE ADD INDEX (see below) `UpdateLog_createdAt_idx` ON `UpdateLog`(`createdAt`);
-- ALTER TABLE ADD INDEX (see below) `UpdateLog_status_idx` ON `UpdateLog`(`status`);

-- ============================================================
-- 22. 支付表 Payment
-- ============================================================
CREATE TABLE IF NOT EXISTS `Payment` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `orderId` VARCHAR(255) NOT NULL,
  `userId` VARCHAR(255) NOT NULL,
  `method` VARCHAR(50) NOT NULL,
  `amount` DOUBLE NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `transactionId` VARCHAR(255),
  `paidAt` DATETIME,
  `refundAt` DATETIME,
  `refundAmount` DOUBLE,
  `remark` VARCHAR(500),
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `Payment_orderId_key` (`orderId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ALTER TABLE ADD INDEX (see below) `Payment_userId_idx` ON `Payment`(`userId`);
-- ALTER TABLE ADD INDEX (see below) `Payment_status_idx` ON `Payment`(`status`);

-- ============================================================
-- 23. 命理规则表 DivinationRule
-- ============================================================
CREATE TABLE IF NOT EXISTS `DivinationRule` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `category` VARCHAR(50) NOT NULL,
  `ruleType` VARCHAR(100) NOT NULL,
  `ruleKey` VARCHAR(255) NOT NULL,
  `subKey` VARCHAR(255) NOT NULL DEFAULT '',
  `content` TEXT NOT NULL,
  `classicSource` TEXT,
  `classicQuote` TEXT,
  `priority` INT NOT NULL DEFAULT 0,
  `agentId` VARCHAR(255) NOT NULL DEFAULT '',
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `DivinationRule_cat_type_key_sub_agent` (`category`, `ruleType`, `ruleKey`(150), `subKey`(100), `agentId`(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 安全创建索引（MySQL 8.0 不支持 CREATE INDEX IF NOT EXISTS）
-- ============================================================
DROP PROCEDURE IF EXISTS `add_index_if_missing`;
DELIMITER //
CREATE PROCEDURE `add_index_if_missing`(
  IN p_table VARCHAR(64),
  IN p_index VARCHAR(64),
  IN p_col VARCHAR(255)
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE()
    AND table_name = p_table
    AND index_name = p_index
  ) THEN
    SET @sql = CONCAT('ALTER TABLE `', p_table, '` ADD INDEX `', p_index, '`(', p_col, ')');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END//
DELIMITER ;

CALL add_index_if_missing('User', 'User_email_idx', '`email`');
CALL add_index_if_missing('User', 'User_role_idx', '`role`');
CALL add_index_if_missing('User', 'User_agentId_idx', '`agentId`');
CALL add_index_if_missing('Agent', 'Agent_isActive_idx', '`isActive`');
CALL add_index_if_missing('Agent', 'Agent_level_idx', '`level`');
CALL add_index_if_missing('Agent', 'Agent_subdomain_idx', '`subdomain`');
CALL add_index_if_missing('Agent', 'Agent_customDomain_idx', '`customDomain`');
CALL add_index_if_missing('AgentLicense', 'AgentLicense_agentId_idx', '`agentId`');
CALL add_index_if_missing('AgentLicense', 'AgentLicense_status_idx', '`status`');
CALL add_index_if_missing('AgentSiteConfig', 'AgentSiteConfig_agentId_idx', '`agentId`');
CALL add_index_if_missing('Order', 'Order_userId_idx', '`userId`');
CALL add_index_if_missing('Order', 'Order_status_idx', '`status`');
CALL add_index_if_missing('Order', 'Order_type_idx', '`type`');
CALL add_index_if_missing('Order', 'Order_agentId_idx', '`agentId`');
CALL add_index_if_missing('PointsLedger', 'PointsLedger_userId_idx', '`userId`');
CALL add_index_if_missing('BaziRecord', 'BaziRecord_userId_idx', '`userId`');
CALL add_index_if_missing('OfferingRecord', 'OfferingRecord_userId_idx', '`userId`');
CALL add_index_if_missing('OfferingRecord', 'OfferingRecord_status_idx', '`status`');
CALL add_index_if_missing('OfferingSupply', 'OfferingSupply_category_idx', '`category`');
CALL add_index_if_missing('OfferingSupply', 'OfferingSupply_isActive_idx', '`isActive`');
CALL add_index_if_missing('OfferingCategory', 'OfferingCategory_isActive_idx', '`isActive`');
CALL add_index_if_missing('Ticket', 'Ticket_userId_idx', '`userId`');
CALL add_index_if_missing('Ticket', 'Ticket_status_idx', '`status`');
CALL add_index_if_missing('SiteConfig', 'SiteConfig_category_idx', '`category`');
CALL add_index_if_missing('Announcement', 'Announcement_enabled_sort_idx', '`enabled`, `sortOrder`, `createdAt`');
CALL add_index_if_missing('UserTagRelation', 'UserTagRelation_userId_idx', '`userId`');
CALL add_index_if_missing('UserTagRelation', 'UserTagRelation_tagId_idx', '`tagId`');
CALL add_index_if_missing('Withdrawal', 'Withdrawal_userId_idx', '`userId`');
CALL add_index_if_missing('Withdrawal', 'Withdrawal_status_idx', '`status`');
CALL add_index_if_missing('Withdrawal', 'Withdrawal_createdAt_idx', '`createdAt`');
CALL add_index_if_missing('CommissionRule', 'CommissionRule_agentId_idx', '`agentId`');
CALL add_index_if_missing('CommissionRule', 'CommissionRule_productType_idx', '`productType`');
CALL add_index_if_missing('CommissionRecord', 'CommissionRecord_agentId_idx', '`agentId`');
CALL add_index_if_missing('CommissionRecord', 'CommissionRecord_orderId_idx', '`orderId`');
CALL add_index_if_missing('CommissionRecord', 'CommissionRecord_status_idx', '`status`');
CALL add_index_if_missing('CommissionRecord', 'CommissionRecord_createdAt_idx', '`createdAt`');
CALL add_index_if_missing('SettlementRecord', 'SettlementRecord_agentId_idx', '`agentId`');
CALL add_index_if_missing('SettlementRecord', 'SettlementRecord_status_idx', '`status`');
CALL add_index_if_missing('ReferralCode', 'ReferralCode_code_idx', '`code`');
CALL add_index_if_missing('ReferralCode', 'ReferralCode_agentId_idx', '`agentId`');
CALL add_index_if_missing('CardKey', 'CardKey_code_idx', '`code`');
CALL add_index_if_missing('CardKey', 'CardKey_status_idx', '`status`');
CALL add_index_if_missing('CardKey', 'CardKey_batchId_idx', '`batchId`');
CALL add_index_if_missing('CardKey', 'CardKey_type_idx', '`type`');
CALL add_index_if_missing('UpdateLog', 'UpdateLog_version_idx', '`version`');
CALL add_index_if_missing('UpdateLog', 'UpdateLog_type_idx', '`type`');
CALL add_index_if_missing('UpdateLog', 'UpdateLog_createdAt_idx', '`createdAt`');
CALL add_index_if_missing('UpdateLog', 'UpdateLog_status_idx', '`status`');
CALL add_index_if_missing('Payment', 'Payment_userId_idx', '`userId`');
CALL add_index_if_missing('Payment', 'Payment_status_idx', '`status`');
CALL add_index_if_missing('DivinationRule', 'DivinationRule_cat_type_agent_idx', '`category`,`ruleType`,`agentId`');

-- 安全加列存储过程（幂等，支持重复执行）
DROP PROCEDURE IF EXISTS `add_column_if_missing`;
DELIMITER //
CREATE PROCEDURE `add_column_if_missing`(
  IN p_table VARCHAR(64),
  IN p_column VARCHAR(64),
  IN p_definition VARCHAR(500)
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = p_table
    AND COLUMN_NAME = p_column
  ) THEN
    SET @sql = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_column, '` ', p_definition);
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END//
DELIMITER ;

CALL add_column_if_missing('UpdateLog', 'version', 'VARCHAR(50) NOT NULL DEFAULT ""');
CALL add_column_if_missing('UpdateLog', 'title', 'VARCHAR(255) NOT NULL DEFAULT ""');
CALL add_column_if_missing('UpdateLog', 'content', 'TEXT');
CALL add_column_if_missing('UpdateLog', 'type', "VARCHAR(50) NOT NULL DEFAULT 'update'");
CALL add_column_if_missing('UpdateLog', 'isMajor', 'TINYINT(1) NOT NULL DEFAULT 0');
CALL add_column_if_missing('UpdateLog', 'changes', 'TEXT');
CALL add_column_if_missing('UpdateLog', 'operatorId', 'VARCHAR(255)');
CALL add_column_if_missing('UpdateLog', 'operatorName', 'VARCHAR(255)');
CALL add_column_if_missing('UpdateLog', 'tag', 'VARCHAR(255)');
CALL add_column_if_missing('UpdateLog', 'status', "VARCHAR(50) NOT NULL DEFAULT 'success'");
CALL add_column_if_missing('UpdateLog', 'rollbackVersion', 'VARCHAR(50)');
CALL add_column_if_missing('UpdateLog', 'category', "VARCHAR(50) DEFAULT '改进'");
CALL add_column_if_missing('UpdateLog', 'isCurrent', 'TINYINT(1) NOT NULL DEFAULT 0');
CALL add_column_if_missing('UpdateLog', 'isLatest', 'TINYINT(1) NOT NULL DEFAULT 0');
CALL add_column_if_missing('UpdateLog', 'createdBy', 'VARCHAR(255)');
CALL add_column_if_missing('UpdateLog', 'createdAt', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');

CALL add_column_if_missing('Version', 'version', 'VARCHAR(50) NOT NULL DEFAULT ""');
CALL add_column_if_missing('Version', 'title', 'VARCHAR(255)');
CALL add_column_if_missing('Version', 'category', 'VARCHAR(50)');
CALL add_column_if_missing('Version', 'changelog', 'TEXT');
CALL add_column_if_missing('Version', 'downloadUrl', 'VARCHAR(500)');
CALL add_column_if_missing('Version', 'checksum', 'VARCHAR(255)');
CALL add_column_if_missing('Version', 'isLatest', 'TINYINT(1) NOT NULL DEFAULT 0');
CALL add_column_if_missing('Version', 'isDeprecated', 'TINYINT(1) NOT NULL DEFAULT 0');
CALL add_column_if_missing('Version', 'releaseAt', 'DATETIME');
CALL add_column_if_missing('Version', 'createdAt', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');

DROP PROCEDURE IF EXISTS `add_column_if_missing`;

DROP PROCEDURE IF EXISTS `add_index_if_missing`;

-- ============================================================
-- 种子数据
-- ============================================================

-- 管理员用户（邮箱 282063152@qq.com，密码 admin123）
-- 注意：本项目使用 PBKDF2-SHA256 哈希（非 BCrypt），格式 pbkdf2_<迭代次数>$<salt>$<key>
INSERT IGNORE INTO `User` (`id`, `email`, `passwordHash`, `name`, `role`, `memberLevel`, `dailyUsage`, `createdAt`, `updatedAt`)
VALUES (
  'admin',
  '282063152@qq.com',
  'pbkdf2_100000$osa+xsXuB0uTEpXNmh1W8g==$p6ResatazK4VOZ9v89Kd5DZ49usLLAtuCWl0HLi1lAE=',
  '管理员',
  'admin',
  'lifetime',
  0,
  NOW(),
  NOW()
);

-- 站点默认配置
INSERT IGNORE INTO `SiteConfig` (`key`, `value`, `category`, `updatedAt`) VALUES
('brandName', '玄机阁', 'general', NOW()),
('logo', '', 'general', NOW()),
('tagline', '传承千年智慧，融合现代科技', 'general', NOW());

-- 祈福分类
INSERT IGNORE INTO `OfferingCategory` (`id`, `name`, `icon`, `description`, `sortOrder`, `isActive`, `createdAt`) VALUES
('cat_wish',    '心愿祈福', '🏮', '寄托心愿，民俗祈福',       1, 1, NOW()),
('cat_culture', '文化纪念', '🎐', '妈祖、关公、文昌等民俗文化纪念', 2, 1, NOW()),
('cat_offering','鲜花供品', '🌸', '鲜花水果等传统供品',       3, 1, NOW()),
('cat_ritual',  '香烛用品', '🕯️', '香烛等传统祭祀用品',       4, 1, NOW());

-- 默认祈福供品（从 d1.ts 的 SEED_SUPPLIES 复制）
INSERT IGNORE INTO `OfferingSupply` (`id`, `name`, `icon`, `image`, `price`, `description`, `category`, `sortOrder`, `isActive`, `createdAt`, `stock`) VALUES
('sup_seed_1',  '心愿福灯',     '🏮', NULL, 28,   '点亮一盏福灯，寄托美好心愿', 'wish',      1, 1, NOW(), 1000),
('sup_seed_2',  '祈福带',       '🎀', NULL, 9.9,  '一条祈福带，系住一份祝愿',   'wish',      2, 1, NOW(), 2000),
('sup_seed_3',  '平安香囊',     '🧧', NULL, 18,   '传统香囊，寄托平安祝愿',     'wish',      3, 1, NOW(), 1500),
('sup_seed_4',  '心愿牌',       '🏷️', NULL, 15,   '写下心愿，挂在祈福墙上',     'wish',      4, 1, NOW(), 1500),
('sup_seed_5',  '祈福莲花灯',   '🪷', NULL, 38,   '莲花灯，象征美好祝愿',       'wish',      5, 1, NOW(), 800),
('sup_seed_6',  '千里福灯',     '🏮', NULL, 36,   '遥寄思念，福佑远方',         'wish',      6, 1, NOW(), 800),
('sup_seed_7',  '妈祖文化纪念徽章', '🌊', NULL, 168, '妈祖信俗文化纪念，护佑平安顺遂', 'culture', 1, 1, NOW(), 500),
('sup_seed_8',  '关公文化纪念卡', '🎭', NULL, 168, '弘扬关公忠义精神',           'culture',   2, 1, NOW(), 500),
('sup_seed_9',  '文昌智慧书签', '📚', NULL, 128,  '文昌文化纪念，祝愿学业进步', 'culture',   3, 1, NOW(), 500),
('sup_seed_10', '土地公民俗纪念', '🏠', NULL, 88,  '传统民俗文化纪念',           'culture',   4, 1, NOW(), 800),
('sup_seed_11', '生肖守护纪念牌', '🐲', NULL, 66,  '生肖民俗文化纪念',           'culture',   5, 1, NOW(), 800),
('sup_seed_12', '五福临门挂饰', '🧧', NULL, 58,   '传统五福民俗挂饰',           'culture',   6, 1, NOW(), 800),
('sup_seed_13', '鲜花',         '💐', NULL, 9.9,  '新鲜花束，清香雅致',         'offering',  1, 1, NOW(), 1000),
('sup_seed_14', '水果',         '🍎', NULL, 15,   '时令水果，新鲜可口',         'offering',  2, 1, NOW(), 800),
('sup_seed_15', '糕点',         '🍰', NULL, 12,   '传统糕点，精致可口',         'offering',  3, 1, NOW(), 600),
('sup_seed_16', '茶水',         '🍵', NULL, 6,    '清香好茶',                   'offering',  4, 1, NOW(), 1000),
('sup_seed_17', '香烛',         '🕯️', NULL, 8,    '天然香烛，传统祭祀用品',     'offering',  5, 1, NOW(), 1000),
('sup_seed_18', '铜香炉',       '🏺', NULL, 28,   '传统铜香炉',                 'ritual',    1, 1, NOW(), 500),
('sup_seed_19', '烛台',         '🕯️', NULL, 18,   '传统烛台',                   'ritual',    2, 1, NOW(), 500),
('sup_seed_20', '供盘',         '🍽️', NULL, 15,   '传统供盘',                   'ritual',    3, 1, NOW(), 500);

-- ============================================================
-- 初始化完成
-- ============================================================
