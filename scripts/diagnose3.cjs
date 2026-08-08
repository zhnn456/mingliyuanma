const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  // 检查 CommissionRecord 表的完整列信息（含 notnull）
  const cols = await prisma.$queryRawUnsafe(`PRAGMA table_info('CommissionRecord')`);
  console.log('CommissionRecord 完整列信息:');
  for (const c of cols) {
    console.log(`  ${c.name} | type=${c.type} | notnull=${c.notnull} | dflt=${c.dflt_value}`);
  }

  // 检查 Payment 表
  const pCols = await prisma.$queryRawUnsafe(`PRAGMA table_info('Payment')`);
  console.log('\nPayment 完整列信息:');
  for (const c of pCols) {
    console.log(`  ${c.name} | type=${c.type} | notnull=${c.notnull} | dflt=${c.dflt_value}`);
  }

  // 尝试手动插入 CommissionRecord
  console.log('\n尝试插入 CommissionRecord...');
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO CommissionRecord (id, agentId, orderId, userId, orderAmount, baseAmount, commissionRate, commissionAmount, totalCommission, status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      'test_com_1', 'agt_1786159589810_cl7vx0', 'ord_1786159637018', 'user_1786159621187_d2p6sf', 500, 500, 0.3, 150, 150, 'pending', new Date().toISOString()
    );
    console.log('✅ CommissionRecord 插入成功');
    // 清理
    await prisma.$executeRawUnsafe('DELETE FROM CommissionRecord WHERE id = ?', 'test_com_1');
  } catch (e) {
    console.log('❌ CommissionRecord 插入失败:', e.message);
  }

  // 尝试手动插入 Payment
  console.log('\n尝试插入 Payment...');
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO Payment (id, orderId, userId, method, amount, status, transactionId, paidAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      'test_pay_1', 'ord_1786159637018', 'user_1786159621187_d2p6sf', 'mock', 500, 'success', 'test_tx', new Date().toISOString(), new Date().toISOString(), new Date().toISOString()
    );
    console.log('✅ Payment 插入成功');
    await prisma.$executeRawUnsafe('DELETE FROM Payment WHERE id = ?', 'test_pay_1');
  } catch (e) {
    console.log('❌ Payment 插入失败:', e.message);
  }

  // 尝试更新订单状态
  console.log('\n尝试更新订单状态为 paid...');
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "Order" SET status = ?, updatedAt = ? WHERE id = ?`,
      'paid', new Date().toISOString(), 'ord_1786159637018'
    );
    console.log('✅ 订单状态更新成功');
  } catch (e) {
    console.log('❌ 订单状态更新失败:', e.message);
  }

  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
