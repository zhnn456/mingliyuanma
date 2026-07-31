-- 插入测试代理商到中央管理后台数据库

-- 1. 先删除旧数据（如果存在）
DELETE FROM AgentLicense WHERE agentId = 'agt_test_001';
DELETE FROM Agent WHERE id = 'agt_test_001';
DELETE FROM User WHERE id = 'usr_test_agent_001';

-- 2. 创建用户账号
INSERT INTO User (id, email, passwordHash, name, phone, role, memberLevel, createdAt, updatedAt)
VALUES ('usr_test_agent_001', 'agent-test@example.com', '$2a$10$placeholder', '测试代理商管理员', '13800000000', 'agent', 'lifetime', datetime('now'), datetime('now'));

-- 3. 创建代理商记录
INSERT INTO Agent (id, userId, companyName, contactName, contactPhone, domain, brandName, licenseKey, licenseExpiry, siteConfig, isActive, createdAt, updatedAt)
VALUES 
(
  'agt_test_001',
  'usr_test_agent_001',
  '测试代理商',
  '管理员',
  '13800000000',
  'agent-test.zhnn456.workers.dev',
  '测试代理商',
  'LIC.eyJhZ2VudElkIjoiYWd0X3Rlc3RfMDAxIiwiZmVhdHVyZXMiOlsiYmF6aSIsInppd2VpIiwicWltZW4iLCJtZWlodWEiXSwibWF4VXNlcnMiOjEwMDAsImlzc3VlZEF0IjoxNzg1NDc3NTc4MTczLCJleHBpcnlBdCI6MTgxNzAxMzU3ODE3MywidmVyc2lvbiI6MiwiZG9tYWluIjoiYWdlbnQtdGVzdC56aG5uNDU2LndvcmtlcnMuZGV2IiwibGV2ZWwiOiJiYXNpYyIsIm1vbnRoblGZWUiOjk5fQ.c681c555d3eef6aa19f9731ce04d988b3af144c9b91fd8c995d5ab94adcc19a6',
  '2027-07-31T23:59:59Z',
  '{"maxUsers":1000,"customPricing":false,"whiteLabel":false,"level":"basic","monthlyFee":99}',
  1,
  datetime('now'),
  datetime('now')
);

-- 4. 创建授权码记录
INSERT INTO AgentLicense (id, agentId, licenseKey, domain, maxUsers, expiryAt, features, status, createdAt, updatedAt, signature)
VALUES 
(
  'lic_test_001',
  'agt_test_001',
  'LIC.eyJhZ2VudElkIjoiYWd0X3Rlc3RfMDAxIiwiZmVhdHVyZXMiOlsiYmF6aSIsInppd2VpIiwicWltZW4iLCJtZWlodWEiXSwibWF4VXNlcnMiOjEwMDAsImlzc3VlZEF0IjoxNzg1NDc3NTc4MTczLCJleHBpcnlBdCI6MTgxNzAxMzU3ODE3MywidmVyc2lvbiI6MiwiZG9tYWluIjoiYWdlbnQtdGVzdC56aG5uNDU2LndvcmtlcnMuZGV2IiwibGV2ZWwiOiJiYXNpYyIsIm1vbnRoblGZWUiOjk5fQ.c681c555d3eef6aa19f9731ce04d988b3af144c9b91fd8c995d5ab94adcc19a6',
  'agent-test.zhnn456.workers.dev',
  1000,
  '2027-07-31T23:59:59Z',
  '["bazi","ziwei","qimen","meihua"]',
  'active',
  datetime('now'),
  datetime('now'),
  'c681c555d3eef6aa19f9731ce04d988b3af144c9b91fd8c995d5ab94adcc19a6'
);
