@echo off
echo.
echo 🧪 Meeting Protocol System - Backend Tests
echo.

REM Check if .env.test exists
if not exist ".env.test" (
    echo ❌ Error: .env.test file not found!
    echo.
    echo Please create .env.test with your test configuration:
    echo 1. Copy .env to .env.test
    echo 2. Update PORT to 3002
    echo 3. Update JWT_SECRET to a test value
    echo.
    exit /b 1
)

REM Check for placeholder values
findstr "SUPABASE_URL=your_supabase_url_here" .env.test >nul
if %errorlevel% equ 0 (
    echo ⚠️  Warning: .env.test is missing Supabase configuration
    echo.
    echo Please update .env.test with your actual Supabase credentials:
    echo - SUPABASE_URL
    echo - SUPABASE_ANON_KEY  
    echo - SUPABASE_SERVICE_KEY
    echo.
    exit /b 1
)

REM Kill processes on ports
echo Checking for processes on test ports...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001"') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3002"') do taskkill /F /PID %%a 2>nul

REM Set test environment
set NODE_ENV=test

REM Run tests
echo Running tests...
echo.
npm test %*