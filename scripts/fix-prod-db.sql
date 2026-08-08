-- 生产环境 D1 修复脚本
-- 逐条执行，已存在的列会报错但不影响后续语句

-- User 表
ALTER TABLE "User" ADD COLUMN "agentId" TEXT;
ALTER TABLE "User" ADD COLUMN "memberExpiryAt" TEXT;

-- Agent 表
ALTER TABLE "Agent" ADD COLUMN "level" TEXT DEFAULT 'saas';
ALTER TABLE "Agent" ADD COLUMN "plan" TEXT DEFAULT 'trial';
ALTER TABLE "Agent" ADD COLUMN "planExpiry" TEXT;
ALTER TABLE "Agent" ADD COLUMN "referralCode" TEXT;
ALTER TABLE "Agent" ADD COLUMN "maxCustomers" INTEGER DEFAULT 500;
ALTER TABLE "Agent" ADD COLUMN "commissionRate" REAL DEFAULT 0.3;
ALTER TABLE "Agent" ADD COLUMN "totalCommission" REAL DEFAULT 0;
ALTER TABLE "Agent" ADD COLUMN "pendingCommission" REAL DEFAULT 0;
ALTER TABLE "Agent" ADD COLUMN "currentMonthGMV" REAL DEFAULT 0;
ALTER TABLE "Agent" ADD COLUMN "settlementCycle" TEXT DEFAULT 'weekly';
ALTER TABLE "Agent" ADD COLUMN "balance" REAL DEFAULT 0;

-- AgentLicense 表
ALTER TABLE "AgentLicense" ADD COLUMN "signature" TEXT;
ALTER TABLE "AgentLicense" ADD COLUMN "domain" TEXT;
ALTER TABLE "AgentLicense" ADD COLUMN "maxUsers" INTEGER DEFAULT 1000;
ALTER TABLE "AgentLicense" ADD COLUMN "expiryAt" TEXT;
ALTER TABLE "AgentLicense" ADD COLUMN "features" TEXT;
ALTER TABLE "AgentLicense" ADD COLUMN "status" TEXT DEFAULT 'active';
ALTER TABLE "AgentLicense" ADD COLUMN "updatedAt" TEXT;

-- Order 表
ALTER TABLE "Order" ADD COLUMN "orderNo" TEXT;
ALTER TABLE "Order" ADD COLUMN "targetId" TEXT;
ALTER TABLE "Order" ADD COLUMN "agentId" TEXT;
ALTER TABLE "Order" ADD COLUMN "agentReferralCode" TEXT;
ALTER TABLE "Order" ADD COLUMN "isNewCustomer" INTEGER DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "commissionRate" REAL;
ALTER TABLE "Order" ADD COLUMN "commissionAmount" REAL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "commissionSettled" INTEGER DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "updatedAt" TEXT;
