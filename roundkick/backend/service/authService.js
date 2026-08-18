import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// JWT token generation
export const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    { expiresIn: '24h' }
  );
};

// JWT token verification middleware
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production', (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.userId = decoded.userId;
    next();
  });
};

// Generate password reset token
export const generatePasswordResetToken = async (user) => {
  const resetToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    { expiresIn: '1h' }
  );

  user.passwordResetToken = resetToken;
  user.passwordResetExpires = Date.now() + 3600000; // 1 hour
  await user.save();

  return resetToken;
};

// Reset user password with token
export const resetUserPassword = async (token, newPassword) => {
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');
    const user = await User.findById(decoded.userId);

    if (!user || !user.passwordResetToken || user.passwordResetToken !== token ||
        !user.passwordResetExpires || user.passwordResetExpires < Date.now()) {
      return { success: false, error: 'Invalid or expired reset token' };
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return { success: true };
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return { success: false, error: 'Invalid reset token' };
    }
    throw error;
  }
};

// User authentication service
export const authenticateUser = async (email, password) => {
  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return { success: false, error: 'Invalid email or password' };
  }

  // Check if account is locked
  if (user.isLocked) {
    return {
      success: false,
      error: 'Account is temporarily locked due to too many failed login attempts',
      retryAfter: Math.ceil((user.lockUntil - Date.now()) / 1000) + ' seconds'
    };
  }

  // Check password
  const isValidPassword = await user.comparePassword(password);
  if (!isValidPassword) {
    // Increment failed login attempts
    await user.incLoginAttempts();
    return { success: false, error: 'Invalid email or password' };
  }

  // Reset login attempts on successful login
  await user.resetLoginAttempts();

  return { success: true, user };
};

// User registration service
export const registerUser = async (userData) => {
  const { email, password, firstName, lastName, phoneNumber } = userData;

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return { success: false, error: 'User with this email already exists' };
  }

  // Create new user (password will be hashed by pre-save middleware)
  const user = new User({
    email: email.toLowerCase(),
    password,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    phoneNumber: phoneNumber ? phoneNumber.replace(/[\s\-\(\)]/g, '') : undefined
  });

  await user.save();
  return { success: true, user };
};
