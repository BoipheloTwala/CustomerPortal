# Customer Portal - Secure Web Application

A secure, full-stack customer portal built with React, TypeScript, Node.js, and Express, featuring comprehensive security measures and DevSecOps practices.

## Project Overview

This customer portal implements enterprise-grade security features including password hashing, input validation, SSL/TLS encryption, protection against common attacks, and a complete DevSecOps pipeline.

## Security Features Implemented

### Password Security 
- **bcrypt hashing** with salt rounds for secure password storage
- Strong password requirements enforced via RegEx validation
- Password reset functionality with secure tokens
- Account lockout after failed login attempts

### Input Whitelisting 
- **RegEx pattern validation** for all user inputs
- Comprehensive sanitization of form data
- Prevention of injection attacks through input filtering
- Client and server-side validation

### SSL/TLS Security 
- HTTPS enforcement for all traffic
- Self-signed certificates for development
- Production-ready SSL configuration
- Secure cookie handling

### Attack Protection 
- **Helmet.js** for security headers
- **Express Rate Limiting** for DDoS protection
- **Brute force protection** with account lockout
- CORS configuration
- XSS protection
- CSRF protection
- SQL injection prevention
- Input sanitization middleware

### DevSecOps Pipeline 
- **GitHub Actions** CI/CD pipeline
- Automated security scanning (CodeQL)
- Dependency vulnerability checks
- Secret scanning
- Code security analysis
- Static security testing

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│────│  Express Backend │────│   MongoDB       │
│   (TypeScript)  │    │  (Node.js)      │    │   Database      │
│                 │    │                 │    │                 │
│ - Auth Pages    │    │ - JWT Auth      │    │ - User Data     │
│ - Dashboard     │    │ - Security MW   │    │ - Sessions      │
│ - Form Validation│   │ - API Routes    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │ Security Layers │
                    │                 │
                    │ - SSL/TLS       │
                    │ - Rate Limiting │
                    │ - Input Validation│
                    │ - Authentication │
                    └─────────────────┘
```

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (running locally or remote)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/IIEWFL/insy7314-poe-roundkick.git
   cd insy7314-poe-roundkick
   ```

2. **Install Dependencies**
   ```bash
   # Backend dependencies
   cd backend
   npm install

   # Frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Database Setup**
   - Ensure MongoDB is running on port 27017
   - For local MongoDB: `mongod` (if installed locally)
   - Or use MongoDB Atlas (cloud) and update the connection string

4. **Environment Configuration**
   ```bash
   cd backend
   cp .env-example .env
   # Edit .env with your MongoDB connection and JWT secret
   ```

5. **Start the Application**

   **Option A: Manual startup**
   ```bash
   # Terminal 1 - Backend (from backend directory)
   npm run dev

   # Terminal 2 - Frontend (from frontend directory)
   npm run dev
   ```

   **Option B: Convenience script (Windows)**
   ```bash
   # From project root directory
   start-dev.bat
   ```

   **Option C: Convenience script (Linux/Mac)**
   ```bash
   # From project root directory
   chmod +x start-dev.sh
   ./start-dev.sh
   ```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

6. **Initialize Test Accounts**

   Run the setup script to create pre-configured test accounts:
   ```bash
   cd backend
   node setup-admin-users.js
   ```

   This will create admin and customer accounts for testing.

## Login Credentials

After running the setup script, you can use the following test accounts:

### Customer Portal Accounts

| Email | Password | Role |
|-------|----------|------|
| `john.doe@example.com` | `Customer123!` | Customer |
| `jane.smith@example.com` | `Customer456!` | Customer |

**Customer Portal Access:**
- Login URL: `http://localhost:5173/login`
- Features: Dashboard, Payment creation, Profile management

### Employee/Admin Portal Accounts

| Email | Password | Role |
|-------|----------|------|
| `admin@internationalpayments.com` | `AdminSecure123!` | Admin |
| `manager@internationalpayments.com` | `ManagerSecure123!` | Admin |
| `payments@internationalpayments.com` | `PaymentsSecure123!` | Admin |

**Employee Portal Access:**
- Login URL: `http://localhost:5173/employee/login`
- Features: Payment verification, User management, Payment statistics, SWIFT code processing

**Note:** The employee portal requires admin role access. Only pre-configured admin accounts can access the employee dashboard.

## Payment System

### Payment Features

The application includes a comprehensive international payment processing system:

#### Supported Currencies
- USD (US Dollar)
- EUR (Euro)
- GBP (British Pound)
- CAD (Canadian Dollar)
- AUD (Australian Dollar)
- JPY (Japanese Yen)

#### Supported Payment Providers
- Visa
- Mastercard
- American Express (Amex)
- Discover

#### Payment Workflow

1. **Customer Creates Payment** (`POST /api/payment/create`)
   - Customer submits payment with amount, currency, recipient, and payment provider
   - Payment is created with status: `pending`
   - Payment ID is auto-generated (format: `PAY-000001`)
   - Card details are validated using Luhn algorithm
   - Card expiry date validation
   - CVV validation (3-4 digits)

2. **Admin Verification** (`POST /api/employee/payments/process`)
   - Admin reviews pending payments
   - Admin verifies payment with SWIFT code (required format: `AAAA-BB-CC-DDD`)
   - Payment status changes to `verified`
   - SWIFT code is validated and stored

3. **Payment Approval** (`POST /api/employee/payments/process`)
   - Admin approves verified payments
   - Payment status changes to `completed`
   - Payment is forwarded to SWIFT network
   - Processed timestamp is recorded

4. **Payment Rejection** (Optional)
   - Admin can reject payments with reason
   - Payment status changes to `rejected`
   - Rejection reason is stored

#### Payment Status Flow

```
pending → verified → completed
   ↓
rejected
```

#### Payment Validation Rules

- **Amount**: Minimum 0.01, Maximum 1,000,000
- **Recipient**: 2-200 characters, trimmed
- **Card Number**: 12-19 digits, Luhn algorithm validation
- **Expiry**: MM/YY format, must not be expired
- **CVV**: 3-4 digits
- **SWIFT Code**: Format `AAAA-BB-CC-DDD` (8 or 11 characters)

#### Payment Security

- Card details are **never stored** in the database
- Only payment metadata (amount, currency, provider) is stored
- All payment data is validated on both client and server
- Payment creation requires customer authentication
- Payment processing requires admin authentication

### Payment API Endpoints

#### Customer Endpoints
- `POST /api/payment/create` - Create a new payment (requires authentication)
  ```json
  {
    "amount": 1000.00,
    "currency": "USD",
    "recipient": "John Smith",
    "paymentProvider": "Visa"
  }
  ```

#### Admin/Employee Endpoints
- `GET /api/employee/payments` - Get all payments (admin only)
- `GET /api/employee/payments/stats` - Get payment statistics (admin only)
- `POST /api/employee/payments/process` - Process payment (verify/approve/reject)
  ```json
  {
    "paymentId": "PAY-000001",
    "action": "verify",
    "swiftCode": "ABCDEF12XXX"
  }
  ```

### Payment Examples

Here are example payment transactions you can use for testing:

#### Payment 1 - USD Transaction

- **Amount**: `1000.00`
- **Currency**: `USD`
- **Payment Provider**: `Visa`
- **Name on Card**: `John Doe`
- **Card Number**: `4111 1111 1111 1111`
- **Expiry**: `12/30`
- **CVV**: `123`
- **Recipient**: `John Doe`
- **SWIFT Code**: `CHASUS33` (for verification)

#### Payment 2 - EUR Transaction

- **Amount**: `500.00`
- **Currency**: `EUR`
- **Payment Provider**: `Mastercard`
- **Name on Card**: `Jane Smith`
- **Card Number**: `5555 5555 5555 4444`
- **Expiry**: `06/31`
- **CVV**: `456`
- **Recipient**: `Jane Smith`
- **SWIFT Code**: `DEUTDEFF` (for verification)

#### Payment 3 - GBP Transaction

- **Amount**: `750.00`
- **Currency**: `GBP`
- **Payment Provider**: `Amex`
- **Name on Card**: `Bob Williams`
- **Card Number**: `3782 822463 10005`
- **Expiry**: `09/32`
- **CVV**: `7890`
- **Recipient**: `Bob Williams`
- **SWIFT Code**: `HSBCGB2L` (for verification)

**Note:** These are test card numbers that pass Luhn algorithm validation. They are safe to use for testing but will not process real transactions.

## Project Structure

```
├── backend/                 # Express.js API server
│   ├── controllers/        # Route controllers (business logic)
│   ├── middleware/         # Security middleware
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API route definitions
│   ├── service/           # Business logic services
│   ├── utils/             # Utility functions & validation
│   ├── tests/             # Test suites
│   │   ├── unit/          # Unit tests
│   │   ├── integration/   # Integration tests
│   │   └── utils/         # Test helpers
│   ├── cert/              # SSL certificates
│   └── server.js          # Main server file
├── frontend/               # React application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
├── .github/workflows/      # DevSecOps pipeline
└── README.md              # This file
```

## Security Implementation Details

### Password Security
```javascript
// Password hashing with bcrypt
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Password validation RegEx
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
```

### Input Validation
```javascript
// Email validation
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Name validation (prevents injection)
const nameRegex = /^[a-zA-Z\s\-']+$/;
```

### Rate Limiting
```javascript
// General API rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
});

// Auth endpoints - stricter limits
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 auth attempts per window
});
```

### Helmet Security Headers
```javascript
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      // ... more directives
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
});
```

## Testing the Security Features

### Authentication Testing
```bash
# Test registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!","firstName":"John","lastName":"Doe"}'

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'
```

### Security Testing
```bash
# Test rate limiting
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done

# Test input validation
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"<script>alert(1)</script>","password":"pass","firstName":"John","lastName":"Doe"}'
```

## Testing

The project includes comprehensive test suites with automated CI/CD pipelines:

### Running Tests Locally

```bash
# Backend unit tests
cd backend
npm test

# Run with coverage
npm run test:coverage

# Run full test suite (when integration tests are complete)
npm run test:full
```

### GitHub Actions Test Pipeline

The test pipeline runs automatically on:
- **Push** to `main` or `develop` branches
- **Pull Requests** to `main` or `develop` branches
- **Manual trigger** via workflow dispatch

#### Test Jobs Included:

1. **Backend Tests** - Unit tests with MongoDB Memory Server
2. **Frontend Tests** - Build and type checking
3. **Integration Tests** - End-to-end API testing
4. **Security Tests** - Dependency vulnerability scanning
5. **Performance Tests** - Load testing with Artillery (main branch only)

#### Test Results:
- Test results saved as artifacts
- Coverage reports uploaded to Codecov
- PR comments with test summaries
- Notifications on test failures

### Test Structure

- **Unit Tests** (`tests/unit/`): Test individual functions and utilities
  - `validation.test.js` - Input validation and sanitization tests
  - `authService.test.js` - Authentication service tests

- **Integration Tests** (`tests/integration/`): Test API endpoints end-to-end
  - `auth.test.js` - Authentication API tests

- **Test Utilities** (`tests/utils/`): Helper functions for testing
  - `testHelpers.js` - Common test data and utilities

### Test Coverage

Current test coverage includes:
- Password strength validation
- Email format validation
- Input sanitization (XSS prevention)
- Phone number sanitization
- Authentication service functions
- API endpoint integration tests (in progress)

## DevSecOps Pipeline

The CI/CD pipeline includes:

1. **Security Scanning**
   - Trivy vulnerability scanning
   - CodeQL security analysis
   - Dependency vulnerability checks
   - Secret scanning

2. **Code Quality**
   - ESLint security rules
   - TypeScript type checking
   - Code coverage analysis

3. **Code Security**
   - Static analysis security testing
   - Dependency security validation

4. **Compliance**
   - OWASP ZAP baseline scanning
   - Compliance reporting

## Deployment

### Environment Variables

Create `.env` file in the backend directory:

```bash
# Backend .env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/customer_portal
JWT_SECRET=your-production-jwt-secret-minimum-256-bits
CORS_ORIGIN=https://yourdomain.com
```

### Production Deployment

#### Option 1: Direct Node.js Deployment
```bash
# Backend
cd backend
npm run build  # If build step exists
npm start

# Frontend (build for production)
cd frontend
npm run build
# Serve the dist/ folder with nginx or any static server
```

#### Option 2: PM2 Process Manager (Recommended)
```bash
npm install -g pm2

# Backend
cd backend
pm2 start server.js --name "customer-portal-backend"

# Frontend (after building)
pm2 serve frontend/dist 3000 --name "customer-portal-frontend"
```

#### Option 3: Cloud Platforms
- **Vercel/Netlify**: Deploy frontend
- **Heroku/Railway**: Deploy backend
- **MongoDB Atlas**: Cloud database

## Monitoring & Logging

- Application logs are written to `logs/app.log`
- Health check endpoint: `GET /health`
- Console logging for development
- PM2 monitoring (if using PM2)
- Winston logging can be added for advanced logging

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password

### Customer Payment Endpoints

- `POST /api/payment/create` - Create a new payment (requires customer authentication)
  - Request body: `{ amount, currency, recipient, paymentProvider }`
  - Returns: Payment ID and status

### Employee/Admin Endpoints

All employee endpoints require admin authentication.

#### User Management
- `GET /api/employee/users` - Get all users (paginated)
- `GET /api/employee/users/stats` - Get user statistics
- `GET /api/employee/users/recent-activity` - Get recent login activity
- `GET /api/employee/users/:id` - Get user by ID
- `PUT /api/employee/users/:id/status` - Update user status (activate/deactivate)

#### Payment Management
- `GET /api/employee/payments` - Get all payments
- `GET /api/employee/payments/stats` - Get payment statistics
- `POST /api/employee/payments/process` - Process payment (verify/approve/reject)
  - Request body: `{ paymentId, action, swiftCode?, reason? }`
  - Actions: `verify`, `approve`, `reject`

### Protected Endpoints

- `GET /api/dashboard` - User dashboard (requires authentication)


## License

This project is licensed under the ISC License.


## Support

For security issues, please contact the development team immediately.


