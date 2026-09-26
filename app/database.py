from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import enum
from pathlib import Path

# Cross-platform: creates stocksense.db next to the app folder (project root)
BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "stocksense.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH.as_posix()}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class DocumentStatus(str, enum.Enum):
    DRAFT = "Draft"
    WAITING = "Waiting"
    READY = "Ready"
    DONE = "Done"
    CANCELED = "Canceled"

class DocumentType(str, enum.Enum):
    RECEIPT = "Receipt"
    DELIVERY = "Delivery"
    INTERNAL = "Internal"
    ADJUSTMENT = "Adjustment"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(String, default="manager")  # manager or warehouse
    is_active = Column(Boolean, default=True)
    otp = Column(String, nullable=True)
    otp_expires = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)
    products = relationship("Product", back_populates="category")

class Warehouse(Base):
    __tablename__ = "warehouses"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    location = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    stocks = relationship("Stock", back_populates="warehouse")

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    sku = Column(String, unique=True, nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"))
    unit = Column(String, default="Units")
    description = Column(Text, nullable=True)
    reorder_level = Column(Float, default=10.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    category = relationship("Category", back_populates="products")
    stocks = relationship("Stock", back_populates="product")

class Stock(Base):
    __tablename__ = "stocks"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    quantity = Column(Float, default=0.0)
    product = relationship("Product", back_populates="stocks")
    warehouse = relationship("Warehouse", back_populates="stocks")

class StockMove(Base):
    __tablename__ = "stock_moves"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    quantity = Column(Float, nullable=False)  # positive in, negative out
    move_type = Column(String, nullable=False)  # receipt, delivery, transfer_in, transfer_out, adjustment
    reference = Column(String, nullable=True)  # doc number
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

class Receipt(Base):
    __tablename__ = "receipts"
    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String, unique=True, index=True)
    supplier = Column(String, nullable=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    status = Column(String, default="Draft")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    validated_at = Column(DateTime, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    lines = relationship("ReceiptLine", back_populates="receipt", cascade="all, delete-orphan")

class ReceiptLine(Base):
    __tablename__ = "receipt_lines"
    id = Column(Integer, primary_key=True, index=True)
    receipt_id = Column(Integer, ForeignKey("receipts.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Float, nullable=False)
    receipt = relationship("Receipt", back_populates="lines")

class Delivery(Base):
    __tablename__ = "deliveries"
    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String, unique=True, index=True)
    customer = Column(String, nullable=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    status = Column(String, default="Draft")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    validated_at = Column(DateTime, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    lines = relationship("DeliveryLine", back_populates="delivery", cascade="all, delete-orphan")

class DeliveryLine(Base):
    __tablename__ = "delivery_lines"
    id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("deliveries.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Float, nullable=False)
    delivery = relationship("Delivery", back_populates="lines")

class Transfer(Base):
    __tablename__ = "transfers"
    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String, unique=True, index=True)
    source_warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    dest_warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    status = Column(String, default="Draft")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    validated_at = Column(DateTime, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    lines = relationship("TransferLine", back_populates="transfer", cascade="all, delete-orphan")

class TransferLine(Base):
    __tablename__ = "transfer_lines"
    id = Column(Integer, primary_key=True, index=True)
    transfer_id = Column(Integer, ForeignKey("transfers.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Float, nullable=False)
    transfer = relationship("Transfer", back_populates="lines")

class Adjustment(Base):
    __tablename__ = "adjustments"
    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String, unique=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    counted_qty = Column(Float, nullable=False)
    system_qty = Column(Float, nullable=False)
    difference = Column(Float, nullable=False)
    reason = Column(String, nullable=True)
    status = Column(String, default="Done")
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
