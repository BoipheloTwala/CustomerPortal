#!/usr/bin/env node

/**
 * Frontend Tests
 * Simple test framework matching the backend test style
 */

import { writeFileSync } from 'fs';
import {
  escapeHTML,
  sanitizeText,
  validateUserInput,
  validateURL,
  sanitizeURL,
  safeJSONParse,
  createCSPNonce,
  safeLocalStorage,
  safeSessionStorage
} from '../src/utils/xss-protection.js';

import {
  initializeSecurityToken,
  updateSecurityToken,
  addSecurityHeaders
} from '../src/utils/anti-mitm.js';

// Mock localStorage and sessionStorage for Node.js environment
const createStorageMock = () => {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(key => delete store[key]); }
  };
};

// Set up global storage mocks
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = createStorageMock();
}
if (typeof globalThis.sessionStorage === 'undefined') {
  (globalThis as any).sessionStorage = createStorageMock();
}

// Mock crypto for CSP nonce generation
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }
  };
}

// Mock Headers API for Node.js environment
if (typeof globalThis.Headers === 'undefined') {
  class HeadersMock {
    private map: Map<string, string> = new Map();
    
    set(name: string, value: string) {
      this.map.set(name.toLowerCase(), value);
    }
    
    get(name: string): string | null {
      return this.map.get(name.toLowerCase()) || null;
    }
    
    has(name: string): boolean {
      return this.map.has(name.toLowerCase());
    }
  }
  (globalThis as any).Headers = HeadersMock;
}

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`${colors.green}✓${colors.reset} ${name}`);
    passed++;
  } catch (error: any) {
    console.log(`${colors.red}✗${colors.reset} ${name}: ${error.message}`);
    failed++;
  }
}

console.log(`${colors.cyan}🧪 Running Frontend Tests${colors.reset}`);
console.log('='.repeat(50));

// XSS Protection Tests
console.log(`\n${colors.blue}XSS Protection Utils Tests${colors.reset}`);

test('escapeHTML - should escape HTML entities', () => {
  const result = escapeHTML('<script>alert("xss")</script>');
  if (!result.includes('&lt;') || !result.includes('&gt;')) {
    throw new Error('HTML entities not escaped');
  }
  if (result.includes('<script>')) {
    throw new Error('Script tags not escaped');
  }
});

test('escapeHTML - should handle ampersands', () => {
  const result = escapeHTML('A & B');
  if (result !== 'A &amp; B') {
    throw new Error(`Expected 'A &amp; B', got '${result}'`);
  }
});

test('sanitizeText - should remove script tags', () => {
  const result = sanitizeText('<script>alert("xss")</script>Hello World');
  if (result.includes('<script>')) {
    throw new Error('Script tags not removed');
  }
  if (!result.includes('Hello World')) {
    throw new Error('Valid content removed');
  }
});

test('sanitizeText - should remove iframe tags', () => {
  const result = sanitizeText('<iframe src="evil.com"></iframe>Content');
  if (result.includes('<iframe>')) {
    throw new Error('Iframe tags not removed');
  }
  if (!result.includes('Content')) {
    throw new Error('Valid content removed');
  }
});

test('sanitizeText - should remove event handlers', () => {
  const result = sanitizeText('<div onclick="alert(1)">Content</div>');
  if (result.includes('onclick')) {
    throw new Error('Event handlers not removed');
  }
});

test('sanitizeText - should remove javascript: protocols', () => {
  const result = sanitizeText('<a href="javascript:alert(1)">Link</a>');
  if (result.includes('javascript:')) {
    throw new Error('javascript: protocol not removed');
  }
});

test('validateUserInput - should accept valid input', () => {
  const result = validateUserInput('Valid user input text');
  if (result !== 'Valid user input text') {
    throw new Error('Valid input rejected');
  }
});

test('validateUserInput - should reject input with script tags', () => {
  try {
    validateUserInput('<script>alert("xss")</script>');
    throw new Error('Malicious input accepted');
  } catch (error: any) {
    if (!error.message.includes('potentially malicious')) {
      throw new Error('Wrong error message');
    }
  }
});

test('validateUserInput - should reject input exceeding max length', () => {
  const longInput = 'a'.repeat(1001);
  try {
    validateUserInput(longInput, 1000);
    throw new Error('Input exceeding max length accepted');
  } catch (error: any) {
    if (!error.message.includes('too long')) {
      throw new Error('Wrong error message');
    }
  }
});

test('validateURL - should accept valid HTTP URLs', () => {
  if (!validateURL('http://example.com')) {
    throw new Error('Valid HTTP URL rejected');
  }
  if (!validateURL('https://example.com')) {
    throw new Error('Valid HTTPS URL rejected');
  }
});

test('validateURL - should reject javascript: protocol', () => {
  if (validateURL('javascript:alert(1)')) {
    throw new Error('Dangerous javascript: protocol accepted');
  }
});

test('validateURL - should reject data: protocol', () => {
  if (validateURL('data:text/html,<script>alert(1)</script>')) {
    throw new Error('Dangerous data: protocol accepted');
  }
});

test('sanitizeURL - should sanitize dangerous URLs', () => {
  const result = sanitizeURL('javascript:alert(1)');
  if (result !== '#') {
    throw new Error(`Expected '#', got '${result}'`);
  }
});

test('sanitizeURL - should preserve safe URLs', () => {
  const url = 'https://example.com';
  const result = sanitizeURL(url);
  if (result !== url) {
    throw new Error(`Expected '${url}', got '${result}'`);
  }
});

test('safeJSONParse - should parse valid JSON', () => {
  const jsonString = '{"name":"test","value":123}';
  const result = safeJSONParse(jsonString);
  if (!result || result.name !== 'test' || result.value !== 123) {
    throw new Error('JSON not parsed correctly');
  }
});

test('safeJSONParse - should sanitize parsed JSON', () => {
  const jsonString = '{"name":"<script>alert(1)</script>","value":"test"}';
  const result = safeJSONParse(jsonString);
  if (!result || result.name.includes('<script>')) {
    throw new Error('JSON content not sanitized');
  }
});

test('createCSPNonce - should generate nonce string', () => {
  const nonce = createCSPNonce();
  if (typeof nonce !== 'string' || nonce.length === 0) {
    throw new Error('Nonce not generated');
  }
});

test('safeLocalStorage - should set and get items', () => {
  safeLocalStorage.setItem('testKey', 'testValue');
  const value = safeLocalStorage.getItem('testKey');
  if (value !== 'testValue') {
    throw new Error(`Expected 'testValue', got '${value}'`);
  }
});

test('safeLocalStorage - should sanitize stored values', () => {
  safeLocalStorage.setItem('testKey', '<script>alert(1)</script>');
  const value = safeLocalStorage.getItem('testKey');
  if (value && value.includes('<script>')) {
    throw new Error('Stored value not sanitized');
  }
});

test('safeSessionStorage - should set and get items', () => {
  safeSessionStorage.setItem('testKey', 'testValue');
  const value = safeSessionStorage.getItem('testKey');
  if (value !== 'testValue') {
    throw new Error(`Expected 'testValue', got '${value}'`);
  }
});

test('safeSessionStorage - should sanitize stored values', () => {
  safeSessionStorage.setItem('testKey', '<script>alert(1)</script>');
  const value = safeSessionStorage.getItem('testKey');
  if (value && value.includes('<script>')) {
    throw new Error('Stored value not sanitized');
  }
});

// Anti-MITM Tests
console.log(`\n${colors.blue}Anti-MITM Utils Tests${colors.reset}`);

test('initializeSecurityToken - should initialize token from parameter', () => {
  initializeSecurityToken('test-token-123');
  const headers = addSecurityHeaders();
  if (headers['X-Security-Token'] !== 'test-token-123') {
    throw new Error('Token not initialized correctly');
  }
});

test('initializeSecurityToken - should load token from localStorage', () => {
  localStorage.setItem('securityToken', 'stored-token-456');
  initializeSecurityToken(null);
  const headers = addSecurityHeaders();
  if (headers['X-Security-Token'] !== 'stored-token-456') {
    throw new Error('Token not loaded from localStorage');
  }
});

test('updateSecurityToken - should update token from headers', () => {
  const mockHeaders = new (globalThis as any).Headers();
  mockHeaders.set('X-Security-Token', 'new-token-789');
  updateSecurityToken(mockHeaders as any);
  const stored = localStorage.getItem('securityToken');
  if (stored !== 'new-token-789') {
    throw new Error('Token not updated in localStorage');
  }
});

test('addSecurityHeaders - should add token to headers object', () => {
  initializeSecurityToken('header-test-token');
  const headers = addSecurityHeaders({ 'Content-Type': 'application/json' });
  if (headers['X-Security-Token'] !== 'header-test-token') {
    throw new Error('Token not added to headers');
  }
  if (headers['Content-Type'] !== 'application/json') {
    throw new Error('Existing headers not preserved');
  }
});

test('addSecurityHeaders - should work without existing headers', () => {
  initializeSecurityToken('no-headers-token');
  const headers = addSecurityHeaders();
  if (headers['X-Security-Token'] !== 'no-headers-token') {
    throw new Error('Token not added to empty headers');
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`${colors.cyan}📊 Test Results${colors.reset}`);
console.log(`Total: ${passed + failed}`);
console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
console.log(`${colors.red}Failed: ${failed}${colors.reset}`);

// Save results to file for CI/CD
const results = {
  timestamp: new Date().toISOString(),
  summary: {
    total: passed + failed,
    passed: passed,
    failed: failed,
    success: failed === 0
  },
  tests: []
};

try {
  writeFileSync('test-results.json', JSON.stringify(results, null, 2));
  console.log(`${colors.blue}📄 Results saved to test-results.json${colors.reset}`);
} catch (error: any) {
  console.log(`${colors.yellow}⚠️  Could not save test results: ${error.message}${colors.reset}`);
}

if (failed === 0) {
  console.log(`${colors.green}🎉 All tests passed!${colors.reset}`);
  process.exit(0);
} else {
  console.log(`${colors.red}❌ Some tests failed${colors.reset}`);
  process.exit(1);
}

