/**
 * D1 数据库工具 — 直接操作 Cloudflare D1，不经过 Prisma
 * 所有函数自动获取 D1 binding，兼容 Workers 和 Pages
 */

let _db: any = null;

async function getDB(): Promise<any> {
  if (_db) return _db;
  try {
    const { getCloudflareContext } = require('@opennextjs/cloudflare');
    const ctx = await getCloudflareContext({ async: true });
    _db = ctx.env.DB;
    return _db;
  } catch (e: any) {
    console.error('[D1] Failed to get DB:', e?.message);
    throw new Error('数据库连接失败');
  }
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

// ============= 业务查询封装 =============

/** 通过 ID 查用户 */
export async function getUserById(id: string) {
  return queryFirst('SELECT * FROM User WHERE id = ?', id);
}

/** 通过邮箱查用户 */
export async function getUserByEmail(email: string) {
  return queryFirst('SELECT * FROM User WHERE email = ?', email.toLowerCase());
}

/** 查所有用户（分页） */
export async function listUsers(page = 1, pageSize = 20, keyword?: string) {
  const offset = (page - 1) * pageSize;
  let sql = 'SELECT id, email, name, phone, role, memberLevel, memberExpiry, dailyUsage, lastUsageDate, createdAt FROM User';
  let countSql = 'SELECT COUNT(*) as total FROM User';
  const params: any[] = [];
  
  if (keyword) {
    const like = `%${keyword}%`;
    sql += ` WHERE email LIKE ? OR name LIKE ? OR phone LIKE ?`;
    countSql += ` WHERE email LIKE ? OR name LIKE ? OR phone LIKE ?`;
    params.push(like, like, like);
  }
  
  sql += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
  params.push(pageSize, offset);
  
  const users = await queryAll(sql, ...params);
  const totalResult = await queryFirst(countSql, ...(keyword ? [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`] : []));
  
  return { users, total: (totalResult as any)?.total || 0 };
}

/** 查用户关联统计 */
export async function getUserStats(userId: string) {
  const [bazi, ziwei, qimen, meihua, orders, offerings] = await Promise.all([
    queryFirst('SELECT COUNT(*) as count FROM BaziRecord WHERE userId = ?', userId),
    queryFirst('SELECT COUNT(*) as count FROM ZiweiRecord WHERE userId = ?', userId),
    queryFirst('SELECT COUNT(*) as count FROM QimenRecord WHERE userId = ?', userId),
    queryFirst('SELECT COUNT(*) as count FROM MeihuaRecord WHERE userId = ?', userId),
    queryFirst('SELECT COUNT(*) as count FROM "Order" WHERE userId = ?', userId),
    queryFirst('SELECT COUNT(*) as count FROM OfferingRecord WHERE userId = ?', userId),
  ]);
  return {
    baziRecords: (bazi as any)?.count || 0,
    ziweiRecords: (ziwei as any)?.count || 0,
    qimenRecords: (qimen as any)?.count || 0,
    meihuaRecords: (meihua as any)?.count || 0,
    orders: (orders as any)?.count || 0,
    offerings: (offerings as any)?.count || 0,
  };
}

/** 查订单列表 */
export async function listOrders(page = 1, pageSize = 20, status?: string, userId?: string) {
  const offset = (page - 1) * pageSize;
  let sql = `SELECT o.*, u.email as userEmail, u.name as userName FROM "Order" o LEFT JOIN User u ON o.userId = u.id WHERE 1=1`;
  let countSql = `SELECT COUNT(*) as total FROM "Order" WHERE 1=1`;
  const params: any[] = [];
  const countParams: any[] = [];

  if (status) { sql += ` AND o.status = ?`; countSql += ` AND status = ?`; params.push(status); countParams.push(status); }
  if (userId) { sql += ` AND o.userId = ?`; countSql += ` AND userId = ?`; params.push(userId); countParams.push(userId); }

  sql += ' ORDER BY o.createdAt DESC LIMIT ? OFFSET ?';
  params.push(pageSize, offset);

  const orders = await queryAll(sql, ...params);
  const totalResult = await queryFirst(countSql, ...countParams);
  return { orders, total: (totalResult as any)?.total || 0 };
}

/** 收入统计 */
export async function getRevenueStats(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  
  const paidOrders = await queryAll(
    `SELECT * FROM "Order" WHERE status = 'paid' AND createdAt >= ? ORDER BY createdAt`,
    since
  ) as any[];

  const totalRevenue = paidOrders.reduce((s: number, o: any) => s + (o.amount || 0), 0);
  const refundOrders = paidOrders.filter((o: any) => o.status === 'refunded');
  const refundTotal = refundOrders.reduce((s: number, o: any) => s + (o.amount || 0), 0);

  // 每日汇总
  const dailyMap: Record<string, { amount: number; count: number }> = {};
  paidOrders.forEach((o: any) => {
    const date = (o.createdAt || '').split('T')[0];
    if (!dailyMap[date]) dailyMap[date] = { amount: 0, count: 0 };
    dailyMap[date].amount += o.amount || 0;
    dailyMap[date].count += 1;
  });

  return {
    summary: {
      totalRevenue,
      totalOrders: paidOrders.length,
      avgOrderValue: paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0,
      refundTotal,
      refundCount: refundOrders.length,
      netRevenue: totalRevenue - refundTotal,
    },
    dailyRevenue: Object.entries(dailyMap).map(([date, data]) => ({ date, ...data })),
    revenueByType: aggregateBy(paidOrders, 'type'),
    revenueByMethod: aggregateBy(paidOrders, 'paymentMethod'),
  };
}

function aggregateBy(orders: any[], field: string) {
  const map: Record<string, { amount: number; count: number }> = {};
  orders.forEach((o: any) => {
    const key = o[field] || '未知';
    if (!map[key]) map[key] = { amount: 0, count: 0 };
    map[key].amount += o.amount || 0;
    map[key].count += 1;
  });
  return Object.entries(map).map(([key, val]) => ({ type: key, ...val }));
}

// ============= SiteConfig 操作 =============

export async function getConfig(key: string) {
  const row = await queryFirst('SELECT value FROM SiteConfig WHERE key = ?', key);
  return (row as any)?.value || null;
}

export async function setConfig(key: string, value: string, category = 'general') {
  await execute('INSERT OR REPLACE INTO SiteConfig (key, value, category, updatedAt) VALUES (?, ?, ?, ?)',
    key, value, category, new Date().toISOString());
}

export async function listConfigs(category?: string) {
  if (category) return queryAll('SELECT * FROM SiteConfig WHERE category = ? ORDER BY key', category);
  return queryAll('SELECT * FROM SiteConfig ORDER BY key');
}

// ============= Agent 操作 =============

export async function listAgents() {
  return queryAll('SELECT * FROM Agent ORDER BY createdAt DESC');
}

export async function getAgentWithUser(agentId: string) {
  return queryFirst(
    'SELECT a.*, u.email as userEmail, u.name as userName FROM Agent a LEFT JOIN User u ON a.userId = u.id WHERE a.id = ?',
    agentId
  );
}

// ============= 积分系统 =============

export async function getUserPoints(userId: string) {
  const row = await queryFirst('SELECT balance FROM UserPoints WHERE userId = ?', userId);
  return (row as any)?.balance || 0;
}

export async function addPoints(userId: string, amount: number, type: string, remark = '') {
  const current = await getUserPoints(userId);
  const newBalance = current + amount;
  const id = `pts_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  await execute(
    'INSERT INTO PointsLedger (id, userId, amount, balance, type, remark, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    id, userId, amount, newBalance, type, remark, now
  );
  await execute(
    'INSERT OR REPLACE INTO UserPoints (userId, balance, updatedAt) VALUES (?, ?, ?)',
    userId, newBalance, now
  );
  return newBalance;
}

export async function listPointsLedger(userId: string, page = 1, pageSize = 20) {
  const total = (await queryFirst('SELECT COUNT(*) as c FROM PointsLedger WHERE userId = ?', userId) as any)?.c || 0;
  const rows = await queryAll('SELECT * FROM PointsLedger WHERE userId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?',
    userId, pageSize, (page - 1) * pageSize);
  return { rows, total };
}

export async function listAllPointsLedger(page = 1, pageSize = 20) {
  const total = (await queryFirst('SELECT COUNT(*) as c FROM PointsLedger') as any)?.c || 0;
  const rows = await queryAll(
    'SELECT p.*, u.email as userEmail FROM PointsLedger p LEFT JOIN User u ON p.userId = u.id ORDER BY p.createdAt DESC LIMIT ? OFFSET ?',
    pageSize, (page - 1) * pageSize);
  return { rows, total };
}

// ============= 优惠券系统 =============

export async function listCoupons(page = 1, pageSize = 20) {
  const total = (await queryFirst('SELECT COUNT(*) as c FROM Coupon') as any)?.c || 0;
  const rows = await queryAll('SELECT * FROM Coupon ORDER BY createdAt DESC LIMIT ? OFFSET ?', pageSize, (page - 1) * pageSize);
  return { rows, total };
}

export async function getCouponByCode(code: string) {
  return queryFirst('SELECT * FROM Coupon WHERE code = ?', code);
}

export async function createCoupon(data: any) {
  const id = `cpn_${Date.now()}`;
  await execute(
    `INSERT INTO Coupon (id, code, name, type, value, minAmount, maxUses, validFrom, validTo, isActive, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    id, data.code, data.name, data.type, data.value, data.minAmount || 0,
    data.maxUses || null, data.validFrom || null, data.validTo || null, new Date().toISOString()
  );
  return { id };
}

export async function listAuditLogs(limit = 50, offset = 0, action?: string) {
  let sql = "SELECT * FROM SiteConfig WHERE category = 'audit'";
  const params: any[] = [];
  if (action) { sql += ' AND value LIKE ?'; params.push(`%"action":"${action}"%`); }
  sql += ' ORDER BY key DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  const rows = await queryAll(sql, ...params) as any[];
  const logs = rows.map((r: any) => {
    try { return { id: r.key, ...JSON.parse(r.value) }; } catch { return null; }
  }).filter(Boolean);
  return logs;
}

// ============= 历史记录 =============

export async function getUserRecords(userId: string, type?: string, limit = 50) {
  const results: any[] = [];
  const tables = type ? [{ name: type + 'Record', type }] :
    [{ name: 'BaziRecord', type: 'bazi' }, { name: 'ZiweiRecord', type: 'ziwei' },
     { name: 'QimenRecord', type: 'qimen' }, { name: 'MeihuaRecord', type: 'meihua' }];

  for (const t of tables) {
    const rows = await queryAll(`SELECT * FROM "${t.name}" WHERE userId = ? ORDER BY createdAt DESC LIMIT ?`, userId, limit) as any[];
    rows.forEach((r: any) => results.push({ id: r.id, type: t.type, createdAt: r.createdAt, data: r }));
  }
  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return results.slice(0, limit);
}

