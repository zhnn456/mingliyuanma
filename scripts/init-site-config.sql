-- 创建站点配置表（key-value 结构）
CREATE TABLE IF NOT EXISTS SiteConfig (
  key TEXT PRIMARY KEY,
  value TEXT,
  updatedAt TEXT DEFAULT (datetime('now'))
);

-- 初始化品牌配置
INSERT OR IGNORE INTO SiteConfig (key, value, updatedAt) VALUES ('brandName', '玄机阁', datetime('now'));
INSERT OR IGNORE INTO SiteConfig (key, value, updatedAt) VALUES ('logo', '', datetime('now'));
INSERT OR IGNORE INTO SiteConfig (key, value, updatedAt) VALUES ('tagline', '传承千年智慧，融合现代科技', datetime('now'));
