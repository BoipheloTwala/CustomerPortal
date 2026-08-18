import {
  checkPasswordStrength,
  isValidEmail,
  sanitizePhoneNumber,
  sanitizeInput
} from '../../utils/validation.js';

test('checkPasswordStrength - should return valid for strong password', () => {
  const result = checkPasswordStrength('StrongPass123!');
  expect(result.isValid).toBe(true);
  expect(result.errors).toHaveLength(0);
});

test('checkPasswordStrength - should return invalid for weak password', () => {
  const result = checkPasswordStrength('weak');
  expect(result.isValid).toBe(false);
  expect(result.errors).toContain('Password must be at least 8 characters long');
  expect(result.errors).toContain('Password must contain at least one uppercase letter');
  expect(result.errors).toContain('Password must contain at least one number');
  expect(result.errors).toContain('Password must contain at least one special character');
});

test('checkPasswordStrength - should validate individual password requirements', () => {
  expect(checkPasswordStrength('nouppercase123!').errors).toContain('Password must contain at least one uppercase letter');
  expect(checkPasswordStrength('NOLOWERCASE123!').errors).toContain('Password must contain at least one lowercase letter');
  expect(checkPasswordStrength('NoNumber!').errors).toContain('Password must contain at least one number');
  expect(checkPasswordStrength('NoSpecial123').errors).toContain('Password must contain at least one special character');
});

test('isValidEmail - should validate correct email formats', () => {
  expect(isValidEmail('test@example.com')).toBe(true);
  expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true);
  expect(isValidEmail('test.email@subdomain.example.com')).toBe(true);
});

test('isValidEmail - should reject invalid email formats', () => {
  expect(isValidEmail('invalid-email')).toBe(false);
  expect(isValidEmail('@example.com')).toBe(false);
  expect(isValidEmail('test@')).toBe(false);
  expect(isValidEmail('test..email@example.com')).toBe(false);
});

test('sanitizePhoneNumber - should sanitize phone numbers correctly', () => {
  expect(sanitizePhoneNumber('+1 (234) 567-8900')).toBe('+12345678900');
  expect(sanitizePhoneNumber('(234) 567-8900')).toBe('2345678900');
  expect(sanitizePhoneNumber('234-567-8900')).toBe('2345678900');
});

test('sanitizePhoneNumber - should return null for null/undefined input', () => {
  expect(sanitizePhoneNumber(null)).toBe(null);
  expect(sanitizePhoneNumber(undefined)).toBe(null);
});

test('sanitizeInput - should remove script tags', () => {
  const malicious = '<script>alert("xss")</script>Hello World';
  expect(sanitizeInput(malicious)).toBe('Hello World');
});

test('sanitizeInput - should remove HTML tags', () => {
  const html = '<p>Hello <strong>World</strong></p>';
  expect(sanitizeInput(html)).toBe('Hello World');
});

test('sanitizeInput - should remove javascript protocols', () => {
  const js = 'javascript:alert("xss")';
  expect(sanitizeInput(js)).toBe('');
});

test('sanitizeInput - should remove event handlers', () => {
  const event = '<img src="x" onerror="alert(1)">';
  expect(sanitizeInput(event)).toBe('');
});

test('sanitizeInput - should trim whitespace', () => {
  expect(sanitizeInput('  hello world  ')).toBe('hello world');
});
