//CODE ATTRIBUTION
//01
//Express.js Routing
//Adapted from: OpenJS Foundation. (2025). Express Router. [online] Express.js Documentation.
//Available at: https://expressjs.com/en/guide/routing.html
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//02
//OWASP Authorization Best Practices
//Adapted from: OWASP. (2025). Authorization Cheat Sheet. [online] OWASP Cheat Sheet Series.
//Available at: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
//Date Accessed: 10 October 2025

import express from 'express';
import { body, param, validationResult } from 'express-validator';
import {
  getAllUsers,
  getUserById,
  updateUserStatus,
  getUserStats,
  getRecentActivity,
  getAllPayments,
  processPayment,
  getPaymentStats,
  requireAdmin
} from '../controllers/employeeController.js';
import { authenticateToken } from '../service/authService.js';
import {
  validateFormFields
} from '../middleware/xss-protection.js';
import {
  paymentIdValidation,
  paymentActionValidation
} from '../utils/validation.js';

const router = express.Router();

// All employee routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// User Management Routes
router.get('/users', getAllUsers);

router.get('/users/stats', getUserStats);

router.get('/users/recent-activity', getRecentActivity);

router.get('/users/:id', [
  param('id').isMongoId().withMessage('Invalid user ID')
], validateRequest, getUserById);

router.put('/users/:id/status', [
  validateFormFields,
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('isActive').isBoolean().withMessage('isActive must be a boolean')
], validateRequest, updateUserStatus);

// International Payment Routes
router.get('/payments', getAllPayments);

router.get('/payments/stats', getPaymentStats);

router.post('/payments/process', [
  validateFormFields,
  paymentIdValidation,
  paymentActionValidation,
  body('swiftCode')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value, { req }) => {
      // If action is 'verify', swiftCode is required
      if (req.body.action === 'verify') {
        if (!value || value.trim() === '') {
          throw new Error('SWIFT code is required for verification');
        }
        const swiftRegex = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
        if (!swiftRegex.test(value.toUpperCase())) {
          throw new Error('Invalid SWIFT code format');
        }
      }
      // If swiftCode is provided (even for other actions), validate format
      if (value && value.trim() !== '') {
        const swiftRegex = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
        if (!swiftRegex.test(value.toUpperCase())) {
          throw new Error('Invalid SWIFT code format');
        }
      }
      return true;
    })
], validateRequest, processPayment);

export default router;

