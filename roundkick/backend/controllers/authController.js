//CODE ATTRIBUTION
//01
//Bcrypt Password Hashing Library
//Adapted from: npm. (2025). bcrypt. [online] npm Package Registry.
//Available at: https://www.npmjs.com/package/bcrypt
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//02
//Mongoose MongoDB Object Data Modeling
//Adapted from: Automattic. (2025). Mongoose Documentation. [online] Mongoose.
//Available at: https://mongoosejs.com/docs/guide.html
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//03
//OWASP Authentication Best Practices
//Adapted from: OWASP. (2025). Authentication Cheat Sheet. [online] OWASP Cheat Sheet Series.
//Available at: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//04
//Express.js Async Error Handling
//Adapted from: OpenJS Foundation. (2025). Error Handling. [online] Express.js Documentation.
//Available at: https://expressjs.com/en/guide/error-handling.html
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//05
//NoSQL Injection Prevention
//Adapted from: OWASP. (2025). Injection Prevention Cheat Sheet. [online] OWASP Cheat Sheet Series.
//Available at: https://cheatsheetseries.owasp.org/cheatsheets/Injection_Prevention_Cheat_Sheet.html
//Date Accessed: 10 October 2025

import User from '../models/User.js';
import { generateToken } from '../service/authService.js';
import { validateObjectId } from '../middleware/nosql-injection.js';

// Register new user
export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phoneNumber } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
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

    // Generate JWT token
    const token = generateToken(user._id);

    // Return user data without sensitive information
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: user.toSafeObject()
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        error: 'Account is temporarily locked due to too many failed login attempts',
        retryAfter: Math.ceil((user.lockUntil - Date.now()) / 1000) + ' seconds'
      });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      // Increment failed login attempts
      await user.incLoginAttempts();
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: user.toSafeObject()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Logout (client-side token removal, but we can log the event)
export const logout = (req, res) => {
  // In a real application, you might want to blacklist the token
  // For now, we just return success and let the client remove the token
  res.json({ message: 'Logout successful' });
};

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    // Validate ObjectId to prevent injection
    const userId = validateObjectId(req.userId);
    if (!userId) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: user.toSafeObject() });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    // Validate ObjectId to prevent injection
    const userId = validateObjectId(req.userId);
    if (!userId) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const { firstName, lastName, phoneNumber } = req.body;
    const updateData = {};

    if (firstName) updateData.firstName = firstName.trim();
    if (lastName) updateData.lastName = lastName.trim();
    if (phoneNumber !== undefined) {
      updateData.phoneNumber = phoneNumber ? phoneNumber.replace(/[\s\-\(\)]/g, '') : null;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: user.toSafeObject()
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Request password reset
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration attacks
    // But only generate token if user exists
    if (user) {
      const resetToken = await generatePasswordResetToken(user);

      // In a real application, send email with reset link
      console.log(`Password reset token for ${email}: ${resetToken}`);
    }

    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Reset password with token
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Verify token and update password
    const result = await resetUserPassword(token, password);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    console.error('Password reset error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ error: 'Invalid reset token' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Change password (authenticated user)
export const changePassword = async (req, res) => {
  try {
    // Validate ObjectId to prevent injection
    const userId = validateObjectId(req.userId);
    if (!userId) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const { currentPassword, password } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = password;
    await user.save();

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
