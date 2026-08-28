# Inventory Management Web Application

A production-quality Inventory Management Web Application for managing products, variants, purchases, stock ledgers, sales, customers, invoicing, payments, and quotations.

---

## 1. System Requirements

*   **Node.js**: v18.x or higher (v22.x recommended)
*   **MongoDB**: v6.x or higher (locally running on `mongodb://localhost:27017`)
*   **Package Manager**: `npm`

---

## 2. Installation & Directory Layout

The project is structured as a full-stack monorepo:

*   `/client`: Vite + React + TypeScript + Tailwind CSS (runs on port `3000`/`5173`)
*   `/server`: Node.js + Express + Mongoose + TypeScript (runs on port `5000`)

To install dependencies across all modules, run the root installer script:

```bash
npm run install:all
```

---

## 3. Environment Configuration

Copy the example environment settings to initialize local configurations:

```bash
# Windows PowerShell
copy .env.example .env

# macOS / Linux / Git Bash
cp .env.example .env
```

Ensure the `.env` contents match your local parameters:
*   `PORT=5000` (Backend API Port)
*   `MONGODB_URI=mongodb://localhost:27017/inventory_app` (Local MongoDB URI)
*   `CLIENT_URL=http://localhost:5173` (Client origin for CORS)

---

## 4. Seeding the Database

Populate your MongoDB database with development master products, variants, sales, and transaction histories using the seed runner:

```bash
npm run seed
```

This clears old records and establishes initial datasets for:
*   **Products**: Glass (5mm, 6mm, 8mm, 10mm), Plywood, Steel TMT Bars.
*   **Customers**: Rahul Sharma, Amit Patel, Priya Singh.
*   **Transactions**: Pre-populated Sales, Payments, Purchases, and Stock Ledger entries.

---

## 5. Running the Application

Start both the frontend client and backend API concurrently using:

```bash
npm run dev
```

*   **Client Console**: `http://localhost:5173` or `http://localhost:3000`
*   **Backend Server Console**: `http://localhost:5000`

---

## 6. REST API Endpoints Foundation

*   **Health Check**: `GET http://localhost:5000/api/health`
*   **Products API**: `GET http://localhost:5000/api/products` (supports search, categories, and pagination)
*   **Purchases API**: `GET http://localhost:5000/api/purchases`
*   **Sales API**: `GET http://localhost:5000/api/sales`
*   **Customers API**: `GET http://localhost:5000/api/customers`
*   **Stock Ledger History**: `GET http://localhost:5000/api/stock/history`
*   **Quotation Proposals**: `GET http://localhost:5000/api/quotations`
*   **Dashboard KPI Metrics**: `GET http://localhost:5000/api/dashboard`
