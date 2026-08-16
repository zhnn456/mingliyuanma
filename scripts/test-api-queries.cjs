/* 测试 7 个崩溃 API 的 SQL 查询，找出实际错误 */
const mysql = require('mysql2/promise');

async function main() {
  let pool;
  console.log('=== 0. 尝试连接 MySQL ===');
  try {
    pool = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'ming8',
      password: 'Ming8@2026!',
      database: 'ming8_db',
      charset: 'utf8mb4',
    });
    console.log('  ✅ ming8 连接成功');
  } catch (e) {
    console.log('  ❌ ming8 连接失败:', e.message);
    // 尝试其他用户
    for (const [u, p] of [['root', 'Ming8@2026!'], ['root', ''], ['root', 'root'], ['root', 'admin'], ['root', '123456']]) {
      try {
        pool = await mysql.createConnection({ host: 'localhost', port: 3306, user: u, password: p, database: 'ming8_db', charset: 'utf8mb4' });
        console.log(`  ✅ ${u} 连接成功`);
        break;
      } catch (e2) {
        console.log(`  ❌ ${u}/${p} 失败: ${e2.message}`);
      }
    }
    if (!pool) { console.log('  无法连接 MySQL'); return; }
  }

  console.log('\n=== 1. 列出所有表 ===');
  try {
    const [rows] = await pool.execute('SHOW TABLES');
    const tables = rows.map(r => Object.values(r)[0]);
    console.log('Tables:', tables.join(', '));
    console.log('表存在性检查:');
    for (const t of ['Coupon', 'FortuneTeller', 'OfferingRecord', 'OfferingSupply', 'AgentShare', 'Agent', 'Order', 'Payment', 'User', 'ExportTask', 'ZiweiRecord', 'QimenRecord', 'MeihuaRecord', 'BaziRecord', 'Ticket', 'UserPoints', 'PointsLedger', 'SiteConfig']) {
      console.log(`  ${t}: ${tables.includes(t) ? 'EXISTS' : 'MISSING'}`);
    }
  } catch (e) { console.log('  ❌ SHOW TABLES:', e.message); }

  console.log('\n=== 2. 测试 coupons 查询 ===');
  try {
    await pool.execute('SELECT * FROM `Coupon` ORDER BY `createdAt` DESC LIMIT 20 OFFSET 0');
    console.log('  ✅ coupons 查询成功');
  } catch (e) { console.log('  ❌ coupons:', e.message); }

  console.log('\n=== 3. 测试 fortune-tellers 查询 ===');
  try {
    await pool.execute('SELECT ft.id, ft.userId, ft.name, ft.avatar, ft.bio, ft.specialties, ft.rating, ft.isActive, ft.createdAt, ft.updatedAt, u.email as userEmail, u.phone as userPhone, u.name as userUserName, u.role as userRole FROM FortuneTeller ft LEFT JOIN User u ON ft.userId = u.id ORDER BY ft.createdAt DESC LIMIT 20 OFFSET 0');
    console.log('  ✅ fortune-tellers 查询成功');
  } catch (e) { console.log('  ❌ fortune-tellers:', e.message); }

  console.log('\n=== 4. 测试 offering-records 查询 ===');
  try {
    await pool.execute('SELECT r.*, u.email as userEmail, u.name as userName, u.phone as userPhone, oi.name as itemName, oi.category as categoryId FROM OfferingRecord r LEFT JOIN User u ON r.userId = u.id LEFT JOIN OfferingSupply oi ON r.itemId = oi.id ORDER BY r.createdAt DESC LIMIT 20 OFFSET 0');
    console.log('  ✅ offering-records 查询成功');
  } catch (e) { console.log('  ❌ offering-records:', e.message); }

  console.log('\n=== 5. 测试 finance-agents 查询 ===');
  try {
    await pool.execute('SELECT s.*, a.companyName, a.contactName, o.orderNo, o.amount as orderAmount, o.type as orderType FROM AgentShare s LEFT JOIN Agent a ON s.agentId = a.id LEFT JOIN `Order` o ON s.orderId = o.id WHERE 1=1 ORDER BY s.createdAt DESC LIMIT 20 OFFSET 0');
    console.log('  ✅ finance-agents 查询成功');
  } catch (e) { console.log('  ❌ finance-agents:', e.message); }

  console.log('\n=== 6. 测试 revenue 查询 ===');
  try {
    await pool.execute("SELECT * FROM `Order` WHERE status = 'paid' AND createdAt >= ? ORDER BY createdAt", ['2026-07-18 00:00:00']);
    console.log('  ✅ revenue 查询成功');
  } catch (e) { console.log('  ❌ revenue:', e.message); }

  console.log('\n=== 7. 测试 user-profiles 列表查询 ===');
  try {
    await pool.execute('SELECT u.id, u.email, u.name, u.phone, u.avatar, u.role, u.memberLevel, u.memberExpiryAt, u.createdAt, (SELECT COUNT(*) FROM `Order` o WHERE o.userId = u.id) as orderCount, (SELECT COALESCE(SUM(amount), 0) FROM `Order` o WHERE o.userId = u.id) as totalAmount, (SELECT COUNT(*) FROM BaziRecord b WHERE b.userId = u.id) + (SELECT COUNT(*) FROM ZiweiRecord z WHERE z.userId = u.id) + (SELECT COUNT(*) FROM QimenRecord q WHERE q.userId = u.id) + (SELECT COUNT(*) FROM MeihuaRecord m WHERE m.userId = u.id) as divinationCount FROM `User` u WHERE 1=1 ORDER BY u.createdAt DESC LIMIT 20 OFFSET 0');
    console.log('  ✅ user-profiles 列表查询成功');
  } catch (e) { console.log('  ❌ user-profiles 列表:', e.message); }

  console.log('\n=== 8. 测试 user-profiles 详情子查询 (UNION ALL) ===');
  try {
    await pool.execute('SELECT MAX(createdAt) as lastTime FROM (SELECT createdAt FROM `Order` WHERE userId = ? UNION ALL SELECT createdAt FROM BaziRecord WHERE userId = ? UNION ALL SELECT createdAt FROM ZiweiRecord WHERE userId = ? UNION ALL SELECT createdAt FROM QimenRecord WHERE userId = ? UNION ALL SELECT createdAt FROM MeihuaRecord WHERE userId = ? UNION ALL SELECT createdAt FROM Ticket WHERE userId = ?) AS sub', ['test','test','test','test','test','test']);
    console.log('  ✅ user-profiles 详情子查询成功');
  } catch (e) { console.log('  ❌ user-profiles 详情子查询:', e.message); }

  console.log('\n=== 9. 测试 transactions-export 主查询 ===');
  try {
    await pool.execute('SELECT p.*, o.orderNo, o.type as orderType, o.status as orderStatus, o.amount as orderAmount, u.email as userEmail, u.name as userName FROM `Payment` p LEFT JOIN `Order` o ON p.orderId = o.id LEFT JOIN `User` u ON p.userId = u.id WHERE 1=1 ORDER BY p.createdAt DESC LIMIT 20 OFFSET 0');
    console.log('  ✅ transactions-export 主查询成功');
  } catch (e) { console.log('  ❌ transactions-export 主查询:', e.message); }

  console.log('\n=== 10. 测试 transactions-export ExportTask 查询 ===');
  try {
    await pool.execute('SELECT * FROM ExportTask ORDER BY createdAt DESC LIMIT 50');
    console.log('  ✅ transactions-export ExportTask 查询成功');
  } catch (e) { console.log('  ❌ transactions-export ExportTask:', e.message); }

  console.log('\n=== 11. 测试 coupons CREATE TABLE ===');
  try {
    await pool.execute('CREATE TABLE IF NOT EXISTS `Coupon` (`id` VARCHAR(255) NOT NULL PRIMARY KEY, `code` VARCHAR(100) NOT NULL, `name` VARCHAR(255) NOT NULL, `discountType` VARCHAR(50) DEFAULT \'percent\', `discountValue` DOUBLE DEFAULT 0, `minAmount` DOUBLE DEFAULT 0, `maxDiscount` DOUBLE, `totalCount` INT DEFAULT 100, `usedCount` INT DEFAULT 0, `expiryDate` DATETIME, `isActive` INT DEFAULT 1, `description` VARCHAR(500), `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY `Coupon_code_key` (`code`))');
    console.log('  ✅ coupons CREATE TABLE 成功');
  } catch (e) { console.log('  ❌ coupons CREATE TABLE:', e.message); }

  console.log('\n=== 12. 测试 auditLog INSERT ===');
  try {
    await pool.execute('INSERT INTO SiteConfig (id, `key`, value, category, updatedAt) VALUES (?, ?, ?, ?, ?)', ['test_audit_1', 'audit:test', '{}', 'audit', '2026-08-17 00:00:00']);
    console.log('  ✅ auditLog INSERT 成功');
    await pool.execute('DELETE FROM SiteConfig WHERE `key` = ?', ['audit:test']);
  } catch (e) { console.log('  ❌ auditLog INSERT:', e.message); }

  await pool.end();
}

main().catch(e => console.error('Fatal:', e.message));
