"""
Pydantic Schemas for Products, Categories, and RFID Assignment.
Ensures strict validation and clear API documentation contracts.
"""

from typing import Optional
from pydantic import BaseModel, Field

class CategoryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

class ProductBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Product display name")
    category_id: int = Field(..., gt=0, description="Foreign key to category")
    unit_weight_grams: float = Field(default=500.00, gt=0, description="Nominal unit sample weight (~500g)")
    weight_tolerance_grams: float = Field(default=35.00, ge=5.0, description="Allowable scale variance (±g)")
    reorder_level: int = Field(default=2, ge=0, description="Low stock alert trigger threshold")

class ProductCreate(ProductBase):
    initial_stock_qty: int = Field(default=0, ge=0, description="Initial stock quantity on creation")
    rfid_uid: Optional[str] = Field(default=None, max_length=32, description="Optional physical RFID UID")

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100, description="Product display name")
    category_id: Optional[int] = Field(None, gt=0, description="Foreign key to category")
    unit_weight_grams: Optional[float] = Field(None, gt=0, description="Nominal unit weight in grams")
    weight_tolerance_grams: Optional[float] = Field(None, ge=5.0, description="Allowable weight variance in grams")
    reorder_level: Optional[int] = Field(None, ge=0, description="Reorder alert threshold")
    rfid_uid: Optional[str] = Field(None, max_length=32, description="Physical RFID UID (null or string)")
    current_stock_qty: Optional[int] = Field(None, ge=0, description="Adjusted stock quantity")

class RFIDAssignRequest(BaseModel):
    rfid_uid: str = Field(..., min_length=4, max_length=32, description="Scanned RFID tag hex UID")

class ProductResponse(BaseModel):
    id: int
    rfid_uid: Optional[str] = None
    name: str
    category_id: int
    category_name: str
    unit_weight_grams: float
    weight_tolerance_grams: float
    current_stock_qty: int
    current_total_weight: float
    reorder_level: int
    is_low_stock: bool
