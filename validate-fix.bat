@echo off
echo ========================================
echo  Validating API Client Fix
echo ========================================
echo.

echo [1/2] Checking Server TypeScript...
cd server
call npm run typecheck
if %errorlevel% neq 0 (
    echo ERROR: Server typecheck failed
    cd ..
    pause
    exit /b 1
)
cd ..
echo ✓ Server OK

echo.
echo [2/2] Checking Client TypeScript...
cd client
call npm run typecheck
if %errorlevel% neq 0 (
    echo ERROR: Client typecheck failed
    cd ..
    pause
    exit /b 1
)
cd ..
echo ✓ Client OK

echo.
echo ========================================
echo  ✓ All Validations Passed!
echo ========================================
echo.
echo The fix is complete. Run bootstrap.bat to start.
pause
