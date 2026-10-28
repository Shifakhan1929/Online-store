import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { prisma } from '../lib/prisma.js';
import { generateToken } from '../utils/jwt.js';

describe('Shopping Cart API (/api/cart)', () => {
  const testUserIds: string[] = [];
  const testProductIds: string[] = [];

  let userAToken: string;
  let userAId: string;
  let userBToken: string;
  let userBId: string;

  let testProduct1: { id: string; name: string; price: number; stockQuantity: number };
  let testProduct2: { id: string; name: string; price: number; stockQuantity: number };

  beforeAll(async () => {
    // 1. Create User A
    const userA = await prisma.user.create({
      data: {
        name: 'Cart Tester A',
        email: `cart_user_a_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@carttest.com`,
        passwordHash: 'dummy_hash',
      },
    });
    testUserIds.push(userA.id);
    userAId = userA.id;
    userAToken = generateToken({ userId: userA.id, role: userA.role });

    // 2. Create User B (for cross-user isolation tests)
    const userB = await prisma.user.create({
      data: {
        name: 'Cart Tester B',
        email: `cart_user_b_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@carttest.com`,
        passwordHash: 'dummy_hash',
      },
    });
    testUserIds.push(userB.id);
    userBId = userB.id;
    userBToken = generateToken({ userId: userB.id, role: userB.role });

    // 3. Create isolated Test Products with known prices and stock
    const p1 = await prisma.product.create({
      data: {
        name: 'Cart Test Widget Low Stock',
        category: 'TestCartCategory',
        price: 20000, // ₹200.00
        stockQuantity: 5, // Limited stock for testing limits
        imageUrl: 'https://example.com/widget.jpg',
      },
    });
    testProductIds.push(p1.id);
    testProduct1 = { id: p1.id, name: p1.name, price: p1.price, stockQuantity: p1.stockQuantity };

    const p2 = await prisma.product.create({
      data: {
        name: 'Cart Test Gadget High Stock',
        category: 'TestCartCategory',
        price: 50000, // ₹500.00
        stockQuantity: 50,
        imageUrl: 'https://example.com/gadget.jpg',
      },
    });
    testProductIds.push(p2.id);
    testProduct2 = { id: p2.id, name: p2.name, price: p2.price, stockQuantity: p2.stockQuantity };
  });

  afterAll(async () => {
    // Non-destructive cleanup: delete only records created during this test suite
    if (testUserIds.length > 0) {
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
  });

  describe('Authentication Enforcement', () => {
    it('GET /api/cart should require authentication', async () => {
      const response = await request(app).get('/api/cart');
      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });

    it('POST /api/cart/items should require authentication', async () => {
      const response = await request(app)
        .post('/api/cart/items')
        .send({ productId: testProduct1.id, quantity: 1 });
      expect(response.status).toBe(401);
    });

    it('PATCH /api/cart/items/:itemId should require authentication', async () => {
      const response = await request(app)
        .patch('/api/cart/items/00000000-0000-0000-0000-000000000000')
        .send({ quantity: 2 });
      expect(response.status).toBe(401);
    });

    it('DELETE /api/cart/items/:itemId should require authentication', async () => {
      const response = await request(app)
        .delete('/api/cart/items/00000000-0000-0000-0000-000000000000');
      expect(response.status).toBe(401);
    });

    it('DELETE /api/cart should require authentication', async () => {
      const response = await request(app).delete('/api/cart');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/cart (Empty Cart)', () => {
    it('should return an empty cart with total amount 0 and item quantity 0', async () => {
      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.items).toEqual([]);
      expect(response.body.data.totalAmount).toBe(0);
      expect(response.body.data.totalQuantity).toBe(0);
    });
  });

  describe('POST /api/cart/items (Add Item)', () => {
    it('should add a valid product to the cart with correct subtotal and totals', async () => {
      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ productId: testProduct1.id, quantity: 2 });

      expect([200, 201]).toContain(response.status);
      expect(response.body.status).toBe('success');

      const { data } = response.body;
      expect(data.item).toBeDefined();
      expect(data.item.productId).toBe(testProduct1.id);
      expect(data.item.quantity).toBe(2);
      expect(data.item.price).toBe(20000);
      expect(data.item.subtotal).toBe(40000); // 20000 * 2
      expect(data.item.stockQuantity).toBe(5);
      expect(data.item.name).toBe(testProduct1.name);

      expect(data.totalAmount).toBe(40000);
      expect(data.totalQuantity).toBe(2);
    });

    it('should increase quantity on the existing row when the same product is added again', async () => {
      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ productId: testProduct1.id, quantity: 1 });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');

      const { data } = response.body;
      expect(data.item.productId).toBe(testProduct1.id);
      expect(data.item.quantity).toBe(3); // 2 + 1
      expect(data.item.subtotal).toBe(60000); // 20000 * 3
      expect(data.totalAmount).toBe(60000);
      expect(data.totalQuantity).toBe(3);

      // Verify that there is only 1 row in database for User A and this product
      const count = await prisma.cartItem.count({
        where: { userId: userAId, productId: testProduct1.id },
      });
      expect(count).toBe(1);
    });

    it('should reject requests when cumulative quantity exceeds available stock', async () => {
      // Current quantity in cart is 3. Stock is 5. Adding 3 more would make 6 > 5.
      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ productId: testProduct1.id, quantity: 3 });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('exceeds available stock');

      // Cart item quantity should remain 3
      const item = await prisma.cartItem.findUnique({
        where: { userId_productId: { userId: userAId, productId: testProduct1.id } },
      });
      expect(item?.quantity).toBe(3);
    });

    it('should reject request when initial quantity exceeds available stock', async () => {
      // Test product 1 stock is 5. User B has 0 in cart. Requesting 10.
      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ productId: testProduct1.id, quantity: 10 });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('exceeds available stock');
    });

    it('should return 404 when product does not exist', async () => {
      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ productId: '00000000-0000-0000-0000-000000000000', quantity: 1 });

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Product not found');
    });

    it('should reject malformed productId with 400 validation error', async () => {
      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ productId: 'not-a-uuid', quantity: 1 });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Validation failed');
    });

    it('should reject non-positive or non-integer quantities', async () => {
      const resZero = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ productId: testProduct1.id, quantity: 0 });
      expect(resZero.status).toBe(400);

      const resNegative = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ productId: testProduct1.id, quantity: -2 });
      expect(resNegative.status).toBe(400);

      const resFloat = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ productId: testProduct1.id, quantity: 2.5 });
      expect(resFloat.status).toBe(400);
    });
  });

  describe('GET /api/cart (Populated Cart)', () => {
    it('should return populated cart items with product details and correct totals', async () => {
      // Add product 2 (₹500, qty: 2) to User A's cart
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ productId: testProduct2.id, quantity: 2 });

      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');

      const { items, totalAmount, totalQuantity } = response.body.data;
      expect(items).toHaveLength(2);

      // Product 1: 3 * 20000 = 60000
      // Product 2: 2 * 50000 = 100000
      // Total amount: 160000
      // Total quantity: 3 + 2 = 5
      expect(totalAmount).toBe(160000);
      expect(totalQuantity).toBe(5);

      const p1Item = items.find((i: any) => i.productId === testProduct1.id);
      expect(p1Item).toBeDefined();
      expect(p1Item.name).toBe(testProduct1.name);
      expect(p1Item.imageUrl).toBe('https://example.com/widget.jpg');
      expect(p1Item.price).toBe(20000);
      expect(p1Item.stockQuantity).toBe(5);
      expect(p1Item.quantity).toBe(3);
      expect(p1Item.subtotal).toBe(60000);

      const p2Item = items.find((i: any) => i.productId === testProduct2.id);
      expect(p2Item).toBeDefined();
      expect(p2Item.name).toBe(testProduct2.name);
      expect(p2Item.quantity).toBe(2);
      expect(p2Item.subtotal).toBe(100000);
    });
  });

  describe('PATCH /api/cart/items/:itemId (Update Quantity)', () => {
    let userAItemId: string;

    beforeAll(async () => {
      const item = await prisma.cartItem.findUnique({
        where: { userId_productId: { userId: userAId, productId: testProduct1.id } },
      });
      userAItemId = item!.id;
    });

    it('should update cart item quantity and recalculate subtotals and totals', async () => {
      // Change Product 1 quantity from 3 to 4 (within stock limit of 5)
      const response = await request(app)
        .patch(`/api/cart/items/${userAItemId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ quantity: 4 });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.item.quantity).toBe(4);
      expect(response.body.data.item.subtotal).toBe(80000); // 4 * 20000

      // Product 1: 4 * 20000 = 80000
      // Product 2: 2 * 50000 = 100000
      // Total: 180000
      expect(response.body.data.totalAmount).toBe(180000);
      expect(response.body.data.totalQuantity).toBe(6);
    });

    it('should reject update if new quantity exceeds product stock', async () => {
      // Stock is 5. Attempting to set quantity to 6.
      const response = await request(app)
        .patch(`/api/cart/items/${userAItemId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ quantity: 6 });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('exceeds available stock');

      // Database quantity must remain 4
      const item = await prisma.cartItem.findUnique({ where: { id: userAItemId } });
      expect(item?.quantity).toBe(4);
    });

    it('should reject update with zero or negative quantity', async () => {
      const resZero = await request(app)
        .patch(`/api/cart/items/${userAItemId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ quantity: 0 });
      expect(resZero.status).toBe(400);

      const resNeg = await request(app)
        .patch(`/api/cart/items/${userAItemId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ quantity: -1 });
      expect(resNeg.status).toBe(400);
    });

    it('should reject update of nonexistent cart item with 404', async () => {
      const response = await request(app)
        .patch('/api/cart/items/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ quantity: 2 });

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Cart item not found');
    });

    it('should prevent User B from updating User A’s cart item (isolation)', async () => {
      // User B attempts to modify User A's item
      const response = await request(app)
        .patch(`/api/cart/items/${userAItemId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ quantity: 1 });

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Cart item not found');

      // Verify User A's item in DB remains unmodified at 4
      const item = await prisma.cartItem.findUnique({ where: { id: userAItemId } });
      expect(item?.quantity).toBe(4);
    });
  });

  describe('DELETE /api/cart/items/:itemId (Remove Item)', () => {
    let userAItemToDelete: string;

    beforeAll(async () => {
      const item = await prisma.cartItem.findUnique({
        where: { userId_productId: { userId: userAId, productId: testProduct2.id } },
      });
      userAItemToDelete = item!.id;
    });

    it('should prevent User B from deleting User A’s cart item (isolation)', async () => {
      const response = await request(app)
        .delete(`/api/cart/items/${userAItemToDelete}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Cart item not found');

      // Verify item still exists
      const item = await prisma.cartItem.findUnique({ where: { id: userAItemToDelete } });
      expect(item).not.toBeNull();
    });

    it('should delete specified cart item belonging to authenticated user', async () => {
      const response = await request(app)
        .delete(`/api/cart/items/${userAItemToDelete}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toContain('removed');

      // Verify item was deleted from database
      const item = await prisma.cartItem.findUnique({ where: { id: userAItemToDelete } });
      expect(item).toBeNull();

      // Only Product 1 remains in User A's cart
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.totalQuantity).toBe(4);
    });

    it('should return 404 when deleting a nonexistent cart item', async () => {
      const response = await request(app)
        .delete('/api/cart/items/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
    });
  });

  describe('DELETE /api/cart (Clear Cart)', () => {
    beforeAll(async () => {
      // Put an item in User B's cart to verify User A clearing cart does not affect User B
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ productId: testProduct2.id, quantity: 2 });
    });

    it('should clear only authenticated user’s cart and not affect other users', async () => {
      // User A clears cart
      const response = await request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toContain('cleared');
      expect(response.body.data.items).toEqual([]);
      expect(response.body.data.totalAmount).toBe(0);
      expect(response.body.data.totalQuantity).toBe(0);

      // Verify User A's cart in DB is empty
      const userACount = await prisma.cartItem.count({ where: { userId: userAId } });
      expect(userACount).toBe(0);

      // Verify User B's cart in DB is still intact
      const userBCount = await prisma.cartItem.count({ where: { userId: userBId } });
      expect(userBCount).toBe(1);

      const userBItem = await prisma.cartItem.findFirst({ where: { userId: userBId } });
      expect(userBItem?.productId).toBe(testProduct2.id);
      expect(userBItem?.quantity).toBe(2);
    });
  });
});

