-- 修复本地 dev.db 缺失的列
-- User 表
ALTER TABLE "User" ADD COLUMN "agentId" TEXT;
ALTER TABLE "User" ADD COLUMN "dailyUsage" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "lastUsageDate" TEXT;
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
ALTER TABLE "Agent" ADD COLUMN "bankName" TEXT;
ALTER TABLE "Agent" ADD COLUMN "bankAccount" TEXT;
ALTER TABLE "Agent" ADD COLUMN "bankAccountName" TEXT;

-- Order 表
ALTER TABLE "Order" ADD COLUMN "orderNo" TEXT;
ALTER TABLE "Order" ADD COLUMN "targetId" TEXT;
ALTER TABLE "Order" ADD COLUMN "agentId" TEXT;
ALTER TABLE "Order" ADD COLUMN "agentReferralCode" TEXT;
ALTER TABLE "Order" ADD COLUMN "isNewCustomer" INTEGER DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "commissionRate" REAL;
ALTER TABLE "Order" ADD COLUMN "commissionAmount" REAL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "commissionSettled" INTEGER DEFAULT 0;
