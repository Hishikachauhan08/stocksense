# StockSense Frontend (Fluid Web)

Premium interactive frontend for the StockSense Inventory Management System.

Built with React + Vite + Tailwind CSS v4 + Three.js + Motion.

## Features

- Landing page with 3D conveyor visual
- Dashboard KPIs + 3D warehouse digital twin
- Products, Receipts, Deliveries, Transfers, Adjustments
- Move history / stock ledger
- Omni-search (⌘K), barcode scanner modal, guided tour
- Auth modal (login / signup / OTP reset)
- Profile & staff management
- Client-side state with localStorage seed data (demo-ready)

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

Demo login (from seed): `m.vance@stocksense.io` / `manager123`

## Pair with FastAPI backend (optional)

The UI is fully functional offline via InventoryContext.  
To connect to the StockSense FastAPI backend later, replace context mutations with API calls from `src/lib/api.ts`.
