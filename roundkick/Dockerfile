# Multi-stage Dockerfile for Customer Portal Application

# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm ci

# Copy frontend source code
COPY frontend/ ./

# Build frontend for production
RUN npm run build

# Stage 2: Build Backend
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies
RUN npm ci

# Copy backend source code
COPY backend/ ./

# Stage 3: Production Image
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Install serve globally for serving frontend
RUN npm install -g serve

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built frontend from frontend-builder stage
COPY --from=frontend-builder --chown=nodejs:nodejs /app/frontend/dist ./frontend/dist

# Copy backend from backend-builder stage
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend ./backend

# Install production dependencies only for backend
WORKDIR /app/backend
RUN npm ci --only=production && npm cache clean --force

# Create startup script before switching to non-root user
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'cd /app/backend && npm start &' >> /app/start.sh && \
    echo 'cd /app/frontend && serve -s dist -l 3000' >> /app/start.sh && \
    chmod +x /app/start.sh

# Change ownership of startup script to nodejs user
RUN chown nodejs:nodejs /app/start.sh

# Switch to non-root user
USER nodejs

# Expose ports
EXPOSE 3000 5000

# Health check for frontend (backend health check would require MongoDB connection)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Start both services
CMD ["dumb-init", "/app/start.sh"]
