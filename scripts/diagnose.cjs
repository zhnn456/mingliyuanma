/**
 * 诊断脚本：检查分润相关表和数据
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. 检查 CommissionRecord 表是否存在
  const tables = await prisma.$queryRawUnsafe(
    `SELECT name FROM sqlite_master WHERE type='table' AND name IN ('CommissionRecord','Settlement','AgentLicense')`
  );
  console.log('存在的表:', tables.map(t => t.name));

  // 2. 检查最新创建的 Agent
  const agents = await prisma.$queryRawUnsafe(
    `SELECT id, brandName, commissionRate, totalCommission, pendingCommission, isActive FROM Agent ORDER BY rowid DESC LIMIT 3`
  );
  console.log('\n最新代理商:', agents);

  // 3. 检查最新创建的 User（mock 用户）
  const users = await prisma.$queryRawUnsafe(
    `SELECT id, email, agentId, role FROM User ORDER BY rowid DESC LIMIT 3`
  );
  console.log('\n最新用户:', users);

  // 4. 检查最新订单
  const orders = await prisma.$queryRawUnsafe(
    `SELECT id, orderNo, userId, type, amount, status, agentId, commissionRate, commissionAmount FROM "Order" ORDER BY rowid DESC LIMIT 3`
  );
  console.log('\n最新订单:', orders);

  // 5. 检查 CommissionRecord
  try {
    const records = await prisma.$queryRawUnsafe(
      `SELECT * FROM CommissionRecord ORDER BY rowid DESC LIMIT 5`
    );
    console.log('\n分润记录:', records);
  } catch (e) {
    console.log('\n❌ CommissionRecord 表查询失败:', e.message);
    // 检查表结构
    const cols = await prisma.$queryRawUnsafe(`PRAGMA table_info('CommissionRecord')`);
    console.log('CommissionRecord 列:', cols);
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
