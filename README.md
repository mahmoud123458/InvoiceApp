# 🧾 Invoice Management System (نظام إدارة الفواتير والمخزون والشحن)

Full-stack Invoice, Inventory, Shipping & Purchase Orders Management Platform built with **Next.js 16 (TypeScript + Tailwind CSS)** and **Node.js + Express + MongoDB**.

---

## 🚀 Features Implemented

### 1. 🔐 Authentication & Roles
- JWT-based authentication with server-enforced role-based access control (`admin` and `user`).
- Admins can create and manage staff/admin accounts.
- Staff can manage clients, invoices, and purchase requests; inventory and shipping changes are admin-only.
- Admins and staff can create client directory records. Clients are invoice recipients, not user accounts.

### 2. 👥 Clients Management
- Complete directory of clients (`/clients`).
- Search by client name, email, or phone.
- Full CRUD (Create, Read, Update, Delete) with client modal or dedicated page (`/clients/new`).
- **Inline client creation**: When creating an invoice, if the client is not in your list, you can click `+ New Client` right inside the invoice form without leaving the page.

### 3. 📦 Inventory Management
- Real-time stock levels and SKU tracking (`/inventory`).
- Filter by **"Low Stock"** alerts.
- Automatic inventory sync:
  - 🔻 **Decreases automatically** when an invoice is created (sold items).
  - 🔺 **Increases automatically** when a purchase order is approved by admin.

### 4. 🚚 Shipping & Delivery Analytics
- Dedicated shipping partners dashboard (`/shipping`).
- For every shipping company:
  - **Total Invoices Assigned**: Tracks how many invoices were dispatched with this partner.
  - **Delivery Success Rate (%)**: Percentage of successfully delivered shipments.
  - **Average Delivery Time**: Estimated turnaround duration in days.
- In-depth modal report per carrier.
- Assign any shipping company directly to invoices.

### 5. 🛒 Purchase Orders & Supplier Approvals
- Purchase orders workflow (`/purchase-orders`).
- Staff creates purchase requests for needed stock (`/purchase-orders/new`).
- Status workflow: `Pending` ➔ `Approved` / `Rejected`.
- **Automated Stock Injection**: As soon as an Admin approves a pending order, the ordered quantities are immediately credited to the corresponding inventory products.

### 6. 🧾 Invoices & PDF Printing
- Comprehensive invoice creation (`/invoices/new`) with subtotal, tax rate (%), discount, and net total.
- Invoice details view with tax invoice format (`/invoices/[id]`).
- Clean printable / Save to PDF layout (`window.print()`) that hides sidebar and UI chrome automatically.

### 7. 💹 Financial Management
- Finance dashboard (`/finance`) with date-filtered invoiced sales, collected payments, outstanding balances, operating expenses, and net cash flow in EGP.
- Record, edit, categorize, and review operating expenses with payment methods and references.
- Record multiple partial payments against sent invoices; balances update automatically and cannot be overpaid.
- Monthly cash-flow and expense-category charts, recent transaction ledger, and outstanding invoice list.
- Existing paid invoices are migrated as paid in full; their original payment date is represented by the invoice date because no separate historical payment record existed.
- Purchase orders are not treated as cash expenses until their payment is explicitly recorded. This operational finance module is not a double-entry accounting or tax-compliance system.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, TypeScript, Mongoose
- **Database**: MongoDB

---

## 📋 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) running locally on `mongodb://localhost:27017/invoices_db` (or a MongoDB Atlas connection string in `backend/.env`).

---

### 2. Quick Setup & Seed Database

#### Step A: Configure & Seed Backend
1. Open a terminal in `backend/`:
   ```bash
   cd backend
   ```
2. Make sure MongoDB is running.
3. Run the database seed script to populate test data:
   ```bash
   npm run seed
   ```
   *This creates test users, products, clients, shipping partners, sample invoices, and pending purchase orders.*

#### Default Demo Credentials:
| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@invoices.com` | `admin123` |
| **User** | `user@invoices.com` | `user123` |

For production, configure a strong `JWT_SECRET` and `JWT_EXPIRES_IN` in `backend/.env`. On a new production database, also provide `ADMIN_NAME`, `ADMIN_EMAIL`, and a unique `ADMIN_PASSWORD` of at least 8 characters to initialize the first administrator. Demo accounts and local JSON fallback are development-only.

On backend startup, legacy client-login accounts and customer-portal orders/notifications are removed. Client directory records, invoices, and invoice history are preserved.

---

### 3. Running the Application

Open two terminal windows:

#### Terminal 1 — Start Backend API:
```bash
cd backend
npm run dev
```
> Server runs on: `http://localhost:5000`

#### Terminal 2 — Start Frontend:
```bash
cd frontend
npm run dev
```
> Application opens on: `http://localhost:3000`

---

### 4. Deploy the Frontend to Cloudflare Workers

The Next.js frontend is configured for Cloudflare Workers with the OpenNext adapter.
In the Cloudflare Worker build settings, use:

| Setting | Value |
|---|---|
| Root directory | `frontend` |
| Build command | `npm run build:worker` |
| Deploy command | `npx wrangler deploy` |

The backend must be deployed separately from the frontend. Set `NEXT_PUBLIC_API_URL` as a **build variable** in Cloudflare to the deployed backend API URL ending in `/api` (for example, `https://api.example.com/api`); do not use `http://localhost:5000/api` in production.

On the backend host, set `CORS_ORIGINS` to the frontend's exact origin (for example, `https://invoiceapp.mahmoudnabil11112.workers.dev`, without a path). Multiple origins can be comma-separated. Also configure the production `MONGODB_URI` and `JWT_SECRET` there.

You can also deploy locally from `frontend/` with `npm run deploy`.

### Deploy the Backend to Render

The root `render.yaml` defines the backend as a Render Blueprint. In Render, choose **New → Blueprint**, connect this repository, and provide the requested MongoDB Atlas connection string and initial administrator details. Render generates `JWT_SECRET` automatically and uses the configured frontend origin for CORS.

After deployment, verify `https://<service-name>.onrender.com/api/health`, then set the Cloudflare build variable `NEXT_PUBLIC_API_URL` to `https://<service-name>.onrender.com/api` and redeploy the frontend.

---

## 📁 Project Structure

```
فواتير/
├── backend/
│   ├── src/
│   │   ├── config/             # MongoDB connection (db.ts)
│   │   ├── controllers/        # Business logic for all modules
│   │   ├── middleware/         # JWT auth & error handler
│   │   ├── models/             # Mongoose schemas (User, Client, Product, Invoice, Shipping, PO)
│   │   ├── routes/             # Express API endpoints
│   │   ├── seed.ts             # Initial demo data populator
│   │   └── index.ts            # Server entrypoint
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── (routes)/
    │   │   │   ├── login/              # Sign in page
    │   │   │   ├── dashboard/          # Metrics overview
    │   │   │   ├── clients/            # Client directory & modal
    │   │   │   ├── inventory/          # Stock table & threshold alerts
    │   │   │   ├── invoices/           # Invoices list, creation & print view
    │   │   │   ├── shipping/           # Carrier cards & performance rates
    │   │   │   └── purchase-orders/    # Procurement & admin approval workflow
    │   │   ├── layout.tsx
    │   │   └── globals.css
    │   ├── components/
    │   │   ├── layout/         # Sidebar & AppLayout
    │   │   └── ui/             # Button, Card, Input, Select, Badge
    │   ├── context/            # AuthContext (JWT & session)
    │   ├── lib/                # api.ts (Centralized Fetch Client)
    │   └── types/              # TypeScript interfaces
    ├── package.json
    └── tsconfig.json
```
