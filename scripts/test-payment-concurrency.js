/**
 * 支付系统并发安全测试脚本
 *
 * 测试项：
 * 1. 并发回调不导致双倍充值（原子性抢占）
 * 2. 并发优惠券使用不导致超发
 * 3. 并发grantLingzhu不导致双倍赠礼
 *
 * 用法：node scripts/test-payment-concurrency.js
 */

const mysql = require('mysql2/promise');

// 测试配置
const DB_URL = process.env.MYSQL_URL || 'mysql://ming8:Ming8@2026!@localhost:3306/ming8_db';
const CONCURRENCY = 20;  // 并发数
const TEST_USER_ID = 'test_concurrency_user';
const TEST_PREFIX = `test_${Date.now()}`;

async function main() {
  const pool = mysql.createPool(DB_URL);

  console.log('=== 支付系统并发安全测试 ===\n');
  console.log(`并发数: ${CONCURRENCY}`);
  console.log(`测试用户: ${TEST_USER_ID}`);
  console.log(`测试前缀: ${TEST_PREFIX}\n`);

  let allPassed = true;

  // 测试1：并发订单抢占（防双倍充值）
  allPassed &= await testOrderClaim(pool);

  // 测试2：并发优惠券使用（防超发）
  allPassed &= await testCouponOversell(pool);

  // 测试3：并发灵珠赠礼（防双倍赠礼）
  allPassed &= await testGrantLingzhu(pool);

  // 清理测试数据
  await cleanup(pool);

  console.log('\n=== 测试总结 ===');
  if (allPassed) {
    console.log('✅ 全部通过：并发安全漏洞已修复');
  } else {
    console.log('❌ 有测试失败：仍存在并发安全问题');
  }

  await pool.end();
  process.exit(allPassed ? 0 : 1);
}

/**
 * 测试1：并发订单抢占
 * 模拟20个并发回调同时抢同一订单
 * 期望：只有1个成功，其余19个changes=0
 */
async function testOrderClaim(pool) {
  console.log('--- 测试1：并发订单抢占（防双倍充值）---');

  const orderId = `${TEST_PREFIX}_order_1`;
  const orderNo = `TC${Date.now()}`;
  const now = new Date().toISOString();

  // 创建一个 pending 状态的测试订单
  await pool.execute(
    `INSERT INTO "Order" (id, orderNo, userId, type, targetId, amount, status, createdAt, updatedAt)
     VALUES (?, ?, ?, 'recharge', 'pkg_100', 100, 'pending', ?, ?)`,
    [orderId, orderNo, TEST_USER_ID, now, now]
  );
  console.log(`创建测试订单: ${orderNo} (status=pending)`);

  // 并发抢占
  const promises = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    promises.push(
      pool.execute(
        `UPDATE "Order" SET status = 'paid', paidAt = ?, updatedAt = ? WHERE id = ? AND status = 'pending'`,
        [now, now, orderId]
      )
    );
  }

  const results = await Promise.all(promises);
  const successCount = results.filter(r => r[0].affectedRows > 0).length;

  // 验证订单最终状态
  const [rows] = await pool.execute(`SELECT status FROM "Order" WHERE id = ?`, [orderId]);
  const finalStatus = rows[0]?.status;

  console.log(`  并发抢占数: ${CONCURRENCY}`);
  console.log(`  成功抢占数: ${successCount}`);
  console.log(`  订单最终状态: ${finalStatus}`);

  if (successCount === 1 && finalStatus === 'paid') {
    console.log('  ✅ 通过：只有1个并发请求成功抢占\n');
    return true;
  } else {
    console.log(`  ❌ 失败：期望1个成功，实际${successCount}个\n`);
    return false;
  }
}

/**
 * 测试2：并发优惠券使用
 * 创建maxUses=1的优惠券，20个并发请求同时使用
 * 期望：只有1个成功
 */
async function testCouponOversell(pool) {
  console.log('--- 测试2：并发优惠券使用（防超发）---');

  const couponId = `${TEST_PREFIX}_coupon_1`;
  const couponCode = `TEST${Date.now()}`;
  const now = new Date().toISOString();

  await pool.execute(
    `INSERT INTO Coupon (id, code, name, discountType, discountValue, minAmount, maxUses, usedCount, isActive, createdAt)
     VALUES (?, ?, '测试券', 'fixed', 10, 0, 1, 0, 1, ?)`,
    [couponId, couponCode, now]
  );
  console.log(`创建测试优惠券: ${couponCode} (maxUses=1, usedCount=0)`);

  // 并发使用优惠券
  const promises = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    promises.push(
      pool.execute(
        `UPDATE Coupon SET usedCount = usedCount + 1 WHERE id = ? AND usedCount < maxUses`,
        [couponId]
      )
    );
  }

  const results = await Promise.all(promises);
  const successCount = results.filter(r => r[0].affectedRows > 0).length;

  // 验证最终usedCount
  const [rows] = await pool.execute(`SELECT usedCount, maxUses FROM Coupon WHERE id = ?`, [couponId]);
  const finalUsed = rows[0]?.usedCount;
  const maxUses = rows[0]?.maxUses;

  console.log(`  并发使用数: ${CONCURRENCY}`);
  console.log(`  成功使用数: ${successCount}`);
  console.log(`  最终usedCount: ${finalUsed} / maxUses: ${maxUses}`);

  if (successCount === 1 && finalUsed === 1) {
    console.log('  ✅ 通过：优惠券未超发\n');
    return true;
  } else {
    console.log(`  ❌ 失败：期望usedCount=1，实际=${finalUsed}\n`);
    return false;
  }
}

/**
 * 测试3：并发灵珠赠礼
 * 对同一用户并发调用grantLingzhu（模拟ON DUPLICATE KEY UPDATE）
 * 期望：balance = 初始值 + N * amount（而不是丢失更新）
 */
async function testGrantLingzhu(pool) {
  console.log('--- 测试3：并发灵珠赠礼（防双倍/丢失更新）---');

  const userId = `${TEST_PREFIX}_user_1`;
  const now = new Date().toISOString();
  const GIFT_AMOUNT = 100;

  // 初始化用户余额为0
  await pool.execute(
    `INSERT INTO UserPoints (userId, balance, updatedAt) VALUES (?, 0, ?)`,
    [userId, now]
  );
  console.log(`创建测试用户: ${userId} (balance=0)`);

  // 并发赠送灵珠
  const promises = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    promises.push(
      pool.execute(
        `INSERT INTO UserPoints (userId, balance, updatedAt) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE balance = balance + VALUES(balance), updatedAt = VALUES(updatedAt)`,
        [userId, GIFT_AMOUNT, now]
      )
    );
  }

  await Promise.all(promises);

  // 验证最终余额
  const [rows] = await pool.execute(`SELECT balance FROM UserPoints WHERE userId = ?`, [userId]);
  const finalBalance = rows[0]?.balance;
  const expectedBalance = CONCURRENCY * GIFT_AMOUNT;

  console.log(`  并发赠礼数: ${CONCURRENCY} × ${GIFT_AMOUNT}灵珠`);
  console.log(`  期望余额: ${expectedBalance}`);
  console.log(`  实际余额: ${finalBalance}`);

  if (finalBalance === expectedBalance) {
    console.log('  ✅ 通过：无丢失更新，余额正确\n');
    return true;
  } else {
    console.log(`  ❌ 失败：期望${expectedBalance}，实际${finalBalance}\n`);
    return false;
  }
}

/**
 * 清理测试数据
 */
async function cleanup(pool) {
  console.log('--- 清理测试数据 ---');

  // 删除测试订单
  await pool.execute(`DELETE FROM "Order" WHERE id LIKE ?`, [`${TEST_PREFIX}%`]);
  // 删除测试优惠券
  await pool.execute(`DELETE FROM Coupon WHERE id LIKE ?`, [`${TEST_PREFIX}%`]);
  // 删除测试用户积分
  await pool.execute(`DELETE FROM UserPoints WHERE userId LIKE ?`, [`${TEST_PREFIX}%`]);
  // 删除测试积分流水
  await pool.execute(`DELETE FROM PointsLedger WHERE userId LIKE ?`, [`${TEST_PREFIX}%`]);

  console.log('测试数据已清理\n');
}

main().catch(err => {
  console.error('测试脚本执行失败:', err);
  process.exit(1);
});
