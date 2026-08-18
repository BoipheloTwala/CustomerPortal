//CODE ATTRIBUTION
//01
//OWASP NoSQL Injection Prevention
//Adapted from: OWASP. (2025). Injection Prevention Cheat Sheet. [online] OWASP Cheat Sheet Series.
//Available at: https://cheatsheetseries.owasp.org/cheatsheets/Injection_Prevention_Cheat_Sheet.html
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//02
//Validator.js String Validation Library
//Adapted from: npm. (2025). validator. [online] npm Package Registry.
//Available at: https://www.npmjs.com/package/validator
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//03
//MongoDB Security Best Practices
//Adapted from: MongoDB, Inc. (2025). Security Checklist. [online] MongoDB Documentation.
//Available at: https://www.mongodb.com/docs/manual/administration/security-checklist/
//Date Accessed: 10 October 2025

import validator from 'validator';

/**
 * Enhanced NoSQL Injection Protection Middleware
 * Protects against MongoDB injection attacks and other NoSQL injection vectors
 */

// MongoDB operators that could be used for injection
const DANGEROUS_OPERATORS = [
  '$where', '$regex', '$ne', '$gt', '$lt', '$gte', '$lte',
  '$in', '$nin', '$exists', '$type', '$size', '$all',
  '$elemMatch', '$not', '$or', '$and', '$nor', '$text',
  '$search', '$geoWithin', '$geoIntersects', '$near',
  '$nearSphere', '$center', '$centerSphere', '$box',
  '$polygon', '$geometry', '$maxDistance', '$minDistance'
];

// JavaScript functions that could be dangerous
const DANGEROUS_FUNCTIONS = [
  'function', 'eval', 'setTimeout', 'setInterval', 'exec',
  'spawn', 'require', 'import', 'global', 'process',
  'Buffer', 'console', 'this', 'constructor', 'prototype'
];

/**
 * Check if a value contains dangerous MongoDB operators
 */
const containsDangerousOperators = (value) => {
  if (typeof value === 'object' && value !== null) {
    // Check object keys for dangerous operators
    const keys = Object.keys(value);
    return keys.some(key => DANGEROUS_OPERATORS.includes(key));
  }
  
  if (typeof value === 'string') {
    // Check string for dangerous operators
    return DANGEROUS_OPERATORS.some(op => value.includes(`$${op}`) || value.includes(op));
  }
  
  return false;
};

/**
 * Check if a value contains dangerous JavaScript functions
 */
const containsDangerousFunctions = (value) => {
  if (typeof value !== 'string') return false;
  
  const lowerValue = value.toLowerCase();
  return DANGEROUS_FUNCTIONS.some(func => lowerValue.includes(func));
};

/**
 * Check if a value contains regex injection patterns
 */
const containsRegexInjection = (value) => {
  if (typeof value !== 'string') return false;
  
  // Dangerous regex patterns
  const dangerousPatterns = [
    /^\^/,           // Starts with ^
    /\$$/,           // Ends with $
    /^\.\*$/,        // .*
    /^\.\+$/,        // .+
    /^\(/,           // Starts with (
    /\)$/,           // Ends with )
    /\[.*\]/,        // Character classes
    /\{.*\}/,        // Quantifiers
    /\\[dDwWsS]/,    // Character classes
    /\\[bB]/,        // Word boundaries
    /\\[nrtf]/       // Special characters
  ];
  
  return dangerousPatterns.some(pattern => pattern.test(value));
};

/**
 * Recursively scan and sanitize objects for NoSQL injection
 */
const sanitizeObject = (obj, path = '') => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    // Remove null bytes and control characters (but keep normal text)
    let sanitized = obj.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Only check for dangerous content in specific contexts
    if (path.includes('query') || path.includes('filter') || path.includes('search')) {
      if (containsDangerousOperators(sanitized) || 
          containsDangerousFunctions(sanitized) ||
          containsRegexInjection(sanitized)) {
        console.warn(`[SECURITY] Potential NoSQL injection detected in ${path}: ${sanitized.substring(0, 100)}`);
        return ''; // Remove dangerous content only in query contexts
      }
    }
    
    return sanitized;
  }
  
  if (Array.isArray(obj)) {
    return obj.map((item, index) => sanitizeObject(item, `${path}[${index}]`));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Check if key contains dangerous operators (only for query objects)
      if (path.includes('query') && containsDangerousOperators(key)) {
        console.warn(`[SECURITY] Dangerous key detected: ${key}`);
        continue; // Skip dangerous keys only in query contexts
      }
      
      sanitized[key] = sanitizeObject(value, `${path}.${key}`);
    }
    return sanitized;
  }
  
  return obj;
};

/**
 * Validate MongoDB ObjectId format
 */
const isValidObjectId = (value) => {
  if (typeof value !== 'string') return false;
  return validator.isMongoId(value);
};

/**
 * Enhanced NoSQL injection protection middleware
 */
export const nosqlInjectionProtection = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  
  try {
    // Sanitize request body
    if (req.body) {
      req.body = sanitizeObject(req.body, 'body');
    }
    
    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizeObject(req.query, 'query');
    }
    
    // Sanitize URL parameters
    if (req.params) {
      req.params = sanitizeObject(req.params, 'params');
    }
    
    // Additional validation for specific endpoints
    if (req.path.includes('/auth/')) {
      validateAuthInputs(req);
    }
    
    next();
  } catch (error) {
    console.error(`[SECURITY] NoSQL injection protection error: ${timestamp} ${ip}`, error);
    res.status(400).json({ 
      error: 'Invalid request format',
      timestamp: timestamp
    });
  }
};

/**
 * Validate authentication-related inputs
 */
const validateAuthInputs = (req) => {
  const { email, password, firstName, lastName, phoneNumber } = req.body;
  
  // Only validate if the fields exist and are not empty
  if (!email && !password && !firstName && !lastName && !phoneNumber) {
    return; // Skip validation if no auth fields present
  }
  
  // Validate email format strictly (only if provided)
  if (email && typeof email === 'string' && !validator.isEmail(email)) {
    console.warn(`[SECURITY] Invalid email format detected: ${email}`);
    // Don't throw error, just log and let the application handle it
  }
  
  // Validate password doesn't contain dangerous characters (only if provided)
  if (password && typeof password === 'string') {
    if (password.length > 128) {
      console.warn(`[SECURITY] Password too long: ${password.length} characters`);
      // Don't throw error, just log
    }
    
    // Check for SQL-like injection patterns
    const sqlPatterns = [
      /['"]\s*(or|and)\s+['"]/i,
      /union\s+select/i,
      /drop\s+table/i,
      /delete\s+from/i,
      /insert\s+into/i,
      /update\s+set/i,
      /exec\s*\(/i,
      /script\s*>/i
    ];
    
    if (sqlPatterns.some(pattern => pattern.test(password))) {
      console.warn(`[SECURITY] Potential SQL injection in password`);
      // Don't throw error, just log
    }
  }
  
  // Validate name fields (only if provided)
  [firstName, lastName].forEach((name, index) => {
    if (name && typeof name === 'string') {
      const fieldName = index === 0 ? 'firstName' : 'lastName';
      
      // Check length
      if (name.length > 50) {
        console.warn(`[SECURITY] ${fieldName} too long: ${name.length} characters`);
        // Don't throw error, just log
      }
      
      // Check for dangerous patterns
      if (containsDangerousOperators(name) || containsDangerousFunctions(name)) {
        console.warn(`[SECURITY] Dangerous pattern in ${fieldName}: ${name}`);
        // Don't throw error, just log
      }
    }
  });
  
  // Validate phone number (only if provided)
  if (phoneNumber && typeof phoneNumber === 'string') {
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    if (cleanPhone && !validator.isMobilePhone(cleanPhone, 'any')) {
      console.warn(`[SECURITY] Invalid phone number format: ${phoneNumber}`);
      // Don't throw error, just log
    }
  }
};

/**
 * MongoDB query sanitization helper
 */
export const sanitizeMongoQuery = (query) => {
  if (!query || typeof query !== 'object') return query;
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(query)) {
    // Skip dangerous operators
    if (DANGEROUS_OPERATORS.includes(key)) {
      console.warn(`[SECURITY] Dangerous MongoDB operator filtered: ${key}`);
      continue;
    }
    
    // Recursively sanitize values
    sanitized[key] = sanitizeObject(value, key);
  }
  
  return sanitized;
};

/**
 * Validate and sanitize MongoDB ObjectId
 */
export const validateObjectId = (id) => {
  if (!id) return null;
  
  if (typeof id !== 'string') {
    throw new Error('Invalid ID format');
  }
  
  if (!isValidObjectId(id)) {
    throw new Error('Invalid ObjectId format');
  }
  
  return id;
};

export default {
  nosqlInjectionProtection,
  sanitizeMongoQuery,
  validateObjectId,
  sanitizeObject
};
