-- ====================================================================
-- Smart Inventory and Warehouse Management System
-- Initial Seed Data (seed_data.sql)
-- Grocery items (~500g each)
-- ====================================================================

USE smart_inventory_db;

-- 1. Insert Standard Grocery Categories
INSERT INTO categories (id, name, description) VALUES
(1, 'Grains & Cereals', 'Whole grains, polished grains, and breakfast cereals'),
(2, 'Flours & Atta', 'Wheat, multi-grain, and processed culinary flours'),
(3, 'Pulses & Lentils', 'High-protein lentils, dal, and legumes'),
(4, 'Sweeteners', 'Refined sugar, organic jaggery, and natural sweeteners'),
(5, 'Edible Oils', 'Vegetable oils, mustard oil, and culinary fats'),
(6, 'Condiments & Salt', 'Edible salts and everyday meal enhancers')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. Insert Initial Grocery Products (~500g each)
-- Note: rfid_uid is set to NULL initially. Tags will be paired
-- during hardware setup on Day 6 & 8.
INSERT INTO products (id, rfid_uid, name, category_id, unit_weight_grams, weight_tolerance_grams, current_stock_qty, current_total_weight, reorder_level) VALUES
(1, NULL, 'Basmati Rice (500g Sample)', 1, 500.00, 35.00, 0, 0.00, 2),
(2, NULL, 'Wheat Flour / Atta (500g Sample)', 2, 500.00, 35.00, 0, 0.00, 2),
(3, NULL, 'Refined Sugar (500g Sample)', 4, 500.00, 30.00, 0, 0.00, 2),
(4, NULL, 'Toor Dal (500g Sample)', 3, 500.00, 30.00, 0, 0.00, 2),
(5, NULL, 'Cooking Sunflower Oil (500ml / ~455g)', 5, 455.00, 30.00, 0, 0.00, 2),
(6, NULL, 'Iodized Table Salt (500g Sample)', 6, 500.00, 25.00, 0, 0.00, 2)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 3. Initialize Warehouse Scale Metric (Max 10.00 kg limit)
INSERT INTO warehouse_metrics (id, max_capacity_kg, current_load_kg, status) VALUES
(1, 10.00, 0.00, 'NORMAL')
ON DUPLICATE KEY UPDATE max_capacity_kg=10.00;
