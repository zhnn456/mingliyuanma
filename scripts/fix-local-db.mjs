/**
 * 修复本地 dev.db 缺失的列
 * 直接用 better-sqlite3 检查并 ALTER TABLE
 */
import Database from 'better-sqlite3';

const db = new Database('prisma/dev.db');

// 需要检查的表和列
const checks = [
  {
    table: 'User',
    columns: [
      ['agentId', 'TEXT'],
      ['dailyUsage', 'INTEGER DEFAULT 0'],
      ['lastUsageDate', 'TEXT'],
      ['memberExpiryAt', 'TEXT'],
    ],
  },
  {
    table: 'Agent',
    columns: [
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
    ],
  },
  {
    table: 'Order',
    columns: [
      ['orderNo', 'TEXT'],
      ['targetId', 'TEXT'],
      ['agentId', 'TEXT'],
      ['agentReferralCode', 'TEXT'],
      ['isNewCustomer', 'INTEGER DEFAULT 0'],
      ['commissionRate', 'REAL'],
      ['commissionAmount', 'REAL DEFAULT 0'],
      ['commissionSettled', 'INTEGER DEFAULT 0'],
    ],
  },
];

for (const { table, columns } of checks) {
  // 检查表是否存在
  const tableExists = db.prepare(
    `SELECT name FROM sqlite_master WHERE type='table' AND name=?`
  ).get(table);

  if (!tableExists) {
    console.log(`⚠️  表 ${table} 不存在，跳过`);
    continue;
  }

  // 获取现有列
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  const colNames = cols.map(c => c.name);

  for (const [col, def] of columns) {
    if (!colNames.includes(col)) {
      try {
        db.exec(`ALTER TABLE "${table}" ADD COLUMN "${col}" ${def}`);
        console.log(`✅ ${table}.${col} 已添加`);
      } catch (e) {
        console.log(`❌ ${table}.${col} 添加失败: ${e.message}`);
      }
    } else {
      console.log(`   ${table}.${col} 已存在`);
    }
  }
}

// 检查缺失的表
const tables = ['AgentLicense', 'Settlement', 'CommissionRecord', 'SettlementRecord', 'ReferralCode', 'Payment', 'UpdateLog'];
for (const t of tables) {
  const exists = db.prepare(
    `SELECT name FROM sqlite_master WHERE type='table' AND name=?`
  ).get(t);
  if (!exists) {
    console.log(`⚠️  表 ${t} 不存在，运行时 ensureXxxTables() 会自动创建`);
  } else {
    console.log(`   表 ${t} 已存在`);
  }
}

db.close();
console.log('\n✅ 本地数据库修复完成');
