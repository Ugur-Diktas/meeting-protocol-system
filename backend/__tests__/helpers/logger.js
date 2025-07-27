const fs = require('fs');
const path = require('path');

class TestLogger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.logFile = path.join(this.logDir, `test-${new Date().toISOString().split('T')[0]}.log`);
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    
    // Initialize log file
    this.writeLog('=== Test Run Started ===', true);
    this.writeLog(`Time: ${new Date().toISOString()}`);
    this.writeLog(`Environment: ${process.env.NODE_ENV}`);
    this.writeLog(`Node Version: ${process.version}`);
    this.writeLog('========================\n');
  }

  writeLog(message, newSection = false) {
    const timestamp = new Date().toISOString();
    const logMessage = newSection ? message : `[${timestamp}] ${message}`;
    
    try {
      fs.appendFileSync(this.logFile, logMessage + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  log(level, message, data = null) {
    const logEntry = {
      level: level.toUpperCase(),
      message,
      ...(data && { data: JSON.stringify(data, null, 2) })
    };
    
    this.writeLog(`[${logEntry.level}] ${logEntry.message}`);
    if (data) {
      this.writeLog(`Data: ${logEntry.data}`);
    }
  }

  info(message, data) {
    this.log('info', message, data);
  }

  error(message, error) {
    this.log('error', message, {
      message: error.message,
      stack: error.stack,
      ...(error.response && { response: error.response.data })
    });
  }

  warn(message, data) {
    this.log('warn', message, data);
  }

  debug(message, data) {
    if (process.env.DEBUG === 'true') {
      this.log('debug', message, data);
    }
  }

  testStart(testName) {
    this.writeLog(`\n--- Test: ${testName} ---`);
  }

  testEnd(testName, passed, duration) {
    this.writeLog(`Test ${passed ? 'PASSED' : 'FAILED'}: ${testName} (${duration}ms)`);
  }

  suiteStart(suiteName) {
    this.writeLog(`\n=== Suite: ${suiteName} ===`, true);
  }

  suiteEnd(suiteName, passed, failed, duration) {
    this.writeLog(`\nSuite Summary: ${suiteName}`);
    this.writeLog(`Passed: ${passed}, Failed: ${failed}`);
    this.writeLog(`Duration: ${duration}ms`);
    this.writeLog('===========================\n');
  }

  apiCall(method, url, data, response) {
    this.writeLog(`\nAPI Call: ${method} ${url}`);
    if (data) {
      this.writeLog(`Request Body: ${JSON.stringify(data, null, 2)}`);
    }
    if (response) {
      this.writeLog(`Response Status: ${response.status}`);
      this.writeLog(`Response Body: ${JSON.stringify(response.body, null, 2)}`);
    }
  }

  close() {
    this.writeLog('\n=== Test Run Completed ===');
    this.writeLog(`Time: ${new Date().toISOString()}`);
    this.writeLog('==========================\n');
  }
}

// Create singleton instance
const logger = new TestLogger();

// Jest hooks for automatic logging
if (global.beforeEach) {
  global.beforeEach(() => {
    if (global.jasmine) {
      const testName = global.jasmine.currentTest?.fullName;
      if (testName) {
        logger.testStart(testName);
      }
    }
  });
}

if (global.afterEach) {
  global.afterEach(() => {
    if (global.jasmine) {
      const testName = global.jasmine.currentTest?.fullName;
      const passed = global.jasmine.currentTest?.failedExpectations.length === 0;
      if (testName) {
        logger.testEnd(testName, passed, 0);
      }
    }
  });
}

module.exports = logger;