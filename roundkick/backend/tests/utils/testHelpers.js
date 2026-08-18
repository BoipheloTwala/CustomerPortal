const User = require('../../models/User');

// Test data factory
const createTestUser = async (overrides = {}) => {
  const defaultUser = {
    email: `test${Date.now()}@example.com`,
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: 'User',
    phoneNumber: '+1234567890'
  };

  const userData = { ...defaultUser, ...overrides };
  const user = new User(userData);
  await user.save();
  return user;
};

const createTestUserData = (overrides = {}) => {
  return {
    email: `test${Date.now()}@example.com`,
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: 'User',
    phoneNumber: '+1234567890',
    ...overrides
  };
};

// Authentication helper
const authenticateUser = async (app, userData) => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: userData.email,
      password: userData.password
    });

  return response.body.token;
};

// Generate valid JWT token for testing
const generateTestToken = (userId) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'test-jwt-secret',
    { expiresIn: '1h' }
  );
};

module.exports = {
  createTestUser,
  createTestUserData,
  authenticateUser,
  generateTestToken
};
