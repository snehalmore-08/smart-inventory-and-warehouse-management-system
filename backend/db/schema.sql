-- ====================================================================
-- Smart Inventory and Warehouse Management System
-- Database Schema Definition (schema.sql)
-- Target DBMS: MySQL 8.0+ / MariaDB 10.4+
-- ====================================================================

-- 1. Create database with full UTF-8 support
CREATE DATABASE IF NOT EXISTS smart_inventory_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smart_inventory_db;

-- ====================================================================
-- Table 1: categories
-- Normalizes grocery categories to 3rd Normal Form (3NF)
-- ====================================================================
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ====================================================================
-- Table 2: products
-- Stores grocery master items (~500g each)
-- Note: rfid_uid is NULLABLE so products can be created in the system
-- before a physical tag is attached. Non-null values remain UNIQUE.
-- ====================================================================
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rfid_uid VARCHAR(32) NULL UNIQUE,                 -- Hardware RFID Tag UID (Hex string)
    name VARCHAR(100) NOT NULL,                       -- E.g. Rice, Wheat Flour, Sugar, etc.
    category_id INT NOT NULL,                         -- Foreign key to categories(id)
    unit_weight_grams DECIMAL(7, 2) NOT NULL DEFAULT 500.00,  -- Nominal weight (~500g)
    weight_tolerance_grams DECIMAL(5, 2) NOT NULL DEFAULT 35.00, -- Allowable scale variance (±35g)
    current_stock_qty INT NOT NULL DEFAULT 0,         -- Integer count of items in stock
    current_total_weight DECIMAL(9, 2) NOT NULL DEFAULT 0.00, -- Cumulative physical weight on scale (grams)
    reorder_level INT NOT NULL DEFAULT 2,             -- Low-stock threshold for Min-Heap priority queue
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id) REFERENCES categories(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
        
    INDEX idx_product_category (category_id),
    INDEX idx_product_rfid (rfid_uid)
) ENGINE=InnoDB;

-- ====================================================================
-- Table 3: inventory_transactions
-- Immutable audit log for every physical stock-in / stock-out event
-- ====================================================================
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,                          -- Foreign key to products(id)
    transaction_type ENUM('STOCK_IN', 'STOCK_OUT') NOT NULL,
    measured_weight_grams DECIMAL(7, 2) NOT NULL,     -- Physical weight captured by HX711 Load Cell
    quantity_delta INT NOT NULL,                      -- +1 for Stock-In, -1 for Stock-Out
    previous_stock_qty INT NOT NULL,                  -- Unit count before event
    new_stock_qty INT NOT NULL,                       -- Unit count after event
    previous_total_weight DECIMAL(9, 2) NOT NULL,     -- Stored scale weight before event (grams)
    new_total_weight DECIMAL(9, 2) NOT NULL,          -- Stored scale weight after event (grams)
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes VARCHAR(255) NULL,
    
    CONSTRAINT fk_trans_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
        
    INDEX idx_trans_product (product_id),
    INDEX idx_trans_timestamp (timestamp)
) ENGINE=InnoDB;

-- ====================================================================
-- Table 4: warehouse_metrics
-- Historical snapshot of total warehouse load vs 10 kg safety limit
-- (Note: Primary 10 kg overload check is enforced in Python Backend logic)
-- ====================================================================
CREATE TABLE IF NOT EXISTS warehouse_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    max_capacity_kg DECIMAL(5, 2) NOT NULL DEFAULT 10.00,
    current_load_kg DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    status ENUM('NORMAL', 'WARNING_CAPACITY_LIMIT', 'OVERLOAD') NOT NULL DEFAULT 'NORMAL',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
