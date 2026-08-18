import express from 'express';
import { body, validationResult } from 'express-validator';
import {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
  changePassword
} from '../controllers/authController.js';
import { authenticateToken } from '../service/authService.js';
import {
  emailValidation,
  passwordValidation,
  nameValidation,
  phoneValidation,
  tokenValidation,
  currentPasswordValidation
} from '../utils/validation.js';
import { checkBruteForce, loginBruteLimiter, passwordResetLimiter } from '../middleware/security.js';
import { validateFormFields } from '../middleware/xss-protection.js';

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

// Auth routes
// Customer registration enabled (employees remain pre-configured via role control)
router.post('/register', [
  validateFormFields,
  emailValidation,
  passwordValidation,
  nameValidation('firstName'),
  nameValidation('lastName'),
  phoneValidation
], validateRequest, register);

router.post('/login', [
  checkBruteForce(loginBruteLimiter),
  emailValidation,
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 1, max: 128 })
    .withMessage('Password length is invalid')
], validateRequest, login);

router.post('/logout', authenticateToken, logout);

router.get('/profile', authenticateToken, getProfile);

router.put('/profile', [
  authenticateToken,
  validateFormFields,
  nameValidation('firstName'),
  nameValidation('lastName'),
  phoneValidation
], validateRequest, updateProfile);

router.post('/forgot-password', [
  checkBruteForce(passwordResetLimiter),
  emailValidation
], validateRequest, forgotPassword);

router.post('/reset-password', [
  tokenValidation,
  passwordValidation
], validateRequest, resetPassword);

router.post('/change-password', [
  authenticateToken,
  currentPasswordValidation,
  passwordValidation
], validateRequest, changePassword);

export default router;
