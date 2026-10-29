# Mini Online Store

A robust full-stack e-commerce application featuring customer authentication, product catalogue with server-side filters and sorting, dynamic shopping cart with real-time navbar count badge, transactional checkout with coupon validation and concurrency-safe stock deduction, customer order history with immutable historical snapshots, and a role-protected administrative management portal.

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

6. Start the backend development server:
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

## Safe Demo Login Instructions

To protect user security and prevent credential leakage in source control, no hardcoded passwords are committed. Reviewers can easily test both Customer and Administrator personas using the safe procedures below:

### 1. Customer Account
- **Registration**: Navigate to `http://localhost:5173/register` in your browser.
- Create an account using any preferred name, email address (e.g., `customer@example.com`), and an 8+ character password.
- **Login**: Log in anytime at `http://localhost:5173/login` using your registered credentials.
- *Customer Capabilities*: Browse catalogue, apply filters and sorting, manage shopping cart, apply promotional coupons (`WELCOME10`, `FLAT500`, `MEGA20`), complete checkouts, and review personal order history.

### 2. Administrator Account
- Public registration strictly denies assigning administrative privileges. To create a verified `ADMIN` user, execute the local server-side script:
  ```bash
  # From the 'backend' directory:
  npm run create-admin <email> <password> [name]

  # Example:
  npm run create-admin admin@example.com AdminPass123! "Store Admin"
  ```
  *(The script hashes your chosen password using 10 rounds of bcrypt before saving it to PostgreSQL).*
- **Login**: Visit `http://localhost:5173/login` and sign in with the administrator email and password you created above.
- **Admin Portal**: Once signed in as an administrator, an **"Admin Portal"** navigation link appears in the navbar. Reviewers can access:
  - Product Catalogue Management: `http://localhost:5173/admin/products` (create products, edit stock/pricing, delete items with validation).
  - Customer Order Oversight: `http://localhost:5173/admin/orders` (inspect order receipts, view customer snapshots, transition order status `PLACED` → `SHIPPED` → `DELIVERED`).

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

## Data Model & Important Design Decisions

### Prisma Schema Entities (`backend/prisma/schema.prisma`)

```mermaid
erDiagram
    USER ||--o{ CART_ITEM : has
    USER ||--o{ ORDER : places
    PRODUCT ||--o{ CART_ITEM : contains
    PRODUCT ||--o{ ORDER_ITEM : referenced_by
    ORDER ||--|{ ORDER_ITEM : includes
    COUPON ||--o{ ORDER : applies_to

    USER {
        string id PK
        string name
        string email UK
        string passwordHash
        enum role "CUSTOMER | ADMIN"
        datetime createdAt
        datetime updatedAt
    }

    PRODUCT {
        string id PK
        string name
        string description
        string category
        int price "in paise"
        int stockQuantity
        string imageUrl
        datetime createdAt
        datetime updatedAt
    }

    CART_ITEM {
        string id PK
        string userId FK
        string productId FK
        int quantity
        datetime createdAt
        datetime updatedAt
    }

    COUPON {
        string id PK
        string code UK
        enum discountType "PERCENTAGE | FLAT"
        int discountValue
        int minOrderValue "in paise"
        datetime expiryDate
        boolean isActive
    }

    ORDER {
        string id PK
        string userId FK
        enum status "PLACED | SHIPPED | DELIVERED"
        int subtotal "in paise"
        int discountAmount "in paise"
        int totalAmount "in paise"
        string couponId FK
        string couponCodeSnapshot
        enum discountTypeSnapshot
        int discountValueSnapshot
        datetime createdAt
        datetime updatedAt
    }

    ORDER_ITEM {
        string id PK
        string orderId FK
        string productId FK
        string productName "snapshot"
        int unitPrice "in paise snapshot"
        int quantity
        int lineTotal "in paise snapshot"
    }
```

### Important Design Decisions

1. **Integer Paise Monetary System**:
   All monetary amounts across the database (`Product.price`, `Order.subtotal`, `Order.totalAmount`, `OrderItem.unitPrice`, `OrderItem.lineTotal`, `Coupon.minOrderValue`) are stored and computed as **integer paise** (₹1.00 = 100 paise). This completely prevents floating-point precision inaccuracies common with IEEE 754 arithmetic in currency calculations.
2. **Atomic Concurrency & Stock Safety**:
   Order placement executes inside an atomic Prisma transaction (`$transaction`). Stock deduction is performed using conditional updates (`stockQuantity: { gte: requestedQuantity }`), preventing race conditions, inventory overselling, or negative stock under concurrent checkout attempts.
3. **Immutable Historical Snapshots**:
   Orders freeze the exact state of purchased items at checkout time (`productName`, `unitPrice`, `lineTotal`, `couponCodeSnapshot`). If an administrator subsequently alters a product's price, renames it, or deletes it from the catalogue (`onDelete: SetNull`), past customer receipts remain completely intact and legally auditable.
4. **Tenant Security & Customer Data Isolation**:
   All customer order history and order details enforce `where: { id: orderId, userId }`. Attempting to query an order belonging to another customer returns an HTTP 404 rather than an authorization error, ensuring zero disclosure of order IDs or user activity.
5. **Role-Based Access Control**:
   The `ADMIN` role is strictly enforced via server-side middleware (`requireAdmin`). Public customer registration cannot escalate privileges.
6. **Centralized Error Envelope & Zod Validation**:
   All API endpoints enforce strict schema validation via Zod before hitting business logic. Errors return standardized envelopes (`{ success: false, error: { message, code, details } }`).

---

## Running Verification & Tests

### Backend Integration Test Suite
Run the 102 automated Vitest/Supertest integration tests:
```bash
npm --prefix backend test
```

Test breakdown across critical workflows:
- `src/routes/auth.routes.test.ts` (13 tests): Registration, password hashing, JWT issuance, profile retrieval, input validation.
- `src/routes/cart.routes.test.ts` (23 tests): Cart mutations, quantity steppers, stock limits, item removal, cart clearing, quantity aggregation.
- `src/routes/order.routes.test.ts` (18 tests): Transactional checkout, coupon logic (percentage, flat, minimum order, expiry), atomic stock concurrency safety & rollback, customer data isolation.
- `src/routes/product.routes.test.ts` (20 tests): Catalogue listing, category filters, price range filters, pagination, sort options.
- `src/routes/admin.routes.test.ts` (21 tests): Admin route protection, product CRUD operations, order status transitions (`PLACED` → `SHIPPED` → `DELIVERED`).
- `src/app.test.ts` (7 tests): Health check, 404 handler, error handling envelope, CORS.

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

## Project Status: Implementation Scope & Future Improvements

### Finished Features
- **Customer Lifecycle**: Secure user registration, bcrypt password hashing, JWT token authentication, profile session restoration, and authenticated route guards.
- **Product Discovery**: Responsive catalogue grid, multi-parameter server-side filters (category, price range), sorting options (newest, price asc/desc, title), server-driven pagination, and shimmer skeleton loading states.
- **Dynamic Shopping Cart**: Synchronized cart item count badge in the sticky top navbar, item quantity stepper with live stock ceilings, item deletion, and cart clearing.
- **Transactional Checkout**: Cart subtotal computation, live coupon validation with exact error feedback (`WELCOME10`, `FLAT500`, `MEGA20`), atomic inventory deduction, and automatic post-checkout cart clearance.
- **Customer Order History**: Chronological customer order list, individual receipt view with historical price/item snapshots, and customer data isolation.
- **Administrative Portal**: Role-protected management dashboard, product creation/updating/deletion, order inspection, and verified order status lifecycle transitions (`PLACED` → `SHIPPED` → `DELIVERED`).
- **UI/UX Polish**: Responsive mobile/laptop layouts, glassmorphism sticky navbar, aurora gradient hero with mouse-parallax tilt product showcase, infinite marquee, and accessibility support for `prefers-reduced-motion`.
- **Automated Testing & Quality**: 102 integration tests, 0 lint errors, and successful TypeScript production build.

### Incomplete / Out-of-Scope Boundaries
- **Third-Party Payment Gateway Integration**: Real-world payment processing (e.g. Stripe, Razorpay) is currently modeled as instant transactional settlement upon order submission.
- **Email & SMS Notifications**: Automated customer notification delivery (e.g., via SendGrid or Twilio) for order placement and status updates.

### Future Improvements (Given More Time)
- **Redis Caching Layer**: Cache popular product catalogue queries and invalidate on admin mutations to reduce PostgreSQL read load.
- **Cloud Asset Storage**: Direct cloud uploads (AWS S3 or Cloudinary) for product imagery rather than external URL references.
- **Customer Product Reviews**: Allow verified buyers to submit ratings and reviews for purchased products.
- **Address Book Management**: Support multiple saved shipping and billing addresses for customer accounts.
- **Automated Inventory Restocking & Cancellation**: Enable customers or admins to cancel orders with automatic inventory restoration within allowable time windows.

---

## AI Tools Used & Assisted Scope

- **Tool**: Antigravity (Google DeepMind agentic coding assistant).
- **Assisted Scope**:
  - Full-stack architecture design, folder organization, and environment configuration.
  - PostgreSQL schema design with Prisma 7, schema migrations, and idempotent database seed scripts.
  - Express REST API routing, Zod validator schemas, controllers, and atomic transactional services.
  - Authoring the comprehensive 102 Vitest integration test suite covering authentication, cart mutations, checkout concurrency, catalogue filtering, and admin workflows.
  - React 19 frontend features, Tailwind CSS styling, responsive desktop/mobile layouts, centralized Fetch API client, and GPU-accelerated motion micro-interactions.
  - Automated integration auditing, oxlint linting, and TypeScript production build verification.

---

## Deployment Status & Production Migration Guide

- **Deployment Status**: Configured and verified for production readiness and local execution (`http://localhost:5173` frontend, `http://localhost:5000` backend).
- **Production Migrations**:
  In production environments (e.g., Render release phase, Railway deploy, or Docker entrypoint), execute:
  ```bash
  npx prisma migrate deploy
  ```
  *(Always use `npx prisma migrate deploy` in production environments rather than `migrate dev`. This safely applies pending schema migrations to the target database without resetting existing data).*
- **Live Demo Link**: N/A (The application is designed and submitted as a local full-stack development project. No remote cloud hosting instance is currently deployed).

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
- Ensure you created an admin account using `npm run create-admin <email> <password>` in the `backend` folder and logged in with those credentials. Registering through the public UI `/register` always creates a `CUSTOMER` account.
