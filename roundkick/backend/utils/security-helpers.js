//CODE ATTRIBUTION
//01
//OWASP Authentication Password Requirements
//Adapted from: OWASP. (2025). Authentication Cheat Sheet. [online] OWASP Cheat Sheet Series.
//Available at: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//02
//Node.js Crypto Module for Secure Token Generation
//Adapted from: Node.js Foundation. (2025). Crypto. [online] Node.js Documentation.
//Available at: https://nodejs.org/api/crypto.html
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//03
//Validator.js String Validation Library
//Adapted from: npm. (2025). validator. [online] npm Package Registry.
//Available at: https://www.npmjs.com/package/validator
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//04
//OWASP Input Validation Cheat Sheet
//Adapted from: OWASP. (2025). Input Validation Cheat Sheet. [online] OWASP Cheat Sheet Series.
//Available at: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//05
//Rate Limiting Algorithms and Best Practices
//Adapted from: IETF. (2012). HTTP Over TLS. [online] RFC 6585 - Additional HTTP Status Codes.
//Available at: https://tools.ietf.org/html/rfc6585
//Date Accessed: 10 October 2025

import validator from 'validator';
import crypto from 'crypto';

/**
 * Enhanced Security Utilities for SQL Injection Protection
 * Provides additional security helpers for input validation and sanitization
 */

/**
 * Escape special characters that could be used in injection attacks
 */
export const escapeSpecialChars = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/\\/g, '\\\\')    // Escape backslashes
    .replace(/'/g, "\\'")      // Escape single quotes
    .replace(/"/g, '\\"')      // Escape double quotes
    .replace(/\0/g, '\\0')     // Escape null bytes
    .replace(/\n/g, '\\n')     // Escape newlines
    .replace(/\r/g, '\\r')     // Escape carriage returns
    .replace(/\t/g, '\\t')     // Escape tabs
    .replace(/\x1a/g, '\\Z');  // Escape substitute character
};

/**
 * Validate and sanitize email addresses with additional security checks
 */
export const validateSecureEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' };
  }
  
  // Length check
  if (email.length > 254) {
    return { isValid: false, error: 'Email too long' };
  }
  
  // Basic format validation
  if (!validator.isEmail(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /['"]\s*(or|and)\s+['"]/i,  // SQL injection
    /<script/i,                  // XSS
    /javascript:/i,              // JavaScript protocol
    /data:/i,                    // Data protocol
    /vbscript:/i,                // VBScript protocol
    /on\w+\s*=/i,                // Event handlers
    /\$where/i,                  // MongoDB injection
    /\$regex/i,                  // MongoDB regex injection
    /\.\.\//,                    // Path traversal
    /\.\.\\/                     // Windows path traversal
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(email)) {
      return { isValid: false, error: 'Email contains suspicious content' };
    }
  }
  
  return { isValid: true, email: email.toLowerCase().trim() };
};

/**
 * Validate and sanitize password with enhanced security
 */
export const validateSecurePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required' };
  }
  
  // Length check
  if (password.length < 8 || password.length > 128) {
    return { isValid: false, error: 'Password must be 8-128 characters long' };
  }
  
  // Complexity requirements
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[@$!%*?&]/.test(password);
  
  if (!hasLower || !hasUpper || !hasNumber || !hasSpecial) {
    return { 
      isValid: false, 
      error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)' 
    };
  }
  
  // Check for common weak patterns
  const weakPatterns = [
    /password/i,
    /123456/,
    /qwerty/i,
    /abc123/i,
    /admin/i,
    /user/i,
    /test/i
  ];
  
  for (const pattern of weakPatterns) {
    if (pattern.test(password)) {
      return { isValid: false, error: 'Password contains common weak patterns' };
    }
  }
  
  // Check for sequential characters
  if (hasSequentialChars(password)) {
    return { isValid: false, error: 'Password contains sequential characters' };
  }
  
  return { isValid: true, password };
};

/**
 * Check for sequential characters in password
 */
const hasSequentialChars = (password) => {
  const sequences = [
    'abcdefghijklmnopqrstuvwxyz',
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    '0123456789',
    'qwertyuiop',
    'asdfghjkl',
    'zxcvbnm'
  ];
  
  for (const sequence of sequences) {
    for (let i = 0; i <= sequence.length - 3; i++) {
      const subseq = sequence.substring(i, i + 3);
      if (password.toLowerCase().includes(subseq.toLowerCase())) {
        return true;
      }
    }
  }
  
  return false;
};

/**
 * Validate and sanitize names with enhanced security
 */
export const validateSecureName = (name, fieldName = 'name') => {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  // Length check
  if (name.length < 2 || name.length > 50) {
    return { isValid: false, error: `${fieldName} must be 2-50 characters long` };
  }
  
  // Character validation - only allow letters, spaces, hyphens, apostrophes
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(name)) {
    return { isValid: false, error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` };
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /\$where/i,
    /\$regex/i,
    /['"]\s*(or|and)\s+['"]/i
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(name)) {
      return { isValid: false, error: `${fieldName} contains suspicious content` };
    }
  }
  
  // Remove leading/trailing whitespace
  const sanitizedName = name.trim();
  
  return { isValid: true, name: sanitizedName };
};

/**
 * Validate and sanitize phone numbers
 */
export const validateSecurePhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return { isValid: true, phone: null }; // Optional field
  }
  
  // Remove common formatting characters
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Length check
  if (cleanPhone.length < 7 || cleanPhone.length > 16) {
    return { isValid: false, error: 'Phone number must be 7-16 digits long' };
  }
  
  // Format validation
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(cleanPhone)) {
    return { isValid: false, error: 'Invalid phone number format' };
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /\$where/i,
    /['"]\s*(or|and)\s+['"]/i
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(phone)) {
      return { isValid: false, error: 'Phone number contains suspicious content' };
    }
  }
  
  return { isValid: true, phone: cleanPhone };
};

/**
 * Generate a secure random token
 */
export const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash sensitive data for logging (one-way)
 */
export const hashForLogging = (data) => {
  if (!data) return 'null';
  return crypto.createHash('sha256').update(String(data)).digest('hex').substring(0, 8);
};

/**
 * Validate MongoDB ObjectId format
 */
export const isValidObjectId = (id) => {
  if (!id || typeof id !== 'string') return false;
  return validator.isMongoId(id);
};

/**
 * Comprehensive input sanitization
 */
export const sanitizeInput = (input) => {
  if (input === null || input === undefined) return input;
  
  if (typeof input === 'string') {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/data:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/[\x00-\x1F\x7F]/g, '')
      .trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(item => sanitizeInput(item));
  }
  
  if (typeof input === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
};

/**
 * Rate limiting helper
 */
export class RateLimiter {
  constructor(maxRequests = 100, windowMs = 900000) { // 15 minutes default
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }
  
  isAllowed(identifier) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    
    const userRequests = this.requests.get(identifier);
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => time > windowStart);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }
  
  getRemainingRequests(identifier) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const userRequests = this.requests.get(identifier) || [];
    const validRequests = userRequests.filter(time => time > windowStart);
    
    return Math.max(0, this.maxRequests - validRequests.length);
  }
  
  getResetTime(identifier) {
    const userRequests = this.requests.get(identifier) || [];
    if (userRequests.length === 0) return null;
    
    const oldestRequest = Math.min(...userRequests);
    return oldestRequest + this.windowMs;
  }
}

export default {
  escapeSpecialChars,
  validateSecureEmail,
  validateSecurePassword,
  validateSecureName,
  validateSecurePhone,
  generateSecureToken,
  hashForLogging,
  isValidObjectId,
  sanitizeInput,
  RateLimiter
};
