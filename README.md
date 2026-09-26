# StockSense — Modular Inventory Management System

> **Odoo x GCET Hyderabad Hackathon 2026**  
> An enterprise-grade, location-aware Inventory Management System with atomic stock updates, immutable audit ledger, real-time KPI analytics, and threshold reordering rules.

---

## 📋 Overview

StockSense is built to solve core inventory tracking challenges with double-entry stock integrity:
- **Location-Aware Stock Accounting**: Products are tracked at individual internal warehouse locations.
- **Atomic Operations**: Receipts, deliveries, transfers, and inventory adjustments use ACID transactions (`prisma.$transaction`) to guarantee consistency.
- **Draft Workflow**: Creation of operational documents (receipts, delivery orders, transfers) saves as drafts and does **NOT** alter inventory until explicitly validated.
- **Over-Delivery Prevention**: Deliveries strictly reject dispatch if requested quantity exceeds available physical stock at the source location.
- **Audit-Proof Stock Ledger**: Every stock-changing operation automatically posts an immutable record containing timestamp, reference number, product, SKU, movement type, source, destination, quantity, and user.
- **Dynamic Reordering & Alerting**: Configurable minimum stock thresholds immediately flag items as *Low Stock* or *Out of Stock* on the dashboard.

---

## ⚙️ Environment Variables

Before starting the application, create a `.env` file in the root directory (you can copy `.env.example`):

```bash
cp .env.example .env
```

### Required Variables and Their Purpose:

| Variable | Example Value | Purpose |
| :--- | :--- | :--- |
| `DATABASE_URL` | `"file:./dev.db"` | SQLite connection string for persistent database storage without requiring external database servers. |
| `NEXTAUTH_SECRET` | `"stocksense-odoo-secret-2026"` | Cryptographic secret key used by NextAuth to sign and encrypt JWT session tokens. |
| `NEXTAUTH_URL` | `"http://localhost:3000"` | Canonical base URL of the application, used for authentication callbacks and session management. |

---

## 🚀 Quick Setup & Run Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Prisma Client & Migrate Database
```bash
npx prisma generate
npx prisma db push
```

### 3. Seed Realistic Demo Data
```bash
npm run db:seed
```
*Or run all setup steps in one command:*
```bash
npm run setup
```

### 4. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Credentials

The database seed script initializes ready-to-test accounts:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@stocksense.com` | `admin123` | Full Access (All modules) |
| **Inventory Manager** | `manager@stocksense.com` | `admin123` | Operations & Catalog |

*(Alternatively, use the "Fill Demo Admin Credentials" button on the login screen for instant sign-in).*

---

## 🔄 End-to-End Stock Lifecycle Verification Flow

To verify full functional compliance with the hackathon specification, test this exact workflow:

1. **Create Product**: Navigate to **Products → Add New Product**. Create a product (e.g. `Mechanical Switch Pack`, SKU: `COMP-SW-010`, reorder level: `20`). Initial stock is 0 (Out of Stock).
2. **Receive Stock**: Navigate to **Operations → Receipts → Create Receipt**. Select a destination location (e.g., *Main Distribution Center → Stock / Shelf A-1*) and quantity `100`. Save as **Draft**. Note that stock is still 0! Click **Validate Receipt**. Stock increases to 100 at that location.
3. **Internal Transfer**: Navigate to **Operations → Internal Transfers → Create Internal Transfer**. Move `30` units from *Main Distribution Center → Stock / Shelf A-1* to *North Logistics Hub → Floor Bay 1*. Validate the transfer. Notice:
   - Source decreases by 30 (from 100 to 70).
   - Destination increases by 30 (from 0 to 30).
   - Total company stock remains exactly 100!
4. **Delivery Order**: Navigate to **Operations → Delivery Orders → Create Delivery Order**. Select *Main Distribution Center → Stock / Shelf A-1*. Try delivering `80` units (exceeds available 70) → The system prevents over-delivery and displays an error message! Deliver `25` units → Validates and decrements stock to 45.
5. **Inventory Adjustment**: Navigate to **Operations → Adjustments → New Physical Count Adjustment**. Select the location, enter physical count `40` (current system is 45, variance: `-5`). Validate the adjustment. System stock reconciles to exactly 40.
6. **Stock Ledger Audit**: Navigate to **Stock Ledger**. Every movement above (`Receipt`, `Internal Transfer`, `Delivery`, `Inventory Adjustment`) appears with date, reference number, operator, and location coordinates.
7. **Dashboard KPIs**: Navigate to **Dashboard**. Notice total in-stock products, active alert warnings, pending drafts, and recent moves reflect the real database records in real time.

---

## 🏗️ Architecture & Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite via Prisma ORM (persistent, zero external config)
- **Authentication**: NextAuth.js (JWT session strategy, bcrypt password hashing, 6-digit OTP reset)
- **Styling**: Tailwind CSS + Lucide Icons
- **Type Safety**: TypeScript & Zod validation
# StockSense – Modular Inventory Management System

Premium IMS with **FastAPI backend** + **React/Vite fluid frontend** (3D warehouse, guided tour, barcode scanner, omni-search).

## Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, Three.js, Motion, Lucide |
| **Backend** | FastAPI, SQLAlchemy, SQLite, JWT + bcrypt |
| **UI** | Landing page, 3D digital twin, dashboard KPIs, full operations |

## Quick Start

### Frontend (recommended – fully interactive demo)

```bash
cd StockSense/frontend
npm install
npm run dev
```

Open **http://localhost:3000**

Demo login: `m.vance@stocksense.io` / `manager123`

### Backend (optional – REST API)

```bash
cd StockSense
pip install fastapi uvicorn sqlalchemy pydantic python-multipart bcrypt python-jose[cryptography]
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

API demo login: `admin@stocksense.com` / `admin123`

## Frontend highlights

- Landing page with 3D conveyor visual
- Dashboard + live 3D warehouse digital twin
- Products, Receipts, Deliveries, Internal Transfers, Adjustments
- Move History / Stock Ledger
- Omni-search (⌘K), barcode scanner modal, guided tour
- Auth (login / signup / OTP reset), profile & staff management
- Client-side InventoryContext with localStorage seed (works offline)

## Project structure

```
StockSense/
├── app/                 # FastAPI backend
├── frontend/            # React + Vite fluid UI (primary)
│   ├── src/
│   │   ├── components/  # Dashboard, ops, 3D, auth, ...
│   │   ├── context/     # InventoryContext (seed + state)
│   │   └── types/
│   └── package.json
├── static/              # Legacy vanilla SPA (optional)
└── README.md
```
