CREATE TABLE IF NOT EXISTS UserPoints (
  userId TEXT PRIMARY KEY,
  balance INTEGER DEFAULT 0,
  updatedAt TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS PointsLedger (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  amount INTEGER NOT NULL,
  balance INTEGER NOT NULL,
  type TEXT NOT NULL,
  remark TEXT,
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ledger_userId ON PointsLedger(userId);
CREATE TABLE IF NOT EXISTS Coupon (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  value REAL NOT NULL,
  minAmount REAL DEFAULT 0,
  maxUses INTEGER,
  usedCount INTEGER DEFAULT 0,
  validFrom TEXT,
  validTo TEXT,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_coupon_code ON Coupon(code);
CREATE TABLE IF NOT EXISTS UserCoupon (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  couponId TEXT NOT NULL,
  usedAt TEXT,
  orderNo TEXT,
  createdAt TEXT NOT NULL
);
