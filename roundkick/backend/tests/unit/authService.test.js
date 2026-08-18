import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import {
  generateToken,
  authenticateToken,
  generatePasswordResetToken,
  resetUserPassword,
  authenticateUser,
  registerUser
} from '../../service/authService.js';
import User from '../../models/User.js';

describe('Auth Service', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe('generateToken', () => {
    test('should generate a valid JWT token', () => {
      const userId = '507f1f77bcf86cd799439011';
      const token = generateToken(userId);

      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('authenticateToken middleware', () => {
    test('should call next for valid token', () => {
      const userId = '507f1f77bcf86cd799439011';
      const token = generateToken(userId);
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = {};
      const next = jest.fn();

      authenticateToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.userId).toBe(userId);
    });

    test('should return 401 for missing token', () => {
      const req = { headers: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access token required' });
    });

    test('should return 403 for invalid token', () => {
      const req = { headers: { authorization: 'Bearer invalid.token.here' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    });
  });

  describe('registerUser', () => {
    test('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '+1234567890'
      };

      const result = await registerUser(userData);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.user.firstName).toBe(userData.firstName);
    });

    test('should reject duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User'
      };

      await registerUser(userData);
      const result = await registerUser(userData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User with this email already exists');
    });
  });

  describe('authenticateUser', () => {
    test('should authenticate valid user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User'
      };

      await registerUser(userData);
      const result = await authenticateUser(userData.email, userData.password);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(userData.email);
    });

    test('should reject invalid email', async () => {
      const result = await authenticateUser('nonexistent@example.com', 'password');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
    });

    test('should reject invalid password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User'
      };

      await registerUser(userData);
      const result = await authenticateUser(userData.email, 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
    });
  });

  describe('generatePasswordResetToken', () => {
    test('should generate reset token for user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User'
      };

      const user = await registerUser(userData);
      const token = await generatePasswordResetToken(user.user);

      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format
    });
  });

  describe('resetUserPassword', () => {
    test('should reset password with valid token', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User'
      };

      const user = await registerUser(userData);
      const token = await generatePasswordResetToken(user.user);

      const result = await resetUserPassword(token, 'NewPass123!');

      expect(result.success).toBe(true);
    });

    test('should reject invalid token', async () => {
      const result = await resetUserPassword('invalid.token.here', 'NewPass123!');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid reset token');
    });

    test('should reject expired token', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User'
      };

      const user = await registerUser(userData);

      // Create an expired token (issued in the past)
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { userId: user.user._id },
        process.env.JWT_SECRET || 'test-jwt-secret',
        { expiresIn: '-1h' } // Already expired
      );

      const result = await resetUserPassword(expiredToken, 'NewPass123!');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid or expired reset token');
    });
  });
});
