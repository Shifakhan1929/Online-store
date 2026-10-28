import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { prisma } from '../lib/prisma.js';
import { generateToken, getJwtSecret } from '../utils/jwt.js';
import jwt from 'jsonwebtoken';

describe('Authentication API (/api/auth)', () => {
  const testUserIds: string[] = [];

  const createUniqueEmail = () => {
    return `auth_test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}@authtest.com`;
  };

  afterAll(async () => {
    // Clean up only records created during this test suite
    if (testUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: testUserIds } },
      });
    }
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully with HTTP 201 and return safe details and token', async () => {
      const email = createUniqueEmail();
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: `  ${email.toUpperCase()}  `, // Test normalization
          password: 'Password123!',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');
      expect(response.body).toHaveProperty('user');

      const { user } = response.body;
      testUserIds.push(user.id);

      expect(user.id).toBeDefined();
      expect(user.name).toBe('Jane Doe');
      expect(user.email).toBe(email.toLowerCase());
      expect(user.role).toBe('CUSTOMER');
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();

      // Ensure passwordHash is NEVER exposed
      expect(user.passwordHash).toBeUndefined();
      expect(response.text).not.toContain('passwordHash');
    });

    it('should reject registration when password is shorter than 8 characters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Short Pass',
          email: createUniqueEmail(),
          password: 'short',
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'password',
            message: 'Password must be at least 8 characters long',
          }),
        ])
      );
    });

    it('should reject registration with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Invalid Email',
          email: 'not-an-email',
          password: 'ValidPassword123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: 'Please provide a valid email address',
          }),
        ])
      );
    });

    it('should prevent assigning the ADMIN role via public registration', async () => {
      const email = createUniqueEmail();
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Privilege Escalation Attempt',
          email,
          password: 'SecurePassword123!',
          role: 'ADMIN', // Client attempting to assign ADMIN
        });

      expect(response.status).toBe(201);
      const { user } = response.body;
      testUserIds.push(user.id);

      // Must remain CUSTOMER
      expect(user.role).toBe('CUSTOMER');

      // Verify in DB directly
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      expect(dbUser?.role).toBe('CUSTOMER');
    });

    it('should reject duplicate email addresses with HTTP 409 Conflict', async () => {
      const email = createUniqueEmail();

      // First registration
      const firstRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Original User',
          email,
          password: 'Password123!',
        });
      expect(firstRes.status).toBe(201);
      testUserIds.push(firstRes.body.user.id);

      // Duplicate registration attempt (with casing and whitespace variance)
      const duplicateRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Imposter User',
          email: `  ${email.toUpperCase()}  `,
          password: 'DifferentPassword123!',
        });

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.status).toBe('error');
      expect(duplicateRes.body.message).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    const userCredentials = {
      name: 'Login Tester',
      email: createUniqueEmail(),
      password: 'CorrectPassword123!',
    };

    it('should login successfully with valid credentials and return token and safe user details', async () => {
      // Register user first
      const regRes = await request(app)
        .post('/api/auth/register')
        .send(userCredentials);
      expect(regRes.status).toBe(201);
      testUserIds.push(regRes.body.user.id);

      // Login with normalized casing
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: `  ${userCredentials.email.toUpperCase()}  `,
          password: userCredentials.password,
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body).toHaveProperty('token');
      expect(loginRes.body.user).toBeDefined();
      expect(loginRes.body.user.id).toBe(regRes.body.user.id);
      expect(loginRes.body.user.email).toBe(userCredentials.email.toLowerCase());
      expect(loginRes.body.user.passwordHash).toBeUndefined();
    });

    it('should return HTTP 401 with a generic error message for incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userCredentials.email,
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should return HTTP 401 with the same generic error message for nonexistent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent_account_12345@authtest.com',
          password: 'AnyPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Invalid email or password');
    });
  });

  describe('GET /api/auth/me & Authentication Middleware', () => {
    let validToken: string;
    let registeredUser: any;

    it('should return HTTP 200 and safe user profile for a valid token', async () => {
      const regRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Me Profile User',
          email: createUniqueEmail(),
          password: 'Password123!',
        });
      expect(regRes.status).toBe(201);
      registeredUser = regRes.body.user;
      validToken = regRes.body.token;
      testUserIds.push(registeredUser.id);

      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body).toHaveProperty('user');
      expect(meRes.body.user.id).toBe(registeredUser.id);
      expect(meRes.body.user.name).toBe('Me Profile User');
      expect(meRes.body.user.email).toBe(registeredUser.email);
      expect(meRes.body.user.role).toBe('CUSTOMER');
      expect(meRes.body.user.createdAt).toBeDefined();
      expect(meRes.body.user.passwordHash).toBeUndefined();
    });

    it('should reject request when Authorization header is missing', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('token is required');
    });

    it('should reject request with malformed or invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.payload');

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Invalid token');
    });

    it('should reject request with non-Bearer authorization format', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Basic ${validToken}`);

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });

    it('should reject request when token has expired', async () => {
      const secret = getJwtSecret();
      // Generate an already expired token (expired 5 minutes ago)
      const expiredToken = jwt.sign(
        { userId: registeredUser.id, role: registeredUser.role },
        secret,
        { expiresIn: '-5m' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Token has expired');
    });
  });
});
