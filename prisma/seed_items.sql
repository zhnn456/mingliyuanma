INSERT OR IGNORE INTO OfferingCategory (id, name, icon, sortOrder, isActive) VALUES ('cat_default', '供奉物品', '🙏', 1, 1);
INSERT OR IGNORE INTO OfferingItem (id, categoryId, name, priceSingle, priceMonth, priceYear, isActive, sortOrder) VALUES 
('item_incense', 'cat_default', '清香', 100, 2500, 25000, 1, 1),
('item_flower', 'cat_default', '鲜花', 200, 5000, 50000, 1, 2),
('item_fruit', 'cat_default', '水果', 300, 7500, 75000, 1, 3),
('item_veg', 'cat_default', '素食', 500, 12000, 120000, 1, 4),
('item_lamp', 'cat_default', '供灯', 1000, 25000, 250000, 1, 5),
('item_tripod', 'cat_default', '宝鼎', 2000, 50000, 500000, 1, 6);
