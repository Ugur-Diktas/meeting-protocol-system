#!/usr/bin/env node

/**
 * Test Runner Script
 * Helps run tests with proper setup and teardown
 */

const { spawn } = require('child_process');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runTests() {
  log('\n🧪 Meeting Protocol System - Backend Test Suite\n', 'bright');
  
  // Check environment
  const env = process.env.NODE_ENV;
  if (env !== 'test') {
    log('⚠️  Setting NODE_ENV=test', 'yellow');
    process.env.NODE_ENV = 'test';
  }

  // Get test target from command line
  const args = process.argv.slice(2);
  const testTarget = args[0];

  let command = 'jest';
  let jestArgs = ['--runInBand', '--detectOpenHandles'];

  if (testTarget) {
    switch (testTarget) {
      case 'auth':
        jestArgs.push('__tests__/auth.test.js');
        log('🔐 Running Authentication Tests...', 'blue');
        break;
      case 'groups':
        jestArgs.push('__tests__/groups.test.js');
        log('👥 Running Group Management Tests...', 'blue');
        break;
      case 'protocols':
        jestArgs.push('__tests__/protocols.test.js');
        log('📋 Running Protocol Management Tests...', 'blue');
        break;
      case 'tasks':
        jestArgs.push('__tests__/tasks.test.js');
        log('✅ Running Task Management Tests...', 'blue');
        break;
      case 'templates':
        jestArgs.push('__tests__/templates.test.js');
        log('📝 Running Template Tests...', 'blue');
        break;
      case 'socketio':
        jestArgs.push('__tests__/socketio.test.js');
        log('🔌 Running Socket.io Tests...', 'blue');
        break;
      case 'middleware':
        jestArgs.push('__tests__/middleware.test.js');
        log('🛡️  Running Middleware Tests...', 'blue');
        break;
      case 'coverage':
        jestArgs = ['--coverage', '--runInBand'];
        log('📊 Running Tests with Coverage...', 'blue');
        break;
      case 'watch':
        jestArgs = ['--watch'];
        log('👁️  Running Tests in Watch Mode...', 'blue');
        break;
      default:
        log(`❌ Unknown test target: ${testTarget}`, 'red');
        printUsage();
        process.exit(1);
    }
  } else {
    log('🚀 Running All Tests...', 'blue');
  }

  // Run Jest
  const jest = spawn('npx', [command, ...jestArgs], {
    stdio: 'inherit',
    env: { ...process.env }
  });

  jest.on('close', (code) => {
    if (code === 0) {
      log('\n✅ All tests passed!', 'green');
    } else {
      log('\n❌ Some tests failed.', 'red');
    }
    process.exit(code);
  });

  jest.on('error', (err) => {
    log(`\n❌ Failed to start test runner: ${err.message}`, 'red');
    process.exit(1);
  });
}

function printUsage() {
  log('\nUsage: npm run test [target]', 'bright');
  log('\nAvailable targets:');
  log('  auth       - Run authentication tests');
  log('  groups     - Run group management tests');
  log('  protocols  - Run protocol tests');
  log('  tasks      - Run task management tests');
  log('  templates  - Run template tests');
  log('  socketio   - Run Socket.io tests');
  log('  middleware - Run middleware and edge case tests');
  log('  coverage   - Run all tests with coverage report');
  log('  watch      - Run tests in watch mode');
  log('\nExample: npm run test auth');
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  log('\n\n🛑 Test run interrupted.', 'yellow');
  process.exit(0);
});

// Run tests
runTests().catch(err => {
  log(`\n❌ Test runner error: ${err.message}`, 'red');
  process.exit(1);
});