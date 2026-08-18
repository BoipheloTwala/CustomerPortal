#!/usr/bin/env node

import { readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
  }

  async runTest(testFile) {
    try {
      console.log(`\n${colors.blue}Running tests in: ${testFile}${colors.reset}`);

      // Import the test module dynamically
      const testModule = await import(`./${testFile}`);
      const testFunctions = Object.keys(testModule).filter(key =>
        key.startsWith('test') &&
        (typeof testModule[key] === 'function' || testModule[key] instanceof Promise)
      );

      // Run each test function
      for (const testName of testFunctions) {
        try {
          const testFn = testModule[testName];
          if (typeof testFn === 'function') {
            await testFn();
          } else if (testFn instanceof Promise) {
            await testFn;
          }
          console.log(`  ${colors.green}✓${colors.reset} ${testName}`);
          this.passed++;
        } catch (error) {
          console.log(`  ${colors.red}✗${colors.reset} ${testName}: ${error.message}`);
          this.failed++;
        }
      }
    } catch (error) {
      console.log(`  ${colors.red}Error loading test file ${testFile}: ${error.message}${colors.reset}`);
      this.failed++;
    }
  }

  async runAllTests() {
    console.log(`${colors.cyan}🧪 Starting Backend Tests${colors.reset}`);
    console.log('='.repeat(50));

    // Find all test files
    const testFiles = this.findTestFiles('./unit');
    const integrationTestFiles = this.findTestFiles('./integration');

    // Run unit tests
    if (testFiles.length > 0) {
      console.log(`\n${colors.yellow}📁 Unit Tests${colors.reset}`);
      for (const file of testFiles) {
        await this.runTest(`unit/${file}`);
      }
    }

    // Run integration tests
    if (integrationTestFiles.length > 0) {
      console.log(`\n${colors.yellow}📁 Integration Tests${colors.reset}`);
      for (const file of integrationTestFiles) {
        await this.runTest(`integration/${file}`);
      }
    }

    // Print summary
    this.printSummary();
  }

  findTestFiles(dir) {
    try {
      return readdirSync(join(__dirname, dir))
        .filter(file => extname(file) === '.js' && file.endsWith('.test.js'));
    } catch {
      return [];
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log(`${colors.cyan}📊 Test Results${colors.reset}`);

    const total = this.passed + this.failed;

    if (this.failed === 0) {
      console.log(`${colors.green}🎉 All tests passed!${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ Some tests failed${colors.reset}`);
    }

    console.log(`Total: ${total}`);
    console.log(`${colors.green}Passed: ${this.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${this.failed}${colors.reset}`);

    if (total > 0) {
      const percentage = ((this.passed / total) * 100).toFixed(1);
      console.log(`Success Rate: ${percentage}%`);
    }
  }
}

// Simple test utilities
global.test = function(name, fn) {
  // Store test for later execution
  if (!global.__tests) global.__tests = [];
  global.__tests.push({ name, fn });
};

global.expect = function(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, but got ${actual}`);
      }
    },
    toBeDefined: () => {
      if (actual === undefined || actual === null) {
        throw new Error(`Expected value to be defined, but got ${actual}`);
      }
    },
    toContain: (expected) => {
      if (!actual || !actual.includes(expected)) {
        throw new Error(`Expected ${actual} to contain ${expected}`);
      }
    },
    toHaveLength: (expected) => {
      if (!actual || actual.length !== expected) {
        throw new Error(`Expected length ${expected}, but got ${actual ? actual.length : 'undefined'}`);
      }
    }
  };
};

// Run tests
const runner = new TestRunner();
runner.runAllTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
