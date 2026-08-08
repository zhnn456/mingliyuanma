-- ============================================================
-- 命理网站 MySQL 初始化脚本
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

CREATE INDEX IF NOT EXISTS `User_email_idx` ON `User`(`email`);
CREATE INDEX IF NOT EXISTS `User_role_idx` ON `User`(`role`);
CREATE INDEX IF NOT EXISTS `User_agentId_idx` ON `User`(`agentId`);

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
  `licenseKey` VARCHAR(255),
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

CREATE INDEX IF NOT EXISTS `Agent_isActive_idx` ON `Agent`(`isActive`);
CREATE INDEX IF NOT EXISTS `Agent_level_idx` ON `Agent`(`level`);
CREATE INDEX IF NOT EXISTS `Agent_subdomain_idx` ON `Agent`(`subdomain`);
CREATE INDEX IF NOT EXISTS `Agent_customDomain_idx` ON `Agent`(`customDomain`);

-- ============================================================
-- 3. 授权码表 AgentLicense
-- ============================================================
CREATE TABLE IF NOT EXISTS `AgentLicense` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `agentId` VARCHAR(255) NOT NULL,
  `licenseKey` VARCHAR(255) NOT NULL,
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

CREATE INDEX IF NOT EXISTS `AgentLicense_agentId_idx` ON `AgentLicense`(`agentId`);
CREATE INDEX IF NOT EXISTS `AgentLicense_status_idx` ON `AgentLicense`(`status`);

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

CREATE INDEX IF NOT EXISTS `AgentSiteConfig_agentId_idx` ON `AgentSiteConfig`(`agentId`);

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

CREATE INDEX IF NOT EXISTS `Order_userId_idx` ON `Order`(`userId`);
CREATE INDEX IF NOT EXISTS `Order_status_idx` ON `Order`(`status`);
CREATE INDEX IF NOT EXISTS `Order_type_idx` ON `Order`(`type`);
CREATE INDEX IF NOT EXISTS `Order_agentId_idx` ON `Order`(`agentId`);

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

CREATE INDEX IF NOT EXISTS `PointsLedger_userId_idx` ON `PointsLedger`(`userId`);

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

CREATE INDEX IF NOT EXISTS `BaziRecord_userId_idx` ON `BaziRecord`(`userId`);

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

CREATE INDEX IF NOT EXISTS `OfferingRecord_userId_idx` ON `OfferingRecord`(`userId`);
CREATE INDEX IF NOT EXISTS `OfferingRecord_status_idx` ON `OfferingRecord`(`status`);

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

CREATE INDEX IF NOT EXISTS `OfferingSupply_category_idx` ON `OfferingSupply`(`category`);
CREATE INDEX IF NOT EXISTS `OfferingSupply_isActive_idx` ON `OfferingSupply`(`isActive`);

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

CREATE INDEX IF NOT EXISTS `Ticket_userId_idx` ON `Ticket`(`userId`);
CREATE INDEX IF NOT EXISTS `Ticket_status_idx` ON `Ticket`(`status`);

-- ============================================================
-- 13. 站点配置表 SiteConfig (key-value 结构)
-- ============================================================
CREATE TABLE IF NOT EXISTS `SiteConfig` (
  `key` VARCHAR(255) NOT NULL PRIMARY KEY,
  `value` TEXT,
  `category` VARCHAR(50) NOT NULL DEFAULT 'general',
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS `SiteConfig_category_idx` ON `SiteConfig`(`category`);

-- ============================================================
-- 14. 用户标签关系表 UserTagRelation
-- ============================================================
CREATE TABLE IF NOT EXISTS `UserTagRelation` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `userId` VARCHAR(255) NOT NULL,
  `tagId` VARCHAR(255) NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS `UserTagRelation_userId_idx` ON `UserTagRelation`(`userId`);
CREATE INDEX IF NOT EXISTS `UserTagRelation_tagId_idx` ON `UserTagRelation`(`tagId`);

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

CREATE INDEX IF NOT EXISTS `Withdrawal_userId_idx` ON `Withdrawal`(`userId`);
CREATE INDEX IF NOT EXISTS `Withdrawal_status_idx` ON `Withdrawal`(`status`);
CREATE INDEX IF NOT EXISTS `Withdrawal_createdAt_idx` ON `Withdrawal`(`createdAt`);

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

CREATE INDEX IF NOT EXISTS `CommissionRule_agentId_idx` ON `CommissionRule`(`agentId`);
CREATE INDEX IF NOT EXISTS `CommissionRule_productType_idx` ON `CommissionRule`(`productType`);

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

CREATE INDEX IF NOT EXISTS `CommissionRecord_agentId_idx` ON `CommissionRecord`(`agentId`);
CREATE INDEX IF NOT EXISTS `CommissionRecord_orderId_idx` ON `CommissionRecord`(`orderId`);
CREATE INDEX IF NOT EXISTS `CommissionRecord_status_idx` ON `CommissionRecord`(`status`);
CREATE INDEX IF NOT EXISTS `CommissionRecord_createdAt_idx` ON `CommissionRecord`(`createdAt`);

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

CREATE INDEX IF NOT EXISTS `SettlementRecord_agentId_idx` ON `SettlementRecord`(`agentId`);
CREATE INDEX IF NOT EXISTS `SettlementRecord_status_idx` ON `SettlementRecord`(`status`);

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

CREATE INDEX IF NOT EXISTS `ReferralCode_code_idx` ON `ReferralCode`(`code`);
CREATE INDEX IF NOT EXISTS `ReferralCode_agentId_idx` ON `ReferralCode`(`agentId`);

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

CREATE INDEX IF NOT EXISTS `CardKey_code_idx` ON `CardKey`(`code`);
CREATE INDEX IF NOT EXISTS `CardKey_status_idx` ON `CardKey`(`status`);
CREATE INDEX IF NOT EXISTS `CardKey_batchId_idx` ON `CardKey`(`batchId`);
CREATE INDEX IF NOT EXISTS `CardKey_type_idx` ON `CardKey`(`type`);

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
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS `UpdateLog_version_idx` ON `UpdateLog`(`version`);
CREATE INDEX IF NOT EXISTS `UpdateLog_type_idx` ON `UpdateLog`(`type`);
CREATE INDEX IF NOT EXISTS `UpdateLog_createdAt_idx` ON `UpdateLog`(`createdAt`);
CREATE INDEX IF NOT EXISTS `UpdateLog_status_idx` ON `UpdateLog`(`status`);

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

CREATE INDEX IF NOT EXISTS `Payment_userId_idx` ON `Payment`(`userId`);
CREATE INDEX IF NOT EXISTS `Payment_status_idx` ON `Payment`(`status`);

SET FOREIGN_KEY_CHECKS = 1;

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

-- 默认供奉供品（从 d1.ts 的 SEED_SUPPLIES 复制）
INSERT IGNORE INTO `OfferingSupply` (`id`, `name`, `icon`, `image`, `price`, `description`, `category`, `sortOrder`, `isActive`, `createdAt`, `stock`) VALUES
('sup_seed_1',  '释迦牟尼佛', '🪷', NULL, 188,  '释迦牟尼佛供奉，祈福平安', 'buddha',      1, 1, NOW(), 100),
('sup_seed_2',  '阿弥陀佛',   '🪷', NULL, 188,  '阿弥陀佛供奉，往生极乐',   'buddha',      2, 1, NOW(), 100),
('sup_seed_3',  '药师佛',     '🪷', NULL, 188,  '药师佛供奉，消灾解难',     'buddha',      3, 1, NOW(), 100),
('sup_seed_4',  '观音菩萨',   '🧘', NULL, 168,  '观音菩萨供奉，救苦救难',   'buddha',      4, 1, NOW(), 200),
('sup_seed_5',  '地藏王菩萨', '🧘', NULL, 168,  '地藏王菩萨供奉，慈悲护佑', 'buddha',      5, 1, NOW(), 200),
('sup_seed_6',  '弥勒佛',     '😊', NULL, 158,  '弥勒佛供奉，笑口常开',     'buddha',      6, 1, NOW(), 150),
('sup_seed_7',  '土地公',     '🏠', NULL, 88,   '土地公供奉，守护家园',     'deity',       1, 1, NOW(), 300),
('sup_seed_8',  '城隍爷',     '⚖️', NULL, 128,  '城隍爷供奉，护佑一方',     'deity',       2, 1, NOW(), 200),
('sup_seed_9',  '妈祖',       '🌊', NULL, 168,  '妈祖供奉，海上平安',       'deity',       3, 1, NOW(), 200),
('sup_seed_10', '关帝',       '⚔️', NULL, 168,  '关帝供奉，忠义千秋',       'deity',       4, 1, NOW(), 250),
('sup_seed_11', '文昌帝君',   '📚', NULL, 128,  '文昌帝君供奉，学业有成',   'deity',       5, 1, NOW(), 200),
('sup_seed_12', '香炉',       '🕯️', NULL, 28,   '精品铜香炉，供奉法器',     'ritual',      1, 1, NOW(), 500),
('sup_seed_13', '烛台',       '🕯️', NULL, 18,   '传统烛台，供灯法器',       'ritual',      2, 1, NOW(), 500),
('sup_seed_14', '供盘',       '🍽️', NULL, 15,   '供果盘，盛装供品',         'ritual',      3, 1, NOW(), 500),
('sup_seed_15', '木鱼',       '🪵', NULL, 38,   '精品木鱼，修行法器',       'ritual',      4, 1, NOW(), 300),
('sup_seed_16', '念珠',       '📿', NULL, 48,   '檀木念珠，持咒修行',       'ritual',      5, 1, NOW(), 400),
('sup_seed_17', '鲜花',       '💐', NULL, 9.9,  '新鲜供花，清香供奉',       'offering',    1, 1, NOW(), 1000),
('sup_seed_18', '水果',       '🍎', NULL, 15,   '时令供果，敬献三宝',       'offering',    2, 1, NOW(), 800),
('sup_seed_19', '糕点',       '🍰', NULL, 12,   '传统糕点，供奉佳品',       'offering',    3, 1, NOW(), 600),
('sup_seed_20', '茶水',       '🍵', NULL, 6,    '好茶供奉，清净自在',       'offering',    4, 1, NOW(), 1000),
('sup_seed_21', '香烛',       '🕯️', NULL, 8,    '天然香烛，供奉燃香',       'offering',    5, 1, NOW(), 1000),
('sup_seed_22', '追思牌位',   '🪧', NULL, 88,   '追思牌位，缅怀先人',       'deliverance', 1, 1, NOW(), 200),
('sup_seed_23', '祈福莲花',   '🪷', NULL, 38,   '祈福莲花，回向功德',       'deliverance', 2, 1, NOW(), 300),
('sup_seed_24', '金元宝',     '💰', NULL, 5,    '金元宝供奉，冥资供养',     'deliverance', 3, 1, NOW(), 2000);

-- ============================================================
-- 初始化完成
-- ============================================================
