import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { prisma } from '../lib/prisma.js';
import { generateToken } from '../utils/jwt.js';
import { DiscountType } from '../generated/prisma/enums.js';

describe('Orders & Checkout API (/api/orders)', () => {
  const testUserIds: string[] = [];
  const testProductIds: string[] = [];
  const testCouponIds: string[] = [];

  let userAToken: string;
  let userAId: string;
  let userBToken: string;
  let userBId: string;

  let generalProduct: { id: string; name: string; price: number; stockQuantity: number };
  let limitedProduct: { id: string; name: string; price: number; stockQuantity: number };
  let expensiveProduct: { id: string; name: string; price: number; stockQuantity: number };

  let inactiveCouponCode: string;
  let expiredCouponCode: string;
  let highMinOrderCouponCode: string;

  beforeAll(async () => {
    // 1. Create Test Users
    const userA = await prisma.user.create({
      data: {
        name: 'Order Tester A',
        email: `order_user_a_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@ordertest.com`,
        passwordHash: 'dummy_hash',
      },
    });
    testUserIds.push(userA.id);
    userAId = userA.id;
    userAToken = generateToken({ userId: userA.id, role: userA.role });

    const userB = await prisma.user.create({
      data: {
        name: 'Order Tester B',
        email: `order_user_b_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@ordertest.com`,
        passwordHash: 'dummy_hash',
      },
    });
    testUserIds.push(userB.id);
    userBId = userB.id;
    userBToken = generateToken({ userId: userB.id, role: userB.role });

    // 2. Create Test Products
    const p1 = await prisma.product.create({
      data: {
        name: 'General Order Test Item',
        category: 'TestOrderCategory',
        price: 150000, // ₹1,500.00
        stockQuantity: 20,
      },
    });
    testProductIds.push(p1.id);
    generalProduct = { id: p1.id, name: p1.name, price: p1.price, stockQuantity: p1.stockQuantity };

    const p2 = await prisma.product.create({
      data: {
        name: 'Limited Single Stock Item',
        category: 'TestOrderCategory',
        price: 250000, // ₹2,500.00
        stockQuantity: 1, // Only 1 item in stock for race-condition testing
      },
    });
    testProductIds.push(p2.id);
    limitedProduct = { id: p2.id, name: p2.name, price: p2.price, stockQuantity: p2.stockQuantity };

    const p3 = await prisma.product.create({
      data: {
        name: 'Expensive High Value Item',
        category: 'TestOrderCategory',
        price: 400000, // ₹4,000.00
        stockQuantity: 10,
      },
    });
    testProductIds.push(p3.id);
    expensiveProduct = { id: p3.id, name: p3.name, price: p3.price, stockQuantity: p3.stockQuantity };

    // 3. Create Test Coupons for edge cases
    inactiveCouponCode = `INACTIVE_${Date.now()}`;
    const c1 = await prisma.coupon.create({
      data: {
        code: inactiveCouponCode,
        discountType: DiscountType.FLAT,
        discountValue: 20000, // ₹200.00
        minOrderValue: 50000, // ₹500.00
        expiryDate: new Date('2030-01-01'),
        isActive: false,
      },
    });
    testCouponIds.push(c1.id);

    expiredCouponCode = `EXPIRED_${Date.now()}`;
    const c2 = await prisma.coupon.create({
      data: {
        code: expiredCouponCode,
        discountType: DiscountType.PERCENTAGE,
        discountValue: 15,
        minOrderValue: 50000,
        expiryDate: new Date('2020-01-01'), // in the past
        isActive: true,
      },
    });
    testCouponIds.push(c2.id);

    highMinOrderCouponCode = `HIGHMIN_${Date.now()}`;
    const c3 = await prisma.coupon.create({
      data: {
        code: highMinOrderCouponCode,
        discountType: DiscountType.FLAT,
        discountValue: 50000, // ₹500.00
        minOrderValue: 500000, // ₹5,000.00
        expiryDate: new Date('2030-01-01'),
        isActive: true,
      },
    });
    testCouponIds.push(c3.id);
  });

  afterAll(async () => {
    // Non-destructive cleanup: delete only records created during tests
    if (testUserIds.length > 0) {
      await prisma.orderItem.deleteMany({
        where: { order: { userId: { in: testUserIds } } },
      });
      await prisma.order.deleteMany({
        where: { userId: { in: testUserIds } },
      });
      await prisma.cartItem.deleteMany({
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

    if (testCouponIds.length > 0) {
      await prisma.coupon.deleteMany({
        where: { id: { in: testCouponIds } },
      });
    }
  });

  describe('Authentication Enforcement', () => {
    it('POST /api/orders/checkout should require authentication', async () => {
      const response = await request(app).post('/api/orders/checkout').send({});
      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });

    it('GET /api/orders should require authentication', async () => {
      const response = await request(app).get('/api/orders');
      expect(response.status).toBe(401);
    });

    it('GET /api/orders/:id should require authentication', async () => {
      const response = await request(app).get('/api/orders/00000000-0000-0000-0000-000000000000');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/orders/checkout (Validation & Processing)', () => {
    it('should reject checkout when the cart is empty', async () => {
      const response = await request(app)
        .post('/api/orders/checkout')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('empty cart');
    });

    it('should successfully checkout without a coupon, deduct stock, and clear cart', async () => {
      // 1. Add item to User A's cart: 2 units of generalProduct (₹1,500 each = ₹3,000 subtotal)
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ productId: generalProduct.id, quantity: 2 });

      // Verify stock before checkout
      const productBefore = await prisma.product.findUnique({ where: { id: generalProduct.id } });
      const initialStock = productBefore!.stockQuantity;

      // 2. Perform checkout
      const response = await request(app)
        .post('/api/orders/checkout')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({});

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');

      const { order } = response.body.data;
      expect(order.id).toBeDefined();
      expect(order.userId).toBe(userAId);
      expect(order.status).toBe('PLACED');
      expect(order.subtotal).toBe(300000); // 2 * 150000 paise
      expect(order.discountAmount).toBe(0);
      expect(order.totalAmount).toBe(300000);
      expect(order.couponId).toBeNull();
      expect(order.couponCodeSnapshot).toBeNull();

      // Check order item snapshots
      expect(order.items).toHaveLength(1);
      const item = order.items[0];
      expect(item.productId).toBe(generalProduct.id);
      expect(item.productName).toBe(generalProduct.name);
      expect(item.unitPrice).toBe(150000);
      expect(item.quantity).toBe(2);
      expect(item.lineTotal).toBe(300000);

      // Verify stock was deducted atomically in database
      const productAfter = await prisma.product.findUnique({ where: { id: generalProduct.id } });
      expect(productAfter!.stockQuantity).toBe(initialStock - 2);

      // Verify cart was cleared after successful order
      const cartCount = await prisma.cartItem.count({ where: { userId: userAId } });
      expect(cartCount).toBe(0);
    });

    it('should successfully apply percentage coupon (WELCOME10) during checkout', async () => {
      // Add expensive product to User A's cart: 1 unit = ₹4,000 (400000 paise)
      // WELCOME10 is 10% off (min order ₹999 = 99900 paise). Discount should be ₹400 = 40000 paise.
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ productId: expensiveProduct.id, quantity: 1 });

      const response = await request(app)
        .post('/api/orders/checkout')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ couponCode: 'WELCOME10' });

      expect(response.status).toBe(201);
      const { order } = response.body.data;
      expect(order.subtotal).toBe(400000);
      expect(order.discountAmount).toBe(40000); // 10% of 400000
      expect(order.totalAmount).toBe(360000); // 400000 - 40000
      expect(order.couponCodeSnapshot).toBe('WELCOME10');
      expect(order.discountTypeSnapshot).toBe('PERCENTAGE');
      expect(order.discountValueSnapshot).toBe(10);

      // Verify cart is cleared
      const cartCount = await prisma.cartItem.count({ where: { userId: userAId } });
      expect(cartCount).toBe(0);
    });

    it('should successfully apply flat coupon (FLAT500) during checkout', async () => {
      // Add expensive product to User A's cart: 1 unit = ₹4,000 (400000 paise)
      // FLAT500 gives flat ₹500 off (50000 paise, min order ₹2,499 = 249900 paise).
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ productId: expensiveProduct.id, quantity: 1 });

      const response = await request(app)
        .post('/api/orders/checkout')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ couponCode: 'FLAT500' });

      expect(response.status).toBe(201);
      const { order } = response.body.data;
      expect(order.subtotal).toBe(400000);
      expect(order.discountAmount).toBe(50000); // Flat ₹500 off
      expect(order.totalAmount).toBe(350000); // 400000 - 50000
      expect(order.couponCodeSnapshot).toBe('FLAT500');
      expect(order.discountTypeSnapshot).toBe('FLAT');
      expect(order.discountValueSnapshot).toBe(50000);

      // Verify cart is cleared
      const cartCount = await prisma.cartItem.count({ where: { userId: userAId } });
      expect(cartCount).toBe(0);
    });

    it('should reject checkout when coupon code does not exist', async () => {
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ productId: expensiveProduct.id, quantity: 1 });

      const response = await request(app)
        .post('/api/orders/checkout')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ couponCode: 'NONEXISTENT_COUPON_123' });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('invalid or does not exist');

      // Cart should remain intact
      const cartCount = await prisma.cartItem.count({ where: { userId: userAId } });
      expect(cartCount).toBe(1);

      // Clean up cart for next test
      await request(app).delete('/api/cart').set('Authorization', `Bearer ${userAToken}`);
    });

    it('should reject checkout when coupon is inactive', async () => {
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ productId: expensiveProduct.id, quantity: 1 });

      const response = await request(app)
        .post('/api/orders/checkout')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ couponCode: inactiveCouponCode });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('inactive');

      await request(app).delete('/api/cart').set('Authorization', `Bearer ${userAToken}`);
    });

    it('should reject checkout when coupon has expired', async () => {
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ productId: expensiveProduct.id, quantity: 1 });

      const response = await request(app)
        .post('/api/orders/checkout')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ couponCode: expiredCouponCode });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('expired');

      await request(app).delete('/api/cart').set('Authorization', `Bearer ${userAToken}`);
    });

    it('should reject checkout when subtotal does not meet coupon minimum order value', async () => {
      // Order 1 unit of generalProduct = ₹1,500 (150000 paise).
      // highMinOrderCouponCode requires ₹5,000 (500000 paise).
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ productId: generalProduct.id, quantity: 1 });

      const response = await request(app)
        .post('/api/orders/checkout')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ couponCode: highMinOrderCouponCode });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('minimum order value');

      await request(app).delete('/api/cart').set('Authorization', `Bearer ${userAToken}`);
    });
  });

  describe('Critical Concurrent Stock Safety & Rollback', () => {
    it('should reject checkout with HTTP 409 Conflict when requested quantity exceeds available stock', async () => {
      // limitedProduct has stock = 1.
      // Update limitedProduct stock directly to 1 in DB to be sure.
      await prisma.product.update({
        where: { id: limitedProduct.id },
        data: { stockQuantity: 1 },
      });

      // Add 1 to cart
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ productId: limitedProduct.id, quantity: 1 });

      // Before checkout, simulate another user or admin reducing stock to 0
      await prisma.product.update({
        where: { id: limitedProduct.id },
        data: { stockQuantity: 0 },
      });

      const response = await request(app)
        .post('/api/orders/checkout')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({});

      expect(response.status).toBe(409);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Insufficient stock');

      // Stock should remain 0 (not negative)
      const product = await prisma.product.findUnique({ where: { id: limitedProduct.id } });
      expect(product!.stockQuantity).toBe(0);

      // Cart should NOT be cleared because transaction was aborted
      const cartCount = await prisma.cartItem.count({ where: { userId: userAId } });
      expect(cartCount).toBe(1);

      // Reset cart and restore 1 stock for concurrent race test
      await request(app).delete('/api/cart').set('Authorization', `Bearer ${userAToken}`);
      await prisma.product.update({
        where: { id: limitedProduct.id },
        data: { stockQuantity: 1 },
      });
    });

    it('should atomically allow only one customer to purchase last stock item during concurrent checkouts', async () => {
      // limitedProduct stock is exactly 1.
      // User A and User B both add 1 limitedProduct to their cart.
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ productId: limitedProduct.id, quantity: 1 });

      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ productId: limitedProduct.id, quantity: 1 });

      // Trigger concurrent checkout requests simultaneously
      const [resA, resB] = await Promise.all([
        request(app).post('/api/orders/checkout').set('Authorization', `Bearer ${userAToken}`).send({}),
        request(app).post('/api/orders/checkout').set('Authorization', `Bearer ${userBToken}`).send({}),
      ]);

      const statuses = [resA.status, resB.status];
      // Exactly one must succeed (201) and the other must fail with conflict (409)
      expect(statuses).toContain(201);
      expect(statuses).toContain(409);

      // Final stock must be exactly 0 (never negative)
      const product = await prisma.product.findUnique({ where: { id: limitedProduct.id } });
      expect(product!.stockQuantity).toBe(0);

      // Identify winner and loser
      const winnerRes = resA.status === 201 ? resA : resB;
      const loserRes = resA.status === 409 ? resA : resB;
      const winnerUserId = resA.status === 201 ? userAId : userBId;
      const loserUserId = resA.status === 409 ? userAId : userBId;

      expect(winnerRes.body.data.order.status).toBe('PLACED');
      expect(loserRes.body.status).toBe('error');
      expect(loserRes.body.message).toContain('Insufficient stock');

      // The winning customer's cart must be cleared
      const winnerCartCount = await prisma.cartItem.count({ where: { userId: winnerUserId } });
      expect(winnerCartCount).toBe(0);

      // The failing customer's cart must NOT be cleared
      const loserCartCount = await prisma.cartItem.count({ where: { userId: loserUserId } });
      expect(loserCartCount).toBe(1);

      // Clean up loser's cart
      await prisma.cartItem.deleteMany({ where: { userId: loserUserId } });
    });
  });

  describe('Customer Order History & Details (GET /api/orders & /api/orders/:id)', () => {
    let orderAId: string;

    beforeAll(async () => {
      // Place an order for User A to query
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ productId: generalProduct.id, quantity: 1 });

      const checkoutRes = await request(app)
        .post('/api/orders/checkout')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({});

      orderAId = checkoutRes.body.data.order.id;
    });

    it('GET /api/orders should return the authenticated customer order history', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data.orders)).toBe(true);
      expect(response.body.data.orders.length).toBeGreaterThan(0);

      const foundOrder = response.body.data.orders.find((o: any) => o.id === orderAId);
      expect(foundOrder).toBeDefined();
      expect(foundOrder.userId).toBe(userAId);
      expect(foundOrder.items).toBeDefined();
      expect(foundOrder.items.length).toBeGreaterThan(0);
    });

    it('GET /api/orders/:id should return single order details for owner', async () => {
      const response = await request(app)
        .get(`/api/orders/${orderAId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.order.id).toBe(orderAId);
      expect(response.body.data.order.items).toHaveLength(1);
      expect(response.body.data.order.items[0].productName).toBe(generalProduct.name);
    });

    it('GET /api/orders/:id should return 404 for nonexistent order ID', async () => {
      const response = await request(app)
        .get('/api/orders/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Order not found');
    });

    it('GET /api/orders/:id should return 400 for malformed order ID', async () => {
      const response = await request(app)
        .get('/api/orders/not-a-valid-uuid')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Validation failed');
    });

    it('GET /api/orders/:id should prevent User B from accessing User A’s order (isolation)', async () => {
      const response = await request(app)
        .get(`/api/orders/${orderAId}`)
        .set('Authorization', `Bearer ${userBToken}`);

      // Must return 404 to avoid leaking existence or data
      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Order not found');
    });
  });
});

