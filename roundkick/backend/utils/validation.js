//CODE ATTRIBUTION
//01
//Express-validator Middleware for Input Validation
//Adapted from: npm. (2025). express-validator. [online] npm Package Registry.
//Available at: https://www.npmjs.com/package/express-validator
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//02
//OWASP Input Validation Best Practices
//Adapted from: OWASP. (2025). Input Validation Cheat Sheet. [online] OWASP Cheat Sheet Series.
//Available at: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
//Date Accessed: 10 October 2025

import { body } from 'express-validator';

// Input validation rules using RegEx whitelisting
export const emailValidation = body('email')
  .isEmail()
  .withMessage('Please enter a valid email address')
  .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
  .withMessage('Email contains invalid characters')
  .isLength({ min: 5, max: 254 })
  .withMessage('Email must be between 5 and 254 characters')
  .normalizeEmail();

export const passwordValidation = body('password')
  .isLength({ min: 8, max: 128 })
  .withMessage('Password must be between 8 and 128 characters long')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
  .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)');

export const nameValidation = (field) => body(field)
  .optional()
  .trim()
  .isLength({ min: 2, max: 50 })
  .withMessage(`${field} must be between 2 and 50 characters`)
  .matches(/^[a-zA-Z\s\-']+$/)
  .withMessage(`${field} can only contain letters, spaces, hyphens, and apostrophes`)
  .custom((value) => {
    if (value && /^\s|\s$/.test(value)) {
      throw new Error(`${field} cannot start or end with whitespace`);
    }
    return true;
  });

export const phoneValidation = body('phoneNumber')
  .optional()
  .matches(/^\+?[1-9]\d{1,14}$/)
  .withMessage('Invalid phone number format')
  .isLength({ min: 7, max: 16 })
  .withMessage('Phone number must be between 7 and 16 digits');

// JWT Token validation (for password reset)
export const tokenValidation = body('token')
  .notEmpty()
  .withMessage('Reset token is required')
  .matches(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/)
  .withMessage('Invalid token format')
  .isLength({ min: 20, max: 2000 })
  .withMessage('Token length is invalid');

// Current password validation (for password change)
export const currentPasswordValidation = body('currentPassword')
  .notEmpty()
  .withMessage('Current password is required')
  .isLength({ min: 1, max: 128 })
  .withMessage('Current password length is invalid');

// Payment validation for employee portal
export const paymentAmountValidation = body('amount')
  .isFloat({ min: 0.01, max: 1000000 })
  .withMessage('Payment amount must be between $0.01 and $1,000,000');

export const paymentCurrencyValidation = body('currency')
  .isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'])
  .withMessage('Invalid currency code')
  .isLength({ min: 3, max: 3 })
  .withMessage('Currency code must be 3 characters');

export const paymentIdValidation = body('paymentId')
  .matches(/^PAY-\d{1,10}$/)
  .withMessage('Invalid payment ID format (PAY-XXXX)');

export const paymentActionValidation = body('action')
  .isIn(['approve', 'reject', 'verify'])
  .withMessage('Action must be approve, reject, or verify');

// Password strength checker
export const checkPasswordStrength = (password) => {
  const errors = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Email format validator
export const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// Phone number sanitizer
export const sanitizePhoneNumber = (phone) => {
  if (!phone) return null;
  return phone.replace(/[\s\-\(\)]/g, '');
};

// Input sanitization function
export const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }
  return input;
};

// Deep sanitize object
export const sanitizeObject = (obj) => {
  for (let key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = sanitizeInput(obj[key]);
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
};
