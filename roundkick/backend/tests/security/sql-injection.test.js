import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../server.js';
import User from '../../models/User.js';

describe('SQL Injection Protection Tests', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Registration Endpoint Protection', () => {
    test('should prevent SQL injection in email field during registration', async () => {
      const maliciousPayload = {
        email: "'; DROP TABLE users; --",
        password: "Test123@",
        firstName: "Test",
        lastName: "User"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      // Should reject the malicious input
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should prevent NoSQL injection in email field', async () => {
      const nosqlPayload = {
        email: { $ne: null },
        password: "Test123@",
        firstName: "Test",
        lastName: "User"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(nosqlPayload);

      // Should reject the malicious input
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should prevent SQL injection in name fields', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "'; DROP TABLE users; --",
        lastName: "Test"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      // Should reject the malicious input
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should prevent JavaScript injection in fields', async () => {
      const jsPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "<script>alert('xss')</script>",
        lastName: "Test"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(jsPayload);

      // Should reject the malicious input
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Login Endpoint Protection', () => {
    beforeEach(async () => {
      // Create a test user
      await User.create({
        email: 'test@example.com',
        password: 'Test123@',
        firstName: 'Test',
        lastName: 'User'
      });
    });

    test('should prevent SQL injection in login email', async () => {
      const maliciousPayload = {
        email: "'; DROP TABLE users; --",
        password: "Test123@"
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(maliciousPayload);

      // Should reject the malicious input
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should prevent NoSQL injection in login', async () => {
      const nosqlPayload = {
        email: { $ne: null },
        password: { $ne: null }
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(nosqlPayload);

      // Should reject the malicious input
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Query Parameter Protection', () => {
    test('should sanitize query parameters', async () => {
      const maliciousQuery = "'; DROP TABLE users; --";
      
      const response = await request(app)
        .get(`/api/dashboard?search=${encodeURIComponent(maliciousQuery)}`);

      // Should handle the malicious query safely
      expect(response.status).toBe(200);
    });
  });

  describe('MongoDB Injection Protection', () => {
    test('should prevent MongoDB operator injection in registration', async () => {
      const mongoPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "Test",
        lastName: { $where: "function() { return true; }" }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(mongoPayload);

      // Should reject the malicious input
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should prevent regex injection attacks', async () => {
      const regexPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: ".*",
        lastName: "Test"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(regexPayload);

      // Should reject the malicious input
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Input Length and Type Validation', () => {
    test('should prevent buffer overflow attacks', async () => {
      const bufferPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "A".repeat(10000), // Extremely long string
        lastName: "Test"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(bufferPayload);

      // Should reject the oversized input
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should prevent type confusion attacks', async () => {
      const typePayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: 12345, // Wrong type
        lastName: "Test"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(typePayload);

      // Should reject the wrong type
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Special Character Handling', () => {
    test('should handle null bytes safely', async () => {
      const nullBytePayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "Test\0",
        lastName: "User"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(nullBytePayload);

      // Should reject or sanitize null bytes
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should handle unicode injection attempts', async () => {
      const unicodePayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "Test\u0000",
        lastName: "User"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(unicodePayload);

      // Should reject or sanitize unicode injection
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });
});
