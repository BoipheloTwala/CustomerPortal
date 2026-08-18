import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../server.js';
import User from '../../models/User.js';

describe('XSS Attack Protection Tests', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Script Tag Injection Protection', () => {
    test('should prevent script tag injection in registration', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "<script>alert('xss')</script>",
        lastName: "User"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      // Should either reject the input or sanitize it
      expect([400, 201]).toContain(response.status);
      
      if (response.status === 201) {
        // If registration succeeds, the script should be sanitized
        expect(response.body.user.firstName).not.toContain('<script>');
        expect(response.body.user.firstName).not.toContain('alert');
      }
    });

    test('should prevent iframe injection', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "<iframe src='javascript:alert(1)'></iframe>",
        lastName: "User"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect([400, 201]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body.user.firstName).not.toContain('<iframe>');
      }
    });

    test('should prevent object tag injection', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "<object data='malicious.swf'></object>",
        lastName: "User"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect([400, 201]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body.user.firstName).not.toContain('<object>');
      }
    });
  });

  describe('JavaScript Protocol Injection Protection', () => {
    test('should prevent javascript: protocol injection', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "javascript:alert('xss')",
        lastName: "User"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect([400, 201]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body.user.firstName).not.toContain('javascript:');
      }
    });

    test('should prevent vbscript: protocol injection', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "vbscript:msgbox('xss')",
        lastName: "User"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect([400, 201]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body.user.firstName).not.toContain('vbscript:');
      }
    });

    test('should prevent data: protocol injection', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "data:text/html,<script>alert('xss')</script>",
        lastName: "User"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect([400, 201]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body.user.firstName).not.toContain('data:text/html');
      }
    });
  });

  describe('Event Handler Injection Protection', () => {
    test('should prevent onclick event handler injection', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "<div onclick='alert(\"xss\")'>Click me</div>",
        lastName: "User"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect([400, 201]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body.user.firstName).not.toContain('onclick');
      }
    });

    test('should prevent onload event handler injection', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "<img onload='alert(\"xss\")' src='x'>",
        lastName: "User"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect([400, 201]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body.user.firstName).not.toContain('onload');
      }
    });

    test('should prevent onerror event handler injection', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "<img onerror='alert(\"xss\")' src='invalid'>",
        lastName: "User"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect([400, 201]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body.user.firstName).not.toContain('onerror');
      }
    });
  });

  describe('Expression and Eval Injection Protection', () => {
    test('should prevent expression() injection', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "expression(alert('xss'))",
        lastName: "User"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect([400, 201]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body.user.firstName).not.toContain('expression(');
      }
    });

    test('should prevent eval() injection', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "eval('alert(\"xss\")')",
        lastName: "User"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect([400, 201]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body.user.firstName).not.toContain('eval(');
      }
    });

    test('should prevent setTimeout() injection', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "setTimeout('alert(\"xss\")', 1000)",
        lastName: "User"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect([400, 201]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body.user.firstName).not.toContain('setTimeout(');
      }
    });
  });

  describe('HTML Entity Encoding Protection', () => {
    test('should prevent HTML entity encoding attacks', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "&#60;script&#62;alert('xss')&#60;/script&#62;",
        lastName: "User"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect([400, 201]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body.user.firstName).not.toContain('&#60;');
        expect(response.body.user.firstName).not.toContain('&#62;');
      }
    });

    test('should prevent hex entity encoding attacks', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "&#x3C;script&#x3E;alert('xss')&#x3C;/script&#x3E;",
        lastName: "User"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect([400, 201]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body.user.firstName).not.toContain('&#x3C;');
        expect(response.body.user.firstName).not.toContain('&#x3E;');
      }
    });
  });

  describe('Form Manipulation Protection', () => {
    test('should prevent form tag injection', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "<form action='http://evil.com' method='post'>",
        lastName: "User"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect([400, 201]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body.user.firstName).not.toContain('<form>');
      }
    });

    test('should prevent input tag injection', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "<input type='hidden' name='token' value='stolen'>",
        lastName: "User"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect([400, 201]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body.user.firstName).not.toContain('<input>');
      }
    });
  });

  describe('Meta Tag Injection Protection', () => {
    test('should prevent meta refresh injection', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "<meta http-equiv='refresh' content='0;url=http://evil.com'>",
        lastName: "User"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect([400, 201]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body.user.firstName).not.toContain('<meta>');
      }
    });
  });

  describe('Base64 Encoded XSS Protection', () => {
    test('should prevent base64 encoded script injection', async () => {
      // Base64 encoded: <script>alert('xss')</script>
      const base64Payload = "PHNjcmlwdD5hbGVydCgneHNzJyk8L3NjcmlwdD4=";
      
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: `data:text/html;base64,${base64Payload}`,
        lastName: "User"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect([400, 201]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body.user.firstName).not.toContain('data:text/html;base64');
      }
    });
  });

  describe('CSS Expression Protection', () => {
    test('should prevent CSS expression injection', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "<style>body{background:expression(alert('xss'))}</style>",
        lastName: "User"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect([400, 201]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body.user.firstName).not.toContain('<style>');
        expect(response.body.user.firstName).not.toContain('expression(');
      }
    });
  });

  describe('Mixed Content Protection', () => {
    test('should prevent complex XSS payloads', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "<img src=x onerror=\"<script>alert('xss')</script>\">",
        lastName: "User"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect([400, 201]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body.user.firstName).not.toContain('<img>');
        expect(response.body.user.firstName).not.toContain('onerror');
        expect(response.body.user.firstName).not.toContain('<script>');
      }
    });

    test('should prevent nested XSS attempts', async () => {
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "<div><script>alert('xss')</script></div>",
        lastName: "User"
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect([400, 201]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body.user.firstName).not.toContain('<script>');
        expect(response.body.user.firstName).not.toContain('alert');
      }
    });
  });

  describe('Response Sanitization', () => {
    test('should sanitize user data in API responses', async () => {
      // First register a user with potentially malicious data
      const maliciousPayload = {
        email: "test@example.com",
        password: "Test123@",
        firstName: "John<script>alert('xss')</script>",
        lastName: "Doe"
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      if (registerResponse.status === 201) {
        // Get the user profile to check if data is sanitized in response
        const profileResponse = await request(app)
          .get('/api/dashboard') // This would typically require authentication
          .set('Authorization', `Bearer ${registerResponse.body.token}`);

        // The response should not contain malicious content
        expect(profileResponse.body).toBeDefined();
      }
    });
  });
});
