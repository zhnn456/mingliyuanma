-- ============================================================
-- 合规改造：供奉系统去宗教化（生产库存量数据更新）
-- 用法：mysql -u ming8 -p'Ming8@2026!' ming8_db < scripts/update_supplies_compliance.sql
-- 说明：所有更新均为"行内改名"（id 不变），历史供奉记录的 itemId 引用
--       依然有效，展示时自动跟随新名称，无需改动记录表。
-- ============================================================
SET NAMES utf8mb4;

-- 1. 分类：新增 4 个合规分类，旧分类停用（保留行避免引用错误）
INSERT INTO `OfferingCategory` (`id`, `name`, `icon`, `description`, `sortOrder`, `isActive`, `createdAt`)
VALUES
('cat_wish',    '心愿祈福', '🏮', '寄托心愿，民俗祈福',           1, 1, NOW()),
('cat_culture', '文化纪念', '🎐', '妈祖、关公、文昌等民俗文化纪念', 2, 1, NOW()),
('cat_offering','鲜花供品', '🌸', '鲜花水果等传统供品',           3, 1, NOW()),
('cat_ritual',  '香烛用品', '🕯️', '香烛等传统祭祀用品',           4, 1, NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), icon = VALUES(icon), description = VALUES(description), sortOrder = VALUES(sortOrder), isActive = 1;

UPDATE `OfferingCategory` SET isActive = 0 WHERE id IN ('cat_buddha', 'cat_deity', 'cat_deliverance');

-- 2. 供品行内改名（id 不变，历史记录自动跟随新名称）
-- 佛菩萨 → 心愿祈福类
UPDATE `OfferingSupply` SET name = '心愿福灯', icon = '🏮', price = 28,  description = '点亮一盏福灯，寄托美好心愿', category = 'wish', sortOrder = 1, isActive = 1 WHERE name IN ('释迦牟尼佛', '阿弥陀佛');
UPDATE `OfferingSupply` SET name = '祈福带',   icon = '🎀', price = 9.9, description = '一条祈福带，系住一份祝愿',   category = 'wish', sortOrder = 2, isActive = 1 WHERE name IN ('药师佛', '念珠');
UPDATE `OfferingSupply` SET name = '平安香囊', icon = '🧧', price = 18,  description = '传统香囊，寄托平安祝愿',     category = 'wish', sortOrder = 3, isActive = 1 WHERE name IN ('观音菩萨', '城隍爷');
UPDATE `OfferingSupply` SET name = '心愿牌',   icon = '🏷️', price = 15,  description = '写下心愿，挂在祈福墙上',     category = 'wish', sortOrder = 4, isActive = 1 WHERE name IN ('地藏王菩萨', '追思牌位', '木鱼');
UPDATE `OfferingSupply` SET name = '祈福莲花灯', icon = '🪷', price = 38, description = '莲花灯，象征美好祝愿',       category = 'wish', sortOrder = 5, isActive = 1 WHERE name IN ('弥勒佛', '祈福莲花', '金元宝');
UPDATE `OfferingSupply` SET name = '千里福灯', icon = '🏮', price = 36,  description = '遥寄思念，福佑远方',         category = 'wish', sortOrder = 6, isActive = 1 WHERE name = '土地公';
-- 民俗神明 → 文化纪念类
UPDATE `OfferingSupply` SET name = '妈祖文化纪念徽章', icon = '🌊', price = 168, description = '妈祖信俗文化纪念，护佑平安顺遂', category = 'culture', sortOrder = 1, isActive = 1 WHERE name = '妈祖';
UPDATE `OfferingSupply` SET name = '关公文化纪念卡', icon = '🎭', price = 168, description = '弘扬关公忠义精神', category = 'culture', sortOrder = 2, isActive = 1 WHERE name = '关帝';
UPDATE `OfferingSupply` SET name = '文昌智慧书签', icon = '📚', price = 128, description = '文昌文化纪念，祝愿学业进步', category = 'culture', sortOrder = 3, isActive = 1 WHERE name = '文昌帝君';
-- 法器/供品 → 香烛用品/鲜花供品（描述去宗教化）
UPDATE `OfferingSupply` SET name = '铜香炉', icon = '🏺', description = '传统铜香炉', category = 'ritual', sortOrder = 1, isActive = 1 WHERE name = '香炉';
UPDATE `OfferingSupply` SET description = '传统烛台', category = 'ritual', sortOrder = 2, isActive = 1 WHERE name = '烛台';
UPDATE `OfferingSupply` SET description = '传统供盘', sortOrder = 3, isActive = 1 WHERE name = '供盘';
UPDATE `OfferingSupply` SET description = '新鲜花束，清香雅致', isActive = 1 WHERE name = '鲜花';
UPDATE `OfferingSupply` SET description = '时令水果，新鲜可口', isActive = 1 WHERE name = '水果';
UPDATE `OfferingSupply` SET description = '传统糕点，精致可口', isActive = 1 WHERE name = '糕点';
UPDATE `OfferingSupply` SET description = '清香好茶', isActive = 1 WHERE name = '茶水';
UPDATE `OfferingSupply` SET description = '天然香烛，传统祭祀用品', isActive = 1 WHERE name = '香烛';

-- 3. 补充新种子（老库可能没有）
INSERT IGNORE INTO `OfferingSupply` (`id`, `name`, `icon`, `image`, `price`, `description`, `category`, `sortOrder`, `isActive`, `createdAt`, `stock`) VALUES
('sup_seed_11', '生肖守护纪念牌', '🐲', NULL, 66, '生肖民俗文化纪念', 'culture', 5, 1, NOW(), 800),
('sup_seed_12', '五福临门挂饰', '🧧', NULL, 58, '传统五福民俗挂饰', 'culture', 6, 1, NOW(), 800);

-- 4. 验证
SELECT '供品总数' AS 检查项, COUNT(*) AS 数量 FROM OfferingSupply WHERE isActive = 1;
SELECT name, category, description FROM OfferingSupply WHERE isActive = 1 ORDER BY category, sortOrder;
