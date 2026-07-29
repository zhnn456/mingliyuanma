-- 运势分析表
CREATE TABLE IF NOT EXISTS Fortune (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  date TEXT NOT NULL,
  type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
  content TEXT NOT NULL, -- JSON: fortune analysis
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_fortune_user_date ON Fortune(userId, date);

-- 客服工单表
CREATE TABLE IF NOT EXISTS Ticket (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- 'billing', 'technical', 'account', 'other'
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'closed'
  priority TEXT NOT NULL DEFAULT 'normal', -- 'low', 'normal', 'high'
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ticket_user ON Ticket(userId);

-- 工单消息表
CREATE TABLE IF NOT EXISTS TicketMessage (
  id TEXT PRIMARY KEY,
  ticketId TEXT NOT NULL,
  userId TEXT NOT NULL,
  content TEXT NOT NULL,
  isStaff INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ticket_msg ON TicketMessage(ticketId);
