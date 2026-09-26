from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta
from typing import List, Optional
import os
import uuid

from .database import (
    init_db, get_db, User, Category, Warehouse, Product, Stock, StockMove,
    Receipt, ReceiptLine, Delivery, DeliveryLine, Transfer, TransferLine, Adjustment
)
from .auth import (
    get_password_hash, verify_password, create_access_token, generate_otp,
    get_current_active_user, ACCESS_TOKEN_EXPIRE_MINUTES
)
from . import schemas

app = FastAPI(
    title="StockSense IMS",
    description="Modular Inventory Management System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static
static_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
app.mount("/static", StaticFiles(directory=static_path), name="static")

@app.on_event("startup")
def on_startup():
    init_db()
    seed_data()

def seed_data():
    db = next(get_db())
    try:
        if db.query(User).count() == 0:
            # Admin user
            admin = User(
                email="admin@stocksense.com",
                username="admin",
                hashed_password=get_password_hash("admin123"),
                full_name="Inventory Manager",
                role="manager"
            )
            db.add(admin)
            # Staff
            staff = User(
                email="staff@stocksense.com",
                username="staff",
                hashed_password=get_password_hash("staff123"),
                full_name="Warehouse Staff",
                role="warehouse"
            )
            db.add(staff)

            # Categories
            cats = [
                Category(name="Raw Materials", description="Steel, metals, etc."),
                Category(name="Finished Goods", description="Completed products"),
                Category(name="Packaging", description="Boxes, tapes"),
                Category(name="Tools", description="Hand tools and equipment"),
            ]
            db.add_all(cats)
            db.flush()

            # Warehouses
            whs = [
                Warehouse(name="Main Warehouse", location="Building A"),
                Warehouse(name="Production Floor", location="Building B"),
                Warehouse(name="Rack A", location="Zone 1"),
            ]
            db.add_all(whs)
            db.flush()

            # Products
            products_data = [
                ("Steel Rods", "SR-001", 1, "kg", 50),
                ("Steel Frames", "SF-002", 2, "Units", 20),
                ("Chairs", "CH-003", 2, "Units", 15),
                ("Cardboard Boxes", "CB-004", 3, "Units", 100),
                ("Hammer", "TL-005", 4, "Units", 5),
                ("Copper Wire", "CW-006", 1, "m", 200),
                ("Screws Pack", "SC-007", 1, "Packs", 30),
                ("Paint Cans", "PC-008", 2, "Cans", 25),
            ]
            for name, sku, cat_id, unit, reorder in products_data:
                p = Product(name=name, sku=sku, category_id=cat_id, unit=unit, reorder_level=reorder)
                db.add(p)
            db.flush()

            # Initial stocks
            stocks = [
                (1, 1, 250),  # Steel Rods Main
                (1, 2, 50),   # Steel Rods Production
                (2, 1, 80),   # Frames Main
                (3, 1, 120),  # Chairs Main
                (4, 1, 500),  # Boxes
                (5, 1, 12),   # Hammer
                (6, 1, 1000), # Copper
                (7, 1, 45),   # Screws
                (8, 1, 30),   # Paint
            ]
            for pid, wid, qty in stocks:
                db.add(Stock(product_id=pid, warehouse_id=wid, quantity=qty))
                db.add(StockMove(
                    product_id=pid, warehouse_id=wid, quantity=qty,
                    move_type="receipt", reference="INIT-001", notes="Initial stock"
                ))

            db.commit()
            print("Seed data created successfully!")
    except Exception as e:
        print(f"Seed error: {e}")
        db.rollback()
    finally:
        db.close()

# ========== AUTH ==========
@app.post("/api/auth/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=get_password_hash(user.password),
        full_name=user.full_name,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/api/auth/login", response_model=schemas.Token)
def login(form: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.email).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@app.post("/api/auth/forgot-password")
def forgot_password(req: schemas.OTPRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    otp = generate_otp()
    user.otp = otp
    user.otp_expires = datetime.utcnow() + timedelta(minutes=10)
    db.commit()
    # In production: send email. Here we return OTP for demo
    return {"message": "OTP sent (demo mode)", "otp": otp}

@app.post("/api/auth/reset-password")
def reset_password(req: schemas.OTPVerify, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or user.otp != req.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    if user.otp_expires and user.otp_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP expired")
    user.hashed_password = get_password_hash(req.new_password)
    user.otp = None
    user.otp_expires = None
    db.commit()
    return {"message": "Password reset successful"}

@app.get("/api/auth/me", response_model=schemas.UserOut)
def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user

# ========== DASHBOARD ==========
@app.get("/api/dashboard/kpis", response_model=schemas.DashboardKPI)
def get_kpis(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    total_products = db.query(Product).count()
    total_stock = db.query(func.coalesce(func.sum(Stock.quantity), 0)).scalar() or 0
    
    # Low stock: any product where total qty < reorder
    products = db.query(Product).all()
    low_stock = 0
    out_of_stock = 0
    for p in products:
        qty = db.query(func.coalesce(func.sum(Stock.quantity), 0)).filter(Stock.product_id == p.id).scalar() or 0
        if qty == 0:
            out_of_stock += 1
        elif qty < p.reorder_level:
            low_stock += 1

    pending_receipts = db.query(Receipt).filter(Receipt.status.in_(["Draft", "Waiting", "Ready"])).count()
    pending_deliveries = db.query(Delivery).filter(Delivery.status.in_(["Draft", "Waiting", "Ready"])).count()
    pending_transfers = db.query(Transfer).filter(Transfer.status.in_(["Draft", "Waiting", "Ready"])).count()

    return schemas.DashboardKPI(
        total_products=total_products,
        total_stock_value=float(total_stock),
        low_stock_items=low_stock,
        out_of_stock_items=out_of_stock,
        pending_receipts=pending_receipts,
        pending_deliveries=pending_deliveries,
        pending_transfers=pending_transfers
    )

# ========== CATEGORIES ==========
@app.get("/api/categories", response_model=List[schemas.CategoryOut])
def list_categories(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(Category).all()

@app.post("/api/categories", response_model=schemas.CategoryOut)
def create_category(cat: schemas.CategoryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if db.query(Category).filter(Category.name == cat.name).first():
        raise HTTPException(400, "Category exists")
    db_cat = Category(**cat.dict())
    db.add(db_cat)
    db.commit()
    db.refresh(db_cat)
    return db_cat

# ========== WAREHOUSES ==========
@app.get("/api/warehouses", response_model=List[schemas.WarehouseOut])
def list_warehouses(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(Warehouse).filter(Warehouse.is_active == True).all()

@app.post("/api/warehouses", response_model=schemas.WarehouseOut)
def create_warehouse(wh: schemas.WarehouseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if db.query(Warehouse).filter(Warehouse.name == wh.name).first():
        raise HTTPException(400, "Warehouse exists")
    db_wh = Warehouse(**wh.dict())
    db.add(db_wh)
    db.commit()
    db.refresh(db_wh)
    return db_wh

# ========== PRODUCTS ==========
@app.get("/api/products")
def list_products(
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    q = db.query(Product)
    if search:
        q = q.filter((Product.name.ilike(f"%{search}%")) | (Product.sku.ilike(f"%{search}%")))
    if category_id:
        q = q.filter(Product.category_id == category_id)
    products = q.all()
    result = []
    for p in products:
        total = db.query(func.coalesce(func.sum(Stock.quantity), 0)).filter(Stock.product_id == p.id).scalar() or 0
        result.append({
            "id": p.id,
            "name": p.name,
            "sku": p.sku,
            "category_id": p.category_id,
            "category_name": p.category.name if p.category else None,
            "unit": p.unit,
            "description": p.description,
            "reorder_level": p.reorder_level,
            "total_stock": float(total),
            "is_low": total < p.reorder_level,
            "is_out": total == 0
        })
    return result

@app.post("/api/products")
def create_product(prod: schemas.ProductCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if db.query(Product).filter(Product.sku == prod.sku).first():
        raise HTTPException(400, "SKU already exists")
    db_prod = Product(
        name=prod.name, sku=prod.sku, category_id=prod.category_id,
        unit=prod.unit, description=prod.description, reorder_level=prod.reorder_level
    )
    db.add(db_prod)
    db.flush()
    if prod.initial_stock and prod.initial_stock > 0 and prod.warehouse_id:
        stock = Stock(product_id=db_prod.id, warehouse_id=prod.warehouse_id, quantity=prod.initial_stock)
        db.add(stock)
        db.add(StockMove(
            product_id=db_prod.id, warehouse_id=prod.warehouse_id,
            quantity=prod.initial_stock, move_type="receipt",
            reference=f"INIT-{db_prod.sku}", notes="Initial stock on create",
            created_by=current_user.id
        ))
    db.commit()
    db.refresh(db_prod)
    return {"id": db_prod.id, "name": db_prod.name, "sku": db_prod.sku, "message": "Product created"}

@app.get("/api/products/{product_id}/stock")
def get_product_stock(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    stocks = db.query(Stock).filter(Stock.product_id == product_id).all()
    return [
        {
            "warehouse_id": s.warehouse_id,
            "warehouse_name": s.warehouse.name,
            "quantity": s.quantity
        } for s in stocks
    ]

@app.put("/api/products/{product_id}")
def update_product(product_id: int, prod: schemas.ProductUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_prod = db.query(Product).filter(Product.id == product_id).first()
    if not db_prod:
        raise HTTPException(404, "Product not found")
    for k, v in prod.dict(exclude_unset=True).items():
        setattr(db_prod, k, v)
    db.commit()
    return {"message": "Updated"}

# ========== RECEIPTS ==========
@app.get("/api/receipts")
def list_receipts(
    status: Optional[str] = None,
    warehouse_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    q = db.query(Receipt)
    if status:
        q = q.filter(Receipt.status == status)
    if warehouse_id:
        q = q.filter(Receipt.warehouse_id == warehouse_id)
    receipts = q.order_by(Receipt.created_at.desc()).all()
    result = []
    for r in receipts:
        lines = []
        for l in r.lines:
            prod = db.query(Product).get(l.product_id)
            lines.append({"product_id": l.product_id, "product_name": prod.name if prod else "", "sku": prod.sku if prod else "", "quantity": l.quantity})
        result.append({
            "id": r.id, "reference": r.reference, "supplier": r.supplier,
            "warehouse_id": r.warehouse_id, "status": r.status, "notes": r.notes,
            "created_at": r.created_at.isoformat(), "lines": lines
        })
    return result

@app.post("/api/receipts")
def create_receipt(data: schemas.ReceiptCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    ref = f"RCPT-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
    receipt = Receipt(
        reference=ref, supplier=data.supplier, warehouse_id=data.warehouse_id,
        notes=data.notes, status="Draft", created_by=current_user.id
    )
    db.add(receipt)
    db.flush()
    for line in data.lines:
        db.add(ReceiptLine(receipt_id=receipt.id, product_id=line.product_id, quantity=line.quantity))
    db.commit()
    return {"id": receipt.id, "reference": ref, "message": "Receipt created as Draft"}

@app.post("/api/receipts/{receipt_id}/validate")
def validate_receipt(receipt_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    receipt = db.query(Receipt).filter(Receipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(404, "Receipt not found")
    if receipt.status == "Done":
        raise HTTPException(400, "Already validated")
    
    for line in receipt.lines:
        stock = db.query(Stock).filter(
            and_(Stock.product_id == line.product_id, Stock.warehouse_id == receipt.warehouse_id)
        ).first()
        if stock:
            stock.quantity += line.quantity
        else:
            stock = Stock(product_id=line.product_id, warehouse_id=receipt.warehouse_id, quantity=line.quantity)
            db.add(stock)
        db.add(StockMove(
            product_id=line.product_id, warehouse_id=receipt.warehouse_id,
            quantity=line.quantity, move_type="receipt", reference=receipt.reference,
            notes=f"Receipt from {receipt.supplier or 'supplier'}", created_by=current_user.id
        ))
    
    receipt.status = "Done"
    receipt.validated_at = datetime.utcnow()
    db.commit()
    return {"message": "Receipt validated. Stock increased."}

# ========== DELIVERIES ==========
@app.get("/api/deliveries")
def list_deliveries(
    status: Optional[str] = None,
    warehouse_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    q = db.query(Delivery)
    if status:
        q = q.filter(Delivery.status == status)
    if warehouse_id:
        q = q.filter(Delivery.warehouse_id == warehouse_id)
    deliveries = q.order_by(Delivery.created_at.desc()).all()
    result = []
    for d in deliveries:
        lines = []
        for l in d.lines:
            prod = db.query(Product).get(l.product_id)
            lines.append({"product_id": l.product_id, "product_name": prod.name if prod else "", "sku": prod.sku if prod else "", "quantity": l.quantity})
        result.append({
            "id": d.id, "reference": d.reference, "customer": d.customer,
            "warehouse_id": d.warehouse_id, "status": d.status, "notes": d.notes,
            "created_at": d.created_at.isoformat(), "lines": lines
        })
    return result

@app.post("/api/deliveries")
def create_delivery(data: schemas.DeliveryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    ref = f"DEL-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
    delivery = Delivery(
        reference=ref, customer=data.customer, warehouse_id=data.warehouse_id,
        notes=data.notes, status="Draft", created_by=current_user.id
    )
    db.add(delivery)
    db.flush()
    for line in data.lines:
        db.add(DeliveryLine(delivery_id=delivery.id, product_id=line.product_id, quantity=line.quantity))
    db.commit()
    return {"id": delivery.id, "reference": ref, "message": "Delivery created as Draft"}

@app.post("/api/deliveries/{delivery_id}/validate")
def validate_delivery(delivery_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise HTTPException(404, "Delivery not found")
    if delivery.status == "Done":
        raise HTTPException(400, "Already validated")
    
    for line in delivery.lines:
        stock = db.query(Stock).filter(
            and_(Stock.product_id == line.product_id, Stock.warehouse_id == delivery.warehouse_id)
        ).first()
        if not stock or stock.quantity < line.quantity:
            raise HTTPException(400, f"Insufficient stock for product {line.product_id}")
        stock.quantity -= line.quantity
        db.add(StockMove(
            product_id=line.product_id, warehouse_id=delivery.warehouse_id,
            quantity=-line.quantity, move_type="delivery", reference=delivery.reference,
            notes=f"Delivery to {delivery.customer or 'customer'}", created_by=current_user.id
        ))
    
    delivery.status = "Done"
    delivery.validated_at = datetime.utcnow()
    db.commit()
    return {"message": "Delivery validated. Stock decreased."}

# ========== TRANSFERS ==========
@app.get("/api/transfers")
def list_transfers(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    q = db.query(Transfer)
    if status:
        q = q.filter(Transfer.status == status)
    transfers = q.order_by(Transfer.created_at.desc()).all()
    result = []
    for t in transfers:
        lines = []
        for l in t.lines:
            prod = db.query(Product).get(l.product_id)
            lines.append({"product_id": l.product_id, "product_name": prod.name if prod else "", "quantity": l.quantity})
        result.append({
            "id": t.id, "reference": t.reference,
            "source_warehouse_id": t.source_warehouse_id, "dest_warehouse_id": t.dest_warehouse_id,
            "status": t.status, "notes": t.notes, "created_at": t.created_at.isoformat(), "lines": lines
        })
    return result

@app.post("/api/transfers")
def create_transfer(data: schemas.TransferCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if data.source_warehouse_id == data.dest_warehouse_id:
        raise HTTPException(400, "Source and destination must differ")
    ref = f"TRF-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
    transfer = Transfer(
        reference=ref, source_warehouse_id=data.source_warehouse_id,
        dest_warehouse_id=data.dest_warehouse_id, notes=data.notes,
        status="Draft", created_by=current_user.id
    )
    db.add(transfer)
    db.flush()
    for line in data.lines:
        db.add(TransferLine(transfer_id=transfer.id, product_id=line.product_id, quantity=line.quantity))
    db.commit()
    return {"id": transfer.id, "reference": ref, "message": "Transfer created as Draft"}

@app.post("/api/transfers/{transfer_id}/validate")
def validate_transfer(transfer_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    transfer = db.query(Transfer).filter(Transfer.id == transfer_id).first()
    if not transfer:
        raise HTTPException(404, "Transfer not found")
    if transfer.status == "Done":
        raise HTTPException(400, "Already validated")
    
    for line in transfer.lines:
        # Deduct from source
        src_stock = db.query(Stock).filter(
            and_(Stock.product_id == line.product_id, Stock.warehouse_id == transfer.source_warehouse_id)
        ).first()
        if not src_stock or src_stock.quantity < line.quantity:
            raise HTTPException(400, f"Insufficient stock in source for product {line.product_id}")
        src_stock.quantity -= line.quantity
        db.add(StockMove(
            product_id=line.product_id, warehouse_id=transfer.source_warehouse_id,
            quantity=-line.quantity, move_type="transfer_out", reference=transfer.reference,
            notes="Internal transfer out", created_by=current_user.id
        ))
        # Add to dest
        dest_stock = db.query(Stock).filter(
            and_(Stock.product_id == line.product_id, Stock.warehouse_id == transfer.dest_warehouse_id)
        ).first()
        if dest_stock:
            dest_stock.quantity += line.quantity
        else:
            dest_stock = Stock(product_id=line.product_id, warehouse_id=transfer.dest_warehouse_id, quantity=line.quantity)
            db.add(dest_stock)
        db.add(StockMove(
            product_id=line.product_id, warehouse_id=transfer.dest_warehouse_id,
            quantity=line.quantity, move_type="transfer_in", reference=transfer.reference,
            notes="Internal transfer in", created_by=current_user.id
        ))
    
    transfer.status = "Done"
    transfer.validated_at = datetime.utcnow()
    db.commit()
    return {"message": "Transfer validated. Stock moved."}

# ========== ADJUSTMENTS ==========
@app.get("/api/adjustments")
def list_adjustments(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    adjs = db.query(Adjustment).order_by(Adjustment.created_at.desc()).all()
    result = []
    for a in adjs:
        prod = db.query(Product).get(a.product_id)
        wh = db.query(Warehouse).get(a.warehouse_id)
        result.append({
            "id": a.id, "reference": a.reference,
            "product_id": a.product_id, "product_name": prod.name if prod else "",
            "warehouse_id": a.warehouse_id, "warehouse_name": wh.name if wh else "",
            "counted_qty": a.counted_qty, "system_qty": a.system_qty, "difference": a.difference,
            "reason": a.reason, "status": a.status, "created_at": a.created_at.isoformat()
        })
    return result

@app.post("/api/adjustments")
def create_adjustment(data: schemas.AdjustmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    stock = db.query(Stock).filter(
        and_(Stock.product_id == data.product_id, Stock.warehouse_id == data.warehouse_id)
    ).first()
    system_qty = stock.quantity if stock else 0.0
    difference = data.counted_qty - system_qty
    ref = f"ADJ-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
    
    adj = Adjustment(
        reference=ref, warehouse_id=data.warehouse_id, product_id=data.product_id,
        counted_qty=data.counted_qty, system_qty=system_qty, difference=difference,
        reason=data.reason, status="Done", created_by=current_user.id
    )
    db.add(adj)
    
    if stock:
        stock.quantity = data.counted_qty
    else:
        stock = Stock(product_id=data.product_id, warehouse_id=data.warehouse_id, quantity=data.counted_qty)
        db.add(stock)
    
    db.add(StockMove(
        product_id=data.product_id, warehouse_id=data.warehouse_id,
        quantity=difference, move_type="adjustment", reference=ref,
        notes=data.reason or "Stock adjustment", created_by=current_user.id
    ))
    db.commit()
    return {"id": adj.id, "reference": ref, "difference": difference, "message": "Adjustment applied"}

# ========== MOVE HISTORY ==========
@app.get("/api/moves")
def list_moves(
    product_id: Optional[int] = None,
    warehouse_id: Optional[int] = None,
    move_type: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    q = db.query(StockMove)
    if product_id:
        q = q.filter(StockMove.product_id == product_id)
    if warehouse_id:
        q = q.filter(StockMove.warehouse_id == warehouse_id)
    if move_type:
        q = q.filter(StockMove.move_type == move_type)
    moves = q.order_by(StockMove.created_at.desc()).limit(limit).all()
    result = []
    for m in moves:
        prod = db.query(Product).get(m.product_id)
        wh = db.query(Warehouse).get(m.warehouse_id)
        result.append({
            "id": m.id, "product_id": m.product_id, "product_name": prod.name if prod else "",
            "warehouse_id": m.warehouse_id, "warehouse_name": wh.name if wh else "",
            "quantity": m.quantity, "move_type": m.move_type, "reference": m.reference,
            "notes": m.notes, "created_at": m.created_at.isoformat()
        })
    return result

# ========== SERVE FRONTEND ==========
@app.get("/")
async def serve_index():
    index_path = os.path.join(static_path, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return HTMLResponse("<h1>StockSense - Frontend loading...</h1><p>Place index.html in static/</p>")

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # SPA fallback
    if full_path.startswith("api/") or full_path.startswith("static/"):
        raise HTTPException(404)
    index_path = os.path.join(static_path, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return HTMLResponse("<h1>Not found</h1>")
