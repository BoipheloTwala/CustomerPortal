//CODE ATTRIBUTION
//01
//DOMPurify - DOM-only XSS Sanitizer
//Adapted from: cure53. (2025). DOMPurify. [online] GitHub Repository.
//Available at: https://github.com/cure53/DOMPurify
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//02
//DOM-based XSS Prevention
//Adapted from: OWASP. (2025). DOM based XSS Prevention Cheat Sheet. [online] OWASP Cheat Sheet Series.
//Available at: https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//03
//HTML5 Security Cheatsheet
//Adapted from: cure53. (2025). HTML5 Security Cheatsheet. [online] cure53.
//Available at: https://html5sec.org/
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//04
//Input Validation Cheat Sheet
//Adapted from: OWASP. (2025). Input Validation Cheat Sheet. [online] OWASP Cheat Sheet Series.
//Available at: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//05
//Content Security Policy Reference
//Adapted from: W3C. (2025). Content Security Policy Level 3. [online] W3C Candidate Recommendation.
//Available at: https://www.w3.org/TR/CSP3/
//Date Accessed: 10 October 2025

import validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Comprehensive XSS Protection Middleware
 * Protects against Cross-Site Scripting attacks
 */

// XSS attack patterns to detect and block
const XSS_PATTERNS = [
  // Script tags and javascript protocols
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
  /data:application\/javascript/gi,
  
  // Event handlers
  /on\w+\s*=/gi,
  /onload\s*=/gi,
  /onerror\s*=/gi,
  /onclick\s*=/gi,
  /onmouseover\s*=/gi,
  /onfocus\s*=/gi,
  /onblur\s*=/gi,
  /onchange\s*=/gi,
  /onsubmit\s*=/gi,
  /onkeydown\s*=/gi,
  /onkeyup\s*=/gi,
  /onkeypress\s*=/gi,
  
  // HTML entities and encoding attempts
  /&#x?[0-9a-fA-F]+;/g,
  /&[a-zA-Z][a-zA-Z0-9]*;/g,
  
  // Expression and eval attempts
  /expression\s*\(/gi,
  /eval\s*\(/gi,
  /setTimeout\s*\(/gi,
  /setInterval\s*\(/gi,
  /Function\s*\(/gi,
  
  // Iframe and object tags
  /<iframe\b[^>]*>/gi,
  /<object\b[^>]*>/gi,
  /<embed\b[^>]*>/gi,
  /<applet\b[^>]*>/gi,
  
  // Form manipulation
  /<form\b[^>]*>/gi,
  /<input\b[^>]*>/gi,
  /<textarea\b[^>]*>/gi,
  /<select\b[^>]*>/gi,
  
  // CSS expression attacks
  /expression\s*\(/gi,
  /url\s*\(/gi,
  /@import/gi,
  /@charset/gi,
  
  // SQL injection via XSS
  /union\s+select/gi,
  /drop\s+table/gi,
  /delete\s+from/gi,
  /insert\s+into/gi,
  /update\s+set/gi,
  /exec\s*\(/gi,
  
  // Base64 encoded attacks
  /data:image\/svg\+xml;base64/gi,
  /data:text\/html;base64/gi,
  
  // Meta refresh redirects
  /<meta\s+http-equiv\s*=\s*["']?refresh["']?/gi,
  
  // Link protocols
  /href\s*=\s*["']?javascript:/gi,
  /src\s*=\s*["']?javascript:/gi,
  /action\s*=\s*["']?javascript:/gi
];

// Dangerous HTML tags that should be stripped
const DANGEROUS_TAGS = [
  'script', 'iframe', 'object', 'embed', 'applet', 'form', 'input',
  'textarea', 'select', 'button', 'link', 'meta', 'style', 'link'
];

// Dangerous attributes that should be removed
const DANGEROUS_ATTRIBUTES = [
  'onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur',
  'onchange', 'onsubmit', 'onkeydown', 'onkeyup', 'onkeypress',
  'onabort', 'onbeforeunload', 'onerror', 'onhashchange', 'onload',
  'onpageshow', 'onpagehide', 'onresize', 'onscroll', 'onunload',
  'onbeforeprint', 'onafterprint', 'oncontextmenu', 'onformchange',
  'onforminput', 'oninput', 'oninvalid', 'onreset', 'onselect',
  'onsubmit', 'onblur', 'onchange', 'onfocus', 'onreset', 'onselect',
  'onsubmit', 'onkeydown', 'onkeypress', 'onkeyup', 'onclick',
  'ondblclick', 'ondrag', 'ondragend', 'ondragenter', 'ondragleave',
  'ondragover', 'ondragstart', 'ondrop', 'onmousedown', 'onmousemove',
  'onmouseout', 'onmouseover', 'onmouseup', 'onmousewheel', 'onscroll',
  'onwheel', 'oncopy', 'oncut', 'onpaste', 'onabort', 'oncanplay',
  'oncanplaythrough', 'ondurationchange', 'onemptied', 'onended',
  'onerror', 'onloadeddata', 'onloadedmetadata', 'onloadstart',
  'onpause', 'onplay', 'onplaying', 'onprogress', 'onratechange',
  'onseeked', 'onseeking', 'onstalled', 'onsuspend', 'ontimeupdate',
  'onvolumechange', 'onwaiting'
];

/**
 * Detect XSS patterns in input
 */
const containsXSSPattern = (input) => {
  if (typeof input !== 'string') return false;
  
  return XSS_PATTERNS.some(pattern => pattern.test(input));
};

/**
 * Sanitize HTML content using DOMPurify
 */
const sanitizeHTML = (input) => {
  if (typeof input !== 'string') return input;
  
  // Configure DOMPurify with strict settings
  const config = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'span', 'div'],
    ALLOWED_ATTR: ['class', 'id'],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false,
    SANITIZE_DOM: true,
    FORCE_BODY: false,
    ADD_ATTR: [],
    ADD_TAGS: [],
    FORBID_TAGS: DANGEROUS_TAGS,
    FORBID_ATTR: DANGEROUS_ATTRIBUTES
  };
  
  return DOMPurify.sanitize(input, config);
};

/**
 * Escape HTML entities
 */
const escapeHTML = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Sanitize JavaScript content
 */
const sanitizeJavaScript = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove dangerous JavaScript patterns
  let sanitized = input
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/eval\s*\(/gi, '')
    .replace(/expression\s*\(/gi, '')
    .replace(/setTimeout\s*\(/gi, '')
    .replace(/setInterval\s*\(/gi, '')
    .replace(/Function\s*\(/gi, '');
  
  return sanitized;
};

/**
 * Recursively sanitize objects for XSS
 */
const sanitizeObject = (obj, path = '') => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    // Check for XSS patterns first
    if (containsXSSPattern(obj)) {
      console.warn(`[SECURITY] XSS pattern detected in ${path}: ${obj.substring(0, 100)}`);
      
      // For form data, sanitize HTML
      if (path.includes('body') || path.includes('query')) {
        return sanitizeHTML(obj);
      }
      
      // For other contexts, escape HTML
      return escapeHTML(obj);
    }
    
    // Sanitize JavaScript patterns
    return sanitizeJavaScript(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map((item, index) => sanitizeObject(item, `${path}[${index}]`));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize object keys too
      const sanitizedKey = sanitizeJavaScript(key);
      sanitized[sanitizedKey] = sanitizeObject(value, `${path}.${sanitizedKey}`);
    }
    return sanitized;
  }
  
  return obj;
};

/**
 * XSS Protection Middleware
 */
export const xssProtection = (req, res, next) => {
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
    
    // Sanitize headers (especially User-Agent and Referer)
    if (req.headers) {
      const dangerousHeaders = ['user-agent', 'referer', 'origin'];
      dangerousHeaders.forEach(header => {
        if (req.headers[header]) {
          req.headers[header] = sanitizeJavaScript(req.headers[header]);
        }
      });
    }
    
    next();
  } catch (error) {
    console.error(`[SECURITY] XSS protection error: ${timestamp} ${ip}`, error);
    res.status(400).json({ 
      error: 'Invalid request format',
      timestamp: timestamp
    });
  }
};

/**
 * Content Security Policy middleware
 */
export const contentSecurityPolicy = (req, res, next) => {
  // Set strict CSP headers
  const cspPolicy = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');
  
  res.setHeader('Content-Security-Policy', cspPolicy);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

/**
 * Safe output encoding for API responses
 */
export const safeOutputEncoding = (req, res, next) => {
  // Override res.json to sanitize output
  const originalJson = res.json;
  
  res.json = function(obj) {
    if (obj && typeof obj === 'object') {
      obj = sanitizeObject(obj, 'response');
    }
    return originalJson.call(this, obj);
  };
  
  next();
};

/**
 * Validate and sanitize specific form fields
 */
export const validateFormFields = (req, res, next) => {
  const { email, firstName, lastName, phoneNumber } = req.body;
  
  // Validate email format and sanitize
  if (email && typeof email === 'string') {
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    req.body.email = validator.normalizeEmail(email);
  }
  
  // Validate and sanitize names
  [firstName, lastName].forEach((name, index) => {
    if (name && typeof name === 'string') {
      const fieldName = index === 0 ? 'firstName' : 'lastName';
      
      // Check length
      if (name.length > 50) {
        return res.status(400).json({ error: `${fieldName} too long` });
      }
      
      // Check for XSS patterns
      if (containsXSSPattern(name)) {
        console.warn(`[SECURITY] XSS pattern in ${fieldName}: ${name}`);
        return res.status(400).json({ error: `Invalid ${fieldName} format` });
      }
      
      // Sanitize the name
      req.body[fieldName] = sanitizeHTML(name);
    }
  });
  
  // Validate phone number
  if (phoneNumber && typeof phoneNumber === 'string') {
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    if (!validator.isMobilePhone(cleanPhone, 'any')) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }
    req.body.phoneNumber = cleanPhone;
  }
  
  next();
};

export default {
  xssProtection,
  contentSecurityPolicy,
  safeOutputEncoding,
  validateFormFields,
  sanitizeHTML,
  escapeHTML,
  sanitizeJavaScript
};
