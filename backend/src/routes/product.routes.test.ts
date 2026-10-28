import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { prisma } from '../lib/prisma.js';

describe('Product Catalogue API (/api/products)', () => {
  const TEST_CATEGORY = `TestCat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const createdTestProductIds: string[] = [];

  let productAId: string;
  let productBId: string;
  let productCId: string;

  beforeAll(async () => {
    // Seed isolated test products for deterministic sorting/filtering assertions
    const p1 = await prisma.product.create({
      data: {
        name: 'Test Product Low Price',
        description: 'Test description low',
        category: TEST_CATEGORY,
        price: 10000, // ₹100.00
        stockQuantity: 10,
      },
    });
    createdTestProductIds.push(p1.id);
    productAId = p1.id;

    const p2 = await prisma.product.create({
      data: {
        name: 'Test Product Mid Price',
        description: 'Test description mid',
        category: TEST_CATEGORY,
        price: 25000, // ₹250.00
        stockQuantity: 20,
      },
    });
    createdTestProductIds.push(p2.id);
    productBId = p2.id;

    const p3 = await prisma.product.create({
      data: {
        name: 'Test Product High Price',
        description: 'Test description high',
        category: TEST_CATEGORY,
        price: 50000, // ₹500.00
        stockQuantity: 30,
      },
    });
    createdTestProductIds.push(p3.id);
    productCId = p3.id;
  });

  afterAll(async () => {
    // Non-destructive cleanup: delete only records created during this test suite
    if (createdTestProductIds.length > 0) {
      await prisma.product.deleteMany({
        where: { id: { in: createdTestProductIds } },
      });
    }
  });

  describe('GET /api/products (Listing)', () => {
    it('should list products successfully with default pagination and envelope', async () => {
      const response = await request(app).get('/api/products');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data.products)).toBe(true);
      expect(response.body.data.products.length).toBeGreaterThan(0);

      // Verify product structure
      const sample = response.body.data.products[0];
      expect(sample).toHaveProperty('id');
      expect(sample).toHaveProperty('name');
      expect(sample).toHaveProperty('category');
      expect(sample).toHaveProperty('price');
      expect(sample).toHaveProperty('stockQuantity');
      expect(sample).toHaveProperty('createdAt');
      expect(sample).toHaveProperty('updatedAt');

      // Verify pagination structure and defaults
      const { pagination } = response.body.data;
      expect(pagination.page).toBe(1);
      expect(pagination.limit).toBe(12);
      expect(pagination.totalProducts).toBeGreaterThanOrEqual(3);
      expect(pagination.totalPages).toBeGreaterThanOrEqual(1);
    });

    it('should filter products by exact category', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ category: TEST_CATEGORY });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.products).toHaveLength(3);
      expect(response.body.data.pagination.totalProducts).toBe(3);

      for (const product of response.body.data.products) {
        expect(product.category).toBe(TEST_CATEGORY);
      }
    });

    it('should filter products by minimum price (in rupees converted to paise)', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ category: TEST_CATEGORY, minPrice: 200 }); // ₹200 = 20000 paise

      expect(response.status).toBe(200);
      expect(response.body.data.products).toHaveLength(2);

      const prices = response.body.data.products.map((p: any) => p.price);
      expect(prices).toContain(25000);
      expect(prices).toContain(50000);
      expect(prices).not.toContain(10000);
    });

    it('should filter products by maximum price (in rupees converted to paise)', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ category: TEST_CATEGORY, maxPrice: 300 }); // ₹300 = 30000 paise

      expect(response.status).toBe(200);
      expect(response.body.data.products).toHaveLength(2);

      const prices = response.body.data.products.map((p: any) => p.price);
      expect(prices).toContain(10000);
      expect(prices).toContain(25000);
      expect(prices).not.toContain(50000);
    });

    it('should filter products by minPrice and maxPrice range', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ category: TEST_CATEGORY, minPrice: 150, maxPrice: 300 }); // ₹150 to ₹300

      expect(response.status).toBe(200);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].price).toBe(25000);
      expect(response.body.data.products[0].id).toBe(productBId);
    });

    it('should sort products by price ascending (price_asc)', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ category: TEST_CATEGORY, sort: 'price_asc' });

      expect(response.status).toBe(200);
      expect(response.body.data.products).toHaveLength(3);

      const prices = response.body.data.products.map((p: any) => p.price);
      expect(prices).toEqual([10000, 25000, 50000]);
    });

    it('should sort products by price descending (price_desc)', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ category: TEST_CATEGORY, sort: 'price_desc' });

      expect(response.status).toBe(200);
      expect(response.body.data.products).toHaveLength(3);

      const prices = response.body.data.products.map((p: any) => p.price);
      expect(prices).toEqual([50000, 25000, 10000]);
    });

    it('should sort products by newest and oldest', async () => {
      const newestRes = await request(app)
        .get('/api/products')
        .query({ category: TEST_CATEGORY, sort: 'newest' });

      expect(newestRes.status).toBe(200);
      expect(newestRes.body.data.products).toHaveLength(3);

      const oldestRes = await request(app)
        .get('/api/products')
        .query({ category: TEST_CATEGORY, sort: 'oldest' });

      expect(oldestRes.status).toBe(200);
      expect(oldestRes.body.data.products).toHaveLength(3);

      // Verify reverse order of timestamps or ids
      expect(newestRes.body.data.products[0].id).toBe(oldestRes.body.data.products[2].id);
      expect(newestRes.body.data.products[2].id).toBe(oldestRes.body.data.products[0].id);
    });

    it('should paginate results with page and limit parameters', async () => {
      const page1Res = await request(app)
        .get('/api/products')
        .query({ category: TEST_CATEGORY, sort: 'price_asc', page: 1, limit: 2 });

      expect(page1Res.status).toBe(200);
      expect(page1Res.body.data.products).toHaveLength(2);
      expect(page1Res.body.data.pagination).toEqual({
        page: 1,
        limit: 2,
        totalProducts: 3,
        total: 3,
        totalPages: 2,
      });
      expect(page1Res.body.data.products[0].id).toBe(productAId);
      expect(page1Res.body.data.products[1].id).toBe(productBId);

      const page2Res = await request(app)
        .get('/api/products')
        .query({ category: TEST_CATEGORY, sort: 'price_asc', page: 2, limit: 2 });

      expect(page2Res.status).toBe(200);
      expect(page2Res.body.data.products).toHaveLength(1);
      expect(page2Res.body.data.pagination).toEqual({
        page: 2,
        limit: 2,
        totalProducts: 3,
        total: 3,
        totalPages: 2,
      });
      expect(page2Res.body.data.products[0].id).toBe(productCId);
    });

    it('should reject invalid query parameters: page < 1', async () => {
      const res1 = await request(app).get('/api/products').query({ page: 0 });
      expect(res1.status).toBe(400);
      expect(res1.body.status).toBe('error');
      expect(res1.body.message).toBe('Validation failed');

      const res2 = await request(app).get('/api/products').query({ page: -1 });
      expect(res2.status).toBe(400);
    });

    it('should reject invalid query parameters: page is not a number', async () => {
      const res = await request(app).get('/api/products').query({ page: 'not-a-number' });
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Validation failed');
    });

    it('should reject invalid query parameters: limit > 50', async () => {
      const res = await request(app).get('/api/products').query({ limit: 51 });
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Validation failed');
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'limit',
            message: 'limit cannot exceed 50',
          }),
        ])
      );
    });

    it('should reject invalid query parameters: limit < 1', async () => {
      const res = await request(app).get('/api/products').query({ limit: 0 });
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Validation failed');
    });

    it('should reject invalid query parameters: invalid sort option', async () => {
      const res = await request(app).get('/api/products').query({ sort: 'unsupported_sort' });
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Validation failed');
    });

    it('should reject invalid query parameters: negative minPrice or maxPrice', async () => {
      const res = await request(app).get('/api/products').query({ minPrice: -10 });
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Validation failed');
    });

    it('should reject request when minPrice is greater than maxPrice', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ minPrice: 500, maxPrice: 100 });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'minPrice',
            message: 'minPrice cannot be greater than maxPrice',
          }),
        ])
      );
    });

    it('should return empty catalogue envelope when no products match filter', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ category: `NonExistentCategory_${Date.now()}` });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.products).toEqual([]);
      expect(response.body.data.pagination).toEqual({
        page: 1,
        limit: 12,
        totalProducts: 0,
        total: 0,
        totalPages: 0,
      });
    });
  });

  describe('GET /api/products/:id (Details)', () => {
    it('should retrieve a product by ID successfully with HTTP 200', async () => {
      const response = await request(app).get(`/api/products/${productAId}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('product');

      const { product } = response.body.data;
      expect(product.id).toBe(productAId);
      expect(product.name).toBe('Test Product Low Price');
      expect(product.category).toBe(TEST_CATEGORY);
      expect(product.price).toBe(10000);
      expect(product.stockQuantity).toBe(10);
      expect(product.createdAt).toBeDefined();
    });

    it('should return HTTP 404 with centralized JSON error structure for nonexistent product ID', async () => {
      const nonexistentId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app).get(`/api/products/${nonexistentId}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Product not found',
      });
    });

    it('should return HTTP 400 for a malformed product ID', async () => {
      const response = await request(app).get('/api/products/not-a-valid-uuid');

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'id',
            message: 'Product ID must be a valid UUID',
          }),
        ])
      );
    });
  });
});

