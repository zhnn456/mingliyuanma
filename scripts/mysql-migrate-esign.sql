-- ============================================================
-- e签宝电子合同签署记录表
-- 用于存储源码部署授权协议的电子签署记录
-- ============================================================

CREATE TABLE IF NOT EXISTS `EsignRecord` (
  `id` VARCHAR(50) PRIMARY KEY,
  `agentId` VARCHAR(100) NOT NULL COMMENT '代理商ID',
  `userId` VARCHAR(100) NOT NULL COMMENT '签署用户ID',
  `flowId` VARCHAR(100) COMMENT 'e签宝签署流程ID',
  `accountId` VARCHAR(100) COMMENT 'e签宝个人账号ID',
  `fileId` VARCHAR(100) COMMENT 'e签宝文件ID',
  `signUrl` TEXT COMMENT '签署H5链接',
  `contractTitle` VARCHAR(200) NOT NULL COMMENT '合同标题',
  `contractVersion` VARCHAR(20) NOT NULL DEFAULT 'V1.0' COMMENT '协议版本',
  `contractHash` VARCHAR(64) COMMENT '协议内容SHA-256哈希',
  `status` ENUM('initiated','signing','completed','rejected','expired','archived') NOT NULL DEFAULT 'initiated' COMMENT '签署状态',
  `signerName` VARCHAR(100) COMMENT '签署人姓名',
  `signerMobile` VARCHAR(20) COMMENT '签署人手机号',
  `signerIdNumber` VARCHAR(100) COMMENT '签署人证件号（加密存储）',
  `signedPdfUrl` TEXT COMMENT '签署完成后PDF下载地址',
  `esignCert` TEXT COMMENT 'e签宝CA证书信息',
  `blockchainHash` VARCHAR(128) COMMENT '区块链存证哈希',
  `signedAt` DATETIME NULL COMMENT '签署完成时间',
  `expiredAt` DATETIME NOT NULL COMMENT '签署截止时间',
  `clientIP` VARCHAR(50) COMMENT '发起签署时的客户端IP',
  `userAgent` TEXT COMMENT '发起签署时的User-Agent',
  `callbackData` TEXT COMMENT 'e签宝回调原始数据',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_agentId` (`agentId`),
  INDEX `idx_userId` (`userId`),
  INDEX `idx_flowId` (`flowId`),
  INDEX `idx_status` (`status`),
  INDEX `idx_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='e签宝电子合同签署记录';

-- ============================================================
-- Agent 表新增签署状态字段
-- ============================================================
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Agent' AND COLUMN_NAME = 'agreementSignedAt');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `Agent` ADD COLUMN `agreementSignedAt` DATETIME NULL COMMENT ''授权协议签署时间''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Agent' AND COLUMN_NAME = 'agreementVersion');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `Agent` ADD COLUMN `agreementVersion` VARCHAR(20) NULL DEFAULT ''V1.0'' COMMENT ''签署的协议版本''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Agent' AND COLUMN_NAME = 'agreementRecordId');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `Agent` ADD COLUMN `agreementRecordId` VARCHAR(50) NULL COMMENT ''签署记录ID（关联EsignRecord）''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
