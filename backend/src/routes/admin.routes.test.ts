import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { prisma } from '../lib/prisma.js';
import { generateToken } from '../utils/jwt.js';
import { Role, OrderStatus } from '../generated/prisma/enums.js';

describe('Admin API (/api/admin)', () => {
  const testUserIds: string[] = [];
  const testProductIds: string[] = [];
  const testOrderIds: string[] = [];

  let adminUser: { id: string; email: string };
  let adminToken: string;

  let customerUser: { id: string; email: string };
  let customerToken: string;

  let spoofedAdminToken: string; // Token signed with role: ADMIN, but database has role: CUSTOMER

  beforeAll(async () => {
    // 1. Create an ADMIN user
    const admin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: `admin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@admintest.com`,
        passwordHash: 'dummy_hash',
        role: Role.ADMIN,
      },
    });
    testUserIds.push(admin.id);
    adminUser = { id: admin.id, email: admin.email };
    adminToken = generateToken({ userId: admin.id, role: admin.role });

    // 2. Create a standard CUSTOMER user
    const customer = await prisma.user.create({
      data: {
        name: 'Regular Customer',
        email: `customer_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@admintest.com`,
        passwordHash: 'dummy_hash',
        role: Role.CUSTOMER,
      },
    });
    testUserIds.push(customer.id);
    customerUser = { id: customer.id, email: customer.email };
    customerToken = generateToken({ userId: customer.id, role: customer.role });

    // 3. Create a spoofed token claiming role: ADMIN for the customerUser
    spoofedAdminToken = generateToken({ userId: customer.id, role: 'ADMIN' });
  });

  afterAll(async () => {
    // Non-destructive cleanup: only delete test records
    if (testOrderIds.length > 0) {
      await prisma.orderItem.deleteMany({
        where: { orderId: { in: testOrderIds } },
      });
      await prisma.order.deleteMany({
        where: { id: { in: testOrderIds } },
      });
    }
    if (testUserIds.length > 0) {
      await prisma.cartItem.deleteMany({
        where: { userId: { in: testUserIds } },
      });
      await prisma.orderItem.deleteMany({
        where: { order: { userId: { in: testUserIds } } },
      });
      await prisma.order.deleteMany({
        where: { userId: { in: testUserIds } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: testUserIds } },
      });
    }
    if (testProductIds.length > 0) {
      await prisma.product.deleteMany({
        where: { id: { in: testProductIds } },
      });
    }
  });

  describe('Admin Authorization Middleware', () => {
    it('should return HTTP 401 when no token is provided', async () => {
      const resProducts = await request(app).post('/api/admin/products').send({});
      expect(resProducts.status).toBe(401);
      expect(resProducts.body.status).toBe('error');

      const resOrders = await request(app).get('/api/admin/orders');
      expect(resOrders.status).toBe(401);
      expect(resOrders.body.status).toBe('error');
    });

    it('should return HTTP 403 when authenticated as a CUSTOMER', async () => {
      const resProducts = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({});
      expect(resProducts.status).toBe(403);
      expect(resProducts.body.status).toBe('error');
      expect(resProducts.body.message).toContain('Admin access required');

      const resOrders = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(resOrders.status).toBe(403);
      expect(resOrders.body.status).toBe('error');
    });

    it('should reject spoofed JWT tokens claiming role: ADMIN if database record is CUSTOMER (403)', async () => {
      // Token payload says ADMIN, but database lookup for customerUser.id reveals CUSTOMER
      const response = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${spoofedAdminToken}`);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Admin access required');
    });

    it('should allow verified ADMIN users to access admin routes', async () => {
      const response = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body).toHaveProperty('data');
    });

    it('should ensure public registration cannot create ADMIN accounts', async () => {
      const email = `public_reg_${Date.now()}@test.com`;
      const regRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Privilege Attempt',
          email,
          password: 'Password123!',
          role: 'ADMIN',
        });

      expect(regRes.status).toBe(201);
      testUserIds.push(regRes.body.user.id);

      // Must remain CUSTOMER
      expect(regRes.body.user.role).toBe('CUSTOMER');

      // Double check in database directly
      const dbUser = await prisma.user.findUnique({ where: { id: regRes.body.user.id } });
      expect(dbUser?.role).toBe(Role.CUSTOMER);
    });
  });

  describe('Admin Product Management', () => {
    let createdProductId: string;

    it('POST /api/admin/products should create a product with price in rupees converted to paise', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Created Ergonomic Chair',
          description: 'High-end ergonomic mesh office chair with lumbar support.',
          category: 'Furniture',
          price: 12499.50, // ₹12,499.50
          stockQuantity: 15,
          imageUrl: 'https://images.unsplash.com/photo-chair',
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');

      const { product } = response.body.data;
      expect(product.id).toBeDefined();
      createdProductId = product.id;
      testProductIds.push(product.id);

      expect(product.name).toBe('Admin Created Ergonomic Chair');
      expect(product.category).toBe('Furniture');
      // Converted to paise: 12499.50 * 100 = 1249950
      expect(product.price).toBe(1249950);
      expect(product.stockQuantity).toBe(15);
      expect(product.imageUrl).toBe('https://images.unsplash.com/photo-chair');

      // Verify in DB
      const dbProduct = await prisma.product.findUnique({ where: { id: createdProductId } });
      expect(dbProduct?.price).toBe(1249950);
    });

    it('POST /api/admin/products should reject invalid product data', async () => {
      // Missing name
      const res1 = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          category: 'Furniture',
          price: 100,
          stockQuantity: 10,
        });
      expect(res1.status).toBe(400);

      // Negative price
      const res2 = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Negative Chair',
          category: 'Furniture',
          price: -50,
          stockQuantity: 10,
        });
      expect(res2.status).toBe(400);

      // Negative stock
      const res3 = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Negative Stock Chair',
          category: 'Furniture',
          price: 50,
          stockQuantity: -5,
        });
      expect(res3.status).toBe(400);
    });

    it('PATCH /api/admin/products/:id should update product fields and convert updated price to paise', async () => {
      const response = await request(app)
        .patch(`/api/admin/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Ergonomic Chair Deluxe',
          price: 13999.00, // ₹13,999.00
          stockQuantity: 20,
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');

      const { product } = response.body.data;
      expect(product.name).toBe('Updated Ergonomic Chair Deluxe');
      expect(product.price).toBe(1399900); // Converted to paise
      expect(product.stockQuantity).toBe(20);
      expect(product.category).toBe('Furniture'); // Unchanged
    });

    it('PATCH /api/admin/products/:id should return 404 for nonexistent product ID', async () => {
      const response = await request(app)
        .patch('/api/admin/products/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Ghost Product' });

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Product not found');
    });

    it('PATCH /api/admin/products/:id should return 400 for malformed product ID', async () => {
      const response = await request(app)
        .patch('/api/admin/products/not-a-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Malformed ID' });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });

    it('DELETE /api/admin/products/:id should safely delete product while preserving historical OrderItem data', async () => {
      // 1. Create a product specifically to be purchased then deleted
      const tempProduct = await prisma.product.create({
        data: {
          name: 'Historical Purchase Product',
          category: 'Collectibles',
          price: 50000, // ₹500.00
          stockQuantity: 10,
        },
      });
      testProductIds.push(tempProduct.id);

      // 2. Customer buys this product
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: tempProduct.id, quantity: 2 });

      const checkoutRes = await request(app)
        .post('/api/orders/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({});

      expect(checkoutRes.status).toBe(201);
      const orderId = checkoutRes.body.data.order.id;
      testOrderIds.push(orderId);

      // 3. Admin deletes the product
      const deleteRes = await request(app)
        .delete(`/api/admin/products/${tempProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.status).toBe('success');
      expect(deleteRes.body.message).toBe('Product deleted successfully');

      // Verify product is gone from DB
      const dbProduct = await prisma.product.findUnique({ where: { id: tempProduct.id } });
      expect(dbProduct).toBeNull();

      // 4. Verify historical order data is preserved!
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      expect(order).not.toBeNull();
      expect(order?.items).toHaveLength(1);

      const orderItem = order!.items[0];
      // Foreign key became null per ON DELETE SET NULL
      expect(orderItem.productId).toBeNull();
      // Historical snapshots remain 100% intact
      expect(orderItem.productName).toBe('Historical Purchase Product');
      expect(orderItem.unitPrice).toBe(50000);
      expect(orderItem.quantity).toBe(2);
      expect(orderItem.lineTotal).toBe(100000);
    });

    it('DELETE /api/admin/products/:id should return 404 for nonexistent product', async () => {
      const response = await request(app)
        .delete('/api/admin/products/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
    });
  });

  describe('Admin Order Management', () => {
    let testOrder: any;

    beforeAll(async () => {
      // Place an order as customer to manage
      const product = await prisma.product.create({
        data: {
          name: 'Order Lifecycle Item',
          category: 'Lifecycle',
          price: 100000, // ₹1,000.00
          stockQuantity: 10,
        },
      });
      testProductIds.push(product.id);

      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: product.id, quantity: 1 });

      const checkoutRes = await request(app)
        .post('/api/orders/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({});

      testOrder = checkoutRes.body.data.order;
      testOrderIds.push(testOrder.id);
    });

    it('GET /api/admin/orders should list orders across all customers with pagination and customer info without passwordHash', async () => {
      const response = await request(app)
        .get('/api/admin/orders?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('orders');
      expect(response.body.data).toHaveProperty('pagination');

      const { orders, pagination } = response.body.data;
      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBeGreaterThan(0);
      expect(pagination.page).toBe(1);
      expect(pagination.limit).toBe(5);

      // Verify customer details are included, but NO passwordHash
      const order = orders[0];
      expect(order).toHaveProperty('user');
      expect(order.user.id).toBeDefined();
      expect(order.user.email).toBeDefined();
      expect(order.user.passwordHash).toBeUndefined();
      expect(JSON.stringify(response.body)).not.toContain('passwordHash');
    });

    it('GET /api/admin/orders/:id should retrieve order details with items and customer info', async () => {
      const response = await request(app)
        .get(`/api/admin/orders/${testOrder.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');

      const { order } = response.body.data;
      expect(order.id).toBe(testOrder.id);
      expect(order.user).toBeDefined();
      expect(order.user.id).toBe(customerUser.id);
      expect(order.user.passwordHash).toBeUndefined();
      expect(order.items).toBeDefined();
      expect(order.items.length).toBeGreaterThan(0);
    });

    it('GET /api/admin/orders/:id should return 404 for nonexistent order', async () => {
      const response = await request(app)
        .get('/api/admin/orders/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
    });

    it('PATCH /api/admin/orders/:id/status should successfully transition PLACED → SHIPPED', async () => {
      expect(testOrder.status).toBe(OrderStatus.PLACED);

      const response = await request(app)
        .patch(`/api/admin/orders/${testOrder.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: OrderStatus.SHIPPED });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.order.status).toBe(OrderStatus.SHIPPED);

      // Verify in DB
      const dbOrder = await prisma.order.findUnique({ where: { id: testOrder.id } });
      expect(dbOrder?.status).toBe(OrderStatus.SHIPPED);
    });

    it('PATCH /api/admin/orders/:id/status should reject reverse transition SHIPPED → PLACED with 409 Conflict', async () => {
      const response = await request(app)
        .patch(`/api/admin/orders/${testOrder.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: OrderStatus.PLACED });

      expect(response.status).toBe(409);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Cannot transition order status');
    });

    it('PATCH /api/admin/orders/:id/status should successfully transition SHIPPED → DELIVERED', async () => {
      const response = await request(app)
        .patch(`/api/admin/orders/${testOrder.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: OrderStatus.DELIVERED });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.order.status).toBe(OrderStatus.DELIVERED);

      const dbOrder = await prisma.order.findUnique({ where: { id: testOrder.id } });
      expect(dbOrder?.status).toBe(OrderStatus.DELIVERED);
    });

    it('PATCH /api/admin/orders/:id/status should reject any transition from DELIVERED (409 Conflict)', async () => {
      // Delivered order cannot transition to SHIPPED
      const res1 = await request(app)
        .patch(`/api/admin/orders/${testOrder.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: OrderStatus.SHIPPED });

      expect(res1.status).toBe(409);
      expect(res1.body.status).toBe('error');
      expect(res1.body.message).toContain('delivered order cannot transition back');

      // Delivered order cannot transition to PLACED
      const res2 = await request(app)
        .patch(`/api/admin/orders/${testOrder.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: OrderStatus.PLACED });

      expect(res2.status).toBe(409);
      expect(res2.body.status).toBe('error');
      expect(res2.body.message).toContain('delivered order cannot transition back');
    });

    it('PATCH /api/admin/orders/:id/status should reject invalid transitions such as PLACED → DELIVERED', async () => {
      // Create a new order in PLACED state
      const freshOrder = await prisma.order.create({
        data: {
          userId: customerUser.id,
          status: OrderStatus.PLACED,
          subtotal: 10000,
          discountAmount: 0,
          totalAmount: 10000,
        },
      });
      testOrderIds.push(freshOrder.id);

      // Attempt invalid skip: PLACED directly to DELIVERED
      const response = await request(app)
        .patch(`/api/admin/orders/${freshOrder.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: OrderStatus.DELIVERED });

      expect(response.status).toBe(409);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Cannot transition order status');
    });
  });

  describe('Customer Endpoints Continuity', () => {
    it('customer can continue to browse products and check health', async () => {
      const healthRes = await request(app).get('/api/health');
      expect(healthRes.status).toBe(200);

      const productsRes = await request(app).get('/api/products');
      expect(productsRes.status).toBe(200);
      expect(productsRes.body.status).toBe('success');
    });
  });
});

