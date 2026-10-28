import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { z } from 'zod';
import app from './app.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import { validateBody } from './middlewares/validate.js';
import { BadRequestError, NotFoundError } from './utils/errors.js';
import { asyncHandler } from './utils/asyncHandler.js';

describe('Application Core & Health Endpoint', () => {
  it('GET /api/health should return 200 OK with server status', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      message: 'Server is running',
      timestamp: expect.any(String),
    });
  });

  it('GET /api/unknown-route should return JSON 404 for nonexistent API route', async () => {
    const response = await request(app).get('/api/unknown-route');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      status: 'error',
      message: 'Route not found: GET /api/unknown-route',
    });
  });

  it('GET /completely-random-path should return JSON 404', async () => {
    const response = await request(app).get('/completely-random-path');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      status: 'error',
      message: 'Route not found: GET /completely-random-path',
    });
  });
});

describe('Centralized Error Handling Middleware', () => {
  const createTestApp = () => {
    const testApp = express();
    testApp.use(express.json());

    // Route testing Zod validation
    const testSchema = z.object({
      email: z.string().email('Invalid email address'),
      age: z.number().min(18, 'Must be at least 18'),
    });

    testApp.post(
      '/test-validation',
      validateBody(testSchema),
      (_req, res) => {
        res.json({ success: true });
      }
    );

    // Route testing custom AppError
    testApp.get('/test-bad-request', () => {
      throw new BadRequestError('Custom bad request message', [
        { field: 'coupon', message: 'Coupon expired' },
      ]);
    });

    // Route testing async error handling
    testApp.get(
      '/test-async-error',
      asyncHandler(async () => {
        throw new NotFoundError('Item not found');
      })
    );

    // Route testing unexpected error
    testApp.get('/test-server-error', () => {
      throw new Error('Database connection failed unexpectedly');
    });

    testApp.use(notFoundHandler);
    testApp.use(errorHandler);

    return testApp;
  };

  const testApp = createTestApp();

  it('should format Zod validation errors with HTTP 400 and field-level messages', async () => {
    const response = await request(testApp)
      .post('/test-validation')
      .send({ email: 'not-an-email', age: 12 });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      status: 'error',
      message: 'Validation failed',
      errors: [
        { field: 'email', message: 'Invalid email address' },
        { field: 'age', message: 'Must be at least 18' },
      ],
    });
  });

  it('should format AppError with correct HTTP status and custom errors array', async () => {
    const response = await request(testApp).get('/test-bad-request');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      status: 'error',
      message: 'Custom bad request message',
      errors: [{ field: 'coupon', message: 'Coupon expired' }],
    });
  });

  it('should catch async route errors and format appropriately', async () => {
    const response = await request(testApp).get('/test-async-error');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      status: 'error',
      message: 'Item not found',
    });
  });

  it('should mask unexpected errors with HTTP 500 without leaking stack traces or internal details', async () => {
    const response = await request(testApp).get('/test-server-error');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: 'error',
      message: 'Internal server error',
    });
    expect(response.body.stack).toBeUndefined();
    expect(response.text).not.toContain('Database connection failed unexpectedly');
  });
});
