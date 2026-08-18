//CODE ATTRIBUTION
//01
//Express.js Web Application Framework
//Adapted from: OpenJS Foundation. (2025). Express. [online] Express.js Documentation.
//Available at: https://expressjs.com/
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//02
//Mongoose MongoDB ODM
//Adapted from: Automattic. (2025). Mongoose Documentation. [online] Mongoose.
//Available at: https://mongoosejs.com/docs/
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//03
//Node.js HTTPS Module
//Adapted from: Node.js Foundation. (2025). HTTPS. [online] Node.js Documentation.
//Available at: https://nodejs.org/api/https.html
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//04
//Express.js Production Best Practices - Security
//Adapted from: OpenJS Foundation. (2025). Production Best Practices: Security. [online] Express.js Documentation.
//Available at: https://expressjs.com/en/advanced/best-practice-security.html
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//05
//OWASP Secure Configuration Guide
//Adapted from: OWASP. (2025). Secure Product Design Cheat Sheet. [online] OWASP Cheat Sheet Series.
//Available at: https://cheatsheetseries.owasp.org/cheatsheets/Secure_Product_Design_Cheat_Sheet.html
//Date Accessed: 10 October 2025

import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import https from "https";
import mongoose from "mongoose";
import {
  helmetConfig,
  corsConfig,
  generalLimiter,
  authLimiter,
  apiLimiter,
  sanitizeInput,
  securityHeaders,
  securityLogger
} from "./middleware/security.js";
import { nosqlInjectionProtection } from "./middleware/nosql-injection.js";
import { xssProtection, contentSecurityPolicy, safeOutputEncoding } from "./middleware/xss-protection.js";
import { 
  clickjackingProtection, 
  enhancedClickjackingProtection, 
  frameBustingScript, 
  advancedClickjackingDetection, 
  testClickjackingProtection 
} from "./middleware/clickjacking-protection.js";
import cloudflareMiddleware from "./cloudflare-config.js";
import antiMitmProtection from "./middleware/anti-mitm.js";
import authRoutes from "./routes/auth.js";
import paymentRoutes from "./routes/payment.js";
import employeeRoutes from "./routes/employee.js";
import { authenticateToken } from "./service/authService.js";
import setupUsers from "./setup-admin-users.js";

const app = express();
dotenv.config();
// hello kris
const port = process.env.PORT || 5000;
const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/customer_portal";

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(async () => {
    console.log('Connected to MongoDB');
    // Auto-setup users on server startup (only if they don't exist)
    try {
      await setupUsers();
      console.log('✓ User setup completed on server startup');
    } catch (error) {
      console.error('User setup failed on server startup:', error);
      // Don't exit - server can still run without pre-configured users
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Security middleware (applied in correct order)
app.use(securityLogger);                    // Log security events
app.use(cloudflareMiddleware);              // Cloudflare integration for DDoS protection
app.use(helmetConfig);                      // Security headers
app.use(corsConfig);                        // CORS configuration
app.use(securityHeaders);                   // Additional security headers
app.use(contentSecurityPolicy);             // Content Security Policy
app.use(antiMitmProtection);                // Anti-MITM protection
app.use(clickjackingProtection);            // Basic clickjacking protection
app.use(enhancedClickjackingProtection);    // Enhanced clickjacking protection
app.use(frameBustingScript);                // Frame-busting script injection
app.use(advancedClickjackingDetection);     // Advanced clickjacking detection

// Rate limiting
app.use('/api/auth', authLimiter);    // Stricter limits for auth endpoints
app.use('/api', apiLimiter);          // General API rate limiting
app.use(generalLimiter);              // General rate limiting

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// NoSQL injection protection
app.use(nosqlInjectionProtection);

// XSS protection
app.use(xssProtection);

// Safe output encoding
app.use(safeOutputEncoding);

// Health check endpoint (not rate limited)
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/employee', employeeRoutes);

// Protected customer routes
app.get('/api/dashboard', authenticateToken, (req, res) => {
  res.json({
    message: "Welcome to your customer dashboard",
    features: [
      "Profile Management",
      "Account Settings",
      "Order History",
      "Support Tickets"
    ]
  });
});

// Clickjacking protection test endpoint
app.get('/api/security/clickjacking-test', testClickjackingProtection);

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';

  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
});

// Enhanced SSL configuration with flexible certificate handling
let sslOptions;
let useSSL = process.env.FORCE_SSL === 'true'; // Respect environment variable

// Check if SSL should be forced off (including for local development)
if (process.env.FORCE_SSL === 'false' || process.env.NODE_ENV === 'development') {
  console.log('SSL disabled for development environment');
  useSSL = false;
} else {
  // Try to load SSL certificates
  try {
    const keyPath = process.env.SSL_KEY_PATH || './cert/localhost-key.pem';
    const certPath = process.env.SSL_CERT_PATH || './cert/localhost.pem';
    
    sslOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
    console.log('SSL certificates found - Server will use HTTPS');
    useSSL = true;
  } catch (error) {
    console.log('SSL certificates not found - Attempting to generate...');
    try {
      // Auto-generate certificates if they don't exist
      const { execSync } = require('child_process');
      execSync('node generate-certs.js', { stdio: 'inherit' });
      
      // Try reading the newly generated certificates
      const keyPath = process.env.SSL_KEY_PATH || './cert/localhost-key.pem';
      const certPath = process.env.SSL_CERT_PATH || './cert/localhost.pem';
      
      sslOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };
      console.log('New SSL certificates generated successfully');
      useSSL = true;
    } catch (genError) {
      console.error('Failed to generate SSL certificates:', genError);
      console.log('Falling back to HTTP mode');
      useSSL = false;
    }
  }
}

// HTTP to HTTPS redirect middleware (only when SSL is enabled)
if (useSSL) {
  app.use((req, res, next) => {
    if (!req.secure && req.headers['x-forwarded-proto'] !== 'https') {
      // Redirect to HTTPS
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// Start server with appropriate protocol
if (useSSL) {
  // Create HTTPS server
  const httpsServer = https.createServer(sslOptions, app);
  httpsServer.listen(port, () => {
    console.log(`Secure server running on https://localhost:${port}`);
    console.log(`Health: https://localhost:${port}/health`);
    console.log(`API: https://localhost:${port}/api`);
    console.log(`Auth: https://localhost:${port}/api/auth`);
  });
  
  // Also create HTTP server that redirects to HTTPS
  const httpPort = parseInt(port) - 1 || 4999;
  app.listen(httpPort, () => {
    console.log(`HTTP redirect server running on http://localhost:${httpPort} (redirects to HTTPS)`);
  });
} else {
  // Fallback to HTTP only if SSL setup completely failed
  app.listen(port, () => {
    console.log(`WARNING: Running in HTTP mode which is vulnerable to MITM attacks`);
    console.log(`HTTP server running on http://localhost:${port}`);
    console.log(`Health: http://localhost:${port}/health`);
    console.log(`API: http://localhost:${port}/api`);
    console.log(`Auth: http://localhost:${port}/api/auth`);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

