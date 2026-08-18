import {
  validateSecureEmail,
  validateSecurePassword,
  validateSecureName,
  validateSecurePhone,
  generateSecureToken,
  hashForLogging,
  isValidObjectId,
  sanitizeInput,
  RateLimiter
} from '../../utils/security-helpers.js';

describe('Security Helpers Tests', () => {
  describe('validateSecureEmail', () => {
    test('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'test+tag@example.org'
      ];

      validEmails.forEach(email => {
        const result = validateSecureEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.email).toBe(email.toLowerCase());
      });
    });

    test('should reject emails with SQL injection attempts', () => {
      const maliciousEmails = [
        "'; DROP TABLE users; --@example.com",
        "test@example.com' OR '1'='1",
        "test@example.com AND 1=1",
        "test@example.com UNION SELECT * FROM users"
      ];

      maliciousEmails.forEach(email => {
        const result = validateSecureEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('suspicious content');
      });
    });

    test('should reject emails with XSS attempts', () => {
      const xssEmails = [
        '<script>alert("xss")</script>@example.com',
        'test@example.com<script>',
        'test@example.com"onclick="alert(1)"'
      ];

      xssEmails.forEach(email => {
        const result = validateSecureEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('suspicious content');
      });
    });

    test('should reject emails with MongoDB injection attempts', () => {
      const nosqlEmails = [
        'test@example.com$where',
        'test@example.com$regex',
        'test@example.com$ne'
      ];

      nosqlEmails.forEach(email => {
        const result = validateSecureEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('suspicious content');
      });
    });

    test('should reject emails that are too long', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const result = validateSecureEmail(longEmail);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email too long');
    });

    test('should reject invalid email formats', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'test@',
        'test..test@example.com'
      ];

      invalidEmails.forEach(email => {
        const result = validateSecureEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Invalid email format');
      });
    });
  });

  describe('validateSecurePassword', () => {
    test('should validate strong passwords', () => {
      const strongPasswords = [
        'Test123@',
        'MySecure1!',
        'ComplexP@ssw0rd',
        'Str0ng!Pass'
      ];

      strongPasswords.forEach(password => {
        const result = validateSecurePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.password).toBe(password);
      });
    });

    test('should reject passwords without required complexity', () => {
      const weakPasswords = [
        'password',      // No uppercase, number, special char
        'PASSWORD',      // No lowercase, number, special char
        'Password',      // No number, special char
        'Password123',   // No special char
        'Pass123',       // Too short
        'P@ss'          // Too short
      ];

      weakPasswords.forEach(password => {
        const result = validateSecurePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    test('should reject common weak patterns', () => {
      const weakPatterns = [
        'Password123@',
        'Admin123!',
        'Test123@',
        'Qwerty123@',
        'Abc123!@'
      ];

      weakPatterns.forEach(password => {
        const result = validateSecurePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('weak patterns');
      });
    });

    test('should reject sequential characters', () => {
      const sequentialPasswords = [
        'Abc123!@',
        'Test123@',
        'Qwerty123@',
        'Asdf123!@'
      ];

      sequentialPasswords.forEach(password => {
        const result = validateSecurePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('sequential characters');
      });
    });

    test('should reject passwords that are too long', () => {
      const longPassword = 'A'.repeat(130) + '1!';
      const result = validateSecurePassword(longPassword);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password must be 8-128 characters long');
    });
  });

  describe('validateSecureName', () => {
    test('should validate correct names', () => {
      const validNames = [
        'John',
        'Mary-Jane',
        "O'Connor",
        'Jean-Luc',
        'Mary Jane',
        'José',
        'François'
      ];

      validNames.forEach(name => {
        const result = validateSecureName(name);
        expect(result.isValid).toBe(true);
        expect(result.name).toBe(name.trim());
      });
    });

    test('should reject names with suspicious content', () => {
      const suspiciousNames = [
        '<script>alert("xss")</script>',
        "John'; DROP TABLE users; --",
        'Mary<script>',
        'Test$where',
        'Name$regex',
        'User"OR"1"="1'
      ];

      suspiciousNames.forEach(name => {
        const result = validateSecureName(name);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('suspicious content');
      });
    });

    test('should reject names with invalid characters', () => {
      const invalidNames = [
        'John123',
        'Mary@Jane',
        'Test#Name',
        'User$Name',
        'Name%Test'
      ];

      invalidNames.forEach(name => {
        const result = validateSecureName(name);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('letters, spaces, hyphens, and apostrophes');
      });
    });

    test('should reject names that are too short or long', () => {
      const invalidLengthNames = [
        'A',           // Too short
        'A'.repeat(51) // Too long
      ];

      invalidLengthNames.forEach(name => {
        const result = validateSecureName(name);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('2-50 characters');
      });
    });
  });

  describe('validateSecurePhone', () => {
    test('should validate correct phone numbers', () => {
      const validPhones = [
        '+1234567890',
        '1234567890',
        '+44 20 7946 0958',
        '(555) 123-4567',
        '+1-555-123-4567'
      ];

      validPhones.forEach(phone => {
        const result = validateSecurePhone(phone);
        expect(result.isValid).toBe(true);
      });
    });

    test('should reject phone numbers with suspicious content', () => {
      const suspiciousPhones = [
        '<script>alert("xss")</script>',
        "1234567890'; DROP TABLE users; --",
        '1234567890$where',
        '1234567890<script>'
      ];

      suspiciousPhones.forEach(phone => {
        const result = validateSecurePhone(phone);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('suspicious content');
      });
    });

    test('should reject invalid phone formats', () => {
      const invalidPhones = [
        '123',         // Too short
        '12345678901234567', // Too long
        'abcdefghij',  // Non-numeric
        '0123456789'   // Starts with 0
      ];

      invalidPhones.forEach(phone => {
        const result = validateSecurePhone(phone);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('format');
      });
    });

    test('should accept null or empty phone numbers', () => {
      const result = validateSecurePhone(null);
      expect(result.isValid).toBe(true);
      expect(result.phone).toBe(null);
    });
  });

  describe('generateSecureToken', () => {
    test('should generate tokens of correct length', () => {
      const token = generateSecureToken(32);
      expect(token).toHaveLength(64); // 32 bytes = 64 hex characters
    });

    test('should generate different tokens each time', () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();
      expect(token1).not.toBe(token2);
    });

    test('should generate tokens with only hex characters', () => {
      const token = generateSecureToken(16);
      expect(token).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe('hashForLogging', () => {
    test('should hash data consistently', () => {
      const data = 'test@example.com';
      const hash1 = hashForLogging(data);
      const hash2 = hashForLogging(data);
      expect(hash1).toBe(hash2);
    });

    test('should hash different data differently', () => {
      const hash1 = hashForLogging('test1@example.com');
      const hash2 = hashForLogging('test2@example.com');
      expect(hash1).not.toBe(hash2);
    });

    test('should handle null/undefined data', () => {
      expect(hashForLogging(null)).toBe('null');
      expect(hashForLogging(undefined)).toBe('null');
    });

    test('should return 8 character hash', () => {
      const hash = hashForLogging('test@example.com');
      expect(hash).toHaveLength(8);
    });
  });

  describe('isValidObjectId', () => {
    test('should validate correct MongoDB ObjectIds', () => {
      const validIds = [
        '507f1f77bcf86cd799439011',
        '507f191e810c19729de860ea',
        '000000000000000000000000'
      ];

      validIds.forEach(id => {
        expect(isValidObjectId(id)).toBe(true);
      });
    });

    test('should reject invalid ObjectIds', () => {
      const invalidIds = [
        'not-an-object-id',
        '507f1f77bcf86cd79943901', // Too short
        '507f1f77bcf86cd799439011g', // Invalid character
        '',
        null,
        undefined
      ];

      invalidIds.forEach(id => {
        expect(isValidObjectId(id)).toBe(false);
      });
    });
  });

  describe('sanitizeInput', () => {
    test('should sanitize XSS attempts', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello';
      const sanitized = sanitizeInput(maliciousInput);
      expect(sanitized).toBe('Hello');
    });

    test('should remove HTML tags', () => {
      const htmlInput = '<div><p>Hello</p></div>';
      const sanitized = sanitizeInput(htmlInput);
      expect(sanitized).toBe('Hello');
    });

    test('should remove JavaScript protocols', () => {
      const jsInput = 'javascript:alert("xss")';
      const sanitized = sanitizeInput(jsInput);
      expect(sanitized).toBe('');
    });

    test('should sanitize nested objects', () => {
      const maliciousObject = {
        name: '<script>alert("xss")</script>John',
        email: 'test@example.com',
        details: {
          bio: '<script>alert("xss")</script>Bio'
        }
      };

      const sanitized = sanitizeInput(maliciousObject);
      expect(sanitized.name).toBe('John');
      expect(sanitized.email).toBe('test@example.com');
      expect(sanitized.details.bio).toBe('Bio');
    });

    test('should handle arrays', () => {
      const maliciousArray = ['<script>alert("xss")</script>Test', 'Normal'];
      const sanitized = sanitizeInput(maliciousArray);
      expect(sanitized).toEqual(['Test', 'Normal']);
    });
  });

  describe('RateLimiter', () => {
    let rateLimiter;

    beforeEach(() => {
      rateLimiter = new RateLimiter(5, 1000); // 5 requests per second
    });

    test('should allow requests within limit', () => {
      const identifier = 'test-user';
      
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.isAllowed(identifier)).toBe(true);
      }
    });

    test('should block requests exceeding limit', () => {
      const identifier = 'test-user';
      
      // Make 5 requests (should all be allowed)
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.isAllowed(identifier)).toBe(true);
      }
      
      // 6th request should be blocked
      expect(rateLimiter.isAllowed(identifier)).toBe(false);
    });

    test('should track remaining requests correctly', () => {
      const identifier = 'test-user';
      
      expect(rateLimiter.getRemainingRequests(identifier)).toBe(5);
      
      rateLimiter.isAllowed(identifier);
      expect(rateLimiter.getRemainingRequests(identifier)).toBe(4);
      
      rateLimiter.isAllowed(identifier);
      expect(rateLimiter.getRemainingRequests(identifier)).toBe(3);
    });

    test('should handle different identifiers separately', () => {
      const user1 = 'user1';
      const user2 = 'user2';
      
      // User 1 makes 5 requests
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.isAllowed(user1)).toBe(true);
      }
      
      // User 1 should be blocked
      expect(rateLimiter.isAllowed(user1)).toBe(false);
      
      // User 2 should still be allowed
      expect(rateLimiter.isAllowed(user2)).toBe(true);
    });
  });
});
