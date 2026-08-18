# SSL/HTTPS Configuration Guide

This guide explains how to configure the application to work with both HTTP and HTTPS (SSL) configurations, including when using mkcerts.

## Overview

The application is designed to work in both HTTP and HTTPS modes:

- **HTTP Mode**: For local development without SSL certificates
- **HTTPS Mode**: For production or when you have SSL certificates (including mkcerts)

## Quick Start

### Option 1: Use Configuration Scripts (Recommended)

#### Backend SSL Configuration
```bash
# Navigate to backend directory
cd backend

# Check current SSL status
node toggle-ssl.js status

# Enable HTTPS mode (requires SSL certificates)
node toggle-ssl.js enable

# Disable HTTPS mode (use HTTP only)
node toggle-ssl.js disable
```

#### Frontend API Configuration
```bash
# Navigate to frontend directory
cd frontend

# Check current API configuration
node toggle-api-protocol.js status

# Use HTTP API endpoint
node toggle-api-protocol.js http

# Use HTTPS API endpoint
node toggle-api-protocol.js https

# Use auto-detection (recommended)
node toggle-api-protocol.js auto
```

### Option 2: Manual Configuration

#### Backend (.env file)
Create a `.env` file in the `backend` directory:

```env
# SSL Configuration
FORCE_SSL=false  # Set to 'true' for HTTPS, 'false' for HTTP

# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/customer_portal

# JWT Secret (IMPORTANT: Change this!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

#### Frontend (.env file)
Create a `.env` file in the `frontend` directory:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api  # Use https://localhost:5000/api for HTTPS

# App Configuration
VITE_APP_NAME=Secure Banking Portal
VITE_ENABLE_DEBUG=true
```

## SSL Certificate Setup

### Method 1: Using mkcert (Recommended for Local Development)

1. Install mkcert:
   ```bash
   # Windows (using Chocolatey)
   choco install mkcert
   
   # macOS (using Homebrew)
   brew install mkcert
   
   # Linux
   # Follow instructions at: https://github.com/FiloSottile/mkcert
   ```

2. Install the local CA:
   ```bash
   mkcert -install
   ```

3. Generate certificates:
   ```bash
   cd backend
   mkcert localhost 127.0.0.1 ::1
   
   # Move certificates to the cert directory
   mkdir -p cert
   mv localhost+2.pem cert/localhost.pem
   mv localhost+2-key.pem cert/localhost-key.pem
   ```

4. Enable HTTPS mode:
   ```bash
   node toggle-ssl.js enable
   ```

### Method 2: Auto-Generated Certificates

The backend can automatically generate self-signed certificates:

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Generate certificates:
   ```bash
   node generate-certs.js
   ```

3. Enable HTTPS mode:
   ```bash
   node toggle-ssl.js enable
   ```

## Configuration Scenarios

### Scenario 1: Development with HTTP Only

**Backend:**
```bash
cd backend
node toggle-ssl.js disable
npm run dev
```

**Frontend:**
```bash
cd frontend
node toggle-api-protocol.js http
npm run dev
```

### Scenario 2: Development with HTTPS (mkcert)

**Backend:**
```bash
cd backend
# Make sure mkcert certificates are in ./cert/ directory
node toggle-ssl.js enable
npm run dev
```

**Frontend:**
```bash
cd frontend
node toggle-api-protocol.js https
npm run dev
```

### Scenario 3: Auto-Detection (Recommended)

**Backend:**
```bash
cd backend
# Let the server auto-detect based on certificate availability
npm run dev
```

**Frontend:**
```bash
cd frontend
node toggle-api-protocol.js auto
npm run dev
```

## Troubleshooting

### Registration Fails with mkcert

If registration fails when using mkcert certificates:

1. **Check certificate validity:**
   ```bash
   cd backend
   node toggle-ssl.js status
   ```

2. **Verify mkcert installation:**
   ```bash
   mkcert -CAROOT
   ```

3. **Regenerate certificates:**
   ```bash
   mkcert localhost 127.0.0.1 ::1
   mv localhost+2.pem cert/localhost.pem
   mv localhost+2-key.pem cert/localhost-key.pem
   ```

4. **Clear browser cache and restart both servers**

### Mixed Content Errors

If you see mixed content errors:

1. **Ensure both frontend and backend use the same protocol**
2. **Use the auto-detection mode for the frontend:**
   ```bash
   cd frontend
   node toggle-api-protocol.js auto
   ```

### Certificate Errors

If you see certificate errors:

1. **For mkcert certificates:** Make sure the local CA is installed
2. **For self-signed certificates:** Accept the certificate in your browser
3. **For production:** Use proper SSL certificates from a trusted CA

## Environment Variables Reference

### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `FORCE_SSL` | Force SSL mode (true/false) | Auto-detect |
| `SSL_KEY_PATH` | Path to SSL private key | `./cert/localhost-key.pem` |
| `SSL_CERT_PATH` | Path to SSL certificate | `./cert/localhost.pem` |
| `PORT` | Server port | `5000` |
| `JWT_SECRET` | JWT signing secret | Required |

### Frontend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | Auto-detect |
| `VITE_API_TIMEOUT` | Request timeout (ms) | `10000` |
| `VITE_ENABLE_PROTOCOL_FALLBACK` | Enable HTTP/HTTPS fallback | `true` |
| `VITE_MAX_RETRY_ATTEMPTS` | Max retry attempts | `3` |

## Best Practices

1. **Use mkcert for local development** - It provides trusted certificates
2. **Use auto-detection mode** - Let the application handle protocol detection
3. **Always use HTTPS in production** - Never use HTTP for production deployments
4. **Keep certificates secure** - Don't commit certificates to version control
5. **Use environment variables** - Don't hardcode configuration values

## Security Notes

- HTTP mode is vulnerable to MITM attacks and should only be used for local development
- Always use HTTPS in production environments
- Keep your JWT secrets secure and use strong, random values
- Regularly rotate your SSL certificates and secrets
- Monitor for certificate expiration dates

## Support

If you encounter issues:

1. Check the console logs for both frontend and backend
2. Verify your environment configuration using the status commands
3. Ensure all dependencies are installed correctly
4. Check that ports are not already in use
5. Verify network connectivity between frontend and backend
