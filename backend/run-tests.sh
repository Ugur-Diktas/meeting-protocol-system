#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🧪 Meeting Protocol System - Backend Tests${NC}"
echo ""

# Check if .env.test exists
if [ ! -f ".env.test" ]; then
    echo -e "${RED}❌ Error: .env.test file not found!${NC}"
    echo ""
    echo "Please create .env.test with your test configuration:"
    echo "1. Copy .env to .env.test"
    echo "2. Update PORT to 3002"
    echo "3. Update JWT_SECRET to a test value"
    echo ""
    exit 1
fi

# Check if .env.test has required variables
if ! grep -q "SUPABASE_URL=" .env.test || [ $(grep "SUPABASE_URL=your_supabase_url_here" .env.test | wc -l) -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Warning: .env.test is missing Supabase configuration${NC}"
    echo ""
    echo "Please update .env.test with your actual Supabase credentials:"
    echo "- SUPABASE_URL"
    echo "- SUPABASE_ANON_KEY"
    echo "- SUPABASE_SERVICE_KEY"
    echo ""
    exit 1
fi

# Kill any process on port 3001 or 3002
echo "Checking for processes on test ports..."
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:3002 | xargs kill -9 2>/dev/null

# Set test environment
export NODE_ENV=test

# Run tests
echo -e "${GREEN}Running tests...${NC}"
echo ""

npm test "$@"