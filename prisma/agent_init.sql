-- 代理商数据库初始化脚本
-- 版本：v4.0.0

CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  avatar TEXT,
  role TEXT DEFAULT 'user',
  memberLevel TEXT DEFAULT 'basic',
  memberExpiryAt TEXT,
  agentId TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS "Order" (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  orderData TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS "Settlement" (
  id TEXT PRIMARY KEY,
  agentId TEXT NOT NULL,
  period TEXT NOT NULL,
  amount REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  note TEXT,
  createdBy TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT
);

CREATE TABLE IF NOT EXISTS "CommissionRecord" (
  id TEXT PRIMARY KEY,
  agentId TEXT NOT NULL,
  orderId TEXT NOT NULL,
  orderAmount REAL NOT NULL,
  commissionRate REAL NOT NULL,
  commissionAmount REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  period TEXT,
  createdAt TEXT DEFAULT (datetime('now'))
);
