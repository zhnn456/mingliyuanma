const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  // CommissionRecord 表结构
  const cols = await prisma.$queryRawUnsafe(`PRAGMA table_info('CommissionRecord')`);
  console.log('CommissionRecord 列:', cols.map(c => `${c.name}(${c.type})`));

  // Settlement 表
  const sCols = await prisma.$queryRawUnsafe(`PRAGMA table_info('Settlement')`).catch(() => []);
  console.log('\nSettlement 列:', sCols.map(c => `${c.name}(${c.type})`));

  // Payment 表
  const pCols = await prisma.$queryRawUnsafe(`PRAGMA table_info('Payment')`).catch(() => []);
  console.log('\nPayment 列:', pCols.map(c => `${c.name}(${c.type})`));

  // 检查 Payment 表是否有数据
  const payments = await prisma.$queryRawUnsafe(`SELECT * FROM Payment ORDER BY rowid DESC LIMIT 3`).catch(() => []);
  console.log('\nPayment 记录:', payments);

  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
