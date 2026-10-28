# Mini Online Store

A robust full-stack e-commerce application featuring authentication, product catalogue with server-side filters, shopping cart, transactional checkout with coupon validation, customer order history, and a role-protected administrative portal.

---

## Architecture Overview

- **Backend**: Node.js, Express, TypeScript, Prisma 7 with PostgreSQL adapter, bcryptjs, jsonwebtoken, Zod validation, and Vitest.
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
│   │   │   ├── cart/       # Cart table, quantity steppers, clear cart
│   │   │   ├── checkout/   # Order review, coupon entry, place order
│   │   │   ├── orders/     # Customer order history & receipt view
│   │   │   └── products/   # Public catalogue, filters, sorting, cards
│   │   ├── layouts/        # RootLayout with dynamic navigation
│   │   └── types/          # Shared domain TypeScript types
│   ├── .env.example
│   └── package.json
└── README.md
```

---

## Getting Started & Setup Instructions

### Prerequisites
- Node.js (v20+ recommended, tested on Node.js v22)
- PostgreSQL database instance

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env` and fill in your database credentials:
   ```bash
   cp .env.example .env
   ```
   Required variables in `backend/.env`:
   - `PORT`: Server port (default: `5000`)
   - `DATABASE_URL`: PostgreSQL connection string (e.g. `postgresql://postgres:password@localhost:5432/mini_online_store?schema=public`)
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

6. (Optional) Create an initial Administrator account:
   ```bash
   npm run create-admin
   ```

7. Start the backend development server:
   ```bash
   npm run dev
   ```
   Backend runs at `http://localhost:5000`.

### 2. Frontend Setup

1. Navigate to the frontend directory:
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
   cp .env.example .env
   ```
   By default, Vite proxies `/api` requests directly to `http://localhost:5000`.

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   Frontend runs at `http://localhost:5173`.

---

## Running Verification & Tests

### Backend Test Suite
Run the 102 automated Vitest/Supertest integration tests:
```bash
npm --prefix backend test
```

### Frontend Typecheck & Build
Verify TypeScript compilation and production Vite bundle:
```bash
npm --prefix frontend run build
```

### Frontend Code Quality & Linting
Run oxlint on all frontend source files:
```bash
npm --prefix frontend run lint
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
- `POST /api/orders/checkout` - Create order transactionally with coupon code and stock deduction
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
