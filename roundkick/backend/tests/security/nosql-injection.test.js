import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../server.js';
import User from '../../models/User.js';

describe('NoSQL Injection Protection Tests', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('MongoDB Operator Injection Protection', () => {
    test('should prevent $where operator injection in registration', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "Test",
        lastName: { $where: "function() { return true; }" }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should prevent $regex operator injection', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: { $regex: ".*" },
        lastName: "Test"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should prevent $ne operator injection in login', async () => {
      const maliciousPayload = {
        email: { $ne: null },
        password: { $ne: null }
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(maliciousPayload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should prevent $gt operator injection', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: { $gt: "" },
        firstName: "Test",
        lastName: "User"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should prevent $or operator injection', async () => {
      const maliciousPayload = {
        email: { $or: [{ email: "admin@example.com" }, { role: "admin" }] },
        password: "Test123@",
        firstName: "Test",
        lastName: "User"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('JavaScript Function Injection Protection', () => {
    test('should prevent function() injection', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "function() { return true; }",
        lastName: "Test"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should prevent eval() injection', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "eval('malicious code')",
        lastName: "Test"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should prevent setTimeout injection', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "setTimeout(function(){}, 1000)",
        lastName: "Test"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should prevent constructor injection', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "constructor",
        lastName: "Test"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Regex Injection Protection', () => {
    test('should prevent regex anchor injection', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "^admin",
        lastName: "Test"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should prevent wildcard regex injection', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: ".*",
        lastName: "Test"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should prevent character class injection', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "[a-zA-Z]",
        lastName: "Test"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should prevent quantifier injection', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "a{1,10}",
        lastName: "Test"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Null Byte Injection Protection', () => {
    test('should prevent null byte injection in email', async () => {
      const maliciousPayload = {
        email: "test@example.com\0",
        password: "Test123@",
        firstName: "Test",
        lastName: "User"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should prevent null byte injection in names', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "Test\0",
        lastName: "User\0"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Unicode Injection Protection', () => {
    test('should prevent unicode null injection', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "Test\u0000",
        lastName: "User"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should prevent unicode newline injection', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "Test\u000A",
        lastName: "User"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Array Injection Protection', () => {
    test('should prevent array injection in email field', async () => {
      const maliciousPayload = {
        email: ["admin@example.com", "test@example.com"],
        password: "Test123@",
        firstName: "Test",
        lastName: "User"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should prevent array injection in password field', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: ["Test123@", "Admin123!"],
        firstName: "Test",
        lastName: "User"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Nested Object Injection Protection', () => {
    test('should prevent nested dangerous operators', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "Test",
        lastName: "User",
        metadata: {
          $where: "function() { return true; }",
          $regex: ".*"
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should prevent deeply nested injection attempts', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "Test",
        lastName: "User",
        nested: {
          level1: {
            level2: {
              $where: "function() { return true; }"
            }
          }
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Query Parameter Injection Protection', () => {
    test('should prevent MongoDB operator injection in query params', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .query({
          search: { $ne: null },
          filter: { $where: "function() { return true; }" }
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should prevent regex injection in query params', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .query({
          search: ".*",
          filter: "^admin"
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Content Type Injection Protection', () => {
    test('should prevent content-type manipulation', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "Test",
        lastName: "User",
        contentType: "application/json; $where: function() { return true; }"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send(maliciousPayload);

      // Should either succeed with sanitized data or fail gracefully
      expect([200, 201, 400]).toContain(response.status);
    });
  });

  describe('Buffer Overflow Protection', () => {
    test('should prevent extremely large payloads', async () => {
      const largeString = "A".repeat(100000);
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: largeString,
        lastName: "User"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should prevent deeply nested objects', async () => {
      let nestedObject = {};
      let current = nestedObject;
      
      // Create a very deeply nested object
      for (let i = 0; i < 1000; i++) {
        current.level = {};
        current = current.level;
      }
      
      current.value = "test";

      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "Test",
        lastName: "User",
        nested: nestedObject
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });
});
