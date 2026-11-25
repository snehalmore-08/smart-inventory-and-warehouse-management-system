"""
Configuration Settings for Smart Inventory and Warehouse Management System.
Includes database connection parameters and hardware safety thresholds.
"""

import os
from pydantic import BaseModel

class Settings(BaseModel):
    # Application Info
    APP_NAME: str = "Smart Inventory Management API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Database Settings (XAMPP MySQL defaults)
    DB_HOST: str = os.getenv("DB_HOST", "127.0.0.1")
    DB_PORT: int = int(os.getenv("DB_PORT", "3306"))
    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
    DB_NAME: str = os.getenv("DB_NAME", "smart_inventory_db")
    
    # Hardware Safety Limits (10 kg Max Load Cell Capacity)
    MAX_CAPACITY_KG: float = 10.00
    MAX_CAPACITY_GRAMS: float = 10000.00
    
    # Weight Tolerance for Sample Grocery Packets (grams)
    DEFAULT_WEIGHT_TOLERANCE_GRAMS: float = 35.00

settings = Settings()
