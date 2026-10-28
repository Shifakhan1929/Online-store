# Mini Online Store

A robust full-stack e-commerce application featuring authentication, product catalogue with server-side filters, shopping cart with real-time navbar count badge, transactional checkout with coupon validation, customer order history, and a role-protected administrative portal.

---

## Architecture Overview

- **Backend**: Node.js, Express, TypeScript, Prisma 7 with PostgreSQL adapter (`@prisma/adapter-pg`), bcryptjs, jsonwebtoken, Zod validation, and Vitest.
- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, React Router 7, and centralized Fetch API client.
- **Monetary Unit Convention**: All monetary amounts are stored in the database and processed across internal APIs as **integer paise** (₹1.00 = 100 paise) to prevent floating-point inaccuracies. Price filters and admin product inputs accept rupees and are converted by the backend.

---

## Directory Structure

```
Online-store/
├── backend/
│   ├── prisma/             # Schema, migrations, seeds, admin generator
│   ├── src/
│   │   ├── controllers/    # Express controllers
│   │   ├── middlewares/    # Auth, requireAdmin, Zod validators, error handler
│   │   ├── routes/         # API routes and test suites
│   │   ├── services/       # Core business logic and database queries
│   │   └── validators/     # Zod request validation schemas
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/            # Centralized Fetch API client
│   │   ├── features/
│   │   │   ├── admin/      # Admin product & order management
│   │   │   ├── auth/       # Login, register, auth context & ProtectedRoute
│   │   │   ├── cart/       # Cart table, quantity steppers, cart context
│   │   │   ├── checkout/   # Order review, coupon entry, place order
│   │   │   ├── orders/     # Customer order history & receipt view
│   │   │   └── products/   # Public catalogue, filters, sorting, cards
│   │   ├── layouts/        # RootLayout with sticky top navbar & dynamic cart badge
│   │   └── types/          # Shared domain TypeScript types
│   ├── .env.example
│   └── package.json
└── README.md
```

---

## Getting Started & Setup Instructions

### Prerequisites
- **Node.js**: v20+ recommended (tested on Node.js v22)
- **PostgreSQL**: PostgreSQL 14+ instance running locally or via Docker

---

### 1. Database Creation

Before running database migrations, ensure your PostgreSQL server is running and create the database:

```sql
-- Using PostgreSQL command-line shell (psql)
CREATE DATABASE mini_online_store;
```

Or from your terminal:
```bash
psql -U postgres -c "CREATE DATABASE mini_online_store;"
```

---

### 2. Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   # On macOS / Linux:
   cp .env.example .env

   # On Windows PowerShell:
   Copy-Item .env.example .env
   ```
   Edit `.env` and fill in your database credentials:
   - `PORT`: Server port (default: `5000`)
   - `DATABASE_URL`: PostgreSQL connection string (e.g. `postgresql://postgres:YOUR_PASSWORD@localhost:5432/mini_online_store?schema=public`)
   - `JWT_SECRET`: Secret key for signing JSON Web Tokens
   - `JWT_EXPIRES_IN`: Token validity period (e.g. `7d`)

4. Generate Prisma Client and apply migrations:
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

5. Seed demo products and coupons:
   ```bash
   npm run seed
   ```

6. Create an Administrator account:
   Run the interactive script with arguments:
   ```bash
   npm run create-admin <email> <password> [name]

   # Example:
   npm run create-admin admin@example.com AdminPass123! "Store Admin"
   ```
   *(Alternatively, define `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME` in `backend/.env` and execute `npm run create-admin`)*

7. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend API will run at `http://localhost:5000`.

---

### 3. Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd ../frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (optional for development):
   Copy `.env.example` to `.env`:
   ```bash
   # On macOS / Linux:
   cp .env.example .env

   # On Windows PowerShell:
   Copy-Item .env.example .env
   ```
   - `VITE_API_BASE_URL`: Base path for API requests (default: `/api`)
   - `VITE_BACKEND_URL`: Backend server address proxied by Vite in development (default: `http://localhost:5000`)

   *Note: In development, Vite automatically proxies all `/api` requests directly to `http://localhost:5000`, so `.env` is optional unless running the backend on a custom port.*

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.

---

## Seeded Demo Coupons

The seed script (`npm run seed`) populates the database with 10 products across 4 categories and the following promotional coupons:

| Coupon Code | Discount Type | Discount Value | Minimum Order Value | Expiry Date |
|:---|:---|:---|:---|:---|
| **`WELCOME10`** | Percentage | 10% off | ₹999.00 (`99900` paise) | Dec 31, 2028 |
| **`FLAT500`** | Flat Amount | ₹500.00 off | ₹2,499.00 (`249900` paise) | Dec 31, 2028 |
| **`MEGA20`** | Percentage | 20% off | ₹4,999.00 (`499900` paise) | Dec 31, 2028 |

Coupons are validated at checkout against the cart subtotal before applying discounts.

---

## Running Verification & Tests

### Backend Integration Test Suite
Run the 102 automated Vitest/Supertest integration tests:
```bash
npm --prefix backend test
```

### Frontend Code Quality & Linting
Run oxlint across all frontend source files:
```bash
npm --prefix frontend run lint
```

### Frontend Typecheck & Production Build
Verify TypeScript compilation and generate the production bundle:
```bash
npm --prefix frontend run build
```

---

## API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register a customer account
- `POST /api/auth/login` - Authenticate with email/password and obtain JWT
- `GET /api/auth/me` - Retrieve current authenticated user profile

### Product Catalogue (`/api/products`)
- `GET /api/products` - List products with category, minPrice, maxPrice, sort, and pagination
- `GET /api/products/:id` - Retrieve individual product details

### Shopping Cart (`/api/cart`)
- `GET /api/cart` - Retrieve current user's shopping cart
- `POST /api/cart/items` - Add product or increment quantity in cart
- `PATCH /api/cart/items/:itemId` - Update cart item quantity
- `DELETE /api/cart/items/:itemId` - Remove specific item from cart
- `DELETE /api/cart` - Clear entire shopping cart

### Orders & Checkout (`/api/orders`)
- `POST /api/orders/checkout` - Create order transactionally with coupon validation and stock deduction
- `GET /api/orders` - Retrieve customer order history
- `GET /api/orders/:id` - Retrieve single order details (strictly isolated by user)

### Admin Operations (`/api/admin`)
*(Requires verified `ADMIN` role)*
- `POST /api/admin/products` - Create new product (price submitted in rupees)
- `PATCH /api/admin/products/:id` - Update existing product
- `DELETE /api/admin/products/:id` - Remove product from catalogue
- `GET /api/admin/orders` - View all customer orders with pagination
- `GET /api/admin/orders/:id` - Inspect order details with customer information
- `PATCH /api/admin/orders/:id/status` - Advance order status (`PLACED` → `SHIPPED` → `DELIVERED`)

---

## Key Security & Business Logic Guarantees

1. **Role-Based Access Control**:
   - Only backend-verified `ADMIN` users can access administrative endpoints or routes.
   - Public registration strictly denies setting the `ADMIN` role.
2. **Transactional Concurrency & Stock Safety**:
   - Checkouts execute inside atomic Prisma transactions with database-level `stockQuantity: { gte: requestedQuantity }` checks, preventing negative stock or race conditions during concurrent checkouts.
3. **Data Isolation**:
   - Order history and order detail lookups enforce `where: { id: orderId, userId }`. Requests for another customer's order return HTTP 404 to avoid leaking order existence.
4. **Historical Snapshot Preservation**:
   - When orders are placed, snapshots of item names, unit prices, line totals, coupon codes, and discount types are preserved in `OrderItem` and `Order` tables so subsequent catalogue updates or deletions never corrupt historical records.
5. **Real-Time Dynamic Cart Badge**:
   - Total cart item count synchronizes across navigation, add-to-cart, cart quantity updates, item removals, cart clearance, checkout completion, and authentication transitions without requiring full page reloads.

---

## Troubleshooting

### 1. Database Connection Error (`P1001: Can't reach database server`)
- Verify that your PostgreSQL service is actively running:
  - On Windows: check Windows Services (`services.msc`) for `postgresql-x64-<version>`.
  - On macOS/Linux: `sudo systemctl status postgresql` or `brew services list`.
- Check the port in `DATABASE_URL`: default is `5432`, but some PostgreSQL installations or Docker containers use `5433` or other ports.

### 2. Database Does Not Exist (`3D000: database "mini_online_store" does not exist`)
- Create the database manually using `psql -U postgres -c "CREATE DATABASE mini_online_store;"` before running migrations.

### 3. Prisma Client Initialization Error
- If `@prisma/client did not initialize yet` appears, run `npx prisma generate` in the `backend` directory.

### 4. Port Conflict (`EADDRINUSE: address already in use :::5000`)
- Another process is using port `5000`. Either terminate that process or update `PORT=5001` in `backend/.env` and set `VITE_BACKEND_URL="http://localhost:5001"` in `frontend/.env`.

### 5. Admin Portal Access Denied
- Ensure you created an admin account using `npm run create-admin <email> <password>` and logged in with those credentials. Registering through the public UI `/register` always creates a `CUSTOMER` account.

---

## Troubleshooting

### 1. Database Connection Error (`P1001: Can't reach database server`)
- Verify that your PostgreSQL service is actively running:
  - On Windows: check Windows Services (`services.msc`) for `postgresql-x64-<version>`.
  - On macOS/Linux: `sudo systemctl status postgresql` or `brew services list`.
- Check the port in `DATABASE_URL`: default is `5432`, but some PostgreSQL installations or Docker containers use `5433` or other ports.

### 2. Database Does Not Exist (`3D000: database "mini_online_store" does not exist`)
- Create the database manually using `psql -U postgres -c "CREATE DATABASE mini_online_store;"` before running migrations.

### 3. Prisma Client Initialization Error
- If `@prisma/client did not initialize yet` appears, run `npx prisma generate` in the `backend` directory.

### 4. Port Conflict (`EADDRINUSE: address already in use :::5000`)
- Another process is using port `5000`. Either terminate that process or update `PORT=5001` in `backend/.env` and set `VITE_BACKEND_URL="http://localhost:5001"` in `frontend/.env`.

### 5. Admin Portal Access Denied
- Ensure you created an admin account using `npm run create-admin <email> <password>` and logged in with those credentials. Registering through the public UI `/register` always creates a `CUSTOMER` account.

