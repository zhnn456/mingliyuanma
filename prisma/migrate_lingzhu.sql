CREATE TABLE IF NOT EXISTS RechargeOrder (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  amount INTEGER NOT NULL,
  lingzhu INTEGER NOT NULL,
  bonus INTEGER DEFAULT 0,
  payment TEXT NOT NULL DEFAULT 'mock',
  status TEXT NOT NULL DEFAULT 'pending',
  createdAt TEXT NOT NULL
);
