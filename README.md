# StockSense – Modular Inventory Management System

A complete Inventory Management System with **FastAPI backend** + **Next.js frontend**.

## Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, Lucide Icons |
| **Backend** | FastAPI, SQLAlchemy, SQLite, JWT Auth |
| **Features** | Full inventory ops, multi-warehouse, low-stock alerts, stock ledger |

## Quick Start

### 1. Backend (port 8000)

```bash
cd StockSense
pip install fastapi uvicorn sqlalchemy pydantic python-multipart bcrypt python-jose[cryptography]
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend (port 3000)

```bash
cd StockSense/frontend
npm install
npm run dev
```

Open **http://localhost:3000**

### Demo Credentials
- **Admin**: `admin@stocksense.com` / `admin123`
- **Staff**: `staff@stocksense.com` / `staff123`

## Project Structure

```
StockSense/
├── app/                    # FastAPI backend
│   ├── main.py             # Routes + seed data
│   ├── database.py         # SQLAlchemy models (cross-platform SQLite)
│   ├── auth.py             # JWT + bcrypt
│   └── schemas.py
├── frontend/               # Next.js 14 frontend
│   ├── src/
│   │   ├── app/            # Pages (dashboard, products, receipts, ...)
│   │   ├── components/     # Sidebar, Modal, KpiCard, AppShell
│   │   └── lib/            # API client, auth context, toast
│   ├── package.json
│   └── ...
├── static/                 # Legacy vanilla frontend (optional)
└── README.md
```

## Features

- Authentication (login / signup / OTP password reset)
- Dashboard with KPIs + stock alerts
- Products (CRUD, search, category filter, reorder levels)
- Receipts → Validate → stock increases
- Delivery Orders → Validate → stock decreases
- Internal Transfers between warehouses
- Stock Adjustments (physical count)
- Full Move History / Stock Ledger
- Multi-warehouse support
- Dark theme + Framer Motion animations

The SQLite file (`stocksense.db`) is created automatically in the project root.
