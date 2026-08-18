//CODE ATTRIBUTION
//01
//Helmet.js Security Headers Middleware
//Adapted from: npm. (2025). helmet. [online] npm Package Registry.
//Available at: https://www.npmjs.com/package/helmet
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//02
//Express Rate Limiting Middleware
//Adapted from: npm. (2025). express-rate-limit. [online] npm Package Registry.
//Available at: https://www.npmjs.com/package/express-rate-limit
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//03
//Cross-Origin Resource Sharing (CORS)
//Adapted from: MDN Web Docs. (2025). Cross-Origin Resource Sharing (CORS). [online] Mozilla Developer Network.
//Available at: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//04
//Rate Limiter Flexible for Brute Force Protection
//Adapted from: npm. (2025). rate-limiter-flexible. [online] npm Package Registry.
//Available at: https://www.npmjs.com/package/rate-limiter-flexible
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//05
//OWASP Cross-Site Scripting (XSS) Prevention
//Adapted from: OWASP. (2025). Cross Site Scripting Prevention Cheat Sheet. [online] OWASP Cheat Sheet Series.
//Available at: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
//Date Accessed: 10 October 2025

import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Helmet security headers configuration
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  // Since we're not using HTTPS, we'll disable HSTS
  // but keep other security headers
  hsts: false,
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
});

// CORS configuration
export const corsConfig = cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'https://localhost:3000',
      'http://localhost:5173', // Vite dev server (HTTP)
      'https://localhost:5173', // Vite dev server (HTTPS)
      'http://127.0.0.1:3000',
      'https://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'https://127.0.0.1:5173'
    ];

    // In production, you should specify exact domains
    if (process.env.NODE_ENV === 'production') {
      // Add your production domain here
      allowedOrigins.push('https://yourdomain.com');
    } else {
      // In development, allow localhost (both HTTP and HTTPS)
      if (origin.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/)) {
        return callback(null, true);
      }
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Security-Token']
});

// General rate limiting - 100 requests per 15 minutes per IP
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  }
});

// Stricter rate limiting for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth attempts per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed requests
  skip: (req, res) => {
    // Skip if user is already authenticated
    return req.user != null;
  }
});

// API rate limiting - 1000 requests per hour per IP
export const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000,
  message: {
    error: 'API rate limit exceeded',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Brute force protection using rate-limiter-flexible
export const loginBruteLimiter = new RateLimiterMemory({
  keyPrefix: 'login_brute',
  points: 10, // Number of attempts
  duration: 60 * 15, // Per 15 minutes
  blockDuration: 60 * 30, // Block for 30 minutes
});

// Password reset rate limiting
export const passwordResetLimiter = new RateLimiterMemory({
  keyPrefix: 'password_reset',
  points: 3, // 3 reset attempts
  duration: 60 * 60, // Per hour
  blockDuration: 60 * 60 * 24, // Block for 24 hours
});

// Middleware to check brute force protection
export const checkBruteForce = (limiter) => {
  return async (req, res, next) => {
    try {
      const key = req.ip + ':' + (req.body.email || req.body.username || 'unknown');
      await limiter.consume(key);
      next();
    } catch (rejRes) {
      const msBeforeNext = rejRes.msBeforeNext || 0;
      const retryAfter = Math.ceil(msBeforeNext / 1000);

      res.status(429).json({
        error: 'Too many attempts, please try again later.',
        retryAfter: `${retryAfter} seconds`
      });
    }
  };
};

// Enhanced input sanitization middleware with RegEx whitelisting
export const sanitizeInput = (req, res, next) => {
  // RegEx patterns for whitelisting
  const allowedPatterns = {
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    password: /^[A-Za-z\d@$!%*?&]{8,128}$/,
    name: /^[a-zA-Z\s\-']{2,50}$/,
    phone: /^\+?[1-9]\d{1,14}$/,
    token: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/
  };

  // Recursively sanitize object properties
  const sanitizeObject = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove potential XSS and injection attacks
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/javascript:/gi, '') // Remove javascript: protocols
          .replace(/on\w+\s*=/gi, '') // Remove event handlers
          .replace(/data:/gi, '') // Remove data: protocols
          .replace(/vbscript:/gi, '') // Remove vbscript: protocols
          .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
          .trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };

  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);

  next();
};

// Security headers middleware
export const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
};

// Request logging middleware for security monitoring
export const securityLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const method = req.method;
  const url = req.url;

  // Log suspicious activities
  if (req.url.includes('../') || req.url.includes('..\\')) {
    console.warn(`[SECURITY] Path traversal attempt: ${timestamp} ${ip} ${method} ${url} ${userAgent}`);
  }

  if (req.body && typeof req.body === 'string' && req.body.length > 10000) {
    console.warn(`[SECURITY] Large payload: ${timestamp} ${ip} ${method} ${url}`);
  }

  // Log all authentication attempts
  if (url.includes('/auth/')) {
    console.log(`[AUTH] ${timestamp} ${ip} ${method} ${url} ${userAgent}`);
  }

  next();
};
