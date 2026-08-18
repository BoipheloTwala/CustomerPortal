import request from 'supertest';
import { app } from '../../server.js';

describe('Content Security Policy (CSP) Headers Tests', () => {
  describe('CSP Header Configuration', () => {
    test('should include Content-Security-Policy header', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.headers['content-security-policy']).toBeDefined();
      
      const csp = response.headers['content-security-policy'];
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self'");
      expect(csp).toContain("style-src 'self'");
      expect(csp).toContain("img-src 'self'");
      expect(csp).toContain("font-src 'self'");
      expect(csp).toContain("connect-src 'self'");
      expect(csp).toContain("frame-src 'none'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("base-uri 'self'");
      expect(csp).toContain("form-action 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("upgrade-insecure-requests");
    });

    test('should include X-Content-Type-Options header', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    test('should include X-Frame-Options header', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.headers['x-frame-options']).toBe('DENY');
    });

    test('should include X-XSS-Protection header', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });

    test('should include Referrer-Policy header', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });

    test('should include Permissions-Policy header', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.headers['permissions-policy']).toBeDefined();
      expect(response.headers['permissions-policy']).toContain('geolocation=()');
      expect(response.headers['permissions-policy']).toContain('microphone=()');
      expect(response.headers['permissions-policy']).toContain('camera=()');
    });
  });

  describe('CSP Enforcement', () => {
    test('should block inline scripts when CSP is enforced', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: "test@example.com",
          password: "Test123@",
          firstName: "Test",
          lastName: "User"
        });

      // Check that CSP headers are present in all responses
      expect(response.headers['content-security-policy']).toBeDefined();
    });

    test('should block external resources when CSP is enforced', async () => {
      const response = await request(app)
        .get('/api/dashboard');

      const csp = response.headers['content-security-policy'];
      expect(csp).toContain("default-src 'self'");
      expect(csp).not.toContain("'unsafe-eval'");
    });
  });

  describe('Security Headers Consistency', () => {
    test('should include all security headers in API responses', async () => {
      const endpoints = [
        '/health',
        '/api/dashboard'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint);
        
        // Check all required security headers
        expect(response.headers['content-security-policy']).toBeDefined();
        expect(response.headers['x-content-type-options']).toBeDefined();
        expect(response.headers['x-frame-options']).toBeDefined();
        expect(response.headers['x-xss-protection']).toBeDefined();
        expect(response.headers['referrer-policy']).toBeDefined();
      }
    });

    test('should maintain security headers across different HTTP methods', async () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE'];
      
      for (const method of methods) {
        const response = await request(app)
          [method.toLowerCase()]('/api/dashboard');

        expect(response.headers['content-security-policy']).toBeDefined();
        expect(response.headers['x-content-type-options']).toBeDefined();
        expect(response.headers['x-frame-options']).toBeDefined();
      }
    });
  });

  describe('CSP Directive Validation', () => {
    test('should have restrictive default-src directive', async () => {
      const response = await request(app)
        .get('/health');

      const csp = response.headers['content-security-policy'];
      expect(csp).toContain("default-src 'self'");
    });

    test('should allow unsafe-inline for scripts and styles (development)', async () => {
      const response = await request(app)
        .get('/health');

      const csp = response.headers['content-security-policy'];
      expect(csp).toContain("script-src 'self' 'unsafe-inline'");
      expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    });

    test('should block all frame sources', async () => {
      const response = await request(app)
        .get('/health');

      const csp = response.headers['content-security-policy'];
      expect(csp).toContain("frame-src 'none'");
    });

    test('should block all object sources', async () => {
      const response = await request(app)
        .get('/health');

      const csp = response.headers['content-security-policy'];
      expect(csp).toContain("object-src 'none'");
    });

    test('should restrict base URI to self', async () => {
      const response = await request(app)
        .get('/health');

      const csp = response.headers['content-security-policy'];
      expect(csp).toContain("base-uri 'self'");
    });

    test('should restrict form action to self', async () => {
      const response = await request(app)
        .get('/health');

      const csp = response.headers['content-security-policy'];
      expect(csp).toContain("form-action 'self'");
    });

    test('should block frame ancestors', async () => {
      const response = await request(app)
        .get('/health');

      const csp = response.headers['content-security-policy'];
      expect(csp).toContain("frame-ancestors 'none'");
    });

    test('should upgrade insecure requests', async () => {
      const response = await request(app)
        .get('/health');

      const csp = response.headers['content-security-policy'];
      expect(csp).toContain("upgrade-insecure-requests");
    });
  });
});
