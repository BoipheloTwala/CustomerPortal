import express from 'express';
import { body, validationResult } from 'express-validator';
import { createPayment } from '../controllers/paymentController.js';
import { authenticateToken } from '../service/authService.js';
import {
  paymentAmountValidation,
  paymentCurrencyValidation
} from '../utils/validation.js';

const router = express.Router();

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

// Create payment (customer only)
router.post('/create', [
  authenticateToken,
  paymentAmountValidation,
  paymentCurrencyValidation,
  body('recipient')
    .trim()
    .notEmpty()
    .withMessage('Recipient is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Recipient must be between 2 and 200 characters'),
  body('paymentProvider')
    .isIn(['Visa', 'Mastercard', 'Amex', 'Discover'])
    .withMessage('Invalid payment provider')
], validateRequest, createPayment);

export default router;

