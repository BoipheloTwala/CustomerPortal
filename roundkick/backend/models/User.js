import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    minlength: [5, 'Email must be at least 5 characters long'],
    maxlength: [254, 'Email must be no more than 254 characters long'],
    validate: {
      validator: function(email) {
        // Whitelist email validation - only allow specific patterns
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email) && validator.isEmail(email);
      },
      message: 'Please enter a valid email address'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    maxlength: [128, 'Password must be no more than 128 characters long'],
    validate: {
      validator: function(password) {
        // Whitelist password validation - enforce strong password requirements
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
      },
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
    }
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    minlength: [2, 'First name must be at least 2 characters long'],
    maxlength: [50, 'First name must be no more than 50 characters long'],
    validate: {
      validator: function(name) {
        // Whitelist name validation - only allow letters, spaces, hyphens, apostrophes
        const nameRegex = /^[a-zA-Z\s\-']+$/;
        return nameRegex.test(name) && name.length >= 2 && name.length <= 50 && !/^\s|\s$/.test(name);
      },
      message: 'First name must contain only letters, spaces, hyphens, or apostrophes (2-50 characters, no leading/trailing whitespace)'
    }
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    minlength: [2, 'Last name must be at least 2 characters long'],
    maxlength: [50, 'Last name must be no more than 50 characters long'],
    validate: {
      validator: function(name) {
        // Whitelist name validation - only allow letters, spaces, hyphens, apostrophes
        const nameRegex = /^[a-zA-Z\s\-']+$/;
        return nameRegex.test(name) && name.length >= 2 && name.length <= 50 && !/^\s|\s$/.test(name);
      },
      message: 'Last name must contain only letters, spaces, hyphens, or apostrophes (2-50 characters, no leading/trailing whitespace)'
    }
  },
  phoneNumber: {
    type: String,
    minlength: [7, 'Phone number must be at least 7 digits'],
    maxlength: [16, 'Phone number must be no more than 16 digits'],
    validate: {
      validator: function(phone) {
        if (!phone) return true; // Optional field
        // Whitelist phone validation - international format
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
      },
      message: 'Please enter a valid phone number'
    }
  },
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailVerificationToken: String,
  emailVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Email index is automatically created by unique: true in schema

// Virtual for account lock
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method for failed login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Lock account after 10 failed attempts for 30 minutes
  if (this.loginAttempts + 1 >= 10 && !this.isLocked) {
    updates.$set = {
      lockUntil: Date.now() + 30 * 60 * 1000 // 30 minutes
    };
  }

  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLogin: new Date() }
  });
};

// Static method to sanitize user data for API responses
userSchema.methods.toSafeObject = function() {
  const user = this.toObject();
  delete user.password;
  delete user.passwordResetToken;
  delete user.passwordResetExpires;
  delete user.emailVerificationToken;
  delete user.loginAttempts;
  delete user.lockUntil;
  return user;
};

const User = mongoose.model('User', userSchema);

export default User;
