-- 为 AgentLicense 表添加 signature 字段
ALTER TABLE AgentLicense ADD COLUMN signature TEXT;

-- 为 Agent 表添加 isActive 字段（如果不存在）
-- ALTER TABLE Agent ADD COLUMN isActive INTEGER DEFAULT 1;
