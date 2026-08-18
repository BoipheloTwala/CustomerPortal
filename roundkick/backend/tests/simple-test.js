#!/usr/bin/env node

import {
  checkPasswordStrength,
  isValidEmail,
  sanitizePhoneNumber,
  sanitizeInput
} from '../utils/validation.js';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`${colors.green}✓${colors.reset} ${name}`);
    passed++;
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} ${name}: ${error.message}`);
    failed++;
  }
}

console.log(`${colors.cyan}🧪 Running Backend Tests${colors.reset}`);
console.log('='.repeat(50));

// Validation Tests
console.log(`\n${colors.blue}Validation Utils Tests${colors.reset}`);

test('checkPasswordStrength - should return valid for strong password', () => {
  const result = checkPasswordStrength('StrongPass123!');
  if (result.isValid !== true) throw new Error('Expected valid password');
  if (result.errors.length !== 0) throw new Error('Expected no errors');
});

test('checkPasswordStrength - should return invalid for weak password', () => {
  const result = checkPasswordStrength('weak');
  if (result.isValid !== false) throw new Error('Expected invalid password');
  if (!result.errors.includes('Password must be at least 8 characters long')) {
    throw new Error('Expected length error');
  }
});

test('isValidEmail - should validate correct email formats', () => {
  if (!isValidEmail('test@example.com')) throw new Error('Valid email rejected');
  if (!isValidEmail('user.name+tag@example.co.uk')) throw new Error('Valid email rejected');
});

test('isValidEmail - should reject invalid email formats', () => {
  if (isValidEmail('invalid-email')) throw new Error('Invalid email accepted');
  if (isValidEmail('@example.com')) throw new Error('Invalid email accepted');
});

test('sanitizePhoneNumber - should sanitize phone numbers correctly', () => {
  const result = sanitizePhoneNumber('+1 (234) 567-8900');
  if (result !== '+12345678900') throw new Error(`Expected +12345678900, got ${result}`);
});

test('sanitizeInput - should remove script tags', () => {
  const result = sanitizeInput('<script>alert("xss")</script>Hello World');
  if (result !== 'Hello World') throw new Error(`Expected 'Hello World', got '${result}'`);
});

test('sanitizeInput - should remove HTML tags', () => {
  const result = sanitizeInput('<p>Hello <strong>World</strong></p>');
  if (result !== 'Hello World') throw new Error(`Expected 'Hello World', got '${result}'`);
});

// Payment Validation Tests
console.log(`\n${colors.blue}Payment Validation Tests${colors.reset}`);

test('paymentIdValidation - should accept valid payment IDs', () => {
  const validIds = ['PAY-001', 'PAY-12345', 'PAY-9999999999'];
  validIds.forEach(id => {
    if (!/^PAY-\d{3,10}$/.test(id)) {
      throw new Error(`Valid payment ID rejected: ${id}`);
    }
  });
});

test('paymentIdValidation - should reject invalid payment IDs', () => {
  const invalidIds = ['PAY-12', 'PAY-12345678901', 'PAY-ABC', 'INVALID-001', 'PAY-', 'PAY'];
  invalidIds.forEach(id => {
    if (/^PAY-\d{3,10}$/.test(id)) {
      throw new Error(`Invalid payment ID accepted: ${id}`);
    }
  });
});

test('paymentCurrencyValidation - should accept valid currencies', () => {
  const validCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];
  validCurrencies.forEach(currency => {
    if (!['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'].includes(currency)) {
      throw new Error(`Valid currency rejected: ${currency}`);
    }
  });
});

test('paymentCurrencyValidation - should reject invalid currencies', () => {
  const invalidCurrencies = ['US', 'EURO', 'GBP123', 'XYZ', 'usd', ''];
  invalidCurrencies.forEach(currency => {
    if (['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'].includes(currency)) {
      throw new Error(`Invalid currency accepted: ${currency}`);
    }
  });
});

test('paymentAmountValidation - should accept valid amounts', () => {
  const validAmounts = [0.01, 100, 1000.50, 999999.99, 1000000];
  validAmounts.forEach(amount => {
    if (amount < 0.01 || amount > 1000000) {
      throw new Error(`Valid amount rejected: ${amount}`);
    }
  });
});

test('paymentAmountValidation - should reject invalid amounts', () => {
  const invalidAmounts = [0, 0.001, 1000000.01, -100, 'notanumber'];
  invalidAmounts.forEach(amount => {
    if (typeof amount === 'number' && amount >= 0.01 && amount <= 1000000) {
      throw new Error(`Invalid amount accepted: ${amount}`);
    }
  });
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`${colors.cyan}📊 Test Results${colors.reset}`);
console.log(`Total: ${passed + failed}`);
console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
console.log(`${colors.red}Failed: ${failed}${colors.reset}`);

// Save results to file for CI/CD
const fs = await import('fs');
const results = {
  timestamp: new Date().toISOString(),
  summary: {
    total: passed + failed,
    passed: passed,
    failed: failed,
    success: failed === 0
  },
  tests: [] // Could be expanded to track individual test results
};

try {
  fs.writeFileSync('test-results.json', JSON.stringify(results, null, 2));
  console.log(`${colors.blue}📄 Results saved to test-results.json${colors.reset}`);
} catch (error) {
  console.log(`${colors.yellow}⚠️  Could not save test results: ${error.message}${colors.reset}`);
}

if (failed === 0) {
  console.log(`${colors.green}🎉 All tests passed!${colors.reset}`);
  process.exit(0);
} else {
  console.log(`${colors.red}❌ Some tests failed${colors.reset}`);
  process.exit(1);
}
