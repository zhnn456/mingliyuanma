-- 为中央数据库添加代理商同步日志表
CREATE TABLE IF NOT EXISTS AgentSyncLog (
  id TEXT PRIMARY KEY,
  agentId TEXT NOT NULL,
  syncTime TEXT NOT NULL,
  version TEXT,
  status TEXT DEFAULT 'online',
  createdAt TEXT DEFAULT (datetime('now'))
);

-- 为 Agent 表添加 lastSyncAt 和 lastVersion 字段
ALTER TABLE Agent ADD COLUMN lastSyncAt TEXT;
ALTER TABLE Agent ADD COLUMN lastVersion TEXT;
ALTER TABLE Agent ADD COLUMN systemStatus TEXT DEFAULT 'online';
