#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default to running all tests
TEST_TARGET="$1"

echo -e "${BLUE}🧪 Meeting Protocol System - Test Runner${NC}"
echo ""

# Check environment file
if [ ! -f ".env.test" ]; then
    echo -e "${RED}❌ Error: .env.test file not found!${NC}"
    echo -e "${YELLOW}Creating .env.test from .env...${NC}"
    
    if [ -f ".env" ]; then
        cp .env .env.test
        sed -i.bak 's/PORT=.*/PORT=3002/' .env.test
        rm .env.test.bak
        echo -e "${GREEN}✅ Created .env.test${NC}"
    else
        echo -e "${RED}❌ No .env file found to copy${NC}"
        exit 1
    fi
fi

# Kill any processes on test ports
echo "Cleaning up test ports..."
lsof -ti:3001,3002 2>/dev/null | xargs kill -9 2>/dev/null || true

# Set test environment
export NODE_ENV=test

# Clear previous test logs
rm -rf __tests__/logs 2>/dev/null || true

# Function to run tests
run_tests() {
    if [ -z "$TEST_TARGET" ]; then
        echo -e "${GREEN}Running all tests...${NC}"
        npm test
    elif [ "$TEST_TARGET" == "watch" ]; then
        echo -e "${GREEN}Running tests in watch mode...${NC}"
        npm run test:watch
    elif [ "$TEST_TARGET" == "coverage" ]; then
        echo -e "${GREEN}Running tests with coverage...${NC}"
        npm run test:coverage
    else
        # Run specific test file
        if [[ "$TEST_TARGET" == *.js ]]; then
            TEST_FILE="$TEST_TARGET"
        else
            TEST_FILE="__tests__/${TEST_TARGET}.test.js"
        fi
        
        if [ -f "$TEST_FILE" ]; then
            echo -e "${GREEN}Running test: $TEST_FILE${NC}"
            npx jest "$TEST_FILE" --runInBand
        else
            echo -e "${RED}❌ Test file not found: $TEST_FILE${NC}"
            echo ""
            echo "Available test files:"
            find __tests__ -name "*.test.js" -type f | sed 's/__tests__\//  - /' | sed 's/\.test\.js//'
            exit 1
        fi
    fi
}

# Run the tests
run_tests

# Cleanup
echo ""
echo -e "${BLUE}Test run completed${NC}"