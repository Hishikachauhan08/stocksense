from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# Auth
class UserCreate(BaseModel):
    email: str
    username: str
    password: str
    full_name: Optional[str] = None
    role: str = "manager"

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str]
    role: str
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

class OTPRequest(BaseModel):
    email: str

class OTPVerify(BaseModel):
    email: str
    otp: str
    new_password: str

# Category
class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    class Config:
        from_attributes = True

# Warehouse
class WarehouseCreate(BaseModel):
    name: str
    location: Optional[str] = None

class WarehouseOut(BaseModel):
    id: int
    name: str
    location: Optional[str]
    is_active: bool
    class Config:
        from_attributes = True

# Product
class ProductCreate(BaseModel):
    name: str
    sku: str
    category_id: Optional[int] = None
    unit: str = "Units"
    description: Optional[str] = None
    reorder_level: float = 10.0
    initial_stock: Optional[float] = 0
    warehouse_id: Optional[int] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[int] = None
    unit: Optional[str] = None
    description: Optional[str] = None
    reorder_level: Optional[float] = None

class ProductOut(BaseModel):
    id: int
    name: str
    sku: str
    category_id: Optional[int]
    unit: str
    description: Optional[str]
    reorder_level: float
    total_stock: Optional[float] = 0
    class Config:
        from_attributes = True

class StockOut(BaseModel):
    id: int
    product_id: int
    warehouse_id: int
    quantity: float
    product_name: Optional[str] = None
    warehouse_name: Optional[str] = None
    class Config:
        from_attributes = True

# Receipt
class ReceiptLineCreate(BaseModel):
    product_id: int
    quantity: float

class ReceiptCreate(BaseModel):
    supplier: Optional[str] = None
    warehouse_id: int
    notes: Optional[str] = None
    lines: List[ReceiptLineCreate]

class ReceiptOut(BaseModel):
    id: int
    reference: str
    supplier: Optional[str]
    warehouse_id: int
    status: str
    notes: Optional[str]
    created_at: datetime
    lines: List[dict] = []
    class Config:
        from_attributes = True

# Delivery
class DeliveryLineCreate(BaseModel):
    product_id: int
    quantity: float

class DeliveryCreate(BaseModel):
    customer: Optional[str] = None
    warehouse_id: int
    notes: Optional[str] = None
    lines: List[DeliveryLineCreate]

class DeliveryOut(BaseModel):
    id: int
    reference: str
    customer: Optional[str]
    warehouse_id: int
    status: str
    notes: Optional[str]
    created_at: datetime
    lines: List[dict] = []
    class Config:
        from_attributes = True

# Transfer
class TransferLineCreate(BaseModel):
    product_id: int
    quantity: float

class TransferCreate(BaseModel):
    source_warehouse_id: int
    dest_warehouse_id: int
    notes: Optional[str] = None
    lines: List[TransferLineCreate]

class TransferOut(BaseModel):
    id: int
    reference: str
    source_warehouse_id: int
    dest_warehouse_id: int
    status: str
    notes: Optional[str]
    created_at: datetime
    lines: List[dict] = []
    class Config:
        from_attributes = True

# Adjustment
class AdjustmentCreate(BaseModel):
    warehouse_id: int
    product_id: int
    counted_qty: float
    reason: Optional[str] = None

class AdjustmentOut(BaseModel):
    id: int
    reference: str
    warehouse_id: int
    product_id: int
    counted_qty: float
    system_qty: float
    difference: float
    reason: Optional[str]
    status: str
    created_at: datetime
    class Config:
        from_attributes = True

# Dashboard
class DashboardKPI(BaseModel):
    total_products: int
    total_stock_value: float  # total qty for simplicity
    low_stock_items: int
    out_of_stock_items: int
    pending_receipts: int
    pending_deliveries: int
    pending_transfers: int

class MoveHistoryOut(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str]
    warehouse_id: int
    warehouse_name: Optional[str]
    quantity: float
    move_type: str
    reference: Optional[str]
    notes: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True
