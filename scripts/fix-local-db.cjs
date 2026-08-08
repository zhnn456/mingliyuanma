/**
 * 动态检查并修复本地 dev.db 缺失的列
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getColumns(tableName) {
  const rows = await prisma.$queryRawUnsafe(`PRAGMA table_info("${tableName}")`);
  return rows.map(r => r.name);
}

async function addColumnIfMissing(tableName, colName, colDef) {
  const cols = await getColumns(tableName);
  if (cols.includes(colName)) {
    console.log(`   ${tableName}.${colName} 已存在`);
    return;
  }
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "${tableName}" ADD COLUMN "${colName}" ${colDef}`);
    console.log(`✅ ${tableName}.${colName} 已添加`);
  } catch (e) {
    console.log(`❌ ${tableName}.${colName} 失败: ${e.message}`);
  }
}

async function tableExists(tableName) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT name FROM sqlite_master WHERE type='table' AND name=?`, tableName
  );
  return rows.length > 0;
}

async function main() {
  console.log('检查并修复本地 dev.db...\n');

  // User 表
  if (await tableExists('User')) {
    console.log('📋 User 表:');
    await addColumnIfMissing('User', 'agentId', 'TEXT');
    await addColumnIfMissing('User', 'dailyUsage', 'INTEGER DEFAULT 0');
    await addColumnIfMissing('User', 'lastUsageDate', 'TEXT');
    await addColumnIfMissing('User', 'memberExpiryAt', 'TEXT');
  }

  // Agent 表
  if (await tableExists('Agent')) {
    console.log('\n📋 Agent 表:');
    const agentCols = [
      ['level', "TEXT DEFAULT 'saas'"],
      ['plan', "TEXT DEFAULT 'trial'"],
      ['planExpiry', 'TEXT'],
      ['referralCode', 'TEXT'],
      ['maxCustomers', 'INTEGER DEFAULT 500'],
      ['commissionRate', 'REAL DEFAULT 0.3'],
      ['totalCommission', 'REAL DEFAULT 0'],
      ['pendingCommission', 'REAL DEFAULT 0'],
      ['currentMonthGMV', 'REAL DEFAULT 0'],
      ['settlementCycle', "TEXT DEFAULT 'weekly'"],
      ['balance', 'REAL DEFAULT 0'],
      ['bankName', 'TEXT'],
      ['bankAccount', 'TEXT'],
      ['bankAccountName', 'TEXT'],
    ];
    for (const [col, def] of agentCols) {
      await addColumnIfMissing('Agent', col, def);
    }
  }

  // Order 表
  if (await tableExists('Order')) {
    console.log('\n📋 Order 表:');
    const orderCols = [
      ['orderNo', 'TEXT'],
      ['targetId', 'TEXT'],
      ['agentId', 'TEXT'],
      ['agentReferralCode', 'TEXT'],
      ['isNewCustomer', 'INTEGER DEFAULT 0'],
      ['commissionRate', 'REAL'],
      ['commissionAmount', 'REAL DEFAULT 0'],
      ['commissionSettled', 'INTEGER DEFAULT 0'],
      ['updatedAt', 'TEXT'],
    ];
    for (const [col, def] of orderCols) {
      await addColumnIfMissing('Order', col, def);
    }
  }

  // AgentLicense 表
  if (await tableExists('AgentLicense')) {
    console.log('\n📋 AgentLicense 表:');
    const licCols = [
      ['signature', 'TEXT'],
      ['domain', 'TEXT'],
      ['maxUsers', 'INTEGER DEFAULT 1000'],
      ['expiryAt', 'TEXT'],
      ['features', 'TEXT'],
      ['status', "TEXT DEFAULT 'active'"],
      ['updatedAt', 'TEXT'],
    ];
    for (const [col, def] of licCols) {
      await addColumnIfMissing('AgentLicense', col, def);
    }
  }

  console.log('\n✅ 修复完成');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('错误:', e.message);
  process.exit(1);
});
