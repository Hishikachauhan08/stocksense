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
