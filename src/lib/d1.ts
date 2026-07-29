/**
 * D1 数据库工具 — 直接操作 Cloudflare D1，不经过 Prisma
 * 所有函数自动获取 D1 binding，兼容 Workers 和 Pages
 */

let _db: any = null;
let _dbPromise: Promise<any> | null = null;

async function getDB(): Promise<any> {
  if (_db) return _db;
  if (_dbPromise) return _dbPromise;

  _dbPromise = (async () => {
    try {
      const { getCloudflareContext } = await import('@opennextjs/cloudflare');
      const ctx = await getCloudflareContext({ async: true });
      _db = (ctx.env as any).DB;
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
  const orderCount = await queryFirst('SELECT COUNT(*) as cnt FROM OrderRecord WHERE userId = ?', userId) as any;
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
