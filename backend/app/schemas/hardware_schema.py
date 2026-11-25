"""
Pydantic Schemas for Hardware Scans (ESP32, RFID RC522, Load Cell).
"""

from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class HardwareScanPayload(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    rfid_uid: str = Field(..., min_length=1, max_length=32, description="Hex UID read by RFID RC522")
    measured_weight_grams: float = Field(..., description="Weight read by HX711 Load Cell in grams")
    operation_mode: Optional[str] = Field(default="AUTO", description="AUTO, STOCK_IN, or STOCK_OUT")

class HardwareScanResponse(BaseModel):
    success: bool
    message: str
    product_id: Optional[int] = None
    product_name: Optional[str] = None
    rfid_uid: Optional[str] = None
    transaction_type: Optional[str] = None
    measured_weight_grams: Optional[float] = None
    current_stock_qty: Optional[int] = None
    current_total_weight_grams: Optional[float] = None
    total_scale_load_kg: Optional[float] = None
    is_low_stock: Optional[bool] = None
