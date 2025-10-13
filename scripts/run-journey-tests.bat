@echo off
echo ===============================================
echo 🧪 vLLM-Doctrine Journey Test Runner
echo ===============================================
echo.

REM Check if we're in the right directory
if not exist "initial-bootstrap.sh" (
    echo ❌ Not in vLLM-Doctrine directory
    echo Please run from the repository root containing initial-bootstrap.sh
    pause
    exit /b 1
)

echo 🔍 Checking prerequisites...
echo.

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found
    echo Please install Node.js from: https://nodejs.org/
    echo Or run: .\install-test-dependencies.bat
    pause
    exit /b 1
)

echo ✅ Node.js found: 
node --version

REM Check npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm not found
    pause
    exit /b 1
)

echo ✅ npm found:
npm --version
echo.

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing test dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ npm install failed
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed
    echo.
)

REM Install Playwright browsers if needed
if not exist "node_modules\.playwright" (
    echo 🎭 Installing Playwright browsers...
    npx playwright install chromium
    if %errorlevel% neq 0 (
        echo ❌ Playwright install failed
        pause
        exit /b 1
    )
    echo ✅ Playwright browsers installed
    echo.
)

echo 🚀 Running vLLM-Doctrine Journey Tests...
echo.

REM Parse command line arguments
set TEST_SUITE=all
set HEADED_MODE=false

:parse_args
if "%1"=="" goto run_tests
if "%1"=="--journey" set TEST_SUITE=journey
if "%1"=="--rider" set TEST_SUITE=rider
if "%1"=="--headed" set HEADED_MODE=true
shift
goto parse_args

:run_tests
echo 🎯 Test Suite: %TEST_SUITE%
echo 👁️ Headed Mode: %HEADED_MODE%
echo.

if "%TEST_SUITE%"=="journey" (
    if "%HEADED_MODE%"=="true" (
        npx playwright test tests/e2e/new-user-journey.spec.ts --headed --reporter=line
    ) else (
        npx playwright test tests/e2e/new-user-journey.spec.ts --reporter=line
    )
) else if "%TEST_SUITE%"=="rider" (
    if "%HEADED_MODE%"=="true" (
        npx playwright test tests/e2e/rider-integration.spec.ts --headed --reporter=line
    ) else (
        npx playwright test tests/e2e/rider-integration.spec.ts --reporter=line
    )
) else (
    if "%HEADED_MODE%"=="true" (
        npx playwright test --headed --reporter=line
    ) else (
        npx playwright test --reporter=line
    )
)

set TEST_EXIT_CODE=%errorlevel%

echo.
echo ===============================================
if %TEST_EXIT_CODE% equ 0 (
    echo ✅ All tests passed!
) else (
    echo ❌ Some tests failed - check output above
)

echo.
echo 📊 View detailed test report:
echo    npx playwright show-report
echo.
echo 💡 Usage options:
echo    .\run-journey-tests.bat           - Run all tests
echo    .\run-journey-tests.bat --journey - Run new user journey tests only
echo    .\run-journey-tests.bat --rider   - Run Rider integration tests only  
echo    .\run-journey-tests.bat --headed  - Run with visible browser
echo ===============================================
echo.

pause
exit /b %TEST_EXIT_CODE%