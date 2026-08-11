/**
 * MySQL 数据库工具 — 直接操作 MySQL，不经过 Prisma
 * 所有函数通过 mysql2 连接池执行查询
 * 自动把 SQLite 语法转换为 MySQL 语法
 */

import mysql from 'mysql2/promise';

let _pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (_pool) return _pool;
  _pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'ming8',
    password: process.env.MYSQL_PASSWORD || 'Ming8@2026!',
    database: process.env.MYSQL_DATABASE || 'ming8_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
  });
  return _pool;
}

/**
 * 把 SQLite 语法自动转换为 MySQL 语法
 */
function adaptSql(sql: string): string {
  return sql
    // PRAGMA table_info('xxx') → SHOW COLUMNS FROM xxx
    .replace(/PRAGMA table_info\(['"]?(\w+)['"]?\)/g, 'SHOW COLUMNS FROM `$1`')
    // datetime('now') → NOW()
    .replace(/datetime\('now'\)/g, 'NOW()')
    // INSERT OR REPLACE INTO → REPLACE INTO
    .replace(/INSERT OR REPLACE INTO/g, 'REPLACE INTO')
    // INSERT OR IGNORE INTO → INSERT IGNORE INTO
    .replace(/INSERT OR IGNORE INTO/g, 'INSERT IGNORE INTO')
    // CREATE INDEX IF NOT EXISTS → 空操作（索引已由 mysql-init.sql 存储过程安全创建，避免重复创建报错）
    .replace(/CREATE INDEX IF NOT EXISTS\s+[`"]?(\w+)[`"]?\s+ON\s+[`"]?(\w+)[`"]?\s*\([`"]?(\w+)[`"]?\)/g,
             'SELECT 1 AS __noop')
    // 双引号标识符 → 反引号（MySQL 标准，"Order" 等保留字必须用反引号）
    .replace(/"(\w+)"/g, '`$1`');
}

/**
 * 把 ISO 8601 时间戳自动转换为 MySQL DATETIME 兼容格式
 * MySQL 8.0 严格模式不接受 '2026-08-11T06:50:44.331Z'，需要转为 '2026-08-11 06:50:44'
 */
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
function adaptParams(params: any[] | undefined): any[] | undefined {
  if (!params || !Array.isArray(params)) return params;
  return params.map(p => {
    if (typeof p === 'string' && ISO_DATE_REGEX.test(p)) {
      return p.slice(0, 19).replace('T', ' ');
    }
    return p;
  });
}

/** 执行查询，返回第一行 */
export async function queryFirst(sql: string, ...params: any[]) {
  const pool = getPool();
  const [rows] = await pool.execute(adaptSql(sql), adaptParams(params) as any[]);
  return (rows as any[])[0] || null;
}

/** 执行查询，返回所有行 */
export async function queryAll(sql: string, ...params: any[]) {
  const pool = getPool();
  const [rows] = await pool.execute(adaptSql(sql), adaptParams(params) as any[]);
  return rows as any[];
}

/** 执行写入（INSERT/UPDATE/DELETE） */
export async function execute(sql: string, ...params: any[]): Promise<any> {
  const pool = getPool();
  const [result] = await pool.execute(adaptSql(sql), adaptParams(params) as any[]);
  // 统一返回格式：success + meta（含 changes/last_row_id）
  const meta = result as any;
  return {
    success: true,
    meta,
    changes: meta.affectedRows,
    last_row_id: meta.insertId,
  };
}

/** 批量事务执行 */
export async function batch(statements: Array<{ sql: string; params?: any[] }>) {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const { sql, params } of statements) {
      await conn.execute(adaptSql(sql), adaptParams(params) as any[]);
    }
    await conn.commit();
    return { success: true };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

/** 获取用户积分余额 */
export async function getUserPoints(userId: string) {
  const row = await queryFirst('SELECT balance FROM UserPoints WHERE userId = ?', userId) as any;
  return row?.balance || 0;
}

/** 获取用户积分流水（分页） */
export async function listPointsLedger(userId: string, page: number = 1, pageSize: number = 20) {
  const offset = (page - 1) * pageSize;
  const rows = await queryAll(
    'SELECT * FROM PointsLedger WHERE userId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?',
    userId, pageSize, offset
  );
  const countRow = await queryFirst('SELECT COUNT(*) as total FROM PointsLedger WHERE userId = ?', userId) as any;
  return { rows, total: countRow?.total || 0, page, pageSize };
}

/** 获取所有积分流水（管理后台） */
export async function listAllPointsLedger(page: number = 1, pageSize: number = 20) {
  const offset = (page - 1) * pageSize;
  const rows = await queryAll(
    'SELECT l.*, u.name as userName, u.email as userEmail FROM PointsLedger l LEFT JOIN User u ON l.userId = u.id ORDER BY l.createdAt DESC LIMIT ? OFFSET ?',
    pageSize, offset
  );
  const countRow = await queryFirst('SELECT COUNT(*) as total FROM PointsLedger') as any;
  return { rows, total: countRow?.total || 0, page, pageSize };
}

/** 管理员调整用户积分 — 原子操作 */
export async function addPoints(userId: string, amount: number, type: string, remark: string) {
  const now = new Date().toISOString();

  // 原子性 upsert
  await execute(
    'INSERT INTO UserPoints (userId, balance, updatedAt) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE balance = balance + ?, updatedAt = ?',
    userId, amount, now, amount, now
  );

  const row = await queryFirst('SELECT balance FROM UserPoints WHERE userId = ?', userId) as any;
  const newBalance = row?.balance || 0;

  await execute(
    'INSERT INTO PointsLedger (id, userId, amount, balance, type, remark, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    `pts_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, userId, amount, newBalance, type, remark, now
  );

  return newBalance;
}

/** 获取用户统计数据 */
export async function getUserStats(userId: string) {
  const orderCount = await queryFirst('SELECT COUNT(*) as cnt FROM "Order" WHERE userId = ?', userId) as any;
  const offeringCount = await queryFirst('SELECT COUNT(*) as cnt FROM OfferingRecord WHERE userId = ?', userId) as any;
  const ticketCount = await queryFirst('SELECT COUNT(*) as cnt FROM Ticket WHERE userId = ?', userId) as any;
  const pointsRow = await queryFirst('SELECT balance FROM UserPoints WHERE userId = ?', userId) as any;
  return {
    orders: orderCount?.cnt || 0,
    offerings: offeringCount?.cnt || 0,
    tickets: ticketCount?.cnt || 0,
    balance: pointsRow?.balance || 0,
  };
}

/** 获取优惠码列表（管理后台） */
export async function listCoupons(page: number = 1, pageSize: number = 20) {
  const offset = (page - 1) * pageSize;
  const rows = await queryAll(
    'SELECT * FROM Coupon ORDER BY createdAt DESC LIMIT ? OFFSET ?',
    pageSize, offset
  );
  const countRow = await queryFirst('SELECT COUNT(*) as total FROM Coupon') as any;
  return { rows, total: countRow?.total || 0, page, pageSize };
}

/** 按编码查找优惠码 */
export async function getCouponByCode(code: string) {
  return await queryFirst('SELECT * FROM Coupon WHERE code = ?', code);
}

/** 创建优惠码 */
export async function createCoupon(body: any) {
  const now = new Date().toISOString();
  const id = `cp_${Date.now()}`;
  await execute(
    `INSERT INTO Coupon (id, code, name, discountType, discountValue, minAmount, maxDiscount, totalCount, usedCount, expiryDate, isActive, description, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
    id,
    body.code,
    body.name,
    body.discountType || 'percent',
    body.discountValue || 0,
    body.minAmount || 0,
    body.maxDiscount || null,
    body.totalCount || 100,
    body.expiryDate || null,
    body.isActive !== undefined ? (body.isActive ? 1 : 0) : 1,
    body.description || null,
    now
  );
  return { id, code: body.code, name: body.name, isActive: 1 };
}

// ============ 用户标签辅助函数 ============

const TAGS_CONFIG_KEY = 'user_tags';
const TAGS_CONFIG_CATEGORY = 'admin';

/** 确保 UserTagRelation 表存在 */
export async function ensureTagRelationTable() {
  await execute(
    `CREATE TABLE IF NOT EXISTS "UserTagRelation" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "tagId" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  );
  await execute('CREATE INDEX IF NOT EXISTS "UserTagRelation_userId_idx" ON "UserTagRelation"("userId")');
  await execute('CREATE INDEX IF NOT EXISTS "UserTagRelation_tagId_idx" ON "UserTagRelation"("tagId")');
}

/** 获取所有用户标签 */
export async function getUserTags() {
  await ensureTagRelationTable();
  const row = await queryFirst(
    'SELECT value FROM SiteConfig WHERE category = ? AND key = ?',
    TAGS_CONFIG_CATEGORY, TAGS_CONFIG_KEY
  ) as any;
  const tags: any[] = row?.value ? JSON.parse(row.value) : [];

  const result = await Promise.all(tags.map(async (tag: any) => {
    const countRow = await queryFirst(
      'SELECT COUNT(*) as cnt FROM "UserTagRelation" WHERE tagId = ?',
      tag.id
    ) as any;
    return { ...tag, userCount: countRow?.cnt || 0 };
  }));

  return result.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
}

/** 创建用户标签 */
export async function createUserTag(tag: { name: string; color?: string; description?: string }) {
  const row = await queryFirst(
    'SELECT value FROM SiteConfig WHERE category = ? AND key = ?',
    TAGS_CONFIG_CATEGORY, TAGS_CONFIG_KEY
  ) as any;
  const tags: any[] = row?.value ? JSON.parse(row.value) : [];

  const newTag = {
    id: `tag_${Date.now()}`,
    name: tag.name,
    color: tag.color || '#6366f1',
    description: tag.description || '',
    createdAt: new Date().toISOString(),
  };

  tags.push(newTag);

  await execute(
    'INSERT OR REPLACE INTO SiteConfig (key, value, category, updatedAt) VALUES (?, ?, ?, ?)',
    TAGS_CONFIG_KEY, JSON.stringify(tags), TAGS_CONFIG_CATEGORY, new Date().toISOString()
  );

  return newTag;
}

/** 更新用户标签 */
export async function updateUserTag(id: string, updates: { name?: string; color?: string; description?: string }) {
  const row = await queryFirst(
    'SELECT value FROM SiteConfig WHERE category = ? AND key = ?',
    TAGS_CONFIG_CATEGORY, TAGS_CONFIG_KEY
  ) as any;
  const tags: any[] = row?.value ? JSON.parse(row.value) : [];

  const index = tags.findIndex((t: any) => t.id === id);
  if (index === -1) throw new Error('标签不存在');

  tags[index] = { ...tags[index], ...updates };

  await execute(
    'INSERT OR REPLACE INTO SiteConfig (key, value, category, updatedAt) VALUES (?, ?, ?, ?)',
    TAGS_CONFIG_KEY, JSON.stringify(tags), TAGS_CONFIG_CATEGORY, new Date().toISOString()
  );

  return tags[index];
}

/** 删除用户标签 */
export async function deleteUserTag(id: string) {
  await ensureTagRelationTable();

  const row = await queryFirst(
    'SELECT value FROM SiteConfig WHERE category = ? AND key = ?',
    TAGS_CONFIG_CATEGORY, TAGS_CONFIG_KEY
  ) as any;
  const tags: any[] = row?.value ? JSON.parse(row.value) : [];

  const filtered = tags.filter((t: any) => t.id !== id);

  await execute(
    'INSERT OR REPLACE INTO SiteConfig (key, value, category, updatedAt) VALUES (?, ?, ?, ?)',
    TAGS_CONFIG_KEY, JSON.stringify(filtered), TAGS_CONFIG_CATEGORY, new Date().toISOString()
  );

  await execute('DELETE FROM "UserTagRelation" WHERE tagId = ?', id);
}

/** 获取标签的用户列表 */
export async function getUsersByTagId(tagId: string, page: number = 1, pageSize: number = 20) {
  await ensureTagRelationTable();
  const offset = (page - 1) * pageSize;
  const rows = await queryAll(
    `SELECT r.*, u.name as userName, u.email as userEmail, u.phone as userPhone
     FROM "UserTagRelation" r LEFT JOIN User u ON r.userId = u.id
     WHERE r.tagId = ? ORDER BY r.createdAt DESC LIMIT ? OFFSET ?`,
    tagId, pageSize, offset
  );
  const countRow = await queryFirst(
    'SELECT COUNT(*) as total FROM "UserTagRelation" WHERE tagId = ?',
    tagId
  ) as any;
  return { rows, total: countRow?.total || 0, page, pageSize };
}

/** 获取用户的标签列表 */
export async function getUserTagsByUserId(userId: string) {
  await ensureTagRelationTable();
  const row = await queryFirst(
    'SELECT value FROM SiteConfig WHERE category = ? AND key = ?',
    TAGS_CONFIG_CATEGORY, TAGS_CONFIG_KEY
  ) as any;
  const allTags: any[] = row?.value ? JSON.parse(row.value) : [];

  const relations = await queryAll(
    'SELECT tagId FROM "UserTagRelation" WHERE userId = ?',
    userId
  );
  const tagIds = relations.map((r: any) => r.tagId);
  return allTags.filter((t: any) => tagIds.includes(t.id));
}

/** 给用户添加标签 */
export async function addTagsToUsers(userIds: string[], tagIds: string[]) {
  await ensureTagRelationTable();
  const now = new Date().toISOString();
  const statements: Array<{ sql: string; params?: any[] }> = [];

  for (const userId of userIds) {
    for (const tagId of tagIds) {
      statements.push({
        sql: 'INSERT OR IGNORE INTO "UserTagRelation" (id, userId, tagId, createdAt) VALUES (?, ?, ?, ?)',
        params: [`utr_${userId}_${tagId}`, userId, tagId, now],
      });
    }
  }

  if (statements.length > 0) {
    await batch(statements);
  }
  return { success: true, count: statements.length };
}

/** 移除用户的标签 */
export async function removeTagsFromUsers(userIds: string[], tagIds: string[]) {
  await ensureTagRelationTable();
  for (const userId of userIds) {
    for (const tagId of tagIds) {
      await execute('DELETE FROM "UserTagRelation" WHERE userId = ? AND tagId = ?', userId, tagId);
    }
  }
  return { success: true };
}

// ============ 提现管理辅助函数 ============

/** 确保 Withdrawal 表存在 */
export async function ensureWithdrawalTable() {
  await execute(
    `CREATE TABLE IF NOT EXISTS "Withdrawal" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "amount" REAL NOT NULL,
      "method" TEXT NOT NULL,
      "account" TEXT NOT NULL,
      "accountName" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "remark" TEXT,
      "auditRemark" TEXT,
      "auditorId" TEXT,
      "auditedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  );
  await execute('CREATE INDEX IF NOT EXISTS "Withdrawal_userId_idx" ON "Withdrawal"("userId")');
  await execute('CREATE INDEX IF NOT EXISTS "Withdrawal_status_idx" ON "Withdrawal"("status")');
  await execute('CREATE INDEX IF NOT EXISTS "Withdrawal_createdAt_idx" ON "Withdrawal"("createdAt")');
}

/** 获取提现汇总统计 */
export async function getWithdrawalStats() {
  await ensureWithdrawalTable();
  const pendingRow = await queryFirst(
    'SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as cnt FROM "Withdrawal" WHERE status = ?',
    'pending'
  ) as any;
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthRow = await queryFirst(
    'SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as cnt FROM "Withdrawal" WHERE createdAt >= ?',
    firstDay
  ) as any;
  return {
    pendingAmount: pendingRow?.total || 0,
    pendingCount: pendingRow?.cnt || 0,
    monthAmount: monthRow?.total || 0,
    monthCount: monthRow?.cnt || 0,
  };
}

// ============ 分润系统表 ============

export async function ensureCommissionTables() {
  await execute(`CREATE TABLE IF NOT EXISTS "CommissionRule" (
    "id" TEXT PRIMARY KEY,
    "agentId" TEXT,
    "productType" TEXT NOT NULL,
    "productId" TEXT,
    "baseRate" REAL NOT NULL DEFAULT 0,
    "tierBonus" REAL DEFAULT 0,
    "newCustomerBonus" REAL DEFAULT 0,
    "maxMarkupRate" REAL DEFAULT 0,
    "isActive" INTEGER DEFAULT 1,
    "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TEXT
  )`);
  await execute('CREATE INDEX IF NOT EXISTS "cr_agentId_idx" ON "CommissionRule"("agentId")');
  await execute('CREATE INDEX IF NOT EXISTS "cr_productType_idx" ON "CommissionRule"("productType")');

  await execute(`CREATE TABLE IF NOT EXISTS "CommissionRecord" (
    "id" TEXT PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "productId" TEXT,
    "orderAmount" REAL NOT NULL DEFAULT 0,
    "baseAmount" REAL NOT NULL DEFAULT 0,
    "commissionRate" REAL NOT NULL DEFAULT 0,
    "commissionAmount" REAL NOT NULL DEFAULT 0,
    "tierBonusAmount" REAL DEFAULT 0,
    "newCustomerBonusAmount" REAL DEFAULT 0,
    "totalCommission" REAL NOT NULL DEFAULT 0,
    "settlementId" TEXT,
    "status" TEXT DEFAULT 'pending',
    "clawbackAmount" REAL DEFAULT 0,
    "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TEXT
  )`);
  await execute('CREATE INDEX IF NOT EXISTS "crec_agentId_idx" ON "CommissionRecord"("agentId")');
  await execute('CREATE INDEX IF NOT EXISTS "crec_orderId_idx" ON "CommissionRecord"("orderId")');
  await execute('CREATE INDEX IF NOT EXISTS "crec_status_idx" ON "CommissionRecord"("status")');
  await execute('CREATE INDEX IF NOT EXISTS "crec_createdAt_idx" ON "CommissionRecord"("createdAt")');

  await execute(`CREATE TABLE IF NOT EXISTS "SettlementRecord" (
    "id" TEXT PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "periodStart" TEXT NOT NULL,
    "periodEnd" TEXT NOT NULL,
    "orderCount" INTEGER DEFAULT 0,
    "totalOrderAmount" REAL DEFAULT 0,
    "totalCommission" REAL DEFAULT 0,
    "clawbackAmount" REAL DEFAULT 0,
    "netCommission" REAL DEFAULT 0,
    "status" TEXT DEFAULT 'pending',
    "paidAt" TEXT,
    "paidMethod" TEXT,
    "paidAccount" TEXT,
    "auditorId" TEXT,
    "auditRemark" TEXT,
    "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TEXT
  )`);
  await execute('CREATE INDEX IF NOT EXISTS "sr_agentId_idx" ON "SettlementRecord"("agentId")');
  await execute('CREATE INDEX IF NOT EXISTS "sr_status_idx" ON "SettlementRecord"("status")');

  // Agent 表扩展字段
  const agentCols = await queryAll("SHOW COLUMNS FROM `Agent`") as any[];
  const agentColNames = agentCols.map(c => c.Field);
  const agentAlters = [
    ['commissionRate', 'REAL DEFAULT 0.3'],
    ['totalCommission', 'REAL DEFAULT 0'],
    ['pendingCommission', 'REAL DEFAULT 0'],
    ['currentMonthGMV', 'REAL DEFAULT 0'],
    ['settlementCycle', "TEXT DEFAULT 'weekly'"],
    ['bankName', 'TEXT'],
    ['bankAccount', 'TEXT'],
    ['bankAccountName', 'TEXT'],
    ['level', "TEXT DEFAULT 'saas'"],
    ['plan', "TEXT DEFAULT 'trial'"],
    ['planExpiry', 'TEXT'],
    ['balance', 'REAL DEFAULT 0'],
    ['referralCode', 'TEXT'],
    ['maxCustomers', 'INTEGER DEFAULT 500'],
  ];
  for (const [col, def] of agentAlters) {
    if (!agentColNames.includes(col)) {
      try { await execute(`ALTER TABLE "Agent" ADD COLUMN "${col}" ${def}`); } catch {}
    }
  }

  // Order 表扩展字段
  const orderCols = await queryAll("SHOW COLUMNS FROM `Order`") as any[];
  const orderColNames = orderCols.map(c => c.Field);
  const orderAlters = [
    ['agentId', 'TEXT'],
    ['agentReferralCode', 'TEXT'],
    ['isNewCustomer', 'INTEGER DEFAULT 0'],
    ['commissionRate', 'REAL'],
    ['commissionAmount', 'REAL DEFAULT 0'],
    ['commissionSettled', 'INTEGER DEFAULT 0'],
  ];
  for (const [col, def] of orderAlters) {
    if (!orderColNames.includes(col)) {
      try { await execute(`ALTER TABLE "Order" ADD COLUMN "${col}" ${def}`); } catch {}
    }
  }
}

/** 确保 Agent 表包含域名相关字段（subdomain, customDomain, customDomainExpiry） */
export async function ensureAgentDomainFields() {
  const agentCols = await queryAll("SHOW COLUMNS FROM `Agent`") as any[];
  const agentColNames = (agentCols || []).map(c => c.Field);
  const agentAlters: Array<[string, string]> = [
    ['subdomain', 'TEXT'],
    ['customDomain', 'TEXT'],
    ['customDomainExpiry', 'TEXT'],
  ];
  for (const [col, def] of agentAlters) {
    if (!agentColNames.includes(col)) {
      try { await execute(`ALTER TABLE "Agent" ADD COLUMN "${col}" ${def}`); } catch {}
    }
  }
  // 为子域名和独立域名创建索引，加快中间件查询
  try { await execute('CREATE INDEX IF NOT EXISTS "Agent_subdomain_idx" ON "Agent"("subdomain")'); } catch {}
  try { await execute('CREATE INDEX IF NOT EXISTS "Agent_customDomain_idx" ON "Agent"("customDomain")'); } catch {}
}

export async function ensureReferralCodeTable() {
  await execute(`CREATE TABLE IF NOT EXISTS "ReferralCode" (
    "id" TEXT PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "code" TEXT NOT NULL UNIQUE,
    "usageCount" INTEGER DEFAULT 0,
    "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  await execute('CREATE INDEX IF NOT EXISTS "rc_code_idx" ON "ReferralCode"("code")');
  await execute('CREATE INDEX IF NOT EXISTS "rc_agentId_idx" ON "ReferralCode"("agentId")');
}

export async function getUserReferralCode(userId: string): Promise<string | null> {
  const row = await queryFirst('SELECT agentReferralCode FROM "Order" WHERE userId = ? AND agentReferralCode IS NOT NULL LIMIT 1', userId) as any;
  return row?.agentReferralCode || null;
}

export async function getAgentByReferralCode(code: string) {
  await ensureReferralCodeTable();
  const row = await queryFirst('SELECT * FROM "ReferralCode" WHERE code = ?', code) as any;
  if (!row) return null;
  const agent = await queryFirst('SELECT * FROM "Agent" WHERE id = ?', row.agentId) as any;
  return agent ? { ...agent, referralCode: code } : null;
}

// ============ 祈福供品表 (OfferingSupply) ============

const SEED_SUPPLIES: Array<{
  name: string; icon: string; category: string; price: number;
  description: string; sortOrder: number; stock: number;
}> = [
  // 心愿祈福类（民俗祈福文化，无宗教属性）
  { name: '心愿福灯', icon: '🏮', category: 'wish', price: 28, description: '点亮一盏福灯，寄托美好心愿', sortOrder: 1, stock: 1000 },
  { name: '祈福带', icon: '🎀', category: 'wish', price: 9.9, description: '一条祈福带，系住一份祝愿', sortOrder: 2, stock: 2000 },
  { name: '平安香囊', icon: '🧧', category: 'wish', price: 18, description: '传统香囊，寄托平安祝愿', sortOrder: 3, stock: 1500 },
  { name: '心愿牌', icon: '🏷️', category: 'wish', price: 15, description: '写下心愿，挂在祈福墙上', sortOrder: 4, stock: 1500 },
  { name: '祈福莲花灯', icon: '🪷', category: 'wish', price: 38, description: '莲花灯，象征美好祝愿', sortOrder: 5, stock: 800 },
  { name: '千里福灯', icon: '🏮', category: 'wish', price: 36, description: '遥寄思念，福佑远方', sortOrder: 6, stock: 800 },
  // 文化纪念类（妈祖/关公/文昌等民俗文化，非遗保护范畴）
  { name: '妈祖文化纪念徽章', icon: '🌊', category: 'culture', price: 168, description: '妈祖信俗文化纪念，护佑平安顺遂', sortOrder: 1, stock: 500 },
  { name: '关公文化纪念卡', icon: '🎭', category: 'culture', price: 168, description: '弘扬关公忠义精神', sortOrder: 2, stock: 500 },
  { name: '文昌智慧书签', icon: '📚', category: 'culture', price: 128, description: '文昌文化纪念，祝愿学业进步', sortOrder: 3, stock: 500 },
  { name: '土地公民俗纪念', icon: '🏠', category: 'culture', price: 88, description: '传统民俗文化纪念', sortOrder: 4, stock: 800 },
  { name: '生肖守护纪念牌', icon: '🐲', category: 'culture', price: 66, description: '生肖民俗文化纪念', sortOrder: 5, stock: 800 },
  { name: '五福临门挂饰', icon: '🧧', category: 'culture', price: 58, description: '传统五福民俗挂饰', sortOrder: 6, stock: 800 },
  // 鲜花供品类
  { name: '鲜花', icon: '💐', category: 'offering', price: 9.9, description: '新鲜花束，清香雅致', sortOrder: 1, stock: 1000 },
  { name: '水果', icon: '🍎', category: 'offering', price: 15, description: '时令水果，新鲜可口', sortOrder: 2, stock: 800 },
  { name: '糕点', icon: '🍰', category: 'offering', price: 12, description: '传统糕点，精致可口', sortOrder: 3, stock: 600 },
  { name: '茶水', icon: '🍵', category: 'offering', price: 6, description: '清香好茶', sortOrder: 4, stock: 1000 },
  { name: '香烛', icon: '🕯️', category: 'offering', price: 8, description: '天然香烛，传统祭祀用品', sortOrder: 5, stock: 1000 },
  // 香烛用品类
  { name: '铜香炉', icon: '🏺', category: 'ritual', price: 28, description: '传统铜香炉', sortOrder: 1, stock: 500 },
  { name: '烛台', icon: '🕯️', category: 'ritual', price: 18, description: '传统烛台', sortOrder: 2, stock: 500 },
  { name: '供盘', icon: '🍽️', category: 'ritual', price: 15, description: '传统供盘', sortOrder: 3, stock: 500 },
];

export async function ensureOfferingSupplyTable() {
  try {
    const check = await queryAll("SHOW COLUMNS FROM `OfferingSupply`") as any[];
    const colNames = check.map(c => c.Field);
    if (colNames.includes('isActive') && colNames.length > 0) {
      const isActiveCol = check.find(c => c.Field === 'isActive');
      if (isActiveCol && isActiveCol.Type && isActiveCol.Type.toUpperCase().includes('BOOL')) {
        await execute('DROP TABLE IF EXISTS OfferingSupply');
      }
    }
  } catch {}

  await execute(`CREATE TABLE IF NOT EXISTS "OfferingSupply" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "image" TEXT,
    "price" REAL NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stock" INTEGER NOT NULL DEFAULT 0
  )`);

  const cols = await queryAll("SHOW COLUMNS FROM `OfferingSupply`") as any[];
  const colNames = cols.map(c => c.Field);
  const alters: Array<[string, string]> = [
    ['stock', 'INTEGER NOT NULL DEFAULT 0'],
  ];
  for (const [col, def] of alters) {
    if (!colNames.includes(col)) {
      try { await execute(`ALTER TABLE "OfferingSupply" ADD COLUMN "${col}" ${def}`); } catch {}
    }
  }
}

export async function seedDefaultSupplies(force = false) {
  await ensureOfferingSupplyTable();

  if (!force) {
    const countRow = await queryFirst('SELECT COUNT(*) as cnt FROM OfferingSupply') as any;
    if (countRow?.cnt && countRow.cnt > 0) return;
  }

  const now = new Date().toISOString();
  let inserted = 0;
  let errors: string[] = [];

  for (let i = 0; i < SEED_SUPPLIES.length; i++) {
    const s = SEED_SUPPLIES[i];
    try {
      await execute(
        `INSERT INTO OfferingSupply (id, name, icon, image, price, description, category, sortOrder, isActive, createdAt, stock)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        `sup_seed_${Date.now()}_${i}`,
        s.name,
        s.icon || null,
        null,
        s.price,
        s.description,
        s.category,
        s.sortOrder,
        1,
        now,
        s.stock
      );
      inserted++;
    } catch (err: any) {
      errors.push(`${s.name}: ${err?.message || String(err)}`);
      console.error(`Seed supply error (${s.name}):`, err?.message || err);
    }
  }
  console.log(`Seed supplies done: ${inserted} inserted, ${errors.length} errors`);
  if (errors.length > 0) console.error('Seed errors:', errors);
}

// ============ 卡密系统表 ============

/** 确保 CardKey 表存在 */
export async function ensureCardKeyTable() {
  await execute(
    `CREATE TABLE IF NOT EXISTS "CardKey" (
      "id" VARCHAR(255) NOT NULL PRIMARY KEY,
      "code" VARCHAR(255) NOT NULL,
      "type" VARCHAR(50) NOT NULL DEFAULT 'lingzhu',
      "value" DOUBLE NOT NULL,
      "price" DOUBLE NOT NULL DEFAULT 0,
      "status" VARCHAR(50) NOT NULL DEFAULT 'unused',
      "createdBy" VARCHAR(255),
      "usedBy" VARCHAR(255),
      "usedAt" DATETIME,
      "batchId" VARCHAR(255),
      "expiryAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY "CardKey_code_key" ("code")
    )`
  );
  await execute('CREATE INDEX IF NOT EXISTS "CardKey_code_idx" ON "CardKey"("code")');
  await execute('CREATE INDEX IF NOT EXISTS "CardKey_status_idx" ON "CardKey"("status")');
  await execute('CREATE INDEX IF NOT EXISTS "CardKey_batchId_idx" ON "CardKey"("batchId")');
  await execute('CREATE INDEX IF NOT EXISTS "CardKey_type_idx" ON "CardKey"("type")');
}

/** 确保 UpdateLog 表存在 */
export async function ensureUpdateLogTable() {
  await execute(
    `CREATE TABLE IF NOT EXISTS "UpdateLog" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "version" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "type" TEXT NOT NULL DEFAULT 'update',
      "isMajor" INTEGER NOT NULL DEFAULT 0,
      "changes" TEXT,
      "operatorId" TEXT,
      "operatorName" TEXT,
      "tag" TEXT,
      "status" TEXT NOT NULL DEFAULT 'success',
      "rollbackVersion" TEXT,
      "kind" TEXT NOT NULL DEFAULT 'manual',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  );
  await execute('CREATE INDEX IF NOT EXISTS "UpdateLog_version_idx" ON "UpdateLog"("version")');
  await execute('CREATE INDEX IF NOT EXISTS "UpdateLog_type_idx" ON "UpdateLog"("type")');
  await execute('CREATE INDEX IF NOT EXISTS "UpdateLog_createdAt_idx" ON "UpdateLog"("createdAt")');
  await execute('CREATE INDEX IF NOT EXISTS "UpdateLog_status_idx" ON "UpdateLog"("status")');
  await execute('CREATE INDEX IF NOT EXISTS "UpdateLog_kind_idx" ON "UpdateLog"("kind")');
}
