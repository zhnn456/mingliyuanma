/**
 * D1 数据库工具 — 直接操作 Cloudflare D1，不经过 Prisma
 * 所有函数自动获取 D1 binding，兼容 Workers 和 Pages
 * 本地开发模式下自动回退到 Prisma 连接本地 SQLite
 */

let _db: any = null;
let _dbPromise: Promise<any> | null = null;

/**
 * 包装 Prisma Client 使其兼容 D1 API（prepare/bind/first/all/run）
 */
function wrapPrisma(prisma: any): any {
  return {
    prepare(sql: string) {
      return {
        bind(...params: any[]) {
          return {
            async first() {
              const rows = await prisma.$queryRawUnsafe(sql, ...params);
              return (rows as any[])[0] || null;
            },
            async all() {
              const results = await prisma.$queryRawUnsafe(sql, ...params);
              return { results: results as any[] };
            },
            async run() {
              await prisma.$executeRawUnsafe(sql, ...params);
              return { success: true };
            },
          };
        },
        async first(...params: any[]) {
          const rows = await prisma.$queryRawUnsafe(sql, ...params);
          return (rows as any[])[0] || null;
        },
        async all(...params: any[]) {
          const results = await prisma.$queryRawUnsafe(sql, ...params);
          return { results: results as any[] };
        },
        async run(...params: any[]) {
          await prisma.$executeRawUnsafe(sql, ...params);
          return { success: true };
        },
      };
    },
    batch() {
      const stmts: any[] = [];
      return {
        add(s: any) { stmts.push(s); },
        async run() {
          await prisma.$transaction(async (tx: any) => {
            for (const s of stmts) {
              await s._run?.(tx);
            }
          });
          return { success: true };
        },
      };
    },
  };
}

async function getDB(): Promise<any> {
  if (_db) return _db;
  if (_dbPromise) return _dbPromise;

  _dbPromise = (async () => {
    // 尝试 Cloudflare D1 binding
    try {
      const { getCloudflareContext } = await import('@opennextjs/cloudflare');
      const ctx = await getCloudflareContext({ async: true });
      if ((ctx.env as any)?.DB) {
        _db = (ctx.env as any).DB;
        return _db;
      }
    } catch {
      // Cloudflare context unavailable — fall through to Prisma
    }

    // 本地回退：使用 Prisma 连接 SQLite
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      console.log('[D1] Using Prisma fallback for local SQLite');
      _db = wrapPrisma(prisma);
      return _db;
    } catch (e: any) {
      console.error('[D1] Failed to get DB:', e?.message);
      throw new Error('数据库连接失败');
    }
  })();

  return _dbPromise;
}

/** 执行查询，返回第一行 */
export async function queryFirst(sql: string, ...params: any[]) {
  const db = await getDB();
  let stmt = db.prepare(sql);
  if (params.length > 0) stmt = stmt.bind(...params);
  return await stmt.first();
}

/** 执行查询，返回所有行 */
export async function queryAll(sql: string, ...params: any[]) {
  const db = await getDB();
  let stmt = db.prepare(sql);
  if (params.length > 0) stmt = stmt.bind(...params);
  const res = await stmt.all();
  return res.results || [];
}

/** 执行写入（INSERT/UPDATE/DELETE） */
export async function execute(sql: string, ...params: any[]) {
  const db = await getDB();
  let stmt = db.prepare(sql);
  if (params.length > 0) stmt = stmt.bind(...params);
  return await stmt.run();
}

/** 批量事务执行（D1 事务） */
export async function batch(statements: Array<{ sql: string; params?: any[] }>) {
  const db = await getDB();
  const batch = db.batch();
  for (const { sql, params } of statements) {
    let stmt = db.prepare(sql);
    if (params && params.length > 0) stmt = stmt.bind(...params);
    batch.add(stmt);
  }
  return await batch.run();
}

/** 获取用户灵珠余额 */
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

/** 管理员调整用户积分 */
export async function addPoints(userId: string, amount: number, type: string, remark: string) {
  const now = new Date().toISOString();
  const row = await queryFirst('SELECT balance FROM UserPoints WHERE userId = ?', userId) as any;
  const current = row?.balance || 0;
  const newBalance = current + amount;

  if (row) {
    await execute('UPDATE UserPoints SET balance = ?, updatedAt = ? WHERE userId = ?', newBalance, now, userId);
  } else {
    await execute('INSERT INTO UserPoints (userId, balance, updatedAt) VALUES (?, ?, ?)', userId, newBalance, now);
  }

  await execute(
    'INSERT INTO PointsLedger (id, userId, amount, balance, type, remark, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    `pts_${Date.now()}`, userId, amount, newBalance, type, remark, now
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
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`,
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
    "createdAt" TEXT DEFAULT (datetime('now')),
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
    "createdAt" TEXT DEFAULT (datetime('now')),
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
    "createdAt" TEXT DEFAULT (datetime('now')),
    "updatedAt" TEXT
  )`);
  await execute('CREATE INDEX IF NOT EXISTS "sr_agentId_idx" ON "SettlementRecord"("agentId")');
  await execute('CREATE INDEX IF NOT EXISTS "sr_status_idx" ON "SettlementRecord"("status")');

  // Agent 表扩展字段
  const agentCols = await queryAll("PRAGMA table_info('Agent')") as any[];
  const agentColNames = agentCols.map(c => c.name);
  const agentAlters = [
    ['commissionRate', 'REAL DEFAULT 0.2'],
    ['totalCommission', 'REAL DEFAULT 0'],
    ['pendingCommission', 'REAL DEFAULT 0'],
    ['currentMonthGMV', 'REAL DEFAULT 0'],
    ['settlementCycle', "TEXT DEFAULT 'weekly'"],
    ['bankName', 'TEXT'],
    ['bankAccount', 'TEXT'],
    ['bankAccountName', 'TEXT'],
  ];
  for (const [col, def] of agentAlters) {
    if (!agentColNames.includes(col)) {
      try { await execute(`ALTER TABLE "Agent" ADD COLUMN "${col}" ${def}`); } catch {}
    }
  }

  // Order 表扩展字段
  const orderCols = await queryAll("PRAGMA table_info('Order')") as any[];
  const orderColNames = orderCols.map(c => c.name);
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

export async function ensureReferralCodeTable() {
  await execute(`CREATE TABLE IF NOT EXISTS "ReferralCode" (
    "id" TEXT PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "code" TEXT NOT NULL UNIQUE,
    "usageCount" INTEGER DEFAULT 0,
    "createdAt" TEXT DEFAULT (datetime('now'))
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

// ============ 供奉供品表 (OfferingSupply) ============

const SEED_SUPPLIES: Array<{
  name: string; icon: string; category: string; price: number;
  description: string; sortOrder: number; stock: number;
}> = [
  { name: '释迦牟尼佛', icon: '🪷', category: 'buddha', price: 188, description: '释迦牟尼佛供奉，祈福平安', sortOrder: 1, stock: 100 },
  { name: '阿弥陀佛', icon: '🪷', category: 'buddha', price: 188, description: '阿弥陀佛供奉，往生极乐', sortOrder: 2, stock: 100 },
  { name: '药师佛', icon: '🪷', category: 'buddha', price: 188, description: '药师佛供奉，消灾解难', sortOrder: 3, stock: 100 },
  { name: '观音菩萨', icon: '🧘', category: 'buddha', price: 168, description: '观音菩萨供奉，救苦救难', sortOrder: 4, stock: 200 },
  { name: '地藏王菩萨', icon: '🧘', category: 'buddha', price: 168, description: '地藏王菩萨供奉，超度亡魂', sortOrder: 5, stock: 200 },
  { name: '弥勒佛', icon: '😊', category: 'buddha', price: 158, description: '弥勒佛供奉，笑口常开', sortOrder: 6, stock: 150 },
  { name: '土地公', icon: '🏠', category: 'deity', price: 88, description: '土地公供奉，守护家园', sortOrder: 1, stock: 300 },
  { name: '城隍爷', icon: '⚖️', category: 'deity', price: 128, description: '城隍爷供奉，护佑一方', sortOrder: 2, stock: 200 },
  { name: '妈祖', icon: '🌊', category: 'deity', price: 168, description: '妈祖供奉，海上平安', sortOrder: 3, stock: 200 },
  { name: '关帝', icon: '⚔️', category: 'deity', price: 168, description: '关帝供奉，忠义千秋', sortOrder: 4, stock: 250 },
  { name: '文昌帝君', icon: '📚', category: 'deity', price: 128, description: '文昌帝君供奉，学业有成', sortOrder: 5, stock: 200 },
  { name: '香炉', icon: '🕯️', category: 'ritual', price: 28, description: '精品铜香炉，供奉法器', sortOrder: 1, stock: 500 },
  { name: '烛台', icon: '🕯️', category: 'ritual', price: 18, description: '传统烛台，供灯法器', sortOrder: 2, stock: 500 },
  { name: '供盘', icon: '🍽️', category: 'ritual', price: 15, description: '供果盘，盛装供品', sortOrder: 3, stock: 500 },
  { name: '木鱼', icon: '🪵', category: 'ritual', price: 38, description: '精品木鱼，修行法器', sortOrder: 4, stock: 300 },
  { name: '念珠', icon: '📿', category: 'ritual', price: 48, description: '檀木念珠，持咒修行', sortOrder: 5, stock: 400 },
  { name: '鲜花', icon: '💐', category: 'offering', price: 9.9, description: '新鲜供花，清香供奉', sortOrder: 1, stock: 1000 },
  { name: '水果', icon: '🍎', category: 'offering', price: 15, description: '时令供果，敬献三宝', sortOrder: 2, stock: 800 },
  { name: '糕点', icon: '🍰', category: 'offering', price: 12, description: '传统糕点，供奉佳品', sortOrder: 3, stock: 600 },
  { name: '茶水', icon: '🍵', category: 'offering', price: 6, description: '好茶供奉，清净自在', sortOrder: 4, stock: 1000 },
  { name: '香烛', icon: '🕯️', category: 'offering', price: 8, description: '天然香烛，供奉燃香', sortOrder: 5, stock: 1000 },
  { name: '超度牌位', icon: '🪧', category: 'deliverance', price: 88, description: '超度牌位，亡灵安息', sortOrder: 1, stock: 200 },
  { name: '往生莲花', icon: '🪷', category: 'deliverance', price: 38, description: '往生莲花，接引往生', sortOrder: 2, stock: 300 },
  { name: '金元宝', icon: '💰', category: 'deliverance', price: 5, description: '金元宝供奉，冥资供养', sortOrder: 3, stock: 2000 },
];

export async function ensureOfferingSupplyTable() {
  try {
    const check = await queryAll("PRAGMA table_info('OfferingSupply')") as any[];
    const colNames = check.map(c => c.name);
    if (colNames.includes('isActive') && colNames.length > 0) {
      const isActiveCol = check.find(c => c.name === 'isActive');
      if (isActiveCol && isActiveCol.type && isActiveCol.type.toUpperCase().includes('BOOL')) {
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
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
    "stock" INTEGER NOT NULL DEFAULT 0
  )`);

  const cols = await queryAll("PRAGMA table_info('OfferingSupply')") as any[];
  const colNames = cols.map(c => c.name);
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
