# StockSense — Inventory Management System

StockSense replaces manual registers and spreadsheets with a centralized, real-time inventory app. Inventory managers handle incoming and outgoing stock, while warehouse staff do transfers, picking, packing and counting. Every stock movement is recorded in an audit ledger.

- **Frontend:** React + Vite, with a 3D warehouse digital twin, animated landing page, guided tour, barcode scanner and omni-search.
- **Backend:** REST API on Next.js route handlers, with Prisma ORM, JWT authentication and OTP password reset.
- **Database:** SQLite for local development, and PostgreSQL (e.g. Supabase) for deployment.

---

## Features

| Area | What is implemented |
| --- | --- |
| **Authentication** | Sign up, log in, and logout. OTP-based password reset (6-digit code, hashed, 10-minute expiry, 5 attempts, single use). Users are redirected to the dashboard after login. |
| **Dashboard** | KPIs: total products in stock, low / out-of-stock items, pending receipts, pending deliveries, and scheduled internal transfers. Dynamic filters by document type, status, warehouse and product category. |
| **Products** | Create and update products (name, SKU, category, unit of measure, optional initial stock). Stock per location, product categories and reordering rules (min / max / reorder quantity, auto-reorder). |
| **Receipts** | Create a receipt with a supplier and products. Validating it increases stock at the destination location. |
| **Delivery Orders** | Pick, then pack, then validate, which decreases stock. Deliveries larger than the available stock are rejected. |
| **Internal Transfers** | Move stock between locations or warehouses. Total stock is unchanged and the location balances update. |
| **Stock Adjustments** | Choose a product and location, then enter the counted quantity. Stock is corrected and the difference is logged. |
| **Move History** | An immutable stock ledger of every receipt, delivery, transfer and adjustment. |
| **Settings** | Multiple warehouses, each with locations (racks, shelves, docks, and so on). |
| **Profile menu** | My Profile (name, email, warehouse, password change) and Logout. |
| **Extras** | Low-stock alerts with one-click reorder, automatic reorder receipts from reordering rules, SKU search and smart filters, and manager-only staff account creation. |

All stock changes run inside database transactions. Draft documents never change stock; only validation does.

---

## Project structure

```
stocksense/
├── backend/                 REST API (Next.js route handlers + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma    Data model
│   │   └── seed.ts          Demo data loader
│   ├── scripts/
│   │   └── smoke-test.mjs   End-to-end API test
│   └── src/
│       ├── app/api/         API routes (auth, products, receipts, deliveries, ...)
│       ├── lib/             Stock engine, auth, validation, serializers
│       └── middleware.ts    CORS
├── frontend/                React + Vite user interface
│   ├── public/images/
│   └── src/
│       ├── components/      Dashboard, operations, 3D views, auth, profile, ...
│       ├── context/         InventoryContext (app state, talks to the API)
│       ├── lib/api.ts       API client
│       └── types/
├── scripts/init-env.mjs     Creates backend/.env on first setup
└── package.json             Runs both apps together
```

---

## Getting started

**Requirements:** Node.js 18.18 or newer.

```bash
# 1. Install everything, create backend/.env, create the database and load demo data
npm run setup

# 2. Start the backend (port 4000) and the frontend (port 3000) together
npm run dev
```

Open **http://localhost:3000**.

<details>
<summary>Running the two apps separately</summary>

```bash
# Terminal 1 — backend
cd backend
cp .env.example .env
npm install
npm run setup        # creates the SQLite database and loads demo data
npm run dev          # http://localhost:4000

# Terminal 2 — frontend
cd frontend
npm install
npm run dev          # http://localhost:3000 (proxies /api to the backend)
```
</details>

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Inventory Manager | `m.vance@stocksense.io` | `manager123` |
| Warehouse Staff | `elena.r@stocksense.io` | `warehouse123` |
| Warehouse Staff | `liam.c@stocksense.io` | `staff123` |

You can also create a new account with **Sign up**. To restore the demo inventory, run `npm run db:seed` or use **Settings → Reset Demo Data** (manager only).

### OTP password reset

On the sign-in form, click **Forgot Password? (OTP)**. If SMTP is configured in `backend/.env`, the 6-digit code is emailed. Otherwise the code is printed in the backend terminal and shown in the dialog as a *development mode code*, so the flow can be tested without an email account.

---

## Walkthrough of the inventory flow

1. **Receive goods:** Receipts → New Vendor Receipt → 100 kg Steel Rods into Main Store / Rack A → Validate. Stock goes up by 100.
2. **Internal transfer:** Internal Transfers → Rack A to Production Rack, 30 kg → Validate. Total stock is unchanged and the location balances change.
3. **Deliver:** Delivery Orders → create an order → Pick → Pack → Validate. Stock goes down. Delivering more than the available stock is refused.
4. **Adjust:** Stock Adjustments → pick the product and location, then enter the counted quantity. Stock is corrected (for example −3 kg for damaged goods).
5. **Audit:** Move History lists every movement above, with reference, locations, quantity and user.

The **PDF Flow Demo** button in the top bar walks through these same four steps.

---

## Environment variables

**backend/.env** (copied from `backend/.env.example`)

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Database connection string. Default: local SQLite file `file:./dev.db`. |
| `JWT_SECRET` | Secret used to sign login tokens. Use a long random value in production. |
| `CORS_ORIGIN` | Frontend URL(s) allowed to call the API (comma separated, or `*`). |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Optional. Email delivery for OTP codes. |
| `EXPOSE_DEV_OTP` | `true` shows the OTP in the UI when email is not configured. Set it to `false` in production. |

**frontend/.env** (optional, copied from `frontend/.env.example`)

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Backend URL in production. Leave empty in development, because Vite proxies `/api` to `localhost:4000`. |

---

## Deployment

SQLite is a local file, so it does not persist on serverless hosts. For deployment, use PostgreSQL, for example **Supabase**:

1. Create a Supabase project and copy the **connection string** (Project Settings → Database).
2. In `backend/prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`.
3. Set `DATABASE_URL` to the Supabase connection string, then run `npm run setup --prefix backend` once to create the tables and load demo data.
4. Deploy `backend/` (for example on Vercel or Render) with `DATABASE_URL`, `JWT_SECRET` and `CORS_ORIGIN` set.
5. Deploy `frontend/` as a static site (build command `npm run build`, output folder `dist`) with `VITE_API_URL` set to the backend URL.

The schema uses no database-specific features, so no other code changes are needed.

---

## Testing

With the backend running:

```bash
npm run test:api
```

This runs an end-to-end check of the API. It covers auth, the OTP reset, and the receive → transfer → deliver → adjust flow, including over-delivery rejection and the ledger entries. It creates test records, so run `npm run db:seed` afterwards to restore the demo data.

---

## API overview

All endpoints except auth, `/api/health` and `/api/public/summary` require the header `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/signup`, `/api/auth/login` | Create an account / sign in (returns a token) |
| GET, PATCH | `/api/auth/me` | Current user / update profile and password |
| POST | `/api/auth/forgot-password` → `/verify-otp` → `/reset-password` | OTP password reset |
| GET | `/api/state` | Full inventory snapshot |
| GET | `/api/dashboard?warehouseId=&category=` | KPIs |
| POST, PATCH, DELETE | `/api/products`, `/api/products/:id` | Products and reordering rules |
| POST | `/api/products/:id/reorder` | Create a replenishment receipt |
| POST, PATCH | `/api/receipts`, `/api/receipts/:id` | Receipts (create / change status) |
| POST, PATCH | `/api/deliveries`, `/api/deliveries/:id` | Delivery orders (create / pick / pack) |
| POST, PATCH | `/api/transfers`, `/api/transfers/:id` | Internal transfers |
| POST | `/api/{receipts,deliveries,transfers}/:id/validate` | Validate and post stock moves |
| POST | `/api/adjustments`, `/api/adjustments/:id/validate` | Physical count adjustments |
| POST | `/api/warehouses`, `/api/warehouses/:id/locations` | Warehouses and locations (manager) |
| POST, DELETE | `/api/users`, `/api/users/:id` | Staff accounts (manager) |
