#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function setupTestEnvironment() {
  log('\n🔧 Test Environment Setup\n', 'bright');

  const envPath = path.join(__dirname, '.env');
  const envTestPath = path.join(__dirname, '.env.test');

  // Check if .env exists
  if (!fs.existsSync(envPath)) {
    log('❌ .env file not found!', 'red');
    log('Please create your main .env file first.\n');
    process.exit(1);
  }

  // Check if .env.test already exists
  if (fs.existsSync(envTestPath)) {
    const overwrite = await question(
      `${colors.yellow}.env.test already exists. Overwrite? (y/N): ${colors.reset}`
    );
    if (overwrite.toLowerCase() !== 'y') {
      log('Setup cancelled.', 'yellow');
      process.exit(0);
    }
  }

  // Read .env file
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  const envVars = {};

  // Parse env variables
  envLines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  log('\nCopying environment variables from .env...', 'blue');

  // Create test environment content
  let testEnvContent = `# Test Environment Configuration
# Generated on ${new Date().toISOString()}

# Server - Use different port for tests
NODE_ENV=test
PORT=3002

# Database - Using same Supabase instance (be careful with test data!)
SUPABASE_URL=${envVars.SUPABASE_URL || 'your_supabase_url_here'}
SUPABASE_ANON_KEY=${envVars.SUPABASE_ANON_KEY || 'your_supabase_anon_key_here'}
SUPABASE_SERVICE_KEY=${envVars.SUPABASE_SERVICE_KEY || 'your_supabase_service_key_here'}

# JWT - Test-specific secret
JWT_SECRET=test-jwt-secret-${Math.random().toString(36).substring(7)}
JWT_EXPIRES_IN=${envVars.JWT_EXPIRES_IN || '1d'}

# Frontend URL
FRONTEND_URL=${envVars.FRONTEND_URL || 'http://localhost:5173'}

# Test specific settings
TEST_TIMEOUT=30000
FORCE_COLOR=1
DEBUG=false
`;

  // Write .env.test
  fs.writeFileSync(envTestPath, testEnvContent);
  log('✅ Created .env.test file', 'green');

  // Check if we have valid Supabase credentials
  if (!envVars.SUPABASE_URL || envVars.SUPABASE_URL === 'your_supabase_url_here') {
    log('\n⚠️  Warning: Supabase credentials not found!', 'yellow');
    log('Please update .env.test with your actual Supabase credentials.\n');
  } else {
    log('✅ Supabase credentials copied', 'green');
  }

  // Create logs directory
  const logsDir = path.join(__dirname, '__tests__', 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    log('✅ Created logs directory', 'green');
  }

  log('\n📝 Next steps:', 'bright');
  log('1. Review .env.test and ensure all values are correct');
  log('2. Make sure your dev server is stopped (port 3001)');
  log('3. Run tests with: npm test');
  log('\n💡 Tips:', 'bright');
  log('- Tests will create data with "test" in names/emails');
  log('- Test data is cleaned up automatically');
  log('- Check __tests__/logs/ for detailed test logs\n');

  rl.close();
}

// Run setup
setupTestEnvironment().catch(error => {
  log(`\n❌ Setup failed: ${error.message}`, 'red');
  process.exit(1);
});